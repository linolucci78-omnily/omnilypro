import React from 'react'
import { Euro, Coins, Gift, ArrowRight } from 'lucide-react'
import './HowItWorksSlide.css'

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
        <div className="tv-slide-vertical how-it-works-container">

            {/* Header */}
            <div className="how-it-works-header animate-scale-in">
                <div className="how-it-works-badge">
                    <span className="how-it-works-badge-text">
                        Come Funziona
                    </span>
                </div>
                <h2 className="how-it-works-title">
                    Semplice & Veloce
                </h2>
            </div>

            {/* Steps Container */}
            <div className="how-it-works-steps">

                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        {/* Step Card */}
                        <div
                            className="how-it-works-step-card animate-podium"
                            style={{
                                animationDelay: `${index * 400}ms`
                            }}
                        >
                            <div className="how-it-works-icon-circle">
                                {step.icon}
                            </div>

                            <h3 className="how-it-works-step-title">
                                {step.title}
                            </h3>

                            <p className="how-it-works-step-desc">
                                {step.desc}
                            </p>

                            <div className={`how-it-works-step-highlight ${index === 0 ? 'blue' : index === 1 ? 'yellow' : 'pink'}`}>
                                {step.highlight}
                            </div>

                            {/* Step Number Badge */}
                            <div className="how-it-works-step-badge">
                                {index + 1}
                            </div>
                        </div>

                        {/* Arrow (except after last step) */}
                        {index < steps.length - 1 && (
                            <div
                                className="how-it-works-arrow animate-fade-in"
                                style={{ animationDelay: `${index * 400 + 200}ms` }}
                            >
                                <ArrowRight size={50} color="#cbd5e1" strokeWidth={3} />
                            </div>
                        )}
                    </React.Fragment>
                ))}

            </div>

        </div>
    )
}

export default HowItWorksSlide
