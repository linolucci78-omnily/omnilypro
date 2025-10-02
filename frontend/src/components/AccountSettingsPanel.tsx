import React, { useState, useEffect } from 'react';
import { X, Building2, Gift, Award, Palette, AlertTriangle } from 'lucide-react';
import LoyaltyTiersConfigPanel from './LoyaltyTiersConfigPanel';
import './AccountSettingsPanel.css';

interface AccountSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  organization: any;
  onUpdate: () => void;
}

type TabType = 'details' | 'loyalty' | 'tiers' | 'branding' | 'points';

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
    secondary_color: '#dc2626'
  });

  const [resetConfirmText, setResetConfirmText] = useState('');
  const [scheduledResetDate, setScheduledResetDate] = useState('');
  const [scheduledResetTime, setScheduledResetTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLoyaltyTiersPanel, setShowLoyaltyTiersPanel] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        partita_iva: organization.partita_iva || '',
        codice_fiscale: organization.codice_fiscale || '',
        industry: organization.industry || '',
        team_size: organization.team_size || '',
        business_email: organization.business_email || '',
        phone_number: organization.phone_number || '',
        website: organization.website || '',
        tagline: organization.tagline || '',
        address: organization.address || '',
        city: organization.city || '',
        province: organization.province || '',
        cap: organization.cap || '',
        points_name: organization.points_name || 'Punti',
        points_per_euro: organization.points_per_euro || 1,
        reward_threshold: organization.reward_threshold || 100,
        welcome_bonus: organization.welcome_bonus || 50,
        points_expiry_months: organization.points_expiry_months || 12,
        enable_tier_system: organization.enable_tier_system ?? true,
        logo_url: organization.logo_url || '',
        primary_color: organization.primary_color || '#ef4444',
        secondary_color: organization.secondary_color || '#dc2626'
      });

      if (organization.scheduled_points_reset) {
        const date = new Date(organization.scheduled_points_reset);
        setScheduledResetDate(date.toISOString().split('T')[0]);
        setScheduledResetTime(date.toTimeString().slice(0, 5));
      }
    }
  }, [organization]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implementare save su Supabase
      console.log('Saving settings:', formData);

      setTimeout(() => {
        setSaving(false);
        onUpdate();
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
    }
  };

  const handleResetAllPoints = async () => {
    if (resetConfirmText !== 'AZZERA') {
      return;
    }

    try {
      // TODO: Implementare reset su Supabase
      console.log('Resetting all points for organization:', organization.id);

      setResetConfirmText('');
      onUpdate();
    } catch (error) {
      console.error('Error resetting points:', error);
    }
  };

  const handleScheduleReset = async () => {
    if (!scheduledResetDate || !scheduledResetTime) {
      alert('Inserisci data e ora per l\'azzeramento programmato');
      return;
    }

    const scheduledDate = new Date(`${scheduledResetDate}T${scheduledResetTime}`);

    try {
      // TODO: Implementare schedule su Supabase
      console.log('Scheduling points reset for:', scheduledDate);

      onUpdate();
    } catch (error) {
      console.error('Error scheduling reset:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'details' as TabType, label: 'Dettagli Azienda', icon: Building2 },
    { id: 'loyalty' as TabType, label: 'Sistema Loyalty', icon: Gift },
    { id: 'tiers' as TabType, label: 'Livelli', icon: Award },
    { id: 'branding' as TabType, label: 'Branding', icon: Palette },
    { id: 'points' as TabType, label: 'Gestione Punti', icon: AlertTriangle }
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
                <label>Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
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
        </div>
      </div>

      {/* Loyalty Tiers Panel */}
      {showLoyaltyTiersPanel && organization && (
        <LoyaltyTiersConfigPanel
          isOpen={showLoyaltyTiersPanel}
          onClose={() => {
            setShowLoyaltyTiersPanel(false);
            onUpdate();
          }}
          organization={organization}
          organizationId={organization.id}
        />
      )}
    </>
  );
};

export default AccountSettingsPanel;
