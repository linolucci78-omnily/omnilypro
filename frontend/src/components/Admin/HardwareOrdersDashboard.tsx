import React, { useState, useEffect } from 'react'
import {
  Truck,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Eye,
  MoreHorizontal,
  X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PageLoader from '../UI/PageLoader'

interface HardwareOrder {
  id: string
  organization_id: string
  subscription_id?: string
  order_type: 'initial_setup' | 'additional_hardware' | 'replacement'
  hardware_model: string
  quantity: number
  unit_price: number
  setup_fee: number
  total_amount: number
  currency: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  stripe_payment_intent_id?: string
  tracking_number?: string
  shipping_address: any
  notes?: string
  ordered_at: string
  shipped_at?: string
  delivered_at?: string
  organization?: {
    name: string
    email: string
  }
}

const HardwareOrdersDashboard: React.FC = () => {
  const [orders, setOrders] = useState<HardwareOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<HardwareOrder | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Mock data per demo
  const mockOrders: HardwareOrder[] = [
    {
      id: '1',
      organization_id: 'org-1',
      order_type: 'initial_setup',
      hardware_model: 'Z108',
      quantity: 1,
      unit_price: 200.00,
      setup_fee: 299.00,
      total_amount: 499.00,
      currency: 'EUR',
      status: 'delivered',
      tracking_number: 'BRT123456789',
      shipping_address: {
        name: 'Mario Rossi',
        company: 'Ristorante Da Mario',
        address: 'Via Roma 123',
        city: 'Milano',
        postal_code: '20100',
        phone: '+39 123 456 7890'
      },
      ordered_at: '2024-09-15T10:00:00Z',
      shipped_at: '2024-09-16T14:30:00Z',
      delivered_at: '2024-09-18T09:15:00Z',
      organization: {
        name: 'Ristorante Da Mario',
        email: 'mario@ristorante.it'
      }
    },
    {
      id: '2',
      organization_id: 'org-2',
      order_type: 'additional_hardware',
      hardware_model: 'Z108',
      quantity: 2,
      unit_price: 200.00,
      setup_fee: 0.00,
      total_amount: 400.00,
      currency: 'EUR',
      status: 'shipped',
      tracking_number: 'DHL987654321',
      shipping_address: {
        name: 'Giuseppe Verdi',
        company: 'Bar Centrale',
        address: 'Piazza Duomo 45',
        city: 'Roma',
        postal_code: '00100',
        phone: '+39 987 654 3210'
      },
      ordered_at: '2024-09-20T15:30:00Z',
      shipped_at: '2024-09-22T11:00:00Z',
      organization: {
        name: 'Bar Centrale',
        email: 'giuseppe@barcentrale.it'
      }
    },
    {
      id: '3',
      organization_id: 'org-3',
      order_type: 'replacement',
      hardware_model: 'Z108',
      quantity: 1,
      unit_price: 0.00,
      setup_fee: 50.00,
      total_amount: 50.00,
      currency: 'EUR',
      status: 'pending',
      shipping_address: {
        name: 'Anna Bianchi',
        company: 'Pizzeria Napoletana',
        address: 'Via Napoli 78',
        city: 'Napoli',
        postal_code: '80100',
        phone: '+39 555 123 4567'
      },
      ordered_at: '2024-09-25T09:00:00Z',
      organization: {
        name: 'Pizzeria Napoletana',
        email: 'anna@pizzerianapoli.it'
      }
    }
  ]

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // In futuro, sostituire con vera query Supabase
      // const { data, error } = await supabase
      //   .from('hardware_orders')
      //   .select(`
      //     *,
      //     organizations(name, email)
      //   `)
      //   .order('ordered_at', { ascending: false })

      // Per ora usiamo mock data
      setTimeout(() => {
        setOrders(mockOrders)
        setLoading(false)
      }, 500)

    } catch (error) {
      console.error('Error loading hardware orders:', error)
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'shipped':
        return <Truck size={16} style={{ color: '#3b82f6' }} />
      case 'paid':
        return <Clock size={16} style={{ color: '#f59e0b' }} />
      case 'pending':
        return <AlertCircle size={16} style={{ color: '#f59e0b' }} />
      case 'cancelled':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#10b981'
      case 'shipped': return '#3b82f6'
      case 'paid': return '#f59e0b'
      case 'pending': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Consegnato'
      case 'shipped': return 'Spedito'
      case 'paid': return 'Pagato'
      case 'pending': return 'In Attesa'
      case 'cancelled': return 'Annullato'
      default: return status
    }
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'initial_setup': return 'Setup Iniziale'
      case 'additional_hardware': return 'Hardware Aggiuntivo'
      case 'replacement': return 'Sostituzione'
      default: return type
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_amount, 0)
  }

  if (loading) {
    return <PageLoader message="Caricamento ordini hardware Z108..." size="medium" />
  }

  return (
    <div className="hardware-orders-dashboard">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--omnily-primary) 0%, var(--omnily-primary-dark) 100%)',
        padding: '2rem 2rem 4rem 2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              Ordini Hardware
            </h1>
            <p style={{ margin: '0', opacity: 0.9 }}>
              Gestione ordini e spedizioni Z108 per clienti OMNILY PRO
            </p>
          </div>
          <button
            onClick={() => setShowOrderModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            Nuovo Ordine
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Package size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Totale Ordini</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Clock size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>In Attesa</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pending}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Truck size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Spediti</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.shipped}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <CheckCircle size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Consegnati</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.delivered}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <DollarSign size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Revenue Totale</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '0 2rem',
        marginTop: '-2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              type="text"
              placeholder="Cerca per organizzazione, tracking o ID ordine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">In Attesa</option>
              <option value="paid">Pagato</option>
              <option value="shipped">Spedito</option>
              <option value="delivered">Consegnato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--omnily-gray-100)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <Download size={16} />
            Esporta
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ padding: '2rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          {filteredOrders.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Nessun ordine trovato</h3>
              <p style={{ margin: '0' }}>Non ci sono ordini che corrispondono ai criteri di ricerca.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--omnily-gray-50)', borderBottom: '1px solid var(--omnily-border-color)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Ordine
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Cliente
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Prodotto
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Stato
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Importo
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Data Ordine
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>
                            #{order.id.substring(0, 8).toUpperCase()}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {getOrderTypeLabel(order.order_type)}
                          </div>
                          {order.tracking_number && (
                            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                              Track: {order.tracking_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>
                            {order.organization?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {order.organization?.email}
                          </div>
                          {order.shipping_address?.city && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              📍 {order.shipping_address.city}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>
                            {order.hardware_model} Terminal
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Quantità: {order.quantity}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status)
                        }}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          €{order.total_amount.toFixed(2)}
                        </div>
                        {order.setup_fee > 0 && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Setup: €{order.setup_fee.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: '#64748b', fontSize: '14px' }}>
                          {new Date(order.ordered_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(order.ordered_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              padding: '6px',
                              background: 'var(--omnily-gray-100)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#64748b'
                            }}
                            title="Visualizza dettagli"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            style={{
                              padding: '6px',
                              background: 'var(--omnily-gray-100)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#64748b'
                            }}
                            title="Modifica ordine"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            style={{
                              padding: '6px',
                              background: 'var(--omnily-gray-100)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#64748b'
                            }}
                            title="Altre azioni"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Order Modal */}
      {showOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Nuovo Ordine Hardware
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              // Handle form submission here
              setShowOrderModal(false)
            }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Cliente */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Cliente / Organizzazione *
                  </label>
                  <select
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Seleziona cliente...</option>
                    <option value="org-1">Ristorante Da Mario</option>
                    <option value="org-2">Bar Centrale</option>
                    <option value="org-3">Pizzeria Napoletana</option>
                    <option value="org-4">Caffè del Corso</option>
                  </select>
                </div>

                {/* Tipo Ordine */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Tipo Ordine *
                  </label>
                  <select
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Seleziona tipo...</option>
                    <option value="initial_setup">Setup Iniziale (€299 setup fee)</option>
                    <option value="additional_hardware">Hardware Aggiuntivo</option>
                    <option value="replacement">Sostituzione (€50 handling fee)</option>
                  </select>
                </div>

                {/* Hardware Model e Quantità */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Modello Hardware *
                    </label>
                    <select
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleziona modello...</option>
                      <option value="Z108">Z108 Terminal - €200</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Quantità *
                    </label>
                    <input
                      type="number"
                      min="1"
                      defaultValue="1"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {/* Indirizzo di Spedizione */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Indirizzo di Spedizione
                  </label>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Nome completo"
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Nome azienda"
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Indirizzo"
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Città"
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="CAP"
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="tel"
                        placeholder="Telefono"
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Note Aggiuntive
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Note speciali per la spedizione..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Riepilogo Costi */}
                <div style={{
                  background: 'var(--omnily-gray-50)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Riepilogo Costi</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Hardware (1x Z108):</span>
                    <span>€200.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Setup Fee:</span>
                    <span>€299.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Spedizione:</span>
                    <span>€0.00</span>
                  </div>
                  <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #d1d5db' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Totale:</span>
                    <span>€499.00</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--omnily-gray-50)',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--omnily-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white'
                  }}
                >
                  Crea Ordine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HardwareOrdersDashboard