import React, { useEffect, useState } from 'react'
import { INDUSTRY_TEMPLATES } from '../../config/industryTemplates'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from 'lucide-react'
import './LiveTV.css'

interface LiveTVLayoutProps {
    children: React.ReactNode
    organization: any
    backgroundImage?: string
    backgroundOpacity?: number // 0 to 100
    overlayColor?: string // Hex color
    overlayOpacity?: number // 0 to 100
    isPreview?: boolean
    weatherCity?: string // City name for weather widget
    tickerSpeed?: number // Duration in seconds for ticker animation
}

/**
 * 📺 LiveTVLayout
 * Optimized for Primary 1920x1080 Digital Signage Displays.
 * High Contrast, Large Fonts, No Sidebar.
 */
const LiveTVLayout: React.FC<LiveTVLayoutProps> = ({
    children,
    organization,
    backgroundImage,
    backgroundOpacity = 80, // Default to 80% visibility
    overlayColor = '#000000', // Default black tint
    overlayOpacity = 50, // Default 50% tint intensity
    isPreview = false,
    weatherCity = 'Rome', // Default to Rome
    tickerSpeed = 30 // Default 30 seconds
}) => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [weather, setWeather] = useState<{
        temp: number
        condition: string
        icon: string
    } | null>(null)

    // Add 'tv-viewport' class to body for isolated CSS (margin 0, overflow hidden)
    // ONLY if not in preview (standalone mode).
    useEffect(() => {
        if (!isPreview) {
            document.body.classList.add('tv-viewport')
            return () => document.body.classList.remove('tv-viewport')
        }
    }, [isPreview])

    // STANDALONE AUTO-SCALING (Only activates if NOT in Admin Preview)
    // This allows the standalone page to "fit" on a laptop screen by scaling down.
    useEffect(() => {
        if (isPreview) return // Admin Preview handles its own scaling wrapper

        const handleResize = () => {
            if (!contentRef.current) return

            // If window is smaller than 1920x1080, scale down to fit
            const scaleX = window.innerWidth / 1920
            const scaleY = window.innerHeight / 1080
            const scale = Math.min(scaleX, scaleY, 1) // Never scale up to avoid blurry text, only down

            if (scale < 1) {
                // Scale the content container ONLY
                contentRef.current.style.width = '1920px'
                contentRef.current.style.height = '1080px'
                contentRef.current.style.transform = `scale(${scale})`
                contentRef.current.style.transformOrigin = 'center center'

                // Center it absolutely within the Root
                contentRef.current.style.position = 'absolute'
                contentRef.current.style.left = '50%'
                contentRef.current.style.top = '50%'
                contentRef.current.style.translate = '-50% -50%'
            } else {
                // Reset to full flow for native 1080p+ screens
                contentRef.current.style.width = '100%'
                contentRef.current.style.height = '100%'
                contentRef.current.style.transform = 'none'
                contentRef.current.style.position = 'relative'
                contentRef.current.style.left = 'auto'
                contentRef.current.style.top = 'auto'
                contentRef.current.style.translate = 'none'
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isPreview])

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Weather - fetch from Open-Meteo API using city name
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // First, get coordinates from city name using geocoding API
                const geoResponse = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity)}&count=1&language=en&format=json`
                )
                const geoData = await geoResponse.json()

                if (geoData.results && geoData.results.length > 0) {
                    const { latitude, longitude } = geoData.results[0]
                    await loadWeather(latitude, longitude)
                }
            } catch (error) {
                console.error('Error fetching weather:', error)
            }
        }

        const loadWeather = async (lat: number, lon: number) => {
            try {
                // Using Open-Meteo (free, no API key needed)
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
                )
                const data = await response.json()

                if (data.current) {
                    const weatherCode = data.current.weather_code
                    let condition = 'Sereno'
                    let icon = 'sun'

                    // Map weather codes to conditions
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
            } catch (error) {
                console.error('Error loading weather data:', error)
            }
        }

        fetchWeather()
        // Refresh weather every 10 minutes
        const interval = setInterval(fetchWeather, 600000)
        return () => clearInterval(interval)
    }, [weatherCity])

    // Prepare styles for inline injection (Scoped to this component)
    const getThemeStyles = () => {
        let primaryColor = organization?.primary_color || '#000000';
        let secondaryColor = organization?.secondary_color || '#ffffff';

        if (organization?.industry) {
            const template = Object.values(INDUSTRY_TEMPLATES).find(t => t.industry === organization.industry) || INDUSTRY_TEMPLATES['retail'];
            primaryColor = template.colors.primary;
            secondaryColor = template.colors.secondary;
        }

        return {
            '--tv-primary': primaryColor,
            '--tv-secondary': secondaryColor,
            '--color-primary-transparent': `${primaryColor}40`,
            '--color-secondary-transparent': `${secondaryColor}40`,
        } as React.CSSProperties;
    };

    // Determine layer positioning strategy
    // Live Mode: 'fixed' ensures full viewport coverage regardless of parent.
    // Preview Mode: 'absolute' ensures it stays contained within the simulated 1920x1080 box.
    const layerPosition = isPreview ? 'absolute' : 'fixed';

    return (
        <div
            className={`tv-root ${isPreview ? 'tv-preview-mode' : ''}`}
            style={{
                ...getThemeStyles(),
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#000' // Base black
            }}
        >
            {/* Background Image Layer (Independent Opacity) - NOT SCALED via Transform */}
            {backgroundImage && (
                <div
                    className="tv-background-layer"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        opacity: backgroundOpacity / 100,
                        position: layerPosition,
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 1
                    }}
                />
            )}

            {/* Overlay Tint Layer (Independent Color & Opacity) */}
            <div
                className="tv-overlay-layer"
                style={{
                    backgroundColor: overlayColor,
                    opacity: overlayOpacity / 100,
                    position: layerPosition,
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: 'none'
                }}
            />

            {/* Main Layout Content (Header, Main, Footer) - THIS GETS SCALED */}
            {/* We reuse the 'tv-layout' class for flex/styling, but handle geometry via JS scaling above */}
            <div
                ref={contentRef}
                className="tv-layout"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                    background: 'transparent' // Ensure transparent so backgrounds show through
                }}
            >
                {/* Header Bar */}
                <header className="tv-header">
                    <div className="tv-brand" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {organization?.logo_url && (
                            <img src={organization.logo_url} alt="Logo" className="tv-logo" />
                        )}
                        <h1>{organization?.name || 'OMNILY PRO'}</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                        {/* Weather Widget */}
                        {weather && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                background: 'rgba(255,255,255,0.1)',
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
                        {/* Clock */}
                        <div className="tv-clock">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="tv-content">
                    <AnimatePresence mode='wait'>
                        {children}
                    </AnimatePresence>
                </main>

                {/* Ticker / Footer */}
                <footer className="tv-footer" style={{
                    position: isPreview ? 'absolute' : 'fixed'
                }}>
                    <div className="tv-ticker-wrap">
                        <div
                            className="tv-ticker"
                            style={{
                                animation: `ticker ${tickerSpeed}s linear infinite`
                            }}
                        >
                            <span>
                                {organization?.ticker_text || `Benvenuto nel Club esclusivo di ${organization?.name} • Scarica l'App per accumulare punti`}
                            </span>
                        </div>
                    </div>

                    {/* Integrated B2B Badge - Right Aligned in Footer */}
                    <div style={{
                        position: 'absolute',
                        right: '0',
                        top: '0',
                        height: '100%',
                        padding: '0 30px',
                        background: 'rgba(0,0,0,0.8)', // Darker background to cover ticker
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        zIndex: 20,
                        boxShadow: '-10px 0 20px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            background: '#ea580c',
                            borderRadius: '50%',
                            boxShadow: '0 0 10px #ea580c'
                        }}></div>
                        <span style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                        }}>
                            POWERED BY <span style={{ color: '#ea580c' }}>OMNILY PRO</span>
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    )
}

export default LiveTVLayout
