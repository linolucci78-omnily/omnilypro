
import { supabase } from '../lib/supabase'

export interface AIMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

class AIService {
    private isDemoMode: boolean = false // Default to false for real AI

    constructor() {
        // Force disable demo mode for now to test real API
        this.isDemoMode = false
        localStorage.removeItem('OMNY_DEMO_MODE')

        // Check environment variable or local storage for demo mode preference
        // const storedMode = localStorage.getItem('OMNY_DEMO_MODE')
        // if (storedMode !== null) {
        //     this.isDemoMode = storedMode === 'true'
        // }
    }

    setDemoMode(enabled: boolean) {
        this.isDemoMode = enabled
        localStorage.setItem('OMNY_DEMO_MODE', String(enabled))
    }

    getDemoMode(): boolean {
        return this.isDemoMode
    }

    async sendMessage(message: string, history: AIMessage[] = []): Promise<AIMessage> {
        console.log('🤖 sendMessage called. Demo Mode:', this.isDemoMode)

        // FORCE REAL API - Bypass demo check completely for debugging
        // if (this.isDemoMode) {
        //    return this.getMockResponse(message)
        // }

        try {
            // Get current user organization
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            // Fetch organization ID
            // For super admins or users with multiple orgs, get the first one
            // For users with no org, we'll pass null and use a global API key
            const { data: orgMembers, error: orgError } = await supabase
                .from('organizations_users')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1)

            console.log('🔍 DEBUG - orgMembers query result:', { orgMembers, orgError, userId: user.id })

            const organizationId = orgMembers?.[0]?.organization_id || null

            console.log('🔍 Organization ID:', organizationId || 'NONE (using global key)')

            // Prepare messages for API (limit history to last 10 to save tokens)
            const apiMessages = history.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }))

            // Add current message
            apiMessages.push({ role: 'user', content: message })

            const { data, error } = await supabase.functions.invoke('omny-chat', {
                body: {
                    messages: apiMessages,
                    organizationId: organizationId
                }
            })

            if (error) throw error

            // Check if response contains tool_use
            if (data.tool_use) {
                const { tool_use } = data

                // Format tool result as readable message
                let toolMessage = `🔧 **Azione eseguita: ${tool_use.name}**\n\n`

                if (tool_use.name === 'send_push_notification') {
                    const result = tool_use.result
                    toolMessage += `📱 Notifica preparata:\n`
                    toolMessage += `• Titolo: "${result.title}"\n`
                    toolMessage += `• Messaggio: "${result.message}"\n`
                    toolMessage += `• Target: ${result.target_segment}\n`
                    toolMessage += `• Destinatari: ${result.target_count} clienti\n\n`

                    if (data.requires_confirmation) {
                        toolMessage += `⚠️ Conferma richiesta per inviare la notifica.`
                    }
                } else if (tool_use.name === 'get_sales_analytics') {
                    const result = tool_use.result
                    toolMessage += `📊 Analisi ${result.date_range}:\n`
                    toolMessage += `📅 Periodo: ${result.period}\n\n`

                    if (result.data.revenue) {
                        toolMessage += `💰 Fatturato: ${result.data.revenue}\n`
                    }
                    if (result.data.transactions) {
                        toolMessage += `🛒 Transazioni: ${result.data.transactions}\n`
                    }
                    if (result.data.avg_ticket) {
                        toolMessage += `🎫 Scontrino medio: ${result.data.avg_ticket}\n`
                    }
                } else if (tool_use.name === 'get_customer_info') {
                    const result = tool_use.result
                    if (result.success) {
                        const c = result.customer
                        toolMessage += `👤 **${c.name}**\n\n`
                        toolMessage += `📧 Email: ${c.email}\n`
                        toolMessage += `📞 Telefono: ${c.phone || 'N/A'}\n`
                        toolMessage += `⭐ Punti: ${c.points}\n`
                        toolMessage += `🏆 Tier: ${c.tier}\n`
                        toolMessage += `💰 Spesa totale: €${c.total_spent}\n`
                        toolMessage += `🔄 Visite: ${c.visits}\n`
                    } else {
                        toolMessage += `❌ ${result.error}`
                    }
                } else if (tool_use.name === 'search_customers') {
                    const result = tool_use.result
                    toolMessage += `🔍 [v2] Trovati ${result.count} clienti:\n\n`
                    result.customers.slice(0, 5).forEach((c: any, i: number) => {
                        toolMessage += `${i + 1}. **${c.name}** (${c.tier})\n`
                        toolMessage += `   📧 ${c.email} | ⭐ ${c.points} punti\n`
                    })
                    if (result.count > 5) {
                        toolMessage += `\n... e altri ${result.count - 5} clienti`
                    }
                } else if (tool_use.name === 'get_top_customers') {
                    const result = tool_use.result
                    toolMessage += `🏆 Top ${result.count} clienti per ${result.metric === 'points' ? 'punti' : 'spesa'}:\n\n`
                    result.customers.forEach((c: any, i: number) => {
                        const value = result.metric === 'points' ? `${c.points} punti` : `€${c.total_spent}`
                        toolMessage += `${i + 1}. **${c.name}** - ${value} (${c.tier})\n`
                    })
                } else if (tool_use.name === 'assign_bonus_points') {
                    const result = tool_use.result
                    if (result.success) {
                        toolMessage += `✅ Punti assegnati con successo!\n\n`
                        toolMessage += `👤 Cliente: ${result.customer_name}\n`
                        toolMessage += `➕ Punti aggiunti: ${result.points_added}\n`
                        toolMessage += `⭐ Nuovo totale: ${result.new_total} punti\n`
                        toolMessage += `📝 Motivo: ${result.reason}`
                    } else {
                        toolMessage += `❌ ${result.error}`
                    }
                } else if (tool_use.name === 'register_sale') {
                    const result = tool_use.result
                    if (result.success) {
                        toolMessage += `✅ Vendita registrata con successo!\n\n`
                        toolMessage += `👤 Cliente: ${result.customer_name}\n`
                        toolMessage += `💰 Importo: €${result.amount}\n`
                        toolMessage += `➕ Punti guadagnati: ${result.points_earned}\n`
                        toolMessage += `⭐ Nuovo totale punti: ${result.new_total_points}`
                    } else {
                        toolMessage += `❌ ${result.error}`
                    }
                }

                return {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: toolMessage,
                    timestamp: new Date(),
                    tool_use: tool_use // Keep tool data for potential follow-up actions
                }
            }

            // Regular text response
            return {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date()
            }

        } catch (error: any) {
            console.error('AI Service Error:', error)

            // More specific fallback messages to help debugging
            let errorMessage = "Mi dispiace, ho avuto un problema di connessione."

            if (error.message?.includes('User not authenticated')) {
                errorMessage = "Non sei autenticato. Effettua il login per usare l'AI."
            } else if (error.message?.includes('No organization found')) {
                errorMessage = "Non ho trovato nessuna organizzazione associata al tuo account."
            } else {
                errorMessage = `Errore di connessione: ${error.message || 'Sconosciuto'}. Sto usando la modalità offline.`
            }

            // Fallback to mock if API fails, but append error info
            const mockResponse = await this.getMockResponse(message)
            return {
                ...mockResponse,
                content: `${errorMessage}\n\n${mockResponse.content}`
            }
        }
    }

    private async getMockResponse(userMessage: string): Promise<AIMessage> {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500))

        const lowerMsg = userMessage.toLowerCase()
        let responseContent = ''

        if (lowerMsg.includes('analizza') || lowerMsg.includes('andamento') || lowerMsg.includes('token')) {
            responseContent = `### 📊 Analisi OMNY Token
Ho analizzato i dati on-chain delle ultime 24 ore:

*   **Prezzo**: €0.10 (+5.2%)
*   **Volume**: €45,230
*   **Nuovi Holder**: +12

Il trend è **rialzista**. Consiglio di mantenere l'attuale strategia di reward per i nuovi utenti.`
        } else if (lowerMsg.includes('campagna') || lowerMsg.includes('marketing') || lowerMsg.includes('crea')) {
            responseContent = `### 🚀 Proposta Campagna Marketing
Basandomi sui dati dei tuoi clienti, ecco una campagna ottimizzata:

**Nome**: "Ritorno di Primavera"
**Target**: Clienti inattivi da > 30 giorni
**Canale**: Email + Notifica Push
**Offerta**: 50 OMNY Bonus alla prossima visita

Vuoi che proceda con la bozza della mail?`
        } else if (lowerMsg.includes('ciao') || lowerMsg.includes('chi sei')) {
            responseContent = `Ciao! Sono **Omny Assistant**, la tua intelligenza artificiale dedicata.

Posso aiutarti a:
1.  Analizzare i dati finanziari
2.  Creare campagne marketing
3.  Gestire la community
4.  Ottimizzare i costi

Cosa vuoi fare oggi?`
        } else {
            responseContent = `Ho ricevuto la tua richiesta: "${userMessage}".

In modalità demo, posso rispondere specificamente a domande su:
*   Analisi token/dati
*   Creazione campagne
*   Info generali

Prova a chiedermi "Analizza il token" o "Crea una campagna".`
        }

        return {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
        }
    }
}

export const aiService = new AIService()
