import React, { useState, useEffect } from 'react'
import { Plus, Image, Type, Video, Layout, Save, X, Eye } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import MediaLibrary from './MediaLibrary'

interface Template {
    id: string
    name: string
    category: string
    thumbnail_url: string | null
    layout_config: {
        zones: {
            id: string
            type: 'image' | 'text' | 'video'
            x: number
            y: number
            width: number
            height: number
        }[]
    }
}

interface Slide {
    id: string
    name: string
    template_id: string | null
    content: {
        zones: {
            id: string
            type: string
            content: string
            style?: any
        }[]
    }
    duration: number
    transition_type: string
}

interface SlideBuilderProps {
    organizationId: string
}

const SlideBuilder: React.FC<SlideBuilderProps> = ({ organizationId }) => {
    const [slides, setSlides] = useState<Slide[]>([])
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [showMediaLibrary, setShowMediaLibrary] = useState(false)
    const [currentSlide, setCurrentSlide] = useState<Partial<Slide> | null>(null)
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

    useEffect(() => {
        loadSlides()
        loadTemplates()
    }, [organizationId])

    const loadSlides = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('signage_slides')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSlides(data || [])
        } catch (error) {
            console.error('Error loading slides:', error)
            toast.error('Errore nel caricamento delle slide')
        } finally {
            setLoading(false)
        }
    }

    const loadTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('signage_templates')
                .select('*')
                .or(`organization_id.eq.${organizationId},is_public.eq.true`)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error loading templates:', error)
        }
    }

    const handleCreateSlide = (template?: Template) => {
        setCurrentSlide({
            name: 'Nuova Slide',
            template_id: template?.id || null,
            content: template ? template.layout_config : { zones: [] },
            duration: 10,
            transition_type: 'fade'
        })
        setShowEditor(true)
    }

    const handleSaveSlide = async () => {
        if (!currentSlide?.name) {
            toast.error('Inserisci un nome per la slide')
            return
        }

        try {
            if (currentSlide.id) {
                // Update existing
                const { error } = await supabase
                    .from('signage_slides')
                    .update({
                        name: currentSlide.name,
                        content: currentSlide.content,
                        duration: currentSlide.duration,
                        transition_type: currentSlide.transition_type
                    })
                    .eq('id', currentSlide.id)

                if (error) throw error
                toast.success('Slide aggiornata!')
            } else {
                // Create new
                const { error } = await supabase
                    .from('signage_slides')
                    .insert({
                        organization_id: organizationId,
                        template_id: currentSlide.template_id,
                        name: currentSlide.name,
                        content: currentSlide.content,
                        duration: currentSlide.duration,
                        transition_type: currentSlide.transition_type,
                        is_active: true
                    })

                if (error) throw error
                toast.success('Slide creata!')
            }

            setShowEditor(false)
            setCurrentSlide(null)
            loadSlides()
        } catch (error) {
            console.error('Error saving slide:', error)
            toast.error('Errore durante il salvataggio')
        }
    }

    const handleDeleteSlide = async (slideId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa slide?')) return

        try {
            const { error } = await supabase
                .from('signage_slides')
                .delete()
                .eq('id', slideId)

            if (error) throw error

            toast.success('Slide eliminata')
            loadSlides()
        } catch (error) {
            console.error('Error deleting slide:', error)
            toast.error('Errore durante l\'eliminazione')
        }
    }

    const handleAddZone = (type: 'image' | 'text' | 'video') => {
        if (!currentSlide) return

        const newZone = {
            id: `zone-${Date.now()}`,
            type,
            content: type === 'text' ? 'Testo di esempio' : '',
            style: {
                backgroundColor: type === 'text' ? '#ffffff' : 'transparent',
                color: '#000000',
                fontSize: '1.5rem',
                padding: '1rem'
            }
        }

        setCurrentSlide({
            ...currentSlide,
            content: {
                zones: [...(currentSlide.content?.zones || []), newZone]
            }
        })
    }

    const handleUpdateZone = (zoneId: string, updates: any) => {
        if (!currentSlide) return

        setCurrentSlide({
            ...currentSlide,
            content: {
                zones: currentSlide.content?.zones?.map(zone =>
                    zone.id === zoneId ? { ...zone, ...updates } : zone
                ) || []
            }
        })
    }

    const handleSelectMedia = (media: any) => {
        if (!selectedZoneId || !currentSlide) return

        handleUpdateZone(selectedZoneId, { content: media.file_url })
        setShowMediaLibrary(false)
        setSelectedZoneId(null)
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Slide Builder</h2>
                    <p className="text-gray-600 mt-1">Crea slide personalizzate per i tuoi display</p>
                </div>
                <button
                    onClick={() => handleCreateSlide()}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuova Slide
                </button>
            </div>

            {/* Templates Section */}
            {!showEditor && (
                <>
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Disponibili</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => handleCreateSlide(template)}
                                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                        <Layout size={48} className="text-purple-600" />
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                                        <p className="text-xs text-gray-500">{template.category}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Blank Template */}
                            <div
                                onClick={() => handleCreateSlide()}
                                className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
                            >
                                <div className="aspect-video flex items-center justify-center">
                                    <div className="text-center">
                                        <Plus size={48} className="text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-gray-600">Slide Vuota</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slides List */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Le Tue Slide</h3>
                        {loading ? (
                            <div className="text-center py-12">Caricamento...</div>
                        ) : slides.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <Layout size={48} className="mx-auto text-gray-400 mb-4" />
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Nessuna slide</h4>
                                <p className="text-gray-600 mb-4">Crea la tua prima slide per iniziare</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {slides.map(slide => (
                                    <div
                                        key={slide.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                                            <Layout size={32} className="text-gray-400" />
                                            <button
                                                onClick={() => {
                                                    setCurrentSlide(slide)
                                                    setShowEditor(true)
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:bg-gray-50"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-semibold text-sm text-gray-900 truncate">{slide.name}</h4>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-gray-500">{slide.duration}s</span>
                                                <button
                                                    onClick={() => handleDeleteSlide(slide.id)}
                                                    className="text-red-600 hover:bg-red-50 p-1 rounded text-xs"
                                                >
                                                    Elimina
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Slide Editor */}
            {showEditor && currentSlide && (
                <div className="space-y-6">
                    {/* Editor Header */}
                    <div className="flex justify-between items-center pb-4 border-b">
                        <input
                            type="text"
                            value={currentSlide.name}
                            onChange={(e) => setCurrentSlide({ ...currentSlide, name: e.target.value })}
                            className="text-2xl font-bold text-gray-900 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowEditor(false)
                                    setCurrentSlide(null)
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleSaveSlide}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                            >
                                <Save size={20} />
                                Salva Slide
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAddZone('text')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Type size={20} />
                            Aggiungi Testo
                        </button>
                        <button
                            onClick={() => handleAddZone('image')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Image size={20} />
                            Aggiungi Immagine
                        </button>
                        <button
                            onClick={() => handleAddZone('video')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Video size={20} />
                            Aggiungi Video
                        </button>
                    </div>

                    {/* Canvas */}
                    <div className="bg-gray-900 rounded-lg p-8 min-h-[600px] relative">
                        <div className="bg-white rounded-lg w-full aspect-video relative overflow-hidden">
                            {currentSlide.content?.zones?.map(zone => (
                                <div
                                    key={zone.id}
                                    className="absolute border-2 border-dashed border-purple-500 cursor-move p-4"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '80%',
                                        ...zone.style
                                    }}
                                >
                                    {zone.type === 'text' && (
                                        <textarea
                                            value={zone.content}
                                            onChange={(e) => handleUpdateZone(zone.id, { content: e.target.value })}
                                            className="w-full h-full resize-none border-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                            style={{ fontSize: zone.style?.fontSize, color: zone.style?.color }}
                                        />
                                    )}
                                    {zone.type === 'image' && (
                                        zone.content ? (
                                            <img src={zone.content} alt="Slide" className="w-full h-full object-cover" />
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    setSelectedZoneId(zone.id)
                                                    setShowMediaLibrary(true)
                                                }}
                                                className="w-full h-full flex items-center justify-center bg-gray-100 cursor-pointer hover:bg-gray-200"
                                            >
                                                <div className="text-center">
                                                    <Image size={48} className="mx-auto text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-600">Clicca per selezionare</p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                    {zone.type === 'video' && (
                                        zone.content ? (
                                            <video src={zone.content} controls className="w-full h-full" />
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    setSelectedZoneId(zone.id)
                                                    setShowMediaLibrary(true)
                                                }}
                                                className="w-full h-full flex items-center justify-center bg-gray-100 cursor-pointer hover:bg-gray-200"
                                            >
                                                <div className="text-center">
                                                    <Video size={48} className="mx-auto text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-600">Clicca per selezionare</p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Durata (secondi)</label>
                            <input
                                type="number"
                                value={currentSlide.duration}
                                onChange={(e) => setCurrentSlide({ ...currentSlide, duration: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Transizione</label>
                            <select
                                value={currentSlide.transition_type}
                                onChange={(e) => setCurrentSlide({ ...currentSlide, transition_type: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="fade">Dissolvenza</option>
                                <option value="slide">Scorrimento</option>
                                <option value="zoom">Zoom</option>
                                <option value="none">Nessuna</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Library Modal */}
            {showMediaLibrary && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">Seleziona Media</h3>
                            <button
                                onClick={() => {
                                    setShowMediaLibrary(false)
                                    setSelectedZoneId(null)
                                }}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <MediaLibrary
                            organizationId={organizationId}
                            onSelectMedia={handleSelectMedia}
                            selectionMode={true}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default SlideBuilder
