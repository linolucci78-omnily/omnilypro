/**
 * OMNILYPRO GAMING MODULE - Scratch Card (Gratta e Vinci)
 * Lottery-style scratch card with 3x3 grid - Match 3 symbols to win!
 */

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Trophy, Sparkles } from 'lucide-react'
import { scratchCardService } from '../../services/gaming/scratchCardService'
import './ScratchCard.css'

export interface ScratchPrize {
  type: 'points' | 'discount' | 'nothing'
  value: number | string
  label: string
  code?: string
}

interface ScratchCardProps {
  customerId: string
  organizationId: string
  primaryColor?: string
  onClose?: () => void
  onScratchComplete?: (prize?: ScratchPrize) => void
}

// Simboli e relativi premi
const SYMBOLS = {
  '🍒': { points: 50, label: '50 PUNTI!' },
  '💎': { points: 100, label: '100 PUNTI!' },
  '⭐': { points: 200, label: '200 PUNTI!' },
  '🎁': { points: 500, label: '500 PUNTI!' }
} as const

type SymbolKey = keyof typeof SYMBOLS

const ScratchCard: React.FC<ScratchCardProps> = ({
  customerId,
  organizationId,
  primaryColor = '#dc2626',
  onClose,
  onScratchComplete
}) => {
  const [symbols, setSymbols] = useState<SymbolKey[]>([])
  const [revealedCells, setRevealedCells] = useState<boolean[]>(Array(9).fill(false))
  const [scratchProgress, setScratchProgress] = useState<number[]>(Array(9).fill(0))
  const [matchFound, setMatchFound] = useState<{symbol: SymbolKey, indices: number[]} | null>(null)
  const [prizeRevealed, setPrizeRevealed] = useState(false)
  const [serialNumber] = useState(() => Math.floor(Math.random() * 900000) + 100000)

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>(Array(9).fill(null))
  const isDrawing = useRef<number | null>(null) // Index della cella che si sta grattando
  const pointerType = useRef<'mouse' | 'pen' | 'touch'>('mouse')
  const lastCheckTime = useRef<number[]>(Array(9).fill(0)) // Last time we checked progress for each cell

  useEffect(() => {
    generateSymbols()
  }, [])

  useEffect(() => {
    // Inizializza tutti i canvas solo se abbiamo simboli
    if (symbols.length === 0) return

    // Inizializza i canvas in modo asincrono per non bloccare il browser
    const initializeCanvasesAsync = async () => {
      for (let index = 0; index < canvasRefs.current.length; index++) {
        const canvas = canvasRefs.current[index]
        if (canvas && symbols[index]) {
          // Usa setTimeout per permettere al browser di respirare tra un canvas e l'altro
          await new Promise(resolve => setTimeout(resolve, 0))
          initializeCanvas(canvas, index)
        }
      }
    }

    initializeCanvasesAsync()
  }, [symbols])

  const generateSymbols = () => {
    const symbolKeys = Object.keys(SYMBOLS) as SymbolKey[]
    const random = Math.random()

    let grid: SymbolKey[] = []

    // Probabilità di vincita
    if (random < 0.05) {
      // 5% - JACKPOT: 3x 🎁
      grid = generateGridWithMatch('🎁')
    } else if (random < 0.15) {
      // 10% - GRANDE: 3x ⭐
      grid = generateGridWithMatch('⭐')
    } else if (random < 0.35) {
      // 20% - MEDIO: 3x 💎
      grid = generateGridWithMatch('💎')
    } else if (random < 0.65) {
      // 30% - PICCOLO: 3x 🍒
      grid = generateGridWithMatch('🍒')
    } else {
      // 35% - NESSUNA VINCITA: nessun match
      grid = generateGridNoMatch()
    }

    setSymbols(grid)
  }

  const generateGridWithMatch = (winSymbol: SymbolKey): SymbolKey[] => {
    const symbolKeys = Object.keys(SYMBOLS) as SymbolKey[]
    const grid: SymbolKey[] = Array(9).fill(null)

    // Posiziona 3 simboli vincenti in posizioni casuali
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    const winPositions: number[] = []

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length)
      winPositions.push(positions[randomIndex])
      positions.splice(randomIndex, 1)
    }

    // Riempie con simboli vincenti
    winPositions.forEach(pos => {
      grid[pos] = winSymbol
    })

    // Riempie le altre posizioni con simboli casuali (diversi dal vincente)
    positions.forEach(pos => {
      const otherSymbols = symbolKeys.filter(s => s !== winSymbol)
      grid[pos] = otherSymbols[Math.floor(Math.random() * otherSymbols.length)]
    })

    return grid
  }

  const generateGridNoMatch = (): SymbolKey[] => {
    const symbolKeys = Object.keys(SYMBOLS) as SymbolKey[]
    const grid: SymbolKey[] = []

    // Assicurati che nessun simbolo appaia più di 2 volte
    const counts: Record<SymbolKey, number> = {
      '🍒': 0,
      '💎': 0,
      '⭐': 0,
      '🎁': 0
    }

    for (let i = 0; i < 9; i++) {
      let symbol: SymbolKey
      do {
        symbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)]
      } while (counts[symbol] >= 2) // Max 2 di ogni simbolo

      grid.push(symbol)
      counts[symbol]++
    }

    return grid
  }

  const initializeCanvas = (canvas: HTMLCanvasElement, index: number) => {
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true })
    if (!ctx) return

    // Set canvas size
    canvas.width = 100
    canvas.height = 100

    // Fill with simple silver color (più veloce del gradiente)
    ctx.fillStyle = '#d0d0d0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add "?" text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', canvas.width / 2, canvas.height / 2)
  }

  const scratch = (cellIndex: number, x: number, y: number) => {
    const canvas = canvasRefs.current[cellIndex]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set composite operation to erase
    ctx.globalCompositeOperation = 'destination-out'

    // Brush size based on pointer type
    let brushRadius = 15
    if (pointerType.current === 'pen') {
      brushRadius = 10
    } else if (pointerType.current === 'touch') {
      brushRadius = 20
    }

    // Draw a circle at the scratch position
    ctx.beginPath()
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratched percentage for this cell
    checkCellProgress(cellIndex)
  }

  const checkCellProgress = (cellIndex: number) => {
    const canvas = canvasRefs.current[cellIndex]
    if (!canvas) return

    // THROTTLE: Only check every 200ms to avoid performance issues
    const now = Date.now()
    if (now - lastCheckTime.current[cellIndex] < 200) {
      return // Skip check if too soon
    }
    lastCheckTime.current[cellIndex] = now

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    let transparentPixels = 0
    const totalPixels = pixels.length / 4

    // Sample every 4th pixel for performance (still accurate enough)
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i + 3] < 128) {
        transparentPixels++
      }
    }

    const percentage = (transparentPixels / (totalPixels / 4)) * 100

    // Update progress for this cell
    setScratchProgress(prev => {
      const newProgress = [...prev]
      newProgress[cellIndex] = percentage
      return newProgress
    })

    // Auto-reveal when 60% scratched
    if (percentage > 60 && !revealedCells[cellIndex]) {
      revealCell(cellIndex)
    }
  }

  const revealCell = (cellIndex: number) => {
    setRevealedCells(prev => {
      const newRevealed = [...prev]
      newRevealed[cellIndex] = true

      // Check for matches after revealing
      setTimeout(() => checkForMatches(newRevealed), 300)

      return newRevealed
    })

    // Clear canvas to show symbol
    const canvas = canvasRefs.current[cellIndex]
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const checkForMatches = (revealed: boolean[]) => {
    // Count occurrences of each symbol in revealed cells
    const counts: Record<SymbolKey, number[]> = {
      '🍒': [],
      '💎': [],
      '⭐': [],
      '🎁': []
    }

    revealed.forEach((isRevealed, index) => {
      if (isRevealed && symbols[index]) {
        counts[symbols[index]].push(index)
      }
    })

    // Check if any symbol has 3 matches
    for (const [symbol, indices] of Object.entries(counts) as [SymbolKey, number[]][]) {
      if (indices.length >= 3) {
        setMatchFound({ symbol, indices })
        return
      }
    }
  }

  const revealAllCells = () => {
    // Reveal all remaining cells
    const allRevealed = Array(9).fill(true)
    setRevealedCells(allRevealed)

    // Clear all canvases
    canvasRefs.current.forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    })

    // Check for matches
    setTimeout(() => checkForMatches(allRevealed), 300)
  }

  const handlePrizeReveal = async () => {
    setPrizeRevealed(true)

    // Register play in database
    const won = !!matchFound
    const prizeSymbol = matchFound?.symbol
    const prizePoints = matchFound ? SYMBOLS[matchFound.symbol].points : 0

    console.log('🎫 Registering scratch card play:', { won, prizeSymbol, prizePoints })

    const result = await scratchCardService.play(
      customerId,
      organizationId,
      symbols,
      won,
      prizeSymbol,
      prizePoints
    )

    console.log('🎫 Play result:', result)

    if (!result.success) {
      console.error('Failed to register scratch card play:', result.error)
    }

    if (matchFound && onScratchComplete) {
      const prize: ScratchPrize = {
        type: 'points',
        value: SYMBOLS[matchFound.symbol].points,
        label: SYMBOLS[matchFound.symbol].label
      }

      setTimeout(() => {
        onScratchComplete(prize)
      }, 2000)
    } else if (onScratchComplete) {
      // No match - no prize
      setTimeout(() => {
        onScratchComplete(undefined)
      }, 2000)
    }
  }

  // Pointer events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>, cellIndex: number) => {
    if (revealedCells[cellIndex]) return

    pointerType.current = e.pointerType as 'mouse' | 'pen' | 'touch'
    isDrawing.current = cellIndex

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    scratch(cellIndex, x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>, cellIndex: number) => {
    if (isDrawing.current !== cellIndex || revealedCells[cellIndex]) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    scratch(cellIndex, x, y)
  }

  const handlePointerUp = () => {
    isDrawing.current = null
  }

  return createPortal(
    <div className="scratch-card-modal" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      <div className="scratch-card-backdrop" onClick={prizeRevealed ? onClose : undefined}></div>

      <div className="scratch-card-container vertical">
        {/* Close Button */}
        {onClose && (
          <button
            className="scratch-card-close-button"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <X size={24} strokeWidth={3} />
          </button>
        )}

        {/* Header */}
        <div className="scratch-card-header">
          <Trophy size={32} />
          <h2>Gratta e Vinci</h2>
          <p className="scratch-serial">N. {serialNumber}</p>
        </div>

        {/* Instructions */}
        <div className="scratch-instructions">
          <p><strong>Trova 3 simboli uguali per vincere!</strong></p>
        </div>

        {/* 3x3 Grid */}
        <div className="scratch-grid">
          {symbols.map((symbol, index) => (
            <div
              key={index}
              className={`scratch-cell ${revealedCells[index] ? 'revealed' : ''} ${
                matchFound?.indices.includes(index) ? 'matched' : ''
              }`}
            >
              {/* Symbol underneath (visible when scratched) */}
              <div className="cell-symbol">{symbol}</div>

              {/* Scratchable canvas layer */}
              {!revealedCells[index] && (
                <canvas
                  ref={el => canvasRefs.current[index] = el}
                  className="cell-canvas"
                  width={100}
                  height={100}
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  onPointerMove={(e) => handlePointerMove(e, index)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  style={{ touchAction: 'none' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Prize Table */}
        <div className="scratch-prize-table">
          <h3>TABELLA PREMI</h3>
          <div className="prize-table-grid">
            <div className="prize-row">
              <span className="prize-symbols">🍒 🍒 🍒</span>
              <span className="prize-value">50 punti</span>
            </div>
            <div className="prize-row">
              <span className="prize-symbols">💎 💎 💎</span>
              <span className="prize-value">100 punti</span>
            </div>
            <div className="prize-row">
              <span className="prize-symbols">⭐ ⭐ ⭐</span>
              <span className="prize-value">200 punti</span>
            </div>
            <div className="prize-row">
              <span className="prize-symbols">🎁 🎁 🎁</span>
              <span className="prize-value">500 punti</span>
            </div>
          </div>
        </div>

        {/* Match Found Message */}
        {matchFound && !prizeRevealed && (
          <div className="scratch-match-message">
            <Sparkles size={20} />
            <span>HAI TROVATO 3 {matchFound.symbol}!</span>
            <Sparkles size={20} />
          </div>
        )}

        {/* Prize Area */}
        {matchFound && (
          <div className="scratch-prize-area">
            <p className="prize-area-label">IL TUO PREMIO:</p>
            <div className={`prize-box ${prizeRevealed ? 'revealed' : ''}`}>
              {prizeRevealed ? (
                <>
                  <div className="prize-amount">{SYMBOLS[matchFound.symbol].points}</div>
                  <div className="prize-text">PUNTI!</div>
                </>
              ) : (
                <div className="prize-hidden">GRATTA QUI!</div>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        {!matchFound && revealedCells.filter(r => r).length < 9 && (
          <button className="scratch-reveal-btn" onClick={revealAllCells}>
            Rivela Tutto
          </button>
        )}

        {matchFound && !prizeRevealed && (
          <button className="scratch-prize-btn" onClick={handlePrizeReveal}>
            Gratta il Premio! 🎁
          </button>
        )}

        {prizeRevealed && matchFound && (
          <button className="scratch-ok-btn" onClick={onClose}>
            Riscuoti e Chiudi
          </button>
        )}

        {!matchFound && revealedCells.every(r => r) && (
          <div className="scratch-no-win">
            <p>😔 Nessuna vincita questa volta!</p>
            <button className="scratch-ok-btn" onClick={onClose}>
              Riprova Domani
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default ScratchCard
