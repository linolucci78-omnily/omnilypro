import React, { useState } from 'react'
import { Play, RotateCcw, Radio, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LotteryEvent } from '../services/lotteryService'
import './LotteryRemoteControl.css'

interface LotteryRemoteControlProps {
  events: LotteryEvent[]
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

export const LotteryRemoteControl: React.FC<LotteryRemoteControlProps> = ({
  events,
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const sendCommand = async (command: 'START_EXTRACTION' | 'RESET') => {
    if (!selectedEventId) {
      showMessage('⚠️ Seleziona prima un evento!', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lottery_extraction_commands')
        .insert({
          event_id: selectedEventId,
          organization_id: organizationId,
          command: command,
          status: 'pending'
        })

      if (error) throw error

      const commandText = command === 'START_EXTRACTION' ? '🚀 Avvia Estrazione' : '🔄 Reset'
      showMessage(`✅ Comando "${commandText}" inviato con successo!`, 'success')
    } catch (error: any) {
      console.error('Error sending command:', error)
      showMessage(`❌ Errore: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return (
    <div className="remote-control-card">
      <div
        className="remote-header"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="remote-header-content">
          <Radio size={24} />
          <div className="remote-title">
            <h3>Telecomando</h3>
            <p>Controlla l'estrazione da qui</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div className="remote-body">
          {message && (
            <div className={`remote-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Selettore Evento */}
          <div className="remote-section">
            <label>
              <Zap size={18} />
              <span>Seleziona Evento</span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={loading}
              className="remote-select"
            >
              <option value="">-- Scegli un evento --</option>
              {events
                .filter(e => e.status === 'active')
                .map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.total_tickets_sold} biglietti)
                  </option>
                ))}
            </select>
          </div>

          {/* Info Evento Selezionato */}
          {selectedEvent && (
            <div className="event-info-box" style={{ borderColor: primaryColor }}>
              <div className="info-row">
                <span className="info-label">Evento:</span>
                <span className="info-value">{selectedEvent.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Biglietti venduti:</span>
                <span className="info-value">{selectedEvent.total_tickets_sold}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Premio:</span>
                <span className="info-value">{selectedEvent.prize_name || 'Non specificato'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Data estrazione:</span>
                <span className="info-value">
                  {new Date(selectedEvent.extraction_date).toLocaleString('it-IT')}
                </span>
              </div>
            </div>
          )}

          {/* Pulsanti di Controllo */}
          <div className="remote-controls">
            <button
              className="remote-btn start"
              onClick={() => sendCommand('START_EXTRACTION')}
              disabled={loading || !selectedEventId}
              style={{
                background: selectedEventId && !loading
                  ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                  : undefined
              }}
            >
              <Play size={20} />
              <span>Avvia Estrazione</span>
            </button>

            <button
              className="remote-btn reset"
              onClick={() => sendCommand('RESET')}
              disabled={loading || !selectedEventId}
            >
              <RotateCcw size={20} />
              <span>Reset</span>
            </button>
          </div>

          {/* Info */}
          <div className="remote-info">
            <p>💡 <strong>Tip:</strong> Assicurati che il display sia aperto prima di avviare l'estrazione!</p>
            <p>📺 Il display riceverà i comandi in tempo reale via Supabase Realtime.</p>
          </div>
        </div>
      )}
    </div>
  )
}
