/**
 * Gift Certificate Details Modal
 *
 * Modal for viewing complete gift certificate details including
 * transaction history, recipient info, and redemption tracking
 */

import React from 'react';
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  MessageSquare,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import './GiftCertificateDetailsModal.css';
import type { GiftCertificate } from '../types/giftCertificate';

interface GiftCertificateDetailsModalProps {
  isOpen: boolean;
  certificate: GiftCertificate | null;
  onClose: () => void;
  organizationName: string;
}

const GiftCertificateDetailsModal: React.FC<GiftCertificateDetailsModalProps> = ({
  isOpen,
  certificate,
  onClose,
  organizationName
}) => {
  if (!isOpen || !certificate) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        padding: '0.5rem 1rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: `${badge.color}20`,
        color: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  const usagePercentage = ((certificate.original_amount - certificate.current_balance) / certificate.original_amount) * 100;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />

      <div className="gc-details-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <CreditCard size={24} />
            <h2>📋 Dettagli Gift Certificate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Code & Status */}
          <div className="details-section">
            <div className="section-header">
              <h3>Informazioni Generali</h3>
            </div>

            <div className="detail-grid">
              <div className="detail-item full-width">
                <div className="detail-label">
                  <CreditCard size={18} />
                  Codice Gift Certificate
                </div>
                <div className="detail-value code-display">
                  {certificate.code}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <FileText size={18} />
                  Stato
                </div>
                <div className="detail-value">
                  {getStatusBadge(certificate.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="details-section">
            <div className="section-header">
              <h3>Importi</h3>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <TrendingUp size={18} />
                  Importo Originale
                </div>
                <div className="detail-value amount">
                  {formatCurrency(certificate.original_amount)}
                </div>
              </div>

              <div className="detail-item highlight">
                <div className="detail-label">
                  <DollarSign size={18} />
                  Saldo Attuale
                </div>
                <div className="detail-value amount large">
                  {formatCurrency(certificate.current_balance)}
                </div>
              </div>

              <div className="detail-item full-width">
                <div className="detail-label">
                  Utilizzo
                </div>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: `${usagePercentage}%` }} />
                </div>
                <div className="usage-text">
                  {usagePercentage.toFixed(1)}% utilizzato ({formatCurrency(certificate.original_amount - certificate.current_balance)})
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          {(certificate.recipient_name || certificate.recipient_email || certificate.recipient_phone) && (
            <div className="details-section">
              <div className="section-header">
                <h3>Beneficiario</h3>
              </div>

              <div className="detail-grid">
                {certificate.recipient_name && (
                  <div className="detail-item">
                    <div className="detail-label">
                      <User size={18} />
                      Nome
                    </div>
                    <div className="detail-value">
                      {certificate.recipient_name}
                    </div>
                  </div>
                )}

                {certificate.recipient_email && (
                  <div className="detail-item">
                    <div className="detail-label">
                      <Mail size={18} />
                      Email
                    </div>
                    <div className="detail-value">
                      {certificate.recipient_email}
                    </div>
                  </div>
                )}

                {certificate.recipient_phone && (
                  <div className="detail-item">
                    <div className="detail-label">
                      <Phone size={18} />
                      Telefono
                    </div>
                    <div className="detail-value">
                      {certificate.recipient_phone}
                    </div>
                  </div>
                )}

                {certificate.personal_message && (
                  <div className="detail-item full-width">
                    <div className="detail-label">
                      <MessageSquare size={18} />
                      Messaggio Personale
                    </div>
                    <div className="detail-value message">
                      {certificate.personal_message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="details-section">
            <div className="section-header">
              <h3>Date Importanti</h3>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <Calendar size={18} />
                  Emesso il
                </div>
                <div className="detail-value">
                  {formatDate(certificate.issued_at)}
                </div>
              </div>

              {certificate.valid_until && (
                <div className="detail-item">
                  <div className="detail-label">
                    <Clock size={18} />
                    Valido fino al
                  </div>
                  <div className="detail-value">
                    {formatDate(certificate.valid_until)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {certificate.metadata && Object.keys(certificate.metadata).length > 0 && (
            <div className="details-section">
              <div className="section-header">
                <h3>Informazioni Aggiuntive</h3>
              </div>
              <div className="metadata-content">
                <pre>{JSON.stringify(certificate.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Chiudi
          </button>
        </div>
      </div>
    </>
  );
};

export default GiftCertificateDetailsModal;
