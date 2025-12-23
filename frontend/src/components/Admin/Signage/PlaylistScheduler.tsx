import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Monitor, AlertCircle, Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import toast from 'react-hot-toast'

interface Schedule {
    id?: string
    playlist_id: string
    playlist_name?: string
    device_id?: string
    device_name?: string
    name: string
    start_date?: string
    end_date?: string
    days_of_week?: number[]
    start_time?: string
    end_time?: string
    priority: number
    is_active: boolean
}

interface Playlist {
    id: string
    name: string
    description?: string
}

interface Device {
    id: string
    device_code: string
    location?: string
}

interface PlaylistSchedulerProps {
    organizationId: string
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domenica', short: 'Dom' },
    { value: 1, label: 'Lunedì', short: 'Lun' },
    { value: 2, label: 'Martedì', short: 'Mar' },
    { value: 3, label: 'Mercoledì', short: 'Mer' },
    { value: 4, label: 'Giovedì', short: 'Gio' },
    { value: 5, label: 'Venerdì', short: 'Ven' },
    { value: 6, label: 'Sabato', short: 'Sab' }
]

const PlaylistScheduler: React.FC<PlaylistSchedulerProps> = ({ organizationId }) => {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

    // New schedule form state
    const [newSchedule, setNewSchedule] = useState<Schedule>({
        playlist_id: '',
        name: '',
        priority: 50,
        is_active: true,
        days_of_week: []
    })

    useEffect(() => {
        loadData()
    }, [organizationId])

    const loadData = async () => {
        setLoading(true)
        try {
            // First get all playlists for this org to get their IDs
            const { data: orgPlaylists } = await supabase
                .from('signage_playlists')
                .select('id, name, description, is_default')
                .eq('organization_id', organizationId)
                .order('name')

            const playlistIds = orgPlaylists?.map(p => p.id) || []

            // Load devices first (we'll match them manually)
            const { data: devicesData, error: devicesError } = await supabase
                .from('tv_devices')
                .select('id, device_code, location')
                .eq('organization_id', organizationId)

            if (devicesError) {
                console.error('Error loading devices:', devicesError)
            }

            // Create device lookup map
            const deviceMap = new Map(devicesData?.map(d => [d.id, d]) || [])
            // Create playlist lookup map
            const playlistMap = new Map(orgPlaylists?.map(p => [p.id, p]) || [])

            // Load schedules for these playlists (simpler query without joins)
            const { data: schedulesData, error: schedulesError } = await supabase
                .from('signage_schedules')
                .select('*')
                .in('playlist_id', playlistIds.length > 0 ? playlistIds : ['00000000-0000-0000-0000-000000000000'])
                .order('priority', { ascending: false })

            if (schedulesError) {
                console.error('Error loading schedules:', schedulesError)
                throw schedulesError
            }

            // Format schedules with manual lookups
            const formatted = schedulesData?.map(s => ({
                id: s.id,
                playlist_id: s.playlist_id,
                playlist_name: playlistMap.get(s.playlist_id)?.name,
                device_id: s.device_id,
                device_name: s.device_id ? deviceMap.get(s.device_id)?.device_code : undefined,
                name: s.name,
                start_date: s.start_date,
                end_date: s.end_date,
                days_of_week: s.days_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                priority: s.priority,
                is_active: s.is_active
            })) || []

            setSchedules(formatted)

            // Set playlists (only custom, not default fidelity)
            const customPlaylists = orgPlaylists?.filter(p => !p.is_default) || []
            setPlaylists(customPlaylists)

            // Set devices (already loaded above)
            setDevices(devicesData || [])

        } catch (error) {
            console.error('Error loading scheduler data:', error)
            toast.error('Errore nel caricamento dei dati')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSchedule = async () => {
        if (!newSchedule.playlist_id) {
            toast.error('Seleziona una playlist')
            return
        }
        if (!newSchedule.name) {
            toast.error('Inserisci un nome per lo schedule')
            return
        }

        try {
            const scheduleData = {
                playlist_id: newSchedule.playlist_id,
                device_id: newSchedule.device_id || null,
                name: newSchedule.name,
                start_date: newSchedule.start_date || null,
                end_date: newSchedule.end_date || null,
                days_of_week: newSchedule.days_of_week?.length ? newSchedule.days_of_week : null,
                start_time: newSchedule.start_time || null,
                end_time: newSchedule.end_time || null,
                priority: newSchedule.priority,
                is_active: newSchedule.is_active
            }

            if (editingSchedule?.id) {
                // Update existing
                const { error } = await supabase
                    .from('signage_schedules')
                    .update(scheduleData)
                    .eq('id', editingSchedule.id)

                if (error) throw error
                toast.success('Schedule aggiornato!')
            } else {
                // Insert new
                const { error } = await supabase
                    .from('signage_schedules')
                    .insert([scheduleData])

                if (error) throw error
                toast.success('Schedule creato!')
            }

            // Reset form
            setNewSchedule({
                playlist_id: '',
                name: '',
                priority: 50,
                is_active: true,
                days_of_week: []
            })
            setShowAddForm(false)
            setEditingSchedule(null)
            loadData()

        } catch (error) {
            console.error('Error saving schedule:', error)
            toast.error('Errore nel salvataggio')
        }
    }

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo schedule?')) return

        try {
            const { error } = await supabase
                .from('signage_schedules')
                .delete()
                .eq('id', scheduleId)

            if (error) throw error
            toast.success('Schedule eliminato!')
            loadData()
        } catch (error) {
            console.error('Error deleting schedule:', error)
            toast.error('Errore nell\'eliminazione')
        }
    }

    const toggleDay = (day: number) => {
        const current = newSchedule.days_of_week || []
        if (current.includes(day)) {
            setNewSchedule({
                ...newSchedule,
                days_of_week: current.filter(d => d !== day)
            })
        } else {
            setNewSchedule({
                ...newSchedule,
                days_of_week: [...current, day].sort()
            })
        }
    }

    const formatDaysOfWeek = (days?: number[]) => {
        if (!days || days.length === 0) return 'Tutti i giorni'
        if (days.length === 7) return 'Tutti i giorni'
        return days.map(d => DAYS_OF_WEEK[d].short).join(', ')
    }

    if (loading) {
        return <div className="p-6 text-center">Caricamento...</div>
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Programmazione Playlist</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Programma quando mostrare le playlist custom. Le slide fidelity sono sempre attive.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    <Plus size={20} />
                    Nuovo Schedule
                </button>
            </div>

            {/* Info Alert */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                    <strong>Nota:</strong> Le slide fidelity (Leaderboard, Rewards, ecc.) sono sempre presenti in tutte le playlist.
                    Qui puoi programmare quando aggiungere le tue slide custom (es: Menu colazione 7-11, Promo Natale, ecc.)
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold mb-4">
                        {editingSchedule ? 'Modifica Schedule' : 'Nuovo Schedule'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Nome */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Schedule *
                            </label>
                            <input
                                type="text"
                                value={newSchedule.name}
                                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                                placeholder="es: Menu Colazione, Promo Natale"
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            />
                        </div>

                        {/* Playlist */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Playlist Custom *
                            </label>
                            <select
                                value={newSchedule.playlist_id}
                                onChange={(e) => setNewSchedule({ ...newSchedule, playlist_id: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            >
                                <option value="">Seleziona playlist...</option>
                                {playlists.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Device (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Monitor size={16} className="inline mr-1" />
                                Device (opzionale)
                            </label>
                            <select
                                value={newSchedule.device_id || ''}
                                onChange={(e) => setNewSchedule({ ...newSchedule, device_id: e.target.value || undefined })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            >
                                <option value="">Tutti i dispositivi</option>
                                {devices.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.device_code} {d.location ? `- ${d.location}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                Data Inizio
                            </label>
                            <input
                                type="date"
                                value={newSchedule.start_date || ''}
                                onChange={(e) => setNewSchedule({ ...newSchedule, start_date: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                Data Fine
                            </label>
                            <input
                                type="date"
                                value={newSchedule.end_date || ''}
                                onChange={(e) => setNewSchedule({ ...newSchedule, end_date: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            />
                        </div>

                        {/* Time Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={16} className="inline mr-1" />
                                Ora Inizio
                            </label>
                            <input
                                type="time"
                                value={newSchedule.start_time || ''}
                                onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={16} className="inline mr-1" />
                                Ora Fine
                            </label>
                            <input
                                type="time"
                                value={newSchedule.end_time || ''}
                                onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            />
                        </div>

                        {/* Days of Week */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giorni della Settimana
                            </label>
                            <div className="flex gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            newSchedule.days_of_week?.includes(day.value)
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {day.short}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Lascia vuoto per tutti i giorni
                            </p>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priorità (0-100)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={newSchedule.priority}
                                onChange={(e) => setNewSchedule({ ...newSchedule, priority: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Priorità più alta vince in caso di sovrapposizione
                            </p>
                        </div>

                        {/* Active */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newSchedule.is_active}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, is_active: e.target.checked })}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Attivo</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleSaveSchedule}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Save size={20} />
                            Salva Schedule
                        </button>
                        <button
                            onClick={() => {
                                setShowAddForm(false)
                                setEditingSchedule(null)
                                setNewSchedule({
                                    playlist_id: '',
                                    name: '',
                                    priority: 50,
                                    is_active: true,
                                    days_of_week: []
                                })
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            )}

            {/* Schedules List */}
            <div className="space-y-4">
                {schedules.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">Nessuno schedule programmato</p>
                        <p className="text-sm text-gray-500">Crea uno schedule per programmare le tue playlist custom</p>
                    </div>
                ) : (
                    schedules.map(schedule => (
                        <div
                            key={schedule.id}
                            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-lg">{schedule.name}</h4>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            schedule.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {schedule.is_active ? 'Attivo' : 'Inattivo'}
                                        </span>
                                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                            Priorità: {schedule.priority}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Playlist:</span>{' '}
                                            <span className="font-medium">{schedule.playlist_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Giorni:</span>{' '}
                                            <span className="font-medium">{formatDaysOfWeek(schedule.days_of_week)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Orario:</span>{' '}
                                            <span className="font-medium">
                                                {schedule.start_time && schedule.end_time
                                                    ? `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`
                                                    : 'Tutto il giorno'}
                                            </span>
                                        </div>
                                        {(schedule.start_date || schedule.end_date) && (
                                            <div>
                                                <span className="text-gray-600">Periodo:</span>{' '}
                                                <span className="font-medium">
                                                    {schedule.start_date || '...'} → {schedule.end_date || '...'}
                                                </span>
                                            </div>
                                        )}
                                        {schedule.device_name && (
                                            <div>
                                                <span className="text-gray-600">Device:</span>{' '}
                                                <span className="font-medium">{schedule.device_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingSchedule(schedule)
                                            setNewSchedule(schedule)
                                            setShowAddForm(true)
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Modifica"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => schedule.id && handleDeleteSchedule(schedule.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Elimina"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default PlaylistScheduler
