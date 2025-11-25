/**
 * Coupons Management Panel
 *
 * Slide panel for managing coupons with dual Desktop/POS responsive design.
 * Follows same structure as GiftCertificatesPanel (500px desktop, 100vw POS).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Ticket,
  TrendingUp,
  DollarSign,
  Euro,
  CheckCircle,
  Clock,
  Plus,
  Search,
  QrCode,
  Eye,
  Zap,
  Tag,
  Percent
} from 'lucide-react';
import './CouponsPanel.css';
import { couponsService } from '../services/couponsService';
import type { Coupon, CouponStats, CreateCouponRequest } from '../types/coupon';
import CouponConfigPanel from './CouponConfigPanel';
import ValidateCouponModal from './ValidateCouponModal';
import CouponDetailsModal from './CouponDetailsModal';
import ConfirmationModal from './ConfirmationModal';

interface CouponsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const CouponsPanel: React.FC<CouponsPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats>({
    total_coupons: 0,
    active_coupons: 0,
    total_usage: 0,
    total_discount_given: 0,
    avg_discount_per_use: 0,
    expiring_soon_count: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'success' | 'error' | 'warning'>('success');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    if (isOpen && organizationId) {
      loadCoupons();
      loadStats();
    }
  }, [isOpen, organizationId]);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await couponsService.getAll(organizationId, {
        search_code: searchTerm || undefined
      });
      setCoupons(response.data);
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      setError('Errore nel caricamento dei coupon');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await couponsService.getStats(organizationId);
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Attivo', color: '#10b981' },
      expired: { label: 'Scaduto', color: '#ef4444' },
      cancelled: { label: 'Annullato', color: '#dc2626' },
      used: { label: 'Usato', color: '#6b7280' }
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

  const getCouponTypeBadge = (type: string, isFlash: boolean) => {
    const typeLabels: Record<string, string> = {
      percentage: '%',
      fixed_amount: '€',
      free_product: '🎁',
      buy_x_get_y: '1+1',
      free_shipping: '📦'
    };

    const icon = typeLabels[type] || '🎫';

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {isFlash && (
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '8px',
            fontSize: '0.65rem',
            fontWeight: 700,
            backgroundColor: '#f59e0b',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Zap size={12} /> FLASH
          </span>
        )}
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: '#f3f4f6',
          color: '#6b7280'
        }}>
          {icon}
        </span>
      </div>
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

  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else if (coupon.type === 'fixed_amount') {
      return formatCurrency(Number(coupon.value));
    } else {
      return String(coupon.value);
    }
  };

  // Modal handlers
  const handleIssueCoupon = async (data: CreateCouponRequest) => {
    try {
      const response = await couponsService.create(organizationId, data);
      if (response.success) {
        await loadCoupons();
        await loadStats();
        setShowIssueModal(false);

        setConfirmationType('success');
        setConfirmationTitle('Coupon Creato!');
        setConfirmationMessage(`Il coupon ${data.code} è stato creato con successo.`);
        setShowConfirmation(true);
      } else {
        setConfirmationType('error');
        setConfirmationTitle('Errore');
        setConfirmationMessage(response.error || 'Errore nella creazione del coupon');
        setShowConfirmation(true);
      }
      return response;
    } catch (error: any) {
      console.error('Error issuing coupon:', error);
      throw error;
    }
  };

  const handleValidateCoupon = async (code: string) => {
    try {
      const result = await couponsService.validate({
        code,
        customer_id: '', // Questo sarà fornito dal contesto reale
        purchase_amount: undefined
      });
      return result;
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  };

  // Handler for View Details button
  const handleViewDetails = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowDetailsModal(true);
  };

  // Handler for Cancel/Deactivate coupon
  const handleCancelCoupon = async (coupon: Coupon) => {
    try {
      const result = await couponsService.cancel(coupon.id);
      if (result.success) {
        await loadCoupons();
        await loadStats();

        setConfirmationType('success');
        setConfirmationTitle('Coupon Annullato');
        setConfirmationMessage(`Il coupon ${coupon.code} è stato annullato.`);
        setShowConfirmation(true);
      } else {
        setConfirmationType('error');
        setConfirmationTitle('Errore');
        setConfirmationMessage(result.error || 'Errore nell\'annullamento del coupon');
        setShowConfirmation(true);
      }
    } catch (error: any) {
      console.error('Error cancelling coupon:', error);
      setConfirmationType('error');
      setConfirmationTitle('Errore');
      setConfirmationMessage('Errore nell\'annullamento del coupon');
      setShowConfirmation(true);
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="coupons-panel-overlay" onClick={onClose} />

      <div className={`coupons-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="coupons-panel-header">
          <div className="coupons-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Ticket size={28} />
              <h2>Coupons</h2>
            </div>
          </div>
          <button onClick={onClose} className="coupons-panel-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Inner Container with max-width and margins */}
        <div className="coupons-panel-inner">
          {/* Quick Stats */}
          <div className="coupons-quick-stats">
          <div className="coupons-stat-item">
            <div className="coupons-stat-icon">
              <Ticket size={24} />
            </div>
            <div className="coupons-stat-number">{stats.active_coupons}</div>
            <div className="coupons-stat-label">Attivi</div>
          </div>
          <div className="coupons-stat-item">
            <div className="coupons-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="coupons-stat-number">{stats.total_usage}</div>
            <div className="coupons-stat-label">Utilizzi</div>
          </div>
          <div className="coupons-stat-item">
            <div className="coupons-stat-icon">
              <Euro size={24} />
            </div>
            <div className="coupons-stat-number" style={{ fontSize: '1.25rem' }}>
              {formatCurrency(stats.total_discount_given)}
            </div>
            <div className="coupons-stat-label">Sconto Dato</div>
          </div>
        </div>

        {/* Actions */}
        <div className="coupons-panel-actions">
          <button
            className="coupons-action-btn coupons-action-btn-primary"
            onClick={() => setShowIssueModal(true)}
          >
            <Plus size={20} />
            Nuovo Coupon
          </button>

          <button
            className="coupons-action-btn coupons-action-btn-secondary"
            onClick={() => setShowValidateModal(true)}
          >
            <QrCode size={20} />
            Valida Codice
          </button>
        </div>

        {/* Search */}
        <div className="coupons-search">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Cerca per codice o descrizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Coupons List */}
        <div className="coupons-list">
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1f2937',
            padding: '0 2rem'
          }}>
            Coupons ({filteredCoupons.length})
          </h3>

          {loading ? (
            <div className="loading-state">
              <Clock size={32} className="spinning" />
              <p>Caricamento...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="empty-state">
              <Ticket size={48} style={{ opacity: 0.3 }} />
              <p>Nessun coupon trovato</p>
            </div>
          ) : (
            filteredCoupons.map(coupon => (
              <div key={coupon.id} className="coupon-card">
                {/* Card Header */}
                <div className="coupon-card-header">
                  <div className="coupon-code-display">
                    {getCouponTypeBadge(coupon.type, coupon.is_flash || false)}
                    <span className="coupon-code">{coupon.code}</span>
                  </div>
                  {getStatusBadge(coupon.status)}
                </div>

                {/* Card Body */}
                <div className="coupon-card-body">
                  {/* Title & Description */}
                  <div className="coupon-info">
                    <h4 className="coupon-title">{coupon.title}</h4>
                    <p className="coupon-description">{coupon.description}</p>
                  </div>

                  {/* Discount Display */}
                  <div className="coupon-discount">
                    <span className="coupon-discount-label">Sconto:</span>
                    <span className="coupon-discount-value">{formatCouponValue(coupon)}</span>
                  </div>

                  {/* Usage Info */}
                  {coupon.usage_limit && (
                    <div className="coupon-usage">
                      <div className="coupon-usage-bar">
                        <div
                          className="coupon-usage-fill"
                          style={{
                            width: `${(coupon.current_usage / coupon.usage_limit) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="coupon-usage-text">
                        {coupon.current_usage} / {coupon.usage_limit} utilizzi
                      </span>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="coupon-dates">
                    <div className="coupon-date-item">
                      <span className="coupon-date-label">Valido dal:</span>
                      <span className="coupon-date-value">{formatDate(coupon.valid_from)}</span>
                    </div>
                    <div className="coupon-date-item">
                      <span className="coupon-date-label">al:</span>
                      <span className="coupon-date-value">{formatDate(coupon.valid_until)}</span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {coupon.min_purchase_amount && (
                    <div className="coupon-info-row">
                      <span className="coupon-info-label">Acquisto minimo:</span>
                      <span className="coupon-info-value">{formatCurrency(coupon.min_purchase_amount)}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="coupon-card-actions">
                  <button
                    className="coupon-action-btn"
                    title="Visualizza dettagli"
                    onClick={() => handleViewDetails(coupon)}
                  >
                    <Eye size={18} />
                  </button>
                  {coupon.status === 'active' && (
                    <>
                      <button
                        className="coupon-action-btn primary"
                        title="Valida"
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setShowValidateModal(true);
                        }}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        className="coupon-action-btn danger"
                        title="Annulla"
                        onClick={() => handleCancelCoupon(coupon)}
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Config Panel */}
      <CouponConfigPanel
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onSave={handleIssueCoupon}
        organizationId={organizationId}
        organizationName={organizationName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      <ValidateCouponModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onValidate={handleValidateCoupon}
        organizationId={organizationId}
        organizationName={organizationName}
        prefilledCode={selectedCoupon?.code}
      />

      <CouponDetailsModal
        isOpen={showDetailsModal}
        coupon={selectedCoupon}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCoupon(null);
        }}
        organizationName={organizationName}
      />

      <ConfirmationModal
        isOpen={showConfirmation}
        type={confirmationType}
        title={confirmationTitle}
        message={confirmationMessage}
        onClose={() => setShowConfirmation(false)}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </>
  );
};

export default CouponsPanel;
