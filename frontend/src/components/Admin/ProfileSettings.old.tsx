import React, { useState, useRef, useEffect } from 'react'
import {
  Camera, Save, User as UserIcon, Mail, Phone, Shield,
  Lock, Bell, Activity, Code, Key, Smartphone, MapPin,
  LogOut, Copy, Eye, EyeOff, RefreshCw, CheckCircle, Building,
  FileText, CreditCard, Globe, Hash
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usersService, type SystemUser } from '../../services/usersService'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import './ProfileSettings.css'

type TabType = 'profile' | 'company' | 'security' | 'notifications' | 'activity' | 'api'

const ProfileSettings: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userData, setUserData] = useState<SystemUser | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: ''
  })

  const [companyData, setCompanyData] = useState({
    company_name: 'Omnily Pro S.r.l.',
    vat_number: '12345678901',
    address: 'Via Roma 123',
    city: 'Milano',
    zip_code: '20121',
    province: 'MI',
    country: 'Italia',
    pec: 'omnilypro@pec.it',
    sdi_code: 'M5UXCR1'
  })

  // Mock Data for Enterprise Features
  const sessions = [
    { id: 1, device: 'MacBook Pro M1', location: 'Milan, IT', ip: '151.23.45.67', lastActive: 'Adesso', current: true },
    { id: 2, device: 'iPhone 14 Pro', location: 'Rome, IT', ip: '93.45.12.89', lastActive: '2 ore fa', current: false },
    { id: 3, device: 'Windows PC', location: 'Naples, IT', ip: '87.12.34.56', lastActive: 'Ieri', current: false },
  ]

  const activities = [
    { id: 1, action: 'User Login', details: 'Accesso effettuato con successo', time: 'Oggi, 10:23', icon: UserIcon },
    { id: 2, action: 'Report Generated', details: 'Export report vendite mensile', time: 'Ieri, 16:50', icon: Activity },
    { id: 3, action: 'Settings Updated', details: 'Aggiornamento configurazione fiscale', time: '24 Nov, 09:15', icon: Shield },
    { id: 4, action: 'API Key Created', details: 'Creata nuova chiave API di produzione', time: '20 Nov, 14:30', icon: Key },
  ]

  const notifications = [
    { id: 'email_marketing', label: 'Email Marketing', desc: 'Ricevi aggiornamenti su nuove feature e promozioni', enabled: true },
    { id: 'email_security', label: 'Avvisi Sicurezza', desc: 'Notifiche immediate per accessi sospetti', enabled: true },
    { id: 'push_orders', label: 'Ordini Push', desc: 'Notifiche push per nuovi ordini in arrivo', enabled: true },
    { id: 'push_system', label: 'Stato Sistema', desc: 'Aggiornamenti sullo stato dei servizi', enabled: false },
  ]

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      if (!user) return

      const data = await usersService.getUser(user.id)
      if (data) {
        setUserData(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email,
          phone: data.phone || '',
          avatar_url: data.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      showError('Errore', 'Il file deve essere un\'immagine')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Errore', 'L\'immagine deve essere inferiore a 5MB')
      return
    }

    setUploading(true)

    try {
      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('admin-avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin-avatars')
        .getPublicUrl(filePath)

      await usersService.updateUser(user.id, {
        avatar_url: publicUrl
      })

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      window.dispatchEvent(new CustomEvent('user-profile-updated'))
      showSuccess('Foto Aggiornata', 'La tua foto profilo è stata aggiornata con successo')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      showError('Errore Upload', error.message || 'Errore durante l\'upload dell\'immagine')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      await usersService.updateUser(user.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      })

      window.dispatchEvent(new CustomEvent('user-profile-updated'))
      showSuccess('Profilo Aggiornato', 'Le modifiche sono state salvate con successo')
      await loadUserData()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showError('Errore', error.message || 'Errore durante l\'aggiornamento del profilo')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      showSuccess('Dati Aziendali Aggiornati', 'Le informazioni aziendali sono state salvate.')
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData(prev => ({ ...prev, [name]: value }))
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      super_admin: 'CEO & Founder',
      sales_agent: 'Agente Vendite',
      account_manager: 'Account Manager',
      organization_owner: 'Proprietario Organizzazione',
      organization_staff: 'Staff Organizzazione'
    }
    return labels[role] || role
  }

  if (!user || !userData) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Caricamento profilo...</p>
      </div>
    )
  }

  const displayName = formData.first_name && formData.last_name
    ? `${formData.first_name} ${formData.last_name}`
    : formData.first_name || formData.last_name || formData.email

  return (
    <div className="profile-settings">
      <div className="profile-header">
        <h1>Centro di Comando</h1>
        <p>Gestisci il tuo profilo, la sicurezza e le preferenze dell'account Enterprise</p>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={18} /> Profilo
          </button>
          <button
            className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <Building size={18} /> Dati Aziendali
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} /> Sicurezza
          </button>
          <button
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifiche
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={18} /> Attività
          </button>
          <button
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Code size={18} /> API & Dev
          </button>
        </div>
      </div>

      <div
        className="profile-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          alignItems: 'stretch',
          maxWidth: '1400px',
          margin: '2rem auto 4rem',
          padding: '0 3rem'
        }}
      >
        {/* Avatar Card - Top Section */}
        <div className="profile-card avatar-card">
          <div className="avatar-section">
            <div className="avatar-preview">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt={displayName} />
              ) : (
                <div className="avatar-placeholder">
                  <UserIcon size={60} />
                </div>
              )}
              {uploading && (
                <div className="avatar-uploading">
                  <div className="spinner-small"></div>
                </div>
              )}
            </div>
            <div className="avatar-info">
              <h3>{displayName}</h3>
              <span className={`role-badge role-${userData.role}`}>
                {getRoleLabel(userData.role)}
              </span>
            </div>
            <div className="avatar-actions">
              <button
                type="button"
                className="btn-upload-avatar"
                onClick={handleAvatarClick}
                disabled={uploading}
              >
                <Camera size={18} />
                {formData.avatar_url ? 'Cambia Foto' : 'Carica Foto'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="account-summary">
            <div className="summary-item">
              <span className="label">Stato</span>
              <span className="value active">Attivo</span>
            </div>
            <div className="summary-item">
              <span className="label">Membro dal</span>
              <span className="value">{new Date(userData.created_at).toLocaleDateString('it-IT')}</span>
            </div>
          </div>
        </div>

        {/* Tabbed Content - Bottom Section */}
        <div className="tab-content">

          {activeTab === 'profile' && (
            <div className="profile-card info-card fade-in">
              <div className="card-header">
                <h2>Informazioni Personali</h2>
                <span className="badge-verified">Verificato</span>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* Sezione Informazioni Personali */}
                  <div className="form-section-label" style={{ gridColumn: 'span 12' }}>
                    <UserIcon size={16} /> Informazioni Personali
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 6' }}>
                    <label><UserIcon size={14} /> Nome</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Il tuo nome"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 6' }}>
                    <label><UserIcon size={14} /> Cognome</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Il tuo cognome"
                    />
                  </div>

                  {/* Sezione Contatti */}
                  <div className="form-section-label" style={{ gridColumn: 'span 12' }}>
                    <Mail size={16} /> Contatti
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 6' }}>
                    <label><Mail size={14} /> Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="form-input disabled"
                      placeholder="email@esempio.com"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 6' }}>
                    <label><Phone size={14} /> Telefono</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </div>
                <div className="form-footer">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="profile-card info-card fade-in">
              <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className="badge-verified">Business</span>
                <h2>Dati Aziendali</h2>
              </div>
              <form onSubmit={handleCompanySubmit}>
                <div className="form-grid">
                  {/* Sezione Dati Azienda */}
                  <div className="form-section-label" style={{ gridColumn: 'span 12' }}>
                    <Building size={16} /> Dati Azienda
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 8' }}>
                    <label><Building size={14} /> Ragione Sociale</label>
                    <input
                      type="text"
                      name="company_name"
                      value={companyData.company_name}
                      onChange={handleCompanyChange}
                      className="form-input"
                      placeholder="Es. Omnily Pro S.r.l."
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label><Hash size={14} /> Partita IVA / C.F.</label>
                    <input
                      type="text"
                      name="vat_number"
                      value={companyData.vat_number}
                      onChange={handleCompanyChange}
                      className="form-input"
                      placeholder="IT12345678901"
                    />
                  </div>
                  {/* Sezione Indirizzo */}
                  <div className="form-section-label" style={{ gridColumn: 'span 12' }}>
                    <MapPin size={16} /> Indirizzo Sede Legale
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 12' }}>
                    <label><MapPin size={14} /> Indirizzo</label>
                    <input
                      type="text"
                      name="address"
                      value={companyData.address}
                      onChange={handleCompanyChange}
                      className="form-input"
                      placeholder="Via Roma, 123"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label><MapPin size={14} /> Città</label>
                    <input
                      type="text"
                      name="city"
                      value={companyData.city}
                      onChange={handleCompanyChange}
                      className="form-input"
                      placeholder="Milano"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label><Hash size={14} /> CAP</label>
                    <input
                      type="text"
                      name="zip_code"
                      value={companyData.zip_code}
                      onChange={handleCompanyChange}
                      className="form-input"
                      placeholder="20100"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label><MapPin size={14} /> Provincia</label>
                    <input
                      type="text"
                      name="province"
                      value={companyData.province}
                      onChange={handleCompanyChange}
                      className="form-input"
                      maxLength={2}
                      placeholder="MI"
                    />
                  </div>
                  {/* Sezione Fatturazione */}
                  <div className="form-section-label" style={{ gridColumn: 'span 12' }}>
                    <FileText size={16} /> Fatturazione Elettronica
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label><FileText size={14} /> Codice SDI</label>
                    <input
                      type="text"
                      name="sdi_code"
                      value={companyData.sdi_code}
                      onChange={handleCompanyChange}
                      className="form-input"
                      maxLength={7}
                      placeholder="ABCDEFG"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 8' }}>
                    <label><Mail size={14} /> PEC (Posta Elettronica Certificata)</label>
                    <input
                      type="email"
                      name="pec"
                      value={companyData.pec}
                      onChange={handleCompanyChange}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-footer">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? 'Salvataggio...' : 'Salva Dati Aziendali'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-container fade-in">
              <div className="profile-card">
                <h2>Sicurezza Account</h2>
                <div className="security-item">
                  <div className="sec-info">
                    <h3>Autenticazione a Due Fattori (2FA)</h3>
                    <p>Aggiungi un livello di sicurezza extra al tuo account.</p>
                  </div>
                  <div className="toggle-switch active">
                    <div className="knob"></div>
                  </div>
                </div>
                <div className="security-item">
                  <div className="sec-info">
                    <h3>Cambia Password</h3>
                    <p>Ultima modifica: 3 mesi fa</p>
                  </div>
                  <button className="btn-outline">Aggiorna</button>
                </div>
              </div>

              <div className="profile-card mt-4">
                <h2>Sessioni Attive</h2>
                <div className="sessions-list">
                  {sessions.map(session => (
                    <div key={session.id} className="session-item">
                      <div className="session-icon">
                        {session.device.includes('iPhone') ? <Smartphone size={24} /> : <Shield size={24} />}
                      </div>
                      <div className="session-details">
                        <h4>{session.device} {session.current && <span className="badge-current">Questo dispositivo</span>}</h4>
                        <p><MapPin size={12} /> {session.location} • IP: {session.ip}</p>
                      </div>
                      <div className="session-time">
                        {session.lastActive}
                      </div>
                      {!session.current && (
                        <button className="btn-icon-danger" title="Disconnetti">
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="profile-card fade-in">
              <h2>Preferenze Notifiche</h2>
              <div className="notifications-list">
                {notifications.map(notif => (
                  <div key={notif.id} className="notification-item">
                    <div className="notif-info">
                      <h3>{notif.label}</h3>
                      <p>{notif.desc}</p>
                    </div>
                    <div className={`toggle-switch ${notif.enabled ? 'active' : ''}`}>
                      <div className="knob"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="profile-card fade-in">
              <h2>Registro Attività</h2>
              <div className="activity-timeline">
                {activities.map((act, index) => (
                  <div key={act.id} className="timeline-item">
                    <div className="timeline-line"></div>
                    <div className="timeline-icon">
                      <act.icon size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>{act.action}</h4>
                        <span className="timeline-time">{act.time}</span>
                      </div>
                      <p>{act.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="profile-card fade-in">
              <h2>API & Sviluppo</h2>
              <div className="api-section">
                <div className="api-key-box">
                  <label>Chiave API Pubblica (Live)</label>
                  <div className="key-display">
                    <code>{showApiKey ? 'sk_live_51MzQj2K9x2Lp8N7m4R5t1V0b3X6z9' : 'sk_live_•••••••••••••••••••••••••'}</code>
                    <button className="btn-icon" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button className="btn-icon" onClick={() => showSuccess('Copiato', 'Chiave API copiata')}>
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="api-hint">Non condividere mai la tua chiave privata.</p>
                </div>

                <div className="webhook-box">
                  <label>Endpoint Webhook</label>
                  <div className="key-display">
                    <code>https://api.omnilypro.com/v1/webhooks</code>
                    <button className="btn-icon">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                <div className="api-actions">
                  <button className="btn-outline-danger">
                    <RefreshCw size={16} /> Rigenera Chiavi
                  </button>
                  <button className="btn-primary">
                    <Code size={16} /> Documentazione API
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
