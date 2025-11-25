/**
 * Wallet Service
 * Gestisce wallet digitale e transazioni per i clienti
 */

import { supabase } from './supabase'

export interface CustomerWallet {
  id: string
  organization_id: string
  customer_id: string
  balance: number
  currency: string
  status: 'active' | 'suspended' | 'closed'
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  organization_id: string
  customer_id: string
  type: 'credit' | 'debit' | 'gift_certificate_redeem' | 'refund' | 'payment' | 'top_up'
  amount: number
  description: string | null
  reference_type: string | null
  reference_id: string | null
  balance_before: number
  balance_after: number
  metadata: any
  processed_by_staff_id: string | null
  created_at: string
}

class WalletService {
  /**
   * Ottieni o crea il wallet del cliente
   */
  async getOrCreateWallet(
    organizationId: string,
    customerId: string
  ): Promise<CustomerWallet> {
    // Prima cerca il wallet esistente
    const { data: existingWallet, error: fetchError } = await supabase
      .from('customer_wallets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .single()

    if (existingWallet) {
      return existingWallet
    }

    // Se non esiste, crealo
    const { data: newWallet, error: createError } = await supabase
      .from('customer_wallets')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        balance: 0,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Errore creazione wallet: ${createError.message}`)
    }

    return newWallet
  }

  /**
   * Ottieni il saldo del wallet
   */
  async getBalance(
    organizationId: string,
    customerId: string
  ): Promise<number> {
    const wallet = await this.getOrCreateWallet(organizationId, customerId)
    return wallet.balance
  }

  /**
   * Ottieni le transazioni del wallet
   */
  async getTransactions(
    walletId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Errore caricamento transazioni: ${error.message}`)
    }

    return data || []
  }

  /**
   * Riscatta un gift certificate nel wallet
   */
  async redeemGiftCertificate(
    organizationId: string,
    customerId: string,
    giftCertificateCode: string
  ): Promise<{
    success: boolean
    transaction?: WalletTransaction
    newBalance?: number
    error?: string
  }> {
    try {
      // 1. Ottieni il wallet
      const wallet = await this.getOrCreateWallet(organizationId, customerId)

      // 2. Valida e ottieni il gift certificate
      const { data: giftCert, error: certError } = await supabase
        .from('gift_certificates')
        .select('*')
        .eq('code', giftCertificateCode)
        .eq('organization_id', organizationId)
        .single()

      if (certError || !giftCert) {
        return {
          success: false,
          error: 'Gift certificate non trovato'
        }
      }

      // 3. Verifica stato gift certificate
      if (giftCert.status !== 'active' && giftCert.status !== 'partially_used') {
        return {
          success: false,
          error: 'Gift certificate non valido o già utilizzato'
        }
      }

      if (giftCert.current_balance <= 0) {
        return {
          success: false,
          error: 'Gift certificate senza saldo disponibile'
        }
      }

      // 4. Verifica scadenza
      if (giftCert.valid_until) {
        const expiryDate = new Date(giftCert.valid_until)
        if (expiryDate < new Date()) {
          return {
            success: false,
            error: 'Gift certificate scaduto'
          }
        }
      }

      // 5. Chiama la funzione PostgreSQL per processare la transazione
      const { data: transactionData, error: txError } = await supabase
        .rpc('process_wallet_transaction', {
          p_wallet_id: wallet.id,
          p_type: 'gift_certificate_redeem',
          p_amount: giftCert.current_balance,
          p_description: `Riscatto gift certificate ${giftCertificateCode}`,
          p_reference_type: 'gift_certificate',
          p_reference_id: giftCert.id,
          p_metadata: {
            gift_certificate_code: giftCertificateCode,
            original_amount: giftCert.original_amount,
            redeemed_amount: giftCert.current_balance
          }
        })

      if (txError) {
        console.error('Errore transazione:', txError)
        return {
          success: false,
          error: `Errore durante il riscatto: ${txError.message}`
        }
      }

      // 6. Marca il gift certificate come fully_used
      const { error: updateError } = await supabase
        .from('gift_certificates')
        .update({
          current_balance: 0,
          status: 'fully_used'
        })
        .eq('id', giftCert.id)

      if (updateError) {
        console.error('Errore aggiornamento gift certificate:', updateError)
        // Non ritorniamo errore perché la transazione è già avvenuta
      }

      // 7. Ottieni la transazione creata
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionData)
        .single()

      // 8. Ottieni nuovo saldo
      const updatedWallet = await this.getOrCreateWallet(organizationId, customerId)

      return {
        success: true,
        transaction: transaction || undefined,
        newBalance: updatedWallet.balance
      }
    } catch (error: any) {
      console.error('Errore riscatto gift certificate:', error)
      return {
        success: false,
        error: error.message || 'Errore imprevisto'
      }
    }
  }

  /**
   * Ricarica il wallet (top-up)
   */
  async topUpWallet(
    organizationId: string,
    customerId: string,
    amount: number,
    paymentMethod: string,
    metadata?: any
  ): Promise<{
    success: boolean
    transaction?: WalletTransaction
    newBalance?: number
    error?: string
  }> {
    try {
      if (amount <= 0) {
        return {
          success: false,
          error: 'Importo non valido'
        }
      }

      const wallet = await this.getOrCreateWallet(organizationId, customerId)

      // Chiama la funzione PostgreSQL per processare la transazione
      const { data: transactionData, error: txError } = await supabase
        .rpc('process_wallet_transaction', {
          p_wallet_id: wallet.id,
          p_type: 'top_up',
          p_amount: amount,
          p_description: `Ricarica wallet tramite ${paymentMethod}`,
          p_reference_type: 'top_up',
          p_metadata: {
            payment_method: paymentMethod,
            ...metadata
          }
        })

      if (txError) {
        return {
          success: false,
          error: `Errore durante la ricarica: ${txError.message}`
        }
      }

      // Ottieni la transazione creata
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionData)
        .single()

      // Ottieni nuovo saldo
      const updatedWallet = await this.getOrCreateWallet(organizationId, customerId)

      return {
        success: true,
        transaction: transaction || undefined,
        newBalance: updatedWallet.balance
      }
    } catch (error: any) {
      console.error('Errore ricarica wallet:', error)
      return {
        success: false,
        error: error.message || 'Errore imprevisto'
      }
    }
  }

  /**
   * Usa il wallet per pagare (debit)
   */
  async pay(
    organizationId: string,
    customerId: string,
    amount: number,
    description: string,
    referenceType?: string,
    referenceId?: string,
    metadata?: any
  ): Promise<{
    success: boolean
    transaction?: WalletTransaction
    newBalance?: number
    error?: string
  }> {
    try {
      if (amount <= 0) {
        return {
          success: false,
          error: 'Importo non valido'
        }
      }

      const wallet = await this.getOrCreateWallet(organizationId, customerId)

      // Verifica saldo sufficiente
      if (wallet.balance < amount) {
        return {
          success: false,
          error: 'Saldo insufficiente'
        }
      }

      // Chiama la funzione PostgreSQL per processare la transazione
      const { data: transactionData, error: txError } = await supabase
        .rpc('process_wallet_transaction', {
          p_wallet_id: wallet.id,
          p_type: 'payment',
          p_amount: amount,
          p_description: description,
          p_reference_type: referenceType || null,
          p_reference_id: referenceId || null,
          p_metadata: metadata
        })

      if (txError) {
        return {
          success: false,
          error: `Errore durante il pagamento: ${txError.message}`
        }
      }

      // Ottieni la transazione creata
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionData)
        .single()

      // Ottieni nuovo saldo
      const updatedWallet = await this.getOrCreateWallet(organizationId, customerId)

      return {
        success: true,
        transaction: transaction || undefined,
        newBalance: updatedWallet.balance
      }
    } catch (error: any) {
      console.error('Errore pagamento wallet:', error)
      return {
        success: false,
        error: error.message || 'Errore imprevisto'
      }
    }
  }
}

export const walletService = new WalletService()
