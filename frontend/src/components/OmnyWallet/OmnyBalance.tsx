import React from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { useOmnyBalance } from '../../hooks/useOmnyBalance'
import { omnyService } from '../../services/omnyService'
import './OmnyBalance.css'

interface OmnyBalanceProps {
    address: string | null
}

const OmnyBalance: React.FC<OmnyBalanceProps> = ({ address }) => {
    const { balance, isLoading, error, refetch } = useOmnyBalance(address)

    if (!address) {
        return (
            <div className="omny-balance-empty">
                <p>Connetti il wallet per visualizzare il saldo OMNY</p>
            </div>
        )
    }

    if (isLoading && !balance) {
        return (
            <div className="omny-balance-loading">
                <div className="spinner"></div>
                <p>Caricamento saldo...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="omny-balance-error">
                <p>{error}</p>
                <button onClick={refetch} className="btn-retry">
                    <RefreshCw size={16} />
                    Riprova
                </button>
            </div>
        )
    }

    const euroValue = balance ? omnyService.omnyToEuro(balance.formatted) : 0

    return (
        <div className="omny-balance-card">
            <div className="balance-header">
                <h3>Saldo OMNY</h3>
                <button onClick={refetch} className="btn-refresh" title="Aggiorna saldo">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="balance-amount">
                <TrendingUp className="balance-icon" size={32} />
                <div className="balance-value">
                    {balance ? omnyService.formatOmny(balance.formatted) : '0'}
                    <span className="balance-symbol">OMNY</span>
                </div>
            </div>

            <div className="balance-euro-equivalent">
                ≈ €{euroValue.toFixed(2)}
            </div>

            <div className="balance-hint">
                10 OMNY = €1.00
            </div>
        </div>
    )
}

export default OmnyBalance
