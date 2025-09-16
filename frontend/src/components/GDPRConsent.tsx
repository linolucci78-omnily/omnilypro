import React, { useState } from 'react';
import { Shield, Eye, Mail, BarChart, Users, FileText } from 'lucide-react';
import './GDPRConsent.css';

interface ConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
}

interface GDPRConsentProps {
  onConsentChange: (consents: ConsentData & { privacyAccepted: boolean }) => void;
  initialConsents?: ConsentData;
  showDetailed?: boolean;
}

const GDPRConsent: React.FC<GDPRConsentProps> = ({
  onConsentChange,
  initialConsents = {
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
    thirdParty: false
  },
  showDetailed = true
}) => {
  const [consents, setConsents] = useState<ConsentData>(initialConsents);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleConsentChange = (consentType: keyof ConsentData, value: boolean) => {
    const newConsents = { ...consents, [consentType]: value };
    setConsents(newConsents);
    onConsentChange({ ...newConsents, privacyAccepted });
  };

  const handlePrivacyAccepted = (accepted: boolean) => {
    setPrivacyAccepted(accepted);
    onConsentChange({ ...consents, privacyAccepted: accepted });
  };

  const consentCategories = [
    {
      id: 'necessary' as keyof ConsentData,
      title: 'Cookie Tecnici Necessari',
      description: 'Necessari per il funzionamento base del sito e del servizio',
      icon: <Shield size={20} />,
      required: true,
      details: 'Questi cookie sono essenziali per fornire i nostri servizi e non possono essere disattivati. Includono cookie di sessione, autenticazione e sicurezza.',
      purposes: ['Autenticazione utente', 'Sicurezza delle sessioni', 'Funzionalità del carrello', 'Preferenze linguistiche']
    },
    {
      id: 'analytics' as keyof ConsentData,
      title: 'Cookie Analitici',
      description: 'Ci aiutano a capire come gli utenti interagiscono con il sito',
      icon: <BarChart size={20} />,
      required: false,
      details: 'Raccogliamo dati anonimi su come utilizzi il nostro sito per migliorare l\'esperienza utente.',
      purposes: ['Google Analytics', 'Statistiche di utilizzo', 'Performance del sito', 'Heatmap comportamentali']
    },
    {
      id: 'marketing' as keyof ConsentData,
      title: 'Cookie Marketing',
      description: 'Utilizzati per mostrarti pubblicità personalizzata',
      icon: <Mail size={20} />,
      required: false,
      details: 'Permettono di personalizzare gli annunci e misurare l\'efficacia delle campagne pubblicitarie.',
      purposes: ['Pubblicità mirata', 'Email marketing', 'Retargeting', 'Social media advertising']
    },
    {
      id: 'personalization' as keyof ConsentData,
      title: 'Personalizzazione',
      description: 'Per personalizzare contenuti e raccomandazioni',
      icon: <Users size={20} />,
      required: false,
      details: 'Utilizziamo questi dati per offrirti contenuti e suggerimenti personalizzati in base alle tue preferenze.',
      purposes: ['Contenuti personalizzati', 'Raccomandazioni prodotti', 'Interfaccia adattiva', 'Preferenze utente']
    },
    {
      id: 'thirdParty' as keyof ConsentData,
      title: 'Servizi Terze Parti',
      description: 'Integrazione con servizi esterni (mappe, social, chat)',
      icon: <Eye size={20} />,
      required: false,
      details: 'Include servizi di terze parti come Google Maps, chat di supporto, social media widgets.',
      purposes: ['Google Maps', 'Chat di supporto', 'Widget social media', 'Sistemi di pagamento']
    }
  ];

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      thirdParty: true
    };
    setConsents(allAccepted);
    setPrivacyAccepted(true);
    onConsentChange({ ...allAccepted, privacyAccepted: true });
  };

  const acceptNecessaryOnly = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      thirdParty: false
    };
    setConsents(necessaryOnly);
    setPrivacyAccepted(true);
    onConsentChange({ ...necessaryOnly, privacyAccepted: true });
  };

  return (
    <div className="gdpr-consent">
      <div className="gdpr-header">
        <Shield className="gdpr-icon" size={24} />
        <div>
          <h3>Privacy e Consensi GDPR</h3>
          <p>Gestisci le tue preferenze sui dati personali e cookie</p>
        </div>
      </div>

      {/* Privacy Policy Acceptance */}
      <div className="privacy-acceptance">
        <label className="gdpr-checkbox-label">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => handlePrivacyAccepted(e.target.checked)}
            className="gdpr-checkbox"
          />
          <span className="gdpr-checkmark"></span>
          <div className="gdpr-checkbox-text">
            <strong>Ho letto e accetto l'informativa sulla privacy *</strong>
            <p>
              Acconsento al trattamento dei miei dati personali secondo quanto previsto dall'informativa sulla privacy 
              in conformità al Regolamento UE 2016/679 (GDPR).
            </p>
            <div className="privacy-links">
              <a href="/privacy-policy" target="_blank">📄 Leggi l'informativa completa</a>
              <a href="/cookie-policy" target="_blank">🍪 Policy sui Cookie</a>
              <a href="/data-rights" target="_blank">⚖️ I tuoi diritti sui dati</a>
            </div>
          </div>
        </label>
      </div>

      {/* Detailed Consent Management */}
      {showDetailed && (
        <div className="consent-management">
          <div className="consent-header">
            <h4>Gestione Consensi Dettagliata</h4>
            <button 
              className="toggle-details"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
            </button>
          </div>

          <div className="consent-categories">
            {consentCategories.map((category) => (
              <div key={category.id} className="consent-category">
                <div className="consent-category-header">
                  <label className="gdpr-checkbox-label">
                    <input
                      type="checkbox"
                      checked={consents[category.id]}
                      onChange={(e) => handleConsentChange(category.id, e.target.checked)}
                      disabled={category.required}
                      className="gdpr-checkbox"
                    />
                    <span className={`gdpr-checkmark ${category.required ? 'required' : ''}`}></span>
                    <div className="consent-info">
                      <div className="consent-title">
                        {category.icon}
                        <span>{category.title}</span>
                        {category.required && <span className="required-badge">Obbligatorio</span>}
                      </div>
                      <p className="consent-description">{category.description}</p>
                    </div>
                  </label>
                </div>

                {showDetails && (
                  <div className="consent-details">
                    <p><strong>Finalità:</strong> {category.details}</p>
                    <div className="consent-purposes">
                      <strong>Include:</strong>
                      <ul>
                        {category.purposes.map((purpose, index) => (
                          <li key={index}>{purpose}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="consent-actions">
            <button className="btn-accept-all" onClick={acceptAll}>
              ✅ Accetta Tutto
            </button>
            <button className="btn-necessary" onClick={acceptNecessaryOnly}>
              🔒 Solo Necessari
            </button>
          </div>
        </div>
      )}

      {/* GDPR Rights Information */}
      <div className="gdpr-rights">
        <FileText size={16} />
        <div className="rights-text">
          <strong>I tuoi diritti GDPR:</strong> Hai il diritto di accedere, rettificare, cancellare i tuoi dati, 
          limitarne il trattamento, opporti al trattamento e richiedere la portabilità dei dati. 
          <a href="/data-rights">Scopri di più</a>
        </div>
      </div>

      {/* Consent Summary */}
      <div className="consent-summary">
        <h5>Riepilogo Consensi:</h5>
        <div className="summary-grid">
          <div className={`summary-item ${privacyAccepted ? 'accepted' : 'declined'}`}>
            Privacy Policy: {privacyAccepted ? '✅ Accettata' : '❌ Non accettata'}
          </div>
          {Object.entries(consents).map(([key, value]) => (
            <div key={key} className={`summary-item ${value ? 'accepted' : 'declined'}`}>
              {consentCategories.find(c => c.id === key)?.title}: {value ? '✅' : '❌'}
            </div>
          ))}
        </div>
      </div>

      <div className="gdpr-footer">
        <p>
          📅 <strong>Data consenso:</strong> {new Date().toLocaleString('it-IT')} |
          🔄 <strong>Versione:</strong> 1.0 |
          ⚖️ <strong>Base legale:</strong> Art. 6(1)(a) GDPR
        </p>
      </div>
    </div>
  );
};

export default GDPRConsent;