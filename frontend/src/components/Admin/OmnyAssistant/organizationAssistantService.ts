import { supabase } from '../../../lib/supabase';
import { AssistantState } from './AssistantVisualizer';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class OrganizationAssistantService {
  private conversationHistory: AssistantMessage[] = [];
  private onStateChange?: (state: AssistantState) => void;
  private onError?: (error: string) => void;
  private onMessage?: (message: AssistantMessage) => void;
  private organizationId: string | null = null;

  constructor(
    onStateChange?: (state: AssistantState) => void,
    onError?: (error: string) => void,
    onMessage?: (message: AssistantMessage) => void
  ) {
    this.onStateChange = onStateChange;
    this.onError = onError;
    this.onMessage = onMessage;
  }

  async connect(providedOrgId?: string | null) {
    try {
      this.onStateChange?.(AssistantState.CONNECTING);

      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato');
      }

      let organizationId = providedOrgId;

      // If no organizationId provided, try to get it from user's memberships
      if (!organizationId) {
        const { data: orgMembers } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        organizationId = orgMembers?.[0]?.organization_id || null;
      }

      if (!organizationId) {
        throw new Error('Organizzazione non trovata');
      }

      // Salva l'organizationId per usarlo nei messaggi successivi
      this.organizationId = organizationId;

      console.log('✅ Connected to Omny Assistant for organization:', organizationId);
      this.onStateChange?.(AssistantState.LISTENING);

      return { success: true, organizationId };
    } catch (err: any) {
      console.error('Connection error:', err);
      this.onStateChange?.(AssistantState.ERROR);
      this.onError?.(err.message || 'Impossibile connettersi');
      throw err;
    }
  }

  async sendTextMessage(text: string) {
    try {
      console.log('📤 Sending message:', text);
      this.onStateChange?.(AssistantState.THINKING);

      // Add user message to history
      const userMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date()
      };

      this.conversationHistory.push(userMessage);
      this.onMessage?.(userMessage);

      // Use saved organization ID
      console.log('🏢 Organization ID:', this.organizationId);

      // Prepare messages for API (limit history to last 10)
      const apiMessages = this.conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('📨 Calling omny-chat with:', { messages: apiMessages, organizationId: this.organizationId });

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('omny-chat', {
        body: {
          messages: apiMessages,
          organizationId: this.organizationId
        }
      });

      console.log('📥 Response from omny-chat:', { data, error });

      if (error) throw error;

      // Process response
      let responseText = '';

      // Check if response contains tool_use
      if (data.tool_use) {
        const { tool_use } = data;
        responseText = this.formatToolResponse(tool_use);
      } else {
        // Claude risponde con 'content' non 'message'
        responseText = data.content || data.message || 'Nessuna risposta';
      }

      console.log('💬 Response text:', responseText);

      // Add assistant response to history
      const assistantMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      this.conversationHistory.push(assistantMessage);
      this.onMessage?.(assistantMessage);
      this.onStateChange?.(AssistantState.LISTENING);

      console.log('✅ Message sent successfully');

      return assistantMessage;
    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      this.onStateChange?.(AssistantState.ERROR);
      this.onError?.(err.message || 'Errore durante l\'invio del messaggio');
      throw err;
    }
  }

  private formatToolResponse(tool_use: any): string {
    let message = `**${tool_use.name}**\n\n`;

    switch (tool_use.name) {
      case 'get_sales_analytics': {
        const result = tool_use.result;
        message += `**Analisi Vendite** (${result.date_range})\n`;
        message += `Periodo: ${result.period}\n\n`;
        message += `Fatturato: €${result.total_revenue?.toFixed(2) || '0.00'}\n`;
        message += `Transazioni: ${result.transaction_count || 0}\n`;
        message += `Scontrino medio: €${result.average_transaction?.toFixed(2) || '0.00'}\n`;

        if (result.breakdown && result.breakdown.length > 0) {
          message += `\n**Trend giornaliero:**\n`;
          result.breakdown.forEach((day: any) => {
            message += `• ${day.date}: €${day.revenue?.toFixed(2)} (${day.count} transazioni)\n`;
          });
        }
        break;
      }

      case 'get_customer_info': {
        const result = tool_use.result;
        message += `**${result.first_name} ${result.last_name}**\n`;
        message += `Email: ${result.email}\n`;
        message += `Tier: ${result.tier}\n`;
        message += `Punti: ${result.points}\n`;
        message += `Spesa totale: €${result.total_spent?.toFixed(2) || '0.00'}\n`;
        message += `Visite: ${result.total_visits || 0}\n`;
        break;
      }

      case 'search_customers': {
        const result = tool_use.result;
        message += `**Trovati ${result.total_count} clienti**\n\n`;

        if (result.customers && result.customers.length > 0) {
          result.customers.forEach((customer: any, index: number) => {
            message += `${index + 1}. ${customer.first_name} ${customer.last_name}\n`;
            message += `   Email: ${customer.email} | Tier: ${customer.tier} | Punti: ${customer.points}\n`;
          });
        }
        break;
      }

      case 'get_top_customers': {
        const result = tool_use.result;
        message += `**Top ${result.customers.length} Clienti**\n`;
        message += `Ordinati per: ${result.sort_by}\n\n`;

        result.customers.forEach((customer: any, index: number) => {
          message += `${index + 1}. ${customer.first_name} ${customer.last_name}\n`;
          message += `   Punti: ${customer.points} | Totale speso: €${customer.total_spent?.toFixed(2)}\n`;
        });
        break;
      }

      case 'assign_bonus_points': {
        const result = tool_use.result;
        message += `**Punti assegnati con successo**\n\n`;
        message += `Cliente: ${result.customer_name}\n`;
        message += `Punti bonus: +${result.points_assigned}\n`;
        message += `Motivo: ${result.reason}\n`;
        message += `Nuovo totale: ${result.new_total} punti\n`;
        break;
      }

      case 'send_push_notification': {
        const result = tool_use.result;
        message += `**Notifica Preparata**\n\n`;
        message += `Titolo: "${result.title}"\n`;
        message += `Messaggio: "${result.message}"\n`;
        message += `Target: ${result.target_segment}\n`;
        message += `Destinatari: ${result.target_count} clienti\n`;
        break;
      }

      case 'record_sale': {
        const result = tool_use.result;
        if (result.success) {
          message += `**Vendita Registrata**\n\n`;
          message += `Cliente: ${result.customer_name}\n`;
          message += `Importo: €${result.amount.toFixed(2)}\n`;
          message += `Punti guadagnati: +${result.points_earned}\n`;
          if (result.tier_multiplier > 1) {
            message += `Moltiplicatore ${result.tier}: ${result.tier_multiplier}x\n`;
          }
          message += `Punti totali: ${result.new_total_points}\n`;
        } else {
          message += `**Errore**\n\n`;
          message += `${result.error}\n`;
        }
        break;
      }

      default:
        message += JSON.stringify(tool_use.result, null, 2);
    }

    return message;
  }

  disconnect() {
    this.conversationHistory = [];
    this.onStateChange?.(AssistantState.IDLE);
  }

  getHistory(): AssistantMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}
