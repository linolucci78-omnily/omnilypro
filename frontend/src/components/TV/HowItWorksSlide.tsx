import React from 'react'
import { motion } from 'framer-motion'
import { Euro, Coins, Gift, ArrowRight } from 'lucide-react'

interface HowItWorksSlideProps {
    pointsName?: string
}

const HowItWorksSlide: React.FC<HowItWorksSlideProps> = ({ pointsName = 'PUNTI' }) => {

    const steps = [
        {
            icon: <Euro size={80} color="#2563eb" />,
            title: "Fai la Spesa",
            desc: "Ogni €1 speso",
            highlight: "1 PUNTO" // In future this comes from settings
        },
        {
            icon: <Coins size={80} color="#eab308" />,
            title: "Accumula",
            desc: "Raccolta automatica",
            highlight: pointsName
        },
        {
            icon: <Gift size={80} color="#ec4899" />,
            title: "Vinci Premi",
            desc: "Usa i tuoi punti",
            highlight: "PREMI GRATIS"
        }
    ]

    return (
        <div style={{ width: '100%', maxWidth: '1400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '60px' }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                style={{ textAlign: 'center' }}
            >
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '15px',
                    background: '#eff6ff',
                    padding: '12px 40px',
                    borderRadius: '50px',
                    marginBottom: '20px',
                    border: '1px solid #dbeafe',
                    color: '#1e40af'
                }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Come Funziona
                    </span>
                </div>
                <h2 style={{
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '-2px',
                    color: '#ffffff'
                }}>
                    Semplice & Veloce
                </h2>
            </motion.div>

            {/* Steps Container */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '20px' }}>

                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        {/* Step Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.4, type: 'spring', bounce: 0.5 }}
                            style={{
                                background: 'white',
                                borderRadius: '30px',
                                padding: '50px 30px',
                                width: '380px',
                                height: '420px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                                position: 'relative',
                                zIndex: 1
                            }}
                        >
                            <div style={{
                                background: '#f8fafc',
                                width: '140px',
                                height: '140px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '30px',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
                            }}>
                                {step.icon}
                            </div>

                            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 10px 0' }}>
                                {step.title}
                            </h3>

                            <p style={{ fontSize: '1.5rem', color: '#64748b', margin: '0 0 10px 0', fontWeight: 500 }}>
                                {step.desc}
                            </p>

                            <div style={{
                                background: index === 0 ? '#eff6ff' : index === 1 ? '#fefce8' : '#fdf2f8',
                                color: index === 0 ? '#2563eb' : index === 1 ? '#ca8a04' : '#db2777',
                                padding: '10px 25px',
                                borderRadius: '15px',
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {step.highlight}
                            </div>

                            {/* Step Number Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#1f2937',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 700
                            }}>
                                {index + 1}
                            </div>
                        </motion.div>

                        {/* Arrow (except after last step) */}
                        {index < steps.length - 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.4 + 0.2, duration: 0.5 }}
                            >
                                <ArrowRight size={50} color="#cbd5e1" strokeWidth={3} />
                            </motion.div>
                        )}
                    </React.Fragment>
                ))}

            </div>

        </div>
    )
}

export default HowItWorksSlide
