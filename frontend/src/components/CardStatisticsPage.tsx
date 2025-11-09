import React, { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, Users, TrendingUp, Award, Activity } from 'lucide-react'
import { nfcCardsApi } from '../lib/supabase'
import './CardStatisticsPage.css'

interface CardStatisticsPageProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
  onBack: () => void
}

interface Stats {
  totalCards: number
  assignedCards: number
  unassignedCards: number
  customersWithCards: number
}

const CardStatisticsPage: React.FC<CardStatisticsPageProps> = ({
  organizationId,
  primaryColor,
  secondaryColor,
  onBack
}) => {
  const [stats, setStats] = useState<Stats>({
    totalCards: 0,
    assignedCards: 0,
    unassignedCards: 0,
    customersWithCards: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [organizationId])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const cards = await nfcCardsApi.getAll(organizationId)

      const assignedCards = cards.filter(card => card.customer_id).length
      const customersWithCards = new Set(cards.filter(card => card.customer_id).map(card => card.customer_id)).size

      setStats({
        totalCards: cards.length,
        assignedCards: assignedCards,
        unassignedCards: cards.length - assignedCards,
        customersWithCards: customersWithCards
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="card-statistics-page"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="statistics-header">
        <button className="statistics-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Torna alle Impostazioni
        </button>
        <div className="statistics-header-content">
          <div className="statistics-icon">
            <Activity size={48} />
          </div>
          <div>
            <h1>Statistiche Tessere Punti</h1>
            <p>Visualizza le performance e l'utilizzo delle tessere</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="statistics-content">
        {loading ? (
          <div className="statistics-loading">
            <div className="spinner"></div>
            <p>Caricamento statistiche...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="statistics-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <CreditCard size={32} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalCards}</div>
                  <div className="stat-label">Tessere Totali</div>
                  <div className="stat-description">Tessere registrate nel sistema</div>
                </div>
              </div>

              <div className="stat-card assigned">
                <div className="stat-icon">
                  <Award size={32} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.assignedCards}</div>
                  <div className="stat-label">Tessere Assegnate</div>
                  <div className="stat-description">Tessere attive con cliente</div>
                </div>
              </div>

              <div className="stat-card unassigned">
                <div className="stat-icon">
                  <CreditCard size={32} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.unassignedCards}</div>
                  <div className="stat-label">Tessere Disponibili</div>
                  <div className="stat-description">Tessere da assegnare</div>
                </div>
              </div>

              <div className="stat-card customers">
                <div className="stat-icon">
                  <Users size={32} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.customersWithCards}</div>
                  <div className="stat-label">Clienti con Tessera</div>
                  <div className="stat-description">Clienti attivi con tessera punti</div>
                </div>
              </div>
            </div>

            {/* Usage Rate */}
            <div className="usage-section">
              <h2>Tasso di Utilizzo</h2>
              <div className="usage-bar-container">
                <div className="usage-bar">
                  <div
                    className="usage-bar-fill"
                    style={{
                      width: stats.totalCards > 0
                        ? `${(stats.assignedCards / stats.totalCards) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <div className="usage-percentage">
                  {stats.totalCards > 0
                    ? `${Math.round((stats.assignedCards / stats.totalCards) * 100)}%`
                    : '0%'
                  } delle tessere sono assegnate
                </div>
              </div>
            </div>

            {/* Info Box */}
            {stats.unassignedCards > 0 && (
              <div className="info-box">
                <TrendingUp size={24} />
                <div>
                  <h3>Opportunità di Crescita</h3>
                  <p>
                    Hai ancora <strong>{stats.unassignedCards} tessere disponibili</strong> da assegnare ai tuoi clienti.
                    Aumenta il coinvolgimento assegnando tessere ai clienti più fedeli!
                  </p>
                </div>
              </div>
            )}

            {stats.totalCards === 0 && (
              <div className="empty-state">
                <CreditCard size={64} />
                <h3>Nessuna Tessera Registrata</h3>
                <p>Inizia a registrare le tessere NFC o QR Code per vedere le statistiche qui.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CardStatisticsPage
