import React, { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  Target,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Filter,
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
  Send,
  UserCheck,
  UserX,
  Crown,
  Award,
  ShoppingBag,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  Heart,
  MessageSquare,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { crmService } from '../../services/crmService'
import type { Customer, Campaign, CustomerSegment, CRMStats } from '../../services/crmService'
import PageLoader from '../UI/PageLoader'

// Interfaces importate dal service CRMService

const CRMDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [crmStats, setCrmStats] = useState<CRMStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null)

  // Get current organization ID from user context or props
  useEffect(() => {
    const getCurrentOrganization = async () => {
      try {
        // Get current user's organization from organization_users table
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (orgUser) {
          setCurrentOrganizationId(orgUser.org_id)
        }
      } catch (error) {
        console.error('Error getting current organization:', error)
      }
    }

    getCurrentOrganization()
  }, [])

  // Load CRM data when organization is available
  useEffect(() => {
    if (!currentOrganizationId) return

    const loadCRMData = async () => {
      try {
        setLoading(true)
        console.log('🔄 Loading CRM data for organization:', currentOrganizationId)

        // Load data in parallel for better performance
        const [
          customersResponse,
          campaignsData,
          segmentsData,
          statsData
        ] = await Promise.all([
          crmService.getCustomers(currentOrganizationId, {
            status: selectedFilter !== 'all' ? selectedFilter : undefined,
            search: searchTerm || undefined,
            limit: 50
          }),
          crmService.getCampaigns(currentOrganizationId),
          crmService.getSegments(currentOrganizationId),
          crmService.getCRMStats(currentOrganizationId)
        ])

        setCustomers(customersResponse.customers)
        setTotalCustomers(customersResponse.total)
        setCampaigns(campaignsData)
        setSegments(segmentsData)
        setCrmStats(statsData)

        console.log('✅ CRM data loaded successfully:', {
          customers: customersResponse.customers.length,
          campaigns: campaignsData.length,
          segments: segmentsData.length
        })

      } catch (error) {
        console.error('❌ Error loading CRM data:', error)
        // Fall back to empty arrays to prevent crashes
        setCustomers([])
        setCampaigns([])
        setSegments([])
        setCrmStats(null)
      } finally {
        setLoading(false)
      }
    }

    loadCRMData()
  }, [currentOrganizationId, selectedFilter, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'var(--omnily-primary)'
      case 'active': return 'var(--omnily-success)'
      case 'inactive': return 'var(--omnily-warning)'
      case 'churned': return 'var(--omnily-error)'
      default: return 'var(--omnily-gray-500)'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return <Crown size={16} />
      case 'active': return <CheckCircle size={16} />
      case 'inactive': return <Clock size={16} />
      case 'churned': return <XCircle size={16} />
      default: return <Users size={16} />
    }
  }

  const getChurnRiskColor = (risk: number) => {
    if (risk >= 70) return 'var(--omnily-error)'
    if (risk >= 40) return 'var(--omnily-warning)'
    return 'var(--omnily-success)'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const calculateConversionRate = (converted: number, sent: number) => {
    return sent > 0 ? ((converted / sent) * 100).toFixed(1) : '0.0'
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' ||
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = selectedFilter === 'all' || customer.status === selectedFilter

    return matchesSearch && matchesFilter
  })

  // Use real stats from CRM service or fallback to calculated values
  const statsToUse = crmStats || {
    total_customers: customers.length,
    total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avg_clv: customers.length > 0 ? customers.reduce((sum, c) => sum + c.lifetime_value, 0) / customers.length : 0,
    avg_engagement: customers.length > 0 ? customers.reduce((sum, c) => sum + c.engagement_score, 0) / customers.length : 0,
    active_customers: customers.filter(c => c.status === 'active' || c.status === 'vip').length,
    churned_customers: customers.filter(c => c.status === 'churned').length,
    vip_customers: customers.filter(c => c.status === 'vip').length,
    active_campaigns: campaigns.filter(c => c.status === 'running').length,
    conversion_rate: 0,
    customer_growth_rate: 0
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div style={{ padding: '0', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        padding: '2rem 2rem 4rem 2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Users size={40} />
              CRM & Customer Intelligence
            </h1>
            <p style={{ margin: '0', opacity: '0.9', fontSize: '1.1rem' }}>
              Gestione clienti avanzata con analytics predittive e automazione marketing
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onClick={() => setShowCampaignModal(true)}
            >
              <Send size={18} />
              Nuova Campagna
            </button>
            <button
              style={{
                background: 'white',
                border: 'none',
                color: '#1e40af',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Download size={18} />
              Esporta Dati
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Users size={24} />
              <ArrowUpRight size={16} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              {statsToUse.total_customers.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Clienti Totali</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <DollarSign size={24} />
              <ArrowUpRight size={16} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              {formatCurrency(statsToUse.total_revenue)}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Revenue Totale</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Target size={24} />
              <ArrowUpRight size={16} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              {formatCurrency(statsToUse.avg_clv)}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>CLV Medio</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Activity size={24} />
              <ArrowUpRight size={16} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              {statsToUse.avg_engagement.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Engagement Score</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Crown size={24} />
              <span style={{ fontSize: '0.75rem', background: '#22c55e', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                +12%
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              {statsToUse.vip_customers}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Clienti VIP</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'customers', label: 'Clienti', icon: Users },
          { id: 'segments', label: 'Segmenti', icon: Target },
          { id: 'campaigns', label: 'Campagne', icon: Send },
          { id: 'analytics', label: 'Analytics', icon: PieChart }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--omnily-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--omnily-primary)' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontWeight: '500'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '2rem' }}>
        {activeTab === 'customers' && (
          <div>
            {/* Filters & Search */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Cerca clienti per nome, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="all">Tutti i Clienti</option>
                <option value="vip">VIP</option>
                <option value="active">Attivi</option>
                <option value="inactive">Inattivi</option>
                <option value="churned">Persi</option>
              </select>

              <button style={{
                background: 'var(--omnily-primary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}>
                <Plus size={18} />
                Nuovo Cliente
              </button>
            </div>

            {/* Customers Table */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Cliente
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Status & Tier
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Valore
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Engagement
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Rischio Churn
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Ultima Attività
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        style={{
                          borderBottom: index < filteredCustomers.length - 1 ? '1px solid #f1f5f9' : 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: getStatusColor(customer.status),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '0.875rem'
                            }}>
                              {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500', color: '#1f2937' }}>
                                {customer.first_name} {customer.last_name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {customer.email}
                              </div>
                              {customer.city && (
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <MapPin size={12} />
                                  {customer.city}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: `${getStatusColor(customer.status)}20`,
                              color: getStatusColor(customer.status),
                              width: 'fit-content'
                            }}>
                              {getStatusIcon(customer.status)}
                              {customer.status.toUpperCase()}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              Tier: {customer.tier}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ fontWeight: '600', color: '#1f2937' }}>
                              {formatCurrency(customer.lifetime_value)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              CLV
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {customer.total_orders} ordini
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '60px',
                              height: '8px',
                              background: '#f1f5f9',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${customer.engagement_score}%`,
                                height: '100%',
                                background: customer.engagement_score >= 70 ? '#10b981' :
                                          customer.engagement_score >= 40 ? '#f59e0b' : '#ef4444',
                                borderRadius: '4px'
                              }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {customer.engagement_score}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '60px',
                              height: '8px',
                              background: '#f1f5f9',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${customer.predicted_churn_risk}%`,
                                height: '100%',
                                background: getChurnRiskColor(customer.predicted_churn_risk),
                                borderRadius: '4px'
                              }} />
                            </div>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: getChurnRiskColor(customer.predicted_churn_risk)
                            }}>
                              {customer.predicted_churn_risk}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {customer.last_activity ? formatDate(customer.last_activity) : 'Mai'}
                          </div>
                          {customer.last_purchase_date && (
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              Ultimo acquisto: {formatDate(customer.last_purchase_date)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button style={{
                              padding: '0.5rem',
                              border: 'none',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Eye size={16} />
                            </button>
                            <button style={{
                              padding: '0.5rem',
                              border: 'none',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Edit2 size={16} />
                            </button>
                            <button style={{
                              padding: '0.5rem',
                              border: 'none',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Mail size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600' }}>
                Campagne Marketing
              </h2>
              <button style={{
                background: 'var(--omnily-primary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}>
                <Plus size={18} />
                Nuova Campagna
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {campaigns.map(campaign => (
                <div key={campaign.id} style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                        {campaign.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: campaign.status === 'running' ? '#22c55e20' : '#f59e0b20',
                          color: campaign.status === 'running' ? '#22c55e' : '#f59e0b'
                        }}>
                          {campaign.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {campaign.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ padding: '0.5rem', border: 'none', background: '#f3f4f6', borderRadius: '6px', cursor: 'pointer' }}>
                        <Edit2 size={16} />
                      </button>
                      <button style={{ padding: '0.5rem', border: 'none', background: '#f3f4f6', borderRadius: '6px', cursor: 'pointer' }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                        {campaign.sent_count.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Inviati</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                        {((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aperture</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                        {calculateConversionRate(campaign.converted_count, campaign.sent_count)}%
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Conversioni</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--omnily-success)' }}>
                        {formatCurrency(campaign.revenue_generated)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Revenue</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                        {((campaign.revenue_generated / campaign.budget) * 100).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>ROI</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>
                  Distribuzione Clienti
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Crown size={16} style={{ color: 'var(--omnily-primary)' }} />
                      VIP
                    </span>
                    <span style={{ fontWeight: '600' }}>{statsToUse.vip_customers}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--omnily-success)' }} />
                      Attivi
                    </span>
                    <span style={{ fontWeight: '600' }}>{statsToUse.active_customers}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <XCircle size={16} style={{ color: 'var(--omnily-error)' }} />
                      Persi
                    </span>
                    <span style={{ fontWeight: '600' }}>{statsToUse.churned_customers}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>
                  Performance Campagne
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Campagne Attive</span>
                    <span style={{ fontWeight: '600' }}>{campaigns.filter(c => c.status === 'running').length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tasso Apertura Medio</span>
                    <span style={{ fontWeight: '600', color: 'var(--omnily-success)' }}>
                      {campaigns.length > 0
                        ? (campaigns.reduce((sum, c) => sum + (c.opened_count / c.sent_count), 0) / campaigns.length * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Revenue Generata</span>
                    <span style={{ fontWeight: '600', color: 'var(--omnily-primary)' }}>
                      {formatCurrency(campaigns.reduce((sum, c) => sum + c.revenue_generated, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.25rem', fontWeight: '600' }}>
                Attività Recente
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--omnily-success)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <UserCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>Nuovo cliente VIP registrato</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Marco Rossi ha raggiunto il tier Gold</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>2 ore fa</div>
                </div>

                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--omnily-primary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Send size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>Campagna "Black Friday 2024" avviata</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>1.250 email inviate a clienti VIP</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>5 ore fa</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CRMDashboard