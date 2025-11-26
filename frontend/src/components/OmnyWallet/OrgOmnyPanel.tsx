import React, { useState, useEffect } from 'react'
import {
    Coins,
    TrendingUp,
    Gift,
    Search,
    Filter,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    User
} from 'lucide-react'
import { omnyService } from '../../services/omnyService'
import { useWeb3 } from '../../hooks/useWeb3'
import omnyLogo from '../../assets/omnycoin-logo.png'
import './OrgOmnyPanel.css'

interface OrgOmnyPanelProps {
    organizationId: string
    primaryColor: string
    secondaryColor: string
}

const OrgOmnyPanel: React.FC<OrgOmnyPanelProps> = ({
    organizationId,
    primaryColor,
    secondaryColor
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'rewards'>('overview')

    return (
        <div className="org-omny-panel" style={{
            '--primary-color': primaryColor,
            '--secondary-color': secondaryColor
        } as React.CSSProperties}>

            {/* Header with Organization Balance */}
            <div className="org-omny-header">
                <div className="header-left">
                    <div className="header-icon-wrapper">
                        <img
                            src={omnyLogo}
                            alt="OMNY Logo"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                    </div>
                    <div>
                        <h1>Gestione OMNY Rewards</h1>
                        <p>Gestisci i premi e visualizza le transazioni dei tuoi clienti</p>
                    </div>
                </div>

                <div className="org-balance-card">
                    <span className="balance-label">Saldo Aziendale Disponibile</span>
                    <div className="balance-value-row">
                        <span className="balance-amount">5,000</span>
                        <span className="balance-symbol">OMNY</span>
                    </div>
                    <button className="btn-topup">
                        <Download size={16} /> Ricarica
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="omny-tabs">
                <button
                    className={`omny-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Panoramica
                </button>
                <button
                    className={`omny-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transazioni
                </button>
                <button
                    className={`omny-tab ${activeTab === 'rewards' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rewards')}
                >
                    Assegna Premi
                </button>
            </div>

            {/* Content Area */}
            <div className="omny-panel-content">
                {activeTab === 'overview' && (
                    <div className="overview-grid">
                        {/* Quick Stats */}
                        <div className="stats-row">
                            <div className="stat-box">
                                <div className="stat-icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <span className="stat-label">Distribuiti (Mese)</span>
                                    <span className="stat-number">1,250 OMNY</span>
                                </div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-icon-box" style={{ background: '#f0fdf4', color: '#166534' }}>
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <span className="stat-label">Premi Assegnati</span>
                                    <span className="stat-number">45</span>
                                </div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-icon-box" style={{ background: '#fff7ed', color: '#c2410c' }}>
                                    <Coins size={20} />
                                </div>
                                <div>
                                    <span className="stat-label">Sconti Utilizzati</span>
                                    <span className="stat-number">320 OMNY</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions List */}
                        <div className="section-container">
                            <div className="section-header">
                                <h3>Ultime Transazioni</h3>
                                <button className="btn-link" onClick={() => setActiveTab('transactions')}>Vedi tutte</button>
                            </div>
                            <div className="transactions-list">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="transaction-item">
                                        <div className={`tx-icon ${i % 2 === 0 ? 'in' : 'out'}`}>
                                            {i % 2 === 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div className="tx-details">
                                            <span className="tx-customer">Mario Rossi</span>
                                            <span className="tx-type">{i % 2 === 0 ? 'Acquisto #1234' : 'Riscatto Premio'}</span>
                                        </div>
                                        <div className="tx-meta">
                                            <span className={`tx-amount ${i % 2 === 0 ? 'positive' : 'negative'}`}>
                                                {i % 2 === 0 ? '+' : '-'}{i * 10} OMNY
                                            </span>
                                            <span className="tx-date">Oggi, 10:30</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="transactions-view">
                        <div className="filters-bar">
                            <div className="search-box">
                                <Search size={18} />
                                <input type="text" placeholder="Cerca cliente o transazione..." />
                            </div>
                            <div className="filter-actions">
                                <button className="btn-filter">
                                    <Filter size={18} /> Filtra
                                </button>
                                <button className="btn-export">
                                    <Download size={18} /> Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="full-transactions-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Cliente</th>
                                        <th>Tipo</th>
                                        <th>Importo</th>
                                        <th>Stato</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <tr key={i}>
                                            <td>
                                                <div className="date-cell">
                                                    <Clock size={14} />
                                                    <span>26 Nov 2025</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="customer-cell">
                                                    <div className="customer-avatar">MR</div>
                                                    <span>Mario Rossi</span>
                                                </div>
                                            </td>
                                            <td>{i % 2 === 0 ? 'Guadagno (Acquisto)' : 'Spesa (Sconto)'}</td>
                                            <td className={i % 2 === 0 ? 'text-green' : 'text-red'}>
                                                {i % 2 === 0 ? '+' : '-'}{i * 15} OMNY
                                            </td>
                                            <td><span className="badge-success">Completato</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="rewards-view">
                        <div className="reward-form-card">
                            <h3>Assegna OMNY Manualmente</h3>
                            <p>Invia OMNY come premio speciale o bonus a un cliente.</p>

                            <div className="form-group">
                                <label>Seleziona Cliente</label>
                                <div className="customer-select">
                                    <Search size={18} />
                                    <input type="text" placeholder="Cerca per nome, email o telefono..." />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Importo OMNY</label>
                                    <input type="number" placeholder="0.00" className="amount-input" />
                                </div>
                                <div className="form-group">
                                    <label>Motivazione</label>
                                    <select>
                                        <option>Bonus Fedeltà</option>
                                        <option>Compensazione</option>
                                        <option>Promozione Speciale</option>
                                        <option>Altro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Note Interne (Opzionale)</label>
                                <textarea placeholder="Aggiungi una nota per il registro..."></textarea>
                            </div>

                            <div className="form-actions">
                                <button className="btn-cancel">Annulla</button>
                                <button className="btn-submit">
                                    <Gift size={18} /> Invia Premio
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OrgOmnyPanel
