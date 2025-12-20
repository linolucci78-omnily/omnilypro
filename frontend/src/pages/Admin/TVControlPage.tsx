import React, { useState, useEffect } from 'react'
import { Tv, Save, Play, Square, Image as ImageIcon, MessageSquare, Ticket, Layout, Monitor, Gift, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import LiveTVLayout from '../../components/TV/LiveTVLayout'
import LeaderboardSlide from '../../components/TV/LeaderboardSlide'
import RewardsSlide from '../../components/TV/RewardsSlide'
import GetCardSlide from '../../components/TV/GetCardSlide'
import LotterySlide from '../../components/TV/LotterySlide'
import ActivityFeedSlide from '../../components/TV/ActivityFeedSlide'
import HowItWorksSlide from '../../components/TV/HowItWorksSlide'
import TVDevicesManager from '../../components/Admin/TVDevicesManager'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { tvService, Customer, Reward } from '../../services/tvService'

// MOCK DATA (In real app, fetch from Supabase)
const INITIAL_CONFIG = {
    active_slides: {
        leaderboard: true,
        rewards: true,
        lottery: true,
        promo: true,
        activity: true,
        howto: false
    },
    ticker_text: "Benvenuto nel Club esclusivo • Scarica l'App per accumulare punti",
    ticker_speed: 30, // secondi per completare uno scorrimento
    lottery_name: "Lotteria Settimanale",
    jackpot: 15400,
    lottery_prize: "Weekend da Sogno",
    lottery_prize_image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=200&q=80",
    lottery_draw_date: "2024-12-31",
    lottery_last_winner: "Mario R.",
    lottery_last_prize: "5.000 Punti",
    rewards: [
        { id: 1, title: "Pizza Margherita", points: 500, tier: "Base" },
        { id: 2, title: "Caffè Speciale", points: 150, tier: "Base" },
        { id: 3, title: "T-Shirt VIP", points: 1200, tier: "Gold" }
    ],
    background_image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    background_opacity: 100, // Always 100% - image fully visible
    overlay_color: '#000000',
    overlay_opacity: 30, // Overlay darkness on top of image
    rewards_count: 3, // Number of random rewards to display
    weather_city: "Rome", // City for weather widget
    slide_duration: 8 // Durata in secondi per ogni slide (default 8s)
}

const TVControlPage: React.FC = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'config' | 'devices'>('config')
    const [config, setConfig] = useState(INITIAL_CONFIG)
    const [saving, setSaving] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [previewSlideIndex, setPreviewSlideIndex] = React.useState(0)
    const [userOrgId, setUserOrgId] = useState<string | null>(null)
    const [topCustomers, setTopCustomers] = useState<Customer[]>([])
    const [rewards, setRewards] = useState<Reward[]>([])
    const [pointsName, setPointsName] = useState<string>('PUNTI')
    const [lastWinnerGender, setLastWinnerGender] = useState<'male' | 'female' | undefined>(undefined)

    // Load saved configuration on mount
    useEffect(() => {
        const stored = localStorage.getItem('tv_config_simulation')
        if (stored) {
            try {
                const savedConfig = JSON.parse(stored)
                setConfig(prev => ({ ...prev, ...savedConfig }))
                console.log('Loaded saved config:', savedConfig)
            } catch (err) {
                console.error('Error loading saved config:', err)
            }
        }
    }, [])

    // Fetch user's organization ID
    useEffect(() => {
        const fetchUserOrganization = async () => {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('organization_users')
                    .select('org_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single()

                if (error) {
                    console.error('Error fetching user organization:', error)
                    return
                }

                if (data?.org_id) {
                    console.log('Admin panel - Found user org_id:', data.org_id)
                    setUserOrgId(data.org_id)
                }
            } catch (err) {
                console.error('Error in fetchUserOrganization:', err)
            }
        }

        fetchUserOrganization()
    }, [user])

    // Load real data from Supabase
    useEffect(() => {
        const loadData = async () => {
            if (!userOrgId) {
                console.log('No orgId yet, skipping data load')
                return
            }

            try {
                console.log('Loading TV data for preview, org:', userOrgId)

                // Load organization info, top customers and rewards in parallel
                const [orgInfo, customersData, rewardsData] = await Promise.all([
                    supabase
                        .from('organizations')
                        .select('points_name')
                        .eq('id', userOrgId)
                        .single(),
                    tvService.getTopCustomers(userOrgId, 5),
                    tvService.getRewards(userOrgId, config.rewards_count)
                ])

                console.log('Admin preview - Loaded customers:', customersData)
                console.log('Admin preview - Loaded rewards:', rewardsData)

                // Update points name from organization
                if (orgInfo.data?.points_name) {
                    setPointsName(orgInfo.data.points_name.toUpperCase())
                }

                setTopCustomers(customersData)
                setRewards(rewardsData)

                // Load lottery data from database
                await loadLotteryData()
            } catch (error) {
                console.error('Error loading preview data:', error)
            }
        }

        loadData()
        // Refresh data every 30 seconds like the live page
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [userOrgId, config.rewards_count])

    // Load lottery data (jackpot and last winner) from database
    const loadLotteryData = async () => {
        if (!userOrgId) return

        try {
            // 1. Load active lottery event for this organization
            const { data: events, error: eventsError } = await supabase
                .from('lottery_events')
                .select('id, total_revenue, total_tickets_sold')
                .eq('organization_id', userOrgId)
                .eq('status', 'active')
                .order('extraction_date', { ascending: true })
                .limit(1)

            if (eventsError) {
                console.error('Error loading lottery events:', eventsError)
                return
            }

            if (events && events.length > 0) {
                const event = events[0]

                // Calculate jackpot from total revenue (or could be ticket count * multiplier)
                const calculatedJackpot = Math.round((event.total_revenue || 0) * 1.5) // Example: 150% of revenue

                // Update config with calculated jackpot
                setConfig(prev => ({
                    ...prev,
                    jackpot: calculatedJackpot > 0 ? calculatedJackpot : prev.jackpot
                }))

                // 2. Load most recent winner from extractions with ticket details
                const { data: extractions, error: extractionsError } = await supabase
                    .from('lottery_extractions')
                    .select(`
                        winner_customer_name,
                        winning_ticket_id,
                        created_at
                    `)
                    .eq('organization_id', userOrgId)
                    .order('created_at', { ascending: false })
                    .limit(1)

                if (extractionsError) {
                    console.error('Error loading extractions:', extractionsError)
                    return
                }

                if (extractions && extractions.length > 0) {
                    const lastWinner = extractions[0]

                    // Try to get more details from the ticket
                    if (lastWinner.winning_ticket_id) {
                        const { data: ticketData, error: ticketError } = await supabase
                            .from('lottery_tickets')
                            .select('customer_name, customer_id, prize_rank')
                            .eq('id', lastWinner.winning_ticket_id)
                            .single()

                        if (!ticketError && ticketData) {
                            // If ticket has customer_id, try to get full customer details
                            if (ticketData.customer_id) {
                                const { data: customerData, error: customerError } = await supabase
                                    .from('customers')
                                    .select('first_name, last_name, name, gender')
                                    .eq('id', ticketData.customer_id)
                                    .single()

                                if (!customerError && customerData) {
                                    // Use full customer name from customers table
                                    const fullName = customerData.name ||
                                                   `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim()

                                    setConfig(prev => ({
                                        ...prev,
                                        lottery_last_winner: fullName || lastWinner.winner_customer_name
                                    }))

                                    // Set gender for avatar
                                    setLastWinnerGender(customerData.gender as 'male' | 'female' | undefined)
                                } else {
                                    // Use name from ticket
                                    setConfig(prev => ({
                                        ...prev,
                                        lottery_last_winner: ticketData.customer_name || lastWinner.winner_customer_name
                                    }))
                                }
                            } else {
                                // Use name from ticket (no customer_id)
                                setConfig(prev => ({
                                    ...prev,
                                    lottery_last_winner: ticketData.customer_name || lastWinner.winner_customer_name
                                }))
                            }
                        }
                    } else {
                        // Fallback to extraction's winner_customer_name
                        setConfig(prev => ({
                            ...prev,
                            lottery_last_winner: lastWinner.winner_customer_name
                        }))
                    }

                    console.log('Loaded lottery data:', {
                        jackpot: calculatedJackpot,
                        lastWinner: lastWinner.winner_customer_name
                    })
                }
            }
        } catch (error) {
            console.error('Error loading lottery data:', error)
        }
    }

    // Rotate slides in preview every 8 seconds (like live TV)
    React.useEffect(() => {
        const timer = setInterval(() => {
            setPreviewSlideIndex(prev => (prev + 1) % 6)
        }, 8000)
        return () => clearInterval(timer)
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            if (!userOrgId) {
                toast.error("Errore: ID organizzazione mancante")
                return
            }

            console.log('💾 Salvando configurazione TV per org:', userOrgId)

            // Salva su Supabase per sincronizzazione real-time con i display
            const { data, error } = await supabase
                .from('tv_configurations')
                .upsert({
                    organization_id: userOrgId,
                    background_image: config.background_image,
                    background_opacity: config.background_opacity,
                    overlay_color: config.overlay_color,
                    overlay_opacity: config.overlay_opacity,
                    ticker_text: config.ticker_text,
                    ticker_speed: config.ticker_speed,
                    rewards_count: config.rewards_count,
                    weather_city: config.weather_city,
                    lottery_name: config.lottery_name,
                    lottery_prize: config.lottery_prize,
                    lottery_prize_image: config.lottery_prize_image,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'organization_id'
                })
                .select()

            console.log('💾 Risultato salvataggio:', { data, error })

            if (error) throw error

            // Mantieni anche localStorage per compatibilità (opzionale)
            localStorage.setItem('tv_config_simulation', JSON.stringify(config))

            toast.success('Configurazione salvata con successo')
        } catch (error) {
            console.error("❌ Errore nel salvataggio:", error)
            toast.error("Errore nel salvataggio: " + (error as Error).message)
        } finally {
            setSaving(false)
        }
    }

    const handleOpenMonitor = () => {
        // Open live TV page in new window with real organization ID
        const orgId = userOrgId || 'demo'
        window.open(`/tv/${orgId}/live`, '_blank', 'width=1920,height=1080')
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                            <Tv className="text-orange-600" size={32} />
                            Regia TV Live
                        </h1>
                        <p className="text-slate-500 mt-2">Gestisci i contenuti del Digital Signage in tempo reale</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleOpenMonitor}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <Monitor size={20} />
                            Apri Monitor
                        </button>
                        {activeTab === 'config' && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                <Save size={20} />
                                {saving ? 'Salvataggio...' : 'Pubblica Modifiche'}
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'config'
                                ? 'text-orange-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Layout size={20} />
                            Configurazione
                        </div>
                        {activeTab === 'config' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'devices'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Smartphone size={20} />
                            Dispositivi TV
                        </div>
                        {activeTab === 'devices' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                        )}
                    </button>
                </div>
            </header>

            {/* TAB CONTENT: Configurazione */}
            {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* SETTINGS COLUMN */}
                    <div className="lg:col-span-2 space-y-6">

                    {/* 1. PALINSESTO (Schedule) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                            <Layout size={24} className="text-blue-500" />
                            Palinsesto Slide
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(config.active_slides).map(([key, isActive]) => (
                                <div
                                    key={key}
                                    onClick={() => setConfig(prev => ({
                                        ...prev,
                                        active_slides: { ...prev.active_slides, [key]: !isActive }
                                    }))}
                                    className={`
                                        cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between
                                        ${isActive ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50 grayscale'}
                                    `}
                                >
                                    <span className="font-semibold capitalize text-slate-700">{key}</span>
                                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. TICKER (Messages) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                            <MessageSquare size={24} className="text-purple-500" />
                            Striscia Notizie (Ticker)
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-2">Testo del Ticker</label>
                                <textarea
                                    value={config.ticker_text}
                                    onChange={(e) => setConfig({ ...config, ticker_text: e.target.value })}
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm bg-white"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold text-slate-500">Velocità Scorrimento Ticker</label>
                                    <span className="text-sm font-bold text-slate-700">{config.ticker_speed}s</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="60"
                                    value={config.ticker_speed}
                                    onChange={(e) => setConfig({ ...config, ticker_speed: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>Veloce (10s)</span>
                                    <span>Lento (60s)</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Tempo in secondi per completare uno scorrimento completo del ticker.
                                </p>
                            </div>

                            {/* Slide Duration Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold text-slate-500">Durata Slide</label>
                                    <span className="text-sm font-bold text-slate-700">{config.slide_duration}s</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    value={config.slide_duration}
                                    onChange={(e) => setConfig({ ...config, slide_duration: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>Rapide (5s)</span>
                                    <span>Lente (30s)</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Quanto tempo rimane visibile ogni slide prima di cambiare.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2a. REWARDS & WEATHER SETTINGS */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                            <Gift size={24} className="text-green-500" />
                            Impostazioni Premi & Meteo
                        </h2>
                        <div className="space-y-6">
                            {/* Rewards Count */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-2">
                                    Numero di Premi da Mostrare (Random)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        value={config.rewards_count}
                                        onChange={(e) => setConfig({ ...config, rewards_count: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    />
                                    <span className="text-2xl font-bold text-green-600 min-w-[40px] text-center">
                                        {config.rewards_count}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    I premi verranno selezionati casualmente ad ogni refresh per mostrare varietà.
                                </p>
                            </div>

                            {/* Weather City */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-2">
                                    Città per Widget Meteo
                                </label>
                                <input
                                    type="text"
                                    value={config.weather_city}
                                    onChange={(e) => setConfig({ ...config, weather_city: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                    placeholder="es. Milan, Rome, Naples..."
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    Inserisci il nome della città in inglese per il meteo nell'header.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2b. BACKGROUND IMAGE & OPACITY */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                            <ImageIcon size={24} className="text-pink-500" />
                            Immagine di Sfondo (Atmosfera)
                        </h2>

                        <div className="flex flex-col gap-6">
                            {/* Image Input */}
                            <div className="flex gap-4">
                                <img
                                    src={config.background_image}
                                    alt="Current Background"
                                    className="w-32 h-20 object-cover rounded-lg border-2 border-slate-200"
                                />
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-500 mb-1">URL Immagine</label>
                                    <input
                                        type="text"
                                        value={config.background_image}
                                        onChange={(e) => setConfig({ ...config, background_image: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white"
                                        placeholder="https://..."
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Usa un URL pubblico di un'immagine ad alta risoluzione (es. Unsplash)</p>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="h-px bg-slate-100 my-4"></div>

                            {/* OVERLAY CONTROLS */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Overlay Scuro</h3>
                                <div className="grid grid-cols-2 gap-6">
                                {/* Overlay Color */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-2">Colore Overlay</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={config.overlay_color}
                                            onChange={(e) => setConfig({ ...config, overlay_color: e.target.value })}
                                            className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer p-1"
                                        />
                                        <span className="text-sm font-mono text-slate-600 uppercase">{config.overlay_color}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Colore dell'overlay sopra l'immagine</p>
                                </div>

                                {/* Overlay Opacity */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-slate-500">Intensità Overlay</label>
                                        <span className="text-sm font-bold text-slate-700">{config.overlay_opacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={config.overlay_opacity}
                                        onChange={(e) => setConfig({ ...config, overlay_opacity: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>Trasparente (0%)</span>
                                        <span>Opaco (100%)</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Quanto scuro appare l'overlay</p>
                                </div>
                            </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. LOTTERY JACKPOT */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                            <Ticket size={24} className="text-yellow-500" />
                            Lotteria & Jackpot
                        </h2>
                        <div className="space-y-4">
                            {/* Row 0: Lottery Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">Nome della Lotteria</label>
                                <input
                                    type="text"
                                    value={config.lottery_name}
                                    onChange={(e) => setConfig({ ...config, lottery_name: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl text-lg font-semibold bg-white"
                                    placeholder="es. Lotteria Settimanale, Estrazione di Natale..."
                                />
                                <p className="text-xs text-slate-400 mt-1">Il titolo principale visualizzato nella slide lotteria</p>
                            </div>

                            {/* Row 1: Jackpot and Prize Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1">
                                        Montepremi Attuale (Punti)
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Auto-caricato</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={config.jackpot}
                                        readOnly
                                        className="w-full p-3 border border-slate-200 rounded-xl text-2xl font-bold text-orange-600 bg-slate-50 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Calcolato automaticamente dalla lotteria attiva (150% del fatturato biglietti)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1">Nome del Super Premio</label>
                                    <input
                                        type="text"
                                        value={config.lottery_prize}
                                        onChange={(e) => setConfig({ ...config, lottery_prize: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-lg font-semibold bg-white"
                                        placeholder="es. iPhone 15 Pro, Weekend a Parigi..."
                                    />
                                </div>
                            </div>

                            {/* Row 2: Prize Image */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-2">Immagine Super Premio</label>
                                <div className="flex gap-4">
                                    {config.lottery_prize_image && (
                                        <img
                                            src={config.lottery_prize_image}
                                            alt="Prize"
                                            className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    // Convert to base64 for preview and storage
                                                    const reader = new FileReader()
                                                    reader.onloadend = () => {
                                                        setConfig({ ...config, lottery_prize_image: reader.result as string })
                                                    }
                                                    reader.readAsDataURL(file)
                                                }
                                            }}
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Carica un'immagine del premio (JPEG, PNG, max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Draw Date */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">Data Prossima Estrazione</label>
                                <input
                                    type="date"
                                    value={config.lottery_draw_date}
                                    onChange={(e) => setConfig({ ...config, lottery_draw_date: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                                />
                                <p className="text-xs text-slate-400 mt-1">Verrà mostrato il countdown fino a questa data</p>
                            </div>

                            {/* Row 4: Last Winner Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1">
                                        Ultimo Vincitore
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Auto-caricato</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={config.lottery_last_winner}
                                        readOnly
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 cursor-not-allowed"
                                        placeholder="Nessun vincitore ancora"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Caricato dall'ultima estrazione</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1">Premio Vinto</label>
                                    <input
                                        type="text"
                                        value={config.lottery_last_prize}
                                        onChange={(e) => setConfig({ ...config, lottery_last_prize: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                                        placeholder="es. 5.000 Punti"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* PREVIEW COLUMN */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
                                <Play size={24} className="text-red-500" />
                                Anteprima Live
                            </h2>
                            <button
                                onClick={() => setIsFullscreen(true)}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                <Square size={16} />
                                Schermo Pieno
                            </button>
                        </div>

                        <div
                            className="bg-black rounded-xl overflow-hidden shadow-2xl relative"
                            style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                position: 'relative'
                            }}
                        >
                            <LiveTVLayout
                                organization={{
                                    ...config,
                                    name: "Anteprima Live",
                                }}
                                backgroundImage={config.background_image}
                                backgroundOpacity={config.background_opacity}
                                overlayColor={config.overlay_color}
                                overlayOpacity={config.overlay_opacity}
                                isPreview={true}
                                tickerSpeed={config.ticker_speed}
                            >
                                {previewSlideIndex === 0 ? <LeaderboardSlide customers={topCustomers} pointsName={pointsName} /> :
                                    previewSlideIndex === 1 ? <RewardsSlide rewards={rewards} /> :
                                        previewSlideIndex === 2 ? <GetCardSlide /> :
                                            previewSlideIndex === 3 ? <HowItWorksSlide pointsName={pointsName} /> :
                                                previewSlideIndex === 4 ? <ActivityFeedSlide /> :
                                                    <LotterySlide
                                                        lotteryName={config.lottery_name}
                                                        jackpot={config.jackpot}
                                                        prizeName={config.lottery_prize}
                                                        prizeImage={config.lottery_prize_image}
                                                        lastWinner={config.lottery_last_winner}
                                                        lastPrize={config.lottery_last_prize}
                                                        drawDate={config.lottery_draw_date}
                                                        pointsName={pointsName}
                                                        lastWinnerGender={lastWinnerGender}
                                                    />
                                }
                            </LiveTVLayout>

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                                <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg backdrop-blur">
                                    Anteprima Tempo Reale
                                </span>
                            </div>
                        </div>
                        <p className="text-center text-sm text-slate-400 mt-2">
                            L'anteprima riflette esattamente ciò che si vede sulla TV (1920x1080).
                        </p>
                    </div>
                </div>

            </div>
            )}

            {/* TAB CONTENT: Dispositivi TV */}
            {activeTab === 'devices' && userOrgId && (
                <div className="mt-6">
                    <TVDevicesManager organizationId={userOrgId} />
                </div>
            )}

            {/* FULLSCREEN PREVIEW MODAL */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm z-50 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div className="w-full h-full flex items-center justify-center p-8">
                        <div className="w-full h-full max-w-[90vw] max-h-[90vh]" style={{ aspectRatio: '16/9' }}>
                            <LiveTVLayout
                                organization={{
                                    ...config,
                                    name: "Anteprima Live - Schermo Pieno",
                                }}
                                backgroundImage={config.background_image}
                                backgroundOpacity={config.background_opacity}
                                overlayColor={config.overlay_color}
                                overlayOpacity={config.overlay_opacity}
                                isPreview={true}
                                tickerSpeed={config.ticker_speed}
                            >
                                {previewSlideIndex === 0 ? <LeaderboardSlide customers={topCustomers} pointsName={pointsName} /> :
                                    previewSlideIndex === 1 ? <RewardsSlide rewards={rewards} /> :
                                        previewSlideIndex === 2 ? <GetCardSlide /> :
                                            previewSlideIndex === 3 ? <HowItWorksSlide pointsName={pointsName} /> :
                                                previewSlideIndex === 4 ? <ActivityFeedSlide /> :
                                                    <LotterySlide
                                                        lotteryName={config.lottery_name}
                                                        jackpot={config.jackpot}
                                                        prizeName={config.lottery_prize}
                                                        prizeImage={config.lottery_prize_image}
                                                        lastWinner={config.lottery_last_winner}
                                                        lastPrize={config.lottery_last_prize}
                                                        drawDate={config.lottery_draw_date}
                                                        pointsName={pointsName}
                                                        lastWinnerGender={lastWinnerGender}
                                                    />
                                }
                            </LiveTVLayout>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TVControlPage
