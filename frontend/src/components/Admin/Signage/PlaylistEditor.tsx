import React, { useState, useEffect } from 'react'
import {
    Play, Pause, Plus, Trash2, Clock, Monitor, Calendar,
    GripVertical, Save, X, ArrowLeft, Eye, Settings
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import './PlaylistEditor.css'

interface Slide {
    id: string
    name: string
    description: string | null
    content: any
    duration: number
    transition_type: string
    template_id: string | null
    created_at: string
}

interface PlaylistItem {
    id: string
    slide_id: string
    display_order: number
    duration_override: number | null
    slide?: Slide
}

interface Playlist {
    id: string
    name: string
    description: string | null
    is_active: boolean
    is_default: boolean
    loop_enabled: boolean
    shuffle_enabled: boolean
}

interface Device {
    id: string
    device_name: string
    status: string
}

interface PlaylistEditorProps {
    playlistId: string
    organizationId: string
    primaryColor?: string
    secondaryColor?: string
    onBack: () => void
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
    playlistId,
    organizationId,
    primaryColor,
    secondaryColor,
    onBack
}) => {
    console.log('🎨 PlaylistEditor riceve colori:', { primaryColor, secondaryColor })
    const [playlist, setPlaylist] = useState<Playlist | null>(null)
    const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
    const [availableSlides, setAvailableSlides] = useState<Slide[]>([])
    const [devices, setDevices] = useState<Device[]>([])
    const [assignedDevices, setAssignedDevices] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [previewIndex, setPreviewIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [draggedSlide, setDraggedSlide] = useState<Slide | null>(null)
    const [draggedItem, setDraggedItem] = useState<PlaylistItem | null>(null)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [showDeviceModal, setShowDeviceModal] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        loadData()
    }, [playlistId, organizationId])

    useEffect(() => {
        console.log('🎬 Autoplay useEffect:', { isPlaying, previewIndex, playlistItemsLength: playlistItems.length })
        if (isPlaying && playlistItems.length > 0) {
            const currentItem = playlistItems[previewIndex]
            const duration = (currentItem.duration_override || currentItem.slide?.duration || 10) * 1000
            console.log('⏱️ Setting timer for', duration, 'ms')

            // Reset progress
            setProgress(0)

            // Update progress every 100ms
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    const increment = (100 / duration) * 100
                    const newProgress = prev + increment
                    return newProgress >= 100 ? 100 : newProgress
                })
            }, 100)

            // Auto-advance timer
            const timer = setTimeout(() => {
                console.log('⏭️ Auto-advancing to next slide')
                setPreviewIndex((prev) => (prev + 1) % playlistItems.length)
            }, duration)

            return () => {
                clearTimeout(timer)
                clearInterval(progressInterval)
            }
        } else {
            setProgress(0)
        }
    }, [isPlaying, previewIndex, playlistItems])

    const loadData = async () => {
        try {
            setLoading(true)

            // Load playlist details
            const { data: playlistData, error: playlistError } = await supabase
                .from('signage_playlists')
                .select('*')
                .eq('id', playlistId)
                .single()

            if (playlistError) throw playlistError
            setPlaylist(playlistData)

            // Load playlist items with slides
            const { data: itemsData, error: itemsError } = await supabase
                .from('signage_playlist_items')
                .select(`
                    id,
                    slide_id,
                    display_order,
                    duration_override,
                    slide:signage_slides(*)
                `)
                .eq('playlist_id', playlistId)
                .order('display_order')

            if (itemsError) throw itemsError
            setPlaylistItems(itemsData || [])

            // Load available slides
            const { data: slidesData, error: slidesError } = await supabase
                .from('signage_slides')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (slidesError) throw slidesError
            setAvailableSlides(slidesData || [])

            // Load devices
            const { data: devicesData, error: devicesError } = await supabase
                .from('tv_devices')
                .select('id, device_name, status')
                .eq('organization_id', organizationId)

            if (devicesError) throw devicesError
            setDevices(devicesData || [])

            // Load device assignments
            const { data: schedulesData, error: schedulesError } = await supabase
                .from('signage_schedules')
                .select('device_id')
                .eq('playlist_id', playlistId)
                .eq('is_active', true)

            if (schedulesError) throw schedulesError
            setAssignedDevices(schedulesData?.map(s => s.device_id).filter(Boolean) || [])

        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Errore nel caricamento dei dati')
        } finally {
            setLoading(false)
        }
    }

    const handleAddSlide = async (slide: Slide) => {
        try {
            const maxOrder = playlistItems.length > 0
                ? Math.max(...playlistItems.map(item => item.display_order))
                : -1

            const { error } = await supabase
                .from('signage_playlist_items')
                .insert({
                    playlist_id: playlistId,
                    slide_id: slide.id,
                    slide_type: 'custom',
                    display_order: maxOrder + 1
                })

            if (error) throw error

            toast.success(`${slide.name} aggiunta alla playlist!`)
            loadData()
        } catch (error) {
            console.error('Error adding slide:', error)
            toast.error('Errore durante l\'aggiunta')
        }
    }

    const handleRemoveSlide = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('signage_playlist_items')
                .delete()
                .eq('id', itemId)

            if (error) throw error

            toast.success('Slide rimossa!')
            loadData()
        } catch (error) {
            console.error('Error removing slide:', error)
            toast.error('Errore durante la rimozione')
        }
    }

    const handleReorder = async (fromIndex: number, toIndex: number) => {
        const newItems = [...playlistItems]
        const [movedItem] = newItems.splice(fromIndex, 1)
        newItems.splice(toIndex, 0, movedItem)

        // Update display_order
        const updates = newItems.map((item, index) => ({
            id: item.id,
            display_order: index
        }))

        try {
            for (const update of updates) {
                await supabase
                    .from('signage_playlist_items')
                    .update({ display_order: update.display_order })
                    .eq('id', update.id)
            }

            setPlaylistItems(newItems)
            toast.success('Ordine aggiornato!')
        } catch (error) {
            console.error('Error reordering:', error)
            toast.error('Errore durante il riordino')
        }
    }

    const handleDurationOverride = async (itemId: string, duration: number | null) => {
        try {
            const { error } = await supabase
                .from('signage_playlist_items')
                .update({ duration_override: duration })
                .eq('id', itemId)

            if (error) throw error

            toast.success('Durata aggiornata!')
            loadData()
        } catch (error) {
            console.error('Error updating duration:', error)
            toast.error('Errore durante l\'aggiornamento')
        }
    }

    const handleAssignDevice = async (deviceId: string) => {
        try {
            // Check if already assigned
            if (assignedDevices.includes(deviceId)) {
                // Remove assignment
                await supabase
                    .from('signage_schedules')
                    .delete()
                    .eq('playlist_id', playlistId)
                    .eq('device_id', deviceId)

                toast.success('Dispositivo rimosso!')
            } else {
                // Add assignment
                await supabase
                    .from('signage_schedules')
                    .insert({
                        playlist_id: playlistId,
                        device_id: deviceId,
                        name: `Schedule for ${playlist?.name}`,
                        is_active: true,
                        priority: 0
                    })

                toast.success('Dispositivo assegnato!')
            }

            loadData()
        } catch (error) {
            console.error('Error assigning device:', error)
            toast.error('Errore durante l\'assegnazione')
        }
    }

    const getTotalDuration = () => {
        return playlistItems.reduce((total, item) => {
            const duration = item.duration_override || item.slide?.duration || 10
            return total + duration
        }, 0)
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Caricamento...</div>
    }

    const currentSlide = playlistItems[previewIndex]?.slide

    return (
        <div
            className="playlist-editor"
            style={{
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor
            } as React.CSSProperties}
        >
            {/* Header */}
            <div className="editor-header">
                <div className="header-left">
                    <button onClick={onBack} className="back-button">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="editor-title">{playlist?.name}</h1>
                        <p className="editor-subtitle">
                            {playlistItems.length} slide • {formatDuration(getTotalDuration())} totale
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        onClick={() => setShowDeviceModal(true)}
                        className="action-button secondary"
                    >
                        <Monitor size={18} />
                        Dispositivi ({assignedDevices.length})
                    </button>
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="action-button secondary"
                    >
                        <Calendar size={18} />
                        Programmazione
                    </button>
                    <button
                        onClick={onBack}
                        className="action-button primary"
                        style={primaryColor ? { background: primaryColor } : {}}
                    >
                        <Save size={18} />
                        Salva e Chiudi
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="editor-content">
                {/* Playlist Panel - SINISTRA */}
                <div className="playlist-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Playlist ({playlistItems.length})</h3>
                    </div>
                    <div
                        className="playlist-items"
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {playlistItems.length === 0 ? (
                            <div className="empty-state">
                                <Play size={48} />
                                <p>Clicca le slide disponibili sotto per aggiungerle</p>
                            </div>
                        ) : (
                            playlistItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`playlist-item ${index === previewIndex ? 'active' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''}`}
                                    style={{
                                        ...(index === previewIndex && primaryColor && secondaryColor ? {
                                            background: primaryColor,
                                            borderColor: secondaryColor
                                        } : {})
                                    }}
                                    draggable
                                    onDragStart={(e) => {
                                        setDraggedItem(item)
                                        e.dataTransfer.effectAllowed = 'move'
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = 'move'
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        if (draggedItem) {
                                            const fromIndex = playlistItems.findIndex(i => i.id === draggedItem.id)
                                            handleReorder(fromIndex, index)
                                            setDraggedItem(null)
                                        }
                                    }}
                                    onDragEnd={() => setDraggedItem(null)}
                                    onClick={() => setPreviewIndex(index)}
                                >
                                    <div className="item-drag-handle">
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="item-content">
                                        <span className="item-order">{index + 1}</span>
                                        <div className="item-info">
                                            <span className="item-name">{item.slide?.name}</span>
                                            <div className="item-meta">
                                                <Clock size={12} />
                                                <input
                                                    type="number"
                                                    value={item.duration_override || item.slide?.duration || 10}
                                                    onChange={(e) => handleDurationOverride(item.id, parseInt(e.target.value))}
                                                    className="duration-input"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span>sec</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveSlide(item.id)
                                        }}
                                        className="item-remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Preview Panel - DESTRA GRANDE */}
                <div className="preview-panel">
                    {/* Preview Area */}
                    <div className="preview-area">
                        <div className="preview-header" style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                            <span className="preview-title">Anteprima Live</span>
                            <div className="preview-controls">
                                <button
                                    onClick={() => {
                                        console.log('▶️ Play button clicked, isPlaying:', isPlaying, '-> will be:', !isPlaying)
                                        setIsPlaying(!isPlaying)
                                    }}
                                    className="preview-control-button"
                                    style={primaryColor ? { background: primaryColor } : {}}
                                >
                                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                                <span className="preview-counter">
                                    {playlistItems.length > 0 ? `${previewIndex + 1} / ${playlistItems.length}` : '0 / 0'}
                                </span>
                            </div>
                        </div>
                        <div className="preview-screen">
                        {currentSlide ? (
                            <div className={`preview-slide ${isPlaying ? 'playing' : ''}`}>
                                {/* Progress Bar */}
                                {isPlaying && (
                                    <div className="slide-progress-bar">
                                        <div className="slide-progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                )}
                                {/* Render slide preview based on content */}
                                <div className="slide-preview-wrapper">
                                    <SlidePreview slide={currentSlide} />
                                </div>
                                <div className="preview-info">
                                    <span className="slide-name">{currentSlide.name}</span>
                                    <span className="slide-duration">
                                        <Clock size={14} />
                                        {formatDuration(
                                            playlistItems[previewIndex]?.duration_override ||
                                            currentSlide.duration
                                        )}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="preview-empty">
                                <Eye size={48} />
                                <p>Aggiungi slide per vedere l'anteprima</p>
                            </div>
                        )}
                    </div>
                </div>

                    {/* Timeline */}
                    <div className="timeline">
                        {playlistItems.map((item, index) => {
                            const duration = item.duration_override || item.slide?.duration || 10
                            const totalDuration = getTotalDuration()
                            const width = (duration / totalDuration) * 100

                            return (
                                <div
                                    key={item.id}
                                    className={`timeline-item ${index === previewIndex ? 'active' : ''}`}
                                    style={{
                                        width: `${width}%`,
                                        ...(index === previewIndex && primaryColor ? { background: primaryColor } : {})
                                    }}
                                    onClick={() => setPreviewIndex(index)}
                                    title={item.slide?.name}
                                >
                                    <span className="timeline-duration">{duration}s</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Slides Library - SOTTO */}
                    <div className="library-section">
                        <h4>Slide Disponibili ({availableSlides.length}) - Clicca per aggiungere</h4>
                        <div className="library-grid">
                            {availableSlides.map((slide) => (
                                <div
                                    key={slide.id}
                                    className="library-slide"
                                    onClick={() => handleAddSlide(slide)}
                                >
                                    <div className="library-slide-preview">
                                        <SlidePreview slide={slide} />
                                    </div>
                                    <div className="library-slide-info">
                                        <span className="library-slide-name">{slide.name}</span>
                                        <span className="library-slide-duration">
                                            <Clock size={12} />
                                            {slide.duration}s
                                        </span>
                                    </div>
                                    <button
                                        className="library-slide-add"
                                        style={primaryColor ? { background: primaryColor } : {}}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Assignment Modal */}
            {showDeviceModal && (
                <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Assegna Dispositivi</h3>
                            <button onClick={() => setShowDeviceModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {devices.map((device) => (
                                <label key={device.id} className="device-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={assignedDevices.includes(device.id)}
                                        onChange={() => handleAssignDevice(device.id)}
                                        className="device-checkbox"
                                    />
                                    <div className="device-info">
                                        <span className="device-name">{device.device_name}</span>
                                        <span className={`device-status ${device.status}`}>
                                            {device.status === 'active' ? '🟢 Online' : '🔴 Offline'}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Slide Preview Component
const SlidePreview: React.FC<{ slide: Slide }> = ({ slide }) => {
    if (!slide.content?.zones) {
        return <div className="slide-preview-empty">Nessun contenuto</div>
    }

    return (
        <div className="slide-content-preview">
            {slide.content.zones.map((zone: any) => (
                <div
                    key={zone.id}
                    className="slide-zone"
                    style={{
                        position: 'absolute',
                        left: `${zone.x || 0}%`,
                        top: `${zone.y || 0}%`,
                        width: `${zone.width || 100}%`,
                        height: `${zone.height || 100}%`,
                        ...zone.style
                    }}
                >
                    {zone.type === 'image' && zone.content && (
                        <img src={zone.content} alt="" className="zone-image" />
                    )}
                    {zone.type === 'text' && zone.content && (
                        <div className="zone-text" style={zone.style}>
                            {zone.content}
                        </div>
                    )}
                    {zone.type === 'video' && zone.content && (
                        <video src={zone.content} className="zone-video" muted loop />
                    )}
                </div>
            ))}
        </div>
    )
}

export default PlaylistEditor
