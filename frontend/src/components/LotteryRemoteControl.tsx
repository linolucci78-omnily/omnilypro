import React, { useState, useEffect } from 'react'
import { Play, RotateCcw, Radio, Zap, ChevronDown, ChevronUp, Trophy, Monitor, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LotteryEvent, LotteryPrize, lotteryService } from '../services/lotteryService'
import { DisplayOptionsModal } from './DisplayOptionsModal'
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
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('')
  const [availablePrizes, setAvailablePrizes] = useState<LotteryPrize[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPrizes, setLoadingPrizes] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [showDisplayOptions, setShowDisplayOptions] = useState(false)

  // Load available prizes when event is selected
  useEffect(() => {
    if (selectedEventId) {
      loadAvailablePrizes()
    } else {
      setAvailablePrizes([])
      setSelectedPrizeId('')
    }
  }, [selectedEventId])

  const loadAvailablePrizes = async () => {
    if (!selectedEventId) return

    setLoadingPrizes(true)
    try {
      const prizes = await lotteryService.getAvailablePrizes(selectedEventId)
      setAvailablePrizes(prizes)

      // Maintain current selection if prize is still available
      if (prizes.length > 0) {
        const isCurrentPrizeStillAvailable = selectedPrizeId && prizes.some(p => p.id === selectedPrizeId)

        if (isCurrentPrizeStillAvailable) {
          // Keep currently selected prize
          console.log('✅ Mantengo il premio selezionato:', selectedPrizeId)
        } else {
          // Otherwise select first available prize
          console.log('🔄 Seleziono il primo premio disponibile')
          setSelectedPrizeId(prizes[0].id)
        }
      } else {
        setSelectedPrizeId('')
        showMessage('⚠️ Tutti i premi sono stati estratti!', 'info')
      }
    } catch (error: any) {
      console.error('Error loading prizes:', error)
      showMessage(`❌ Errore caricamento premi: ${error.message}`, 'error')
      setAvailablePrizes([])
    } finally {
      setLoadingPrizes(false)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleOpenDisplayOptions = () => {
    if (!selectedEventId) {
      showMessage('⚠️ Seleziona prima un evento!', 'error')
      return
    }
    setShowDisplayOptions(true)
  }

  const sendCommand = async (command: 'START_EXTRACTION' | 'RESET' | 'CLEAR_SCREEN') => {
    if (!selectedEventId) {
      showMessage('⚠️ Seleziona prima un evento!', 'error')
      return
    }

    // For START_EXTRACTION, require prize selection
    if (command === 'START_EXTRACTION') {
      if (!selectedPrizeId) {
        showMessage('⚠️ Seleziona il premio da estrarre!', 'error')
        return
      }
      if (availablePrizes.length === 0) {
        showMessage('⚠️ Nessun premio disponibile per l\'estrazione!', 'error')
        return
      }
    }

    setLoading(true)
    try {
      const commandData: any = {
        event_id: selectedEventId,
        organization_id: organizationId,
        command: command,
        status: 'pending'
      }

      // Add prize_id metadata for START_EXTRACTION
      if (command === 'START_EXTRACTION' && selectedPrizeId) {
        commandData.metadata = { prize_id: selectedPrizeId }
      }

      const { error } = await supabase
        .from('lottery_extraction_commands')
        .insert(commandData)

      if (error) throw error

      const messages = {
        'START_EXTRACTION': '▶️ Estrazione avviata!',
        'RESET': '🔄 Reset completato!',
        'CLEAR_SCREEN': '🧹 Schermo pulito!'
      }
      showMessage(`✅ ${messages[command]}`, 'success')

      // Reload prizes after extraction to update available list
      if (command === 'START_EXTRACTION') {
        setTimeout(() => loadAvailablePrizes(), 2000)
      }
    } catch (error: any) {
      console.error('Error sending command:', error)
      showMessage(`❌ Errore: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const sendScreenMessage = async () => {
    if (!selectedEventId) {
      showMessage('⚠️ Seleziona prima un evento!', 'error')
      return
    }

    if (!customMessage.trim()) {
      showMessage('⚠️ Scrivi un messaggio!', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lottery_extraction_commands')
        .insert({
          event_id: selectedEventId,
          organization_id: organizationId,
          command: 'SHOW_MESSAGE',
          metadata: { message: customMessage },
          status: 'pending'
        })

      if (error) throw error

      showMessage('✅ Messaggio inviato!', 'success')
      setCustomMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
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

          {/* Selettore Premio */}
          {selectedEventId && (
            <div className="remote-section">
              <label>
                <Trophy size={18} />
                <span>Seleziona Premio</span>
              </label>
              {loadingPrizes ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>
                  Caricamento premi...
                </div>
              ) : availablePrizes.length > 0 ? (
                <select
                  value={selectedPrizeId}
                  onChange={(e) => setSelectedPrizeId(e.target.value)}
                  disabled={loading}
                  className="remote-select"
                >
                  {availablePrizes.map((prize) => (
                    <option key={prize.id} value={prize.id}>
                      {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : prize.rank === 3 ? '🥉' : '🎁'} {' '}
                      {prize.rank}° Premio - {prize.prize_name}
                      {prize.prize_value ? ` (€${prize.prize_value.toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981' }}>
                  ✓ Tutti i premi estratti!
                </div>
              )}
            </div>
          )}

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

          {/* Display Management Button */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="remote-btn start"
              onClick={handleOpenDisplayOptions}
              disabled={!selectedEventId || loading}
              style={{
                width: '100%',
                background: selectedEventId && !loading
                  ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                  : undefined
              }}
            >
              <Monitor size={20} />
              <span>Gestione Display</span>
            </button>
          </div>

          {/* Pulsanti di Controllo */}
          <div className="remote-controls">
            <button
              className="remote-btn start"
              onClick={() => sendCommand('START_EXTRACTION')}
              disabled={loading || !selectedEventId || !selectedPrizeId}
              style={{
                background: selectedEventId && !loading && selectedPrizeId
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

          {/* Message Input */}
          {selectedEventId && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Messaggio per lo schermo..."
                disabled={loading}
                className="remote-select"
                style={{ flex: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') sendScreenMessage()
                }}
              />
              <button
                className="remote-btn reset"
                onClick={sendScreenMessage}
                disabled={loading || !customMessage.trim()}
                style={{ padding: '0.75rem' }}
              >
                <Send size={18} />
              </button>
            </div>
          )}

          {/* Info */}
          <div className="remote-info">
            <p>💡 <strong>Tip:</strong> Assicurati che il display sia aperto prima di avviare l'estrazione!</p>
            <p>📺 Il display riceverà i comandi in tempo reale via Supabase Realtime.</p>
          </div>
        </div>
      )}

      {/* Display Options Modal */}
      {selectedEvent && (
        <DisplayOptionsModal
          isOpen={showDisplayOptions}
          onClose={() => setShowDisplayOptions(false)}
          eventId={selectedEventId}
          eventName={selectedEvent.name}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  )
}

