import React, { useEffect, useState } from 'react'

const DiagnosticPage: React.FC = () => {
    const [windowKeys, setWindowKeys] = useState<string[]>([])
    const [tauriInfo, setTauriInfo] = useState<any>({})

    useEffect(() => {
        // Get all keys in window object
        const keys = Object.keys(window).filter(key =>
            key.toLowerCase().includes('tauri') ||
            key.startsWith('__') ||
            key.toLowerCase().includes('ipc')
        )
        setWindowKeys(keys)

        // Try to detect Tauri-specific properties
        const info: any = {
            hasWindow: typeof window !== 'undefined',
            hasTauri: '__TAURI__' in window,
            hasTauriInternals: '__TAURI_INTERNALS__' in window,
            hasTauriIPC: '__TAURI_IPC__' in window,
            hasTauriMetadata: '__TAURI_METADATA__' in window,
            windowKeys: keys,
            allWindowKeys: Object.keys(window).length,
            userAgent: navigator.userAgent
        }

        // Try to access each property safely
        keys.forEach(key => {
            try {
                info[`value_${key}`] = typeof (window as any)[key]
            } catch (e) {
                info[`value_${key}`] = 'ERROR: ' + (e as Error).message
            }
        })

        setTauriInfo(info)

        // Log to console for debugging
        console.log('🔍 DIAGNOSTIC INFO:', info)
        console.log('🔍 WINDOW KEYS:', keys)
    }, [])

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#000',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: '20px',
            overflow: 'auto'
        }}>
            <h1 style={{ color: '#0f0', marginBottom: '20px' }}>🔍 TAURI DIAGNOSTIC PAGE</h1>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ff0' }}>Detection Results:</h2>
                <div style={{ marginLeft: '20px' }}>
                    <p>✓ typeof window: {tauriInfo.hasWindow ? 'defined' : 'undefined'}</p>
                    <p>✓ '__TAURI__' in window: {tauriInfo.hasTauri ? 'YES ✅' : 'NO ❌'}</p>
                    <p>✓ '__TAURI_INTERNALS__' in window: {tauriInfo.hasTauriInternals ? 'YES ✅' : 'NO ❌'}</p>
                    <p>✓ '__TAURI_IPC__' in window: {tauriInfo.hasTauriIPC ? 'YES ✅' : 'NO ❌'}</p>
                    <p>✓ '__TAURI_METADATA__' in window: {tauriInfo.hasTauriMetadata ? 'YES ✅' : 'NO ❌'}</p>
                    <p>✓ Total window keys: {tauriInfo.allWindowKeys}</p>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ff0' }}>Tauri-related Window Keys:</h2>
                <div style={{ marginLeft: '20px' }}>
                    {windowKeys.length === 0 ? (
                        <p style={{ color: '#f00' }}>❌ NO TAURI KEYS FOUND!</p>
                    ) : (
                        windowKeys.map(key => (
                            <p key={key}>
                                • {key} = {tauriInfo[`value_${key}`]}
                            </p>
                        ))
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ff0' }}>User Agent:</h2>
                <p style={{ marginLeft: '20px', wordBreak: 'break-all' }}>{tauriInfo.userAgent}</p>
            </div>

            <div>
                <h2 style={{ color: '#ff0' }}>Full Diagnostic Object:</h2>
                <pre style={{
                    background: '#111',
                    padding: '10px',
                    borderRadius: '5px',
                    overflow: 'auto',
                    fontSize: '12px'
                }}>
                    {JSON.stringify(tauriInfo, null, 2)}
                </pre>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', background: '#222', borderRadius: '5px' }}>
                <p style={{ color: '#ff0' }}>📋 INSTRUCTIONS:</p>
                <p>1. Fai uno screenshot di questa pagina</p>
                <p>2. Invialo per vedere ESATTAMENTE cosa Tauri v2 espone</p>
                <p>3. Troveremo il metodo corretto di detection!</p>
            </div>
        </div>
    )
}

export default DiagnosticPage
