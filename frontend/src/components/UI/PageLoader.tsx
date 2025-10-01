import React from 'react'

interface PageLoaderProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  inline?: boolean
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Caricamento...',
  size = 'medium',
  inline = false
}) => {
  const getSizes = () => {
    switch (size) {
      case 'small':
        return { spinner: '32px', text: '0.875rem' }
      case 'large':
        return { spinner: '64px', text: '1.125rem' }
      default:
        return { spinner: '48px', text: '1rem' }
    }
  }

  const sizes = getSizes()

  const containerStyle = inline ? {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem'
  } : {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(248, 250, 252, 0.98)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(8px)',
    gap: '1.5rem'
  }

  return (
    <div style={containerStyle}>
      {/* Modern Spinner */}
      <div style={{
        width: sizes.spinner,
        height: sizes.spinner,
        position: 'relative'
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid #e2e8f0',
          borderTopColor: '#1e40af',
          animation: 'spin 1s linear infinite'
        }} />

        {/* Inner pulsing circle */}
        <div style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          top: '20%',
          left: '20%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 0.3
        }} />
      </div>

      {/* Message */}
      {message && (
        <div style={{
          fontSize: sizes.text,
          color: '#64748b',
          fontWeight: '500',
          textAlign: 'center',
          animation: 'fade-in 0.5s ease-in'
        }}>
          {message}
        </div>
      )}

      {/* Loading dots */}
      <div style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center'
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#1e40af',
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default PageLoader
