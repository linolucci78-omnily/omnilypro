import React, { useEffect, useRef } from 'react'
import { LotteryTheme } from '../services/lotteryService'
import { ThemeMusicPlayer } from './LotteryThemeMusic'
import './LotteryThemes.css'

interface ThemeProps {
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  eventName: string
}

// ==================== CASINO ELEGANTE ====================
export const CasinoTheme: React.FC<ThemeProps> = ({ colors, eventName }) => {
  return (
    <div className="theme-container casino-theme">
      {/* Carte da gioco animate */}
      <div className="floating-cards">
        {['♠', '♥', '♦', '♣'].map((suit, i) => (
          <div
            key={i}
            className="playing-card"
            style={{
              animationDelay: `${i * 0.5}s`,
              left: `${20 + i * 20}%`
            }}
          >
            <span style={{ color: suit === '♥' || suit === '♦' ? '#dc2626' : '#1f2937' }}>
              {suit}
            </span>
          </div>
        ))}
      </div>

      {/* Chips che cadono */}
      <div className="falling-chips">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="chip"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              background: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
            }}
          />
        ))}
      </div>

      {/* Contenuto centrale */}
      <div className="theme-content">
        <div className="casino-icon">🎰</div>
        <h1 className="theme-title">{eventName}</h1>
        <p className="theme-subtitle">Preparazione all'estrazione...</p>
        <div className="elegant-divider" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }} />
        <div className="pulsing-text">In attesa del comando...</div>
      </div>

      {/* Luci dorate */}
      <div className="golden-lights">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="light-ray"
            style={{
              transform: `rotate(${i * 60}deg)`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ==================== BINGO HALL ====================
export const BingoTheme: React.FC<ThemeProps> = ({ colors, eventName }) => {
  return (
    <div className="theme-container bingo-theme">
      {/* Palline numerate che rimbalzano */}
      <div className="bingo-balls">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="bingo-ball"
            style={{
              left: `${5 + (i % 10) * 9}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            }}
          >
            {Math.floor(Math.random() * 90) + 1}
          </div>
        ))}
      </div>

      {/* Contenuto centrale */}
      <div className="theme-content">
        <div className="bingo-icon">🎱</div>
        <h1 className="theme-title">{eventName}</h1>
        <p className="theme-subtitle">Preparazione all'estrazione...</p>
        <div className="bingo-card">
          <div className="bingo-grid">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bingo-cell" style={{ borderColor: colors.accent }}>
                {Math.floor(Math.random() * 90) + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="pulsing-text">In attesa del comando...</div>
      </div>

      {/* Coriandoli */}
      <div className="confetti-rain">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              background: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ==================== LOTTERY DRUM ====================
export const DrumTheme: React.FC<ThemeProps> = ({ colors, eventName }) => {
  return (
    <div className="theme-container drum-theme">
      {/* Cilindro rotante 3D */}
      <div className="drum-container">
        <div className="rotating-drum" style={{ borderColor: colors.primary }}>
          <div className="drum-face front" style={{ background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}22)` }} />
          <div className="drum-face back" style={{ background: `linear-gradient(135deg, ${colors.secondary}22, ${colors.primary}22)` }} />
          <div className="drum-face left" style={{ background: `${colors.primary}11` }} />
          <div className="drum-face right" style={{ background: `${colors.secondary}11` }} />
        </div>

        {/* Biglietti che volano */}
        <div className="flying-tickets">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="ticket-paper"
              style={{
                animationDelay: `${i * 0.4}s`,
                borderColor: colors.accent
              }}
            >
              <span>🎫</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenuto centrale */}
      <div className="theme-content">
        <h1 className="theme-title">{eventName}</h1>
        <p className="theme-subtitle">Preparazione all'estrazione...</p>
        <div className="mechanical-indicator">
          <div className="gear rotating" style={{ borderColor: colors.primary }}>⚙️</div>
          <div className="gear rotating reverse" style={{ borderColor: colors.secondary }}>⚙️</div>
        </div>
        <div className="pulsing-text">In attesa del comando...</div>
      </div>
    </div>
  )
}

// ==================== MODERN MINIMAL ====================
export const ModernTheme: React.FC<ThemeProps> = ({ colors, eventName }) => {
  return (
    <div className="theme-container modern-theme">
      {/* Geometrie animate */}
      <div className="geometric-shapes">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`shape shape-${i % 3}`}
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
              borderColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
            }}
          />
        ))}
      </div>

      {/* Linee animate */}
      <div className="animated-lines">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="moving-line"
            style={{
              top: `${20 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`
            }}
          />
        ))}
      </div>

      {/* Contenuto centrale */}
      <div className="theme-content modern-content">
        <div className="modern-icon-container">
          <div className="rotating-hexagon" style={{ borderColor: colors.primary }}>
            <span>🎯</span>
          </div>
        </div>
        <h1 className="theme-title modern-title">{eventName}</h1>
        <div className="loading-bar" style={{ background: `${colors.primary}22` }}>
          <div className="loading-fill" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
        </div>
        <p className="theme-subtitle">Preparazione all'estrazione...</p>
        <div className="data-points">
          <div className="data-point" style={{ color: colors.primary }}>
            <span className="blinking-dot">●</span> Sistema pronto
          </div>
          <div className="data-point" style={{ color: colors.secondary }}>
            <span className="blinking-dot slow">●</span> In attesa del comando
          </div>
        </div>
      </div>

      {/* Griglia di sfondo */}
      <div className="grid-background" style={{
        backgroundImage: `linear-gradient(${colors.primary}08 1px, transparent 1px), linear-gradient(90deg, ${colors.primary}08 1px, transparent 1px)`
      }} />
    </div>
  )
}

// ==================== SELECTOR ====================
interface ThemeSelectorProps {
  theme: LotteryTheme
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  eventName: string
}

export const LotteryThemeRenderer: React.FC<ThemeSelectorProps> = ({ theme, colors, eventName }) => {
  // Theme music disabled - using real audio files instead
  // const musicPlayerRef = useRef<ThemeMusicPlayer | null>(null)

  switch (theme) {
    case 'casino':
      return <CasinoTheme colors={colors} eventName={eventName} />
    case 'bingo':
      return <BingoTheme colors={colors} eventName={eventName} />
    case 'drum':
      return <DrumTheme colors={colors} eventName={eventName} />
    case 'modern':
      return <ModernTheme colors={colors} eventName={eventName} />
    default:
      return <CasinoTheme colors={colors} eventName={eventName} />
  }
}
