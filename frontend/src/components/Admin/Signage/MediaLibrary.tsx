import React, { useState, useEffect } from 'react'
import { Upload, Image as ImageIcon, Video, File, Trash2, Search, Grid, List } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'
import './MediaLibrary.css'

interface Media {
    id: string
    name: string
    description: string | null
    file_type: 'image' | 'video' | 'pdf'
    file_url: string
    thumbnail_url: string | null
    file_size: number
    width: number | null
    height: number | null
    duration: number | null
    tags: string[]
    created_at: string
}

interface MediaLibraryProps {
    organizationId: string
    primaryColor?: string
    secondaryColor?: string
    onSelectMedia?: (media: Media) => void
    selectionMode?: boolean
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
    organizationId,
    primaryColor,
    secondaryColor,
    onSelectMedia,
    selectionMode = false
}) => {
    const [media, setMedia] = useState<Media[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'pdf'>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    useEffect(() => {
        loadMedia()
    }, [organizationId, filterType])

    const loadMedia = async () => {
        try {
            setLoading(true)

            let query = supabase
                .from('signage_media')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })

            if (filterType !== 'all') {
                query = query.eq('file_type', filterType)
            }

            const { data, error } = await query

            if (error) throw error
            setMedia(data || [])
        } catch (error) {
            console.error('Error loading media:', error)
            toast.error('Errore nel caricamento dei media')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        setUploading(true)

        for (const file of Array.from(files)) {
            try {
                // Validate file type
                const fileType = file.type.startsWith('image/') ? 'image' :
                               file.type.startsWith('video/') ? 'video' :
                               file.type === 'application/pdf' ? 'pdf' : null

                if (!fileType) {
                    toast.error(`File ${file.name} non supportato`)
                    continue
                }

                // Upload to Supabase Storage
                const fileName = `${organizationId}/${Date.now()}_${file.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('signage-media')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) throw uploadError

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('signage-media')
                    .getPublicUrl(fileName)

                // Get image/video dimensions if applicable
                let width = null
                let height = null
                let duration = null

                if (fileType === 'image') {
                    const dimensions = await getImageDimensions(file)
                    width = dimensions.width
                    height = dimensions.height
                } else if (fileType === 'video') {
                    const videoDuration = await getVideoDuration(file)
                    duration = videoDuration
                }

                // Insert into database
                const { error: dbError } = await supabase
                    .from('signage_media')
                    .insert({
                        organization_id: organizationId,
                        name: file.name,
                        file_type: fileType,
                        mime_type: file.type,
                        file_url: publicUrl,
                        file_size: file.size,
                        width,
                        height,
                        duration,
                        thumbnail_url: fileType === 'image' ? publicUrl : null
                    })

                if (dbError) throw dbError

                toast.success(`${file.name} caricato con successo!`)
            } catch (error) {
                console.error('Error uploading file:', error)
                toast.error(`Errore nel caricamento di ${file.name}`)
            }
        }

        setUploading(false)
        loadMedia()
    }

    const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                resolve({ width: img.width, height: img.height })
            }
            img.src = URL.createObjectURL(file)
        })
    }

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video')
            video.onloadedmetadata = () => {
                resolve(Math.round(video.duration))
            }
            video.src = URL.createObjectURL(file)
        })
    }

    const handleDelete = async (mediaId: string, fileUrl: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo file?')) return

        try {
            // Extract file path from URL
            const urlParts = fileUrl.split('/signage-media/')
            if (urlParts.length > 1) {
                const filePath = urlParts[1]

                // Delete from storage
                await supabase.storage
                    .from('signage-media')
                    .remove([filePath])
            }

            // Delete from database
            const { error } = await supabase
                .from('signage_media')
                .delete()
                .eq('id', mediaId)

            if (error) throw error

            toast.success('File eliminato')
            loadMedia()
        } catch (error) {
            console.error('Error deleting media:', error)
            toast.error('Errore durante l\'eliminazione')
        }
    }

    const filteredMedia = media.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div
            className="bg-white rounded-lg shadow-sm p-6"
            style={{
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor
            } as React.CSSProperties}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
                    <p className="text-gray-600 mt-1">Gestisci immagini, video e file per i tuoi display</p>
                </div>

                <label className="media-upload-button">
                    <Upload size={20} />
                    {uploading ? 'Caricamento...' : 'Carica File'}
                    <input
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca file..."
                        className="media-search-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="media-select-input px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="all">Tutti i file</option>
                    <option value="image">Solo immagini</option>
                    <option value="video">Solo video</option>
                    <option value="pdf">Solo PDF</option>
                </select>

                {/* View Mode */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'media-view-button-active' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'media-view-button-active' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Media Grid/List */}
            {loading ? (
                <div className="text-center py-12">Caricamento...</div>
            ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun file trovato</h3>
                    <p className="text-gray-600 mb-4">Carica il tuo primo file per iniziare</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                                selectionMode ? 'media-card-selectable cursor-pointer' : ''
                            }`}
                            onClick={() => selectionMode && onSelectMedia?.(item)}
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                                {item.file_type === 'image' ? (
                                    <img src={item.file_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : item.file_type === 'video' ? (
                                    <>
                                        <Video size={48} className="text-gray-400" />
                                        {item.duration && (
                                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <File size={48} className="text-gray-400" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">{item.name}</h4>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>{formatFileSize(item.file_size)}</span>
                                    {item.width && item.height && (
                                        <span>{item.width}x{item.height}</span>
                                    )}
                                </div>
                                {!selectionMode && (
                                    <button
                                        onClick={() => handleDelete(item.id, item.file_url)}
                                        className="mt-2 w-full flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 py-1 rounded text-xs"
                                    >
                                        <Trash2 size={14} />
                                        Elimina
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {item.file_type === 'image' ? <ImageIcon size={24} className="text-blue-500" /> :
                                 item.file_type === 'video' ? <Video size={24} className="media-video-icon" /> :
                                 <File size={24} className="text-gray-500" />}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-600">
                                    {formatFileSize(item.file_size)}
                                    {item.width && item.height && ` • ${item.width}x${item.height}`}
                                    {item.duration && ` • ${item.duration}s`}
                                </p>
                            </div>

                            {/* Actions */}
                            {!selectionMode && (
                                <button
                                    onClick={() => handleDelete(item.id, item.file_url)}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MediaLibrary
