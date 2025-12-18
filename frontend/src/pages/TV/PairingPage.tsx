import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tv, Wifi, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * 📺 TV Device Pairing Page
 *
 * Shows when a TV display is not yet paired with an organization.
 * Displays a pairing code (e.g., "ABC-123") that the admin enters
 * in the Admin Panel to associate the device.
 *
 * Similar to XOGO device pairing flow.
 */

const PairingPage: React.FC = () => {
    const [deviceCode, setDeviceCode] = useState<string | null>(null)
    const [status, setStatus] = useState<'initializing' | 'waiting' | 'paired' | 'error'>('initializing')
    const [organizationName, setOrganizationName] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string>('')

    // Generate or retrieve device code on mount
    useEffect(() => {
        initializeDevice()
    }, [])

    // Create animated stars on mount
    useEffect(() => {
        createStars()
    }, [])

    // Poll for pairing status every 5 seconds
    useEffect(() => {
        if (status === 'waiting' && deviceCode) {
            const interval = setInterval(() => {
                checkPairingStatus()
            }, 5000)

            return () => clearInterval(interval)
        }
    }, [status, deviceCode])

    const createStars = () => {
        const starsContainer = document.getElementById('stars')
        if (!starsContainer) return

        const numberOfStars = 200

        for (let i = 0; i < numberOfStars; i++) {
            const star = document.createElement('div')
            star.className = 'star'

            // Random position
            star.style.left = Math.random() * 100 + '%'
            star.style.top = Math.random() * 100 + '%'

            // Random size
            const size = Math.random() * 3 + 1
            star.style.width = size + 'px'
            star.style.height = size + 'px'

            // Random animation duration
            const duration = Math.random() * 3 + 2
            star.style.animationDuration = duration + 's'

            // Random delay
            const delay = Math.random() * 3
            star.style.animationDelay = delay + 's'

            starsContainer.appendChild(star)
        }
    }

    const initializeDevice = async () => {
        try {
            console.log('🔍 initializeDevice started')
            console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
            console.log('🔍 Location origin:', window.location.origin)

            // Check if device code is already stored in localStorage
            const storedCode = localStorage.getItem('tv_device_code')
            const storedOrgId = localStorage.getItem('tv_org_id')
            console.log('🔍 Stored code:', storedCode, 'Stored orgId:', storedOrgId)

            if (storedCode && storedOrgId) {
                // Device was already paired, verify it's still valid
                const { data, error } = await supabase
                    .from('tv_devices')
                    .select('organization_id, device_name, status, organizations(name)')
                    .eq('device_code', storedCode)
                    .eq('status', 'active')
                    .single()

                if (!error && data) {
                    // Device is paired and active
                    setDeviceCode(storedCode)
                    setOrganizationName(data.organizations?.name || 'Unknown')
                    setStatus('paired')

                    // Update heartbeat
                    await updateHeartbeat(storedCode)

                    // Redirect to TV display after 3 seconds
                    setTimeout(() => {
                        window.location.href = `/tv/live/${storedOrgId}`
                    }, 3000)
                    return
                }

                // Code is invalid or device unpaired, clear storage
                localStorage.removeItem('tv_device_code')
                localStorage.removeItem('tv_org_id')
            }

            // Generate new device code
            if (storedCode) {
                // Reuse existing code if available
                console.log('🔍 Reusing stored code:', storedCode)
                setDeviceCode(storedCode)
                setStatus('waiting')
            } else {
                // Create new unpaired device
                console.log('🔍 Calling create_unpaired_device RPC...')
                const { data, error } = await supabase.rpc('create_unpaired_device')

                console.log('🔍 RPC response - data:', data, 'error:', error)

                if (error) throw error

                const newCode = data[0].device_code
                console.log('🔍 New device code created:', newCode)
                setDeviceCode(newCode)
                localStorage.setItem('tv_device_code', newCode)
                setStatus('waiting')
            }
        } catch (error) {
            console.error('Error initializing device:', error)
            const errorMsg = error instanceof Error
                ? `${error.message}\n\nStack: ${error.stack}`
                : JSON.stringify(error, null, 2)
            setStatus('error')
            setErrorMessage(errorMsg)
        }
    }

    const checkPairingStatus = async () => {
        if (!deviceCode) return

        try {
            const { data, error } = await supabase
                .from('tv_devices')
                .select('organization_id, status, organizations(name)')
                .eq('device_code', deviceCode)
                .single()

            if (error) throw error

            if (data.status === 'active' && data.organization_id) {
                // Device has been paired!
                localStorage.setItem('tv_org_id', data.organization_id)
                setOrganizationName(data.organizations?.name || 'Unknown')
                setStatus('paired')

                // Update heartbeat
                await updateHeartbeat(deviceCode)

                // Redirect to TV display
                setTimeout(() => {
                    window.location.href = `/tv/live/${data.organization_id}`
                }, 3000)
            } else {
                // Still waiting for pairing, update heartbeat
                await updateHeartbeat(deviceCode)
            }
        } catch (error) {
            console.error('Error checking pairing status:', error)
        }
    }

    const updateHeartbeat = async (code: string) => {
        try {
            await supabase.rpc('update_device_heartbeat', {
                p_device_code: code,
                p_ip_address: null, // Could get from API
                p_user_agent: navigator.userAgent
            })
        } catch (error) {
            console.error('Error updating heartbeat:', error)
        }
    }

    return (
        <>
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Animated stars background */}
                <div id="stars" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }} />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'center',
                        maxWidth: '900px',
                        padding: '40px'
                    }}
                >
                    {/* Status Icon - Centered and larger */}
                    <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                        {status === 'initializing' && (
                            <Loader size={80} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                        )}
                        {status === 'waiting' && (
                            <Tv size={80} color="white" />
                        )}
                        {status === 'paired' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <CheckCircle size={80} color="#10b981" />
                            </motion.div>
                        )}
                        {status === 'error' && (
                            <AlertCircle size={80} color="#ef4444" />
                        )}
                    </div>

                    {/* Content */}
                    {status === 'initializing' && (
                        <>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                margin: '0 0 15px',
                                color: 'white',
                                textShadow: '0 0 10px rgba(255,255,255,0.3)'
                            }}>
                                Inizializzazione...
                            </h1>
                            <p style={{ fontSize: '1.3rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                                Preparazione del display TV
                            </p>
                        </>
                    )}

                    {status === 'waiting' && (
                        <>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                margin: '0 0 15px',
                                color: 'white',
                                textShadow: '0 0 10px rgba(255,255,255,0.3)'
                            }}>
                                Associa questo Display
                            </h1>
                            <p style={{
                                fontSize: '1.3rem',
                                color: 'rgba(255, 255, 255, 0.8)',
                                marginBottom: '40px'
                            }}>
                                Inserisci questo codice nel tuo Admin Panel
                            </p>

                            {/* Pairing Code Display */}
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    padding: '35px 60px',
                                    borderRadius: '20px',
                                    marginBottom: '35px',
                                    display: 'inline-block',
                                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <div style={{
                                    fontSize: '5rem',
                                    fontWeight: 900,
                                    color: 'white',
                                    letterSpacing: '12px',
                                    fontFamily: 'monospace',
                                    textShadow: '0 0 20px rgba(255,255,255,0.5)'
                                }}>
                                    {deviceCode || '---'}
                                </div>
                            </motion.div>

                            {/* Instructions */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '25px 35px',
                                borderRadius: '15px',
                                textAlign: 'left',
                                maxWidth: '750px',
                                margin: '0 auto'
                            }}>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 700,
                                    margin: '0 0 20px',
                                    color: 'white'
                                }}>
                                    Come associare:
                                </h3>
                                <ol style={{
                                    fontSize: '1.2rem',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    lineHeight: 1.9,
                                    paddingLeft: '25px',
                                    margin: 0
                                }}>
                                    <li style={{ marginBottom: '10px' }}>Vai su <strong>Admin Panel → Display TV</strong></li>
                                    <li style={{ marginBottom: '10px' }}>Clicca su <strong>"Aggiungi Display"</strong></li>
                                    <li style={{ marginBottom: '10px' }}>Inserisci il codice: <strong style={{ color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{deviceCode}</strong></li>
                                    <li style={{ marginBottom: '10px' }}>Dai un nome al display (es. "Display Ingresso")</li>
                                    <li>Clicca <strong>"Associa"</strong></li>
                                </ol>
                            </div>

                            {/* Logo OmnilyPro in basso */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                style={{ marginTop: '30px' }}
                            >
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    margin: '0 auto',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        width: '140px',
                                        height: '140px',
                                        left: '-10px',
                                        top: '-10px',
                                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                                        borderRadius: '50%',
                                        animation: 'pulse 3s ease-in-out infinite'
                                    }} />
                                    <img
                                        src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                                        alt="OmnilyPro"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            filter: 'brightness(0) invert(1) drop-shadow(0 0 30px rgba(255,255,255,0.5))',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    />
                                </div>
                            </motion.div>

                            {/* Wifi indicator */}
                            <div style={{
                                marginTop: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}>
                                <Wifi size={20} color="#10b981" />
                                <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Connesso e in attesa di associazione...
                                </span>
                            </div>
                        </>
                    )}

                    {status === 'paired' && (
                        <>
                            <h1 style={{
                                fontSize: '3rem',
                                fontWeight: 800,
                                margin: '0 0 20px',
                                color: '#10b981',
                                textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                            }}>
                                Display Associato!
                            </h1>
                            <p style={{
                                fontSize: '1.5rem',
                                color: 'rgba(255, 255, 255, 0.9)',
                                marginBottom: '40px'
                            }}>
                                Associato con: <strong>{organizationName}</strong>
                            </p>
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '2px solid rgba(16, 185, 129, 0.3)',
                                padding: '20px',
                                borderRadius: '15px',
                                color: '#10b981',
                                fontSize: '1.2rem'
                            }}>
                                Reindirizzamento al display TV...
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <h1 style={{
                                fontSize: '3rem',
                                fontWeight: 800,
                                margin: '0 0 20px',
                                color: '#ef4444',
                                textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                            }}>
                                Errore
                            </h1>
                            <p style={{
                                fontSize: '1.5rem',
                                color: 'rgba(255, 255, 255, 0.8)',
                                marginBottom: '40px'
                            }}>
                                {errorMessage || 'Si è verificato un errore'}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    color: 'white',
                                    padding: '15px 40px',
                                    borderRadius: '10px',
                                    fontSize: '1.2rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                                    e.currentTarget.style.transform = 'scale(1.05)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                                    e.currentTarget.style.transform = 'scale(1)'
                                }}
                            >
                                Riprova
                            </button>
                        </>
                    )}
                </motion.div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.8;
                    }
                }

                @keyframes twinkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.5);
                    }
                }

                .star {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: white;
                    border-radius: 50%;
                    animation: twinkle linear infinite;
                }
            `}</style>
        </>
    )
}

export default PairingPage
