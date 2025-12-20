import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import LiveTVLayout from '../../components/TV/LiveTVLayout'
import LeaderboardSlide from '../../components/TV/LeaderboardSlide'
import WelcomeInterrupt from '../../components/TV/WelcomeInterrupt'
import GetCardSlide from '../../components/TV/GetCardSlide'
import LotterySlide from '../../components/TV/LotterySlide'
import ActivityFeedSlide from '../../components/TV/ActivityFeedSlide'
import HowItWorksSlide from '../../components/TV/HowItWorksSlide'
import RewardsSlide from '../../components/TV/RewardsSlide'
import ReferralSlide from '../../components/TV/ReferralSlide'
import CustomSlideRenderer from '../../components/TV/CustomSlideRenderer'
import { tvService, Customer, Reward } from '../../services/tvService'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from 'lucide-react'

interface CustomSlide {
    id: string
    name: string
    content: any
    duration: number
    slide_type: string
}

const LiveTVPage: React.FC = () => {
    const { orgId: urlOrgId } = useParams()
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [slideIndex, setSlideIndex] = useState(0)
    const [topCustomers, setTopCustomers] = useState<Customer[]>([])
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [orgId, setOrgId] = useState<string | undefined>(urlOrgId)
    const [rewardsCount, setRewardsCount] = useState(3) // Default 3 rewards
    const [weatherCity, setWeatherCity] = useState('Rome') // Default Rome
    const [tickerSpeed, setTickerSpeed] = useState(30) // Default 30 seconds
    const [lotteryName, setLotteryName] = useState('Lotteria Settimanale')
    const [lotteryPrize, setLotteryPrize] = useState('Weekend da Sogno')
    const [lotteryPrizeImage, setLotteryPrizeImage] = useState('https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=200&q=80')
    const [jackpot, setJackpot] = useState(15400)
    const [lotteryDrawDate, setLotteryDrawDate] = useState('')
    const [lotteryLastWinner, setLotteryLastWinner] = useState('')
    const [lotteryLastPrize, setLotteryLastPrize] = useState('')
    const [pointsName, setPointsName] = useState('PUNTI')
    const [lastWinnerGender, setLastWinnerGender] = useState<'male' | 'female' | undefined>(undefined)
    const [customSlides, setCustomSlides] = useState<CustomSlide[]>([])
    const [weather, setWeather] = useState<{
        temp: number
        condition: string
        icon: string
    } | null>(null)

    console.log('User object:', user)
    console.log('URL orgId:', urlOrgId)

    // Load weather data
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const geoResponse = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity)}&count=1&language=en&format=json`
                )
                const geoData = await geoResponse.json()

                if (geoData.results && geoData.results.length > 0) {
                    const { latitude, longitude } = geoData.results[0]
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
                    )
                    const data = await response.json()

                    if (data.current) {
                        const weatherCode = data.current.weather_code
                        let condition = 'Sereno'
                        let icon = 'sun'

                        if (weatherCode === 0) { condition = 'Sereno'; icon = 'sun' }
                        else if (weatherCode <= 3) { condition = 'Nuvoloso'; icon = 'cloud' }
                        else if (weatherCode <= 67) { condition = 'Pioggia'; icon = 'rain' }
                        else if (weatherCode <= 77) { condition = 'Neve'; icon = 'snow' }
                        else { condition = 'Vento'; icon = 'wind' }

                        setWeather({
                            temp: Math.round(data.current.temperature_2m),
                            condition,
                            icon
                        })
                    }
                }
            } catch (error) {
                console.error('Error fetching weather:', error)
            }
        }

        fetchWeather()
        const interval = setInterval(fetchWeather, 600000) // Refresh every 10 minutes
        return () => clearInterval(interval)
    }, [weatherCity])

    // Heartbeat - Send device status every 10 seconds
    useEffect(() => {
        const deviceCode = localStorage.getItem('tv_device_code')
        if (!deviceCode) return

        const sendHeartbeat = async () => {
            try {
                await supabase.rpc('update_device_heartbeat', {
                    p_device_code: deviceCode,
                    p_ip_address: null,
                    p_user_agent: navigator.userAgent
                })
            } catch (error) {
                console.error('Error sending heartbeat:', error)
            }
        }

        // Send immediately on mount
        sendHeartbeat()

        // Then every 10 seconds
        const interval = setInterval(sendHeartbeat, 10000)

        return () => clearInterval(interval)
    }, [])

    // Fetch user's organization ID from organization_users
    useEffect(() => {
        const fetchUserOrganization = async () => {
            // If URL has orgId, use it (for public displays)
            if (urlOrgId) {
                console.log('✅ Using orgId from URL:', urlOrgId)
                setOrgId(urlOrgId)
                return
            }

            // Try to get orgId from localStorage (saved during pairing)
            const storedOrgId = localStorage.getItem('tv_org_id')
            if (storedOrgId) {
                console.log('✅ Using orgId from localStorage:', storedOrgId)
                setOrgId(storedOrgId)
                return
            }

            // Otherwise, fetch from user's organization_users
            if (!user) {
                console.log('⚠️ No user logged in, no URL orgId, and no localStorage orgId')
                return
            }

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
                    console.log('Found user org_id:', data.org_id)
                    setOrgId(data.org_id)
                }
            } catch (err) {
                console.error('Error in fetchUserOrganization:', err)
            }
        }

        fetchUserOrganization()
    }, [user, urlOrgId])

    // Simulation of "Realtime Trigger" via URL
    const triggerType = searchParams.get('trigger')
    const triggerName = searchParams.get('name')

    // Mock Org Data (In real app, fetch from Supabase based on orgId)
    // Dynamic: We merge mock data with stored config if available
    const [orgData, setOrgData] = useState({
        name: "Pizzeria Da Mario",
        industry: "restaurant",
        primary_color: "#ea580c",
        secondary_color: "#fcd34d",
        background_image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
        background_opacity: 80,
        overlay_color: "#000000",
        overlay_opacity: 50,
        ticker_text: "Benvenuto nel Club esclusivo • Scarica l'App per accumulare punti",
        logo_url: undefined
    })

    // Load custom slides from playlist
    useEffect(() => {
        const loadCustomSlides = async () => {
            if (!orgId) return

            try {
                console.log('🎬 Loading custom slides for org:', orgId)

                // Get active/default playlist
                const { data: playlist, error: playlistError } = await supabase
                    .from('signage_playlists')
                    .select('id')
                    .eq('organization_id', orgId)
                    .eq('is_active', true)
                    .or('is_default.eq.true')
                    .limit(1)
                    .single()

                if (playlistError || !playlist) {
                    console.log('⚠️ No active playlist found')
                    return
                }

                console.log('📺 Found playlist:', playlist.id)

                // Get playlist items with slide data
                const { data: items, error: itemsError } = await supabase
                    .from('signage_playlist_items')
                    .select(`
                        id,
                        slide_id,
                        slide_type,
                        display_order,
                        duration_override,
                        signage_slides (
                            id,
                            name,
                            content,
                            duration
                        )
                    `)
                    .eq('playlist_id', playlist.id)
                    .eq('slide_type', 'custom')
                    .order('display_order')

                if (itemsError) {
                    console.error('Error loading playlist items:', itemsError)
                    return
                }

                console.log('🎨 Loaded playlist items:', items)

                // Map to custom slides
                const slides = items
                    .filter(item => item.signage_slides)
                    .map(item => ({
                        id: item.signage_slides.id,
                        name: item.signage_slides.name,
                        content: item.signage_slides.content,
                        duration: item.duration_override || item.signage_slides.duration,
                        slide_type: 'custom'
                    }))

                console.log('✅ Custom slides loaded:', slides.length)
                setCustomSlides(slides)
            } catch (error) {
                console.error('Error loading custom slides:', error)
            }
        }

        loadCustomSlides()
        // Refresh every 60 seconds
        const interval = setInterval(loadCustomSlides, 60000)
        return () => clearInterval(interval)
    }, [orgId])

    // Load real data from Supabase
    useEffect(() => {
        const loadData = async () => {
            if (!orgId) {
                console.log('No orgId provided, using mock data')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                console.log('Loading TV data for org:', orgId)

                // Load organization info, top customers and rewards in parallel
                const [orgInfo, customersData, rewardsData] = await Promise.all([
                    supabase
                        .from('organizations')
                        .select('name, industry, logo_url, points_name, primary_color, secondary_color')
                        .eq('id', orgId)
                        .single(),
                    tvService.getTopCustomers(orgId, 5),
                    tvService.getRewards(orgId, rewardsCount)
                ])

                console.log('Loaded organization:', orgInfo.data)
                console.log('Loaded customers:', customersData)
                console.log('Loaded rewards:', rewardsData)

                // Update organization data with real name and logo
                if (orgInfo.data) {
                    setOrgData(prev => ({
                        ...prev,
                        name: orgInfo.data.name,
                        industry: orgInfo.data.industry || prev.industry,
                        logo_url: orgInfo.data.logo_url || prev.logo_url,
                        primary_color: orgInfo.data.primary_color || prev.primary_color,
                        secondary_color: orgInfo.data.secondary_color || prev.secondary_color
                    }))

                    // Update points name
                    if (orgInfo.data.points_name) {
                        setPointsName(orgInfo.data.points_name.toUpperCase())
                    }
                }

                setTopCustomers(customersData)
                setRewards(rewardsData)

                // Load lottery winner data
                await loadLotteryWinner(orgId)
            } catch (error) {
                console.error('Error loading TV data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
        // Refresh data every 30 seconds
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [orgId, rewardsCount])

    // Load lottery winner with customer details
    const loadLotteryWinner = async (organizationId: string) => {
        try {
            // Load most recent winner from extractions
            const { data: extractions, error: extractionsError } = await supabase
                .from('lottery_extractions')
                .select('winner_customer_name, winning_ticket_id, created_at')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
                .limit(1)

            if (extractionsError || !extractions || extractions.length === 0) {
                return
            }

            const lastWinner = extractions[0]

            // Try to get customer details from ticket
            if (lastWinner.winning_ticket_id) {
                const { data: ticketData } = await supabase
                    .from('lottery_tickets')
                    .select('customer_name, customer_id')
                    .eq('id', lastWinner.winning_ticket_id)
                    .single()

                if (ticketData && ticketData.customer_id) {
                    const { data: customerData } = await supabase
                        .from('customers')
                        .select('first_name, last_name, name, gender')
                        .eq('id', ticketData.customer_id)
                        .single()

                    if (customerData) {
                        const fullName = customerData.name ||
                                       `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim()

                        setLotteryLastWinner(fullName || lastWinner.winner_customer_name)
                        setLastWinnerGender(customerData.gender as 'male' | 'female' | undefined)
                    } else {
                        setLotteryLastWinner(ticketData.customer_name || lastWinner.winner_customer_name)
                    }
                } else if (ticketData) {
                    setLotteryLastWinner(ticketData.customer_name || lastWinner.winner_customer_name)
                }
            } else {
                setLotteryLastWinner(lastWinner.winner_customer_name)
            }
        } catch (error) {
            console.error('Error loading lottery winner:', error)
        }
    }

    // Load Dynamic Configuration from Supabase with Real-Time Updates
    useEffect(() => {
        console.log('🔍 Config useEffect - orgId:', orgId)
        if (!orgId) {
            console.warn('⚠️ orgId is undefined, skipping config load')
            return
        }

        const loadFromSupabase = async () => {
            try {
                console.log('🔄 Loading config from Supabase for orgId:', orgId)
                const { data: config, error } = await supabase
                    .from('tv_configurations')
                    .select('*')
                    .eq('organization_id', orgId)
                    .single()

                if (error) {
                    console.warn('⚠️ No TV config found, using defaults:', error)
                    return
                }

                if (config) {
                    console.log('📺 Loaded TV config from Supabase:', config)
                setOrgData(prev => ({
                    ...prev,
                    background_image: config.background_image || prev.background_image,
                    background_opacity: config.background_opacity ?? prev.background_opacity,
                    overlay_color: config.overlay_color ?? prev.overlay_color,
                    overlay_opacity: config.overlay_opacity ?? prev.overlay_opacity,
                    ticker_text: config.ticker_text || prev.ticker_text
                }))
                // Update rewards count if present
                if (config.rewards_count) {
                    setRewardsCount(config.rewards_count)
                }
                // Update weather city if present
                if (config.weather_city) {
                    setWeatherCity(config.weather_city)
                }
                // Update ticker speed if present
                if (config.ticker_speed) {
                    setTickerSpeed(config.ticker_speed)
                }
                // Update lottery data if present
                if (config.lottery_name) {
                    setLotteryName(config.lottery_name)
                }
                if (config.lottery_prize) {
                    setLotteryPrize(config.lottery_prize)
                }
                if (config.lottery_prize_image) {
                    setLotteryPrizeImage(config.lottery_prize_image)
                }
                if (config.jackpot) {
                    setJackpot(config.jackpot)
                }
                if (config.lottery_draw_date) {
                    setLotteryDrawDate(config.lottery_draw_date)
                }
                if (config.lottery_last_winner) {
                    setLotteryLastWinner(config.lottery_last_winner)
                }
                if (config.lottery_last_prize) {
                    setLotteryLastPrize(config.lottery_last_prize)
                }
                }
            } catch (error) {
                console.error('Error loading TV config:', error)
            }
        }

        // 1. Initial Load
        loadFromSupabase()

        // 2. Real-Time Listener via Supabase Realtime
        console.log('🔌 Setting up Realtime channel for orgId:', orgId)
        const channelName = `tv_config_${orgId}`
        console.log('📝 Channel name:', channelName)
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tv_configurations',
                filter: `organization_id=eq.${orgId}`
            }, (payload) => {
                console.log('🎉 UPDATE event received:', payload)
                const config = payload.new as any
            setOrgData(prev => ({
                ...prev,
                background_image: config.background_image || prev.background_image,
                background_opacity: config.background_opacity ?? prev.background_opacity,
                overlay_color: config.overlay_color ?? prev.overlay_color,
                overlay_opacity: config.overlay_opacity ?? prev.overlay_opacity,
                ticker_text: config.ticker_text || prev.ticker_text
            }))
            // Update rewards count if present
            if (config.rewards_count) {
                setRewardsCount(config.rewards_count)
            }
            // Update weather city if present
            if (config.weather_city) {
                setWeatherCity(config.weather_city)
            }
            // Update ticker speed if present
            if (config.ticker_speed) {
                setTickerSpeed(config.ticker_speed)
            }
            // Update lottery data if present
            if (config.lottery_name) {
                setLotteryName(config.lottery_name)
            }
            if (config.lottery_prize) {
                setLotteryPrize(config.lottery_prize)
            }
            if (config.lottery_prize_image) {
                setLotteryPrizeImage(config.lottery_prize_image)
            }
            if (config.jackpot) {
                setJackpot(config.jackpot)
            }
            if (config.lottery_draw_date) {
                setLotteryDrawDate(config.lottery_draw_date)
            }
            if (config.lottery_last_winner) {
                setLotteryLastWinner(config.lottery_last_winner)
            }
            if (config.lottery_last_prize) {
                setLotteryLastPrize(config.lottery_last_prize)
            }
        })
        .subscribe((status, err) => {
            console.log('📡 Realtime subscription status:', status, err ? `Error: ${err}` : '')
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to tv_config_changes channel')
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('❌ Channel error:', err)
            }
        })

        console.log('✅ Realtime channel subscribed')

        // 3. Fallback Polling (Safety net)
        const poller = setInterval(loadFromSupabase, 5000)
        console.log('⏰ Fallback polling started (every 5s)')

        return () => {
            channel.unsubscribe()
            clearInterval(poller)
        }
    }, [orgId])

    // Slide Rotation Logic - Fidelity slides first, then custom slides
    useEffect(() => {
        const totalFidelitySlides = 7 // Leaderboard, Rewards, GetCard, HowItWorks, ActivityFeed, Lottery, Referral
        const totalCustomSlides = customSlides.length
        const totalSlides = totalFidelitySlides + totalCustomSlides

        // If we're on a custom slide (index >= 7), use its custom duration
        let duration = 8000 // Default 8 seconds for fidelity slides

        if (slideIndex >= totalFidelitySlides && slideIndex < totalSlides) {
            const customSlideIndex = slideIndex - totalFidelitySlides
            const customSlide = customSlides[customSlideIndex]
            if (customSlide) {
                duration = customSlide.duration * 1000 // Convert seconds to milliseconds
                console.log(`⏱️ Custom slide "${customSlide.name}" duration: ${duration}ms`)
            }
        }

        console.log(`⏰ Setting timer for slide ${slideIndex}, duration: ${duration}ms, total slides: ${totalSlides}, fidelity: ${totalFidelitySlides}, custom: ${totalCustomSlides}`)

        const timer = setTimeout(() => {
            setSlideIndex(prev => {
                const next = (prev + 1) % totalSlides
                console.log(`🔄 Slide rotation: ${prev} -> ${next} (total: ${totalSlides}, calculation: (${prev} + 1) % ${totalSlides} = ${next})`)
                return next
            })
        }, duration)

        return () => {
            clearTimeout(timer)
        }
    }, [slideIndex, customSlides.length])

    // Check if we're showing a custom slide
    const totalFidelitySlides = 7
    const isShowingCustomSlide = slideIndex >= totalFidelitySlides && customSlides.length > 0
    const customSlideIndex = slideIndex - totalFidelitySlides

    // If showing custom slide, render fullscreen with header and ticker (no background)
    if (isShowingCustomSlide && customSlides[customSlideIndex]) {
        const currentCustomSlide = customSlides[customSlideIndex]
        console.log('🎬 Rendering custom slide:', currentCustomSlide.name)
        console.log('📋 Custom slide content:', JSON.stringify(currentCustomSlide.content, null, 2))
        console.log('📋 Custom slide zones:', currentCustomSlide.content?.zones)
        return (
            <div className="tv-viewport" style={{ backgroundColor: '#000000', position: 'relative' }}>
                {/* Background Image Layer - Full viewport */}
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0
                }}>
                    <CustomSlideRenderer slide={currentCustomSlide} />
                </div>

                <div className="tv-layout" style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <header className="tv-header" style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)'
                    }}>
                        <div className="tv-brand" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {orgData.logo_url && (
                                <img src={orgData.logo_url} alt="Logo" className="tv-logo" />
                            )}
                            <h1>{orgData.name || 'OMNILY PRO'}</h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                            {/* Weather Widget */}
                            {weather && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '15px 25px',
                                    borderRadius: '20px'
                                }}>
                                    {weather.icon === 'sun' && <Sun size={36} color="#fbbf24" />}
                                    {weather.icon === 'cloud' && <Cloud size={36} color="#e5e7eb" />}
                                    {weather.icon === 'rain' && <CloudRain size={36} color="#60a5fa" />}
                                    {weather.icon === 'snow' && <CloudSnow size={36} color="#dbeafe" />}
                                    {weather.icon === 'wind' && <Wind size={36} color="#9ca3af" />}
                                    <div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                                            {weather.temp}°C
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                                            {weather.condition}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="tv-clock">{new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </header>

                    {/* Content spacer - to maintain layout but transparent */}
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '800px'
                    }}>
                        {/* Empty - image is in background */}
                    </div>

                    {/* Footer Ticker */}
                    <div className="tv-footer">
                        <div className="tv-ticker-wrap">
                            <div className="tv-ticker" style={{ animationDuration: `${tickerSpeed}s` }}>
                                {orgData.ticker_text}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Render fidelity slides inside LiveTVLayout
    return (
        <LiveTVLayout
            organization={orgData}
            backgroundImage={orgData.background_image}
            backgroundOpacity={orgData.background_opacity}
            overlayColor={orgData.overlay_color}
            overlayOpacity={orgData.overlay_opacity}
            weatherCity={weatherCity}
            tickerSpeed={tickerSpeed}
        >
            {/*
         If a trigger is present (pushed by Xogo or URL), show the Interrupt Overlay
         Otherwise rotate between passive slides
      */}
            {triggerType === 'welcome' && triggerName ? (
                <WelcomeInterrupt
                    customerName={triggerName}
                    points={1250}
                    tier="Chef VIP"
                />
            ) : loading ? (
                <div style={{ color: 'white', fontSize: '2rem', textAlign: 'center' }}>Caricamento...</div>
            ) : (
                <>
                    {console.log(`🎬 Rendering slide ${slideIndex}`)}
                    {/* Fidelity Slide Rotation (0-6) */}
                    {slideIndex === 0 ? <LeaderboardSlide customers={topCustomers} pointsName={pointsName} /> :
                    slideIndex === 1 ? <RewardsSlide rewards={rewards} /> :
                        slideIndex === 2 ? <GetCardSlide
                            organizationName={orgData.name}
                            primaryColor={orgData.primary_color}
                            secondaryColor={orgData.secondary_color}
                        /> :
                            slideIndex === 3 ? <HowItWorksSlide pointsName={pointsName} /> :
                                slideIndex === 4 ? <ActivityFeedSlide organizationId={orgId} /> :
                                    slideIndex === 5 ? <LotterySlide
                                        lotteryName={lotteryName}
                                        jackpot={jackpot}
                                        prizeName={lotteryPrize}
                                        prizeImage={lotteryPrizeImage}
                                        lastWinner={lotteryLastWinner}
                                        lastPrize={lotteryLastPrize}
                                        drawDate={lotteryDrawDate}
                                        pointsName={pointsName}
                                        lastWinnerGender={lastWinnerGender}
                                    /> :
                                        slideIndex === 6 ? <ReferralSlide
                                            organizationName={orgData.name}
                                            primaryColor={orgData.primary_color}
                                            secondaryColor={orgData.secondary_color}
                                        /> : null}
                </>
            )}
        </LiveTVLayout>
    )
}

export default LiveTVPage
