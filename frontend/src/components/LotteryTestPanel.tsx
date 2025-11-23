import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { lotteryService } from '../services/lotteryService'
import { Play, Users, Ticket, Trophy, Trash2, RefreshCw, ChevronDown, ChevronUp, Settings } from 'lucide-react'

interface LotteryTestPanelProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

export const LotteryTestPanel: React.FC<LotteryTestPanelProps> = ({ organizationId, primaryColor, secondaryColor }) => {
  const [loading, setLoading] = useState(false)
  const [testEventId, setTestEventId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

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
      console.log('🗑️ Iniziando pulizia per evento:', testEventId)

      // Usa il servizio per eliminare tutto
      await lotteryService.deleteEvent(testEventId)

      console.log('✅ Pulizia completata con successo!')
      setTestEventId(null)
      showMessage('✅ Pulizia completata!')
    } catch (error: any) {
      console.error('❌ Errore durante pulizia:', error)
      showMessage(`❌ Errore: ${error.message}`, true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      <div style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        color: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        marginBottom: '2rem',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.2)'
      }}>
      {/* Header sempre visibile */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: 'rgba(0,0,0,0.2)',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={22} className="animate-spin-slow" />
          <span>Pannello di Test per Sviluppatori</span>
        </div>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </div>

      {/* Contenuto espandibile */}
      {isExpanded && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
        {/* Crea evento */}
        <button
          onClick={createTestEvent}
          disabled={loading || !!testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#4b5563' : '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <Trophy size={18} />
          1. Crea Evento Test
        </button>

        {/* Crea biglietti - 10 */}
        <button
          onClick={() => createTestTickets(10)}
          disabled={loading || !testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#3b82f6' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Ticket size={18} />
          10 Biglietti
        </button>

        {/* Crea biglietti - 50 */}
        <button
          onClick={() => createTestTickets(50)}
          disabled={loading || !testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#3b82f6' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Ticket size={18} />
          50 Biglietti
        </button>

        {/* Biglietti omaggio */}
        <button
          onClick={() => createComplimentaryTickets(5)}
          disabled={loading || !testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#10b981' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Users size={18} />
          5 Biglietti Omaggio
        </button>

        {/* Apri display */}
        <button
          onClick={openDisplay}
          disabled={loading || !testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#f59e0b' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          📺 Apri Display
        </button>

        {/* Avvia estrazione */}
        <button
          onClick={startTestExtraction}
          disabled={loading || !testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#dc2626' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Play size={18} />
          🎰 AVVIA ESTRAZIONE
        </button>

        {/* Pulisci */}
        <button
          onClick={cleanup}
          disabled={loading || !testEventId}
          style={{
            padding: '14px 16px',
            backgroundColor: testEventId ? '#7f1d1d' : '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: testEventId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            gridColumn: 'span 1'
          }}
        >
          <Trash2 size={18} />
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
      )}
      </div>
    </>
  )
}
