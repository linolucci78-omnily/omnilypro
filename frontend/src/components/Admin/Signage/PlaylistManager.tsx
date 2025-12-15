import React, { useState, useEffect } from 'react'
import { Play, Plus, Edit2, Trash2, Copy, Star } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

interface Playlist {
    id: string
    name: string
    description: string | null
    is_active: boolean
    is_default: boolean
    loop_enabled: boolean
    shuffle_enabled: boolean
    created_at: string
}

interface PlaylistManagerProps {
    organizationId: string
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({ organizationId }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        loop_enabled: true,
        shuffle_enabled: false
    })

    useEffect(() => {
        loadPlaylists()
    }, [organizationId])

    const loadPlaylists = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('signage_playlists')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPlaylists(data || [])
        } catch (error) {
            console.error('Error loading playlists:', error)
            toast.error('Errore nel caricamento delle playlist')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Inserisci un nome per la playlist')
            return
        }

        try {
            const { error } = await supabase
                .from('signage_playlists')
                .insert({
                    organization_id: organizationId,
                    name: formData.name,
                    description: formData.description || null,
                    loop_enabled: formData.loop_enabled,
                    shuffle_enabled: formData.shuffle_enabled,
                    is_active: true,
                    is_default: playlists.length === 0 // First playlist is default
                })

            if (error) throw error

            toast.success('Playlist creata!')
            setShowCreateModal(false)
            setFormData({ name: '', description: '', loop_enabled: true, shuffle_enabled: false })
            loadPlaylists()
        } catch (error) {
            console.error('Error creating playlist:', error)
            toast.error('Errore durante la creazione')
        }
    }

    const handleUpdate = async () => {
        if (!editingPlaylist) return

        try {
            const { error } = await supabase
                .from('signage_playlists')
                .update({
                    name: formData.name,
                    description: formData.description || null,
                    loop_enabled: formData.loop_enabled,
                    shuffle_enabled: formData.shuffle_enabled
                })
                .eq('id', editingPlaylist.id)

            if (error) throw error

            toast.success('Playlist aggiornata!')
            setEditingPlaylist(null)
            setFormData({ name: '', description: '', loop_enabled: true, shuffle_enabled: false })
            loadPlaylists()
        } catch (error) {
            console.error('Error updating playlist:', error)
            toast.error('Errore durante l\'aggiornamento')
        }
    }

    const handleDelete = async (playlistId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa playlist?')) return

        try {
            const { error } = await supabase
                .from('signage_playlists')
                .delete()
                .eq('id', playlistId)

            if (error) throw error

            toast.success('Playlist eliminata')
            loadPlaylists()
        } catch (error) {
            console.error('Error deleting playlist:', error)
            toast.error('Errore durante l\'eliminazione')
        }
    }

    const handleSetDefault = async (playlistId: string) => {
        try {
            // Remove default from all playlists
            await supabase
                .from('signage_playlists')
                .update({ is_default: false })
                .eq('organization_id', organizationId)

            // Set new default
            const { error } = await supabase
                .from('signage_playlists')
                .update({ is_default: true })
                .eq('id', playlistId)

            if (error) throw error

            toast.success('Playlist predefinita impostata!')
            loadPlaylists()
        } catch (error) {
            console.error('Error setting default:', error)
            toast.error('Errore durante l\'impostazione')
        }
    }

    const handleToggleActive = async (playlistId: string, isActive: boolean) => {
        try {
            const { error } = await supabase
                .from('signage_playlists')
                .update({ is_active: !isActive })
                .eq('id', playlistId)

            if (error) throw error

            toast.success(isActive ? 'Playlist disattivata' : 'Playlist attivata')
            loadPlaylists()
        } catch (error) {
            console.error('Error toggling active:', error)
            toast.error('Errore durante l\'operazione')
        }
    }

    const handleDuplicate = async (playlist: Playlist) => {
        try {
            const { error } = await supabase
                .from('signage_playlists')
                .insert({
                    organization_id: organizationId,
                    name: `${playlist.name} (Copia)`,
                    description: playlist.description,
                    loop_enabled: playlist.loop_enabled,
                    shuffle_enabled: playlist.shuffle_enabled,
                    is_active: false,
                    is_default: false
                })

            if (error) throw error

            toast.success('Playlist duplicata!')
            loadPlaylists()
        } catch (error) {
            console.error('Error duplicating playlist:', error)
            toast.error('Errore durante la duplicazione')
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Playlist</h2>
                    <p className="text-gray-600 mt-1">Crea e gestisci le tue playlist per i display</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuova Playlist
                </button>
            </div>

            {/* Playlists List */}
            {loading ? (
                <div className="text-center py-12">Caricamento...</div>
            ) : playlists.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Play size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna playlist</h3>
                    <p className="text-gray-600 mb-4">Crea la tua prima playlist per iniziare</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            className={`border rounded-lg p-4 ${
                                playlist.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50 opacity-75'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900">{playlist.name}</h3>
                                        {playlist.is_default && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                                <Star size={12} />
                                                Predefinita
                                            </span>
                                        )}
                                        {!playlist.is_active && (
                                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded">
                                                Disattivata
                                            </span>
                                        )}
                                    </div>
                                    {playlist.description && (
                                        <p className="text-gray-600 mt-1">{playlist.description}</p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                        <span>{playlist.loop_enabled ? '🔁 Loop attivo' : '▶️ Singola riproduzione'}</span>
                                        <span>{playlist.shuffle_enabled ? '🔀 Casuale' : '📋 Sequenziale'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingPlaylist(playlist)
                                            setFormData({
                                                name: playlist.name,
                                                description: playlist.description || '',
                                                loop_enabled: playlist.loop_enabled,
                                                shuffle_enabled: playlist.shuffle_enabled
                                            })
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Modifica"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(playlist)}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                                        title="Duplica"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    {!playlist.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(playlist.id)}
                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                                            title="Imposta come predefinita"
                                        >
                                            <Star size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleToggleActive(playlist.id, playlist.is_active)}
                                        className={`px-3 py-1 rounded text-sm font-semibold ${
                                            playlist.is_active
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {playlist.is_active ? 'Attiva' : 'Inattiva'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(playlist.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Elimina"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingPlaylist) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
                    setShowCreateModal(false)
                    setEditingPlaylist(null)
                }}>
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingPlaylist ? 'Modifica Playlist' : 'Nuova Playlist'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="es. Menù Colazione"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Descrizione (opzionale)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrizione playlist..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="loop"
                                    checked={formData.loop_enabled}
                                    onChange={(e) => setFormData({ ...formData, loop_enabled: e.target.checked })}
                                    className="w-5 h-5 text-purple-600"
                                />
                                <label htmlFor="loop" className="text-sm font-medium text-gray-700">
                                    Loop continuo
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="shuffle"
                                    checked={formData.shuffle_enabled}
                                    onChange={(e) => setFormData({ ...formData, shuffle_enabled: e.target.checked })}
                                    className="w-5 h-5 text-purple-600"
                                />
                                <label htmlFor="shuffle" className="text-sm font-medium text-gray-700">
                                    Riproduzione casuale
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={editingPlaylist ? handleUpdate : handleCreate}
                                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                                {editingPlaylist ? 'Aggiorna' : 'Crea Playlist'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setEditingPlaylist(null)
                                    setFormData({ name: '', description: '', loop_enabled: true, shuffle_enabled: false })
                                }}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlaylistManager
