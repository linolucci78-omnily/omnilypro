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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { messages, organizationId } = await req.json()

        console.log('📥 Request received. Organization ID:', organizationId || 'NULL')

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
        const systemPrompt = `Sei Omny, assistente AI per OMNILY PRO.

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
                name: "record_sale",
                description: "Registra una nuova vendita per un cliente. Usa quando l'utente vuole registrare una vendita dicendo ad esempio 'registra 25 euro per Mario Rossi' o 'nuova vendita di 30 euro per cliente X'.",
                input_schema: {
                    type: "object",
                    properties: {
                        customer_name: {
                            type: "string",
                            description: "Nome completo del cliente (es. 'Mario Rossi')"
                        },
                        amount: {
                            type: "number",
                            description: "Importo della vendita in euro"
                        }
                    },
                    required: ["customer_name", "amount"]
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
                    toolResult = await executeTool(toolUse.name, toolUse.input, supabaseClient, organizationId)
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
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

// ============================================================================
// TOOL EXECUTION FUNCTIONS
// ============================================================================

async function executeTool(toolName: string, input: any, supabaseClient: any, organizationId: string | null) {
    console.log(`🔧 Executing tool: ${toolName}`)

    switch (toolName) {
        case 'send_push_notification':
            return await sendPushNotification(input, supabaseClient, organizationId)

        case 'get_sales_analytics':
            return await getSalesAnalytics(input, supabaseClient, organizationId)

        case 'get_customer_info':
            return await getCustomerInfo(input, supabaseClient, organizationId)

        case 'search_customers':
            return await searchCustomers(input, supabaseClient, organizationId)

        case 'get_top_customers':
            return await getTopCustomers(input, supabaseClient, organizationId)

        case 'assign_bonus_points':
            return await assignBonusPoints(input, supabaseClient, organizationId)

        case 'record_sale':
            return await recordSale(input, supabaseClient, organizationId)

        default:
            throw new Error(`Unknown tool: ${toolName}`)
    }
}

async function sendPushNotification(input: any, supabaseClient: any, organizationId: string | null) {
    const { title, message, target } = input

    // Get target users based on segment
    let targetUsers: string[] = []

    if (target === 'all') {
        const { data: users } = await supabaseClient
            .from('customers')
            .select('id')
            .eq('organization_id', organizationId)

        targetUsers = users?.map((u: any) => u.id) || []
    } else if (target.startsWith('tier_')) {
        const tierName = target.replace('tier_', '')
        const { data: users } = await supabaseClient
            .from('customers')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('tier', tierName)

        targetUsers = users?.map((u: any) => u.id) || []
    } else if (target === 'inactive_30d') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: users } = await supabaseClient
            .from('customers')
            .select('id')
            .eq('organization_id', organizationId)
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

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (date_range) {
        case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
        case 'yesterday':
            startDate.setDate(now.getDate() - 1)
            startDate.setHours(0, 0, 0, 0)
            now.setDate(now.getDate() - 1)
            now.setHours(23, 59, 59, 999)
            break
        case 'last_7_days':
            startDate.setDate(now.getDate() - 7)
            break
        case 'last_30_days':
            startDate.setDate(now.getDate() - 30)
            break
    }

    const result: any = {}

    // Get transactions
    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('amount, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())

    if (metrics.includes('revenue')) {
        const total = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0
        result.revenue = `€${total.toFixed(2)}`
    }

    if (metrics.includes('transactions')) {
        result.transactions = transactions?.length || 0
    }

    if (metrics.includes('avg_ticket')) {
        const total = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0
        const count = transactions?.length || 1
        result.avg_ticket = `€${(total / count).toFixed(2)}`
    }

    if (metrics.includes('top_products')) {
        // This would require a products table join - for now return placeholder
        result.top_products = ['Prodotto A', 'Prodotto B', 'Prodotto C']
    }

    return {
        success: true,
        date_range,
        period: `${startDate.toLocaleDateString('it-IT')} - ${now.toLocaleDateString('it-IT')}`,
        data: result
    }
}

async function getCustomerInfo(input: any, supabaseClient: any, organizationId: string | null) {
    const { customer_id } = input

    // Try to find by ID or email
    let query = supabaseClient
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)

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
            name: `${customer.first_name} ${customer.last_name}`,
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

async function searchCustomers(input: any, supabaseClient: any, organizationId: string | null) {
    const { query, tier, inactive_days, limit = 10 } = input

    let dbQuery = supabaseClient
        .from('customers')
        .select('id, first_name, last_name, email, points, tier, last_visit')
        .eq('organization_id', organizationId)
        .limit(limit)

    // Search by name or email
    if (query) {
        dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
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

    const { data: customers } = await dbQuery

    return {
        success: true,
        count: customers?.length || 0,
        customers: customers?.map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            email: c.email,
            points: c.points || 0,
            tier: c.tier || 'bronze',
            last_visit: c.last_visit
        })) || []
    }
}

async function getTopCustomers(input: any, supabaseClient: any, organizationId: string | null) {
    const { metric, limit = 10 } = input

    const orderBy = metric === 'points' ? 'points' : 'total_spent'

    const { data: customers } = await supabaseClient
        .from('customers')
        .select('id, first_name, last_name, email, points, total_spent, tier')
        .eq('organization_id', organizationId)
        .order(orderBy, { ascending: false })
        .limit(limit)

    return {
        success: true,
        metric,
        count: customers?.length || 0,
        customers: customers?.map(c => ({
            name: `${c.first_name} ${c.last_name}`,
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
    const { data: customer } = await supabaseClient
        .from('customers')
        .select('points, first_name, last_name')
        .eq('id', customer_id)
        .eq('organization_id', organizationId)
        .single()

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
        .from('transactions')
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

    // Search for customer by name - be more strict with matching
    const nameParts = customer_name.trim().split(/\s+/) // Use regex to handle multiple spaces
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
    const { data: allCustomers, error: debugError } = await supabaseClient
        .from('customers')
        .select('id, first_name, last_name, email, points, total_spent')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20)

    console.log('📋 DEBUG - Tutti i clienti nell\'organizzazione:', JSON.stringify(allCustomers, null, 2))
    if (debugError) {
        console.error('📋 DEBUG - Errore query:', debugError)
    }

    // Try exact match first
    if (lastName) {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('organization_id', organizationId)
            .ilike('first_name', firstName)
            .ilike('last_name', lastName)
            .limit(1)

        console.log('🔍 Tentativo 1 (exact match):', { data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // If not found, try searching in both first_name and last_name with wildcards
    if (!customer) {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('organization_id', organizationId)
            .or(`first_name.ilike.%${customer_name}%,last_name.ilike.%${customer_name}%`)
            .limit(1)

        console.log('🔍 Tentativo 2 (wildcard search):', { data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // If still not found, try searching by firstName only
    if (!customer && firstName) {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('organization_id', organizationId)
            .ilike('first_name', `%${firstName}%`)
            .limit(1)

        console.log('🔍 Tentativo 3 (first name only):', { data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // If still not found, try searching by lastName only
    if (!customer && lastName) {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('organization_id', organizationId)
            .ilike('last_name', `%${lastName}%`)
            .limit(1)

        console.log('🔍 Tentativo 4 (last name only):', { data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // If still not found, try searching in email (for customers without first/last name)
    if (!customer) {
        // Remove spaces and search in email
        const nameWithoutSpaces = customer_name.toLowerCase().replace(/\s+/g, '')

        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('organization_id', organizationId)
            .ilike('email', `%${nameWithoutSpaces}%`)
            .limit(1)

        console.log('🔍 Tentativo 5 (email search):', { query: nameWithoutSpaces, data, error })
        if (data && data.length > 0) {
            customer = data[0]
        }
    }

    // Last resort: try searching each word in email separately
    if (!customer && nameParts.length > 0) {
        for (const part of nameParts) {
            if (part.length < 3) continue // Skip very short parts

            const { data, error } = await supabaseClient
                .from('customers')
                .select('*')
                .eq('organization_id', organizationId)
                .ilike('email', `%${part.toLowerCase()}%`)
                .limit(1)

            console.log(`🔍 Tentativo 6 (email part "${part}"):`, { data, error })
            if (data && data.length > 0) {
                customer = data[0]
                break
            }
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
        name: customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer.email
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
        .from('transactions')
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

    const result = {
        success: true,
        customer_name: customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer.email,
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
