import React, { useState } from 'react'
import {
  Settings,
  Building2,
  CreditCard,
  Shield,
  Key,
  Users,
  Bell,
  Globe,
  Mail,
  Palette,
  Database,
  Zap,
  Save,
  AlertCircle,
  Smartphone
} from 'lucide-react'
import './SettingsHub.css'

interface SettingsHubProps {
  organizationId: string
  organizationName: string
  onOpenAccountSettings: () => void
  onOpenLoyaltySystem: () => void
  onOpenGiftCertificatesSettings: () => void
  onNavigateToSection: (sectionId: string) => void
}

const SettingsHub: React.FC<SettingsHubProps> = ({
  organizationId,
  organizationName,
  onOpenAccountSettings,
  onOpenLoyaltySystem,
  onOpenGiftCertificatesSettings,
  onNavigateToSection
}) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const settingsCategories = [
    {
      id: 'account',
      icon: Building2,
      title: 'Account & Business',
      description: 'Informazioni aziendali, contatti e orari',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      features: [
        'Nome e descrizione business',
        'Orari di apertura',
        'Contatti e indirizzo',
        'Social media links'
      ],
      onClick: onOpenAccountSettings
    },
    {
      id: 'loyalty',
      icon: Zap,
      title: 'Sistema Fedeltà & Punti',
      description: 'Gestisci punti, ricompense e reset periodici',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      features: [
        'Configurazione punti e gemme',
        'Bonus benvenuto e scadenza',
        'Reset programmati',
        'Sistema tier e livelli'
      ],
      onClick: onOpenLoyaltySystem
    },
    {
      id: 'gift-certificates',
      icon: Settings,
      title: 'Gift Certificates',
      description: 'Configura buoni regalo, sicurezza e automazioni',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: [
        'Impostazioni generali',
        'Importi e validità',
        'Email automations',
        'Sicurezza e termini'
      ],
      onClick: onOpenGiftCertificatesSettings
    },
    {
      id: 'referral',
      icon: Users,
      title: 'Programma Referral',
      description: 'Gestisci referral, livelli gamification e analytics',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: [
        'Punti e rewards referral',
        'Livelli e gamification',
        'Codici referral personalizzati',
        'Automazioni e notifiche'
      ],
      onClick: () => onNavigateToSection('referral-system')
    },
    {
      id: 'operator-nfc',
      icon: Smartphone,
      title: 'Tessere Operatori POS',
      description: 'Associa tessere NFC per login rapido operatori',
      color: '#c0392b',
      gradient: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
      features: [
        'Login NFC istantaneo',
        'Gestione tessere operatori',
        'Log accessi e sicurezza',
        'Attiva/disattiva tessere'
      ],
      onClick: () => onNavigateToSection('operator-nfc-management')
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: 'Fatturazione & Piani',
      description: 'Gestisci abbonamenti, pagamenti e fatture',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: [
        'Piano attuale e upgrade',
        'Storico pagamenti',
        'Fatture e ricevute',
        'Metodi di pagamento'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Sicurezza & Privacy',
      description: 'Autenticazione, permessi e protezione dati',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      features: [
        'Autenticazione a due fattori',
        'Gestione sessioni',
        'Privacy e GDPR',
        'Audit log attività'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    },
    {
      id: 'api',
      icon: Key,
      title: 'API & Integrazioni',
      description: 'Chiavi API, webhook e connessioni esterne',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      features: [
        'Chiavi API REST',
        'Webhook configuration',
        'Rate limits e quote',
        'Documentazione API'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    },
    {
      id: 'team',
      icon: Users,
      title: 'Team & Permessi',
      description: 'Gestisci utenti, ruoli e autorizzazioni',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: [
        'Invita membri del team',
        'Ruoli e permessi',
        'Gestione accessi',
        'Activity tracking'
      ],
      onClick: () => onNavigateToSection('team-management')
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifiche & Alert',
      description: 'Configura email, SMS e notifiche push',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      features: [
        'Email notifications',
        'SMS alerts (premium)',
        'Push notifications',
        'Preferenze utente'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    },
    {
      id: 'localization',
      icon: Globe,
      title: 'Lingua & Localizzazione',
      description: 'Lingua, fuso orario, valuta e formati',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      features: [
        'Lingua interfaccia',
        'Fuso orario',
        'Valuta e formati',
        'Traduzioni custom'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    },
    {
      id: 'email',
      icon: Mail,
      title: 'Email Automations',
      description: 'Automazioni email e campagne marketing',
      color: '#14b8a6',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      features: [
        'Template email automatiche',
        'Email tier upgrade',
        'Email premi riscattati',
        'Campagne marketing'
      ],
      onClick: () => onNavigateToSection('email-automations')
    },
    {
      id: 'appearance',
      icon: Palette,
      title: 'Branding & Social',
      description: 'Colori, logo e personalizzazione interfaccia',
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      features: [
        'Logo e colori brand',
        'Social media links',
        'Footer email branded',
        'Preview in tempo reale'
      ],
      onClick: () => onNavigateToSection('branding-social')
    },
    {
      id: 'data',
      icon: Database,
      title: 'Dati & Backup',
      description: 'Export, import e backup automatico',
      color: '#64748b',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      features: [
        'Export dati CSV/Excel',
        'Import bulk clienti',
        'Backup automatico',
        'Restore punti vendita'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    },
    {
      id: 'advanced',
      icon: Zap,
      title: 'Avanzate & Debug',
      description: 'Configurazioni tecniche e troubleshooting',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      features: [
        'Developer mode',
        'Logs e debug',
        'Performance monitoring',
        'Cache management'
      ],
      onClick: () => setMessage({ type: 'error', text: 'Funzionalità in arrivo prossimamente' })
    }
  ]

  return (
    <div className="settings-hub">
      {/* Header */}
      <div className="settings-hub-header">
        <div className="settings-hub-header-content">
          <div className="settings-hub-icon">
            <Settings size={48} />
          </div>
          <div>
            <h1>Impostazioni Sistema</h1>
            <p className="settings-hub-subtitle">
              Configura ogni aspetto della tua piattaforma fedeltà - {organizationName}
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`settings-message ${message.type}`}>
          <AlertCircle size={20} />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Settings Grid */}
      <div className="settings-grid">
        {settingsCategories.map((category) => (
          <div
            key={category.id}
            className="settings-category-card"
            onClick={category.onClick}
          >
            <div
              className="settings-category-icon"
              style={{ background: category.gradient }}
            >
              <category.icon size={40} />
            </div>
            <div className="settings-category-content">
              <h3>{category.title}</h3>
              <p className="settings-category-description">{category.description}</p>
              <ul className="settings-category-features">
                {category.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="settings-category-arrow">
              <span>Configura →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="settings-footer-info">
        <div className="settings-info-box">
          <Database size={20} />
          <div>
            <strong>Organization ID:</strong> {organizationId}
          </div>
        </div>
        <div className="settings-info-box">
          <Zap size={20} />
          <div>
            <strong>Versione:</strong> 0.1.0 (46) - Production
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsHub
