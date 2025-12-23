import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Pagina di caricamento ISTANTANEA - solo logo, niente animazioni pesanti
 * Questa viene mostrata SUBITO all'avvio per evitare la schermata nera.
 * Dopo un breve momento passa alla splash screen animata.
 */
const InitialLoadingPage: React.FC = () => {
    const navigate = useNavigate()

    useEffect(() => {
        // Dopo 1.5 secondi, passa alla splash screen animata
        const timer = setTimeout(() => {
            navigate('/tv/splash')
        }, 1500)

        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090a0f',
            margin: 0,
            padding: 0,
            overflow: 'hidden'
        }}>
            {/* Solo il logo - nessuna animazione pesante per caricare velocissimo */}
            <div style={{
                width: '500px',
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <img
                    src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                    alt="OmnilyPro"
                    style={{
                        width: '100%',
                        height: 'auto',
                        filter: 'brightness(0) invert(1)',
                        opacity: 0.9
                    }}
                />
            </div>
        </div>
    )
}

export default InitialLoadingPage
