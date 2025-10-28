import React, { useState, useEffect } from 'react'
import {
  X,
  Building2,
  Package,
  CreditCard,
  Calendar,
  Euro,
  Users,
  Check,
  AlertTriangle,
  Loader
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Organization {
  id: string
  name: string
  email: string
}

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_organizations: number
  max_transactions_monthly: number
  features: string[]
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (subscription: any) => void
  subscription?: any
  mode: 'create' | 'edit'
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subscription,
  mode
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    organization_id: subscription?.organization_id || '',
    plan_type: subscription?.plan_type || 'basic',
    billing_cycle: subscription?.billing_cycle || 'monthly',
    trial_days: subscription?.trial_days || 0,
    discount_percent: subscription?.discount_percent || 0,
    quantity: subscription?.quantity || 1,
    start_immediately: true
  })

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.plan_type && plans.length > 0) {
      const plan = plans.find(p => p.slug === formData.plan_type)
      setSelectedPlan(plan || null)
    }
  }, [formData.plan_type, plans])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, email')
        .order('name')

      if (orgsError) {
        // Mock organizations for demo
        setOrganizations([
          { id: 'org1', name: 'Pizzeria Da Mario', email: 'info@pizzeriadamario.it' },
          { id: 'org2', name: 'Bar Central', email: 'central@barcentral.it' },
          { id: 'org3', name: 'Ristorante Bella Vista', email: 'info@bellavista.it' },
          { id: 'org4', name: 'Gelateria Freddi', email: 'gelato@freddi.it' },
          { id: 'org5', name: 'Trattoria Nonna Rosa', email: 'nonna@rosa.it' }
        ])
      } else {
        setOrganizations(orgsData || [])
      }

      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (plansError) {
        // Mock plans for demo
        setPlans([
          {
            id: '1',
            name: 'Basic',
            slug: 'basic',
            price_monthly: 29,
            price_yearly: 290,
            max_users: 5,
            max_organizations: 1,
            max_transactions_monthly: 1000,
            features: ['POS System', 'Customer Management', 'Basic Analytics', 'Email Support']
          },
          {
            id: '2',
            name: 'Premium',
            slug: 'premium',
            price_monthly: 99,
            price_yearly: 990,
            max_users: 25,
            max_organizations: 3,
            max_transactions_monthly: 10000,
            features: ['Everything in Basic', 'Advanced Analytics', 'Multi-location', 'Priority Support', 'API Access']
          },
          {
            id: '3',
            name: 'Enterprise',
            slug: 'enterprise',
            price_monthly: 299,
            price_yearly: 2990,
            max_users: 100,
            max_organizations: 10,
            max_transactions_monthly: 100000,
            features: ['Everything in Premium', 'Custom Integrations', 'Dedicated Support', 'White Label', 'SLA Guarantee']
          }
        ])
      } else {
        setPlans(plansData || [])
      }

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.organization_id) {
      setError('Seleziona un\'organizzazione')
      return
    }

    if (!selectedPlan) {
      setError('Seleziona un piano')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const now = new Date()
      const trialEnd = formData.trial_days > 0
        ? new Date(now.getTime() + formData.trial_days * 24 * 60 * 60 * 1000)
        : null

      const periodStart = formData.start_immediately ? now : new Date()
      const periodEnd = new Date(
        periodStart.getTime() +
        (formData.billing_cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      )

      const price = formData.billing_cycle === 'yearly'
        ? selectedPlan.price_yearly
        : selectedPlan.price_monthly

      const discountedPrice = price * (1 - formData.discount_percent / 100)

      const subscriptionData = {
        organization_id: formData.organization_id,
        plan_type: formData.plan_type,
        status: formData.trial_days > 0 ? 'trialing' : 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: formData.trial_days > 0 ? now.toISOString() : null,
        trial_end: trialEnd?.toISOString() || null,
        amount_monthly: formData.billing_cycle === 'yearly' ? discountedPrice / 12 : discountedPrice,
        currency: 'EUR',
        billing_cycle: formData.billing_cycle,
        quantity: formData.quantity,
        discount_percent: formData.discount_percent,
        metadata: {
          created_by: 'admin',
          plan_features: selectedPlan.features,
          max_users: selectedPlan.max_users,
          max_organizations: selectedPlan.max_organizations,
          max_transactions_monthly: selectedPlan.max_transactions_monthly
        }
      }

      if (mode === 'create') {
        // Create new subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .insert([subscriptionData])
          .select()

        if (error) {
          // For demo, we'll just call onSave with mock data
          console.warn('Database not available, using mock data')
          onSave({
            id: 'sub_' + Date.now(),
            ...subscriptionData,
            organization_name: organizations.find(o => o.id === formData.organization_id)?.name || 'Unknown',
            stripe_subscription_id: 'sub_mock_' + Date.now(),
            stripe_customer_id: 'cus_mock_' + Date.now(),
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          })
        } else {
          onSave(data[0])
        }
      } else {
        // Update existing subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', subscription.id)
          .select()

        if (error) {
          console.warn('Database not available, using mock data')
          onSave({ ...subscription, ...subscriptionData })
        } else {
          onSave(data[0])
        }
      }

      onClose()

    } catch (err) {
      console.error('Error saving subscription:', err)
      setError('Errore nel salvataggio dell\'abbonamento')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const calculateTotal = () => {
    if (!selectedPlan) return 0

    const basePrice = formData.billing_cycle === 'yearly'
      ? selectedPlan.price_yearly
      : selectedPlan.price_monthly

    const discountedPrice = basePrice * (1 - formData.discount_percent / 100)
    return discountedPrice * formData.quantity
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>
              {mode === 'create' ? 'Nuovo Abbonamento' : 'Modifica Abbonamento'}
            </h2>
            <p style={{ margin: 0, color: '#64748b' }}>
              {mode === 'create' ? 'Crea un nuovo abbonamento per un\'organizzazione' : 'Modifica i dettagli dell\'abbonamento'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '8px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#64748b'
            }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: '12px' }}>Caricamento...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '24px'
              }}>
                {/* Organization Selection */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <Building2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Organizzazione
                  </label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Seleziona organizzazione</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan Selection */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <Package size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Piano
                  </label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    {plans.map(plan => (
                      <option key={plan.slug} value={plan.slug}>
                        {plan.name} - {formatCurrency(plan.price_monthly)}/mese
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Ciclo di Fatturazione
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="monthly">Mensile</option>
                    <option value="yearly">Annuale</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <Users size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Quantità
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Trial Days */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Giorni di Prova
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Discount */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <Euro size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Sconto (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Plan Details */}
              {selectedPlan && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    Dettagli Piano: {selectedPlan.name}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Max Utenti</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedPlan.max_users}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Max Organizzazioni</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedPlan.max_organizations}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Transazioni/Mese</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedPlan.max_transactions_monthly.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Totale</span>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                        {formatCurrency(calculateTotal())}
                        <span style={{ fontSize: '14px', fontWeight: '400' }}>
                          /{formData.billing_cycle === 'yearly' ? 'anno' : 'mese'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                      Funzionalità Incluse:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPlan.features.map((feature, index) => (
                        <span
                          key={index}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#dcfce7',
                            color: '#16a34a',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <Check size={12} />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Annulla
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || loading}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              background: saving ? '#94a3b8' : '#10b981',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Salvando...' : (mode === 'create' ? 'Crea Abbonamento' : 'Salva Modifiche')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionModal