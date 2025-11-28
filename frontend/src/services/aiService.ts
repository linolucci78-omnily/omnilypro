

export interface AIMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

class AIService {
    private isDemoMode: boolean = true

    constructor() {
        // Check environment variable or local storage for demo mode preference
        const storedMode = localStorage.getItem('OMNY_DEMO_MODE')
        if (storedMode !== null) {
            this.isDemoMode = storedMode === 'true'
        }
    }

    setDemoMode(enabled: boolean) {
        this.isDemoMode = enabled
        localStorage.setItem('OMNY_DEMO_MODE', String(enabled))
    }

    getDemoMode(): boolean {
        return this.isDemoMode
    }

    async sendMessage(message: string): Promise<AIMessage> {
        if (this.isDemoMode) {
            return this.getMockResponse(message)
        }

        // Real API implementation would go here
        throw new Error('Real AI API not configured yet. Please enable Demo Mode.')
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
