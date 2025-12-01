// ============================================================================
// OMNILY PRO - AI REWARDS GENERATOR
// Powered by Anthropic Claude
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessContext {
  organization: {
    name: string
    business_type?: string
    average_transaction?: number
  }
  loyalty_tiers: Array<{
    name: string
    min_points: number
    color?: string
  }>
  points_config: {
    name: string
    earn_rate: number
    currency: string
  }
  product_categories?: string[]
  customer_stats?: {
    total: number
    average_points: number
    top_spender_avg: number
  }
}

interface GeneratedReward {
  name: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: string | number
  points_required: number
  required_tier?: string
  description: string
  emoji?: string
  imageSearchQuery?: string  // Query ottimizzata per ricerca immagine su Unsplash
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { businessContext, organizationId, customInstructions, rewardsCount = 8 } = await req.json() as {
      businessContext: BusinessContext
      organizationId: string
      customInstructions?: string
      rewardsCount?: number
    }

    console.log('📥 Request received:', { organizationId, hasCustomInstructions: !!customInstructions, rewardsCount })

    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    // Create Supabase client
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://sjvatdnvewohvswfrdiv.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get Anthropic API key from database
    const { data: keyData, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('key_value, is_active')
      .eq('key_name', 'ANTHROPIC_API_KEY')
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      throw new Error('ANTHROPIC_API_KEY non configurata. Vai su Control Center > AI Rewards per configurarla')
    }

    // Decrypt the API key (simple base64 decoding)
    const ANTHROPIC_API_KEY = atob(keyData.key_value)

    // Check AI rewards limit for this organization
    const { data: limitCheck, error: limitError } = await supabaseClient
      .rpc('check_ai_rewards_limit', { org_id: organizationId })

    if (limitError) {
      console.error('Error checking AI limit:', limitError)
      throw new Error('Failed to check AI usage limits')
    }

    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: limitCheck.reason,
          upgradeRequired: limitCheck.upgradeRequired
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Build intelligent prompt for Claude
    const prompt = buildPrompt(businessContext, customInstructions, rewardsCount)
    console.log('🤖 Calling Claude API...')

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Anthropic API error:', error)
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    console.log('✅ Claude response received, tokens:', data.usage?.total_tokens)
    let claudeResponse = data.content[0].text

    // Clean up Claude's response - remove markdown code fences if present
    // Claude sometimes wraps JSON in ```json ... ```
    claudeResponse = claudeResponse.trim()
    if (claudeResponse.startsWith('```')) {
      // Remove opening ```json or ```
      claudeResponse = claudeResponse.replace(/^```(?:json)?\n?/, '')
      // Remove closing ```
      claudeResponse = claudeResponse.replace(/\n?```$/, '')
      claudeResponse = claudeResponse.trim()
    }

    console.log('🧹 Cleaned response (first 200 chars):', claudeResponse.substring(0, 200))

    // Parse Claude's JSON response with better error handling
    let rewardsData
    try {
      rewardsData = JSON.parse(claudeResponse)
    } catch (parseError: any) {
      console.error('❌ JSON Parse Error:', parseError.message)
      console.error('📄 Full response:', claudeResponse)
      throw new Error(`Errore parsing JSON: ${parseError.message}. Claude ha generato un JSON non valido. Prova con meno premi (10-15 invece di ${rewardsCount}).`)
    }

    // Track AI usage
    try {
      await supabaseClient
        .from('ai_rewards_usage')
        .insert({
          organization_id: organizationId,
          rewards_count: rewardsData.rewards?.length || 8,
          tokens_used: data.usage?.total_tokens || 0,
          metadata: {
            model: data.model,
            stop_reason: data.stop_reason
          }
        })
    } catch (trackingError) {
      console.error('Error tracking AI usage:', trackingError)
      // Don't fail the request if tracking fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        rewards: rewardsData.rewards,
        reasoning: rewardsData.reasoning,
        usageInfo: limitCheck.unlimited ? null : {
          used: (limitCheck.usage || 0) + 1,
          limit: limitCheck.limit,
          remaining: Math.max(0, (limitCheck.remaining || 0) - 1)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error generating AI rewards:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function buildPrompt(context: BusinessContext, customInstructions?: string, rewardsCount: number = 8): string {
  const { organization, loyalty_tiers, points_config, product_categories, customer_stats } = context

  // Detect business type from name if not provided
  const businessType = organization.business_type || detectBusinessType(organization.name)

  const tierNames = loyalty_tiers.map(t => t.name).join(', ')
  const tierList = loyalty_tiers.map(t => `- ${t.name}: da ${t.min_points} ${points_config.name}`).join('\n')

  const basePrompt = `Sei un esperto di loyalty marketing per "${organization.name}".

CONTESTO BUSINESS:
- Nome azienda: ${organization.name}
- Tipo attività: ${businessType}
- Livelli fedeltà: ${tierNames}
- Nome punti: ${points_config.name}
- Tasso guadagno: ${points_config.earn_rate} ${points_config.name} per ogni ${points_config.currency} speso
- Transazione media: €${organization.average_transaction || 25}
${product_categories ? `- Categorie prodotti: ${product_categories.join(', ')}` : ''}
${customer_stats ? `- Clienti attivi: ${customer_stats.total}` : ''}
${customer_stats ? `- Punti medi per cliente: ${customer_stats.average_points}` : ''}

LIVELLI DETTAGLIO:
${tierList}

OBIETTIVO:
Crea ${rewardsCount} rewards perfetti e personalizzati per questa attività che:

1. Rispettino i livelli fedeltà esistenti (distribuisci equamente tra tutti i tier forniti)
2. Usino punti proporzionati e realistici per ${businessType}
3. Siano specifici e attraenti per ${businessType}
4. Coprano una gamma di valori (da piccoli premi a grandi premi)
5. Usino nomi accattivanti in italiano
6. Abbiano descrizioni coinvolgenti che invogliano al riscatto
7. Assegna ogni premio a uno dei livelli forniti: ${tierNames}

REGOLE PUNTI:
Analizza i livelli forniti e distribuisci i premi in modo proporzionato:
- Per ogni livello, calcola punti appropriati basandoti sul min_points del livello
- Crea premi che siano raggiungibili ma sfidanti per ogni tier
- Assicurati che i premi di livello superiore richiedano più punti e abbiano maggior valore
${customInstructions ? `

🎯 ISTRUZIONI PERSONALIZZATE DEL CLIENTE:
${customInstructions}

Rispetta queste preferenze nella generazione dei premi, adattando i suggerimenti alle esigenze specifiche indicate.
` : ''}

PER OGNI PREMIO, GENERA ANCHE:
- imageSearchQuery: Una query ottimale in INGLESE per cercare la foto perfetta su Unsplash
  La query deve essere descrittiva, professionale, specifica e in INGLESE.

ESEMPI di imageSearchQuery corrette per ${businessType}:
${getImageQueryExamples(businessType)}

REGOLE per imageSearchQuery:
1. SEMPRE in INGLESE (mai italiano!)
2. Descrittiva e specifica (3-6 parole)
3. Include contesto del business (es. "restaurant", "cafe", "shop")
4. Evita parole generiche come solo "free" o "discount"
5. Pensa a cosa cercheresti su Google Images per trovare la foto perfetta

RISPONDI SOLO CON JSON valido in questo formato:
{
  "reasoning": "Breve spiegazione della strategia scelta (1-2 frasi)",
  "rewards": [
    {
      "name": "Nome Premio Accattivante",
      "type": "discount" | "freeProduct" | "cashback" | "giftCard",
      "value": "10" per discount/cashback (numero senza %), "" per freeProduct,
      "points_required": 100,
      "required_tier": "uno dei nomi tier forniti sopra",
      "description": "Descrizione coinvolgente che invoglia al riscatto",
      "emoji": "🎁",
      "imageSearchQuery": "descriptive english query for image search"
    }
  ]
}

ESEMPI TIPI:
- "discount": Sconto percentuale o fisso (value: "10" = 10%, "15" = €15)
- "freeProduct": Prodotto/servizio gratis (value: "")
- "cashback": Cashback in denaro (value: "5" = €5)
- "giftCard": Buono regalo (value: "25" = €25)

⚠️ REGOLE CRITICHE PER JSON:
1. NON usare apostrofi nelle descrizioni - usa solo virgolette doppie
2. Escape correttamente le virgolette interne con backslash: \\"
3. NON inserire a capo nelle stringhe - tutto su una riga
4. Assicurati che TUTTE le stringhe siano chiuse correttamente
5. NON usare caratteri speciali non escaped nelle descrizioni

IMPORTANTE: Rispondi SOLO con il JSON, senza testo aggiuntivo prima o dopo.`

  return basePrompt
}

function detectBusinessType(name: string): string {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('pizz') || nameLower.includes('rist') || nameLower.includes('tratt')) {
    return 'Ristorante/Pizzeria'
  }
  if (nameLower.includes('bar') || nameLower.includes('caf') || nameLower.includes('coffee')) {
    return 'Bar/Caffetteria'
  }
  if (nameLower.includes('parrucch') || nameLower.includes('salon') || nameLower.includes('barber')) {
    return 'Salone/Parrucchiere'
  }
  if (nameLower.includes('palest') || nameLower.includes('gym') || nameLower.includes('fitness')) {
    return 'Palestra/Fitness'
  }
  if (nameLower.includes('negozio') || nameLower.includes('shop') || nameLower.includes('store')) {
    return 'Negozio/Retail'
  }
  if (nameLower.includes('hotel') || nameLower.includes('b&b') || nameLower.includes('resort')) {
    return 'Ospitalità/Hotel'
  }

  return 'Attività Commerciale'
}

function getImageQueryExamples(businessType: string): string {
  const examples: Record<string, string[]> = {
    'Ristorante/Pizzeria': [
      '- "Pizza Margherita Gratis" → "margherita pizza italian restaurant wood fired oven"',
      '- "Dessert del Giorno" → "italian dessert tiramisu restaurant plated"',
      '- "Aperitivo Omaggio" → "aperitif drinks sunset italian aperitivo"',
      '- "Sconto 20%" → "restaurant dining table elegant setting"'
    ],
    'Bar/Caffetteria': [
      '- "Caffè Espresso Gratis" → "espresso coffee cup on wooden table cafe"',
      '- "Cappuccino Omaggio" → "cappuccino latte art coffee shop"',
      '- "Brioche Gratis" → "italian brioche croissant breakfast pastry"',
      '- "Sconto Colazione" → "breakfast coffee croissant morning cafe"'
    ],
    'Salone/Parrucchiere': [
      '- "Taglio Gratis" → "hair salon haircut professional stylist"',
      '- "Trattamento Capelli" → "hair treatment salon professional care"',
      '- "Piega Omaggio" → "hairstyling blow dry salon"',
      '- "Sconto Colore" → "hair coloring salon professional"'
    ],
    'Palestra/Fitness': [
      '- "Mese Gratis" → "fitness gym equipment workout motivation"',
      '- "Personal Trainer" → "personal trainer fitness coaching gym"',
      '- "Lezione Yoga" → "yoga class group meditation studio"',
      '- "Sconto Iscrizione" → "gym membership fitness center"'
    ],
    'Negozio/Retail': [
      '- "Sconto 10%" → "shopping bag retail store discount"',
      '- "Prodotto Gratis" → "gift product shopping retail store"',
      '- "Buono Acquisto" → "gift card voucher shopping retail"',
      '- "Spedizione Gratis" → "package delivery shipping box"'
    ],
    'Ospitalità/Hotel': [
      '- "Notte Gratis" → "hotel room luxury bed accommodation"',
      '- "Colazione Inclusa" → "hotel breakfast buffet morning"',
      '- "Upgrade Camera" → "luxury hotel suite room"',
      '- "Sconto Soggiorno" → "hotel resort vacation accommodation"'
    ]
  }

  return examples[businessType]?.join('\n') ||
    '- "Premio Standard" → "gift present reward celebration"\n' +
    '- "Sconto" → "discount sale shopping percentage"\n' +
    '- "Prodotto Gratis" → "free product gift giveaway"\n' +
    '- "Buono Regalo" → "gift card voucher present"'
}
