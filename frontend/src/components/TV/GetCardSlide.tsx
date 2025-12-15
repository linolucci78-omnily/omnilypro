import React from 'react'
import { motion } from 'framer-motion'
import { QrCode, Gift, ArrowRight } from 'lucide-react'

const GetCardSlide: React.FC = () => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1400px', display: 'flex', alignItems: 'center', gap: '80px' }}>

                {/* Text Content */}
                <motion.div
                    style={{ flex: 1, textAlign: 'left' }}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <span style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--tv-primary)',
                        background: 'rgba(255,255,255,0.8)',
                        padding: '10px 30px',
                        borderRadius: '50px',
                        display: 'inline-block',
                        marginBottom: '30px'
                    }}>
                        NON HAI ANCORA LA TESSERA?
                    </span>

                    <h2 style={{
                        fontSize: '5.5rem',
                        lineHeight: 1.1,
                        marginBottom: '40px',
                        background: 'linear-gradient(135deg, var(--tv-primary), var(--tv-secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: 900
                    }}>
                        Entra nel Club &<br />ricevi premi.
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '2rem', fontWeight: 500, color: '#4b5563' }}>
                            <div style={{ padding: '15px', background: '#dbeafe', borderRadius: '50%', color: '#2563eb' }}><Gift size={40} /></div>
                            <span>50 Punti Benvenuto immediati</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '2rem', fontWeight: 500, color: '#4b5563' }}>
                            <div style={{ padding: '15px', background: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}><ArrowRight size={40} /></div>
                            <span>Accumula punti su ogni acquisto</span>
                        </div>
                    </div>
                </motion.div>

                {/* Visual / QR */}
                <motion.div
                    style={{ flex: 0.8 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                >
                    <div style={{
                        position: 'relative',
                        perspective: '1000px'
                    }}>
                        {/* 3D Floating Card Effect - Fixed Vertical Position */}
                        <motion.div
                            animate={{
                                rotateY: [0, 5, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                width: '500px',
                                height: '300px',
                                background: 'linear-gradient(135deg, var(--tv-primary), var(--tv-secondary))',
                                borderRadius: '24px',
                                padding: '30px',
                                color: 'white',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                marginBottom: '40px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, opacity: 0.9 }}>OMNILY PRO</span>
                                <QrCode size={40} opacity={0.8} />
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: '2rem', letterSpacing: '4px', opacity: 0.8 }}>•••• •••• •••• 1234</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.7, display: 'block' }}>MEMBER</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>NUOVO CLIENTE</span>
                                </div>
                                <Gift size={40} />
                            </div>
                        </motion.div>

                        {/* New Call to Action */}
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--tv-primary)', margin: 0 }}>
                            RICHIEDILA IN CASSA
                        </h3>
                        <p style={{ fontSize: '1.5rem', color: '#6b7280', marginTop: '10px' }}>
                            Attivazione immediata • 100% Gratuita
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}

export default GetCardSlide
