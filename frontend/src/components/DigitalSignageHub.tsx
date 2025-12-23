import React, { useState, useEffect } from 'react'
import { Tv, Monitor, Wifi, WifiOff, Image, Play, Calendar, BarChart3, Layout, Settings, ArrowLeft, Plus, Upload, Layers, Zap, Eye, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TVControlPage from '../pages/Admin/TVControlPage'
import MediaLibrary from './Admin/Signage/MediaLibrary'
import PlaylistManager from './Admin/Signage/PlaylistManager'
import SlideBuilder from './Admin/Signage/SlideBuilder'
import PlaylistScheduler from './Admin/Signage/PlaylistScheduler'
import './DigitalSignageHub.css'

interface DigitalSignageHubProps {
    organizationId: string
    primaryColor?: string
    secondaryColor?: string
    onBack?: () => void
}

type ViewType = 'hub' | 'devices' | 'media' | 'slides' | 'playlists' | 'schedules' | 'analytics'

interface TVDevice {
    id: string
    device_name: string
    device_code: string
    status: string
    last_seen: string
    last_heartbeat: string | null
}

const DigitalSignageHub: React.FC<DigitalSignageHubProps> = ({
    organizationId,
    primaryColor,
    secondaryColor,
    onBack
}) => {
    console.log('🎨 DigitalSignageHub riceve colori:', { primaryColor, secondaryColor })
    const [activeView, setActiveView] = useState<ViewType>('hub')
    const [devices, setDevices] = useState<TVDevice[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalDevices: 0,
        onlineDevices: 0,
        totalSlides: 0,
        totalPlaylists: 0
    })

    useEffect(() => {
        fetchData()

        // Refresh every 10 seconds to update online/offline status
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [organizationId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch devices
            const { data: devicesData } = await supabase
                .from('tv_devices')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })

            // Fetch slides count
            const { count: slidesCount } = await supabase
                .from('signage_slides')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId)

            // Fetch playlists count
            const { count: playlistsCount } = await supabase
                .from('signage_playlists')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationId)

            const devices = devicesData || []
            setDevices(devices)

            // Calculate online devices (heartbeat < 30 seconds ago - same logic as TVDevicesManager)
            const onlineCount = devices.filter(d => {
                if (!d.last_heartbeat) return false
                const lastHeartbeatDate = new Date(d.last_heartbeat)
                const now = new Date()
                const diffSeconds = (now.getTime() - lastHeartbeatDate.getTime()) / 1000
                const isOnline = d.status === 'active' && diffSeconds < 30
                console.log(`[DigitalSignageHub] Device ${d.device_name}: status=${d.status}, last_heartbeat=${d.last_heartbeat}, diffSeconds=${diffSeconds.toFixed(1)}, isOnline=${isOnline}`)
                return isOnline
            }).length

            setStats({
                totalDevices: devices.length,
                onlineDevices: onlineCount,
                totalSlides: slidesCount || 0,
                totalPlaylists: playlistsCount || 0
            })
        } catch (error) {
            console.error('Error fetching digital signage data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Sub-views
    if (activeView === 'devices') {
        return (
            <div>
                <button
                    className="back-button"
                    onClick={() => {
                        setActiveView('hub')
                        fetchData()
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>Torna al Digital Signage</span>
                </button>
                <TVControlPage organizationId={organizationId} />
            </div>
        )
    }

    if (activeView === 'media') {
        return (
            <div>
                <button
                    className="back-button"
                    onClick={() => {
                        setActiveView('hub')
                        fetchData()
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>Torna al Digital Signage</span>
                </button>
                <MediaLibrary
                    organizationId={organizationId}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                />
            </div>
        )
    }

    if (activeView === 'slides') {
        return (
            <div>
                <button
                    className="back-button"
                    onClick={() => {
                        setActiveView('hub')
                        fetchData()
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>Torna al Digital Signage</span>
                </button>
                <SlideBuilder
                    organizationId={organizationId}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                />
            </div>
        )
    }

    if (activeView === 'playlists') {
        return (
            <div>
                <button
                    className="back-button"
                    onClick={() => {
                        setActiveView('hub')
                        fetchData()
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>Torna al Digital Signage</span>
                </button>
                <PlaylistManager
                    organizationId={organizationId}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                />
            </div>
        )
    }

    if (activeView === 'schedules') {
        return (
            <div>
                <button
                    className="back-button"
                    onClick={() => setActiveView('hub')}
                >
                    <ArrowLeft size={20} />
                    <span>Torna al Digital Signage</span>
                </button>
                <PlaylistScheduler organizationId={organizationId} />
            </div>
        )
    }

    if (activeView === 'analytics') {
        return (
            <div>
                <button
                    className="back-button"
                    onClick={() => setActiveView('hub')}
                >
                    <ArrowLeft size={20} />
                    <span>Torna al Digital Signage</span>
                </button>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '48px',
                    textAlign: 'center',
                    marginTop: '24px'
                }}>
                    <BarChart3 size={64} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                        Analytics (Coming Soon)
                    </h3>
                    <p style={{ color: '#6b7280' }}>
                        Monitora le performance dei tuoi contenuti
                    </p>
                </div>
            </div>
        )
    }

    // Main Hub View
    return (
        <div
            className="signage-hub"
            style={{
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor
            } as React.CSSProperties}
        >
            {/* Header */}
            <div className="signage-hub-header">
                <div className="signage-hub-header-content">
                    <div className="signage-hub-icon">
                        <Tv size={48} />
                    </div>
                    <div>
                        <h1>Digital Signage</h1>
                        <p>Gestisci i tuoi display TV, contenuti e playlist per un'esperienza coinvolgente</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="signage-stats-grid">
                <div className="signage-stat-card">
                    <div className="signage-stat-icon signage-stat-icon-primary">
                        <Monitor size={24} />
                    </div>
                    <div className="signage-stat-content">
                        <div className="signage-stat-value">{stats.totalDevices}</div>
                        <div className="signage-stat-label">Dispositivi Totali</div>
                    </div>
                </div>

                <div className="signage-stat-card">
                    <div className="signage-stat-icon signage-stat-icon-success">
                        <Wifi size={24} />
                    </div>
                    <div className="signage-stat-content">
                        <div className="signage-stat-value">{stats.onlineDevices}</div>
                        <div className="signage-stat-label">Online Adesso</div>
                    </div>
                </div>

                <div className="signage-stat-card">
                    <div className="signage-stat-icon signage-stat-icon-warning">
                        <Layout size={24} />
                    </div>
                    <div className="signage-stat-content">
                        <div className="signage-stat-value">{stats.totalSlides}</div>
                        <div className="signage-stat-label">Slide Create</div>
                    </div>
                </div>

                <div className="signage-stat-card">
                    <div className="signage-stat-icon signage-stat-icon-info">
                        <Play size={24} />
                    </div>
                    <div className="signage-stat-content">
                        <div className="signage-stat-value">{stats.totalPlaylists}</div>
                        <div className="signage-stat-label">Playlist Attive</div>
                    </div>
                </div>
            </div>

            {/* Top Devices Section */}
            {devices.length > 0 && (
                <div className="signage-top-section">
                    <h2><Monitor size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> I Tuoi Display TV</h2>
                    <div className="signage-top-grid">
                        {devices.slice(0, 3).map((device, index) => {
                            // Use same logic as TVDevicesManager
                            let isOnline = false
                            if (device.last_heartbeat) {
                                const lastHeartbeatDate = new Date(device.last_heartbeat)
                                const now = new Date()
                                const diffSeconds = (now.getTime() - lastHeartbeatDate.getTime()) / 1000
                                isOnline = device.status === 'active' && diffSeconds < 30
                            }

                            console.log(`[Render] Device ${device.device_name}: status=${device.status}, last_heartbeat=${device.last_heartbeat}, isOnline=${isOnline}`)

                            return (
                                <div key={device.id} className="signage-top-card">
                                    <div className="signage-top-badge">#{index + 1}</div>
                                    <div className="signage-top-placeholder">
                                        <Monitor size={48} />
                                    </div>
                                    <div className="signage-top-info">
                                        <h3>{device.device_name}</h3>
                                        <div className="signage-top-meta">
                                            <span className={isOnline ? "signage-top-status online" : "signage-top-status offline"}>
                                                {isOnline ? <Wifi size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.25rem' }} /> : <WifiOff size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.25rem' }} />}
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                            <span className="signage-top-code">{device.device_code}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Hub Cards - Azioni Principali */}
            <div className="signage-hub-cards">
                {/* Card: Gestione Dispositivi */}
                <div
                    className="signage-hub-card signage-hub-card-primary"
                    onClick={() => setActiveView('devices')}
                >
                    <div className="signage-hub-card-icon">
                        <Monitor size={32} />
                    </div>
                    <div className="signage-hub-card-content">
                        <h3>Gestione Dispositivi</h3>
                        <p>Configura e monitora i tuoi display TV in tempo reale</p>
                        <ul className="signage-hub-card-features">
                            <li><Settings size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Configurazione display</li>
                            <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Status real-time</li>
                            <li><Image size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Overlay e background</li>
                            <li><Play size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Durata slide personalizzata</li>
                        </ul>
                    </div>
                    <div className="signage-hub-card-arrow">→</div>
                </div>

                {/* Card: Media Library */}
                <div
                    className="signage-hub-card signage-hub-card-secondary"
                    onClick={() => setActiveView('media')}
                >
                    <div className="signage-hub-card-icon">
                        <Image size={32} />
                    </div>
                    <div className="signage-hub-card-content">
                        <h3>Media Library</h3>
                        <p>Carica e organizza immagini e video per le tue slide</p>
                        <ul className="signage-hub-card-features">
                            <li><Upload size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Upload multipli</li>
                            <li><Layers size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Organizza in cartelle</li>
                            <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Preview immediata</li>
                        </ul>
                    </div>
                    <div className="signage-hub-card-arrow">→</div>
                </div>

                {/* Card: Slide Builder */}
                <div
                    className="signage-hub-card signage-hub-card-tertiary"
                    onClick={() => setActiveView('slides')}
                >
                    <div className="signage-hub-card-icon">
                        <Layout size={32} />
                    </div>
                    <div className="signage-hub-card-content">
                        <h3>Crea Slide</h3>
                        <p>Progetta slide personalizzate con template professionali</p>
                        <ul className="signage-hub-card-features">
                            <li><Layers size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Template predefiniti</li>
                            <li><Image size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Editor drag & drop</li>
                            <li><Eye size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Anteprima live</li>
                        </ul>
                    </div>
                    <div className="signage-hub-card-arrow">→</div>
                </div>

                {/* Card: Playlist Manager */}
                <div
                    className="signage-hub-card signage-hub-card-quaternary"
                    onClick={() => setActiveView('playlists')}
                >
                    <div className="signage-hub-card-icon">
                        <Play size={32} />
                    </div>
                    <div className="signage-hub-card-content">
                        <h3>Gestione Playlist</h3>
                        <p>Organizza le slide in playlist dinamiche per i tuoi display</p>
                        <ul className="signage-hub-card-features">
                            <li><Layers size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Ordina slide</li>
                            <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Assegna ai display</li>
                            <li><Play size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Durata personalizzata</li>
                        </ul>
                    </div>
                    <div className="signage-hub-card-arrow">→</div>
                </div>

                {/* Card: Programmazione */}
                <div
                    className="signage-hub-card signage-hub-card-primary"
                    onClick={() => setActiveView('schedules')}
                >
                    <div className="signage-hub-card-icon">
                        <Calendar size={32} />
                    </div>
                    <div className="signage-hub-card-content">
                        <h3>Programmazione</h3>
                        <p>Pianifica quando mostrare le playlist custom con orari e giorni</p>
                        <ul className="signage-hub-card-features">
                            <li><Calendar size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Date e orari</li>
                            <li><Clock size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Giorni settimana</li>
                            <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Priorità automatica</li>
                        </ul>
                    </div>
                    <div className="signage-hub-card-arrow">→</div>
                </div>
            </div>
        </div>
    )
}

export default DigitalSignageHub
