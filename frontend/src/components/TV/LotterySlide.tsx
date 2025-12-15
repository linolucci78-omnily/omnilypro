import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Ticket, Clock } from 'lucide-react'

// Odometer Component for rolling numbers
const Odometer = ({ value }: { value: number }) => {
    const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
};

interface LotterySlideProps {
    lotteryName?: string
    jackpot?: number
    prizeName?: string
    prizeImage?: string
    lastWinner?: string
    lastPrize?: string
    drawDate?: string
    pointsName?: string
    lastWinnerGender?: 'male' | 'female'
}

const LotterySlide: React.FC<LotterySlideProps> = ({
    lotteryName = 'Lotteria Settimanale',
    jackpot = 15400,
    prizeName = 'Weekend da Sogno',
    prizeImage = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=200&q=80',
    lastWinner,
    lastPrize,
    drawDate,
    pointsName = 'PUNTI',
    lastWinnerGender
}) => {
    // Simulate Pot Growing
    const [pot, setPot] = useState(jackpot)

    // Update pot when jackpot prop changes
    useEffect(() => {
        setPot(jackpot)
    }, [jackpot])

    useEffect(() => {
        const interval = setInterval(() => {
            setPot(prev => prev + Math.floor(Math.random() * 50))
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div style={{ width: '100%', maxWidth: '1400px', textAlign: 'center' }}>

            {/* Header with Neon Effect */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                style={{
                    marginBottom: '60px',
                    position: 'relative'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '200px',
                    background: 'radial-gradient(ellipse, rgba(234, 88, 12, 0.4) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                    filter: 'blur(40px)'
                }}></div>

                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '20px',
                    background: '#111',
                    padding: '20px 60px',
                    borderRadius: '100px',
                    border: '4px solid #fcd34d',
                    boxShadow: '0 0 30px #fcd34d',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <Ticket size={80} color="#fcd34d" />
                    <span style={{
                        fontSize: '4rem',
                        fontWeight: 900,
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '5px'
                    }}>
                        {lotteryName}
                    </span>
                </div>
            </motion.div>

            {/* MAIN JACKPOT DISPLAY */}
            <motion.div
                style={{ marginBottom: '80px' }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
                <span style={{
                    display: 'block',
                    fontSize: '2rem',
                    textTransform: 'uppercase',
                    letterSpacing: '10px',
                    color: '#64748b',
                    marginBottom: '10px'
                }}>
                    Montepremi Attuale
                </span>

                <h1 style={{
                    fontSize: '12rem',
                    fontWeight: 900,
                    margin: 0,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    background: 'linear-gradient(to bottom, #d4af37, #b45309)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 10px 30px rgba(180, 83, 9, 0.3)'
                }}>
                    <Odometer value={pot} />
                </h1>

                <div style={{ fontSize: '3rem', fontWeight: 700, color: '#b45309', marginTop: '-20px', marginBottom: '40px' }}>{pointsName}</div>

                {/* SUPER PRIZE TEASER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '30px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '15px 40px',
                        borderRadius: '50px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <img
                        src={prizeImage}
                        alt="Dream Prize"
                        style={{ width: '80px', height: '80px', borderRadius: '15px', objectFit: 'cover', border: '2px solid #fff' }}
                    />
                    <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '1rem', color: '#94a3b8', letterSpacing: '2px' }}>SUPER PREMIO</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{prizeName}</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Footer Grid - Conditional layout based on available data */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: lastWinner ? '1fr 1fr' : '1fr',
                gap: '40px',
                justifyContent: 'center'
            }}>

                {/* Countdown Box - Only show if draw date is provided */}
                {drawDate && (
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '30px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '50%', color: '#ef4444' }}>
                            <Clock size={50} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>PROSSIMA ESTRAZIONE</span>
                            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#1f2937' }}>
                                {new Date(drawDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Last Winner Box - Only show if we have a winner name */}
                {lastWinner && (
                    <div style={{
                        background: 'linear-gradient(135deg, #111, #333)',
                        padding: '40px',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '30px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        color: 'white'
                    }}>
                        <img
                            src={`https://api.dicebear.com/7.x/${
                                lastWinnerGender === 'female' ? 'avataaars' :
                                lastWinnerGender === 'male' ? 'avataaars' :
                                'avataaars'
                            }/svg?seed=${lastWinner}&gender=${
                                lastWinnerGender === 'female' ? 'female' :
                                lastWinnerGender === 'male' ? 'male' :
                                ''
                            }`}
                            alt="Winner"
                            style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #fcd34d' }}
                        />
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '1.2rem', color: '#94a3b8', fontWeight: 600 }}>ULTIMO VINCITORE</span>
                            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fcd34d' }}>{lastWinner}</span>
                            {lastPrize && (
                                <span style={{ display: 'block', fontSize: '1.2rem', color: '#cbd5e1' }}>Ha vinto {lastPrize}!</span>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default LotterySlide
