import { supabase } from '../lib/supabase'

export interface OperatorNFCCard {
  id: string
  user_id?: string
  staff_id?: string
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
  user_id?: string
  staff_id?: string
  user_email?: string
  operator_name: string
  organization_id: string
  card_id: string
  encrypted_password?: string
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
   * @param nfcUid - UID della tessera NFC
   * @returns OperatorAuthResult se autenticato, null altrimenti
   *
   * 🔑 IMPORTANTE: La card NFC funziona come un ID personale.
   * Ti porta alla TUA organizzazione (quella sulla card) da qualsiasi POS,
   * non è limitata a specifici dispositivi POS.
   */
  async authenticateViaNFC(nfcUid: string): Promise<OperatorAuthResult | null> {
    try {
      const { data, error } = await supabase
        .rpc('authenticate_operator_via_nfc', {
          p_nfc_uid: nfcUid
        })
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
      console.log('🔑 Card organization:', data.organization_id)
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
    user_id?: string
    staff_id?: string
    organization_id: string
    nfc_uid: string
    operator_name: string
    password?: string
    created_by?: string
  }): Promise<OperatorNFCCard> {
    // Validazione: almeno uno tra user_id e staff_id deve essere presente
    if (!card.user_id && !card.staff_id) {
      throw new Error('Deve essere specificato user_id o staff_id')
    }

    // Prima controlla se esiste già una tessera con questo UID
    const existing = await this.getByNFCUid(card.nfc_uid)
    if (existing) {
      throw new Error('Questa tessera è già associata ad un operatore')
    }

    // Simple base64 encoding for password obfuscation (opzionale per operatori senza account)
    const encryptedPassword = card.password ? btoa(card.password) : null

    // SOLUZIONE: Usa una RPC function per fare tutto in una transazione atomica
    // Questo evita race conditions e violazioni del constraint UNIQUE
    console.log('🔄 Creazione tessera operatore con disattivazione automatica delle precedenti...')

    const { data, error } = await supabase.rpc('create_operator_nfc_card', {
      p_organization_id: card.organization_id,
      p_nfc_uid: card.nfc_uid,
      p_operator_name: card.operator_name,
      p_user_id: card.user_id || null,
      p_staff_id: card.staff_id || null,
      p_encrypted_password: encryptedPassword,
      p_created_by: card.created_by || null
    })

    if (error) {
      console.error('Error creating operator card:', error)

      // Se la RPC non esiste, fallback al metodo vecchio (ma con retry)
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.warn('⚠️ RPC function not found, using fallback method with manual deactivation')
        return await this.createWithManualDeactivation(card, encryptedPassword)
      }

      throw error
    }

    console.log('✅ Tessera operatore creata con successo:', data)
    return data
  },

  /**
   * Fallback method: crea tessera con disattivazione manuale (usato se RPC non esiste)
   */
  async createWithManualDeactivation(
    card: {
      user_id?: string
      staff_id?: string
      organization_id: string
      nfc_uid: string
      operator_name: string
      created_by?: string
    },
    encryptedPassword: string | null
  ): Promise<OperatorNFCCard> {
    // IMPORTANTE: Disattiva tutte le altre tessere attive di questo operatore
    console.log('🔄 Disattivazione tessere precedenti per operatore:', card.user_id || card.staff_id)

    // Retry logic: prova fino a 3 volte
    let lastError: any = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Prima disattiva le tessere precedenti
        if (card.user_id) {
          const { error: deactivateError } = await supabase
            .from('operator_nfc_cards')
            .update({ is_active: false })
            .eq('user_id', card.user_id)
            .eq('organization_id', card.organization_id)
            .eq('is_active', true)

          if (deactivateError) {
            console.warn(`⚠️ Tentativo ${attempt}: Errore disattivazione:`, deactivateError)
          }
        } else if (card.staff_id) {
          const { error: deactivateError } = await supabase
            .from('operator_nfc_cards')
            .update({ is_active: false })
            .eq('staff_id', card.staff_id)
            .eq('organization_id', card.organization_id)
            .eq('is_active', true)

          if (deactivateError) {
            console.warn(`⚠️ Tentativo ${attempt}: Errore disattivazione:`, deactivateError)
          }
        }

        // Poi inserisci la nuova tessera
        const { data, error } = await supabase
          .from('operator_nfc_cards')
          .insert({
            user_id: card.user_id || null,
            staff_id: card.staff_id || null,
            organization_id: card.organization_id,
            nfc_uid: card.nfc_uid,
            operator_name: card.operator_name,
            encrypted_password: encryptedPassword,
            created_by: card.created_by,
            is_active: true
          })
          .select()
          .single()

        if (!error) {
          console.log(`✅ Tessera creata con successo (tentativo ${attempt})`)
          return data
        }

        lastError = error
        console.warn(`⚠️ Tentativo ${attempt} fallito:`, error.message)

        // Aspetta un po' prima di ritentare
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt))
        }
      } catch (err) {
        lastError = err
        console.error(`❌ Eccezione tentativo ${attempt}:`, err)
      }
    }

    // Se arriviamo qui, tutti i tentativi sono falliti
    console.error('❌ Tutti i tentativi falliti:', lastError)
    throw lastError || new Error('Impossibile creare la tessera dopo 3 tentativi')
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
