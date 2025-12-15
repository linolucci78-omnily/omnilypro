import React from 'react'
import { motion } from 'framer-motion'
import { Gift, Star } from 'lucide-react'
import { Reward } from '../../services/tvService'

const PRIZES = [
    {
        id: "1",
        title: "Pizza Margherita",
        points: 500,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
        tier: "Base"
    },
    {
        id: "2",
        title: "Caffè Speciale",
        points: 150,
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
        tier: "Base"
    },
    {
        id: "3",
        title: "T-Shirt VIP",
        points: 1200,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
        tier: "Gold"
    }
]

interface RewardsSlideProps {
    rewards?: Reward[]
}

const RewardsSlide: React.FC<RewardsSlideProps> = ({ rewards }) => {
    // Use real rewards if available, otherwise fallback to mock
    const prizes = rewards && rewards.length > 0 ? rewards : PRIZES

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

            {/* 3D Header */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: '40px', textAlign: 'center', zIndex: 10 }}
            >
                <h2 style={{
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                    textShadow: '0 10px 20px rgba(0,0,0,0.5)',
                    margin: 0
                }}>
                    Premi Esclusivi
                </h2>
                <div style={{
                    width: '180px',
                    height: '5px',
                    background: 'linear-gradient(90deg, transparent, #ea580c, transparent)',
                    margin: '15px auto'
                }}></div>
            </motion.div>

            {/* 3D Cards Container */}
            <div style={{
                display: 'flex',
                gap: '60px',
                perspective: '2000px', // Deep perspective
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {prizes.map((prize, i) => (
                    <motion.div
                        key={prize.id}
                        initial={{ opacity: 0, rotateY: 45, x: 100 }}
                        animate={{ opacity: 1, rotateY: 0, x: 0 }}
                        transition={{
                            delay: i * 0.2,
                            type: 'spring',
                            stiffness: 60,
                            damping: 12
                        }}
                        whileHover={{ scale: 1.05, rotateY: -5, zIndex: 100 }}
                        style={{
                            width: '320px',
                            height: '440px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '30px',
                            overflow: 'hidden',
                            position: 'relative',
                            transformStyle: 'preserve-3d',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                        }}
                    >
                        {/* Image Layer popping out */}
                        <div style={{
                            height: '60%',
                            width: '100%',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <img
                                src={prize.image}
                                alt={prize.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.5s'
                                }}
                            />
                            {/* Gradient Overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '50%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                            }}></div>
                        </div>

                        {/* Content Layer */}
                        <div style={{
                            padding: '25px',
                            color: 'white',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '40%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4))'
                        }}>
                            <h3 style={{
                                fontSize: '1.6rem',
                                fontWeight: 800,
                                margin: '0 0 8px 0',
                                textShadow: '0 4px 10px rgba(0,0,0,0.8)',
                                lineHeight: 1.2
                            }}>
                                {prize.title}
                            </h3>

                            <div style={{
                                background: '#fff',
                                padding: '8px 20px',
                                borderRadius: '50px',
                                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: 'auto',
                                transform: 'translateY(-8px)'
                            }}>
                                <Star size={20} fill="#f59e0b" color="#f59e0b" />
                                <span style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 900,
                                    color: '#b45309',
                                    fontVariantNumeric: 'tabular-nums'
                                }}>
                                    {prize.points}
                                </span>
                            </div>
                        </div>

                        {/* Floating Badge (Premium Gold Gradient) */}
                        {prize.tier && (
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
                                color: '#78350f',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                                border: '1px solid #fff'
                            }}>
                                {prize.tier.toUpperCase()}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default RewardsSlide
