import React, { useState, useEffect } from 'react';
import { X, Building2, Gift, Award, Palette, AlertTriangle, Upload, CreditCard } from 'lucide-react';
import LoyaltyTiersConfigPanel from './LoyaltyTiersConfigPanel';
import { organizationService } from '../services/organizationService';
import { giftCertificatesService } from '../services/giftCertificatesService';
import { supabase } from '../lib/supabase';
import './AccountSettingsPanel.css';

interface AccountSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  organization: any;
  onUpdate: () => void;
}

type TabType = 'details' | 'loyalty' | 'tiers' | 'branding' | 'points' | 'giftcerts';

const AccountSettingsPanel: React.FC<AccountSettingsPanelProps> = ({
  isOpen,
  onClose,
  organization,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [formData, setFormData] = useState({
    // Dettagli Organizzazione
    name: '',
    partita_iva: '',
    codice_fiscale: '',
    industry: '',
    team_size: '',
    business_email: '',
    phone_number: '',
    website: '',
    tagline: '',
    address: '',
    city: '',
    province: '',
    cap: '',

    // Sistema Loyalty
    points_name: 'Punti',
    points_per_euro: 1,
    reward_threshold: 100,
    welcome_bonus: 50,
    points_expiry_months: 12,
    enable_tier_system: true,

    // Branding
    logo_url: '',
    primary_color: '#ef4444',

    // Gift Certificates
    gc_enabled: true,
    gc_code_prefix: 'GIFT',
    gc_min_amount: 10,
    gc_max_amount: 1000,
    gc_preset_amounts: '25, 50, 100, 250',
    gc_default_validity_days: 365,
    gc_send_email_on_issue: true,
    gc_send_email_on_redeem: false,
    gc_send_reminder_before_expiry: true,
    gc_max_validation_attempts: 5,
    gc_lockout_duration_minutes: 30,
    gc_default_terms: 'Questo gift certificate è valido per acquisti presso la nostra attività. Non è rimborsabile in denaro e non può essere sostituito in caso di smarrimento o furto. Valido fino alla data di scadenza indicata.',
    secondary_color: '#dc2626'
  });

  const [resetConfirmText, setResetConfirmText] = useState('');
  const [scheduledResetDate, setScheduledResetDate] = useState('');
  const [scheduledResetTime, setScheduledResetTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLoyaltyTiersPanel, setShowLoyaltyTiersPanel] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        partita_iva: organization.partita_iva || '',
        codice_fiscale: organization.codice_fiscale || '',
        industry: organization.industry || '',
        team_size: organization.team_size || '',
        business_email: organization.business_email || '',
        phone_number: organization.phone || '',
        website: organization.website || '',
        tagline: organization.tagline || '',
        address: organization.address || '',
        city: organization.city || '',
        province: '', // Not in DB
        cap: organization.postal_code || '',
        points_name: organization.points_name || 'Punti',
        points_per_euro: organization.points_per_euro || 1,
        reward_threshold: organization.reward_threshold || 100,
        welcome_bonus: organization.welcome_bonus || 50,
        points_expiry_months: organization.points_expiry_months || 12,
        enable_tier_system: organization.enable_tier_system ?? true,
        logo_url: organization.logo_url || '',
        primary_color: organization.primary_color || '#ef4444',
        secondary_color: organization.secondary_color || '#dc2626',
        // Gift Certificates - defaults
        gc_enabled: true,
        gc_code_prefix: 'GIFT',
        gc_min_amount: 10,
        gc_max_amount: 1000,
        gc_preset_amounts: '25, 50, 100, 250',
        gc_default_validity_days: 365,
        gc_send_email_on_issue: true,
        gc_send_email_on_redeem: false,
        gc_send_reminder_before_expiry: true,
        gc_max_validation_attempts: 5,
        gc_lockout_duration_minutes: 30,
        gc_default_terms: 'Questo gift certificate è valido per acquisti presso la nostra attività. Non è rimborsabile in denaro e non può essere sostituito in caso di smarrimento o furto. Valido fino alla data di scadenza indicata.'
      });

      if (organization.scheduled_points_reset) {
        const date = new Date(organization.scheduled_points_reset);
        setScheduledResetDate(date.toISOString().split('T')[0]);
        setScheduledResetTime(date.toTimeString().slice(0, 5));
      }
    }
  }, [organization]);

  // Load gift certificate settings
  useEffect(() => {
    const loadGiftCertSettings = async () => {
      if (organization?.id) {
        try {
          const settings = await giftCertificatesService.getSettings(organization.id);
          if (settings) {
            setFormData(prev => ({
              ...prev,
              gc_enabled: settings.is_enabled ?? true,
              gc_code_prefix: settings.code_prefix || 'GIFT',
              gc_min_amount: 10, // Not in DB, using default
              gc_max_amount: settings.max_amount_per_certificate || 1000,
              gc_preset_amounts: '25, 50, 100, 250', // Not in DB, using default
              gc_default_validity_days: 365, // Not in DB, using default
              gc_send_email_on_issue: settings.send_email_on_issue ?? true,
              gc_send_email_on_redeem: settings.send_email_on_redeem ?? false,
              gc_send_reminder_before_expiry: settings.send_reminder_before_expiry ?? true,
              gc_max_validation_attempts: settings.max_validation_attempts || 5,
              gc_lockout_duration_minutes: settings.lockout_duration_minutes || 30,
              gc_default_terms: settings.default_terms_conditions || 'Questo gift certificate è valido per acquisti presso la nostra attività. Non è rimborsabile in denaro e non può essere sostituito in caso di smarrimento o furto. Valido fino alla data di scadenza indicata.'
            }));
          }
        } catch (error) {
          console.error('Error loading gift certificate settings:', error);
        }
      }
    };

    loadGiftCertSettings();
  }, [organization?.id]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization?.id) {
      console.error('❌ Nessun file o organization ID mancante');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Inizio upload logo:', file.name, 'size:', file.size);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Per favore seleziona un file immagine');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Il file deve essere inferiore a 2MB');
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      console.log('📁 Upload path:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('IMG')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      console.log('📦 Upload response:', { data, error });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('IMG')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);

      // Update form data
      setFormData({ ...formData, logo_url: publicUrl });

      console.log('✅ Logo caricato con successo!');
      alert('✅ Logo caricato! Ricordati di cliccare "Salva Modifiche"');
    } catch (error: any) {
      console.error('❌ Errore upload logo:', error);
      alert(`Errore: ${error.message || 'Errore durante il caricamento del logo'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (!organization?.id) {
        throw new Error('Organization ID not found');
      }

      // Save based on active tab
      if (activeTab === 'details') {
        await organizationService.updateOrganizationDetails(organization.id, {
          name: formData.name,
          partita_iva: formData.partita_iva,
          codice_fiscale: formData.codice_fiscale,
          industry: formData.industry,
          team_size: formData.team_size,
          business_email: formData.business_email,
          phone_number: formData.phone_number,
          website: formData.website,
          tagline: formData.tagline,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          cap: formData.cap
        });
      } else if (activeTab === 'loyalty') {
        await organizationService.updateLoyaltySettings(organization.id, {
          points_name: formData.points_name,
          points_per_euro: formData.points_per_euro,
          reward_threshold: formData.reward_threshold,
          welcome_bonus: formData.welcome_bonus,
          points_expiry_months: formData.points_expiry_months,
          enable_tier_system: formData.enable_tier_system
        });
      } else if (activeTab === 'branding') {
        await organizationService.updateBranding(organization.id, {
          logo_url: formData.logo_url,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color
        });
      } else if (activeTab === 'giftcerts') {
        await giftCertificatesService.upsertSettings(organization.id, {
          organization_id: organization.id,
          is_enabled: formData.gc_enabled,
          code_prefix: formData.gc_code_prefix,
          min_amount_per_certificate: formData.gc_min_amount,
          max_amount_per_certificate: formData.gc_max_amount,
          default_validity_days: formData.gc_default_validity_days,
          send_email_on_issue: formData.gc_send_email_on_issue,
          send_email_on_redeem: formData.gc_send_email_on_redeem,
          send_reminder_before_expiry: formData.gc_send_reminder_before_expiry,
          max_validation_attempts: formData.gc_max_validation_attempts,
          lockout_duration_minutes: formData.gc_lockout_duration_minutes,
          default_terms_conditions: formData.gc_default_terms
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh organization data without full reload
      onUpdate();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setSaveError(error.message || 'Errore durante il salvataggio');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetAllPoints = async () => {
    if (resetConfirmText !== 'AZZERA') {
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (!organization?.id) {
        throw new Error('Organization ID not found');
      }

      await organizationService.resetAllPoints(organization.id);

      setResetConfirmText('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      onUpdate();
    } catch (error: any) {
      console.error('Error resetting points:', error);
      setSaveError(error.message || 'Errore durante l\'azzeramento dei punti');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleReset = async () => {
    if (!scheduledResetDate || !scheduledResetTime) {
      setSaveError('Inserisci data e ora per l\'azzeramento programmato');
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    const scheduledDate = new Date(`${scheduledResetDate}T${scheduledResetTime}`);

    if (scheduledDate < new Date()) {
      setSaveError('La data deve essere nel futuro');
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (!organization?.id) {
        throw new Error('Organization ID not found');
      }

      await organizationService.schedulePointsReset(organization.id, scheduledDate);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      onUpdate();
    } catch (error: any) {
      console.error('Error scheduling reset:', error);
      setSaveError(error.message || 'Errore durante la programmazione dell\'azzeramento');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'details' as TabType, label: 'Dettagli Azienda', icon: Building2 },
    { id: 'loyalty' as TabType, label: 'Sistema Loyalty', icon: Gift },
    { id: 'tiers' as TabType, label: 'Livelli', icon: Award },
    { id: 'branding' as TabType, label: 'Branding', icon: Palette },
    { id: 'points' as TabType, label: 'Gestione Punti', icon: AlertTriangle },
    { id: 'giftcerts' as TabType, label: 'Gift Certificates', icon: CreditCard }
  ];

  return (
    <>
      <div className="account-settings-overlay" onClick={onClose} />

      <div className="account-settings-panel">
        {/* Header */}
        <div className="account-settings-header">
          <h2>Configurazione Account</h2>
          <button onClick={onClose} className="account-settings-close">
            <X size={24} />
          </button>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="save-notification success">
            ✅ Modifiche salvate con successo!
          </div>
        )}
        {saveError && (
          <div className="save-notification error">
            ❌ {saveError}
          </div>
        )}

        {/* Tabs */}
        <div className="account-settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`account-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="account-settings-content">
          {/* Dettagli Organizzazione */}
          {activeTab === 'details' && (
            <div className="settings-section">
              <h3>Dettagli Organizzazione</h3>

              <div className="form-group">
                <label>Nome Organizzazione *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es. Bar Centrale"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Partita IVA</label>
                  <input
                    type="text"
                    value={formData.partita_iva}
                    onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Codice Fiscale</label>
                  <input
                    type="text"
                    value={formData.codice_fiscale}
                    onChange={(e) => setFormData({ ...formData, codice_fiscale: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Settore</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="retail">Retail</option>
                    <option value="restaurant">Ristorazione</option>
                    <option value="beauty">Beauty & Wellness</option>
                    <option value="services">Servizi</option>
                    <option value="other">Altro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Dimensione Team</label>
                  <select
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Aziendale</label>
                  <input
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sito Web</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label>Tagline/Slogan</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Es. Il tuo bar di fiducia"
                />
              </div>

              <div className="form-group">
                <label>Indirizzo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Via, numero civico"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Città</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Provincia</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="form-group">
                  <label>CAP</label>
                  <input
                    type="text"
                    value={formData.cap}
                    onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                    maxLength={5}
                  />
                </div>
              </div>

              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          )}

          {/* Sistema Loyalty */}
          {activeTab === 'loyalty' && (
            <div className="settings-section">
              <h3>Sistema Loyalty</h3>

              <div className="form-group">
                <label>Nome Punti</label>
                <input
                  type="text"
                  value={formData.points_name}
                  onChange={(e) => setFormData({ ...formData, points_name: e.target.value })}
                  placeholder="Es. Punti, Stelle, Credits"
                />
              </div>

              <div className="form-group">
                <label>Punti per Euro Speso</label>
                <input
                  type="number"
                  value={formData.points_per_euro}
                  onChange={(e) => setFormData({ ...formData, points_per_euro: parseFloat(e.target.value) })}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Soglia Minima Riscatto</label>
                <input
                  type="number"
                  value={formData.reward_threshold}
                  onChange={(e) => setFormData({ ...formData, reward_threshold: parseInt(e.target.value) })}
                  min="0"
                />
                <small>Punti minimi necessari per riscattare un premio</small>
              </div>

              <div className="form-group">
                <label>Bonus Benvenuto</label>
                <input
                  type="number"
                  value={formData.welcome_bonus}
                  onChange={(e) => setFormData({ ...formData, welcome_bonus: parseInt(e.target.value) })}
                  min="0"
                />
                <small>Punti assegnati alla registrazione</small>
              </div>

              <div className="form-group">
                <label>Scadenza Punti (mesi)</label>
                <input
                  type="number"
                  value={formData.points_expiry_months}
                  onChange={(e) => setFormData({ ...formData, points_expiry_months: parseInt(e.target.value) })}
                  min="1"
                />
                <small>Dopo quanti mesi i punti scadono (0 = mai)</small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.enable_tier_system}
                    onChange={(e) => setFormData({ ...formData, enable_tier_system: e.target.checked })}
                  />
                  <span>Abilita Sistema a Livelli</span>
                </label>
              </div>

              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          )}

          {/* Livelli Fedeltà */}
          {activeTab === 'tiers' && (
            <div className="settings-section">
              <h3>Livelli Fedeltà</h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Configura i livelli di fedeltà del tuo sistema loyalty. Ogni livello può avere un moltiplicatore punti diverso.
              </p>
              <button
                className="btn-save"
                onClick={() => setShowLoyaltyTiersPanel(true)}
                style={{ marginTop: 0 }}
              >
                Gestisci Livelli Fedeltà
              </button>
            </div>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <div className="settings-section">
              <h3>Branding Aziendale</h3>

              <div className="form-group">
                <label>Logo Aziendale</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    id="logo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="upload-button">
                    <Upload size={18} />
                    {uploading ? 'Caricamento...' : 'Carica Logo'}
                  </label>
                  <span className="upload-hint">PNG, JPG, max 2MB</span>
                </div>
                {formData.logo_url && (
                  <div className="logo-preview">
                    <img src={formData.logo_url} alt="Logo" />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Colore Primario</label>
                  <div className="color-input">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Colore Secondario</label>
                  <div className="color-input">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="branding-preview">
                <h4>Anteprima</h4>
                <div className="preview-card" style={{
                  background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`
                }}>
                  {formData.logo_url && <img src={formData.logo_url} alt="Logo" />}
                  <h2 style={{ color: 'white' }}>{formData.name}</h2>
                  {formData.tagline && <p style={{ color: 'rgba(255,255,255,0.9)' }}>{formData.tagline}</p>}
                </div>
              </div>

              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          )}

          {/* Gestione Punti */}
          {activeTab === 'points' && (
            <div className="settings-section">
              <h3>Gestione Punti</h3>

              <div className="danger-zone">
                <div className="danger-section">
                  <AlertTriangle size={24} color="#ef4444" />
                  <div style={{ flex: 1 }}>
                    <h4>Azzera Tutti i Punti</h4>
                    <p>Questa operazione azzererà i punti di tutti i clienti immediatamente. <strong>Questa azione è irreversibile!</strong></p>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#991b1b' }}>
                      Per confermare, digita <strong>AZZERA</strong> e clicca sul bottone:
                    </p>
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      placeholder="Digita AZZERA"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginTop: '0.5rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <button
                    className="btn-danger"
                    onClick={handleResetAllPoints}
                    disabled={resetConfirmText !== 'AZZERA'}
                    style={{ opacity: resetConfirmText !== 'AZZERA' ? 0.5 : 1, cursor: resetConfirmText !== 'AZZERA' ? 'not-allowed' : 'pointer' }}
                  >
                    Azzera Punti
                  </button>
                </div>

                <div className="scheduled-reset-section">
                  <h4>Azzeramento Programmato</h4>
                  <p>Programma un azzeramento automatico dei punti per una data specifica</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data</label>
                      <input
                        type="date"
                        value={scheduledResetDate}
                        onChange={(e) => setScheduledResetDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ora</label>
                      <input
                        type="time"
                        value={scheduledResetTime}
                        onChange={(e) => setScheduledResetTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={handleScheduleReset}
                  >
                    Programma Azzeramento
                  </button>

                  {organization?.scheduled_points_reset && (
                    <div className="scheduled-info">
                      Azzeramento programmato per: {new Date(organization.scheduled_points_reset).toLocaleString('it-IT')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Gift Certificates Configuration */}
          {activeTab === 'giftcerts' && (
            <div className="settings-section">
              <h3>🎁 Configurazione Gift Certificates</h3>
              <p className="section-description">
                Configura il sistema di Gift Certificates per la tua attività
              </p>

              {/* Abilitazione Sistema */}
              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.gc_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, gc_enabled: e.target.checked }))}
                  />
                  <span>Abilita Sistema Gift Certificates</span>
                </label>
                <p className="form-help">
                  Attiva o disattiva la funzionalità Gift Certificates per la tua organizzazione
                </p>
              </div>

              {/* Codice Prefix */}
              <div className="form-group">
                <label>Prefisso Codice *</label>
                <input
                  type="text"
                  placeholder="GIFT"
                  value={formData.gc_code_prefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, gc_code_prefix: e.target.value }))}
                  maxLength={10}
                />
                <p className="form-help">
                  Prefisso da usare per i codici (es. GIFT-XXXX-XXXX-XXXX)
                </p>
              </div>

              {/* Importi */}
              <div className="form-row">
                <div className="form-group">
                  <label>Importo Minimo (€)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.gc_min_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, gc_min_amount: parseFloat(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Importo Massimo (€)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.gc_max_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, gc_max_amount: parseFloat(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>

              {/* Importi Preset */}
              <div className="form-group">
                <label>Importi Preset</label>
                <input
                  type="text"
                  placeholder="25, 50, 100, 250"
                  value={formData.gc_preset_amounts}
                  onChange={(e) => setFormData(prev => ({ ...prev, gc_preset_amounts: e.target.value }))}
                />
                <p className="form-help">
                  Importi suggeriti per creazione rapida (separati da virgola)
                </p>
              </div>

              {/* Validità Default */}
              <div className="form-group">
                <label>Validità Default (giorni)</label>
                <input
                  type="number"
                  placeholder="365"
                  value={formData.gc_default_validity_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, gc_default_validity_days: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
                <p className="form-help">
                  Numero di giorni di validità per i nuovi gift certificate
                </p>
              </div>

              {/* Email Automatiche */}
              <div className="form-group">
                <h4>Email Automatiche</h4>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.gc_send_email_on_issue}
                    onChange={(e) => setFormData(prev => ({ ...prev, gc_send_email_on_issue: e.target.checked }))}
                  />
                  <span>Invia email quando viene emesso un gift certificate</span>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.gc_send_email_on_redeem}
                    onChange={(e) => setFormData(prev => ({ ...prev, gc_send_email_on_redeem: e.target.checked }))}
                  />
                  <span>Invia email quando viene riscattato</span>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.gc_send_reminder_before_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, gc_send_reminder_before_expiry: e.target.checked }))}
                  />
                  <span>Invia reminder prima della scadenza</span>
                </label>
              </div>

              {/* Limiti Sicurezza */}
              <div className="form-group">
                <h4>Sicurezza e Limiti</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Max tentativi validazione</label>
                    <input
                      type="number"
                      placeholder="5"
                      value={formData.gc_max_validation_attempts}
                      onChange={(e) => setFormData(prev => ({ ...prev, gc_max_validation_attempts: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Blocco per (minuti)</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={formData.gc_lockout_duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, gc_lockout_duration_minutes: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                </div>
                <p className="form-help">
                  Protezione anti-frode: blocca temporaneamente dopo troppi tentativi falliti
                </p>
              </div>

              {/* Termini e Condizioni */}
              <div className="form-group">
                <label>Termini e Condizioni Default</label>
                <textarea
                  rows={4}
                  placeholder="Inserisci i termini e condizioni..."
                  value={formData.gc_default_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, gc_default_terms: e.target.value }))}
                />
              </div>

              {/* Info Box */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '1rem',
                marginTop: '2rem'
              }}>
                <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem' }}>
                  💡 <strong>Nota:</strong> Le modifiche a queste impostazioni si applicano solo ai nuovi gift certificate.
                  I gift certificate già emessi mantengono le impostazioni originali.
                </p>
              </div>

              {/* Save Button */}
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: '2rem' }}
              >
                {saving ? 'Salvataggio...' : 'Salva Configurazione'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loyalty Tiers Panel */}
      {showLoyaltyTiersPanel && organization && (
        <LoyaltyTiersConfigPanel
          isOpen={showLoyaltyTiersPanel}
          onClose={() => {
            setShowLoyaltyTiersPanel(false);
            // Don't call onUpdate() here - it reloads the entire AccountSettingsPanel
          }}
          organization={organization}
          organizationId={organization.id}
        />
      )}
    </>
  );
};

export default AccountSettingsPanel;
