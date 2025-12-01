import { supabase } from '../lib/supabase'

export interface BusinessOwner {
  id: string
  name: string
  email: string
  phone?: string
  company: string
  businessType: string
  planType: 'free' | 'pro' | 'enterprise'
  planStatus: 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended'
  joinDate: string
  lastLogin?: string
  monthlyRevenue: number
  totalCustomers: number
  posEnabled: boolean
  supportTickets: number
  website?: string
  address?: string
  vatNumber?: string
  nextBilling?: string
  suspendReason?: string
  suspendedAt?: string
  suspendedBy?: string
}

export interface HistoryEvent {
  id: string
  type: 'plan_change' | 'suspension' | 'activation' | 'payment' | 'login' | 'settings' | 'email_sent'
  title: string
  description: string
  timestamp: string
  performedBy: string
  metadata?: Record<string, any>
}

export class BusinessOwnerService {
  /**
   * Carica tutte le organizzazioni con i loro proprietari
   */
  async getAllWithOwners(): Promise<any[]> {
    try {
      // Get all organizations with owner details from business_owners table
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          business_owners(id, first_name, last_name, email, phone, avatar_url),
          customers(count),
          customer_activities(monetary_value, created_at)
        `)
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      console.log('📊 Raw organizations data:', orgsData)

      // For each organization, enrich with owner details
      const enrichedOrgs = (orgsData || []).map((org) => {
        const owner = org.business_owners

        // Calculate monthly revenue
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const monthlyRevenue = (org.customer_activities || [])
          .filter((activity: any) => {
            const activityDate = new Date(activity.created_at)
            return activityDate >= thirtyDaysAgo && activity.monetary_value
          })
          .reduce((sum: number, activity: any) => sum + (activity.monetary_value || 0), 0)

        const ownerName = owner
          ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email?.split('@')[0] || 'Proprietario'
          : 'Proprietario'

        const ownerEmail = owner?.email || org.business_email || org.email

        console.log('🔍 Org:', org.name, '- Owner:', ownerName, '- Email:', ownerEmail)

        return {
          ...org,
          owner_name: ownerName,
          owner_email: ownerEmail,
          customer_count: org.customers?.[0]?.count || 0,
          monthly_revenue: monthlyRevenue,
          last_login: null // We don't have this info from business_owners table
        }
      })

      console.log('✅ Enriched organizations:', enrichedOrgs.length)

      return enrichedOrgs
    } catch (error) {
      console.error('Error fetching organizations with owners:', error)
      return []
    }
  }

  /**
   * Cambia il piano di subscription di un business owner
   */
  async changePlan(
    ownerId: string,
    newPlan: 'free' | 'pro' | 'enterprise',
    performedBy: string
  ): Promise<void> {
    try {
      // 1. Recupera l'organizzazione del business owner
      const { data: owner, error: fetchError } = await supabase
        .from('business_owners')
        .select('organization_id, name, email')
        .eq('id', ownerId)
        .single()

      if (fetchError) throw fetchError

      // 2. Aggiorna il piano nell'organizzazione
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          plan_type: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', owner.organization_id)

      if (updateError) throw updateError

      // 3. Registra l'evento nello storico
      await this.addHistoryEvent(ownerId, {
        type: 'plan_change',
        title: `Piano cambiato a ${newPlan.toUpperCase()}`,
        description: `Il piano subscription è stato modificato da ${performedBy}`,
        performedBy,
        metadata: {
          newPlan,
          organizationId: owner.organization_id
        }
      })

      // 4. Invia email di notifica
      await this.sendPlanChangeEmail(owner.email, owner.name, newPlan)

      console.log(`✅ Piano cambiato con successo per ${owner.email}`)
    } catch (error) {
      console.error('❌ Errore cambio piano:', error)
      throw new Error('Impossibile cambiare il piano. Riprova.')
    }
  }

  /**
   * Sospende un account business owner
   */
  async suspendAccount(
    ownerId: string,
    reason: string,
    duration: 'temporary' | 'permanent',
    performedBy: string
  ): Promise<void> {
    try {
      // 1. Recupera il business owner
      const { data: owner, error: fetchError } = await supabase
        .from('business_owners')
        .select('organization_id, name, email')
        .eq('id', ownerId)
        .single()

      if (fetchError) throw fetchError

      // 2. Aggiorna status a suspended
      const { error: updateOwnerError } = await supabase
        .from('business_owners')
        .update({
          status: 'suspended',
          suspend_reason: reason,
          suspended_at: new Date().toISOString(),
          suspended_by: performedBy
        })
        .eq('id', ownerId)

      if (updateOwnerError) throw updateOwnerError

      // 3. Disabilita l'organizzazione
      const { error: updateOrgError } = await supabase
        .from('organizations')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', owner.organization_id)

      if (updateOrgError) throw updateOrgError

      // 4. Registra evento
      await this.addHistoryEvent(ownerId, {
        type: 'suspension',
        title: `Account sospeso (${duration})`,
        description: `Account sospeso da ${performedBy}. Motivo: ${reason}`,
        performedBy,
        metadata: {
          reason,
          duration,
          organizationId: owner.organization_id
        }
      })

      // 5. Invia email notifica
      await this.sendSuspensionEmail(owner.email, owner.name, reason)

      console.log(`✅ Account sospeso con successo: ${owner.email}`)
    } catch (error) {
      console.error('❌ Errore sospensione account:', error)
      throw new Error('Impossibile sospendere l\'account. Riprova.')
    }
  }

  /**
   * Riattiva un account sospeso
   */
  async reactivateAccount(ownerId: string, performedBy: string): Promise<void> {
    try {
      const { data: owner, error: fetchError } = await supabase
        .from('business_owners')
        .select('organization_id, name, email')
        .eq('id', ownerId)
        .single()

      if (fetchError) throw fetchError

      // Aggiorna status
      const { error: updateOwnerError } = await supabase
        .from('business_owners')
        .update({
          status: 'active',
          suspend_reason: null,
          suspended_at: null,
          suspended_by: null
        })
        .eq('id', ownerId)

      if (updateOwnerError) throw updateOwnerError

      const { error: updateOrgError } = await supabase
        .from('organizations')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', owner.organization_id)

      if (updateOrgError) throw updateOrgError

      // Registra evento
      await this.addHistoryEvent(ownerId, {
        type: 'activation',
        title: 'Account riattivato',
        description: `Account riattivato da ${performedBy}`,
        performedBy,
        metadata: { organizationId: owner.organization_id }
      })

      console.log(`✅ Account riattivato: ${owner.email}`)
    } catch (error) {
      console.error('❌ Errore riattivazione account:', error)
      throw new Error('Impossibile riattivare l\'account. Riprova.')
    }
  }

  /**
   * Esporta dati del business owner in formato CSV
   */
  exportToCSV(owner: BusinessOwner): string {
    const headers = [
      'ID',
      'Nome',
      'Email',
      'Telefono',
      'Azienda',
      'Tipo Business',
      'Piano',
      'Status',
      'Data Iscrizione',
      'Ultimo Accesso',
      'Revenue Mensile',
      'Clienti Totali',
      'POS Abilitato',
      'Ticket Supporto',
      'Sito Web',
      'Indirizzo',
      'Partita IVA',
      'Prossima Fatturazione'
    ]

    const values = [
      owner.id,
      owner.name,
      owner.email,
      owner.phone || '',
      owner.company,
      owner.businessType,
      owner.planType,
      owner.planStatus,
      owner.joinDate,
      owner.lastLogin || '',
      owner.monthlyRevenue.toString(),
      owner.totalCustomers.toString(),
      owner.posEnabled ? 'Sì' : 'No',
      owner.supportTickets.toString(),
      owner.website || '',
      owner.address || '',
      owner.vatNumber || '',
      owner.nextBilling || ''
    ]

    return `${headers.join(',')}\n${values.map(v => `"${v}"`).join(',')}`
  }

  /**
   * Esporta multipli business owners in CSV
   */
  exportMultipleToCSV(owners: BusinessOwner[]): string {
    if (owners.length === 0) return ''

    const headers = [
      'ID',
      'Nome',
      'Email',
      'Azienda',
      'Piano',
      'Status',
      'Data Iscrizione',
      'Revenue Mensile',
      'Clienti Totali'
    ]

    const rows = owners.map(owner => [
      owner.id,
      owner.name,
      owner.email,
      owner.company,
      owner.planType,
      owner.planStatus,
      owner.joinDate,
      owner.monthlyRevenue.toString(),
      owner.totalCustomers.toString()
    ])

    return `${headers.join(',')}\n${rows.map(row => row.map(v => `"${v}"`).join(',')).join('\n')}`
  }

  /**
   * Trigger download del file CSV
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Invia email di reset password
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      // Genera token reset password
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Calcola data scadenza (24 ore)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Salva token nel database
      const { error: dbError } = await supabase
        .from('password_reset_tokens')
        .insert({
          email,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
          used: false
        })

      if (dbError) {
        console.error('❌ Errore salvataggio token:', dbError)
        throw new Error('Errore durante la creazione del token di reset.')
      }

      // Invia email tramite emailService
      const { emailService } = await import('./emailService')
      const result = await emailService.sendPasswordResetEmail(email, resetToken)

      if (!result.success) {
        throw new Error(result.error || 'Errore durante l\'invio email')
      }

      console.log(`✅ Email reset password inviata a: ${email}`)
    } catch (error) {
      console.error('❌ Errore invio reset password:', error)
      throw new Error('Impossibile inviare l\'email di reset. Riprova.')
    }
  }

  /**
   * Carica lo storico eventi di un business owner
   */
  async loadHistory(ownerId: string): Promise<HistoryEvent[]> {
    try {
      const { data, error } = await supabase
        .from('business_owner_history')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return (data || []).map(event => ({
        id: event.id,
        type: event.event_type,
        title: event.title,
        description: event.description,
        timestamp: event.created_at,
        performedBy: event.performed_by,
        metadata: event.metadata
      }))
    } catch (error) {
      console.error('❌ Errore caricamento storico:', error)
      // Return mock data se la tabella non esiste ancora
      return this.getMockHistory(ownerId)
    }
  }

  /**
   * Aggiunge un evento allo storico
   */
  private async addHistoryEvent(
    ownerId: string,
    event: Omit<HistoryEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('business_owner_history')
        .insert({
          owner_id: ownerId,
          event_type: event.type,
          title: event.title,
          description: event.description,
          performed_by: event.performedBy,
          metadata: event.metadata || {},
          created_at: new Date().toISOString()
        })

      if (error) {
        console.warn('⚠️ Tabella history non esiste, evento non registrato:', error)
      }
    } catch (error) {
      console.warn('⚠️ Errore registrazione evento storico:', error)
    }
  }

  /**
   * Invia email cambio piano
   */
  private async sendPlanChangeEmail(
    email: string,
    name: string,
    newPlan: string
  ): Promise<void> {
    // TODO: Implement email sending
    console.log(`📧 Email cambio piano da inviare a ${email}: piano ${newPlan}`)
  }

  /**
   * Invia email sospensione
   */
  private async sendSuspensionEmail(
    email: string,
    name: string,
    reason: string
  ): Promise<void> {
    // TODO: Implement email sending
    console.log(`📧 Email sospensione da inviare a ${email}: motivo ${reason}`)
  }

  /**
   * Mock history data (per demo/fallback)
   */
  private getMockHistory(ownerId: string): HistoryEvent[] {
    const now = new Date()
    return [
      {
        id: '1',
        type: 'activation',
        title: 'Account attivato',
        description: 'L\'account è stato attivato con successo',
        timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        performedBy: 'System',
        metadata: { source: 'auto' }
      },
      {
        id: '2',
        type: 'plan_change',
        title: 'Upgrade a PRO',
        description: 'Piano subscription aggiornato da FREE a PRO',
        timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        performedBy: 'Admin',
        metadata: { oldPlan: 'free', newPlan: 'pro' }
      },
      {
        id: '3',
        type: 'email_sent',
        title: 'Email di benvenuto inviata',
        description: 'Email di benvenuto inviata al business owner',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        performedBy: 'System',
        metadata: { template: 'welcome' }
      }
    ]
  }
}

export const businessOwnerService = new BusinessOwnerService()
