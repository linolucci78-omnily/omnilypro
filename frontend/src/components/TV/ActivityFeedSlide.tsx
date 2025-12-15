import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, UserPlus, Star, Coffee, ShoppingBag } from 'lucide-react'

// Mock Data for "Live Events"
const MOCK_EVENTS = [
    { type: 'redeem', user: 'Giulia B.', detail: 'Caffè Gratuito', time: '2 min fa', icon: <Coffee size={24} /> },
    { type: 'levelup', user: 'Marco R.', detail: 'Livello GOLD', time: '5 min fa', icon: <Star size={24} /> },
    { type: 'join', user: 'Nuovo Membro', detail: 'Benvenuto nel Club!', time: '12 min fa', icon: <UserPlus size={24} /> },
    { type: 'redeem', user: 'Luca S.', detail: 'Sconto 5€', time: '15 min fa', icon: <ShoppingBag size={24} /> },
    { type: 'levelup', user: 'Sofia V.', detail: 'Livello SILVER', time: '20 min fa', icon: <Star size={24} /> }
]

const ActivityFeedSlide: React.FC = () => {
    // We'll simulate a "Live Feed" by rotating these
    const [visibleEvents, setVisibleEvents] = useState(MOCK_EVENTS.slice(0, 3))

    useEffect(() => {
        const interval = setInterval(() => {
            // Rotate events to make it feel alive
            setVisibleEvents(prev => {
                const [first, ...rest] = prev
                // In a real app, we'd fetch a new event here
                // For now, move first to end to simulate infinite scroll
                return [...rest, first]
            })
        }, 3000) // New event every 3 seconds

        return () => clearInterval(interval)
    }, [])

    return (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '20px' }}
            >
                <h2 style={{
                    fontSize: '4rem',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, var(--tv-primary), var(--tv-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}>
                    Live Feed
                </h2>
                <p style={{ fontSize: '1.5rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
                    Attività in tempo reale
                </p>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <AnimatePresence mode='popLayout'>
                    {visibleEvents.map((event, index) => (
                        <motion.div
                            key={`${event.user}-${index}-${event.type}`} // Unique key for animation
                            layout
                            initial={{ opacity: 0, x: -50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '24px 40px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '30px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                borderLeft: `6px solid ${event.type === 'redeem' ? '#2563eb' :
                                        event.type === 'levelup' ? '#d97706' : '#16a34a'
                                    }`
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '12px',
                                background: '#f9fafb',
                                color: '#1f2937',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {event.icon}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937' }}>{event.user}</span>
                                    <span style={{ fontSize: '1.2rem', color: '#9ca3af', fontWeight: 500 }}>{event.time}</span>
                                </div>
                                <span style={{ fontSize: '1.5rem', color: '#4b5563', display: 'block', fontWeight: 500 }}>
                                    {event.type === 'redeem' ? 'Ha riscattato:' :
                                        event.type === 'levelup' ? 'Nuovo Status:' :
                                            'Nuovo Iscritto'}
                                    <strong style={{ color: 'var(--tv-primary)', marginLeft: '8px', textTransform: 'uppercase' }}>{event.detail}</strong>
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default ActivityFeedSlide
