import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { lotteryService } from '../services/lotteryService'
import { Play, Users, Ticket, Trophy, Trash2, RefreshCw } from 'lucide-react'

interface LotteryTestPanelProps {
  organizationId: string
}

export const LotteryTestPanel: React.FC<LotteryTestPanelProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(false)
  const [testEventId, setTestEventId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  // 1. Crea evento di test
  const createTestEvent = async () => {
    setLoading(true)
    try {
      const event = await lotteryService.createEvent({
        organization_id: organizationId,
        name: 'TEST - Lotteria di Prova',
        description: 'Evento di test per sviluppo',
        event_date: new Date().toISOString(),
        extraction_date: new Date(Date.now() + 3600000).toISOString(), // +1 ora
        ticket_price: 5.00,
        prize_name: 'iPhone 15 Pro',
        prize_value: 1299,
        prize_description: 'Ultimo modello Apple',
        brand_colors: {
          primary: '#8B5CF6',
          secondary: '#EC4899',
          accent: '#F59E0B'
        },
        status: 'active'
      })

      setTestEventId(event.id)
      showMessage(`✅ Evento creato: ${event.id}`)
    } catch (error: any) {
      showMessage(`❌ Errore: ${error.message}`, true)
    } finally {
      setLoading(false)
    }
  }

  // 2. Crea biglietti di test
  const createTestTickets = async (count: number) => {
    if (!testEventId) {
      showMessage('❌ Crea prima un evento!', true)
      return
    }

    setLoading(true)
    try {
      const names = [
        'Mario Rossi', 'Giulia Bianchi', 'Luca Ferrari',
        'Anna Verdi', 'Francesco Romano', 'Sara Conti',
        'Marco Esposito', 'Elena Marino', 'Paolo Ricci',
        'Chiara Gallo', 'Andrea Colombo', 'Valentina Bruno'
      ]

      for (let i = 0; i < count; i++) {
        await lotteryService.sellTicket({
          eventId: testEventId,
          organizationId: organizationId,
          customerName: names[i % names.length],
          customerEmail: `test${i}@example.com`,
          customerPhone: `+3933${String(i).padStart(8, '0')}`,
          pricePaid: 5.00,
          staffName: 'Test Staff'
        })
      }

      showMessage(`✅ Creati ${count} biglietti!`)
    } catch (error: any) {
      showMessage(`❌ Errore: ${error.message}`, true)
    } finally {
      setLoading(false)
    }
  }

  // 3. Crea biglietti omaggio
  const createComplimentaryTickets = async (count: number) => {
    if (!testEventId) {
      showMessage('❌ Crea prima un evento!', true)
      return
    }

    setLoading(true)
    try {
      for (let i = 0; i < count; i++) {
        await lotteryService.sellTicket({
          eventId: testEventId,
          organizationId: organizationId,
          customerName: `Cliente Omaggio ${i + 1}`,
          pricePaid: 0, // Gratis!
          isComplimentary: true,
          staffName: 'Test Staff'
        })
      }

      showMessage(`✅ Creati ${count} biglietti omaggio!`)
    } catch (error: any) {
      showMessage(`❌ Errore: ${error.message}`, true)
    } finally {
      setLoading(false)
    }
  }

  // 4. Avvia estrazione di test
  const startTestExtraction = async () => {
    if (!testEventId) {
      showMessage('❌ Crea prima un evento e dei biglietti!', true)
      return
    }

    setLoading(true)
    try {
      await supabase.from('lottery_extraction_commands').insert({
        event_id: testEventId,
        organization_id: organizationId,
        command: 'START_EXTRACTION',
        status: 'pending'
      })

      showMessage('✅ Comando estrazione inviato! Apri il display!')
    } catch (error: any) {
      showMessage(`❌ Errore: ${error.message}`, true)
    } finally {
      setLoading(false)
    }
  }

  // 5. Apri display
  const openDisplay = () => {
    if (!testEventId) {
      showMessage('❌ Crea prima un evento!', true)
      return
    }

    window.open(`/lottery/display/${testEventId}`, '_blank', 'width=1920,height=1080')
    showMessage('✅ Display aperto in nuova finestra!')
  }

  // 6. Pulisci tutto
  const cleanup = async () => {
    if (!testEventId || !confirm('Eliminare l\'evento di test e tutti i biglietti?')) {
      return
    }

    setLoading(true)
    try {
      // Elimina biglietti
      await supabase
        .from('lottery_tickets')
        .delete()
        .eq('event_id', testEventId)

      // Elimina comandi
      await supabase
        .from('lottery_extraction_commands')
        .delete()
        .eq('event_id', testEventId)

      // Elimina estrazioni
      await supabase
        .from('lottery_extractions')
        .delete()
        .eq('event_id', testEventId)

      // Elimina evento
      await supabase
        .from('lottery_events')
        .delete()
        .eq('id', testEventId)

      setTestEventId(null)
      showMessage('✅ Pulizia completata!')
    } catch (error: any) {
      showMessage(`❌ Errore: ${error.message}`, true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#1f2937',
      color: '#fff',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      width: '350px',
      zIndex: 10000,
      fontFamily: 'monospace'
    }}>
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🧪 LOTTERY TEST PANEL
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: message.startsWith('❌') ? '#dc2626' : '#10b981',
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          {message}
        </div>
      )}

      {testEventId && (
        <div style={{
          padding: '8px',
          marginBottom: '15px',
          backgroundColor: '#374151',
          borderRadius: '6px',
          fontSize: '11px',
          wordBreak: 'break-all'
        }}>
          <strong>Event ID:</strong><br />
          {testEventId.substring(0, 20)}...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Crea evento */}
        <button
          onClick={createTestEvent}
          disabled={loading || !!testEventId}
          style={{
            padding: '10px',
            backgroundColor: testEventId ? '#4b5563' : '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: testEventId ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Trophy size={16} />
          1. Crea Evento Test
        </button>

        {/* Crea biglietti */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => createTestTickets(10)}
            disabled={loading || !testEventId}
            style={{
              padding: '10px',
              backgroundColor: testEventId ? '#3b82f6' : '#4b5563',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: testEventId ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Ticket size={14} />
            10 Biglietti
          </button>

          <button
            onClick={() => createTestTickets(50)}
            disabled={loading || !testEventId}
            style={{
              padding: '10px',
              backgroundColor: testEventId ? '#3b82f6' : '#4b5563',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: testEventId ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Ticket size={14} />
            50 Biglietti
          </button>
        </div>

        {/* Biglietti omaggio */}
        <button
          onClick={() => createComplimentaryTickets(5)}
          disabled={loading || !testEventId}
          style={{
            padding: '10px',
            backgroundColor: testEventId ? '#10b981' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Users size={14} />
          5 Biglietti Omaggio
        </button>

        {/* Apri display */}
        <button
          onClick={openDisplay}
          disabled={loading || !testEventId}
          style={{
            padding: '10px',
            backgroundColor: testEventId ? '#f59e0b' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          📺 Apri Display
        </button>

        {/* Avvia estrazione */}
        <button
          onClick={startTestExtraction}
          disabled={loading || !testEventId}
          style={{
            padding: '12px',
            backgroundColor: testEventId ? '#dc2626' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          <Play size={16} />
          🎰 AVVIA ESTRAZIONE
        </button>

        {/* Pulisci */}
        <button
          onClick={cleanup}
          disabled={loading || !testEventId}
          style={{
            padding: '8px',
            backgroundColor: testEventId ? '#7f1d1d' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '10px'
          }}
        >
          <Trash2 size={12} />
          Pulisci Tutto
        </button>
      </div>

      {loading && (
        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <RefreshCw size={14} className="animate-spin" />
          Caricamento...
        </div>
      )}
    </div>
  )
}
