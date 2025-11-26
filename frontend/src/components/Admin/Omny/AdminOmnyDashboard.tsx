import React, { useState, useEffect } from 'react'
import {
    Coins,
    TrendingUp,
    Users,
    Building2,
    Activity,
    Globe,
    ShieldCheck,
    AlertCircle,
    Search,
    Filter,
    Download
} from 'lucide-react'
import { omnyService } from '../../../services/omnyService'
import { useWeb3 } from '../../../hooks/useWeb3'
import omnyLogo from '../../../assets/omnycoin-logo.png'
import './AdminOmnyDashboard.css'

const AdminOmnyDashboard: React.FC = () => {
    const { isConnected, address } = useWeb3()
    const [stats, setStats] = useState({
        totalSupply: '0',
        totalHolders: 0,
        totalTransactions: 0,
        marketCap: '0'
    })
    const [loading, setLoading] = useState(true)

    // Mock data for UI development
    useEffect(() => {
        // Simulate fetching blockchain data
        setTimeout(() => {
            setStats({
                totalSupply: '10,000,000',
                totalHolders: 1245,
                totalTransactions: 8543,
                marketCap: '€1,000,000'
            })
            setLoading(false)
        }, 1000)
    }, [])

    return (
        <div className="admin-omny-dashboard">
            {/* Header Section */}
            <div className="omny-admin-header">
                <div className="header-content">
                    <div className="header-icon">
                        <img
                            src={omnyLogo}
                            alt="OMNY Logo"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                    </div>
                    <div>
                        <h1>Gestione Globale OMNY</h1>
                        <p>Monitoraggio e gestione centralizzata del token OMNY su Polygon Network</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="network-status">
                        <div className="status-dot online"></div>
                        <span>Polygon Mainnet</span>
                    </div>
                    <button className="btn-primary">
                        <Activity size={18} />
                        Smart Contract
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="omny-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon supply">
                        <Coins size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Supply</span>
                        <span className="stat-value">{stats.totalSupply} OMNY</span>
                        <span className="stat-trend positive">+5.2% questo mese</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon holders">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Holders</span>
                        <span className="stat-value">{stats.totalHolders}</span>
                        <span className="stat-trend positive">+124 nuovi utenti</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon transactions">
                        <Activity size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Transazioni Totali</span>
                        <span className="stat-value">{stats.totalTransactions}</span>
                        <span className="stat-trend neutral">Ultimi 30 giorni</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon market">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Valore Stimato (Cap)</span>
                        <span className="stat-value">{stats.marketCap}</span>
                        <span className="stat-hint">10 OMNY = €1.00</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="omny-content-grid">
                {/* Left Column: Organizations List */}
                <div className="content-card organizations-list">
                    <div className="card-header">
                        <h3>Aziende Attive</h3>
                        <div className="card-actions">
                            <div className="search-input">
                                <Search size={16} />
                                <input type="text" placeholder="Cerca azienda..." />
                            </div>
                            <button className="btn-icon">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Azienda</th>
                                    <th>Wallet Address</th>
                                    <th>Saldo OMNY</th>
                                    <th>Stato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="org-cell">
                                                <div className="org-icon">
                                                    <Building2 size={16} />
                                                </div>
                                                <span>Azienda Demo {i}</span>
                                            </div>
                                        </td>
                                        <td className="mono-font">0x71C...9A2{i}</td>
                                        <td className="amount-cell">{(i * 1500).toLocaleString()} OMNY</td>
                                        <td>
                                            <span className="status-badge active">Attivo</span>
                                        </td>
                                        <td>
                                            <button className="btn-text">Dettagli</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Recent Activity & System Health */}
                <div className="right-column">
                    {/* Recent Global Transactions */}
                    <div className="content-card recent-activity">
                        <div className="card-header">
                            <h3>Attività Recente</h3>
                            <button className="btn-text">Vedi tutto</button>
                        </div>
                        <div className="activity-list">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="activity-item">
                                    <div className={`activity-icon ${i % 2 === 0 ? 'mint' : 'burn'}`}>
                                        {i % 2 === 0 ? <TrendingUp size={16} /> : <Download size={16} />}
                                    </div>
                                    <div className="activity-details">
                                        <span className="activity-title">
                                            {i % 2 === 0 ? 'Mint Rewards' : 'Burn Discount'}
                                        </span>
                                        <span className="activity-meta">Azienda Demo {i} • 2 min fa</span>
                                    </div>
                                    <div className={`activity-amount ${i % 2 === 0 ? 'positive' : 'negative'}`}>
                                        {i % 2 === 0 ? '+' : '-'}{i * 50} OMNY
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="content-card system-health">
                        <div className="card-header">
                            <h3>Stato Sistema</h3>
                        </div>
                        <div className="health-items">
                            <div className="health-item">
                                <div className="health-label">
                                    <Globe size={16} />
                                    <span>Polygon RPC</span>
                                </div>
                                <span className="health-status success">Operativo (12ms)</span>
                            </div>
                            <div className="health-item">
                                <div className="health-label">
                                    <ShieldCheck size={16} />
                                    <span>Smart Contract</span>
                                </div>
                                <span className="health-status success">Verificato</span>
                            </div>
                            <div className="health-item">
                                <div className="health-label">
                                    <AlertCircle size={16} />
                                    <span>Gas Tracker</span>
                                </div>
                                <span className="health-status warning">Standard (45 Gwei)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminOmnyDashboard
