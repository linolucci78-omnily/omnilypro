import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const HeartbeatDebug: React.FC = () => {
    const [deviceCode, setDeviceCode] = useState<string | null>(null)
    const [lastResponse, setLastResponse] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [deviceData, setDeviceData] = useState<any>(null)

    useEffect(() => {
        const code = localStorage.getItem('tv_device_code')
        setDeviceCode(code)

        if (code) {
            // Fetch device data from database
            fetchDeviceData(code)
        }
    }, [])

    const fetchDeviceData = async (code: string) => {
        try {
            const { data, error } = await supabase
                .from('tv_devices')
                .select('*')
                .eq('device_code', code)
                .single()

            if (error) {
                console.error('Error fetching device:', error)
                setError(error)
            } else {
                setDeviceData(data)
            }
        } catch (err) {
            console.error('Exception fetching device:', err)
            setError(err)
        }
    }

    const testHeartbeat = async () => {
        if (!deviceCode) {
            alert('No device code in localStorage!')
            return
        }

        try {
            console.log('Testing heartbeat for:', deviceCode)
            const { data, error } = await supabase.rpc('update_device_heartbeat', {
                p_device_code: deviceCode,
                p_ip_address: null,
                p_user_agent: navigator.userAgent
            })

            if (error) {
                console.error('RPC Error:', error)
                setError(error)
                setLastResponse(null)
            } else {
                console.log('RPC Success:', data)
                setLastResponse(data)
                setError(null)

                // Refresh device data
                await fetchDeviceData(deviceCode)
            }
        } catch (err) {
            console.error('Exception:', err)
            setError(err)
            setLastResponse(null)
        }
    }

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'monospace',
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#10b981' }}>Heartbeat Debug Tool</h1>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#374151', borderRadius: '8px' }}>
                <h2 style={{ color: '#fbbf24' }}>localStorage</h2>
                <p><strong>tv_device_code:</strong> {deviceCode || 'NULL'}</p>
                <p><strong>tv_org_id:</strong> {localStorage.getItem('tv_org_id') || 'NULL'}</p>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#374151', borderRadius: '8px' }}>
                <h2 style={{ color: '#fbbf24' }}>Device in Database</h2>
                {deviceData ? (
                    <pre style={{ overflow: 'auto' }}>{JSON.stringify(deviceData, null, 2)}</pre>
                ) : (
                    <p style={{ color: '#ef4444' }}>No device found or not loaded yet</p>
                )}
            </div>

            <button
                onClick={testHeartbeat}
                style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                }}
            >
                Test Heartbeat Now
            </button>

            {lastResponse !== null && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#064e3b', borderRadius: '8px' }}>
                    <h3 style={{ color: '#10b981' }}>Last Response (Success)</h3>
                    <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
                </div>
            )}

            {error && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#7f1d1d', borderRadius: '8px' }}>
                    <h3 style={{ color: '#ef4444' }}>Error</h3>
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}

export default HeartbeatDebug
