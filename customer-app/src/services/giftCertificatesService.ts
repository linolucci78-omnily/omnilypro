import { supabase } from './supabase'

export interface GiftCertificate {
  id: string
  organization_id: string
  code: string
  qr_code_data?: string
  original_amount: number
  current_balance: number
  currency: string
  issued_at: string
  issue_type: 'purchased' | 'promotional' | 'redeemed_points' | 'refund' | 'gift'
  recipient_name?: string
  recipient_email?: string
  recipient_phone?: string
  personal_message?: string
  valid_from: string
  valid_until?: string
  status: 'active' | 'partially_used' | 'fully_used' | 'expired' | 'cancelled' | 'suspended'
  template_id?: string
  terms_conditions?: string
  notes?: string
  created_at: string
  updated_at: string
}

class GiftCertificatesService {
  /**
   * Carica i gift certificates di un cliente per una specifica organizzazione
   */
  async getCustomerGiftCertificates(
    organizationId: string,
    customerEmail?: string,
    customerPhone?: string
  ): Promise<GiftCertificate[]> {
    try {
      if (!customerEmail && !customerPhone) {
        console.warn('No customer email or phone provided')
        return []
      }

      let query = supabase
        .from('gift_certificates')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'partially_used']) // Solo certificati utilizzabili

      // Cerca per email o telefono
      if (customerEmail && customerPhone) {
        query = query.or(`recipient_email.eq.${customerEmail},recipient_phone.eq.${customerPhone}`)
      } else if (customerEmail) {
        query = query.eq('recipient_email', customerEmail)
      } else if (customerPhone) {
        query = query.eq('recipient_phone', customerPhone)
      }

      query = query.order('issued_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error loading gift certificates:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getCustomerGiftCertificates:', error)
      return []
    }
  }

  /**
   * Ottieni un gift certificate specifico per codice
   */
  async getByCode(code: string, organizationId: string): Promise<GiftCertificate | null> {
    try {
      const { data, error } = await supabase
        .from('gift_certificates')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        console.error('Error loading gift certificate by code:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getByCode:', error)
      return null
    }
  }
}

export const giftCertificatesService = new GiftCertificatesService()
