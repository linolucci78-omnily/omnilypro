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
  Save,
  Calendar,
  FileText,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import referralService, {
  ReferralTier,
  ReferralProgram,
  ReferralStats,
  ReferralConversion,
  ReferralSettings,
} from '../services/referralService';
import { useToast } from '../hooks/useToast';
import ReferralTierFullPage from './ReferralTierFullPage';
import './ReferralHub.css';

interface ReferralHubProps {
  organizationId: string;
  primaryColor: string;
  secondaryColor: string;
  onBack: () => void;
  initialView?: ViewMode;
}

type ViewMode = 'hub' | 'overview' | 'tiers' | 'leaderboard' | 'analytics' | 'settings' | 'tier-edit';

const ReferralHub: React.FC<ReferralHubProps> = ({ organizationId, primaryColor, secondaryColor, onBack, initialView = 'hub' }) => {
  const { showSuccess, showError } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);

  // Tier management
  const [editingTier, setEditingTier] = useState<ReferralTier | null>(null);

  // Settings state
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [organizationId]);

  // Load settings when entering settings view
  useEffect(() => {
    if (viewMode === 'settings') {
      loadSettings();
    }
  }, [viewMode, organizationId]);

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

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const settingsData = await referralService.settings.getOrCreateSettings(organizationId);
      setSettings(settingsData);
    } catch (error: any) {
      showError('Errore', error.message || 'Impossibile caricare le impostazioni referral');
      console.error('Load referral settings error:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSettingsSaving(true);
      await referralService.settings.updateSettings(organizationId, {
        points_per_referral: settings.points_per_referral,
        welcome_bonus_points: settings.welcome_bonus_points,
        first_purchase_bonus: settings.first_purchase_bonus,
        code_format: settings.code_format,
        code_prefix: settings.code_prefix,
        code_length: settings.code_length,
        code_validity_days: settings.code_validity_days,
        email_welcome_enabled: settings.email_welcome_enabled,
        auto_assign_points: settings.auto_assign_points,
        auto_upgrade_tiers: settings.auto_upgrade_tiers,
        notify_conversions: settings.notify_conversions,
        program_active: settings.program_active,
        max_referrals_per_user: settings.max_referrals_per_user,
        require_first_purchase: settings.require_first_purchase,
      });
      showSuccess('Successo', 'Impostazioni salvate correttamente');
      await loadSettings(); // Reload to get updated data
    } catch (error: any) {
      showError('Errore', error.message || 'Impossibile salvare le impostazioni');
      console.error('Save referral settings error:', error);
    } finally {
      setSettingsSaving(false);
    }
  };

  // =====================================================
  // HUB VIEW WITH CARDS
  // =====================================================

  const renderHub = () => {
    return (
      <div className="referral-hub-view">
        <div className="referral-hub-header">
          <div className="referral-hub-header-content">
            <div className="referral-hub-icon">
              <Zap size={48} />
            </div>
            <div>
              <h1>Sistema Referral Avanzato</h1>
              <p>Gestisci programmi referral, livelli gamification e analytics</p>
            </div>
          </div>
        </div>

        <div className="referral-hub-cards">
          {/* Card: Panoramica */}
          <div
            className="referral-hub-card referral-hub-card-primary"
            onClick={() => setViewMode('overview')}
          >
            <div className="referral-hub-card-icon">
              <BarChart3 size={32} />
            </div>
            <div className="referral-hub-card-content">
              <h3>Panoramica</h3>
              <p>Dashboard con statistiche e performance del programma</p>
              <ul className="referral-hub-card-features">
                <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Statistiche in tempo reale</li>
                <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Performance per canale</li>
                <li><Trophy size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Top performers</li>
                <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Conversioni recenti</li>
              </ul>
            </div>
            <div className="referral-hub-card-arrow">→</div>
          </div>

          {/* Card: Livelli Referral */}
          <div
            className="referral-hub-card referral-hub-card-primary"
            onClick={() => setViewMode('tiers')}
          >
            <div className="referral-hub-card-icon">
              <Award size={32} />
            </div>
            <div className="referral-hub-card-content">
              <h3>Livelli Referral</h3>
              <p>Crea e gestisci livelli gamification per i tuoi referrer</p>
              <ul className="referral-hub-card-features">
                <li><Crown size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Livelli personalizzati</li>
                <li><Target size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Soglie conversioni</li>
                <li><Gift size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Rewards per livello</li>
                <li><Star size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Vantaggi speciali</li>
              </ul>
            </div>
            <div className="referral-hub-card-arrow">→</div>
          </div>

          {/* Card: Classifica */}
          <div
            className="referral-hub-card referral-hub-card-primary"
            onClick={() => setViewMode('leaderboard')}
          >
            <div className="referral-hub-card-icon">
              <Trophy size={32} />
            </div>
            <div className="referral-hub-card-content">
              <h3>Classifica</h3>
              <p>Vedi i migliori referrer e le loro performance</p>
              <ul className="referral-hub-card-features">
                <li><Crown size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Top referrer</li>
                <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Referral totali</li>
                <li><Gift size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Punti guadagnati</li>
                <li><Target size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Tasso conversione</li>
              </ul>
            </div>
            <div className="referral-hub-card-arrow">→</div>
          </div>

          {/* Card: Analytics */}
          <div
            className="referral-hub-card referral-hub-card-primary"
            onClick={() => setViewMode('analytics')}
          >
            <div className="referral-hub-card-icon">
              <TrendingUp size={32} />
            </div>
            <div className="referral-hub-card-content">
              <h3>Analytics & Report</h3>
              <p>Analisi dettagliate e metriche avanzate del programma</p>
              <ul className="referral-hub-card-features">
                <li><BarChart3 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />KPI dettagliati</li>
                <li><TrendingUp size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />ROI programma</li>
                <li><Target size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />CAC (Customer Acquisition Cost)</li>
                <li><Users size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Trend conversioni</li>
              </ul>
            </div>
            <div className="referral-hub-card-arrow">→</div>
          </div>

          {/* Card: Impostazioni */}
          <div
            className="referral-hub-card referral-hub-card-secondary"
            onClick={() => setViewMode('settings')}
          >
            <div className="referral-hub-card-icon">
              <Settings size={32} />
            </div>
            <div className="referral-hub-card-content">
              <h3>Impostazioni</h3>
              <p>Configura punti, rewards e automazioni referral</p>
              <ul className="referral-hub-card-features">
                <li><Gift size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Punti referral</li>
                <li><Award size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Bonus benvenuto</li>
                <li><Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Rewards automatici</li>
                <li><Settings size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />Formato codici</li>
              </ul>
            </div>
            <div className="referral-hub-card-arrow">→</div>
          </div>
        </div>
      </div>
    );
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
          <button
            className="btn-primary"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
            onClick={() => {
              setEditingTier(null);
              setViewMode('tier-edit');
            }}
          >
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
                      setViewMode('tier-edit');
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
            <button
              className="btn-primary"
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
              onClick={() => {
                setEditingTier(null);
                setViewMode('tier-edit');
              }}
            >
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

  const handleSaveTier = async (tierData: Partial<ReferralTier>) => {
    try {
      if (editingTier) {
        // Update existing tier
        await referralService.tiers.update(editingTier.id, tierData);
        showSuccess('Successo', 'Livello aggiornato');
      } else {
        // Create new tier
        await referralService.tiers.create(tierData);
        showSuccess('Successo', 'Livello creato');
      }
      loadData();
    } catch (error: any) {
      showError('Errore', error.message || 'Impossibile salvare il livello');
      throw error;
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
  // ANALYTICS SECTION
  // =====================================================

  const renderAnalytics = () => {
    if (!stats) return <div>Caricamento...</div>;

    return (
      <div className="analytics-section">
        <div className="section-header">
          <h2>
            <TrendingUp size={24} />
            Analytics & Report Dettagliati
          </h2>
        </div>

        {/* KPI Cards */}
        <div className="analytics-kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
              <Users size={28} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.total_conversions}</div>
              <div className="kpi-label">Conversioni Totali</div>
              <div className="kpi-trend positive">+12% vs mese scorso</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#10b98115', color: '#10b981' }}>
              <Target size={28} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.conversion_rate.toFixed(1)}%</div>
              <div className="kpi-label">Tasso di Conversione</div>
              <div className="kpi-trend positive">+5.2% vs mese scorso</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
              <Gift size={28} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.total_points_distributed}</div>
              <div className="kpi-label">Punti Distribuiti</div>
              <div className="kpi-trend">Lifetime value</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}>
              <BarChart3 size={28} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">€{(stats.total_points_distributed * 0.1).toFixed(0)}</div>
              <div className="kpi-label">Valore Rewards</div>
              <div className="kpi-trend">Investimento totale</div>
            </div>
          </div>
        </div>

        {/* Channel Performance Detailed */}
        <div className="analytics-card">
          <h3>
            <BarChart3 size={20} />
            Performance Canali
          </h3>
          <div className="channel-bars">
            <div className="channel-bar-item">
              <div className="channel-bar-header">
                <div className="channel-bar-name">
                  <MessageCircle size={20} color="#25D366" />
                  WhatsApp
                </div>
                <div className="channel-bar-value">{stats.channel_breakdown.whatsapp} conversioni</div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(stats.channel_breakdown.whatsapp / stats.total_conversions * 100)}%`,
                    background: '#25D366'
                  }}
                ></div>
              </div>
              <div className="channel-bar-percentage">
                {((stats.channel_breakdown.whatsapp / stats.total_conversions * 100) || 0).toFixed(1)}%
              </div>
            </div>

            <div className="channel-bar-item">
              <div className="channel-bar-header">
                <div className="channel-bar-name">
                  <Mail size={20} color="#EA4335" />
                  Email
                </div>
                <div className="channel-bar-value">{stats.channel_breakdown.email} conversioni</div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(stats.channel_breakdown.email / stats.total_conversions * 100)}%`,
                    background: '#EA4335'
                  }}
                ></div>
              </div>
              <div className="channel-bar-percentage">
                {((stats.channel_breakdown.email / stats.total_conversions * 100) || 0).toFixed(1)}%
              </div>
            </div>

            <div className="channel-bar-item">
              <div className="channel-bar-header">
                <div className="channel-bar-name">
                  <Share2 size={20} color="#1DA1F2" />
                  Social Media
                </div>
                <div className="channel-bar-value">{stats.channel_breakdown.social} conversioni</div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(stats.channel_breakdown.social / stats.total_conversions * 100)}%`,
                    background: '#1DA1F2'
                  }}
                ></div>
              </div>
              <div className="channel-bar-percentage">
                {((stats.channel_breakdown.social / stats.total_conversions * 100) || 0).toFixed(1)}%
              </div>
            </div>

            <div className="channel-bar-item">
              <div className="channel-bar-header">
                <div className="channel-bar-name">
                  <QrCode size={20} color="#6366F1" />
                  QR Code
                </div>
                <div className="channel-bar-value">{stats.channel_breakdown.qr_code} conversioni</div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(stats.channel_breakdown.qr_code / stats.total_conversions * 100)}%`,
                    background: '#6366F1'
                  }}
                ></div>
              </div>
              <div className="channel-bar-percentage">
                {((stats.channel_breakdown.qr_code / stats.total_conversions * 100) || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* ROI & Metrics */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>
              <TrendingUp size={20} />
              ROI Programma Referral
            </h3>
            <div className="roi-content">
              <div className="roi-value" style={{ color: '#10b981' }}>+285%</div>
              <p className="roi-description">
                Per ogni €1 investito in rewards, generi €3.85 di valore
              </p>
              <div className="roi-breakdown">
                <div className="roi-item">
                  <span>Investimento Rewards:</span>
                  <strong>€{(stats.total_points_distributed * 0.1).toFixed(0)}</strong>
                </div>
                <div className="roi-item">
                  <span>Valore Clienti Acquisiti:</span>
                  <strong>€{(stats.total_conversions * 45).toFixed(0)}</strong>
                </div>
                <div className="roi-item">
                  <span>Profitto Netto:</span>
                  <strong style={{ color: '#10b981' }}>€{((stats.total_conversions * 45) - (stats.total_points_distributed * 0.1)).toFixed(0)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>
              <Target size={20} />
              Costo Acquisizione Cliente (CAC)
            </h3>
            <div className="cac-content">
              <div className="cac-value">€{((stats.total_points_distributed * 0.1) / stats.total_conversions || 0).toFixed(2)}</div>
              <p className="cac-description">
                Costo medio per acquisire un nuovo cliente tramite referral
              </p>
              <div className="cac-comparison">
                <div className="comparison-item">
                  <span>CAC Referral:</span>
                  <strong style={{ color: '#10b981' }}>€{((stats.total_points_distributed * 0.1) / stats.total_conversions || 0).toFixed(2)}</strong>
                </div>
                <div className="comparison-item">
                  <span>CAC Advertising (media):</span>
                  <strong style={{ color: '#ef4444' }}>€25-50</strong>
                </div>
                <div className="comparison-item highlight">
                  <span>Risparmio:</span>
                  <strong style={{ color: '#10b981' }}>~90%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversioni Recenti */}
        <div className="analytics-card">
          <h3>
            <Users size={20} />
            Conversioni Recenti
          </h3>
          <div className="recent-conversions-list">
            {stats.recent_conversions.slice(0, 10).map((conversion) => (
              <div key={conversion.id} className="conversion-item">
                <div className="conversion-avatar">
                  {conversion.referrer?.name?.charAt(0) || '?'}
                </div>
                <div className="conversion-info">
                  <div className="conversion-main">
                    <strong>{conversion.referrer?.name || 'Unknown'}</strong>
                    <span> ha invitato </span>
                    <strong>{conversion.referee?.name || 'Unknown'}</strong>
                  </div>
                  <div className="conversion-meta">
                    {conversion.source && <span className="conversion-source">{conversion.source}</span>}
                    <span className="conversion-points">+{conversion.points_awarded_referrer} punti</span>
                  </div>
                </div>
                <div className={`conversion-status status-${conversion.status}`}>
                  {conversion.status === 'completed' && <Check size={16} />}
                  {conversion.status === 'rewarded' && <Gift size={16} />}
                  {conversion.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // SETTINGS SECTION
  // =====================================================

  const renderSettings = () => {
    if (settingsLoading || !settings) {
      return (
        <div className="referral-settings-content">
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            Caricamento impostazioni...
          </div>
        </div>
      );
    }

    return (
      <div className="referral-settings-content">
        {/* Punti e Rewards */}
        <div className="referral-section">
          <div className="referral-section-header">
            <Gift size={24} />
            <h2>Punti e Rewards</h2>
          </div>

          <div className="referral-form-grid">
            <div className="form-group">
              <label>
                <Gift size={18} />
                Punti per Referral Completato
              </label>
              <input
                type="number"
                value={settings.points_per_referral}
                onChange={(e) => setSettings({ ...settings, points_per_referral: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <span className="form-hint">Punti assegnati al referrer quando un amico si iscrive</span>
            </div>

            <div className="form-group">
              <label>
                <Users size={18} />
                Bonus Benvenuto Nuovo Utente
              </label>
              <input
                type="number"
                value={settings.welcome_bonus_points}
                onChange={(e) => setSettings({ ...settings, welcome_bonus_points: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <span className="form-hint">Punti bonus per il nuovo utente che si iscrive con un codice referral</span>
            </div>

            <div className="form-group">
              <label>
                <Award size={18} />
                Punti Bonus Primo Acquisto
              </label>
              <input
                type="number"
                value={settings.first_purchase_bonus}
                onChange={(e) => setSettings({ ...settings, first_purchase_bonus: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <span className="form-hint">Punti extra al referrer quando l'amico effettua il primo acquisto</span>
            </div>
          </div>
        </div>

        {/* Codici Referral */}
        <div className="referral-section">
          <div className="referral-section-header">
            <Target size={24} />
            <h2>Configurazione Codici</h2>
          </div>

          <div className="referral-form-grid">
            <div className="form-group">
              <label>
                <Settings size={18} />
                Formato Codice
              </label>
              <select
                value={settings.code_format}
                onChange={(e) => setSettings({ ...settings, code_format: e.target.value as 'auto' | 'name' | 'custom' })}
              >
                <option value="auto">Automatico (es. REF-ABC123)</option>
                <option value="name">Basato su Nome (es. MARIO2024)</option>
                <option value="custom">Personalizzato dall'utente</option>
              </select>
              <span className="form-hint">Scegli come vengono generati i codici referral</span>
            </div>

            <div className="form-group">
              <label>
                <FileText size={18} />
                Prefisso Codice
              </label>
              <input
                type="text"
                value={settings.code_prefix}
                onChange={(e) => setSettings({ ...settings, code_prefix: e.target.value })}
                maxLength={10}
              />
              <span className="form-hint">Prefisso da aggiungere ai codici generati automaticamente</span>
            </div>

            <div className="form-group">
              <label>
                <Target size={18} />
                Lunghezza Codice
              </label>
              <input
                type="number"
                value={settings.code_length}
                onChange={(e) => setSettings({ ...settings, code_length: parseInt(e.target.value) || 8 })}
                min={4}
                max={20}
              />
              <span className="form-hint">Numero di caratteri per i codici generati automaticamente</span>
            </div>
          </div>
        </div>

        {/* Automazioni */}
        <div className="referral-section">
          <div className="referral-section-header">
            <Zap size={24} />
            <h2>Automazioni Email</h2>
          </div>

          <div className="referral-form-grid">
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.email_welcome_enabled}
                  onChange={(e) => setSettings({ ...settings, email_welcome_enabled: e.target.checked })}
                />
                <span>Email di Benvenuto Referral</span>
              </label>
              <span className="form-hint">Invia email automatica quando qualcuno usa un codice referral</span>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.auto_assign_points}
                  onChange={(e) => setSettings({ ...settings, auto_assign_points: e.target.checked })}
                />
                <span>Assegnazione Automatica Punti</span>
              </label>
              <span className="form-hint">Assegna punti automaticamente senza approvazione manuale</span>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.auto_upgrade_tiers}
                  onChange={(e) => setSettings({ ...settings, auto_upgrade_tiers: e.target.checked })}
                />
                <span>Upgrade Automatico Livelli</span>
              </label>
              <span className="form-hint">Promuovi automaticamente gli utenti al livello successivo</span>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notify_conversions}
                  onChange={(e) => setSettings({ ...settings, notify_conversions: e.target.checked })}
                />
                <span>Notifiche Conversioni</span>
              </label>
              <span className="form-hint">Notifica il referrer quando qualcuno usa il suo codice</span>
            </div>
          </div>
        </div>

        {/* Stato Programma */}
        <div className="referral-section">
          <div className="referral-section-header">
            <Settings size={24} />
            <h2>Stato Programma</h2>
          </div>

          <div className="referral-form-grid">
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.program_active}
                  onChange={(e) => setSettings({ ...settings, program_active: e.target.checked })}
                />
                <span>Programma Referral Attivo</span>
              </label>
              <span className="form-hint">Attiva o disattiva completamente il programma referral</span>
            </div>

            <div className="form-group">
              <label>
                <Calendar size={18} />
                Durata Validità Codice (giorni)
              </label>
              <input
                type="number"
                value={settings.code_validity_days}
                onChange={(e) => setSettings({ ...settings, code_validity_days: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <span className="form-hint">Dopo quanti giorni un codice referral non utilizzato scade (0 = mai)</span>
            </div>

            <div className="form-group">
              <label>
                <Users size={18} />
                Limite Referral per Utente
              </label>
              <input
                type="number"
                value={settings.max_referrals_per_user}
                onChange={(e) => setSettings({ ...settings, max_referrals_per_user: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <span className="form-hint">Numero massimo di referral per utente (0 = illimitato)</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="referral-save-section">
          <button
            className="save-button"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
            onClick={handleSaveSettings}
            disabled={settingsSaving}
          >
            <Save size={20} />
            {settingsSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  // If in tier-edit mode, show fullpage
  if (viewMode === 'tier-edit') {
    return (
      <ReferralTierFullPage
        tier={editingTier}
        organizationId={organizationId}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onBack={() => {
          setViewMode('tiers');
          setEditingTier(null);
          loadData(); // Reload data after save
        }}
        onSave={handleSaveTier}
      />
    );
  }

  // Se siamo nella vista hub, mostra solo la vista con le card
  if (viewMode === 'hub') {
    return (
      <div
        className="referral-hub"
        style={{
          ['--primary-color' as any]: primaryColor,
          ['--secondary-color' as any]: secondaryColor
        }}
      >
        {/* Header */}
        <div className="referral-header" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
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

        {/* Content Hub */}
        <div
          className="referral-content"
          style={{
            ['--primary-color' as any]: primaryColor,
            ['--secondary-color' as any]: secondaryColor
          }}
        >
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Caricamento dati referral...</p>
            </div>
          ) : (
            renderHub()
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="referral-hub"
      style={{
        ['--primary-color' as any]: primaryColor,
        ['--secondary-color' as any]: secondaryColor
      }}
    >
      {/* Header */}
      <div className="referral-header" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
        <button className="back-button" onClick={() => setViewMode('hub')}>
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
      <div
        className="referral-nav"
        style={{
          ['--primary-color' as any]: primaryColor,
          ['--secondary-color' as any]: secondaryColor
        }}
      >
        <button
          className={`nav-tab ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
          style={viewMode === 'overview' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <BarChart3 size={20} />
          Panoramica
        </button>
        <button
          className={`nav-tab ${viewMode === 'tiers' ? 'active' : ''}`}
          onClick={() => setViewMode('tiers')}
          style={viewMode === 'tiers' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <Award size={20} />
          Livelli
        </button>
        <button
          className={`nav-tab ${viewMode === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setViewMode('leaderboard')}
          style={viewMode === 'leaderboard' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <Trophy size={20} />
          Classifica
        </button>
        <button
          className={`nav-tab ${viewMode === 'analytics' ? 'active' : ''}`}
          onClick={() => setViewMode('analytics')}
          style={viewMode === 'analytics' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <TrendingUp size={20} />
          Analytics
        </button>
        <button
          className={`nav-tab ${viewMode === 'settings' ? 'active' : ''}`}
          onClick={() => setViewMode('settings')}
          style={viewMode === 'settings' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
        >
          <Settings size={20} />
          Impostazioni
        </button>
      </div>

      {/* Content */}
      <div
        className="referral-content"
        style={{
          ['--primary-color' as any]: primaryColor,
          ['--secondary-color' as any]: secondaryColor
        }}
      >
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
            {viewMode === 'analytics' && renderAnalytics()}
            {viewMode === 'settings' && renderSettings()}
          </>
        )}
      </div>
    </div>
  );
};

export default ReferralHub;
