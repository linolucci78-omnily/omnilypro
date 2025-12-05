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
  private onToolResult?: (toolName: string, result: any) => void;
  private organizationId: string | null = null;

  constructor(
    onStateChange?: (state: AssistantState) => void,
    onError?: (error: string) => void,
    onMessage?: (message: AssistantMessage) => void,
    onToolResult?: (toolName: string, result: any) => void
  ) {
    this.onStateChange = onStateChange;
    this.onError = onError;
    this.onMessage = onMessage;
    this.onToolResult = onToolResult;
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

        // Notify listener about tool result (for UI effects)
        this.onToolResult?.(tool_use.name, tool_use.result);
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
    let message = '';

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
        const name = result.customer.first_name ? `${result.customer.first_name} ${result.customer.last_name}` : result.customer.name;
        message += `**${name}**\n`;
        message += `Email: ${result.customer.email}\n`;
        message += `Tier: ${result.customer.tier}\n`;
        message += `Punti: ${result.customer.points}\n`;
        message += `Spesa totale: €${result.customer.total_spent?.toFixed(2) || '0.00'}\n`;
        message += `Visite: ${result.customer.visits || 0}\n`;
        break;
      }

      case 'search_customers': {
        const result = tool_use.result;
        message += `**Trovati ${result.count} clienti**\n\n`;

        if (result.customers && result.customers.length > 0) {
          result.customers.forEach((customer: any, index: number) => {
            const name = customer.first_name ? `${customer.first_name} ${customer.last_name}` : customer.name;
            message += `${index + 1}. **${name}**\n`;
            message += `   Email: ${customer.email} | Tier: ${customer.tier} | Punti: ${customer.points}\n`;
          });
        }
        break;
      }

      case 'get_customer_transactions': {
        const result = tool_use.result;
        if (result.success) {
          message += `**Storico Transazioni (${result.count})**\n\n`;
          if (result.transactions && result.transactions.length > 0) {
            result.transactions.forEach((t: any) => {
              message += `• ${t.date}: **€${t.amount}** (${t.points} punti)\n`;
              message += `  _${t.description}_\n`;
            });
          } else {
            message += `Nessuna transazione trovata.\n`;
          }
        } else {
          message += `❌ Errore: ${result.error}\n`;
        }
        break;
      }

      case 'create_coupon': {
        const result = tool_use.result;
        if (result.success) {
          message += `**✅ Coupon Creato!**\n\n`;
          message += `Codice: **${result.coupon_code}**\n`;
          message += `Sconto: ${result.discount}\n`;
          message += `Scadenza: ${result.valid_until}\n`;
        } else {
          message += `❌ Errore creazione coupon: ${result.error}\n`;
        }
        break;
      }

      case 'get_churn_risk_customers': {
        const result = tool_use.result;
        if (result.success) {
          message += `**⚠️ Clienti a Rischio (${result.count})**\n`;
          message += `Assenti da oltre ${result.days_threshold} giorni:\n\n`;

          if (result.customers && result.customers.length > 0) {
            result.customers.forEach((c: any, index: number) => {
              message += `${index + 1}. **${c.name}**\n`;
              message += `   Assente da: ${c.days_absent} giorni (${c.last_visit})\n`;
              message += `   Email: ${c.email}\n`;
            });
          } else {
            message += `Nessun cliente a rischio trovato! 🎉\n`;
          }
        } else {
          message += `❌ Errore: ${result.error}\n`;
        }
        break;
      }

      case 'get_birthday_customers': {
        const result = tool_use.result;
        // The tool returns a pre-formatted message - use it directly
        message = result.message || result.error || 'Errore sconosciuto';
        break;
      }

      case 'get_top_customers': {
        const result = tool_use.result;
        message += `**Top ${result.count} Clienti**\n`;
        message += `Ordinati per: ${result.metric === 'points' ? 'punti' : 'spesa'}\n\n`;

        result.customers.forEach((customer: any, index: number) => {
          const name = customer.first_name ? `${customer.first_name} ${customer.last_name}` : customer.name;
          message += `${index + 1}. **${name}**\n`;
          const value = result.metric === 'points' ? `${customer.points} punti` : `€${customer.total_spent?.toFixed(2)}`;
          message += `   ${value} | Tier: ${customer.tier}\n`;
        });
        break;
      }

      case 'assign_bonus_points': {
        const result = tool_use.result;
        if (result.success) {
          message += `**✅ Punti assegnati con successo**\n\n`;
          message += `Cliente: ${result.customer_name}\n`;
          message += `Punti bonus: +${result.points_added}\n`;
          message += `Motivo: ${result.reason}\n`;
          message += `Nuovo totale: ${result.new_total} punti\n`;
        } else {
          message += `❌ ${result.error}\n`;
        }
        break;
      }

      case 'register_sale': {
        const result = tool_use.result;
        if (result.success) {
          message += `**✅ Vendita Registrata**\n\n`;
          message += `Cliente: ${result.customer_name}\n`;
          message += `Importo: €${result.amount}\n`;
          message += `Punti guadagnati: +${result.points_earned}\n`;
          message += `Nuovo totale: ${result.new_total_points} punti\n`;
        } else {
          message += `**❌ Errore**\n\n`;
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
