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

    // Poll for pairing status every 5 seconds
    useEffect(() => {
        if (status === 'waiting' && deviceCode) {
            const interval = setInterval(() => {
                checkPairingStatus()
            }, 5000)

            return () => clearInterval(interval)
        }
    }, [status, deviceCode])

    const initializeDevice = async () => {
        try {
            // Check if device code is already stored in localStorage
            const storedCode = localStorage.getItem('tv_device_code')
            const storedOrgId = localStorage.getItem('tv_org_id')

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
                setDeviceCode(storedCode)
                setStatus('waiting')
            } else {
                // Create new unpaired device
                const { data, error } = await supabase.rpc('create_unpaired_device')

                if (error) throw error

                const newCode = data[0].device_code
                setDeviceCode(newCode)
                localStorage.setItem('tv_device_code', newCode)
                setStatus('waiting')
            }
        } catch (error) {
            console.error('Error initializing device:', error)
            setStatus('error')
            setErrorMessage('Errore durante l\'inizializzazione del dispositivo')
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
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    background: 'white',
                    borderRadius: '30px',
                    padding: '80px',
                    maxWidth: '800px',
                    textAlign: 'center',
                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* Status Icon */}
                <div style={{ marginBottom: '40px' }}>
                    {status === 'initializing' && (
                        <Loader size={80} color="#667eea" style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    {status === 'waiting' && (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Tv size={80} color="#667eea" />
                        </motion.div>
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
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 20px', color: '#1f2937' }}>
                            Inizializzazione...
                        </h1>
                        <p style={{ fontSize: '1.5rem', color: '#6b7280', margin: 0 }}>
                            Preparazione del display TV
                        </p>
                    </>
                )}

                {status === 'waiting' && (
                    <>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 20px', color: '#1f2937' }}>
                            Associa questo Display
                        </h1>
                        <p style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '60px' }}>
                            Inserisci questo codice nel tuo Admin Panel
                        </p>

                        {/* Pairing Code Display */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                padding: '40px 60px',
                                borderRadius: '20px',
                                marginBottom: '60px',
                                display: 'inline-block'
                            }}
                        >
                            <div style={{
                                fontSize: '6rem',
                                fontWeight: 900,
                                color: 'white',
                                letterSpacing: '10px',
                                fontFamily: 'monospace'
                            }}>
                                {deviceCode || '---'}
                            </div>
                        </motion.div>

                        {/* Instructions */}
                        <div style={{
                            background: '#f9fafb',
                            padding: '30px',
                            borderRadius: '15px',
                            textAlign: 'left'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 20px', color: '#374151' }}>
                                Come associare:
                            </h3>
                            <ol style={{ fontSize: '1.2rem', color: '#6b7280', lineHeight: 1.8, paddingLeft: '20px' }}>
                                <li>Vai su <strong>Admin Panel → Display TV</strong></li>
                                <li>Clicca su <strong>"Aggiungi Display"</strong></li>
                                <li>Inserisci il codice: <strong style={{ color: '#667eea' }}>{deviceCode}</strong></li>
                                <li>Dai un nome al display (es. "Display Ingresso")</li>
                                <li>Clicca <strong>"Associa"</strong></li>
                            </ol>
                        </div>

                        {/* Wifi indicator */}
                        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Wifi size={24} color="#10b981" />
                            <span style={{ fontSize: '1rem', color: '#6b7280' }}>Connesso e in attesa di associazione...</span>
                        </div>
                    </>
                )}

                {status === 'paired' && (
                    <>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 20px', color: '#10b981' }}>
                            Display Associato!
                        </h1>
                        <p style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '40px' }}>
                            Associato con: <strong>{organizationName}</strong>
                        </p>
                        <div style={{
                            background: '#d1fae5',
                            padding: '20px',
                            borderRadius: '15px',
                            color: '#065f46',
                            fontSize: '1.2rem'
                        }}>
                            Reindirizzamento al display TV...
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 20px', color: '#ef4444' }}>
                            Errore
                        </h1>
                        <p style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '40px' }}>
                            {errorMessage || 'Si è verificato un errore'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#667eea',
                                color: 'white',
                                padding: '15px 40px',
                                borderRadius: '10px',
                                border: 'none',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Riprova
                        </button>
                    </>
                )}
            </motion.div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default PairingPage
