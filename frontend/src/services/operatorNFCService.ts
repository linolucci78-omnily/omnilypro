import { supabase } from '../lib/supabase'

export interface OperatorNFCCard {
  id: string
  user_id: string
  organization_id: string
  nfc_uid: string
  operator_name: string
  encrypted_password?: string
  is_active: boolean
  last_used_at?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface OperatorAuthResult {
  user_id: string
  user_email: string
  operator_name: string
  organization_id: string
  card_id: string
  encrypted_password: string
}

export interface OperatorNFCLoginLog {
  id: string
  operator_card_id?: string
  user_id?: string
  organization_id?: string
  nfc_uid: string
  success: boolean
  ip_address?: string
  user_agent?: string
  created_at: string
}

/**
 * Service per gestire le tessere NFC degli operatori
 */
export const operatorNFCService = {
  /**
   * Autentica un operatore tramite NFC UID
   */
  async authenticateViaNFC(nfcUid: string): Promise<OperatorAuthResult | null> {
    try {
      const { data, error } = await supabase
        .rpc('authenticate_operator_via_nfc', { p_nfc_uid: nfcUid })
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) {
        console.error('Error authenticating via NFC:', error)
        return null
      }

      // data will be null if no card found (0 rows)
      if (!data) {
        console.log('ℹ️ No operator card found for UID:', nfcUid)
        return null
      }

      console.log('✅ Operator authenticated:', data)
      return data
    } catch (error) {
      console.error('Exception in authenticateViaNFC:', error)
      return null
    }
  },

  /**
   * Ottiene tutte le tessere operatore di un'organizzazione
   */
  async getAll(organizationId: string): Promise<OperatorNFCCard[]> {
    const { data, error } = await supabase
      .from('operator_nfc_cards')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching operator cards:', error)
      throw error
    }

    return data || []
  },

  /**
   * Ottiene le tessere attive di un'organizzazione
   */
  async getActive(organizationId: string): Promise<OperatorNFCCard[]> {
    const { data, error } = await supabase
      .from('operator_nfc_cards')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active operator cards:', error)
      throw error
    }

    return data || []
  },

  /**
   * Ottiene una tessera per UID
   */
  async getByNFCUid(nfcUid: string): Promise<OperatorNFCCard | null> {
    const { data, error } = await supabase
      .from('operator_nfc_cards')
      .select('*')
      .eq('nfc_uid', nfcUid)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('Error fetching operator card by UID:', error)
      throw error
    }

    return data
  },

  /**
   * Ottiene le tessere di un operatore specifico
   */
  async getByUserId(userId: string, organizationId: string): Promise<OperatorNFCCard[]> {
    const { data, error } = await supabase
      .from('operator_nfc_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching operator cards by user:', error)
      throw error
    }

    return data || []
  },

  /**
   * Crea una nuova tessera operatore
   */
  async create(card: {
    user_id: string
    organization_id: string
    nfc_uid: string
    operator_name: string
    password: string
    created_by?: string
  }): Promise<OperatorNFCCard> {
    // Prima controlla se esiste già una tessera con questo UID
    const existing = await this.getByNFCUid(card.nfc_uid)
    if (existing) {
      throw new Error('Questa tessera è già associata ad un operatore')
    }

    // Simple base64 encoding for password obfuscation
    // TODO: This should be properly encrypted on the server side with PostgreSQL encryption
    const encryptedPassword = btoa(card.password)

    const { data, error } = await supabase
      .from('operator_nfc_cards')
      .insert({
        user_id: card.user_id,
        organization_id: card.organization_id,
        nfc_uid: card.nfc_uid,
        operator_name: card.operator_name,
        encrypted_password: encryptedPassword,
        created_by: card.created_by,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating operator card:', error)
      throw error
    }

    return data
  },

  /**
   * Aggiorna una tessera operatore
   */
  async update(id: string, updates: Partial<OperatorNFCCard>): Promise<OperatorNFCCard> {
    const { data, error } = await supabase
      .from('operator_nfc_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating operator card:', error)
      throw error
    }

    return data
  },

  /**
   * Disattiva una tessera operatore
   */
  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('operator_nfc_cards')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating operator card:', error)
      throw error
    }
  },

  /**
   * Riattiva una tessera operatore
   */
  async activate(id: string): Promise<void> {
    const { error } = await supabase
      .from('operator_nfc_cards')
      .update({ is_active: true })
      .eq('id', id)

    if (error) {
      console.error('Error activating operator card:', error)
      throw error
    }
  },

  /**
   * Elimina una tessera operatore
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('operator_nfc_cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting operator card:', error)
      throw error
    }
  },

  /**
   * Registra un tentativo di login NFC
   */
  async logLogin(log: {
    operator_card_id?: string
    user_id?: string
    organization_id?: string
    nfc_uid: string
    success: boolean
    ip_address?: string
    user_agent?: string
  }): Promise<void> {
    const { error } = await supabase
      .from('operator_nfc_login_logs')
      .insert(log)

    if (error) {
      console.error('Error logging NFC login:', error)
      // Non lanciare errore, il log non deve bloccare il login
    }
  },

  /**
   * Ottiene i log di accesso per un'organizzazione
   */
  async getLogs(organizationId: string, limit: number = 100): Promise<OperatorNFCLoginLog[]> {
    const { data, error } = await supabase
      .from('operator_nfc_login_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching login logs:', error)
      throw error
    }

    return data || []
  }
}
