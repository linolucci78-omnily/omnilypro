import React from 'react'
import { Coins, TrendingUp, Gift, Zap, Info } from 'lucide-react'
import { useWeb3 } from '../../hooks/useWeb3'
import ConnectMetaMask from './ConnectMetaMask'
import OmnyBalance from './OmnyBalance'
import { FEATURES } from '../../config/features'
import omnyLogo from '../../assets/omnycoin-logo.png'
import './OmnyWalletHub.css'

interface OmnyWalletHubProps {
    organizationId: string
    primaryColor: string
    secondaryColor: string
}

const OmnyWalletHub: React.FC<OmnyWalletHubProps> = ({
    organizationId,
    primaryColor,
    secondaryColor
}) => {
    const { isConnected, address } = useWeb3()

    // Feature flag check (backup - dovrebbe essere controllato anche dal routing)
    if (!FEATURES.OMNY_WALLET) {
        return null
    }

    return (
        <div
            className="omny-wallet-hub"
            style={{
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor
            } as React.CSSProperties}
        >
            {/* Header */}
            <div className="omny-header">
                <div className="omny-header-content">
                    <div className="omny-icon">
                        <img
                            src={omnyLogo}
                            alt="OMNY Logo"
                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />
                    </div>
                    <div>
                        <h1>🪙 OMNY Wallet</h1>
                        <p>Il tuo portafoglio rewards basato su blockchain Polygon</p>
                    </div>
                </div>
                <div className="omny-badge-beta">BETA</div>
            </div>

            {/* Connessione MetaMask */}
            <div className="omny-connect-section">
                <ConnectMetaMask />
            </div>

            {/* Saldo OMNY */}
            {isConnected && address && (
                <div className="omny-balance-section">
                    <OmnyBalance address={address} />
                </div>
            )}

            {/* Info Cards */}
            <div className="omny-info-grid">
                <div className="omny-info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3>Guadagna OMNY</h3>
                        <p>Ottieni 10 OMNY per ogni €1 speso</p>
                    </div>
                </div>

                <div className="omny-info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <Gift size={24} />
                    </div>
                    <div>
                        <h3>Spendi OMNY</h3>
                        <p>Usa i tuoi OMNY per ottenere sconti (10 OMNY = €1)</p>
                    </div>
                </div>

                <div className="omny-info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                        <Zap size={24} />
                    </div>
                    <div>
                        <h3>Blockchain Sicura</h3>
                        <p>I tuoi token sono protetti su Polygon Network</p>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="omny-info-box">
                <Info size={20} />
                <div>
                    <h4>Come funziona OMNY?</h4>
                    <ul>
                        <li>OMNY è un token ERC-20 sulla blockchain Polygon</li>
                        <li>Ogni acquisto ti fa guadagnare OMNY automaticamente</li>
                        <li>Puoi spendere i tuoi OMNY per ottenere sconti immediati</li>
                        <li>I token sono nel tuo wallet personale - solo tu ne hai il controllo</li>
                    </ul>
                </div>
            </div>

            {/* Funzionalità future (disabilitate) */}
            {!FEATURES.OMNY_EARN && !FEATURES.OMNY_SPEND && (
                <div className="omny-coming-soon">
                    <h3>🚀 Prossimamente</h3>
                    <p>Le funzionalità di earn e spend OMNY saranno attivate presto!</p>
                </div>
            )}
        </div>
    )
}

export default OmnyWalletHub
