import React from 'react'
import { Star } from 'lucide-react'
import { Reward } from '../../services/tvService'
import './RewardsSlide.css'

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
        <div className="tv-slide-vertical">

            {/* 3D Header */}
            <div className="rewards-header animate-scale-in">
                <h2 className="rewards-title">
                    Premi Esclusivi
                </h2>
                <div className="rewards-divider"></div>
            </div>

            {/* 3D Cards Container */}
            <div className="rewards-cards-container">
                {prizes.map((prize, i) => (
                    <div
                        key={prize.id}
                        className="rewards-card animate-3d-card"
                        style={{
                            animationDelay: `${i * 200}ms`
                        }}
                    >
                        {/* Image Layer popping out */}
                        <div className="rewards-card-image-container">
                            <img
                                src={prize.image}
                                alt={prize.title}
                                className="rewards-card-image"
                            />
                            {/* Gradient Overlay */}
                            <div className="rewards-card-image-overlay"></div>
                        </div>

                        {/* Content Layer */}
                        <div className="rewards-card-content">
                            <h3 className="rewards-card-title">
                                {prize.title}
                            </h3>

                            <div className="rewards-card-points-badge">
                                <Star size={20} fill="#f59e0b" color="#f59e0b" />
                                <span className="rewards-card-points-value">
                                    {prize.points}
                                </span>
                            </div>
                        </div>

                        {/* Floating Badge (Premium Gold Gradient) */}
                        {prize.tier && (
                            <div className="rewards-card-tier-badge">
                                {prize.tier.toUpperCase()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RewardsSlide
