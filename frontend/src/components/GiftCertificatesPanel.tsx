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
  Euro,
  CheckCircle,
  Clock,
  Plus,
  Search,
  QrCode,
  Printer,
  Mail,
  Eye,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import './GiftCertificatesPanel.css';
import { giftCertificatesService } from '../services/giftCertificatesService';
import { createPrintService } from '../services/printService';
import type { GiftCertificate, GiftCertificateStats, CreateGiftCertificateRequest } from '../types/giftCertificate';
import IssueGiftCertificateModal from './IssueGiftCertificateModal';
import ValidateGiftCertificateModal from './ValidateGiftCertificateModal';
import RedeemGiftCertificateModal from './RedeemGiftCertificateModal';
import GiftCertificateDetailsModal from './GiftCertificateDetailsModal';

interface GiftCertificatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  printService?: any; // ZCSPrintService instance
}


const GiftCertificatesPanel: React.FC<GiftCertificatesPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  printService
}) => {
  // Debug logging for print service
  useEffect(() => {
    console.log('🔍 GiftCertificatesPanel - printService:', !!printService);
    console.log('🔍 GiftCertificatesPanel - printService object:', printService);
  }, [printService]);

  const [searchTerm, setSearchTerm] = useState('');
  const [certificates, setCertificates] = useState<GiftCertificate[]>([]);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<GiftCertificate | null>(null);

  useEffect(() => {
    if (isOpen && organizationId) {
      loadCertificates();
      loadStats();
    }
  }, [isOpen, organizationId]);

  const loadCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await giftCertificatesService.getAll(organizationId, {
        search_code: searchTerm || undefined
      });
      setCertificates(response.data);
    } catch (error: any) {
      console.error('Error loading certificates:', error);
      setError('Errore nel caricamento dei gift certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await giftCertificatesService.getStats(organizationId);
      setStats(data);
    } catch (error: any) {
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

  // Modal handlers
  const handleIssueGiftCertificate = async (data: CreateGiftCertificateRequest) => {
    try {
      const response = await giftCertificatesService.create(data);
      await loadCertificates();
      await loadStats();
      setShowIssueModal(false);
      return response;
    } catch (error: any) {
      console.error('Error issuing gift certificate:', error);
      throw error;
    }
  };

  const handleValidateGiftCertificate = async (code: string) => {
    try {
      const result = await giftCertificatesService.validate({
        code,
        organization_id: organizationId
      });
      return result;
    } catch (error: any) {
      console.error('Error validating gift certificate:', error);
      throw error;
    }
  };

  const handleOpenRedeemModal = (certificate: GiftCertificate) => {
    setSelectedCertificate(certificate);
    setShowValidateModal(false);
    setShowRedeemModal(true);
  };

  const handleRedeemGiftCertificate = async (amount: number) => {
    if (!selectedCertificate) return;

    try {
      await giftCertificatesService.redeem({
        code: selectedCertificate.code,
        organization_id: organizationId,
        amount
      });

      await loadCertificates();
      await loadStats();
      setShowRedeemModal(false);
      setSelectedCertificate(null);
    } catch (error: any) {
      console.error('Error redeeming gift certificate:', error);
      throw error;
    }
  };

  // Handler for View Details button
  const handleViewDetails = (certificate: GiftCertificate) => {
    setSelectedCertificate(certificate);
    setShowDetailsModal(true);
  };

  // Handler for Print Voucher button (POS with printer)
  const handlePrintVoucher = async (certificate: GiftCertificate) => {
    console.log('🖨️ handlePrintVoucher called');

    try {
      // Create print service on-the-fly (same approach as sales and new gift certificates)
      console.log('🖨️ Creating printService on-the-fly...');
      const printConfig = {
        storeName: organizationName,
        storeAddress: '',
        storePhone: '',
        storeTax: '',
        paperWidth: 384, // 58mm
        fontSizeNormal: 24,
        fontSizeLarge: 30,
        printDensity: 0
      };

      const printService = createPrintService(printConfig);
      const initialized = await printService.initialize();

      if (!initialized) {
        console.warn('⚠️ Print service initialization failed, generating PDF instead');
        await handleDownloadPDF(certificate);
        return;
      }

      console.log('🖨️ Calling printService.printGiftCertificate...');
      const printed = await printService.printGiftCertificate({
        code: certificate.code,
        amount: certificate.original_amount,
        recipientName: certificate.recipient_name,
        recipientEmail: certificate.recipient_email,
        validUntil: certificate.valid_until,
        personalMessage: certificate.personal_message,
        issuedAt: certificate.issued_at,
        organizationName
      });

      if (printed) {
        console.log('✅ Print completed successfully');
      } else {
        console.error('❌ Print failed');
      }
    } catch (error) {
      console.error('❌ Print error:', error);
      // Fallback to PDF if printing fails
      await handleDownloadPDF(certificate);
    }
  };

  // Handler for Download PDF (Desktop alternative)
  const handleDownloadPDF = async (certificate: GiftCertificate) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(certificate.code, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H'
      });

      // Add content to PDF
      pdf.setFontSize(24);
      pdf.text('🎁 GIFT CERTIFICATE 🎁', 105, 30, { align: 'center' });

      pdf.setFontSize(16);
      pdf.text(organizationName, 105, 45, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text('_______________________________________________', 105, 50, { align: 'center' });

      pdf.setFontSize(20);
      pdf.text('BUONO REGALO', 105, 65, { align: 'center' });

      const formattedAmount = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(certificate.original_amount);

      pdf.setFontSize(28);
      pdf.text(`VALORE: ${formattedAmount}`, 105, 80, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text('_______________________________________________', 105, 85, { align: 'center' });

      // Certificate details
      pdf.setFontSize(11);
      let yPos = 100;

      pdf.text(`Codice: ${certificate.code}`, 20, yPos);
      yPos += 8;

      const issuedDate = new Date(certificate.issued_at).toLocaleDateString('it-IT');
      pdf.text(`Emesso il: ${issuedDate}`, 20, yPos);
      yPos += 8;

      if (certificate.valid_until) {
        const validDate = new Date(certificate.valid_until).toLocaleDateString('it-IT');
        pdf.text(`Valido fino al: ${validDate}`, 20, yPos);
        yPos += 8;
      }

      if (certificate.recipient_name) {
        yPos += 5;
        pdf.text(`Beneficiario: ${certificate.recipient_name}`, 20, yPos);
        yPos += 8;
      }

      if (certificate.recipient_email) {
        pdf.text(`Email: ${certificate.recipient_email}`, 20, yPos);
        yPos += 8;
      }

      if (certificate.personal_message) {
        yPos += 5;
        pdf.text('Messaggio:', 20, yPos);
        yPos += 8;
        const splitMessage = pdf.splitTextToSize(certificate.personal_message, 170);
        pdf.text(splitMessage, 20, yPos);
        yPos += splitMessage.length * 6;
      }

      // Add QR code
      yPos += 10;
      pdf.addImage(qrCodeDataURL, 'PNG', 55, yPos, 100, 100);

      yPos += 110;
      pdf.setFontSize(10);
      pdf.text('Presenta questo voucher per utilizzare il buono', 105, yPos, { align: 'center' });
      pdf.text('Scansiona il QR code per riscattare rapidamente', 105, yPos + 6, { align: 'center' });

      // Save PDF
      pdf.save(`gift-certificate-${certificate.code}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  // Handler for Send Email button
  const handleSendEmail = async (certificate: GiftCertificate) => {
    if (!certificate.recipient_email) {
      console.warn('No recipient email available');
      return;
    }

    try {
      // Email sending is handled automatically by backend when enabled in settings
      // This button is just visual feedback that email can be resent
      console.log('Email notification triggered for certificate:', certificate.code);

      // TODO: Implement resend email API endpoint if needed
      // await giftCertificatesService.resendEmail(certificate.id);
    } catch (error) {
      console.error('Email error:', error);
    }
  };

  // Handler for Validate button
  const handleValidateFromCard = (certificate: GiftCertificate) => {
    setSelectedCertificate(certificate);
    setShowValidateModal(true);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CreditCard size={28} />
              <h2>Gift Certificates</h2>
            </div>
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
              <Euro size={24} />
            </div>
            <div className="gift-certificates-stat-number" style={{ fontSize: '1.25rem' }}>
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
            onClick={() => setShowIssueModal(true)}
          >
            <Plus size={20} />
            Nuovo Gift Certificate
          </button>

          <button
            className="gift-certificates-action-btn gift-certificates-action-btn-secondary"
            onClick={() => setShowValidateModal(true)}
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
                  <button
                    className="cert-action-btn"
                    title="Visualizza dettagli"
                    onClick={() => handleViewDetails(cert)}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="cert-action-btn"
                    title="Stampa voucher"
                    onClick={() => handlePrintVoucher(cert)}
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    className="cert-action-btn"
                    title="Invia email"
                    onClick={() => handleSendEmail(cert)}
                    disabled={!cert.recipient_email}
                  >
                    <Mail size={18} />
                  </button>
                  <button
                    className="cert-action-btn primary"
                    title="Valida"
                    onClick={() => handleValidateFromCard(cert)}
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <IssueGiftCertificateModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onIssue={handleIssueGiftCertificate}
        organizationId={organizationId}
        organizationName={organizationName}
        presetAmounts={[25, 50, 100, 150, 200, 500]}
        printService={printService}
      />

      <ValidateGiftCertificateModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onValidate={handleValidateGiftCertificate}
        onRedeem={handleOpenRedeemModal}
        organizationId={organizationId}
        organizationName={organizationName}
        printService={printService}
      />

      <RedeemGiftCertificateModal
        isOpen={showRedeemModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowRedeemModal(false);
          setSelectedCertificate(null);
        }}
        onRedeem={handleRedeemGiftCertificate}
        organizationId={organizationId}
        organizationName={organizationName}
        printService={printService}
      />

      <GiftCertificateDetailsModal
        isOpen={showDetailsModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCertificate(null);
        }}
        organizationName={organizationName}
      />
    </>
  );
};

export default GiftCertificatesPanel;
