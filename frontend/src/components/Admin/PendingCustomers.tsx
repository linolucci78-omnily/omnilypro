import React, { useState, useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Loader
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PageLoader from '../UI/PageLoader'
import './PendingCustomers.css'

interface PendingCustomer {
  id: string
  name: string // Company name
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  city?: string
  country?: string
  plan_type?: string
  estimated_monthly_value?: number
  status: string
  created_at: string
  sales_agent_id?: string
  // Join with sales agent
  agent_email?: string
}

const PendingCustomers: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<PendingCustomer[]>([])
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    loadPendingCustomers()
  }, [])

  const loadPendingCustomers = async () => {
    try {
      setLoading(true)

      // Get customers with pending_activation status
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          sales_agent:users!customers_sales_agent_id_fkey(email)
        `)
        .eq('status', 'pending_activation')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading pending customers:', error)
        throw error
      }

      // Map data
      const mappedData = data?.map((customer: any) => ({
        ...customer,
        agent_email: customer.sales_agent?.email
      })) || []

      setCustomers(mappedData)
      console.log('✅ Loaded pending customers:', mappedData.length)
    } catch (error) {
      console.error('Error in loadPendingCustomers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateAccount = async (customerId: string, customerData: PendingCustomer) => {
    if (!confirm(`Sei sicuro di voler attivare l'account per ${customerData.name}?\n\nVerranno creati:\n- Organization record\n- User account con credenziali\n- Email di benvenuto`)) {
      return
    }

    try {
      setActivating(customerId)
      console.log('🚀 Activating customer:', customerId)

      // TODO: Implement full activation workflow
      // 1. Create organization
      // 2. Create user account with credentials
      // 3. Send welcome email
      // 4. Update customer status to 'active'

      // For now, just update status
      const { error } = await supabase
        .from('customers')
        .update({
          status: 'active',
          is_active: true
        })
        .eq('id', customerId)

      if (error) {
        console.error('Error activating customer:', error)
        throw error
      }

      alert('✅ Account attivato con successo!\n\n(TODO: Implementare creazione organization e invio email)')

      // Reload data
      await loadPendingCustomers()
    } catch (error: any) {
      console.error('❌ Error activating account:', error)
      alert(`❌ Errore durante l'attivazione: ${error.message}`)
    } finally {
      setActivating(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="pending-customers">
      {/* Header */}
      <div className="pending-header">
        <div>
          <h1 className="pending-title">
            <Clock size={32} />
            Clienti da Attivare
          </h1>
          <p className="pending-subtitle">
            Contratti firmati in attesa di attivazione account
          </p>
        </div>

        {customers.length > 0 && (
          <div className="pending-count-badge">
            <AlertCircle size={20} />
            {customers.length} {customers.length === 1 ? 'cliente' : 'clienti'} in attesa
          </div>
        )}
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="empty-state">
          <CheckCircle size={64} />
          <h3>Nessun cliente in attesa</h3>
          <p>Tutti i contratti firmati sono stati attivati!</p>
        </div>
      )}

      {/* Customers List */}
      {customers.length > 0 && (
        <div className="pending-cards-grid">
          {customers.map((customer) => (
            <div key={customer.id} className="pending-customer-card">
              <div className="pending-card-header">
                <div className="company-badge">
                  <Building2 size={24} />
                </div>
                <div className="pending-badge">
                  <Clock size={14} />
                  {getDaysAgo(customer.created_at)} giorni fa
                </div>
              </div>

              <div className="pending-card-body">
                <h3 className="company-name">{customer.name}</h3>

                <div className="customer-details">
                  <div className="detail-item">
                    <User size={16} />
                    <span>{customer.first_name} {customer.last_name}</span>
                  </div>

                  {customer.email && (
                    <div className="detail-item">
                      <Mail size={16} />
                      <span>{customer.email}</span>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="detail-item">
                      <Phone size={16} />
                      <span>{customer.phone}</span>
                    </div>
                  )}

                  {(customer.city || customer.country) && (
                    <div className="detail-item">
                      <Building2 size={16} />
                      <span>
                        {customer.city}
                        {customer.city && customer.country && ', '}
                        {customer.country}
                      </span>
                    </div>
                  )}
                </div>

                <div className="plan-info">
                  {customer.plan_type && (
                    <div className="plan-badge">
                      Piano: <strong>{customer.plan_type.toUpperCase()}</strong>
                    </div>
                  )}

                  {customer.estimated_monthly_value && (
                    <div className="value-badge">
                      <DollarSign size={14} />
                      {formatCurrency(customer.estimated_monthly_value)}/mese
                    </div>
                  )}
                </div>

                {customer.agent_email && (
                  <div className="agent-info">
                    Agente: <strong>{customer.agent_email}</strong>
                  </div>
                )}
              </div>

              <div className="pending-card-footer">
                <div className="contract-date">
                  <Calendar size={14} />
                  Contratto firmato il {new Date(customer.created_at).toLocaleDateString('it-IT')}
                </div>

                <button
                  className="btn-activate"
                  onClick={() => handleActivateAccount(customer.id, customer)}
                  disabled={activating === customer.id}
                >
                  {activating === customer.id ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Attivazione...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Attiva Account
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingCustomers
