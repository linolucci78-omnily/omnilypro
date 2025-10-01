import React, { useState, useEffect } from 'react'

interface LoadingBarProps {
  isLoading: boolean
  message?: string
  progress?: number // 0-100, se non specificato usa animazione automatica
  theme?: 'default' | 'success' | 'warning' | 'error'
  showPercentage?: boolean
}

const LoadingBar: React.FC<LoadingBarProps> = ({
  isLoading,
  message = 'Caricamento...',
  progress,
  theme = 'default',
  showPercentage = false
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setAnimatedProgress(0)
      return
    }

    if (progress !== undefined) {
      setAnimatedProgress(progress)
      return
    }

    // Animazione automatica se non è specificato il progress
    const intervals = [
      { delay: 0, value: 20 },
      { delay: 300, value: 45 },
      { delay: 800, value: 70 },
      { delay: 1500, value: 85 },
      { delay: 2500, value: 95 }
    ]

    const timers: NodeJS.Timeout[] = []

    intervals.forEach(({ delay, value }) => {
      const timer = setTimeout(() => {
        if (isLoading) {
          setAnimatedProgress(value)
        }
      }, delay)
      timers.push(timer)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [isLoading, progress])

  if (!isLoading) return null

  const getThemeColors = () => {
    switch (theme) {
      case 'success':
        return {
          bg: 'var(--omnily-success-bg)',
          bar: 'var(--omnily-success)',
          text: 'var(--omnily-success)'
        }
      case 'warning':
        return {
          bg: 'var(--omnily-warning-bg)',
          bar: 'var(--omnily-warning)',
          text: 'var(--omnily-warning)'
        }
      case 'error':
        return {
          bg: 'var(--omnily-error-bg)',
          bar: 'var(--omnily-error)',
          text: 'var(--omnily-error)'
        }
      default:
        return {
          bg: 'var(--omnily-gray-50)',
          bar: 'var(--omnily-primary)',
          text: 'var(--omnily-gray-600)'
        }
    }
  }

  const colors = getThemeColors()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: colors.bg,
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid var(--omnily-border-color)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        minWidth: '300px',
        maxWidth: '500px',
        width: '90%'
      }}>
        {/* Logo OMNILY */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: colors.bar,
            marginBottom: '0.5rem'
          }}>
            OMNILY PRO
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: colors.text,
            opacity: 0.8
          }}>
            {message}
          </div>
        </div>

        {/* Barra di Caricamento */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--omnily-gray-200)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: `${animatedProgress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${colors.bar}, ${colors.bar}dd)`,
            borderRadius: '4px',
            transition: 'width 0.3s ease-out',
            position: 'relative'
          }}>
            {/* Effetto shimmer */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
              animation: 'shimmer 2s infinite'
            }} />
          </div>
        </div>

        {/* Percentuale e Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: colors.text,
          opacity: 0.7
        }}>
          <span>Caricamento dati...</span>
          {showPercentage && (
            <span style={{ fontWeight: '600' }}>
              {Math.round(animatedProgress)}%
            </span>
          )}
        </div>

        {/* Indicatori di attività */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1rem',
          gap: '4px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: colors.bar,
                opacity: 0.3,
                animation: `pulse 1.5s infinite ${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default LoadingBar