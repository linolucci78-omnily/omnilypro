import React, { useState, useEffect } from 'react'
import { Tv, Plus, Trash2, Check, X, Wifi, WifiOff, Edit2, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface TVDevice {
    id: string
    device_code: string
    device_name: string | null
    status: 'pending' | 'active' | 'inactive'
    last_seen: string | null
    paired_at: string | null
    created_at: string
}

interface TVDevicesManagerProps {
    organizationId: string
}

const TVDevicesManager: React.FC<TVDevicesManagerProps> = ({ organizationId }) => {
    const [devices, setDevices] = useState<TVDevice[]>([])
    const [loading, setLoading] = useState(true)
    const [showPairModal, setShowPairModal] = useState(false)
    const [pairingCode, setPairingCode] = useState('')
    const [deviceName, setDeviceName] = useState('')
    const [pairing, setPairing] = useState(false)
    const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    useEffect(() => {
        loadDevices()
        // Refresh devices every 30 seconds to update online status
        const interval = setInterval(loadDevices, 30000)
        return () => clearInterval(interval)
    }, [organizationId])

    const loadDevices = async () => {
        try {
            const { data, error } = await supabase
                .from('tv_devices')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDevices(data || [])
        } catch (error) {
            console.error('Error loading devices:', error)
            toast.error('Errore nel caricamento dei dispositivi')
        } finally {
            setLoading(false)
        }
    }

    const handlePairDevice = async () => {
        if (!pairingCode.trim()) {
            toast.error('Inserisci il codice del dispositivo')
            return
        }

        setPairing(true)
        try {
            const { data, error } = await supabase.rpc('pair_device', {
                p_device_code: pairingCode.trim().toUpperCase(),
                p_organization_id: organizationId,
                p_device_name: deviceName.trim() || 'TV Display'
            })

            if (error) throw error

            if (data) {
                toast.success('Dispositivo associato con successo!')
                setShowPairModal(false)
                setPairingCode('')
                setDeviceName('')
                loadDevices()
            } else {
                toast.error('Codice non valido o già utilizzato')
            }
        } catch (error) {
            console.error('Error pairing device:', error)
            toast.error('Errore durante l\'associazione')
        } finally {
            setPairing(false)
        }
    }

    const handleDeleteDevice = async (deviceId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo dispositivo?')) return

        try {
            const { error } = await supabase
                .from('tv_devices')
                .delete()
                .eq('id', deviceId)

            if (error) throw error

            toast.success('Dispositivo eliminato')
            loadDevices()
        } catch (error) {
            console.error('Error deleting device:', error)
            toast.error('Errore durante l\'eliminazione')
        }
    }

    const handleUpdateName = async (deviceId: string) => {
        if (!editName.trim()) {
            toast.error('Inserisci un nome valido')
            return
        }

        try {
            const { error } = await supabase
                .from('tv_devices')
                .update({ device_name: editName.trim() })
                .eq('id', deviceId)

            if (error) throw error

            toast.success('Nome aggiornato')
            setEditingDeviceId(null)
            setEditName('')
            loadDevices()
        } catch (error) {
            console.error('Error updating device name:', error)
            toast.error('Errore durante l\'aggiornamento')
        }
    }

    const isOnline = (lastSeen: string | null) => {
        if (!lastSeen) return false
        const lastSeenDate = new Date(lastSeen)
        const now = new Date()
        const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60
        return diffMinutes < 2 // Online if seen in last 2 minutes
    }

    const formatLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return 'Mai visto'
        const date = new Date(lastSeen)
        const now = new Date()
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)

        if (diffMinutes < 1) return 'Adesso'
        if (diffMinutes < 60) return `${diffMinutes} minuti fa`
        const diffHours = Math.floor(diffMinutes / 60)
        if (diffHours < 24) return `${diffHours} ore fa`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} giorni fa`
    }

    if (loading) {
        return <div className="text-center py-8">Caricamento...</div>
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Display TV</h2>
                    <p className="text-gray-600 mt-1">Gestisci i display TV associati alla tua organizzazione</p>
                </div>
                <button
                    onClick={() => setShowPairModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus size={20} />
                    Associa Display
                </button>
            </div>

            {devices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Tv size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun display associato</h3>
                    <p className="text-gray-600 mb-4">Clicca su "Associa Display" per aggiungere il tuo primo display TV</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {devices.map((device) => {
                        const online = isOnline(device.last_seen)
                        const isEditing = editingDeviceId === device.id

                        return (
                            <div key={device.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-3 rounded-lg ${online ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <Tv size={24} className={online ? 'text-green-600' : 'text-gray-400'} />
                                        </div>

                                        <div className="flex-1">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="border border-gray-300 rounded px-3 py-1 text-lg font-semibold"
                                                        placeholder="Nome display"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateName(device.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingDeviceId(null)
                                                            setEditName('')
                                                        }}
                                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {device.device_name || 'TV Display'}
                                                    </h3>
                                                    <button
                                                        onClick={() => {
                                                            setEditingDeviceId(device.id)
                                                            setEditName(device.device_name || '')
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {device.device_code}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {online ? (
                                                        <>
                                                            <Wifi size={14} className="text-green-600" />
                                                            <span className="text-green-600 font-semibold">Online</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <WifiOff size={14} className="text-gray-400" />
                                                            <span className="text-gray-400">Offline</span>
                                                        </>
                                                    )}
                                                </div>
                                                <span>Ultima connessione: {formatLastSeen(device.last_seen)}</span>
                                            </div>

                                            {device.paired_at && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Associato il {new Date(device.paired_at).toLocaleDateString('it-IT', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteDevice(device.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pairing Modal */}
            {showPairModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPairModal(false)}>
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Associa Nuovo Display</h3>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Codice Display
                            </label>
                            <input
                                type="text"
                                value={pairingCode}
                                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                placeholder="es. ABC-123"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono uppercase focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                maxLength={7}
                            />
                            <p className="text-sm text-gray-600 mt-2">
                                Inserisci il codice visualizzato sul display TV
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nome Display (Opzionale)
                            </label>
                            <input
                                type="text"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                placeholder="es. Display Ingresso"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePairDevice}
                                disabled={pairing || !pairingCode.trim()}
                                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {pairing ? 'Associazione...' : 'Associa Display'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowPairModal(false)
                                    setPairingCode('')
                                    setDeviceName('')
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

export default TVDevicesManager
