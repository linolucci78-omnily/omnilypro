import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SplashPage: React.FC = () => {
    const navigate = useNavigate()
    const [statusText, setStatusText] = useState('Initializing application...')

    useEffect(() => {
        // Create stars
        const container = document.getElementById('splash-stars')
        if (container && container.children.length === 0) {
            const numberOfStars = 200
            for (let i = 0; i < numberOfStars; i++) {
                const star = document.createElement('div')
                star.className = 'star'
                star.style.left = Math.random() * 100 + '%'
                star.style.top = Math.random() * 100 + '%'
                const size = Math.random() * 3 + 1
                star.style.width = size + 'px'
                star.style.height = size + 'px'
                const duration = Math.random() * 3 + 2
                star.style.animationDuration = duration + 's'
                const delay = Math.random() * 3
                star.style.animationDelay = delay + 's'
                container.appendChild(star)
            }
        }

        // Loading phases
        const loadingPhases = [
            'Initializing application...',
            'Loading configuration...',
            'Connecting to services...',
            'Loading resources...',
            'Starting application...'
        ]

        let currentPhase = 0
        const phaseInterval = setInterval(() => {
            if (currentPhase < loadingPhases.length) {
                setStatusText(loadingPhases[currentPhase])
                currentPhase++
            }
        }, 600)

        // Navigate to pairing page after 7 seconds
        const timer = setTimeout(() => {
            navigate('/tv/pair')
        }, 7000)

        return () => {
            clearTimeout(timer)
            clearInterval(phaseInterval)
        }
    }, [navigate])

    return (
        <>
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }

                .star {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: white;
                    border-radius: 50%;
                    animation: twinkle linear infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }

                @keyframes pulse-glow {
                    0% { transform: translateX(-100%); opacity: 0.5; box-shadow: 0 0 20px rgba(255,255,255,0.5); }
                    50% { opacity: 1; box-shadow: 0 0 30px rgba(255,255,255,0.8); }
                    100% { transform: translateX(100%); opacity: 0.5; box-shadow: 0 0 20px rgba(255,255,255,0.5); }
                }

                @keyframes slideUpFromBottom {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Stars */}
                <div id="splash-stars" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }} />

                {/* Main content */}
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease-in' }}>
                    <div style={{ marginBottom: '3rem', animation: 'scaleIn 0.6s ease-out' }}>
                        <div style={{
                            width: '400px',
                            height: '400px',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            position: 'relative'
                        }}>
                            {/* Glow effect */}
                            <div style={{
                                position: 'absolute',
                                width: '450px',
                                height: '450px',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                borderRadius: '50%',
                                animation: 'pulse 3s ease-in-out infinite'
                            }} />

                            {/* Logo */}
                            <img
                                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                                alt="OmnilyPro Logo"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    filter: 'brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,0.3))',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                            />
                        </div>

                        {/* Loading */}
                        <div style={{ marginTop: '-1rem', animation: 'slideUp 0.8s ease-out 0.6s backwards' }}>
                            <div style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.9rem',
                                fontWeight: 400,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                marginBottom: '0.5rem',
                                textAlign: 'center'
                            }}>
                                Loading...
                            </div>
                            <div style={{
                                width: '400px',
                                height: '3px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                margin: '0 auto',
                                boxShadow: '0 0 10px rgba(255,255,255,0.1)'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
                                    borderRadius: '10px',
                                    animation: 'pulse-glow 2s ease-in-out infinite'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    padding: '1.2rem 2rem',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    animation: 'slideUpFromBottom 0.6s ease-out 0.8s backwards',
                    boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '2rem',
                        color: '#1b2735',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        opacity: 0.6
                    }}>
                        v1.0.0
                    </div>
                    <div style={{
                        color: '#1b2735',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        textAlign: 'center',
                        letterSpacing: '0.5px'
                    }}>
                        {statusText}
                    </div>
                    <div style={{
                        position: 'absolute',
                        right: '2rem',
                        color: '#1b2735',
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        opacity: 0.7
                    }}>
                        © 2025 OmnilyPro. All rights reserved.
                    </div>
                </div>
            </div>
        </>
    )
}

export default SplashPage
