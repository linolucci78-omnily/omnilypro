import React from 'react'

interface PageLoaderProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  inline?: boolean // Per caricamenti inline invece che fullscreen
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Caricamento...',
  size = 'medium',
  inline = false
}) => {
  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          container: inline ? '200px' : '250px',
          bar: '4px',
          logo: '1rem',
          text: '0.75rem'
        }
      case 'large':
        return {
          container: inline ? '400px' : '500px',
          bar: '12px',
          logo: '2rem',
          text: '1rem'
        }
      default:
        return {
          container: inline ? '300px' : '350px',
          bar: '6px',
          logo: '1.25rem',
          text: '0.875rem'
        }
    }
  }

  const sizes = getSizes()

  const containerStyle = inline ? {
    background: 'var(--omnily-gray-50)',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid var(--omnily-border-color)',
    width: sizes.container,
    textAlign: 'center' as const
  } : {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(248, 250, 252, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(1px)'
  }

  const cardStyle = inline ? {} : {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid var(--omnily-border-color)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    width: sizes.container,
    textAlign: 'center' as const
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{
          fontSize: sizes.logo,
          fontWeight: 'bold',
          color: 'var(--omnily-primary)',
          marginBottom: '1rem'
        }}>
          OMNILY PRO
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: sizes.bar,
          background: 'var(--omnily-gray-200)',
          borderRadius: '99px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '70%',
            height: '100%',
            background: 'linear-gradient(90deg, var(--omnily-primary), var(--omnily-primary-dark))',
            borderRadius: '99px',
            animation: 'loading-slide 2s ease-in-out infinite',
            transformOrigin: 'left'
          }} />
        </div>

        {/* Message */}
        <div style={{
          fontSize: sizes.text,
          color: 'var(--omnily-gray-500)',
          marginBottom: '0.5rem'
        }}>
          {message}
        </div>

        {/* Animated dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--omnily-primary)',
                animation: `loading-dots 1.4s infinite ${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes loading-dots {
          0%, 20%, 80%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default PageLoader