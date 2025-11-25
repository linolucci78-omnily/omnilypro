import React, { useState, useEffect } from 'react'
import { Ticket, TrendingUp, Trophy, Users, DollarSign, Play, Calendar, Plus, ExternalLink, Radio, ArrowLeft, BarChart3, Scan } from 'lucide-react'
import { lotteryService, LotteryEvent } from '../services/lotteryService'
import { supabase } from '../lib/supabase'
import LotteryManagement from './LotteryManagement'
import { LotteryRemoteControlModal } from './LotteryRemoteControlModal'
import LotteryTicketVerifier from './LotteryTicketVerifier'
import './LotteryHub.css'

interface LotteryHubProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
  staffId?: string
  staffName?: string
}

type ViewType = 'hub' | 'manage'

const LotteryHub: React.FC<LotteryHubProps> = ({
  organizationId,
  primaryColor,
  secondaryColor,
  staffId,
  staffName
}) => {
  const [activeView, setActiveView] = useState<ViewType>('hub')
  const [events, setEvents] = useState<LotteryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showRemoteControl, setShowRemoteControl] = useState(false)
  const [showVerifier, setShowVerifier] = useState(false)
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    topEvents: [] as LotteryEvent[]
  })

  useEffect(() => {
    fetchEvents()
  }, [organizationId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const allEvents = await lotteryService.getEvents(organizationId)
      setEvents(allEvents)

      // Calcola statistiche
      const active = allEvents.filter(e => e.status === 'active').length
      const totalTickets = allEvents.reduce((sum, e) => sum + e.total_tickets_sold, 0)
      const totalRevenue = allEvents.reduce((sum, e) => sum + e.total_revenue, 0)

      // Top 3 eventi per biglietti venduti
      const topEvents = [...allEvents]
        .sort((a, b) => b.total_tickets_sold - a.total_tickets_sold)
        .slice(0, 3)

      setStats({
        totalEvents: allEvents.length,
        activeEvents: active,
        totalTicketsSold: totalTickets,
        totalRevenue,
        topEvents
      })
    } catch (error) {
      console.error('Error fetching lottery events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Vista gestione completa
  if (activeView === 'manage') {
    return (
      <div>
        <button
          className="back-button"
          onClick={() => {
            setActiveView('hub')
            fetchEvents() // Ricarica stats quando torni indietro
          }}
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={20} />
          <span>Torna a Lotterie</span>
        </button>
        <LotteryManagement
          organizationId={organizationId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          staffId={staffId}
          staffName={staffName}
        />
      </div>
    )
  }

  // Vista principale Hub
  return (
    <div
      className="lottery-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      <div className="lottery-hub-header">
        <div className="lottery-hub-header-content">
          <div className="lottery-hub-icon">
            <Ticket size={48} />
          </div>
          <div>
            <h1>Centro Lotterie</h1>
            <p>Gestisci eventi lotteria, monitora le vendite e organizza estrazioni</p>
          </div>
        </div>
      </div>

      {/* Statistiche Overview */}
      <div className="lottery-stats-grid">
        <div className="lottery-stat-card">
          <div className="lottery-stat-icon" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <Calendar size={24} />
          </div>
          <div className="lottery-stat-content">
            <div className="lottery-stat-value">{stats.activeEvents}</div>
            <div className="lottery-stat-label">Eventi Attivi</div>
          </div>
        </div>

        <div className="lottery-stat-card">
          <div className="lottery-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Ticket size={24} />
          </div>
          <div className="lottery-stat-content">
            <div className="lottery-stat-value">{stats.totalTicketsSold}</div>
            <div className="lottery-stat-label">Biglietti Venduti</div>
          </div>
        </div>

        <div className="lottery-stat-card">
          <div className="lottery-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <DollarSign size={24} />
          </div>
          <div className="lottery-stat-content">
            <div className="lottery-stat-value">€{stats.totalRevenue.toFixed(0)}</div>
            <div className="lottery-stat-label">Ricavi Totali</div>
          </div>
        </div>

        <div className="lottery-stat-card">
          <div className="lottery-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <BarChart3 size={24} />
          </div>
          <div className="lottery-stat-content">
            <div className="lottery-stat-value">{stats.totalEvents}</div>
            <div className="lottery-stat-label">Eventi Totali</div>
          </div>
        </div>
      </div>

      {/* Top 3 Eventi */}
      {stats.topEvents.length > 0 && (
        <div className="lottery-top-section">
          <h2><Trophy size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Top 3 Eventi per Vendite</h2>
          <div className="lottery-top-grid">
            {stats.topEvents.map((event, index) => (
              <div key={event.id} className="lottery-top-card">
                <div className="lottery-top-badge">#{index + 1}</div>
                <div className="lottery-top-info">
                  <h3>{event.name}</h3>
                  <p className="lottery-top-description">{event.description}</p>
                  <div className="lottery-top-meta">
                    <span className="lottery-top-tickets">
                      <Ticket size={16} />
                      {event.total_tickets_sold} biglietti
                    </span>
                    <span className="lottery-top-revenue">
                      <DollarSign size={16} />
                      €{event.total_revenue.toFixed(2)}
                    </span>
                  </div>
                  {event.prize_name && (
                    <div className="lottery-top-prize">
                      <Trophy size={16} />
                      {event.prize_name}
                      {event.prize_value && ` - €${event.prize_value}`}
                    </div>
                  )}
                  <div className="lottery-top-status">
                    <span className={`lottery-status-badge lottery-status-${event.status}`}>
                      {event.status === 'active' ? 'Attivo' : event.status === 'extracted' ? 'Estratto' : event.status === 'closed' ? 'Chiuso' : 'Bozza'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Azioni Rapide */}
      <div className="lottery-actions-section">
        <h2>Azioni Rapide</h2>
        <div className="lottery-actions-grid">
          <button
            className="lottery-action-card"
            onClick={() => setActiveView('manage')}
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}
          >
            <Calendar size={32} />
            <h3>Gestisci Eventi</h3>
            <p>Crea, modifica ed elimina eventi lotteria</p>
          </button>

          <button
            className="lottery-action-card lottery-action-secondary"
            onClick={() => setActiveView('manage')}
          >
            <Ticket size={32} />
            <h3>Vendi Biglietto</h3>
            <p>Vendi biglietti per eventi attivi</p>
          </button>

          <button
            className="lottery-action-card lottery-action-secondary"
            onClick={() => setShowVerifier(true)}
          >
            <Scan size={32} />
            <h3>Verifica Biglietto</h3>
            <p>Scansiona QR code per verificare autenticità</p>
          </button>

          <button
            className="lottery-action-card lottery-action-secondary"
            onClick={() => {
              // Apri primo evento attivo in display mode
              const activeEvent = events.find(e => e.status === 'active')
              if (activeEvent) {
                window.open(`/lottery/display/${activeEvent.id}`, '_blank', 'fullscreen=yes')
              } else {
                alert('Nessun evento attivo da visualizzare')
              }
            }}
          >
            <ExternalLink size={32} />
            <h3>Apri Display</h3>
            <p>Visualizza display estrazione su schermo grande</p>
          </button>

          <button
            className="lottery-action-card lottery-action-secondary"
            onClick={() => setShowRemoteControl(true)}
          >
            <Radio size={32} />
            <h3>Telecomando</h3>
            <p>Controlla display e gestisci estrazioni da remoto</p>
          </button>
        </div>
      </div>

      {/* Elenco Eventi Recenti */}
      {events.length > 0 && (
        <div className="lottery-recent-section">
          <div className="lottery-recent-header">
            <h2>Eventi Recenti</h2>
            <button
              className="lottery-view-all-btn"
              onClick={() => setActiveView('manage')}
              style={{ color: primaryColor }}
            >
              Vedi tutti →
            </button>
          </div>
          <div className="lottery-recent-grid">
            {events.slice(0, 4).map((event) => (
              <div key={event.id} className="lottery-recent-card">
                <div className="lottery-recent-header-card">
                  <h3>{event.name}</h3>
                  <span className={`lottery-status-badge lottery-status-${event.status}`}>
                    {event.status === 'active' ? 'Attivo' : event.status === 'extracted' ? 'Estratto' : event.status === 'closed' ? 'Chiuso' : 'Bozza'}
                  </span>
                </div>
                {event.description && (
                  <p className="lottery-recent-description">{event.description}</p>
                )}
                <div className="lottery-recent-stats">
                  <div className="lottery-recent-stat">
                    <Ticket size={18} />
                    <span>{event.total_tickets_sold} biglietti</span>
                  </div>
                  <div className="lottery-recent-stat">
                    <DollarSign size={18} />
                    <span>€{event.total_revenue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="lottery-recent-date">
                  <Calendar size={16} />
                  Estrazione: {new Date(event.extraction_date).toLocaleDateString('it-IT')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && !loading && (
        <div className="lottery-empty-state">
          <Ticket size={64} style={{ opacity: 0.3 }} />
          <h3>Nessun evento lotteria</h3>
          <p>Inizia creando il tuo primo evento lotteria!</p>
          <button
            className="lottery-create-btn"
            onClick={() => setActiveView('manage')}
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}
          >
            <Plus size={20} />
            Crea Primo Evento
          </button>
        </div>
      )}

      {/* Remote Control Modal */}
      <LotteryRemoteControlModal
        isOpen={showRemoteControl}
        onClose={() => setShowRemoteControl(false)}
        events={events}
        organizationId={organizationId}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Ticket Verifier Modal */}
      {showVerifier && (
        <div
          style={{
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
          }}
          onClick={() => setShowVerifier(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVerifier(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              ×
            </button>
            <LotteryTicketVerifier
              organizationId={organizationId}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default LotteryHub
