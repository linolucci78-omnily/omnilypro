import React, { useState } from 'react'
import { Receipt, TestTube, Save, Clock } from 'lucide-react'
import { createPrintService, type PrintConfig, type Receipt as ReceiptData } from '../../services/printService'
import { useToast } from '../../hooks/useToast'

interface ReceiptDemoProps {
  printConfig: PrintConfig
  onReceiptDataChange?: (data: ReceiptData) => void
}

const ReceiptDemo: React.FC<ReceiptDemoProps> = ({ printConfig, onReceiptDataChange }) => {
  const [isTesting, setIsTesting] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    receiptNumber: `R${Date.now().toString().slice(-6)}`,
    timestamp: new Date(),
    items: [
      {
        name: 'Caffè Espresso',
        quantity: 2,
        price: 1.50,
        total: 3.00
      },
      {
        name: 'Cornetto alla Crema',
        quantity: 1,
        price: 2.50,
        total: 2.50
      },
      {
        name: 'Cappuccino',
        quantity: 1,
        price: 2.00,
        total: 2.00
      }
    ],
    subtotal: 7.50,
    tax: 1.65,
    total: 9.15,
    paymentMethod: 'Contanti',
    cashierName: 'Marco Rossi',
    customerPoints: 9,
    loyaltyCard: 'LY12345678'
  })
  const { showSuccess, showError } = useToast()

  // Notify parent component when receipt data changes
  React.useEffect(() => {
    if (onReceiptDataChange) {
      onReceiptDataChange(receiptData)
    }
  }, [receiptData, onReceiptDataChange])

  const handlePrintReceipt = async () => {
    setIsTesting(true)
    try {
      const printService = createPrintService(printConfig)
      const initialized = await printService.initialize()

      if (!initialized) {
        showError('Impossibile inizializzare la stampante')
        return
      }

      const success = await printService.printReceipt(receiptData)
      if (success) {
        showSuccess('Scontrino stampato con successo!')
      } else {
        showError('Errore durante la stampa dello scontrino')
      }
    } catch (error) {
      console.error('Print error:', error)
      showError('Errore durante la stampa')
    } finally {
      setIsTesting(false)
    }
  }

  const updateItem = (index: number, field: keyof typeof receiptData.items[0], value: string | number) => {
    const newItems = [...receiptData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalculate total for this item
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price
    }

    // Recalculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.22 // 22% IVA
    const total = subtotal + tax

    setReceiptData(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      tax,
      total
    }))
  }

  const addItem = () => {
    setReceiptData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: 'Nuovo Prodotto',
        quantity: 1,
        price: 1.00,
        total: 1.00
      }]
    }))
  }

  const removeItem = (index: number) => {
    const newItems = receiptData.items.filter((_, i) => i !== index)
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.22
    const total = subtotal + tax

    setReceiptData(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      tax,
      total
    }))
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Receipt size={24} style={{ color: '#10b981' }} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Demo Stampa Scontrino
        </h3>
        <button
          onClick={handlePrintReceipt}
          disabled={isTesting}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            backgroundColor: isTesting ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isTesting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TestTube size={16} />
          {isTesting ? 'Stampa in corso...' : 'Stampa Scontrino'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Receipt Editor */}
        <div>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Modifica Scontrino
          </h4>

          {/* Receipt Header */}
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Numero Scontrino
                </label>
                <input
                  type="text"
                  value={receiptData.receiptNumber}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Cassiere
                </label>
                <input
                  type="text"
                  value={receiptData.cashierName}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, cashierName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Metodo Pagamento
                </label>
                <select
                  value={receiptData.paymentMethod}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Contanti">Contanti</option>
                  <option value="Carta">Carta</option>
                  <option value="Bancomat">Bancomat</option>
                  <option value="Satispay">Satispay</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Carta Fedeltà
                </label>
                <input
                  type="text"
                  value={receiptData.loyaltyCard || ''}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, loyaltyCard: e.target.value || undefined }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Prodotti</h5>
              <button
                onClick={addItem}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                + Aggiungi
              </button>
            </div>

            {receiptData.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 80px 80px 30px',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <div style={{
                  padding: '6px 8px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textAlign: 'right',
                  fontWeight: '500'
                }}>
                  €{item.total.toFixed(2)}
                </div>
                <button
                  onClick={() => removeItem(index)}
                  style={{
                    padding: '4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>Subtotale:</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>€{receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>IVA 22%:</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>€{receiptData.tax.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #d1d5db',
              paddingTop: '8px',
              marginTop: '8px'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>TOTALE:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>€{receiptData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        <div>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Anteprima Scontrino (58mm)
          </h4>

          <div style={{
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.2',
            padding: '16px',
            borderRadius: '8px',
            width: '300px',
            margin: '0 auto',
            whiteSpace: 'pre-line'
          }}>
            {/* Logo */}
            {printConfig.logoBase64 && (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img 
                  src={printConfig.logoBase64} 
                  alt="Logo" 
                  style={{ 
                    maxWidth: '150px', 
                    maxHeight: '80px',
                    filter: 'invert(1)', // Inverte i colori per mostrare su sfondo nero
                    imageRendering: 'auto'
                  }} 
                />
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{printConfig.storeName}</div>
              <div>{printConfig.storeAddress}</div>
              <div>{printConfig.storePhone}</div>
              {printConfig.storeTax && <div>P.IVA: {printConfig.storeTax}</div>}
            </div>

            <div style={{ borderBottom: '1px dashed #fff', marginBottom: '8px', paddingBottom: '8px' }}>
              <div>Scontrino: {receiptData.receiptNumber}</div>
              <div>Data: {receiptData.timestamp.toLocaleString('it-IT')}</div>
              <div>Cassiere: {receiptData.cashierName}</div>
              {receiptData.loyaltyCard && <div>Carta: {receiptData.loyaltyCard}</div>}
            </div>

            <div style={{ marginBottom: '8px' }}>
              {receiptData.items.map((item, index) => (
                <div key={index}>
                  <div>{item.quantity}x {item.name.substring(0, 25)}{item.name.length > 25 ? '...' : ''}</div>
                  <div style={{ textAlign: 'right' }}>€{item.total.toFixed(2)}</div>
                  {item.quantity > 1 && (
                    <div style={{ textAlign: 'right', fontSize: '10px', color: '#ccc' }}>
                      (€{item.price.toFixed(2)} cad.)
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #fff', paddingTop: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotale:</span>
                <span>€{receiptData.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA 22%:</span>
                <span>€{receiptData.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>TOTALE:</span>
                <span>€{receiptData.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #fff', paddingTop: '8px', marginBottom: '8px' }}>
              <div>Pagamento: {receiptData.paymentMethod}</div>
              {receiptData.customerPoints && (
                <div>Punti guadagnati: {receiptData.customerPoints}</div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#ccc' }}>
              <div>Grazie per la visita!</div>
              <div>Powered by OMNILY PRO</div>
              <div style={{ marginTop: '8px' }}>[QR CODE]</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptDemo