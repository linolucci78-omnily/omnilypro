import React from 'react'
import { Users, Gift, TrendingUp, Share2, Award } from 'lucide-react'
import './ReferralSlide.css'

interface ReferralSlideProps {
    organizationName?: string
    primaryColor?: string
    secondaryColor?: string
}

const ReferralSlide: React.FC<ReferralSlideProps> = ({
    organizationName = 'OMNILY PRO',
    primaryColor = '#ea580c',
    secondaryColor = '#fcd34d'
}) => {
    return (
        <div className="tv-slide-wrapper">
            <div className="referral-slide-container">

                {/* Header */}
                <div className="referral-header animate-fade-in" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '30px 40px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div className="referral-badge" style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}>
                        <Users size={28} color="white" />
                    </div>
                    <h2 className="referral-title" style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        Programma Referral
                    </h2>
                    <p className="referral-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Invita i tuoi amici e guadagna insieme!
                    </p>
                </div>

                {/* Content Grid */}
                <div className="referral-content-grid">

                    {/* Step 1 */}
                    <div className="referral-step animate-slide-in" style={{ animationDelay: '100ms' }}>
                        <div className="referral-step-number" style={{
                            background: primaryColor
                        }}>
                            1
                        </div>
                        <div className="referral-step-icon" style={{
                            background: `${primaryColor}20`,
                            color: primaryColor
                        }}>
                            <Share2 size={32} />
                        </div>
                        <h3 className="referral-step-title" style={{ color: 'white' }}>
                            Condividi
                        </h3>
                        <p className="referral-step-description" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Invita i tuoi amici con il tuo codice personale
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="referral-step animate-slide-in" style={{ animationDelay: '200ms' }}>
                        <div className="referral-step-number" style={{
                            background: primaryColor
                        }}>
                            2
                        </div>
                        <div className="referral-step-icon" style={{
                            background: `${primaryColor}20`,
                            color: primaryColor
                        }}>
                            <Users size={32} />
                        </div>
                        <h3 className="referral-step-title" style={{ color: 'white' }}>
                            Iscrivono
                        </h3>
                        <p className="referral-step-description" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            I tuoi amici si iscrivono usando il tuo codice
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="referral-step animate-slide-in" style={{ animationDelay: '300ms' }}>
                        <div className="referral-step-number" style={{
                            background: primaryColor
                        }}>
                            3
                        </div>
                        <div className="referral-step-icon" style={{
                            background: `${secondaryColor}20`,
                            color: secondaryColor
                        }}>
                            <Gift size={32} />
                        </div>
                        <h3 className="referral-step-title" style={{ color: 'white' }}>
                            Premi per entrambi
                        </h3>
                        <p className="referral-step-description" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Ricevete entrambi punti bonus extra
                        </p>
                    </div>

                    {/* Step 4 */}
                    <div className="referral-step animate-slide-in" style={{ animationDelay: '400ms' }}>
                        <div className="referral-step-number" style={{
                            background: primaryColor
                        }}>
                            4
                        </div>
                        <div className="referral-step-icon" style={{
                            background: `${secondaryColor}20`,
                            color: secondaryColor
                        }}>
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="referral-step-title" style={{ color: 'white' }}>
                            Accumula premi
                        </h3>
                        <p className="referral-step-description" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Più amici inviti, più premi ottieni
                        </p>
                    </div>

                </div>

                {/* CTA Footer */}
                <div className="referral-cta animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <div className="referral-cta-box" style={{
                        background: `linear-gradient(135deg, ${primaryColor}dd, ${secondaryColor}dd)`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Award size={36} color="white" style={{ marginBottom: '10px' }} />
                        <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0' }}>
                            Inizia Oggi!
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', margin: 0 }}>
                            Chiedi il tuo codice referral in cassa
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default ReferralSlide
