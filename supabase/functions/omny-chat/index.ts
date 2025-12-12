import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Client autenticato con le credenziali dell'utente (per verificare permessi)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Client con service_role per operazioni analytics (bypass RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let { messages, organizationId } = await req.json()

        // Robust Sanitization of organizationId
        const originalOrgId = organizationId;
        if (
            organizationId === 'null' ||
            organizationId === 'undefined' ||
            organizationId === null ||
            organizationId === undefined ||
            (typeof organizationId === 'string' && organizationId.trim() === '')
        ) {
            organizationId = null
        }

        console.log(`📨 Request received.`)
        console.log(`🆔 OrgID Raw: "${originalOrgId}" (type: ${typeof originalOrgId})`)
        console.log(`🆔 OrgID Sanitized: ${organizationId}`)
        console.log(`💬 Messages count: ${messages?.length}`)

        if (!messages) {
            return new Response(JSON.stringify({ error: 'Missing messages in request body' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 1. Retrieve Anthropic API Key
        // Query by key_name instead of service
        const { data: keyData, error: keyError } = await supabaseClient
            .from('api_keys')
            .select('key_value')
            .eq('key_name', 'ANTHROPIC_API_KEY')
            .eq('is_active', true)
            .limit(1)
            .single()

        console.log('🔑 API Key query result:', keyError ? 'ERROR' : 'SUCCESS')
        if (keyError) {
            console.error('API Key Error:', keyError)
        }

        if (keyError || !keyData) {
            throw new Error('Anthropic API key not found')
        }

        // Decode the key (assuming it's stored base64 encoded as per previous patterns, or plain text if changed. 
        // Checking previous usage in generate-ai-rewards: const ANTHROPIC_API_KEY = atob(keyData.key_value)
        // We will assume it is base64 encoded for consistency.)
        let ANTHROPIC_API_KEY = keyData.key_value
        try {
            // Try to decode, if it fails or looks like a key already (starts with sk-), use as is
            if (!keyData.key_value.startsWith('sk-')) {
                ANTHROPIC_API_KEY = atob(keyData.key_value)
            }
        } catch (e) {
            console.warn('Error decoding key, using raw value', e)
        }

        console.log('✅ API Key retrieved successfully')

        // 2. Prepare System Prompt
        const systemPrompt = `REGOLA ASSOLUTA:
Quando usi il tool get_birthday_customers, la risposta contiene SOLO il campo "message".
Il campo "message" è il testo COMPLETO da mostrare all'utente.
NON aggiungere NULLA. NON formattare. NON creare intestazioni.
Copia ESATTAMENTE il valore di "message" come risposta.

Sei Omny, assistente AI per OMNILY PRO.

Tono di voce:
- Professionale ma amichevole
- Conciso e diretto
- Evita divagazioni
- Massimo 2-3 frasi per risposta (salvo richieste complesse)
- Usa emoji solo quando strettamente necessario (max 1-2 per messaggio)

Contesto:
- Stai parlando con il proprietario/manager di un'attività commerciale
- Hai accesso ai dati di vendita, clienti e marketing della piattaforma
- Puoi REGISTRARE VENDITE in tempo reale per velocizzare le code al POS

Comportamento:
- Risposte brevi e actionable
- Se chiede analisi/campagne, proponi azioni concrete in formato lista
- Se chiede di registrare una vendita, usa SEMPRE il tool record_sale
- Evita spiegazioni lunghe, vai dritto al punto
- Rispondi sempre in Italiano

IMPORTANTE - Registrazione Vendite:
Quando l'utente dice frasi come:
- "Registra 25 euro per Mario Rossi"
- "Nuova vendita di 30 euro per cliente X"
- "Vendi 50 euro a Lucia"
- "25 euro per pippo"
Devi SEMPRE usare il tool record_sale con:
- customer_name: il nome del cliente (es. "Mario Rossi")
- amount: l'importo in euro (es. 25)

IMPORTANTE - Formattazione Risultati Compleanni:
Il tool get_birthday_customers restituisce SOLO un campo "message" che è il messaggio COMPLETO da mostrare all'utente.
NON devi formattare, NON devi aggiungere testo, NON devi creare intestazioni.
Copia ESATTAMENTE il contenuto di "message" nella tua risposta e BASTA.

Esempi CORRETTI:
- Tool ritorna: {"message": "🎂 Oggi compie gli anni: Mario Rossi"}
  Tu rispondi: "🎂 Oggi compie gli anni: Mario Rossi"

- Tool ritorna: {"message": "Nessun compleanno oggi! 🎈"}
  Tu rispondi: "Nessun compleanno oggi! 🎈"

Esempi SBAGLIATI (NON FARE MAI COSÌ):
❌ "**🎂 Compleanni in arrivo (1)** Mario Rossi"
❌ "Data target: 05/12/2025 - Mario Rossi"
❌ Qualsiasi testo diverso dal campo "message"

IMPORTANTE - Formattazione Risultati Ricerca Clienti:
Il tool search_customers restituisce un array di oggetti con questa struttura:
{
  "name": "Mario Rossi",  // ← Nome completo GIA' formattato
  "email": "mario@example.com",
  "points": 100,
  "tier": "Gold"
}

DEVI usare customer.name direttamente per il nome del cliente.
NON esistono i campi first_name o last_name nella risposta del tool.

Formato risposta:
"Trovati {count} clienti:

1. {customer.name}
   Email: {customer.email} | Tier: {customer.tier} | Punti: {customer.points}"

Esempio concreto:
Se il tool restituisce {"name": "Lucci Lino", "email": "lucci@example.com", "points": 75, "tier": "Gold"}
La tua risposta DEVE essere:
"Trovati 1 clienti:

1. Lucci Lino
   Email: lucci@example.com | Tier: Gold | Punti: 75"

Esempio risposta corretta per analisi:
"Ecco 3 azioni per aumentare le vendite:
1. Campagna winback clienti inattivi (>30gg)
2. Reward esclusivo tier Gold
3. Push notification weekend con sconto 15%

Quale vuoi attivare?"`

        // 3. Define available tools
        const tools = [
            {
                name: "send_push_notification",
                description: "Invia una notifica push ai clienti. Usa questo quando l'utente chiede di inviare notifiche o messaggi ai clienti.",
                input_schema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "Titolo della notifica (max 50 caratteri)"
                        },
                        message: {
                            type: "string",
                            description: "Testo del messaggio (max 200 caratteri)"
                        },
                        target: {
                            type: "string",
                            enum: ["all", "tier_gold", "tier_silver", "tier_bronze", "inactive_30d"],
                            description: "Segmento di clienti target"
                        }
                    },
                    required: ["title", "message", "target"]
                }
            },
            {
                name: "get_sales_analytics",
                description: "Recupera dati di vendita reali dal database. Usa questo quando l'utente chiede analisi, statistiche o dati di vendita.",
                input_schema: {
                    type: "object",
                    properties: {
                        date_range: {
                            type: "string",
                            enum: ["today", "yesterday", "last_7_days", "last_30_days"],
                            description: "Periodo di analisi"
                        },
                        metrics: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: ["revenue", "transactions", "avg_ticket", "top_products"]
                            },
                            description: "Metriche da recuperare"
                        }
                    },
                    required: ["date_range", "metrics"]
                }
            },
            {
                name: "get_customer_info",
                description: "Recupera informazioni dettagliate su un cliente specifico. Usa quando l'utente chiede info su un cliente.",
                input_schema: {
                    type: "object",
                    properties: {
                        customer_id: {
                            type: "string",
                            description: "ID del cliente o email"
                        }
                    },
                    required: ["customer_id"]
                }
            },
            {
                name: "search_customers",
                description: "Cerca clienti nel database. Usa quando l'utente vuole trovare clienti per nome, email, tier o stato.",
                input_schema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Testo di ricerca (nome o email)"
                        },
                        tier: {
                            type: "string",
                            enum: ["gold", "silver", "bronze", ""],
                            description: "Filtra per tier (opzionale)"
                        },
                        inactive_days: {
                            type: "number",
                            description: "Trova clienti inattivi da X giorni (opzionale)"
                        },
                        limit: {
                            type: "number",
                            description: "Numero massimo di risultati (default 10)"
                        }
                    },
                    required: []
                }
            },
            {
                name: "get_top_customers",
                description: "Recupera i migliori clienti per punti o spesa. Usa quando l'utente chiede i top clienti o i più fedeli.",
                input_schema: {
                    type: "object",
                    properties: {
                        metric: {
                            type: "string",
                            enum: ["points", "spending"],
                            description: "Ordina per punti o spesa totale"
                        },
                        limit: {
                            type: "number",
                            description: "Numero di clienti da mostrare (default 10)"
                        }
                    },
                    required: ["metric"]
                }
            },
            {
                name: "assign_bonus_points",
                description: "Assegna punti bonus a un cliente. Usa quando l'utente vuole dare punti extra a qualcuno.",
                input_schema: {
                    type: "object",
                    properties: {
                        customer_id: {
                            type: "string",
                            description: "ID del cliente"
                        },
                        points: {
                            type: "number",
                            description: "Numero di punti da assegnare"
                        },
                        reason: {
                            type: "string",
                            description: "Motivo dell'assegnazione"
                        }
                    },
                    required: ["customer_id", "points", "reason"]
                }
            },

            {
                name: "register_sale",
                description: "Registra una vendita per un cliente. Cerca il cliente per nome e aggiunge la transazione. Usa quando l'utente dice 'registra vendita X euro a Nome Cognome'.",
                input_schema: {
                    type: "object",
                    properties: {
                        customer_name: {
                            type: "string",
                            description: "Nome e cognome del cliente da cercare"
                        },
                        amount: {
                            type: "number",
                            description: "Importo della vendita in euro"
                        },
                        description: {
                            type: "string",
                            description: "Descrizione della vendita (opzionale)"
                        }
                    },
                    required: ["customer_name", "amount"]
                }
            },
            {
                name: "get_customer_transactions",
                description: "Recupera lo storico delle transazioni di un cliente. Usa quando l'utente chiede 'visualizza transazioni di X' o 'storico acquisti'.",
                input_schema: {
                    type: "object",
                    properties: {
                        customer_id: {
                            type: "string",
                            description: "ID del cliente (ottenuto da search_customers)"
                        },
                        limit: {
                            type: "number",
                            description: "Numero di transazioni da mostrare (default 5)"
                        }
                    },
                    required: ["customer_id"]
                }
            },
            {
                name: "create_coupon",
                description: "Crea un nuovo coupon sconto. Usa quando l'utente dice 'crea coupon CODICE del X%'.",
                input_schema: {
                    type: "object",
                    properties: {
                        code: {
                            type: "string",
                            description: "Codice del coupon (es. ESTATE20)"
                        },
                        discount_value: {
                            type: "number",
                            description: "Valore dello sconto (es. 20)"
                        },
                        type: {
                            type: "string",
                            enum: ["percentage", "fixed_amount"],
                            description: "Tipo di sconto (percentuale o fisso)"
                        },
                        duration_days: {
                            type: "number",
                            description: "Durata in giorni (default 7)"
                        },
                        title: {
                            type: "string",
                            description: "Titolo del coupon (opzionale)"
                        }
                    },
                    required: ["code", "discount_value", "type"]
                }
            },
            {
                name: "get_churn_risk_customers",
                description: "Trova i clienti a rischio abbandono (che non vengono da X giorni).",
                input_schema: {
                    type: "object",
                    properties: {
                        days_since_last_visit: {
                            type: "number",
                            description: "Giorni dall'ultima visita (default 30)"
                        },
                        limit: {
                            type: "number",
                            description: "Numero massimo di clienti da mostrare (default 10)"
                        }
                    },
                    required: []
                }
            },
            {
                name: "get_birthday_customers",
                description: "Trova i clienti che compiono gli anni oggi o nei prossimi giorni. Usa questo tool quando l'utente chiede 'chi compie gli anni', 'compleanni oggi', 'c'è qualche compleanno', ecc. IMPORTANTE: Il tool restituisce SOLO un campo 'message' che contiene il messaggio completo già formattato. NON aggiungere intestazioni, conteggi, date o altre informazioni. Mostra SOLO il contenuto del campo 'message' così com'è.",
                input_schema: {
                    type: "object",
                    properties: {
                        days_ahead: {
                            type: "number",
                            description: "Giorni di anticipo (0 = oggi, 7 = prossima settimana)"
                        },
                        limit: {
                            type: "number",
                            description: "Numero massimo di clienti da mostrare (default 10)"
                        }
                    },
                    required: []
                }
            }
        ]

        // 4. Call Anthropic API with tools
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5',
                max_tokens: 1024,
                system: systemPrompt,
                tools: tools,
                messages: messages.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content
                })),
            }),
        })

        const data = await response.json()

        if (data.error) {
            console.error('Anthropic API Error:', data.error)
            throw new Error(data.error.message)
        }

        console.log('🤖 Claude response stop_reason:', data.stop_reason)

        // Check if Claude wants to use a tool
        if (data.stop_reason === 'tool_use') {
            const toolUse = data.content.find((block: any) => block.type === 'tool_use')

            if (toolUse) {
                console.log('🔧 Tool requested:', toolUse.name, 'with input:', toolUse.input)

                // Execute the tool
                let toolResult
                try {
                    toolResult = await executeTool(toolUse.name, toolUse.input, supabaseClient, supabaseAdmin, organizationId)
                } catch (toolError: any) {
                    toolResult = { error: toolError.message }
                }

                console.log('✅ Tool result:', toolResult)

                // Return tool use request and result to frontend
                // Frontend will handle confirmation and re-call with tool result
                return new Response(
                    JSON.stringify({
                        role: 'assistant',
                        content: data.content,
                        tool_use: {
                            id: toolUse.id,
                            name: toolUse.name,
                            input: toolUse.input,
                            result: toolResult
                        },
                        timestamp: new Date().toISOString(),
                        requires_confirmation: toolUse.name === 'send_push_notification'
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        // Regular text response (no tool use)
        const aiResponse = data.content.find((block: any) => block.type === 'text')?.text || ''

        return new Response(
            JSON.stringify({
                content: aiResponse,
                role: 'assistant',
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})

// ============================================================================
// TOOL EXECUTION FUNCTIONS
// ============================================================================

async function executeTool(toolName: string, input: any, supabaseClient: any, supabaseAdmin: any, organizationId: string | null) {
    console.log(`🔧 Executing tool: ${toolName}`)

    switch (toolName) {
        case 'send_push_notification':
            return await sendPushNotification(input, supabaseClient, organizationId)

        case 'get_sales_analytics':
            return await getSalesAnalytics(input, supabaseAdmin, organizationId)

        case 'get_customer_info':
            return await getCustomerInfo(input, supabaseClient, organizationId)

        case 'search_customers':
            return await searchCustomers(input, supabaseClient, organizationId)

        case 'get_top_customers':
            return await getTopCustomers(input, supabaseClient, organizationId)

        case 'assign_bonus_points':
            return await assignBonusPoints(input, supabaseClient, organizationId)

        case 'register_sale':
            return await registerSale(input, supabaseClient, organizationId)

        case 'get_customer_transactions':
            return await getCustomerTransactions(input, supabaseClient, organizationId)

        case 'create_coupon':
            return await createCoupon(input, supabaseClient, organizationId)

        case 'get_churn_risk_customers':
            return await getChurnRiskCustomers(input, supabaseClient, organizationId)

        case 'get_birthday_customers':
            return await getBirthdayCustomers(input, supabaseClient, organizationId)

        default:
            throw new Error(`Unknown tool: ${toolName}`)
    }
}

// Helper function to apply organization_id filter correctly
// Handles both null and UUID values properly
function applyOrgFilter(queryBuilder: any, organizationId: string | null) {
    if (organizationId === null) {
        return queryBuilder.is('organization_id', null)
    } else {
        return queryBuilder.eq('organization_id', organizationId)
    }
}

async function registerSale(input: any, supabaseClient: any, organizationId: string | null) {
    const { customer_name, amount, description } = input

    // 1. Find customer by name - Robust JS Logic
    const nameParts = customer_name.trim().split(/\s+/).map(p => p.toLowerCase())

    // Build a broad query to get potential matches
    let queryBuilder = supabaseClient
        .from('customers')
        .select('id, name, first_name, last_name, points, email, total_spent, visits')

    queryBuilder = applyOrgFilter(queryBuilder, organizationId)

    // Create an OR condition for each part of the name against name/first/last/email
    const orConditions = []
    for (const part of nameParts) {
        orConditions.push(`name.ilike.%${part}%`)
        orConditions.push(`first_name.ilike.%${part}%`)
        orConditions.push(`last_name.ilike.%${part}%`)
        orConditions.push(`email.ilike.%${part}%`)
    }

    // Join all with comma for OR
    queryBuilder = queryBuilder.or(orConditions.join(','))

    const { data: candidates, error } = await queryBuilder.limit(20)

    if (error) {
        console.error('❌ DB Error in registerSale:', error)
        return { success: false, error: `Errore database: ${error.message}` }
    }

    console.log(`🔍 DEBUG registerSale - Candidates for "${customer_name}":`, candidates?.length)

    // Filter candidates in JS to find the best match
    let bestMatch = null

    if (candidates && candidates.length > 0) {
        // Score candidates
        const scored = candidates.map(c => {
            let score = 0
            const cName = (c.name || '').toLowerCase()
            const cFirst = (c.first_name || '').toLowerCase()
            const cLast = (c.last_name || '').toLowerCase()
            const cEmail = (c.email || '').toLowerCase()

            // Check each part of the input name
            let allPartsMatched = true
            for (const part of nameParts) {
                const found = cName.includes(part) || cFirst.includes(part) || cLast.includes(part) || cEmail.includes(part)
                if (found) score += 1
                else allPartsMatched = false
            }

            // Bonus for exact matches
            if (cFirst === nameParts[0] && cLast === nameParts[nameParts.length - 1]) score += 2
            if (cFirst === nameParts[nameParts.length - 1] && cLast === nameParts[0]) score += 2 // Reversed

            return { customer: c, score, allPartsMatched }
        })

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score)

        console.log('🔍 DEBUG registerSale - Scored candidates:', JSON.stringify(scored.map(s => ({ name: s.customer.name, score: s.score })), null, 2))

        // Pick best if it matches reasonably well (at least all parts matched or high score)
        if (scored[0].score >= nameParts.length) {
            bestMatch = scored[0].customer
        }
    }

    if (!bestMatch) {
        return {
            success: false,
            error: `Non ho trovato nessun cliente con nome "${customer_name}". Prova a cercare con un nome diverso.`
        }
    }

    const customer = bestMatch
    const displayName = formatCustomerName(customer)

    // 2. Calculate points (1 point per euro, standard rule)
    const pointsEarned = Math.floor(amount)
    const newTotalPoints = (customer.points || 0) + pointsEarned

    // 3. Register transaction
    const { error: txError } = await supabaseClient
        .from('transaction')
        .insert({
            customer_id: customer.id,
            organization_id: organizationId,
            amount: amount,
            points: pointsEarned,
            type: 'sale',
            description: description || `Vendita registrata da Assistant`,
            created_at: new Date().toISOString()
        })

    if (txError) {
        return { success: false, error: `Errore registrazione transazione: ${txError.message}` }
    }

    // 4. Calculate Tier Upgrade
    let newTierName = customer.tier
    let tierChanged = false
    let newTierColor = '#a3a3a3'
    let oldTierName = customer.tier || 'Bronze'

    // Fetch loyalty tiers
    let loyaltyQuery = supabaseClient
        .from('loyalty_tiers')
        .select('*')

    loyaltyQuery = applyOrgFilter(loyaltyQuery, organizationId)

    const { data: loyaltyTiers } = await loyaltyQuery
        .order('threshold', { ascending: false })

    const newTier = calculateTier(newTotalPoints, loyaltyTiers || [])

    if (newTier.name !== oldTierName) {
        tierChanged = true
        newTierName = newTier.name
        newTierColor = newTier.color
        console.log(`🎉 Tier Upgrade detected: ${oldTierName} -> ${newTierName}`)
    }

    // 5. Update customer points and tier
    await supabaseClient
        .from('customers')
        .update({
            points: newTotalPoints,
            tier: newTierName, // Update tier
            total_spent: (customer.total_spent || 0) + amount,
            last_visit: new Date().toISOString(),
            visits: (customer.visits || 0) + 1
        })
        .eq('id', customer.id)

    // 6. Create Notification for Popup if tier changed
    if (tierChanged) {
        await supabaseClient
            .from('customer_notifications')
            .insert({
                customer_id: customer.id,
                organization_id: organizationId,
                category: 'tier_upgrade',
                title: `Congratulazioni! Sei ${newTierName}!`,
                message: `Sei passato da ${oldTierName} a ${newTierName}! Continua così!`,
                is_read: false,
                metadata: {
                    oldTierName: oldTierName,
                    newTierName: newTierName,
                    newTierColor: newTierColor,
                    multiplier: newTier.multiplier
                },
                animation_type: 'tier_upgrade',
                created_at: new Date().toISOString()
            })
    }

    return {
        success: true,
        customer_name: displayName,
        amount: amount,
        points_earned: pointsEarned,
        new_total_points: newTotalPoints,
        transaction_id: 'generated'
    }
}

async function sendPushNotification(input: any, supabaseClient: any, organizationId: string | null) {
    const { title, message, target } = input

    // Get target users based on segment
    let targetUsers: string[] = []

    if (target === 'all') {
        let query = supabaseClient
            .from('customers')
            .select('id')

        query = applyOrgFilter(query, organizationId)

        const { data: users } = await query

        targetUsers = users?.map((u: any) => u.id) || []
    } else if (target.startsWith('tier_')) {
        const tierName = target.replace('tier_', '')
        let query = supabaseClient
            .from('customers')
            .select('id')

        query = applyOrgFilter(query, organizationId)

        const { data: users } = await query
            .eq('tier', tierName)

        targetUsers = users?.map((u: any) => u.id) || []
    } else if (target === 'inactive_30d') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        let query = supabaseClient
            .from('customers')
            .select('id')

        query = applyOrgFilter(query, organizationId)

        const { data: users } = await query
            .lt('last_visit', thirtyDaysAgo.toISOString())

        targetUsers = users?.map((u: any) => u.id) || []
    }

    return {
        success: true,
        target_count: targetUsers.length,
        title,
        message,
        target_segment: target,
        note: 'Notification prepared. Awaiting user confirmation to send.'
    }
}

async function getSalesAnalytics(input: any, supabaseClient: any, organizationId: string | null) {
    const { date_range, metrics } = input

    // Calculate dates in Italian timezone (UTC+1 in December)
    const nowUTC = new Date()

    // Italy is UTC+1 in winter, UTC+2 in summer
    // For December, use UTC+1
    const italyOffsetMs = 1 * 60 * 60 * 1000 // 1 hour in milliseconds

    // Get midnight today in Italy (00:00 Italy time)
    const nowItalyMs = nowUTC.getTime() + italyOffsetMs
    const nowItaly = new Date(nowItalyMs)

    const midnightItaly = new Date(nowItaly)
    midnightItaly.setHours(0, 0, 0, 0)

    // Convert midnight Italy to UTC for database query
    const midnightUTC = new Date(midnightItaly.getTime() - italyOffsetMs)

    let startDate = midnightUTC
    let endDate = nowUTC // Current time

    switch (date_range) {
        case 'today':
            // From 00:00 Italy (23:00 UTC yesterday) to now
            // Already set correctly
            break
        case 'yesterday':
            // From 00:00 to 23:59:59 yesterday in Italy
            startDate = new Date(midnightUTC.getTime() - (24 * 60 * 60 * 1000))
            endDate = new Date(midnightUTC.getTime() - 1) // 1ms before midnight
            break
        case 'last_7_days':
            startDate = new Date(midnightUTC.getTime() - (7 * 24 * 60 * 60 * 1000))
            break
        case 'last_30_days':
            startDate = new Date(midnightUTC.getTime() - (30 * 24 * 60 * 60 * 1000))
            break
    }

    console.log('📊 getSalesAnalytics - Query params:', {
        date_range,
        nowItaly: nowItaly.toLocaleString('it-IT'),
        midnightItaly: midnightItaly.toLocaleString('it-IT'),
        startDateUTC: startDate.toISOString(),
        endDateUTC: endDate.toISOString(),
        organizationId,
        organizationIdType: typeof organizationId,
        organizationIdIsNull: organizationId === null
    })

    // Get transactions
    let txQuery = supabaseClient
        .from('transaction')
        .select('amount, created_at, organization_id')

    console.log('🔍 Applying org filter with organizationId:', organizationId)
    txQuery = applyOrgFilter(txQuery, organizationId)

    const { data: transactions, error: txError } = await txQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

    if (txError) {
        console.error('❌ Error fetching transactions:', txError)
    }

    console.log('📊 getSalesAnalytics - Transactions found:', transactions?.length || 0)

    // Log first few transactions for debugging
    if (transactions && transactions.length > 0) {
        console.log('📊 Sample transactions:', JSON.stringify(transactions.slice(0, 3), null, 2))
    } else {
        console.log('⚠️ No transactions found with current filter. Trying without org filter...')
        // Try without org filter to see if transactions exist
        const { data: allTx } = await supabaseClient
            .from('transaction')
            .select('amount, created_at, organization_id')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .limit(10)
        console.log('📊 Transactions without org filter:', allTx?.length || 0)
        if (allTx && allTx.length > 0) {
            console.log('📊 Sample unfiltered transactions (showing ALL org_ids):', JSON.stringify(allTx, null, 2))
            console.log('📊 COMPARISON - Looking for org_id:', organizationId)
            console.log('📊 COMPARISON - Found org_ids:', [...new Set(allTx.map(t => t.organization_id))])
        }
    }

    // Calculate metrics as NUMBERS (not formatted strings)
    const totalRevenue = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0
    const transactionCount = transactions?.length || 0
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0

    // Format dates in Italian timezone for display
    const startDateItaly = new Date(startDate.getTime() + italyOffsetMs)
    const endDateItaly = new Date(endDate.getTime() + italyOffsetMs)

    return {
        success: true,
        date_range,
        period: `${startDateItaly.toLocaleDateString('it-IT')} - ${endDateItaly.toLocaleDateString('it-IT')}`,
        total_revenue: totalRevenue,
        transaction_count: transactionCount,
        average_transaction: averageTransaction
    }
}

function formatCustomerName(c: any) {
    // Check for invalid name strings
    let name = c.name

    // Normalize to check for bad values
    const lowerName = String(name).toLowerCase().trim()

    if (!name ||
        lowerName === 'undefined' ||
        lowerName === 'null' ||
        lowerName === 'undefined undefined' ||
        lowerName === 'null null' ||
        lowerName.includes('undefined')) {
        name = null
    }

    if (name) return name

    // Fallback to first/last name
    if (c.first_name || c.last_name) {
        const first = c.first_name || ''
        const last = c.last_name || ''
        const combined = `${first} ${last}`.trim()

        if (combined && combined !== 'undefined undefined') {
            return combined
        }
    }

    // Fallback to email
    if (c.email) return c.email

    return 'Cliente senza nome'
}

async function getCustomerInfo(input: any, supabaseClient: any, organizationId: string | null) {
    const { customer_id } = input

    // Try to find by ID or email
    let query = supabaseClient
        .from('customers')
        .select('*')

    query = applyOrgFilter(query, organizationId)

    // Check if input looks like email
    if (customer_id.includes('@')) {
        query = query.eq('email', customer_id)
    } else {
        query = query.eq('id', customer_id)
    }

    const { data: customer } = await query.single()

    if (!customer) {
        return { success: false, error: 'Cliente non trovato' }
    }

    return {
        success: true,
        customer: {
            name: formatCustomerName(customer),
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone: customer.phone,
            points: customer.points || 0,
            tier: customer.tier || 'bronze',
            total_spent: customer.total_spent || 0,
            visits: customer.visit_count || 0,
            last_visit: customer.last_visit,
            created_at: customer.created_at
        }
    }
}

function calculateTier(points: number, loyaltyTiers: any[]): any {
    if (!loyaltyTiers || loyaltyTiers.length === 0) {
        // Fallback defaults
        if (points >= 1000) return { name: 'Platinum', multiplier: 2, color: '#e5e7eb' }
        if (points >= 500) return { name: 'Gold', multiplier: 1.5, color: '#f59e0b' }
        if (points >= 200) return { name: 'Silver', multiplier: 1.2, color: '#64748b' }
        return { name: 'Bronze', multiplier: 1, color: '#a3a3a3' }
    }

    // Tiers are already sorted by threshold desc
    for (const tier of loyaltyTiers) {
        if (points >= parseFloat(tier.threshold)) {
            return {
                name: tier.name,
                multiplier: parseFloat(tier.multiplier) || 1,
                color: tier.color || '#64748b',
                threshold: parseFloat(tier.threshold)
            }
        }
    }

    // Fallback to lowest
    const firstTier = loyaltyTiers[loyaltyTiers.length - 1]
    return {
        name: firstTier.name,
        multiplier: parseFloat(firstTier.multiplier) || 1,
        color: firstTier.color || '#64748b',
        threshold: parseFloat(firstTier.threshold)
    }
}

async function getCustomerTransactions(input: any, supabaseClient: any, organizationId: string | null) {
    let { customer_id, limit = 5 } = input

    // If customer_id is an email, resolve it to UUID
    if (customer_id && customer_id.includes('@')) {
        let emailQuery = supabaseClient
            .from('customers')
            .select('id')

        emailQuery = applyOrgFilter(emailQuery, organizationId)

        const { data: customer, error: customerError } = await emailQuery
            .eq('email', customer_id)
            .single()

        if (customerError || !customer) {
            return { success: false, error: `Cliente con email ${customer_id} non trovato` }
        }

        customer_id = customer.id
    }

    // Fetch from transaction table
    let txQuery = supabaseClient
        .from('transaction')
        .select('*')
        .eq('customer_id', customer_id)

    txQuery = applyOrgFilter(txQuery, organizationId)

    const { data: transactions, error } = await txQuery
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('❌ DB Error in getCustomerTransactions:', error)
        return { success: false, error: `Errore database: ${error.message}` }
    }

    return {
        success: true,
        count: transactions.length,
        transactions: transactions.map(t => ({
            date: new Date(t.created_at).toLocaleDateString('it-IT'),
            amount: t.amount,
            points: t.points,
            description: t.description || 'Transazione'
        }))
    }
}

async function createCoupon(input: any, supabaseClient: any, organizationId: string | null) {
    const { code, discount_value, type, duration_days = 7, title } = input

    const validFrom = new Date()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + duration_days)

    const couponTitle = title || `Sconto ${code}`
    const description = `Sconto del ${discount_value}${type === 'percentage' ? '%' : '€'} valido per ${duration_days} giorni`

    const { data: coupon, error } = await supabaseClient
        .from('coupons')
        .insert({
            organization_id: organizationId,
            code: code.toUpperCase(),
            type: type,
            value: discount_value.toString(),
            duration_type: 'standard',
            valid_from: validFrom.toISOString(),
            valid_until: validUntil.toISOString(),
            status: 'active',
            title: couponTitle,
            description: description,
            usage_limit: 100, // Default limit
            is_flash: false
        })
        .select()
        .single()

    if (error) {
        console.error('❌ DB Error in createCoupon:', error)
        return { success: false, error: `Errore creazione coupon: ${error.message}` }
    }

    return {
        success: true,
        coupon_code: coupon.code,
        discount: `${discount_value}${type === 'percentage' ? '%' : '€'}`,
        valid_until: validUntil.toLocaleDateString('it-IT')
    }
}

async function getChurnRiskCustomers(input: any, supabaseClient: any, organizationId: string | null) {
    const { days_since_last_visit = 30, limit = 10 } = input

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days_since_last_visit)

    let query = supabaseClient
        .from('customers')
        .select('id, name, first_name, last_name, email, last_visit, total_spent')

    query = applyOrgFilter(query, organizationId)

    const { data: customers, error } = await query
        .lt('last_visit', cutoffDate.toISOString())
        .order('last_visit', { ascending: true }) // Mostra prima chi manca da più tempo
        .limit(limit)

    if (error) {
        console.error('❌ DB Error in getChurnRiskCustomers:', error)
        return { success: false, error: `Errore database: ${error.message}` }
    }

    return {
        success: true,
        count: customers.length,
        days_threshold: days_since_last_visit,
        customers: customers.map(c => ({
            name: c.first_name ? `${c.first_name} ${c.last_name}` : c.name,
            email: c.email,
            last_visit: new Date(c.last_visit).toLocaleDateString('it-IT'),
            days_absent: Math.floor((new Date().getTime() - new Date(c.last_visit).getTime()) / (1000 * 3600 * 24))
        }))
    }
}

async function getBirthdayCustomers(input: any, supabaseClient: any, organizationId: string | null) {
    const { days_ahead = 0, limit = 10 } = input

    // Logic to find birthdays is tricky in SQL/Supabase without raw SQL functions for date parts
    // We will fetch customers with birth_date not null and filter in JS for simplicity/robustness with small datasets
    // For large datasets, a proper RPC or SQL view would be better.

    console.log(`🔍 Searching birthdays for organization: ${organizationId}`)

    let query = supabaseClient
        .from('customers')
        .select('id, name, first_name, last_name, email, birth_date, points, organization_id')

    query = applyOrgFilter(query, organizationId)

    const { data: customers, error } = await query
        .not('birth_date', 'is', null)
        .limit(1000) // Fetch a reasonable batch to filter

    console.log(`📊 Query returned ${customers?.length || 0} customers with birth_date`)

    if (error) {
        console.error('❌ DB Error in getBirthdayCustomers:', error)
        return { success: false, error: `Errore database: ${error.message}` }
    }

    if (customers && customers.length > 0) {
        console.log(`📝 Sample customers:`, customers.slice(0, 3).map(c => ({
            name: c.first_name || c.name,
            birth_date: c.birth_date,
            org_id: c.organization_id
        })))
    }

    // Convert to Italian timezone (Europe/Rome, UTC+1)
    const nowUTC = new Date()

    // Get Italy time string and parse it
    const italyTimeString = nowUTC.toLocaleString('en-US', { timeZone: 'Europe/Rome' })
    const nowItaly = new Date(italyTimeString)
    nowItaly.setDate(nowItaly.getDate() + days_ahead)

    // Extract month and day in Italian timezone
    const targetMonth = nowItaly.getMonth() + 1 // 0-indexed, returns 1-12
    const targetDay = nowItaly.getDate()

    console.log(`🎂 Looking for birthdays on ${targetDay}/${targetMonth}`)
    console.log(`🎂 UTC: ${nowUTC.toISOString()}, Italy: ${nowItaly.toLocaleString('it-IT')}`)

    // Filter for matching day/month
    const birthdayCustomers = customers.filter((c: any) => {
        if (!c.birth_date) return false

        // Parse date as UTC to avoid timezone issues
        // birth_date format is typically "YYYY-MM-DD"
        const dateParts = c.birth_date.split('T')[0].split('-') // Get just the date part
        const birthMonth = parseInt(dateParts[1], 10)
        const birthDay = parseInt(dateParts[2], 10)

        console.log(`  Customer: ${c.first_name || c.name}, birth: ${birthDay}/${birthMonth}`)

        return birthMonth === targetMonth && birthDay === targetDay
    }).slice(0, limit)

    console.log(`🎂 Found ${birthdayCustomers.length} birthday(s)`)

    // Helper to calculate age
    const calculateAge = (birthDate: string): number => {
        const dateParts = birthDate.split('T')[0].split('-')
        const birthYear = parseInt(dateParts[0], 10)
        const currentYear = nowItaly.getFullYear()
        return currentYear - birthYear
    }

    const message = birthdayCustomers.length === 0
        ? `Nessun compleanno oggi! 🎈`
        : birthdayCustomers.length === 1
        ? (() => {
            const customer = birthdayCustomers[0]
            const name = customer.first_name ? `${customer.first_name} ${customer.last_name}` : customer.name
            const age = calculateAge(customer.birth_date)
            return `🎂 Oggi compie gli anni: ${name} (${age} anni)`
          })()
        : `🎂 Oggi compiono gli anni: ${birthdayCustomers.map(c => {
            const name = c.first_name ? `${c.first_name} ${c.last_name}` : c.name
            const age = calculateAge(c.birth_date)
            return `${name} (${age} anni)`
          }).join(', ')}`

    return {
        success: true,
        message: message
    }
}

async function searchCustomers(input: any, supabaseClient: any, organizationId: string | null) {
    const { query, tier, inactive_days, limit = 10 } = input

    let dbQuery = supabaseClient
        .from('customers')
        .select('id, name, first_name, last_name, email, points, tier, last_visit')

    dbQuery = applyOrgFilter(dbQuery, organizationId)

    dbQuery = dbQuery.limit(limit)

    // Search by name or email - Robust Logic
    if (query) {
        // Check if it's an email
        if (query.includes('@')) {
            dbQuery = dbQuery.ilike('email', `%${query}%`)
        } else {
            // Split name into parts
            const nameParts = query.trim().split(/\s+/).map(p => p.toLowerCase())

            // Build OR conditions for each part
            const orConditions = []
            for (const part of nameParts) {
                orConditions.push(`name.ilike.%${part}%`)
                orConditions.push(`first_name.ilike.%${part}%`)
                orConditions.push(`last_name.ilike.%${part}%`)
                orConditions.push(`email.ilike.%${part}%`)
            }

            // Join with comma for OR
            dbQuery = dbQuery.or(orConditions.join(','))
        }
    }

    // Filter by tier
    if (tier) {
        dbQuery = dbQuery.eq('tier', tier)
    }

    // Filter by inactive days
    if (inactive_days) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - inactive_days)
        dbQuery = dbQuery.lt('last_visit', cutoffDate.toISOString())
    }

    // Fetch more candidates for JS filtering
    const { data: customers, error } = await dbQuery.limit(50)

    if (error) {
        console.error('❌ DB Error in searchCustomers:', error)
        return {
            success: false,
            error: `Errore database: ${error.message}`
        }
    }

    console.log('🔍 DEBUG searchCustomers - Raw customers from DB:', JSON.stringify(customers, null, 2))

    const formattedCustomers = customers?.map(c => ({
        id: c.id,
        name: formatCustomerName(c),
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        points: c.points || 0,
        tier: c.tier || 'bronze',
        last_visit: c.last_visit
    })) || []

    return {
        success: true,
        count: customers?.length || 0,
        customers: formattedCustomers
    }
}

async function getTopCustomers(input: any, supabaseClient: any, organizationId: string | null) {
    const { metric, limit = 10 } = input

    const orderBy = metric === 'points' ? 'points' : 'total_spent'

    let query = supabaseClient
        .from('customers')
        .select('id, name, first_name, last_name, email, points, total_spent, tier')

    query = applyOrgFilter(query, organizationId)

    const { data: customers } = await query
        .order(orderBy, { ascending: false })
        .limit(limit)

    return {
        success: true,
        metric,
        count: customers?.length || 0,
        customers: customers?.map(c => ({
            name: formatCustomerName(c),
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email,
            points: c.points || 0,
            total_spent: c.total_spent || 0,
            tier: c.tier || 'bronze'
        })) || []
    }
}

async function assignBonusPoints(input: any, supabaseClient: any, organizationId: string | null) {
    const { customer_id, points, reason } = input

    // Get current customer points
    let query = supabaseClient
        .from('customers')
        .select('points, first_name, last_name')
        .eq('id', customer_id)

    query = applyOrgFilter(query, organizationId)

    const { data: customer } = await query.single()

    if (!customer) {
        return { success: false, error: 'Cliente non trovato' }
    }

    const newPoints = (customer.points || 0) + points

    // Update customer points
    await supabaseClient
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customer_id)

    // Log the transaction
    await supabaseClient
        .from('transaction')
        .insert({
            customer_id,
            organization_id: organizationId,
            type: 'bonus',
            points: points,
            description: reason,
            created_at: new Date().toISOString()
        })

    return {
        success: true,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        points_added: points,
        new_total: newPoints,
        reason
    }
}

async function recordSale(input: any, supabaseClient: any, organizationId: string | null) {
    const { customer_name, amount } = input

    console.log('🎯 recordSale called:', { customer_name, amount, organizationId })

    if (!organizationId) {
        console.error('❌ Organization ID mancante')
        return { success: false, error: 'Organization ID mancante' }
    }

    // Search for customer by name using first_name and last_name fields
    const nameParts = customer_name.trim().split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')

    let customer = null

    console.log('🔍 Ricerca cliente:', {
        input_name: customer_name,
        parsed_firstName: firstName,
        parsed_lastName: lastName,
        organizationId
    })

    // DEBUG: Get all customers for this organization to see what's in the database
    let debugQuery = supabaseClient
        .from('customers')
        .select('id, first_name, last_name, name, email, points, total_spent')

    debugQuery = applyOrgFilter(debugQuery, organizationId)

    const { data: allCustomers, error: debugError } = await debugQuery
        .order('created_at', { ascending: false })
        .limit(20)

    console.log('📋 DEBUG - Tutti i clienti:', JSON.stringify(allCustomers, null, 2))
    if (debugError) {
        console.error('📋 DEBUG - Errore query:', debugError)
    }

    // Level 1: Try exact match on first_name + last_name
    if (lastName) {
        let level1Query = supabaseClient
            .from('customers')
            .select('*')

        level1Query = applyOrgFilter(level1Query, organizationId)

        const { data, error } = await level1Query
            .ilike('first_name', firstName)
            .ilike('last_name', lastName)
            .limit(1)

        console.log('🔍 Level 1 (exact match first+last):', { firstName, lastName, data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // Level 2: Try reversed order (e.g., "Lino Lucci" finds "Lucci Lino")
    if (!customer && lastName) {
        let level2Query = supabaseClient
            .from('customers')
            .select('*')

        level2Query = applyOrgFilter(level2Query, organizationId)

        const { data, error } = await level2Query
            .ilike('first_name', lastName)
            .ilike('last_name', firstName)
            .limit(1)

        console.log('🔍 Level 2 (reversed first+last):', { firstName: lastName, lastName: firstName, data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // Level 3: Search by first_name only with wildcards
    if (!customer && firstName) {
        let level3Query = supabaseClient
            .from('customers')
            .select('*')

        level3Query = applyOrgFilter(level3Query, organizationId)

        const { data, error } = await level3Query
            .ilike('first_name', `%${firstName}%`)
            .limit(1)

        console.log('🔍 Level 3 (first_name wildcard):', { firstName, data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // Level 4: Search by last_name only with wildcards
    if (!customer && lastName) {
        let level4Query = supabaseClient
            .from('customers')
            .select('*')

        level4Query = applyOrgFilter(level4Query, organizationId)

        const { data, error } = await level4Query
            .ilike('last_name', `%${lastName}%`)
            .limit(1)

        console.log('🔍 Level 4 (last_name wildcard):', { lastName, data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    if (!customer) {
        console.log('❌ Cliente non trovato:', customer_name)

        // Provide helpful error message suggesting to use search first
        return {
            success: false,
            error: `Cliente "${customer_name}" non trovato. Prova a cercare prima il cliente con il comando "cerca clienti" per vedere i clienti disponibili.`
        }
    }

    console.log('✅ Cliente trovato:', {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        name: customer.name,
        email: customer.email
    })

    // Get organization settings for points calculation
    const { data: orgSettings } = await supabaseClient
        .from('organizations')
        .select('points_per_euro, loyalty_tiers')
        .eq('id', organizationId)
        .single()

    const pointsPerEuro = orgSettings?.points_per_euro || 1
    const loyaltyTiers = orgSettings?.loyalty_tiers || []

    // Calculate customer's tier multiplier
    const customerPoints = customer.points || 0
    let tierMultiplier = 1
    let tierName = customer.tier || 'Bronze'

    if (loyaltyTiers && loyaltyTiers.length > 0) {
        for (let i = loyaltyTiers.length - 1; i >= 0; i--) {
            if (customerPoints >= parseFloat(loyaltyTiers[i].threshold || 0)) {
                tierMultiplier = parseFloat(loyaltyTiers[i].multiplier || 1)
                tierName = loyaltyTiers[i].name
                break
            }
        }
    }

    // Calculate points earned
    const pointsEarned = Math.floor(amount * pointsPerEuro * tierMultiplier)
    const newTotalPoints = customerPoints + pointsEarned
    const newTotalSpent = (customer.total_spent || 0) + amount

    console.log('💰 Calculating points:', {
        amount,
        pointsPerEuro,
        tierMultiplier,
        pointsEarned,
        customerPoints,
        newTotalPoints,
        newTotalSpent
    })

    // Update customer
    const { error: updateError } = await supabaseClient
        .from('customers')
        .update({
            points: newTotalPoints,
            total_spent: newTotalSpent,
            last_visit: new Date().toISOString()
        })
        .eq('id', customer.id)

    if (updateError) {
        console.error('❌ Errore aggiornamento cliente:', updateError)
        return {
            success: false,
            error: `Errore durante l'aggiornamento del cliente: ${updateError.message}`
        }
    }

    console.log('✅ Cliente aggiornato con successo')

    // Record transaction
    const { error: transactionError } = await supabaseClient
        .from('transaction')
        .insert({
            customer_id: customer.id,
            organization_id: organizationId,
            amount: amount,
            points: pointsEarned,
            type: 'sale',
            description: `Vendita registrata via Omny Assistant`,
            created_at: new Date().toISOString()
        })

    if (transactionError) {
        console.error('❌ Errore creazione transazione:', transactionError)
        return {
            success: false,
            error: `Errore durante la registrazione della transazione: ${transactionError.message}`
        }
    }

    console.log('✅ Transazione registrata con successo')

    // Also log to customer_activities table for history display
    const customerName = customer.first_name && customer.last_name
        ? `${customer.first_name} ${customer.last_name}`
        : customer.email

    const { error: activityError } = await supabaseClient
        .from('customer_activities')
        .insert({
            organization_id: organizationId,
            customer_id: customer.id,
            type: 'sale',
            description: `Vendita registrata tramite assistente vocale - €${amount.toFixed(2)} (+${pointsEarned} punti)`,
            amount: amount,
            points: pointsEarned
        })

    if (activityError) {
        console.error('⚠️ Errore registrazione activity log:', activityError)
        // Non bloccare l'operazione, il log activity è secondario
    } else {
        console.log('✅ Activity log registrato con successo')
    }

    const result = {
        success: true,
        customer_name: customerName,
        amount: amount,
        points_earned: pointsEarned,
        previous_points: customerPoints,
        new_total_points: newTotalPoints,
        tier: tierName,
        tier_multiplier: tierMultiplier
    }

    console.log('🎉 recordSale completato:', result)

    return result
}
