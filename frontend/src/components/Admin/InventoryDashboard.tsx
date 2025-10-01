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
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Warehouse,
  ShoppingCart,
  Archive,
  RefreshCw,
  Settings
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PageLoader from '../UI/PageLoader'

interface InventoryItem {
  id: string
  hardware_product_id: string
  sku: string
  quantity_available: number
  quantity_reserved: number
  quantity_defective: number
  reorder_point: number
  max_stock: number
  location: string
  last_restock_date?: string
  cost_per_unit: number
  total_value: number
  hardware_product: {
    name: string
    model: string
    sku: string
    description: string
    specifications: any
  }
}

interface InventoryMovement {
  id: string
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DEFECTIVE' | 'RESERVED' | 'UNRESERVED'
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  performed_at: string
  hardware_product: {
    name: string
    sku: string
  }
}

const InventoryDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)

  // Mock data per demo
  const mockInventory: InventoryItem[] = [
    {
      id: '1',
      hardware_product_id: 'prod-1',
      sku: 'Z108-STD',
      quantity_available: 45,
      quantity_reserved: 5,
      quantity_defective: 2,
      reorder_point: 20,
      max_stock: 100,
      location: 'Main Warehouse',
      last_restock_date: '2025-09-18T00:00:00Z',
      cost_per_unit: 170.00,
      total_value: 7650.00,
      hardware_product: {
        name: 'Z108 Standard POS Terminal',
        model: 'Z108',
        sku: 'Z108-STD',
        description: 'Standard POS terminal with 8" display, NFC, thermal printer',
        specifications: { display: "8inch", nfc: true, printer: "thermal" }
      }
    },
    {
      id: '2',
      hardware_product_id: 'prod-2',
      sku: 'Z108-PRO',
      quantity_available: 8,
      quantity_reserved: 2,
      quantity_defective: 0,
      reorder_point: 15,
      max_stock: 50,
      location: 'Main Warehouse',
      last_restock_date: '2025-08-20T00:00:00Z',
      cost_per_unit: 220.00,
      total_value: 1760.00,
      hardware_product: {
        name: 'Z108 Pro POS Terminal',
        model: 'Z108_PRO',
        sku: 'Z108-PRO',
        description: 'Professional POS terminal with enhanced features',
        specifications: { display: "8inch", nfc: true, printer: "thermal", camera: true }
      }
    },
    {
      id: '3',
      hardware_product_id: 'prod-3',
      sku: 'CUST-DISP',
      quantity_available: 25,
      quantity_reserved: 3,
      quantity_defective: 1,
      reorder_point: 10,
      max_stock: 50,
      location: 'Main Warehouse',
      last_restock_date: '2025-09-10T00:00:00Z',
      cost_per_unit: 65.00,
      total_value: 1625.00,
      hardware_product: {
        name: 'Customer Display 7"',
        model: 'CUSTOMER_DISPLAY',
        sku: 'CUST-DISP',
        description: 'Secondary customer-facing display',
        specifications: { display: "7inch", touch: false }
      }
    }
  ]

  const mockMovements: InventoryMovement[] = [
    {
      id: '1',
      movement_type: 'IN',
      quantity: 100,
      reference_type: 'supplier_order',
      reference_id: 'PO-2025-001',
      notes: 'Ricevimento da TechnoChina Ltd',
      performed_at: '2025-09-18T09:15:00Z',
      hardware_product: {
        name: 'Z108 Standard POS Terminal',
        sku: 'Z108-STD'
      }
    },
    {
      id: '2',
      movement_type: 'OUT',
      quantity: -10,
      reference_type: 'customer_order',
      reference_id: 'HW-2025-045',
      notes: 'Spedizione a cliente Ristorante Da Mario',
      performed_at: '2025-09-20T14:30:00Z',
      hardware_product: {
        name: 'Z108 Standard POS Terminal',
        sku: 'Z108-STD'
      }
    },
    {
      id: '3',
      movement_type: 'RESERVED',
      quantity: -5,
      reference_type: 'customer_order',
      reference_id: 'HW-2025-046',
      notes: 'Riservato per ordine Bar Centrale',
      performed_at: '2025-09-25T10:00:00Z',
      hardware_product: {
        name: 'Z108 Standard POS Terminal',
        sku: 'Z108-STD'
      }
    },
    {
      id: '4',
      movement_type: 'DEFECTIVE',
      quantity: -2,
      reference_type: 'quality_control',
      notes: 'Unità difettose da ultimo lotto',
      performed_at: '2025-09-19T11:30:00Z',
      hardware_product: {
        name: 'Z108 Standard POS Terminal',
        sku: 'Z108-STD'
      }
    }
  ]

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      // In futuro, sostituire con vera query Supabase
      setTimeout(() => {
        setInventory(mockInventory)
        setMovements(mockMovements)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error loading inventory:', error)
      setLoading(false)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_available <= 0) return 'out_of_stock'
    if (item.quantity_available <= item.reorder_point) return 'low_stock'
    if (item.quantity_available >= item.max_stock * 0.9) return 'overstock'
    return 'normal'
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'var(--omnily-error)'
      case 'low_stock': return 'var(--omnily-warning)'
      case 'overstock': return '#8b5cf6'
      case 'normal': return 'var(--omnily-primary)'
      default: return 'var(--omnily-gray-500)'
    }
  }

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'Esaurito'
      case 'low_stock': return 'Scorte Basse'
      case 'overstock': return 'Sovra Scorte'
      case 'normal': return 'Normale'
      default: return status
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <TrendingUp size={14} style={{ color: 'var(--omnily-primary)' }} />
      case 'OUT': return <TrendingDown size={14} style={{ color: 'var(--omnily-error)' }} />
      case 'RESERVED': return <Archive size={14} style={{ color: 'var(--omnily-warning)' }} />
      case 'UNRESERVED': return <RefreshCw size={14} style={{ color: 'var(--omnily-primary)' }} />
      case 'DEFECTIVE': return <XCircle size={14} style={{ color: 'var(--omnily-error)' }} />
      case 'ADJUSTMENT': return <Settings size={14} style={{ color: 'var(--omnily-gray-500)' }} />
      default: return <Package size={14} style={{ color: 'var(--omnily-gray-500)' }} />
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.hardware_product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLocation = locationFilter === 'all' || item.location === locationFilter

    const stockStatus = getStockStatus(item)
    const matchesStock = stockFilter === 'all' || stockStatus === stockFilter

    return matchesSearch && matchesLocation && matchesStock
  })

  const stats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + item.total_value, 0),
    lowStock: inventory.filter(item => getStockStatus(item) === 'low_stock').length,
    outOfStock: inventory.filter(item => getStockStatus(item) === 'out_of_stock').length,
    totalUnits: inventory.reduce((sum, item) => sum + item.quantity_available, 0),
    reservedUnits: inventory.reduce((sum, item) => sum + item.quantity_reserved, 0)
  }

  if (loading) {
    return <PageLoader message="Caricamento inventario hardware..." size="medium" />
  }

  return (
    <div className="inventory-dashboard">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        padding: '2rem 2rem 4rem 2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              Gestione Inventory
            </h1>
            <p style={{ margin: '0', opacity: 0.9 }}>
              Monitoraggio stock hardware Z108 e gestione magazzino
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowMovementModal(true)}
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
              <RefreshCw size={16} />
              Movimento
            </button>
            <button
              onClick={() => setShowAddProductModal(true)}
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
              Nuovo Prodotto
            </button>
          </div>
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
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Prodotti</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalItems}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Warehouse size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Unità Totali</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalUnits}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Archive size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Riservate</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.reservedUnits}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <AlertTriangle size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Scorte Basse</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.lowStock}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Esauriti</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.outOfStock}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <BarChart3 size={20} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>Valore Totale</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{stats.totalValue.toLocaleString()}</div>
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
              placeholder="Cerca per nome prodotto o SKU..."
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
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '130px'
              }}
            >
              <option value="all">Tutti Stock</option>
              <option value="normal">Normale</option>
              <option value="low_stock">Scorte Basse</option>
              <option value="out_of_stock">Esaurito</option>
              <option value="overstock">Sovra Scorte</option>
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

      {/* Content Grid */}
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Inventory Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <h3 style={{ margin: '0', color: '#1e293b', fontWeight: '600' }}>
              Stock Inventory ({filteredInventory.length})
            </h3>
          </div>

          {filteredInventory.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Nessun prodotto trovato</h3>
              <p style={{ margin: '0' }}>Non ci sono prodotti che corrispondono ai criteri di ricerca.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Prodotto
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Stock
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                      Valore
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item)
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#1e293b' }}>
                              {item.hardware_product.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              SKU: {item.sku} • {item.location}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {item.quantity_available} / {item.max_stock}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              Riservate: {item.quantity_reserved}
                            </div>
                            {item.quantity_defective > 0 && (
                              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>
                                Difettose: {item.quantity_defective}
                              </div>
                            )}
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
                            background: `${getStockStatusColor(stockStatus)}20`,
                            color: getStockStatusColor(stockStatus)
                          }}>
                            {stockStatus === 'low_stock' && <AlertTriangle size={12} />}
                            {stockStatus === 'out_of_stock' && <XCircle size={12} />}
                            {stockStatus === 'normal' && <CheckCircle size={12} />}
                            {stockStatus === 'overstock' && <TrendingUp size={12} />}
                            {getStockStatusLabel(stockStatus)}
                          </div>
                          {item.quantity_available <= item.reorder_point && (
                            <div style={{ fontSize: '11px', color: 'var(--omnily-warning)', marginTop: '4px' }}>
                              ⚠️ Sotto punto riordino ({item.reorder_point})
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              €{item.total_value.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              €{item.cost_per_unit.toFixed(2)} / unità
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setSelectedItem(item)}
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
                              title="Modifica stock"
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          height: 'fit-content'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <h3 style={{ margin: '0', color: '#1e293b', fontWeight: '600' }}>
              Movimenti Recenti
            </h3>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {movements.map((movement) => (
              <div key={movement.id} style={{
                padding: '1rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getMovementIcon(movement.movement_type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#1e293b' }}>
                    {movement.movement_type} • {movement.hardware_product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Qty: {Math.abs(movement.quantity)} • {new Date(movement.performed_at).toLocaleDateString('it-IT')}
                  </div>
                  {movement.notes && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {movement.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movement Modal */}
      {showMovementModal && (
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
            maxWidth: '500px',
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
                Registra Movimento Inventario
              </h2>
              <button
                onClick={() => setShowMovementModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              setShowMovementModal(false)
            }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Prodotto *
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
                    <option value="">Seleziona prodotto...</option>
                    <option value="Z108-STD">Z108 Standard POS Terminal</option>
                    <option value="Z108-PRO">Z108 Pro POS Terminal</option>
                    <option value="ACC-PRINTER">Stampante Termica</option>
                    <option value="ACC-SCANNER">Scanner Barcode</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Tipo Movimento *
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
                    <option value="IN">Entrata (IN) - Nuovi arrivi</option>
                    <option value="OUT">Uscita (OUT) - Spedizione ordine</option>
                    <option value="ADJUSTMENT">Aggiustamento inventario</option>
                    <option value="DEFECTIVE">Prodotto difettoso</option>
                    <option value="RESERVED">Riservato per ordine</option>
                    <option value="UNRESERVED">Rilasciata riserva</option>
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

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Riferimento (Ordine/Documento)
                  </label>
                  <input
                    type="text"
                    placeholder="es. ORD-2025-001, DOC-123"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Note aggiuntive..."
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
              </div>

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
                  onClick={() => setShowMovementModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f8fafc',
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
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white'
                  }}
                >
                  Registra Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
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
                Aggiungi Nuovo Prodotto Hardware
              </h2>
              <button
                onClick={() => setShowAddProductModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              setShowAddProductModal(false)
            }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Nome Prodotto *
                    </label>
                    <input
                      type="text"
                      placeholder="es. Z108 Pro POS Terminal"
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
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      SKU *
                    </label>
                    <input
                      type="text"
                      placeholder="Z108-PRO"
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

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Categoria *
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
                    <option value="">Seleziona categoria...</option>
                    <option value="terminals">Terminali POS</option>
                    <option value="accessories">Accessori</option>
                    <option value="cables">Cavi e Connettori</option>
                    <option value="stands">Supporti e Stand</option>
                    <option value="replacements">Ricambi</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Costo Unitario (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="200.00"
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
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Punto Riordino
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="20"
                      defaultValue="20"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Stock Massimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="100"
                      defaultValue="100"
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

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Ubicazione *
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
                    <option value="">Seleziona ubicazione...</option>
                    <option value="main">Main Warehouse</option>
                    <option value="storage">Storage Room</option>
                    <option value="repair">Repair Center</option>
                    <option value="quality">Quality Control</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Descrizione
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descrizione dettagliata del prodotto..."
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
              </div>

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
                  onClick={() => setShowAddProductModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f8fafc',
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
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white'
                  }}
                >
                  Aggiungi Prodotto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryDashboard