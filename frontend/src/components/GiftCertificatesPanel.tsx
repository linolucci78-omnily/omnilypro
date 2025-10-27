/**
 * Gift Certificates Management Panel
 *
 * Slide panel for managing gift certificates with dual Desktop/POS responsive design.
 * Follows same structure as CustomerSlidePanel (500px desktop, 100vw POS).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Plus,
  Search,
  QrCode,
  Printer,
  Mail,
  Eye
} from 'lucide-react';
import './GiftCertificatesPanel.css';

interface GiftCertificatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

interface GiftCertificate {
  id: string;
  code: string;
  original_amount: number;
  current_balance: number;
  status: 'active' | 'partially_used' | 'fully_used' | 'expired' | 'cancelled';
  recipient_name?: string;
  recipient_email?: string;
  issued_at: string;
  valid_until?: string;
}

const GiftCertificatesPanel: React.FC<GiftCertificatesPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [certificates, setCertificates] = useState<GiftCertificate[]>([]);
  const [stats, setStats] = useState({
    total_issued: 0,
    total_value_issued: 0,
    active_balance: 0,
    redemption_rate: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && organizationId) {
      loadCertificates();
      loadStats();
    }
  }, [isOpen, organizationId]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      // const data = await giftCertificatesService.getAll(organizationId);
      // setCertificates(data);

      // Mock data for now
      setCertificates([
        {
          id: '1',
          code: 'GIFT-A8F9-K3L7-M2N4',
          original_amount: 50,
          current_balance: 15,
          status: 'partially_used',
          recipient_name: 'Mario Rossi',
          recipient_email: 'mario@example.com',
          issued_at: '2024-11-01T10:00:00Z',
          valid_until: '2025-12-31T23:59:59Z'
        },
        {
          id: '2',
          code: 'GIFT-B3K8-P9M2-L4N7',
          original_amount: 100,
          current_balance: 100,
          status: 'active',
          recipient_name: 'Laura Bianchi',
          recipient_email: 'laura@example.com',
          issued_at: '2024-10-15T14:30:00Z',
          valid_until: '2025-10-15T23:59:59Z'
        }
      ]);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Implement API call
      // const data = await giftCertificatesService.getStats(organizationId);
      // setStats(data);

      // Mock data
      setStats({
        total_issued: 147,
        total_value_issued: 12500,
        active_balance: 8400,
        redemption_rate: 76
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Attivo', color: '#10b981' },
      partially_used: { label: 'Parzialmente Usato', color: '#f59e0b' },
      fully_used: { label: 'Completamente Usato', color: '#6b7280' },
      expired: { label: 'Scaduto', color: '#ef4444' },
      cancelled: { label: 'Annullato', color: '#dc2626' }
    };

    const badge = badges[status as keyof typeof badges] || badges.active;

    return (
      <span style={{
        padding: '0.375rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: `${badge.color}20`,
        color: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="gift-certificates-panel-overlay" onClick={onClose} />

      <div className={`gift-certificates-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="gift-certificates-panel-header">
          <div className="gift-certificates-header-info">
            <h2>🎁 Gift Certificates</h2>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              {organizationName}
            </p>
          </div>
          <button onClick={onClose} className="gift-certificates-panel-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="gift-certificates-quick-stats">
          <div className="gift-certificates-stat-item">
            <div className="gift-certificates-stat-icon">
              <CreditCard size={24} />
            </div>
            <div className="gift-certificates-stat-number">{stats.total_issued}</div>
            <div className="gift-certificates-stat-label">Emessi</div>
          </div>
          <div className="gift-certificates-stat-item">
            <div className="gift-certificates-stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="gift-certificates-stat-number">
              {formatCurrency(stats.active_balance)}
            </div>
            <div className="gift-certificates-stat-label">In Uso</div>
          </div>
          <div className="gift-certificates-stat-item">
            <div className="gift-certificates-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="gift-certificates-stat-number">{stats.redemption_rate}%</div>
            <div className="gift-certificates-stat-label">Riscossi</div>
          </div>
        </div>

        {/* Actions */}
        <div className="gift-certificates-panel-actions">
          <button
            className="gift-certificates-action-btn gift-certificates-action-btn-primary"
            onClick={() => {/* TODO: Open new certificate modal */}}
          >
            <Plus size={20} />
            Nuovo Gift Certificate
          </button>

          <button
            className="gift-certificates-action-btn gift-certificates-action-btn-secondary"
            onClick={() => {/* TODO: Open validate modal */}}
          >
            <QrCode size={20} />
            Valida Codice
          </button>
        </div>

        {/* Search */}
        <div className="gift-certificates-search">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Cerca per codice, nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Certificates List */}
        <div className="gift-certificates-list">
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1f2937',
            padding: '0 2rem'
          }}>
            Gift Certificates ({filteredCertificates.length})
          </h3>

          {loading ? (
            <div className="loading-state">
              <Clock size={32} className="spinning" />
              <p>Caricamento...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} style={{ opacity: 0.3 }} />
              <p>Nessun gift certificate trovato</p>
            </div>
          ) : (
            filteredCertificates.map(cert => (
              <div key={cert.id} className="gift-certificate-card">
                {/* Card Header */}
                <div className="cert-card-header">
                  <div className="cert-code-display">
                    <CreditCard size={20} />
                    <span className="cert-code">{cert.code}</span>
                  </div>
                  {getStatusBadge(cert.status)}
                </div>

                {/* Card Body */}
                <div className="cert-card-body">
                  {/* Amount Display */}
                  <div className="cert-amounts">
                    <div className="cert-amount-item">
                      <span className="cert-amount-label">Originale:</span>
                      <span className="cert-amount-value">{formatCurrency(cert.original_amount)}</span>
                    </div>
                    <div className="cert-amount-item highlight">
                      <span className="cert-amount-label">Residuo:</span>
                      <span className="cert-amount-value">{formatCurrency(cert.current_balance)}</span>
                    </div>
                  </div>

                  {/* Recipient Info */}
                  {cert.recipient_name && (
                    <div className="cert-info-row">
                      <span className="cert-info-label">Beneficiario:</span>
                      <span className="cert-info-value">{cert.recipient_name}</span>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="cert-dates">
                    <div className="cert-date-item">
                      <span className="cert-date-label">Emesso:</span>
                      <span className="cert-date-value">{formatDate(cert.issued_at)}</span>
                    </div>
                    {cert.valid_until && (
                      <div className="cert-date-item">
                        <span className="cert-date-label">Scade:</span>
                        <span className="cert-date-value">{formatDate(cert.valid_until)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="cert-card-actions">
                  <button className="cert-action-btn" title="Visualizza dettagli">
                    <Eye size={18} />
                  </button>
                  <button className="cert-action-btn" title="Stampa voucher">
                    <Printer size={18} />
                  </button>
                  <button className="cert-action-btn" title="Invia email">
                    <Mail size={18} />
                  </button>
                  <button className="cert-action-btn primary" title="Valida">
                    <CheckCircle size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default GiftCertificatesPanel;
