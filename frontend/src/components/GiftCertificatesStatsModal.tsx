/**
 * Gift Certificates Statistics Modal
 *
 * Shows detailed statistics and analytics for gift certificates for a specific organization
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Euro,
  Users,
  BarChart3
} from 'lucide-react';
import { giftCertificatesService } from '../services/giftCertificatesService';
import type { GiftCertificate, GiftCertificateStats } from '../types/giftCertificate';
import './GiftCertificatesStatsModal.css';

interface GiftCertificatesStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

const GiftCertificatesStatsModal: React.FC<GiftCertificatesStatsModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GiftCertificateStats>({
    total_issued: 0,
    total_value_issued: 0,
    active_count: 0,
    active_balance: 0,
    total_redeemed: 0,
    fully_used_count: 0,
    expired_count: 0,
    avg_certificate_value: 0,
    redemption_rate: 0
  });
  const [certificates, setCertificates] = useState<GiftCertificate[]>([]);

  useEffect(() => {
    if (isOpen && organizationId) {
      loadData();
    }
  }, [isOpen, organizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, certsResponse] = await Promise.all([
        giftCertificatesService.getStats(organizationId),
        giftCertificatesService.getAll(organizationId)
      ]);
      setStats(statsData);
      setCertificates(certsResponse.data);
    } catch (error) {
      console.error('Error loading gift certificate stats:', error);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate additional statistics
  const activeCerts = certificates.filter(c =>
    c.current_balance > 0 && c.current_balance === c.original_amount
  );

  const redeemedCerts = certificates.filter(c =>
    c.status === 'partially_used' ||
    c.status === 'fully_used' ||
    c.current_balance < c.original_amount
  );

  const totalRedeemed = certificates.reduce((sum, cert) => {
    return sum + (cert.original_amount - cert.current_balance);
  }, 0);

  const averageRedemptionAmount = redeemedCerts.length > 0
    ? totalRedeemed / redeemedCerts.length
    : 0;

  if (!isOpen) return null;

  return (
    <>
      <div className="gift-stats-modal-overlay" onClick={onClose} />
      <div className="gift-stats-panel open">
        {/* Header */}
        <div className="gift-stats-header">
          <div>
            <h2>Statistiche Gift Certificates</h2>
            <p className="gift-stats-org-name">{organizationName}</p>
          </div>
          <button onClick={onClose} className="gift-stats-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="gift-stats-content">
          {loading ? (
            <div className="gift-stats-loading">
              <Clock size={32} className="spinning" />
              <p>Caricamento statistiche...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="gift-stats-summary">
                <div className="gift-stats-card primary">
                  <div className="gift-stats-card-icon">
                    <CreditCard size={28} />
                  </div>
                  <div className="gift-stats-card-content">
                    <div className="gift-stats-card-label">Certificati Emessi</div>
                    <div className="gift-stats-card-value">{stats.total_issued}</div>
                    <div className="gift-stats-card-subtitle">
                      Valore totale: {formatCurrency(stats.total_value_issued)}
                    </div>
                  </div>
                </div>

                <div className="gift-stats-card success">
                  <div className="gift-stats-card-icon">
                    <CheckCircle size={28} />
                  </div>
                  <div className="gift-stats-card-content">
                    <div className="gift-stats-card-label">Certificati Attivi</div>
                    <div className="gift-stats-card-value">{stats.active_count}</div>
                    <div className="gift-stats-card-subtitle">
                      Saldo disponibile: {formatCurrency(stats.active_balance)}
                    </div>
                  </div>
                </div>

                <div className="gift-stats-card warning">
                  <div className="gift-stats-card-icon">
                    <Euro size={28} />
                  </div>
                  <div className="gift-stats-card-content">
                    <div className="gift-stats-card-label">Importo Riscosso</div>
                    <div className="gift-stats-card-value">{formatCurrency(totalRedeemed)}</div>
                    <div className="gift-stats-card-subtitle">
                      Da {redeemedCerts.length} certificati
                    </div>
                  </div>
                </div>

                <div className="gift-stats-card info">
                  <div className="gift-stats-card-icon">
                    <TrendingUp size={28} />
                  </div>
                  <div className="gift-stats-card-content">
                    <div className="gift-stats-card-label">Tasso Utilizzo</div>
                    <div className="gift-stats-card-value">{formatPercentage(stats.redemption_rate)}</div>
                    <div className="gift-stats-card-subtitle">
                      {redeemedCerts.length} certificati utilizzati
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats Grid */}
              <div className="gift-stats-grid">
                <div className="gift-stats-metric">
                  <div className="gift-stats-metric-label">
                    <BarChart3 size={18} />
                    Valore Medio Certificato
                  </div>
                  <div className="gift-stats-metric-value">
                    {formatCurrency(stats.avg_certificate_value)}
                  </div>
                </div>

                <div className="gift-stats-metric">
                  <div className="gift-stats-metric-label">
                    <Euro size={18} />
                    Importo Medio Riscosso
                  </div>
                  <div className="gift-stats-metric-value">
                    {formatCurrency(averageRedemptionAmount)}
                  </div>
                </div>

                <div className="gift-stats-metric">
                  <div className="gift-stats-metric-label">
                    <CheckCircle size={18} />
                    Completamente Utilizzati
                  </div>
                  <div className="gift-stats-metric-value">
                    {stats.fully_used_count}
                  </div>
                </div>

                <div className="gift-stats-metric">
                  <div className="gift-stats-metric-label">
                    <XCircle size={18} />
                    Scaduti
                  </div>
                  <div className="gift-stats-metric-value">
                    {stats.expired_count}
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="gift-stats-section">
                <h3 className="gift-stats-section-title">
                  <BarChart3 size={20} />
                  Distribuzione Stati
                </h3>
                <div className="gift-stats-breakdown">
                  <div className="gift-stats-breakdown-item">
                    <div className="gift-stats-breakdown-bar">
                      <div
                        className="gift-stats-breakdown-fill active"
                        style={{ width: `${(activeCerts.length / stats.total_issued) * 100}%` }}
                      />
                    </div>
                    <div className="gift-stats-breakdown-label">
                      <span className="gift-stats-breakdown-name">Attivi (non utilizzati)</span>
                      <span className="gift-stats-breakdown-count">
                        {activeCerts.length} ({formatPercentage((activeCerts.length / stats.total_issued) * 100)})
                      </span>
                    </div>
                  </div>

                  <div className="gift-stats-breakdown-item">
                    <div className="gift-stats-breakdown-bar">
                      <div
                        className="gift-stats-breakdown-fill redeemed"
                        style={{ width: `${(redeemedCerts.length / stats.total_issued) * 100}%` }}
                      />
                    </div>
                    <div className="gift-stats-breakdown-label">
                      <span className="gift-stats-breakdown-name">Riscattati (parziale/totale)</span>
                      <span className="gift-stats-breakdown-count">
                        {redeemedCerts.length} ({formatPercentage((redeemedCerts.length / stats.total_issued) * 100)})
                      </span>
                    </div>
                  </div>

                  <div className="gift-stats-breakdown-item">
                    <div className="gift-stats-breakdown-bar">
                      <div
                        className="gift-stats-breakdown-fill expired"
                        style={{ width: `${(stats.expired_count / stats.total_issued) * 100}%` }}
                      />
                    </div>
                    <div className="gift-stats-breakdown-label">
                      <span className="gift-stats-breakdown-name">Scaduti</span>
                      <span className="gift-stats-breakdown-count">
                        {stats.expired_count} ({formatPercentage((stats.expired_count / stats.total_issued) * 100)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="gift-stats-section">
                <h3 className="gift-stats-section-title">
                  <DollarSign size={20} />
                  Riepilogo Finanziario
                </h3>
                <div className="gift-stats-financial">
                  <div className="gift-stats-financial-row">
                    <span className="gift-stats-financial-label">Valore Totale Emesso:</span>
                    <span className="gift-stats-financial-value">
                      {formatCurrency(stats.total_value_issued)}
                    </span>
                  </div>
                  <div className="gift-stats-financial-row">
                    <span className="gift-stats-financial-label">Valore Già Riscosso:</span>
                    <span className="gift-stats-financial-value success">
                      {formatCurrency(totalRedeemed)}
                    </span>
                  </div>
                  <div className="gift-stats-financial-row">
                    <span className="gift-stats-financial-label">Saldo Residuo Disponibile:</span>
                    <span className="gift-stats-financial-value warning">
                      {formatCurrency(stats.active_balance)}
                    </span>
                  </div>
                  <div className="gift-stats-financial-row total">
                    <span className="gift-stats-financial-label">Percentuale Riscossa:</span>
                    <span className="gift-stats-financial-value">
                      {formatPercentage((totalRedeemed / stats.total_value_issued) * 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="gift-stats-info-note">
                <Calendar size={18} />
                <span>
                  Le statistiche mostrano i dati aggiornati per tutti i gift certificates emessi da questa organizzazione.
                  Per visualizzare i dettagli di ogni certificato, utilizza il gestionale gift certificates.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GiftCertificatesStatsModal;
