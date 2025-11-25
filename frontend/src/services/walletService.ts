/**
 * Wallet Service (Organization Dashboard)
 * Gestisce wallet dei clienti dal pannello organizzazione/POS
 */

import { supabase } from '../lib/supabase'

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

export interface WalletStats {
  total_wallets: number
  active_wallets: number
  total_balance: number
  total_transactions_today: number
  total_amount_today: number
}

class WalletService {
  /**
   * Ottieni wallet del cliente (per staff/organization)
   */
  async getCustomerWallet(
    organizationId: string,
    customerId: string
  ): Promise<CustomerWallet | null> {
    const { data, error } = await supabase
      .from('customer_wallets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Wallet non trovato
        return null
      }
      throw new Error(`Errore caricamento wallet: ${error.message}`)
    }

    return data
  }

  /**
   * Ottieni tutti i wallet dell'organizzazione
   */
  async getOrganizationWallets(organizationId: string): Promise<CustomerWallet[]> {
    const { data, error } = await supabase
      .from('customer_wallets')
      .select(`
        *,
        customer:customers(id, name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Errore caricamento wallets: ${error.message}`)
    }

    return data || []
  }

  /**
   * Ottieni transazioni wallet
   */
  async getWalletTransactions(
    walletId: string,
    limit: number = 50
  ): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Errore caricamento transazioni: ${error.message}`)
    }

    return data || []
  }

  /**
   * Statistiche wallet organizzazione
   */
  async getStats(organizationId: string): Promise<WalletStats> {
    const { data: wallets } = await supabase
      .from('customer_wallets')
      .select('balance, status')
      .eq('organization_id', organizationId)

    const totalWallets = wallets?.length || 0
    const activeWallets = wallets?.filter(w => w.status === 'active').length || 0
    const totalBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0

    // Transazioni di oggi
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayTxs } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('created_at', today.toISOString())

    const totalTransactionsToday = todayTxs?.length || 0
    const totalAmountToday = todayTxs?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0

    return {
      total_wallets: totalWallets,
      active_wallets: activeWallets,
      total_balance: totalBalance,
      total_transactions_today: totalTransactionsToday,
      total_amount_today: totalAmountToday
    }
  }

  /**
   * Processa pagamento con wallet (dal POS)
   */
  async processPayment(
    organizationId: string,
    customerId: string,
    amount: number,
    description: string,
    staffId?: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<{
    success: boolean
    transaction?: WalletTransaction
    newBalance?: number
    error?: string
  }> {
    try {
      // Ottieni wallet
      const wallet = await this.getCustomerWallet(organizationId, customerId)

      if (!wallet) {
        return {
          success: false,
          error: 'Wallet non trovato'
        }
      }

      // Verifica saldo sufficiente
      if (wallet.balance < amount) {
        return {
          success: false,
          error: 'Saldo insufficiente'
        }
      }

      // Processa transazione
      const { data: transactionId, error } = await supabase
        .rpc('process_wallet_transaction', {
          p_wallet_id: wallet.id,
          p_type: 'payment',
          p_amount: amount,
          p_description: description,
          p_reference_type: referenceType || null,
          p_reference_id: referenceId || null,
          p_metadata: null,
          p_staff_id: staffId || null
        })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // Ottieni transazione creata
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      return {
        success: true,
        transaction: transaction || undefined,
        newBalance: transaction?.balance_after
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Errore imprevisto'
      }
    }
  }

  /**
   * Ricarica wallet (dal POS)
   */
  async topUpWallet(
    organizationId: string,
    customerId: string,
    amount: number,
    paymentMethod: string,
    staffId?: string
  ): Promise<{
    success: boolean
    transaction?: WalletTransaction
    newBalance?: number
    error?: string
  }> {
    try {
      // Ottieni o crea wallet
      let wallet = await this.getCustomerWallet(organizationId, customerId)

      if (!wallet) {
        // Crea wallet
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
          return {
            success: false,
            error: `Errore creazione wallet: ${createError.message}`
          }
        }

        wallet = newWallet
      }

      // Processa transazione
      const { data: transactionId, error } = await supabase
        .rpc('process_wallet_transaction', {
          p_wallet_id: wallet.id,
          p_type: 'top_up',
          p_amount: amount,
          p_description: `Ricarica tramite ${paymentMethod}`,
          p_reference_type: 'top_up',
          p_reference_id: null,
          p_metadata: { payment_method: paymentMethod },
          p_staff_id: staffId || null
        })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // Ottieni transazione creata
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      return {
        success: true,
        transaction: transaction || undefined,
        newBalance: transaction?.balance_after
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Errore imprevisto'
      }
    }
  }
}

export const walletService = new WalletService()
