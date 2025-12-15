import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Medal, TrendingUp } from 'lucide-react'
import { Customer } from '../../services/tvService'

// MOCK DATA for Prototype (fallback)
const MOCK_LEADERS = [
    { id: '1', name: 'Mario Rossi', tier: 'Chef VIP', points: 1250, avatar: 'MR' },
    { id: '2', name: 'Giulia Bianchi', tier: 'Gourmet', points: 980, avatar: 'GB' },
    { id: '3', name: 'Luca Verdi', tier: 'Gourmet', points: 850, avatar: 'LV' },
    { id: '4', name: 'Anna Neri', tier: 'Buongustaio', points: 620, avatar: 'AN' },
    { id: '5', name: 'Marco Gialli', tier: 'Buongustaio', points: 450, avatar: 'MG' }
]

interface LeaderboardSlideProps {
    customers?: Customer[]
    pointsName?: string
}

const LeaderboardSlide: React.FC<LeaderboardSlideProps> = ({ customers, pointsName = 'pts' }) => {
    // Use real data if available, otherwise fallback to mock
    const leaders = customers && customers.length > 0 ? customers : MOCK_LEADERS

    // Ensure we have at least 3 leaders for the podium
    const paddedLeaders = [...leaders]
    while (paddedLeaders.length < 5) {
        paddedLeaders.push(MOCK_LEADERS[paddedLeaders.length] || MOCK_LEADERS[0])
    }

    const [top1, top2, top3, ...rest] = paddedLeaders

    const podiumVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: (i: number) => ({
            scale: 1,
            opacity: 1,
            transition: {
                delay: i * 0.2,
                type: 'spring',
                stiffness: 100,
                damping: 12
            }
        })
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Header */}
            <motion.div style={{ textAlign: 'center', marginBottom: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '15px',
                    background: 'rgba(0,0,0,0.05)',
                    padding: '10px 30px',
                    borderRadius: '50px',
                    marginBottom: '20px'
                }}>
                    <Crown size={24} color="#ea580c" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#64748b' }}>
                        Hall of Fame
                    </span>
                </div>
                <h2 style={{
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    color: '#ffffff'
                }}>
                    Top Customers
                </h2>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '60px', alignItems: 'end' }}>

                {/* PODIUM (Top 3) */}
                <div style={{ display: 'flex', alignItems: 'end', gap: '20px', height: '500px' }}>

                    {/* #2 Silver */}
                    <motion.div
                        custom={1}
                        variants={podiumVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            flex: 1,
                            background: 'linear-gradient(to bottom, #f1f5f9, #cbd5e1)',
                            borderRadius: '20px 20px 0 0',
                            height: '70%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '20px',
                            position: 'relative',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}
                    >
                        {/* Position Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#94a3b8',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }}>
                            2
                        </div>
                        <div style={{
                            position: 'absolute', top: '-40px',
                            background: 'white', borderRadius: '50%', width: '80px', height: '80px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            fontSize: '1.5rem', fontWeight: 'bold', color: '#64748b'
                        }}>
                            {top2.avatar}
                        </div>
                        <div style={{ marginTop: '50px', textAlign: 'center' }}>
                            <Medal size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#334155' }}>{top2.name}</h3>
                            <div>
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#475569' }}>{top2.points}</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginLeft: '8px' }}>{pointsName}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* #1 Gold */}
                    <motion.div
                        custom={2}
                        variants={podiumVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            flex: 1.2,
                            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', // Gold/Warm feel placeholder, overridden by style below
                            backgroundImage: 'linear-gradient(to bottom, #fcd34d, #f59e0b)',
                            borderRadius: '20px 20px 0 0',
                            height: '90%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '20px',
                            position: 'relative',
                            boxShadow: '0 30px 60px rgba(245, 158, 11, 0.3)',
                            zIndex: 10
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: '-60px',
                            background: 'white', borderRadius: '50%', width: '120px', height: '120px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 15px 30px rgba(245, 158, 11, 0.2)',
                            fontSize: '2.5rem', fontWeight: 'bold', color: '#b45309',
                            border: '4px solid #fffbeb'
                        }}>
                            <Crown size={60} color="#f59e0b" style={{ position: 'absolute', top: '-40px', transform: 'rotate(-15deg)' }} />
                            {top1.avatar}
                        </div>
                        <div style={{ marginTop: '80px', textAlign: 'center', color: 'white' }}>
                            <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1 }}>1</div>
                            <h3 style={{ margin: '0 0 10px', fontSize: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{top1.name}</h3>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 20px', borderRadius: '20px', display: 'inline-block' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{top1.points}</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 600, marginLeft: '10px', opacity: 0.9 }}>{pointsName}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* #3 Bronze */}
                    <motion.div
                        custom={0}
                        variants={podiumVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            flex: 1,
                            background: 'linear-gradient(to bottom, #fed7aa, #fdba74)',
                            borderRadius: '20px 20px 0 0',
                            height: '60%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '20px',
                            position: 'relative',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                        }}
                    >
                        {/* Position Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#c2410c',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }}>
                            3
                        </div>
                        <div style={{
                            position: 'absolute', top: '-40px',
                            background: 'white', borderRadius: '50%', width: '80px', height: '80px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            fontSize: '1.5rem', fontWeight: 'bold', color: '#9a3412'
                        }}>
                            {top3.avatar}
                        </div>
                        <div style={{ marginTop: '50px', textAlign: 'center' }}>
                            <Medal size={32} color="#c2410c" style={{ margin: '0 auto 10px' }} />
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#7c2d12' }}>{top3.name}</h3>
                            <div>
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#9a3412' }}>{top3.points}</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#c2410c', marginLeft: '8px' }}>{pointsName}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* BEST OF THE REST (List) */}
                <div style={{ paddingBottom: '20px' }}>
                    <h4 style={{
                        fontSize: '1.2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        color: '#94a3b8',
                        marginBottom: '20px',
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: '10px'
                    }}>
                        In scalata
                    </h4>
                    {rest.map((leader, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                background: 'white',
                                padding: '20px',
                                borderRadius: '16px',
                                marginBottom: '15px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#cbd5e1', width: '40px' }}>#{i + 4}</span>
                            <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                                {leader.avatar}
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 600, color: '#334155' }}>{leader.name}</span>
                                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{leader.tier}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{leader.points}</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>{pointsName}</span>
                                    <TrendingUp size={16} color="#22c55e" style={{ marginLeft: '8px', display: 'inline' }} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default LeaderboardSlide
