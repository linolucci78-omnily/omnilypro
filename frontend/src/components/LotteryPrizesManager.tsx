import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Trophy, Save, X } from 'lucide-react'
import { lotteryService, LotteryPrize } from '../services/lotteryService'
import './LotteryPrizesManager.css'

interface LotteryPrizesManagerProps {
  eventId?: string // If provided, load existing prizes
  organizationId: string
  prizes: Prize[] // Controlled component
  onPrizesChange: (prizes: Prize[]) => void
  disabled?: boolean
}

export interface Prize {
  id?: string // Present if already saved to DB
  rank: number
  prize_name: string
  prize_value?: number
  prize_description?: string
  is_extracted?: boolean
}

export const LotteryPrizesManager: React.FC<LotteryPrizesManagerProps> = ({
  eventId,
  organizationId,
  prizes,
  onPrizesChange,
  disabled = false
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Load existing prizes if eventId is provided
  useEffect(() => {
    if (eventId) {
      loadPrizes()
    }
  }, [eventId])

  const loadPrizes = async () => {
    if (!eventId) return

    try {
      setLoading(true)
      const loadedPrizes = await lotteryService.getPrizesByEvent(eventId)
      onPrizesChange(loadedPrizes.map(p => ({
        id: p.id,
        rank: p.rank,
        prize_name: p.prize_name,
        prize_value: p.prize_value,
        prize_description: p.prize_description,
        is_extracted: p.is_extracted
      })))
    } catch (error: any) {
      console.error('Error loading prizes:', error)
      alert(`Errore nel caricamento dei premi: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addPrize = () => {
    const newRank = prizes.length + 1
    onPrizesChange([
      ...prizes,
      {
        rank: newRank,
        prize_name: `${newRank}° Premio`,
        prize_value: undefined,
        prize_description: ''
      }
    ])
    setEditingIndex(prizes.length)
  }

  const updatePrize = (index: number, updates: Partial<Prize>) => {
    const updated = [...prizes]
    updated[index] = { ...updated[index], ...updates }
    onPrizesChange(updated)
  }

  const removePrize = (index: number) => {
    const prize = prizes[index]

    // Prevent removing extracted prizes
    if (prize.is_extracted) {
      alert('Non puoi eliminare un premio già estratto!')
      return
    }

    if (confirm('Sei sicuro di voler eliminare questo premio?')) {
      const updated = prizes.filter((_, i) => i !== index)
      // Re-rank remaining prizes
      const reranked = updated.map((p, i) => ({ ...p, rank: i + 1 }))
      onPrizesChange(reranked)
    }
  }

  const getRankLabel = (rank: number): string => {
    if (rank === 1) return '1° Premio'
    if (rank === 2) return '2° Premio'
    if (rank === 3) return '3° Premio'
    return `${rank}° Premio`
  }

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '🎁'
  }

  if (loading) {
    return <div className="prizes-manager-loading">Caricamento premi...</div>
  }

  return (
    <div className="prizes-manager">
      <div className="prizes-manager-header">
        <Trophy size={20} />
        <h3>Premi della Lotteria</h3>
        <span className="prizes-count">{prizes.length} {prizes.length === 1 ? 'premio' : 'premi'}</span>
      </div>

      <div className="prizes-list">
        {prizes.length === 0 && (
          <div className="prizes-empty">
            <Trophy size={48} style={{ opacity: 0.3 }} />
            <p>Nessun premio configurato</p>
            <p className="prizes-empty-hint">Aggiungi almeno un premio per iniziare</p>
          </div>
        )}

        {prizes.map((prize, index) => (
          <div
            key={index}
            className={`prize-item ${editingIndex === index ? 'editing' : ''} ${prize.is_extracted ? 'extracted' : ''}`}
          >
            <div className="prize-rank-badge">
              <span className="prize-rank-emoji">{getRankEmoji(prize.rank)}</span>
              <span className="prize-rank-text">{getRankLabel(prize.rank)}</span>
            </div>

            {editingIndex === index ? (
              <div className="prize-form">
                <div className="prize-form-row">
                  <div className="prize-form-field">
                    <label>Nome Premio *</label>
                    <input
                      type="text"
                      value={prize.prize_name}
                      onChange={(e) => updatePrize(index, { prize_name: e.target.value })}
                      placeholder="es. Voucher €100, Cena per 2, ecc."
                      disabled={disabled || prize.is_extracted}
                    />
                  </div>

                  <div className="prize-form-field prize-form-field-narrow">
                    <label>Valore €</label>
                    <input
                      type="number"
                      value={prize.prize_value || ''}
                      onChange={(e) => updatePrize(index, { prize_value: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={disabled || prize.is_extracted}
                    />
                  </div>
                </div>

                <div className="prize-form-row">
                  <div className="prize-form-field">
                    <label>Descrizione (opzionale)</label>
                    <textarea
                      value={prize.prize_description || ''}
                      onChange={(e) => updatePrize(index, { prize_description: e.target.value })}
                      placeholder="Descrizione dettagliata del premio..."
                      rows={2}
                      disabled={disabled || prize.is_extracted}
                    />
                  </div>
                </div>

                <div className="prize-form-actions">
                  <button
                    className="prize-form-btn prize-form-btn-save"
                    onClick={() => setEditingIndex(null)}
                    disabled={!prize.prize_name.trim()}
                  >
                    <Save size={16} />
                    Salva
                  </button>
                  <button
                    className="prize-form-btn prize-form-btn-cancel"
                    onClick={() => {
                      setEditingIndex(null)
                      // If it's a new prize (empty name), remove it
                      if (!prize.prize_name.trim() && !prize.id) {
                        removePrize(index)
                      }
                    }}
                  >
                    <X size={16} />
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="prize-info">
                <div className="prize-info-main">
                  <h4 className="prize-name">{prize.prize_name}</h4>
                  {prize.prize_value && (
                    <div className="prize-value">€{prize.prize_value.toFixed(2)}</div>
                  )}
                </div>

                {prize.prize_description && (
                  <p className="prize-description">{prize.prize_description}</p>
                )}

                {prize.is_extracted && (
                  <div className="prize-extracted-badge">✓ Estratto</div>
                )}

                {!disabled && !prize.is_extracted && (
                  <div className="prize-actions">
                    <button
                      className="prize-action-btn prize-action-edit"
                      onClick={() => setEditingIndex(index)}
                      title="Modifica"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="prize-action-btn prize-action-delete"
                      onClick={() => removePrize(index)}
                      title="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <button className="prizes-add-btn" onClick={addPrize}>
          <Plus size={20} />
          Aggiungi Premio
        </button>
      )}

      {prizes.length > 0 && (
        <div className="prizes-summary">
          <div className="prizes-summary-item">
            <span className="prizes-summary-label">Totale Premi:</span>
            <span className="prizes-summary-value">{prizes.length}</span>
          </div>
          {prizes.some(p => p.prize_value) && (
            <div className="prizes-summary-item">
              <span className="prizes-summary-label">Valore Totale:</span>
              <span className="prizes-summary-value">
                €{prizes.reduce((sum, p) => sum + (p.prize_value || 0), 0).toFixed(2)}
              </span>
            </div>
          )}
          {prizes.some(p => p.is_extracted) && (
            <div className="prizes-summary-item">
              <span className="prizes-summary-label">Estratti:</span>
              <span className="prizes-summary-value">
                {prizes.filter(p => p.is_extracted).length} / {prizes.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
