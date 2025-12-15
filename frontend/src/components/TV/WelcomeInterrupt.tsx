import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface WelcomeInterruptProps {
    customerName: string
    points: number
    tier: string
}

const WelcomeInterrupt: React.FC<WelcomeInterruptProps> = ({ customerName, points, tier }) => {

    useEffect(() => {
        // Fire confetti on mount
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ea580c', '#fcd34d', '#ffffff'] // Industry colors
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ea580c', '#fcd34d', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }, [])

    return (
        <motion.div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.9)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center'
            }}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 style={{ fontSize: '4rem', marginBottom: '20px', color: '#cbd5e1' }}>BENTORNATO</h1>
                <h2 style={{ fontSize: '8rem', fontWeight: 900, margin: 0, background: 'linear-gradient(to right, #fcd34d, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {customerName}
                </h2>
                <div style={{
                    marginTop: '40px',
                    padding: '20px 60px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50px',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '30px'
                }}>
                    <span style={{ fontSize: '3rem', fontWeight: 700 }}>{points} Punti</span>
                    <span style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.3)' }}></span>
                    <span style={{ fontSize: '3rem', textTransform: 'uppercase', color: '#fcd34d' }}>{tier}</span>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default WelcomeInterrupt
