import React, { useState, useEffect } from 'react'
import {
  X,
  Radio,
  Play,
  RotateCcw,
  Power,
  Send,
  ChevronUp,
  ChevronDown,
  Circle,
  Trophy
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LotteryEvent, LotteryPrize, lotteryService } from '../services/lotteryService'
import './LotteryRemoteControlModal.css'

interface LotteryRemoteControlModalProps {
  isOpen: boolean
  onClose: () => void
  events: LotteryEvent[]
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

export const LotteryRemoteControlModal: React.FC<LotteryRemoteControlModalProps> = ({
  isOpen,
  onClose,
  events,
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('')
  const [availablePrizes, setAvailablePrizes] = useState<LotteryPrize[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPrizes, setLoadingPrizes] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [displayOpen, setDisplayOpen] = useState(false)

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
      console.log('🎁 Premi caricati dal servizio:', prizes)
      console.log('🎁 Numero premi disponibili:', prizes.length)
      console.log('🎁 Dettaglio premi:', prizes.map(p => ({ id: p.id, rank: p.rank, name: p.prize_name })))
      setAvailablePrizes(prizes)

      // Mantieni la selezione corrente se il premio è ancora disponibile
      if (prizes.length > 0) {
        const isCurrentPrizeStillAvailable = selectedPrizeId && prizes.some(p => p.id === selectedPrizeId)

        if (isCurrentPrizeStillAvailable) {
          // Mantieni il premio attualmente selezionato
          console.log('✅ Mantengo il premio selezionato:', selectedPrizeId)
        } else {
          // Altrimenti seleziona il primo premio disponibile
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

  if (!isOpen) return null

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const openDisplay = () => {
    if (!selectedEventId) {
      showMessage('⚠️ Seleziona prima un evento!', 'error')
      return
    }

    const displayWindow = window.open(
      `/lottery/display/${selectedEventId}`,
      'LotteryDisplay',
      'fullscreen=yes,width=1920,height=1080'
    )

    if (displayWindow) {
      setDisplayOpen(true)
      showMessage('✅ Display aperto!', 'success')
    } else {
      showMessage('❌ Impossibile aprire il display. Controlla i popup bloccati.', 'error')
    }
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
    <div className="remote-modal-overlay" onClick={onClose}>
      <div className="remote-control-device" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button onClick={onClose} className="remote-close-btn">
          <X size={20} />
        </button>

        {/* Brand Logo */}
        <div className="remote-brand">
          <Radio size={24} />
          <span>LOTTERY PRO</span>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`remote-status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Display Screen (mini preview) */}
        <div className="remote-screen">
          <div className="remote-screen-content">
            {selectedEvent ? (
              <>
                <div className="remote-screen-title">{selectedEvent.name}</div>
                <div className="remote-screen-info">
                  🎫 {selectedEvent.total_tickets_sold} biglietti
                </div>
                <div className={`remote-screen-status ${displayOpen ? 'active' : 'inactive'}`}>
                  <Circle size={8} fill="currentColor" />
                  {displayOpen ? 'DISPLAY ON AIR' : 'DISPLAY OFF'}
                </div>
              </>
            ) : (
              <div className="remote-screen-placeholder">
                Seleziona un evento
              </div>
            )}
          </div>
        </div>

        {/* Event Selector */}
        <div className="remote-selector-section">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loading}
            className="remote-event-selector"
          >
            <option value="">-- SELEZIONA EVENTO --</option>
            {events
              .filter(e => e.status === 'active')
              .map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
          </select>
        </div>

        {/* Prize Selector */}
        {selectedEventId && (
          <div className="remote-selector-section">
            <div className="remote-prize-selector-header">
              <Trophy size={16} />
              <span>SELEZIONA PREMIO</span>
            </div>
            {loadingPrizes ? (
              <div className="remote-prize-loading">Caricamento premi...</div>
            ) : availablePrizes.length > 0 ? (
              <>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Debug: {availablePrizes.length} premi in array
                </div>
                <select
                  value={selectedPrizeId}
                  onChange={(e) => setSelectedPrizeId(e.target.value)}
                  disabled={loading}
                  className="remote-prize-selector"
                >
                  {availablePrizes.map((prize, index) => {
                    console.log(`🎯 Rendering option ${index + 1}:`, prize)
                    return (
                      <option key={prize.id} value={prize.id}>
                        {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : prize.rank === 3 ? '🥉' : '🎁'} {' '}
                        {prize.rank}° Premio - {prize.prize_name}
                        {prize.prize_value ? ` (€${prize.prize_value.toFixed(2)})` : ''}
                      </option>
                    )
                  })}
                </select>
              </>
            ) : (
              <div className="remote-prize-empty">
                ✓ Tutti i premi estratti!
              </div>
            )}
          </div>
        )}

        {/* Power Button */}
        <div className="remote-power-section">
          <button
            className="remote-power-btn"
            onClick={openDisplay}
            disabled={!selectedEventId || loading}
            style={{
              background: selectedEventId && !loading
                ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                : undefined
            }}
          >
            <Power size={32} />
            <span>APRI DISPLAY</span>
          </button>
        </div>

        {/* Main Control Buttons */}
        <div className="remote-main-controls">
          <button
            className="remote-btn remote-btn-play"
            onClick={() => sendCommand('START_EXTRACTION')}
            disabled={loading || !selectedEventId}
          >
            <Play size={28} fill="currentColor" />
            <span>PLAY</span>
          </button>

          <button
            className="remote-btn remote-btn-reset"
            onClick={() => sendCommand('RESET')}
            disabled={loading || !selectedEventId}
          >
            <RotateCcw size={28} />
            <span>RESET</span>
          </button>
        </div>

        {/* Navigation Pad */}
        <div className="remote-nav-pad">
          <div className="remote-nav-circle">
            <button className="remote-nav-btn remote-nav-up" disabled>
              <ChevronUp size={20} />
            </button>
            <button className="remote-nav-btn remote-nav-down" disabled>
              <ChevronDown size={20} />
            </button>
            <button
              className="remote-nav-center"
              onClick={() => sendCommand('CLEAR_SCREEN')}
              disabled={loading || !selectedEventId}
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Message Input */}
        <div className="remote-message-section">
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Messaggio per lo schermo..."
            disabled={loading || !selectedEventId}
            className="remote-message-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendScreenMessage()
            }}
          />
          <button
            className="remote-send-btn"
            onClick={sendScreenMessage}
            disabled={loading || !selectedEventId || !customMessage.trim()}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Number Pad */}
        <div className="remote-number-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} className="remote-number-btn" disabled>
              {num}
            </button>
          ))}
          <button className="remote-number-btn" disabled>INFO</button>
          <button className="remote-number-btn">0</button>
          <button className="remote-number-btn" disabled>MENU</button>
        </div>

        {/* Bottom Info */}
        <div className="remote-bottom-info">
          <div className="remote-indicator">
            <Circle size={6} fill={displayOpen ? '#10b981' : '#6b7280'} />
            <span>LIVE</span>
          </div>
          <div className="remote-version">v2.0</div>
        </div>
      </div>
    </div>
  )
}
