import React, { useState, useEffect } from 'react'
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Building2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SupplierOrder {
  id: string
  order_number: string
  supplier_id: string
  status: 'draft' | 'sent' | 'confirmed' | 'production' | 'shipped' | 'received' | 'cancelled'
  total_amount: number
  currency: string
  exchange_rate: number
  total_amount_eur: number
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue'
  expected_delivery_date?: string
  actual_delivery_date?: string
  tracking_number?: string
  shipping_cost: number
  customs_cost: number
  ordered_at: string
  shipped_at?: string
  received_at?: string
  supplier?: {
    name: string
    company_name: string
    country: string
    city: string
  }
  items?: Array<{
    hardware_product: {
      name: string
      sku: string
      model: string
    }
    quantity: number
    unit_price: number
    total_price: number
    received_quantity: number
  }>
}

const SupplierOrdersDashboard: React.FC = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Mock data per demo
  const mockOrders: SupplierOrder[] = [
    {
      id: '1',
      order_number: 'PO-2025-001',
      supplier_id: 'sup-1',
      status: 'received',
      total_amount: 15000.00,
      currency: 'USD',
      exchange_rate: 0.85,
      total_amount_eur: 12750.00,
      payment_method: 'Bank Transfer',
      payment_status: 'paid',
      expected_delivery_date: '2025-09-20',
      actual_delivery_date: '2025-09-18',
      tracking_number: 'CN123456789US',
      shipping_cost: 500.00,
      customs_cost: 200.00,
      ordered_at: '2025-08-15T10:00:00Z',
      shipped_at: '2025-08-25T14:30:00Z',
      received_at: '2025-09-18T09:15:00Z',
      supplier: {
        name: 'TechnoChina Ltd',
        company_name: 'Shenzhen TechnoChina Manufacturing Co.',
        country: 'China',
        city: 'Shenzhen'
      },
      items: [
        {
          hardware_product: {
            name: 'Z108 Standard POS Terminal',
            sku: 'Z108-STD',
            model: 'Z108'
          },
          quantity: 100,
          unit_price: 150.00,
          total_price: 15000.00,
          received_quantity: 100
        }
      ]
    },
    {
      id: '2',
      order_number: 'PO-2025-002',
      supplier_id: 'sup-2',
      status: 'shipped',
      total_amount: 8000.00,
      currency: 'USD',
      exchange_rate: 0.85,
      total_amount_eur: 6800.00,
      payment_method: 'PayPal',
      payment_status: 'paid',
      expected_delivery_date: '2025-10-05',
      tracking_number: 'DHL123456789',
      shipping_cost: 300.00,
      customs_cost: 150.00,
      ordered_at: '2025-09-10T15:30:00Z',
      shipped_at: '2025-09-22T11:00:00Z',
      supplier: {
        name: 'POS Solutions China',
        company_name: 'Guangzhou POS Solutions Inc.',
        country: 'China',
        city: 'Guangzhou'
      },
      items: [
        {
          hardware_product: {
            name: 'Z108 Standard POS Terminal',
            sku: 'Z108-STD',
            model: 'Z108'
          },
          quantity: 50,
          unit_price: 150.00,
          total_price: 7500.00,
          received_quantity: 0
        },
        {
          hardware_product: {
            name: 'Customer Display 7"',
            sku: 'CUST-DISP',
            model: 'CUSTOMER_DISPLAY'
          },
          quantity: 10,
          unit_price: 50.00,
          total_price: 500.00,
          received_quantity: 0
        }
      ]
    },
    {
      id: '3',
      order_number: 'PO-2025-003',
      supplier_id: 'sup-1',
      status: 'production',
      total_amount: 12000.00,
      currency: 'USD',
      exchange_rate: 0.85,
      total_amount_eur: 10200.00,
      payment_method: 'Bank Transfer',
      payment_status: 'paid',
      expected_delivery_date: '2025-10-15',
      ordered_at: '2025-09-25T09:00:00Z',
      supplier: {
        name: 'TechnoChina Ltd',
        company_name: 'Shenzhen TechnoChina Manufacturing Co.',
        country: 'China',
        city: 'Shenzhen'
      },
      items: [
        {
          hardware_product: {
            name: 'Z108 Pro POS Terminal',
            sku: 'Z108-PRO',
            model: 'Z108_PRO'
          },
          quantity: 60,
          unit_price: 200.00,
          total_price: 12000.00,
          received_quantity: 0
        }
      ]
    }
  ]

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // In futuro, sostituire con vera query Supabase
      setTimeout(() => {
        setOrders(mockOrders)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error loading supplier orders:', error)
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'shipped':
        return <Truck size={16} style={{ color: '#3b82f6' }} />
      case 'production':
        return <Package size={16} style={{ color: '#f59e0b' }} />
      case 'confirmed':
        return <CheckCircle size={16} style={{ color: '#8b5cf6' }} />
      case 'sent':
        return <Clock size={16} style={{ color: '#6b7280' }} />
      case 'draft':
        return <Edit2 size={16} style={{ color: '#64748b' }} />
      case 'cancelled':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return '#10b981'
      case 'shipped': return '#3b82f6'
      case 'production': return '#f59e0b'
      case 'confirmed': return '#8b5cf6'
      case 'sent': return '#6b7280'
      case 'draft': return '#64748b'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Ricevuto'
      case 'shipped': return 'Spedito'
      case 'production': return 'In Produzione'
      case 'confirmed': return 'Confermato'
      case 'sent': return 'Inviato'
      case 'draft': return 'Bozza'
      case 'cancelled': return 'Annullato'
      default: return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981'
      case 'partial': return '#f59e0b'
      case 'pending': return '#6b7280'
      case 'overdue': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['draft', 'sent', 'confirmed', 'production'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    received: orders.filter(o => o.status === 'received').length,
    totalValueEUR: orders.reduce((sum, o) => sum + o.total_amount_eur, 0),
    avgDeliveryTime: 12 // giorni medi - da calcolare
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#64748b'
      }}>
        <div>Caricamento ordini fornitori...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        padding: '2rem 2rem 4rem 2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              Ordini Fornitori
            </h1>
            <p style={{ margin: '0', opacity: 0.9 }}>
              Gestione ordini hardware Z108 dai fornitori cinesi
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
          gridTemplateColumns: 'repeat(6, 1fr)',
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
              <span style={{ fontSize: '14px', opacity: 0.9 }}>In Corso</span>
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
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Ricevuti</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.received}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <DollarSign size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Valore Totale</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{stats.totalValueEUR.toLocaleString()}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Calendar size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Consegna Media</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.avgDeliveryTime}gg</div>
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
              placeholder="Cerca per numero ordine, fornitore o tracking..."
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
              <option value="draft">Bozza</option>
              <option value="sent">Inviato</option>
              <option value="confirmed">Confermato</option>
              <option value="production">In Produzione</option>
              <option value="shipped">Spedito</option>
              <option value="received">Ricevuto</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#f1f5f9',
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
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Ordine
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Fornitore
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Prodotti
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Stato
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Valore
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Consegna
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
                            {order.order_number}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {new Date(order.ordered_at).toLocaleDateString('it-IT')}
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
                            {order.supplier?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {order.supplier?.city}, {order.supplier?.country}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: getPaymentStatusColor(order.payment_status),
                            marginTop: '2px',
                            fontWeight: '500'
                          }}>
                            💳 {order.payment_status}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ marginBottom: idx < order.items!.length - 1 ? '4px' : '0' }}>
                              <div style={{ fontSize: '13px', color: '#1e293b' }}>
                                {item.hardware_product.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Qty: {item.quantity} × ${item.unit_price}
                              </div>
                            </div>
                          ))}
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
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            €{order.total_amount_eur.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            ${order.total_amount.toFixed(2)} USD
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          {order.expected_delivery_date && (
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              Attesa: {new Date(order.expected_delivery_date).toLocaleDateString('it-IT')}
                            </div>
                          )}
                          {order.actual_delivery_date && (
                            <div style={{ fontSize: '13px', color: '#10b981', marginTop: '2px' }}>
                              ✅ {new Date(order.actual_delivery_date).toLocaleDateString('it-IT')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              padding: '6px',
                              background: '#f1f5f9',
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
                              background: '#f1f5f9',
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
                              background: '#f1f5f9',
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
    </div>
  )
}

export default SupplierOrdersDashboard