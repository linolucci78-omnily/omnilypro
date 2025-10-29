import React, { useState, useEffect } from 'react';
import { X, Users, Euro, TrendingUp, Calendar } from 'lucide-react';
import { subscriptionsService } from '../services/subscriptionsService';
import type { SubscriptionStats } from '../types/subscription';
import './SubscriptionStatsModal.css';

interface SubscriptionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

const SubscriptionStatsModal: React.FC<SubscriptionStatsModalProps> = ({
  isOpen,
  onClose,
  organizationId
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SubscriptionStats>({
    total_active: 0,
    total_paused: 0,
    total_expired: 0,
    total_cancelled: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    total_usages: 0,
    monthly_usages: 0,
    expiring_soon: 0,
    avg_subscription_value: 0,
    renewal_rate: 0
  });

  useEffect(() => {
    if (isOpen && organizationId) {
      loadStats();
    }
  }, [isOpen, organizationId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await subscriptionsService.getStats(organizationId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="subscription-stats-modal-overlay" onClick={onClose} />
      <div className="subscription-stats-modal">
        <div className="subscription-stats-modal-header">
          <h2>Statistiche Abbonamenti</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="subscription-stats-modal-content">
          {loading ? (
            <div className="loading-state">
              <Calendar size={32} className="spinning" />
              <p>Caricamento...</p>
            </div>
          ) : (
            <div className="stats-view">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-icon active">
                    <Users size={24} />
                  </div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{stats.total_active}</div>
                    <div className="stat-card-label">Membership Attive</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon revenue">
                    <Euro size={24} />
                  </div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{formatCurrency(stats.total_revenue)}</div>
                    <div className="stat-card-label">Ricavi Totali</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon usage">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{stats.total_usages}</div>
                    <div className="stat-card-label">Utilizzi Totali</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon expiring">
                    <Calendar size={24} />
                  </div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{stats.expiring_soon}</div>
                    <div className="stat-card-label">In Scadenza (7gg)</div>
                  </div>
                </div>
              </div>

              <div className="stats-details">
                <div className="stats-detail-row">
                  <span>Valore Medio Abbonamento:</span>
                  <span className="stats-detail-value">
                    {formatCurrency(stats.avg_subscription_value)}
                  </span>
                </div>
                <div className="stats-detail-row">
                  <span>In Pausa:</span>
                  <span className="stats-detail-value">{stats.total_paused}</span>
                </div>
                <div className="stats-detail-row">
                  <span>Scaduti:</span>
                  <span className="stats-detail-value">{stats.total_expired}</span>
                </div>
                <div className="stats-detail-row">
                  <span>Annullati:</span>
                  <span className="stats-detail-value">{stats.total_cancelled}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionStatsModal;
