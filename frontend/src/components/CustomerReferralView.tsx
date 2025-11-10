/**
 * Customer Referral View - Customer-facing Referral Dashboard
 * Vista per i clienti per gestire il proprio programma referral
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Mail,
  MessageCircle,
  QrCode,
  Gift,
  Users,
  TrendingUp,
  Award,
  Star,
  Crown,
  Trophy,
  Zap,
  Target,
  Check,
  X,
  Download,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import referralService, {
  ReferralProgram,
  ReferralConversion,
} from '../services/referralService';
import { useToast } from '../hooks/useToast';
import './CustomerReferralView.css';

interface CustomerReferralViewProps {
  customerId: string;
  organizationId: string;
}

const CustomerReferralView: React.FC<CustomerReferralViewProps> = ({
  customerId,
  organizationId,
}) => {
  const { showSuccess, showError } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Load data
  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programData, conversionsData] = await Promise.all([
        referralService.programs.getByCustomer(customerId),
        referralService.conversions.getByReferrer(customerId),
      ]);

      setProgram(programData);
      setConversions(conversionsData);
    } catch (error: any) {
      showError('Errore', error.message || 'Impossibile caricare i dati');
      console.error('Load referral data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate referral link
  const getReferralLink = () => {
    if (!program) return '';
    return `${window.location.origin}/referral/${program.referral_code}`;
  };

  // Share handlers
  const handleCopyLink = async () => {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      showSuccess('Copiato!', 'Link referral copiato negli appunti');

      // Track share
      if (program) {
        await referralService.programs.trackShare(program.id, 'social');
      }
    } catch (error) {
      showError('Errore', 'Impossibile copiare il link');
    }
  };

  const handleShareWhatsApp = async () => {
    const message = `Ciao! Ti invito a provare questo servizio fantastico. Usa il mio codice referral: ${program?.referral_code}\n\n${getReferralLink()}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Track share
    if (program) {
      await referralService.programs.trackShare(program.id, 'whatsapp');
    }
  };

  const handleShareEmail = async () => {
    const subject = 'Ti invito a provare questo servizio!';
    const body = `Ciao!\n\nTi invito a provare questo fantastico servizio. Usa il mio codice referral: ${program?.referral_code}\n\nLink: ${getReferralLink()}\n\nGrazie!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    // Track share
    if (program) {
      await referralService.programs.trackShare(program.id, 'email');
    }
  };

  const handleShowQR = async () => {
    try {
      const link = getReferralLink();
      const qrUrl = await QRCodeLib.toDataURL(link, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrUrl);
      setShowQRModal(true);

      // Track share
      if (program) {
        await referralService.programs.trackShare(program.id, 'qr_code');
      }
    } catch (error) {
      showError('Errore', 'Impossibile generare il QR Code');
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `referral-${program?.referral_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get tier icon
  const getTierIcon = (iconName?: string) => {
    switch (iconName) {
      case 'star':
        return <Star size={32} />;
      case 'award':
        return <Award size={32} />;
      case 'crown':
        return <Crown size={32} />;
      case 'trophy':
        return <Trophy size={32} />;
      case 'zap':
        return <Zap size={32} />;
      default:
        return <Star size={32} />;
    }
  };

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    if (!program || !program.current_tier || !program.next_tier) {
      return { percentage: 0, remaining: 0 };
    }

    const currentThreshold = program.current_tier.threshold;
    const nextThreshold = program.next_tier.threshold;
    const currentReferrals = program.successful_referrals;

    const remaining = Math.max(0, nextThreshold - currentReferrals);
    const progress = currentReferrals - currentThreshold;
    const total = nextThreshold - currentThreshold;
    const percentage = Math.min(100, (progress / total) * 100);

    return { percentage, remaining };
  };

  if (loading) {
    return (
      <div className="customer-referral-loading">
        <div className="spinner"></div>
        <p>Caricamento...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="customer-referral-empty">
        <Gift size={64} />
        <h2>Programma Referral Non Attivo</h2>
        <p>Contatta l'organizzazione per attivare il tuo programma referral.</p>
      </div>
    );
  }

  const progress = getProgressToNextTier();

  return (
    <div className="customer-referral-view">
      {/* Header with Referral Code */}
      <div className="referral-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Sparkles size={32} />
          </div>
          <h1>Il Tuo Codice Referral</h1>
          <div className="referral-code-display">
            <span className="code">{program.referral_code}</span>
            <button className="btn-copy-code" onClick={handleCopyLink}>
              <Copy size={20} />
            </button>
          </div>
          <p className="hero-subtitle">Condividi con i tuoi amici e guadagna premi!</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="referral-stats-grid">
        <div className="stat-card gradient-blue">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{program.successful_referrals}</div>
            <div className="stat-label">Referral Completati</div>
          </div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-icon">
            <Gift size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{program.total_points_earned}</div>
            <div className="stat-label">Punti Guadagnati</div>
          </div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{program.conversion_rate.toFixed(1)}%</div>
            <div className="stat-label">Tasso Conversione</div>
          </div>
        </div>
      </div>

      {/* Current Tier */}
      {program.current_tier && (
        <div className="current-tier-card" style={{ borderColor: program.current_tier.color }}>
          <div className="tier-header" style={{ background: program.current_tier.color }}>
            <div className="tier-icon">{getTierIcon(program.current_tier.icon)}</div>
            <h3>{program.current_tier.name}</h3>
          </div>
          <div className="tier-body">
            <div className="tier-rewards">
              <div className="reward-item">
                <Gift size={18} />
                <span>{program.current_tier.points_per_referral} punti per referral</span>
              </div>
              {program.current_tier.discount_percentage > 0 && (
                <div className="reward-item">
                  <Award size={18} />
                  <span>{program.current_tier.discount_percentage}% sconto</span>
                </div>
              )}
            </div>

            {program.current_tier.special_perks && program.current_tier.special_perks.length > 0 && (
              <div className="tier-perks">
                <h4>Vantaggi Speciali:</h4>
                <ul>
                  {program.current_tier.special_perks.map((perk, i) => (
                    <li key={i}>
                      <Check size={16} />
                      {perk.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progress to Next Tier */}
            {program.next_tier && (
              <div className="tier-progress">
                <div className="progress-header">
                  <span>Prossimo livello: {program.next_tier.name}</span>
                  <span className="progress-remaining">
                    <Target size={16} />
                    {progress.remaining} referral rimanenti
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress.percentage}%`,
                      background: program.next_tier.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Section */}
      <div className="share-section">
        <h2>
          <Share2 size={24} />
          Condividi il Tuo Codice
        </h2>
        <div className="share-buttons">
          <button className="share-btn whatsapp" onClick={handleShareWhatsApp}>
            <MessageCircle size={24} />
            <span>WhatsApp</span>
          </button>
          <button className="share-btn email" onClick={handleShareEmail}>
            <Mail size={24} />
            <span>Email</span>
          </button>
          <button className="share-btn copy" onClick={handleCopyLink}>
            <Copy size={24} />
            <span>Copia Link</span>
          </button>
          <button className="share-btn qr" onClick={handleShowQR}>
            <QrCode size={24} />
            <span>QR Code</span>
          </button>
        </div>
      </div>

      {/* Referral History */}
      <div className="referral-history">
        <h2>
          <Users size={24} />
          I Tuoi Referral
        </h2>
        {conversions.length > 0 ? (
          <div className="conversions-list">
            {conversions.map((conversion) => (
              <div key={conversion.id} className="conversion-card">
                <div className="conversion-status">
                  {conversion.status === 'completed' ? (
                    <div className="status-badge completed">
                      <Check size={16} />
                      Completato
                    </div>
                  ) : (
                    <div className="status-badge pending">
                      <Star size={16} />
                      In Attesa
                    </div>
                  )}
                </div>
                <div className="conversion-info">
                  <div className="conversion-name">{conversion.referee?.name || 'Nuovo Referral'}</div>
                  <div className="conversion-meta">
                    <span className="conversion-source">{conversion.source}</span>
                    <span className="conversion-date">
                      {new Date(conversion.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {conversion.points_awarded > 0 && (
                  <div className="conversion-points">
                    <Gift size={18} />
                    +{conversion.points_awarded} punti
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-conversions">
            <Users size={48} />
            <p>Nessun referral ancora. Inizia a condividere il tuo codice!</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>Il Tuo QR Code Referral</h3>
              <button className="close-button" onClick={() => setShowQRModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="qr-modal-body">
              <div className="qr-code-container">
                <img src={qrCodeUrl} alt="QR Code Referral" />
              </div>
              <div className="qr-code-info">
                <p>Fai scansionare questo QR code per condividere il tuo referral</p>
                <div className="qr-code-display">
                  <span>{program.referral_code}</span>
                </div>
              </div>
              <button className="btn-download-qr" onClick={handleDownloadQR}>
                <Download size={20} />
                Scarica QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReferralView;
