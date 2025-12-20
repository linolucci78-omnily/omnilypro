import React from 'react'
import { QrCode, Gift, ArrowRight } from 'lucide-react'
import './GetCardSlide.css'

interface GetCardSlideProps {
    organizationName?: string
    primaryColor?: string
    secondaryColor?: string
}

const GetCardSlide: React.FC<GetCardSlideProps> = ({
    organizationName = 'OMNILY PRO',
    primaryColor = '#ea580c',
    secondaryColor = '#fcd34d'
}) => {
    return (
        <div className="tv-slide-wrapper">
            <div className="tv-slide-horizontal" style={{ display: 'flex', flexDirection: 'row', gap: '60px', alignItems: 'center', padding: '60px 80px 0 80px' }}>

                {/* Text Content - LEFT */}
                <div className="get-card-text-content animate-slide-in">
                    <span className="get-card-badge" style={{ color: 'white', background: 'rgba(0,0,0,0.6)' }}>
                        NON HAI ANCORA LA TESSERA?
                    </span>

                    <h2 className="get-card-title" style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        Entra nel Club &<br />ricevi premi.
                    </h2>

                    <div className="get-card-benefits">
                        <div className="get-card-benefit-item" style={{ color: 'white' }}>
                            <div className="get-card-benefit-icon blue"><Gift size={40} /></div>
                            <span>50 Punti Benvenuto immediati</span>
                        </div>
                        <div className="get-card-benefit-item" style={{ color: 'white' }}>
                            <div className="get-card-benefit-icon green"><ArrowRight size={40} /></div>
                            <span>Accumula punti su ogni acquisto</span>
                        </div>
                    </div>
                </div>

                {/* Visual / QR - RIGHT */}
                <div
                    className="get-card-visual-container animate-scale-in"
                    style={{ animationDelay: '300ms' }}
                >
                    <div className="get-card-perspective">
                        {/* 3D Floating Card Effect */}
                        <div
                            className="get-card-3d"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                            }}
                        >
                            <div className="get-card-3d-header">
                                <span className="get-card-3d-brand">{organizationName.toUpperCase()}</span>
                                <QrCode size={40} opacity={0.8} color="rgba(255,255,255,0.8)" />
                            </div>

                            <div className="get-card-3d-number">
                                <span>•••• •••• •••• 1234</span>
                            </div>

                            <div className="get-card-3d-footer">
                                <div className="get-card-3d-member-info">
                                    <span className="get-card-3d-member-label">MEMBER</span>
                                    <span className="get-card-3d-member-name">NUOVO CLIENTE</span>
                                </div>
                                <Gift size={40} color="rgba(255,255,255,0.9)" />
                            </div>
                        </div>

                        {/* Call to Action */}
                        <h3 className="get-card-cta-title" style={{ color: 'white' }}>
                            RICHIEDILA IN CASSA
                        </h3>
                        <p className="get-card-cta-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Attivazione immediata • 100% Gratuita
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default GetCardSlide
