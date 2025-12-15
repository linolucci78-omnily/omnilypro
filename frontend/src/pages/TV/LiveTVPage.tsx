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
import { tvService, Customer, Reward } from '../../services/tvService'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

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

    console.log('User object:', user)
    console.log('URL orgId:', urlOrgId)

    // Fetch user's organization ID from organization_users
    useEffect(() => {
        const fetchUserOrganization = async () => {
            // If URL has orgId, use it (for public displays)
            if (urlOrgId) {
                setOrgId(urlOrgId)
                return
            }

            // Otherwise, fetch from user's organization_users
            if (!user) {
                console.log('No user logged in and no URL orgId')
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
                        .select('name, industry, logo_url, points_name')
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
                        logo_url: orgInfo.data.logo_url || prev.logo_url
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

    // Load Dynamic Configuration (Real-Time Broadcast + Persistence)
    useEffect(() => {
        const loadFromStorage = () => {
            const stored = localStorage.getItem('tv_config_simulation')
            if (stored) {
                const config = JSON.parse(stored)
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
        }

        // 1. Initial Load
        loadFromStorage()

        // 2. Real-Time Listener (Instant)
        const channel = new BroadcastChannel('tv_channel')
        channel.onmessage = (event) => {
            const config = event.data
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

        // 3. Fallback Polling (Safety net)
        const poller = setInterval(loadFromStorage, 5000)

        return () => {
            channel.close()
            clearInterval(poller)
        }
    }, [])

    // Slide Rotation Logic (Every 8 seconds)
    useEffect(() => {
        const timer = setInterval(() => {
            // Rotate: 0(Leaderboard) -> 1(Rewards/Photos) -> 2(Promo) -> 3(Activity) -> 4(Lottery) -> 5(HowTo)
            setSlideIndex(prev => (prev + 1) % 6)
        }, 8000)
        return () => clearInterval(timer)
    }, [])

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
                // Slide Rotation
                slideIndex === 0 ? <LeaderboardSlide customers={topCustomers} pointsName={pointsName} /> :
                    slideIndex === 1 ? <RewardsSlide rewards={rewards} /> :
                        slideIndex === 2 ? <GetCardSlide /> :
                            slideIndex === 3 ? <HowItWorksSlide pointsName={pointsName} /> :
                                slideIndex === 4 ? <ActivityFeedSlide /> :
                                    <LotterySlide
                                        lotteryName={lotteryName}
                                        jackpot={jackpot}
                                        prizeName={lotteryPrize}
                                        prizeImage={lotteryPrizeImage}
                                        lastWinner={lotteryLastWinner}
                                        lastPrize={lotteryLastPrize}
                                        drawDate={lotteryDrawDate}
                                        pointsName={pointsName}
                                        lastWinnerGender={lastWinnerGender}
                                    />
            )}
        </LiveTVLayout>
    )
}

export default LiveTVPage
