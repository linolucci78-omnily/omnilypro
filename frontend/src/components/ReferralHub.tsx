/**
 * Referral Hub - Advanced Referral System Dashboard
 * Sistema referral professionale con gamification, analytics, e social sharing
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  Share2,
  Gift,
  Crown,
  Zap,
  Target,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Mail,
  MessageCircle,
  QrCode,
  ChevronRight,
  Trophy,
  Star,
  ArrowLeft,
  Check,
  X,
  Download,
  ExternalLink,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import referralService, {
  ReferralTier,
  ReferralProgram,
  ReferralStats,
  ReferralConversion,
} from '../services/referralService';
import { useToast } from '../hooks/useToast';
import './ReferralHub.css';

interface ReferralHubProps {
  organizationId: string;
  onBack: () => void;
}

type ViewMode = 'overview' | 'tiers' | 'leaderboard' | 'analytics' | 'settings';

const ReferralHub: React.FC<ReferralHubProps> = ({ organizationId, onBack }) => {
  const { showSuccess, showError } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);

  // Tier management
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<ReferralTier | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, tiersData, programsData, conversionsData] = await Promise.all([
        referralService.analytics.getStats(organizationId),
        referralService.tiers.getAll(organizationId),
        referralService.programs.getAll(organizationId),
        referralService.conversions.getAll(organizationId),
      ]);

      setStats(statsData);
      setTiers(tiersData);
      setPrograms(programsData);
      setConversions(conversionsData);
    } catch (error: any) {
      showError('Errore', error.message || 'Impossibile caricare i dati referral');
      console.error('Load referral data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // OVERVIEW SECTION
  // =====================================================

  const renderOverview = () => {
    if (!stats) return <div>Caricamento...</div>;

    return (
      <div className="referral-overview">
        {/* Header Stats */}
        <div className="stats-grid">
          <div className="stat-card gradient-purple">
            <div className="stat-icon">
              <Users size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active_programs}</div>
              <div className="stat-label">Programmi Attivi</div>
            </div>
          </div>

          <div className="stat-card gradient-blue">
            <div className="stat-icon">
              <TrendingUp size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_conversions}</div>
              <div className="stat-label">Conversioni Totali</div>
            </div>
          </div>

          <div className="stat-card gradient-green">
            <div className="stat-icon">
              <Target size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.conversion_rate.toFixed(1)}%</div>
              <div className="stat-label">Tasso Conversione</div>
            </div>
          </div>

          <div className="stat-card gradient-orange">
            <div className="stat-icon">
              <Gift size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_points_distributed}</div>
              <div className="stat-label">Punti Distribuiti</div>
            </div>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="channel-performance">
          <h3>
            <BarChart3 size={20} />
            Performance per Canale
          </h3>
          <div className="channels-grid">
            <div className="channel-item">
              <MessageCircle size={24} color="#25D366" />
              <div className="channel-name">WhatsApp</div>
              <div className="channel-value">{stats.channel_breakdown.whatsapp}</div>
            </div>
            <div className="channel-item">
              <Mail size={24} color="#EA4335" />
              <div className="channel-name">Email</div>
              <div className="channel-value">{stats.channel_breakdown.email}</div>
            </div>
            <div className="channel-item">
              <Share2 size={24} color="#1DA1F2" />
              <div className="channel-name">Social</div>
              <div className="channel-value">{stats.channel_breakdown.social}</div>
            </div>
            <div className="channel-item">
              <QrCode size={24} color="#6366F1" />
              <div className="channel-name">QR Code</div>
              <div className="channel-value">{stats.channel_breakdown.qr_code}</div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="top-performers">
          <h3>
            <Trophy size={20} />
            Top Performers
          </h3>
          <div className="performers-list">
            {stats.top_performers.map((performer, index) => (
              <div key={index} className="performer-item">
                <div className="performer-rank">
                  {index === 0 && <Crown size={20} color="#FFD700" />}
                  {index === 1 && <Award size={20} color="#C0C0C0" />}
                  {index === 2 && <Award size={20} color="#CD7F32" />}
                  {index > 2 && <span>#{index + 1}</span>}
                </div>
                <div className="performer-info">
                  <div className="performer-name">{performer.customer?.name || 'Unknown'}</div>
                  <div className="performer-tier">
                    {performer.tier ? (
                      <span
                        className="tier-badge"
                        style={{ background: performer.tier.color }}
                      >
                        {performer.tier.name}
                      </span>
                    ) : (
                      <span className="tier-badge">Nessun Tier</span>
                    )}
                  </div>
                </div>
                <div className="performer-stats">
                  <Zap size={16} />
                  {performer.referrals} referral
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Conversions */}
        <div className="recent-conversions">
          <h3>
            <TrendingUp size={20} />
            Conversioni Recenti
          </h3>
          <div className="conversions-list">
            {stats.recent_conversions.slice(0, 5).map((conversion) => (
              <div key={conversion.id} className="conversion-item">
                <div className="conversion-status">
                  {conversion.status === 'completed' && <Check size={16} color="#10b981" />}
                  {conversion.status === 'pending' && <Star size={16} color="#f59e0b" />}
                </div>
                <div className="conversion-info">
                  <div className="conversion-users">
                    {conversion.referrer?.name} → {conversion.referee?.name}
                  </div>
                  <div className="conversion-code">Codice: {conversion.referral_code}</div>
                </div>
                <div className="conversion-meta">
                  <div className="conversion-source">{conversion.source}</div>
                  <div className="conversion-date">
                    {new Date(conversion.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // TIERS MANAGEMENT SECTION
  // =====================================================

  const renderTiers = () => {
    return (
      <div className="tiers-management">
        <div className="section-header">
          <h2>
            <Award size={24} />
            Gestione Livelli Referral
          </h2>
          <button className="btn-primary" onClick={() => {
            setEditingTier(null);
            setShowTierModal(true);
          }}>
            <Plus size={20} />
            Nuovo Livello
          </button>
        </div>

        <div className="tiers-grid">
          {tiers.map((tier, index) => (
            <div key={tier.id} className="tier-card" style={{ borderColor: tier.color }}>
              <div className="tier-header" style={{ background: tier.color }}>
                <div className="tier-icon">
                  {tier.icon === 'star' && <Star size={32} />}
                  {tier.icon === 'award' && <Award size={32} />}
                  {tier.icon === 'crown' && <Crown size={32} />}
                  {tier.icon === 'trophy' && <Trophy size={32} />}
                  {tier.icon === 'zap' && <Zap size={32} />}
                </div>
                <h3>{tier.name}</h3>
              </div>

              <div className="tier-body">
                <div className="tier-threshold">
                  <Target size={18} />
                  <span>Soglia: {tier.threshold} referral</span>
                </div>

                {tier.description && (
                  <p className="tier-description">{tier.description}</p>
                )}

                <div className="tier-rewards">
                  <div className="reward-item">
                    <Gift size={16} />
                    <span>{tier.points_per_referral} punti per referral</span>
                  </div>
                  {tier.discount_percentage > 0 && (
                    <div className="reward-item">
                      <Award size={16} />
                      <span>{tier.discount_percentage}% sconto</span>
                    </div>
                  )}
                </div>

                {tier.special_perks && tier.special_perks.length > 0 && (
                  <div className="tier-perks">
                    <h4>Vantaggi Speciali:</h4>
                    <ul>
                      {tier.special_perks.map((perk, i) => (
                        <li key={i}>{perk.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="tier-actions">
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setEditingTier(tier);
                      setShowTierModal(true);
                    }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDeleteTier(tier.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tiers.length === 0 && (
          <div className="empty-state">
            <Award size={64} />
            <h3>Nessun livello configurato</h3>
            <p>Crea livelli referral per gamificare il tuo programma!</p>
            <button className="btn-primary" onClick={() => setShowTierModal(true)}>
              <Plus size={20} />
              Crea Primo Livello
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo livello?')) return;

    try {
      await referralService.tiers.delete(tierId);
      showSuccess('Successo', 'Livello eliminato');
      loadData();
    } catch (error: any) {
      showError('Errore', error.message);
    }
  };

  // =====================================================
  // LEADERBOARD SECTION
  // =====================================================

  const renderLeaderboard = () => {
    const sortedPrograms = [...programs].sort(
      (a, b) => b.successful_referrals - a.successful_referrals
    );

    return (
      <div className="leaderboard">
        <div className="section-header">
          <h2>
            <Trophy size={24} />
            Classifica Referral
          </h2>
        </div>

        <div className="leaderboard-list">
          {sortedPrograms.map((program, index) => (
            <div key={program.id} className="leaderboard-item" data-rank={index + 1}>
              <div className="leaderboard-rank">
                {index === 0 && <Crown size={32} color="#FFD700" />}
                {index === 1 && <Award size={32} color="#C0C0C0" />}
                {index === 2 && <Award size={32} color="#CD7F32" />}
                {index > 2 && <span className="rank-number">#{index + 1}</span>}
              </div>

              <div className="leaderboard-customer">
                <div className="customer-avatar">
                  {program.customer?.name?.charAt(0) || '?'}
                </div>
                <div className="customer-info">
                  <div className="customer-name">{program.customer?.name || 'Unknown'}</div>
                  <div className="customer-code">Codice: {program.referral_code}</div>
                </div>
              </div>

              <div className="leaderboard-stats">
                <div className="stat-item">
                  <Users size={18} />
                  <span>{program.successful_referrals} referral</span>
                </div>
                <div className="stat-item">
                  <Gift size={18} />
                  <span>{program.total_points_earned} punti</span>
                </div>
                <div className="stat-item">
                  <Target size={18} />
                  <span>{program.conversion_rate.toFixed(1)}%</span>
                </div>
              </div>

              {program.current_tier && (
                <div
                  className="leaderboard-tier"
                  style={{ background: program.current_tier.color }}
                >
                  {program.current_tier.name}
                </div>
              )}
            </div>
          ))}
        </div>

        {programs.length === 0 && (
          <div className="empty-state">
            <Trophy size={64} />
            <h3>Nessun programma attivo</h3>
            <p>I programmi referral appariranno qui</p>
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="referral-hub">
      {/* Header */}
      <div className="referral-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Indietro
        </button>
        <h1>
          <Zap size={28} />
          Sistema Referral
        </h1>
        <div className="header-actions">
          {/* Placeholder for future actions */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="referral-nav">
        <button
          className={`nav-tab ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
        >
          <BarChart3 size={20} />
          Panoramica
        </button>
        <button
          className={`nav-tab ${viewMode === 'tiers' ? 'active' : ''}`}
          onClick={() => setViewMode('tiers')}
        >
          <Award size={20} />
          Livelli
        </button>
        <button
          className={`nav-tab ${viewMode === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setViewMode('leaderboard')}
        >
          <Trophy size={20} />
          Classifica
        </button>
      </div>

      {/* Content */}
      <div className="referral-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Caricamento dati referral...</p>
          </div>
        ) : (
          <>
            {viewMode === 'overview' && renderOverview()}
            {viewMode === 'tiers' && renderTiers()}
            {viewMode === 'leaderboard' && renderLeaderboard()}
          </>
        )}
      </div>

      {/* Tier Modal - TBD in next part */}
    </div>
  );
};

export default ReferralHub;
