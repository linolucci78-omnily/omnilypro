import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Rocket, Building2, Shield, BarChart3, Zap, Users, TrendingUp, Award,
  CheckCircle, ArrowRight, Play, Star, ChevronDown, Sparkles, Target,
  Globe, Lock, Smartphone, RefreshCw, MessageSquare, Clock, Check,
  TrendingDown, Percent, DollarSign, ShoppingCart, Mail, Phone
} from 'lucide-react'
import './Landing.css'

const Landing: React.FC = () => {
  const [activeTab, setActiveTab] = useState('retail')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  // Animated counter effect
  const [counters, setCounters] = useState({ companies: 0, transactions: 0, retention: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(prev => ({
        companies: prev.companies < 200 ? prev.companies + 5 : 200,
        transactions: prev.transactions < 1000000 ? prev.transactions + 25000 : 1000000,
        retention: prev.retention < 45 ? prev.retention + 1 : 45
      }))
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const industries = [
    { id: 'retail', name: 'Retail', icon: ShoppingCart, revenue: '+42%', customers: '15.000+' },
    { id: 'restaurant', name: 'Ristorazione', icon: Users, revenue: '+38%', customers: '8.500+' },
    { id: 'beauty', name: 'Beauty & Wellness', icon: Sparkles, revenue: '+51%', customers: '12.000+' },
    { id: 'services', name: 'Servizi', icon: Globe, revenue: '+35%', customers: '6.200+' }
  ]

  const faqs = [
    {
      q: 'Quanto tempo serve per essere operativi?',
      a: 'Con il nostro wizard guidato, puoi configurare completamente il tuo programma loyalty in meno di 15 minuti. Il nostro team ti supporta nell\'onboarding completo entro 24 ore.'
    },
    {
      q: 'Come funziona la prova gratuita?',
      a: 'Offriamo 30 giorni di prova completa senza carta di credito. Hai accesso a tutte le funzionalità Professional per testare la piattaforma con i tuoi clienti reali.'
    },
    {
      q: 'I dati sono sicuri e GDPR compliant?',
      a: 'Assolutamente sì. Utilizziamo crittografia end-to-end, server in EU, backup giornalieri e siamo completamente conformi al GDPR. Forniamo anche DPA personalizzati per Enterprise.'
    },
    {
      q: 'Posso integrare OMNILY con i miei sistemi esistenti?',
      a: 'Sì! Offriamo API REST complete, webhook real-time e integrazioni native con i principali POS, e-commerce (Shopify, WooCommerce), CRM e email marketing tools.'
    },
    {
      q: 'Cosa succede se supero il limite di clienti?',
      a: 'Nessun problema! Il sistema ti avvisa in anticipo e puoi facilmente upgradare il piano. Non blocchiamo mai il servizio e non ci sono costi nascosti.'
    }
  ]

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img
              src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
              alt="OMNILY PRO"
              className="logo-image"
            />
          </div>
          <div className="nav-links">
            <a href="#features">Funzionalità</a>
            <a href="#pricing">Prezzi</a>
            <a href="#testimonials">Clienti</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-link">Accedi</Link>
            <Link to="/login" className="btn-nav-primary">
              Inizia Gratis
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="hero-section">
        <div className="hero-bg-gradient"></div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Piattaforma #1 in Italia per Customer Loyalty</span>
            </div>

            <h1 className="hero-title">
              La Loyalty che
              <span className="title-gradient"> Aumenta i Ricavi</span>
              <br />
              del 40% in 30 Giorni
            </h1>

            <p className="hero-description">
              OMNILY PRO è l'ecosistema completo Hardware + Software + AI che trasforma i tuoi clienti in fan fedeli.
              Lettore NFC, stampante termica, loyalty integrato. ROI garantito, setup in 24 ore.
            </p>

            <div className="hero-cta">
              <Link to="/login" className="btn-hero-primary">
                <Rocket size={20} />
                Inizia Gratis 30 Giorni
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                <BarChart3 size={18} />
                Vedi Dashboard
              </Link>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <CheckCircle size={18} />
                <span>Nessuna carta di credito</span>
              </div>
              <div className="trust-item">
                <CheckCircle size={18} />
                <span>Setup in 24 ore</span>
              </div>
              <div className="trust-item">
                <CheckCircle size={18} />
                <span>Support 24/7</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-mockup">
              <div className="mockup-window">
                <div className="window-header">
                  <div className="window-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="window-title">Dashboard OMNILY PRO</div>
                </div>
                <div className="window-content">
                  <div className="dashboard-stats">
                    <div className="stat-card">
                      <div className="stat-icon revenue">
                        <TrendingUp size={24} />
                      </div>
                      <div className="stat-value">€ 125.4K</div>
                      <div className="stat-label">Revenue Mensile</div>
                      <div className="stat-change positive">+42.5%</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon customers">
                        <Users size={24} />
                      </div>
                      <div className="stat-value">8,542</div>
                      <div className="stat-label">Clienti Attivi</div>
                      <div className="stat-change positive">+18.2%</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon retention">
                        <Award size={24} />
                      </div>
                      <div className="stat-value">87.3%</div>
                      <div className="stat-label">Retention Rate</div>
                      <div className="stat-change positive">+12.8%</div>
                    </div>
                  </div>
                  <div className="dashboard-chart">
                    <div className="chart-line"></div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="floating-card card-1">
                <Star size={16} fill="currentColor" />
                <span>+45% Retention</span>
              </div>
              <div className="floating-card card-2">
                <Zap size={16} />
                <span>Setup in 24h</span>
              </div>
              <div className="floating-card card-3">
                <TrendingUp size={16} />
                <span>€2.5M Revenue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated scroll indicator */}
        <div className="scroll-indicator">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Logos Bar - Social Proof */}
      <section className="logos-section">
        <div className="logos-container">
          <p className="logos-title">Si fidano di noi</p>
          <div className="logos-scroll">
            <div className="logo-item">RetailMax</div>
            <div className="logo-item">Fashion Group</div>
            <div className="logo-item">BeautyChain</div>
            <div className="logo-item">TechService</div>
            <div className="logo-item">GourmetItalia</div>
            <div className="logo-item">WellnessPro</div>
            <div className="logo-item">RetailMax</div>
            <div className="logo-item">Fashion Group</div>
          </div>
        </div>
      </section>

      {/* Stats Section - ROI Showcase */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-box-large">
            <div className="stat-number">{counters.companies.toLocaleString()}+</div>
            <div className="stat-text">Aziende Partner</div>
          </div>
          <div className="stat-box-large">
            <div className="stat-number">{(counters.transactions / 1000000).toFixed(1)}M+</div>
            <div className="stat-text">Transazioni Gestite</div>
          </div>
          <div className="stat-box-large">
            <div className="stat-number">{counters.retention}%</div>
            <div className="stat-text">Aumento Retention Medio</div>
          </div>
          <div className="stat-box-large">
            <div className="stat-number">99.9%</div>
            <div className="stat-text">Uptime Garantito</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header-center">
            <div className="section-badge">
              <Rocket size={16} />
              <span>Semplice e Veloce</span>
            </div>
            <h2>Come Funziona OMNILY PRO</h2>
            <p>Dalla registrazione al primo cliente fidelizzato in meno di 24 ore</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <Rocket size={48} />
              </div>
              <h3>Registrati in 2 Minuti</h3>
              <p>Crea il tuo account gratuito, nessuna carta di credito richiesta. Accesso immediato a tutte le funzionalità PRO per 30 giorni.</p>
              <div className="step-time">
                <Clock size={16} />
                <span>2 minuti</span>
              </div>
            </div>

            <div className="step-arrow">
              <ArrowRight size={32} />
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <Building2 size={48} />
              </div>
              <h3>Configura il Tuo Brand</h3>
              <p>Wizard guidato per impostare logo, colori, programma punti e livelli fedeltà. Il nostro team ti supporta nell'onboarding completo.</p>
              <div className="step-time">
                <Clock size={16} />
                <span>15 minuti</span>
              </div>
            </div>

            <div className="step-arrow">
              <ArrowRight size={32} />
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <Zap size={48} />
              </div>
              <h3>Lancia e Inizia</h3>
              <p>Attiva il sistema, integra con il tuo POS o e-commerce, stampa le prime tessere NFC e inizia a raccogliere dati clienti subito.</p>
              <div className="step-time">
                <Clock size={16} />
                <span>1 ora</span>
              </div>
            </div>

            <div className="step-arrow">
              <ArrowRight size={32} />
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">
                <BarChart3 size={48} />
              </div>
              <h3>Analizza e Ottimizza</h3>
              <p>Dashboard real-time con AI per segmentazione automatica, campagne personalizzate e analytics predittive. ROI visibile dalla prima settimana.</p>
              <div className="step-time">
                <Clock size={16} />
                <span>Continuo</span>
              </div>
            </div>
          </div>

          <div className="how-it-works-cta">
            <Link to="/login" className="btn-primary-large">
              <Rocket size={20} />
              Inizia Ora Gratis
              <ArrowRight size={20} />
            </Link>
            <p className="cta-subtitle">Setup completo in meno di 24 ore • Nessun rischio</p>
          </div>
        </div>
      </section>

      {/* Industry Tabs */}
      <section className="industry-section">
        <div className="industry-container">
          <div className="section-header-center">
            <h2>Risultati Reali per Ogni Settore</h2>
            <p>Casi d'uso e ROI dimostrati per la tua industry</p>
          </div>

          <div className="industry-tabs">
            {industries.map(industry => (
              <button
                key={industry.id}
                className={`industry-tab ${activeTab === industry.id ? 'active' : ''}`}
                onClick={() => setActiveTab(industry.id)}
              >
                <industry.icon size={20} />
                {industry.name}
              </button>
            ))}
          </div>

          <div className="industry-content">
            {industries.filter(i => i.id === activeTab).map(industry => (
              <div key={industry.id} className="industry-results">
                <div className="result-card">
                  <TrendingUp className="result-icon" size={32} />
                  <div className="result-value">{industry.revenue}</div>
                  <div className="result-label">Revenue Growth</div>
                </div>
                <div className="result-card">
                  <Users className="result-icon" size={32} />
                  <div className="result-value">{industry.customers}</div>
                  <div className="result-label">Clienti Gestiti</div>
                </div>
                <div className="result-card">
                  <Award className="result-icon" size={32} />
                  <div className="result-value">87%</div>
                  <div className="result-label">Customer Satisfaction</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header-center">
            <div className="section-badge">
              <Target size={16} />
              <span>Tutto quello che serve</span>
            </div>
            <h2>Una Piattaforma Completa ed Enterprise-Ready</h2>
            <p>Ogni funzionalità pensata per massimizzare il ROI della tua loyalty</p>
          </div>

          <div className="features-grid-enhanced">
            <div className="feature-card-large">
              <div className="feature-icon-large">
                <Building2 size={40} />
              </div>
              <h3>Multi-Tenant Architecture</h3>
              <p>Gestisci più brand, location e organizzazioni da un'unica dashboard con isolamento completo dei dati e sicurezza enterprise.</p>
              <ul className="feature-benefits">
                <li><Check size={16} /> Isolamento dati certificato</li>
                <li><Check size={16} /> Branding personalizzato per tenant</li>
                <li><Check size={16} /> Gestione utenti granulare</li>
                <li><Check size={16} /> White-label completo</li>
              </ul>
            </div>

            <div className="feature-card-large">
              <div className="feature-icon-large">
                <BarChart3 size={40} />
              </div>
              <h3>Analytics Predittive AI-Powered</h3>
              <p>Dashboard real-time con machine learning per prevedere churn, segmentare clienti e ottimizzare le campagne automaticamente.</p>
              <ul className="feature-benefits">
                <li><Check size={16} /> Predictive churn analysis</li>
                <li><Check size={16} /> Segmentazione automatica</li>
                <li><Check size={16} /> KPI personalizzabili</li>
                <li><Check size={16} /> Export e API complete</li>
              </ul>
            </div>

            <div className="feature-card-large">
              <div className="feature-icon-large">
                <Zap size={40} />
              </div>
              <h3>Automazioni Marketing</h3>
              <p>Workflow personalizzabili per email, SMS e push notifications con trigger comportamentali e A/B testing integrato.</p>
              <ul className="feature-benefits">
                <li><Check size={16} /> Email automation</li>
                <li><Check size={16} /> SMS campaigns</li>
                <li><Check size={16} /> Behavioral triggers</li>
                <li><Check size={16} /> A/B testing nativo</li>
              </ul>
            </div>

            <div className="feature-card-large">
              <div className="feature-icon-large">
                <Smartphone size={40} />
              </div>
              <h3>Ecosistema Hardware Integrato</h3>
              <p>Hardware Z108 professionale con lettore NFC, stampante termica, scanner QR e touchscreen integrati in un unico dispositivo all-in-one.</p>
              <ul className="feature-benefits">
                <li><Check size={16} /> Lettore NFC tessere loyalty</li>
                <li><Check size={16} /> Stampante termica integrata</li>
                <li><Check size={16} /> Scanner QR e barcode</li>
                <li><Check size={16} /> Touchscreen 7" HD</li>
              </ul>
            </div>

            <div className="feature-card-large">
              <div className="feature-icon-large">
                <Shield size={40} />
              </div>
              <h3>Sicurezza Enterprise</h3>
              <p>GDPR compliant, ISO 27001, crittografia end-to-end, SSO, 2FA e audit trail completi per la massima sicurezza.</p>
              <ul className="feature-benefits">
                <li><Check size={16} /> GDPR & ISO 27001</li>
                <li><Check size={16} /> End-to-end encryption</li>
                <li><Check size={16} /> SSO & 2FA</li>
                <li><Check size={16} /> Audit logs completi</li>
              </ul>
            </div>

            <div className="feature-card-large">
              <div className="feature-icon-large">
                <RefreshCw size={40} />
              </div>
              <h3>Integrazioni Native</h3>
              <p>API REST complete, webhook real-time e connettori pre-built per i principali tools di marketing e vendita.</p>
              <ul className="feature-benefits">
                <li><Check size={16} /> REST API completa</li>
                <li><Check size={16} /> Webhook real-time</li>
                <li><Check size={16} /> Shopify, WooCommerce</li>
                <li><Check size={16} /> Mailchimp, HubSpot</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Enhanced */}
      <section className="pricing-section-enhanced" id="pricing">
        <div className="pricing-container-enhanced">
          <div className="section-header-center">
            <div className="section-badge">
              <DollarSign size={16} />
              <span>Prezzi Trasparenti</span>
            </div>
            <h2>Piani Pensati per Crescere con Te</h2>
            <p>Inizia gratis, scala quando serve. Nessun costo nascosto, nessun contratto annuale obbligatorio.</p>
          </div>

          <div className="pricing-cards">
            <div className="pricing-card-enhanced">
              <div className="pricing-header">
                <h3>Basic</h3>
                <div className="pricing-price-large">
                  <span className="price-currency">€</span>
                  <span className="price-amount">49</span>
                  <span className="price-period">/mese</span>
                </div>
                <p className="pricing-desc">Il Negozio Smart - Setup €299 una tantum</p>
              </div>
              <ul className="pricing-features-enhanced">
                <li><CheckCircle size={18} /> Ecosistema Hardware Completo Z108</li>
                <li><CheckCircle size={18} /> Lettore NFC + Stampante Termica</li>
                <li><CheckCircle size={18} /> 100 tessere NFC brandizzate</li>
                <li><CheckCircle size={18} /> Fino a 500 clienti attivi</li>
                <li><CheckCircle size={18} /> Sistema Loyalty integrato</li>
                <li><CheckCircle size={18} /> AI Customer segmentation</li>
                <li><CheckCircle size={18} /> Email & SMS automation</li>
                <li><CheckCircle size={18} /> Dashboard analytics real-time</li>
              </ul>
              <Link to="/login" className="pricing-button outline">
                Inizia Ora
              </Link>
            </div>

            <div className="pricing-card-enhanced featured">
              <div className="pricing-badge-featured">
                <Star size={14} fill="currentColor" />
                Più Popolare
              </div>
              <div className="pricing-header">
                <h3>Pro</h3>
                <div className="pricing-price-large">
                  <span className="price-currency">€</span>
                  <span className="price-amount">99</span>
                  <span className="price-period">/mese</span>
                </div>
                <p className="pricing-desc">Il Business Digitale AI-Powered - Setup €299</p>
              </div>
              <ul className="pricing-features-enhanced">
                <li><CheckCircle size={18} /> Tutto del Basic +</li>
                <li><CheckCircle size={18} /> Gift Cards & Referral</li>
                <li><CheckCircle size={18} /> WhatsApp Business integration</li>
                <li><CheckCircle size={18} /> AI Marketing automation</li>
                <li><CheckCircle size={18} /> AI Revenue optimization</li>
                <li><CheckCircle size={18} /> Gestione fino a 3 sedi</li>
                <li><CheckCircle size={18} /> API & Webhook completi</li>
                <li><CheckCircle size={18} /> Support telefono 4h</li>
              </ul>
              <Link to="/login" className="pricing-button primary">
                Inizia Subito
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="pricing-card-enhanced">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <div className="pricing-price-large">
                  <span className="price-currency">€</span>
                  <span className="price-amount">199</span>
                  <span className="price-period">/mese</span>
                </div>
                <p className="pricing-desc">L'Ecosistema Business Completo AI - Setup €299</p>
              </div>
              <ul className="pricing-features-enhanced">
                <li><CheckCircle size={18} /> Tutto del Pro +</li>
                <li><CheckCircle size={18} /> AI Custom model training</li>
                <li><CheckCircle size={18} /> White label completo</li>
                <li><CheckCircle size={18} /> E-commerce integrato</li>
                <li><CheckCircle size={18} /> Multi-location illimitato</li>
                <li><CheckCircle size={18} /> Account manager dedicato</li>
                <li><CheckCircle size={18} /> Support priority 1h</li>
                <li><CheckCircle size={18} /> SLA 99.9% uptime</li>
              </ul>
              <button className="pricing-button outline">
                <Phone size={18} />
                Contattaci
              </button>
            </div>
          </div>

          <div className="pricing-guarantee">
            <Shield size={20} />
            <p><strong>Garanzia 30 giorni soddisfatti o rimborsati</strong> • Nessun rischio, nessun contratto vincolante</p>
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="testimonials-section-enhanced" id="testimonials">
        <div className="testimonials-container-enhanced">
          <div className="section-header-center">
            <h2>Storie di Successo dei Nostri Clienti</h2>
            <p>Oltre 200 aziende hanno già trasformato la loro customer loyalty</p>
          </div>

          <div className="testimonials-grid-enhanced">
            <div className="testimonial-card-enhanced">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <blockquote>
                "In 6 mesi abbiamo aumentato la retention del 45% e il revenue per cliente del 30%.
                OMNILY PRO ha completamente trasformato il nostro approccio alla customer loyalty.
                Setup velocissimo e ROI visibile dalla prima settimana."
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">MR</div>
                <div className="author-details">
                  <div className="author-name">Marco Rossi</div>
                  <div className="author-role">CEO, RetailMax Italia</div>
                  <div className="author-company">Retail • 45 store</div>
                </div>
              </div>
              <div className="testimonial-stats">
                <div className="stat-small">
                  <span className="stat-value">+45%</span>
                  <span className="stat-label">Retention</span>
                </div>
                <div className="stat-small">
                  <span className="stat-value">+30%</span>
                  <span className="stat-label">Revenue</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card-enhanced">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <blockquote>
                "La piattaforma più completa sul mercato italiano. Abbiamo migrato 3 brand in una settimana
                senza problemi. Il support è eccezionale e le funzionalità enterprise sono vere, non promesse."
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">GB</div>
                <div className="author-details">
                  <div className="author-name">Giulia Bianchi</div>
                  <div className="author-role">Marketing Director, Fashion Group</div>
                  <div className="author-company">Fashion • 3 brand</div>
                </div>
              </div>
              <div className="testimonial-stats">
                <div className="stat-small">
                  <span className="stat-value">3</span>
                  <span className="stat-label">Brand</span>
                </div>
                <div className="stat-small">
                  <span className="stat-value">7 giorni</span>
                  <span className="stat-label">Setup</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card-enhanced">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <blockquote>
                "Analytics incredibili e automazioni che ci hanno fatto risparmiare 20 ore settimanali.
                Il ROI è stato immediato. Consigliato a tutte le catene che vogliono fare loyalty seriamente."
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">AV</div>
                <div className="author-details">
                  <div className="author-name">Andrea Verdi</div>
                  <div className="author-role">CTO, HospitalityTech</div>
                  <div className="author-company">Hospitality • 28 location</div>
                </div>
              </div>
              <div className="testimonial-stats">
                <div className="stat-small">
                  <span className="stat-value">20h</span>
                  <span className="stat-label">Risparmiate</span>
                </div>
                <div className="stat-small">
                  <span className="stat-value">ROI</span>
                  <span className="stat-label">Immediato</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="faq-container">
          <div className="section-header-center">
            <div className="section-badge">
              <MessageSquare size={16} />
              <span>Domande Frequenti</span>
            </div>
            <h2>Tutto Quello che Devi Sapere</h2>
            <p>Risposte alle domande più comuni su OMNILY PRO</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${faqOpen === index ? 'open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <ChevronDown className="faq-icon" size={24} />
                </div>
                {faqOpen === index && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="faq-cta">
            <p>Altre domande? Il nostro team è qui per aiutarti</p>
            <button className="btn-faq">
              <Mail size={18} />
              Contatta il Support
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA - Enhanced */}
      <section className="cta-section-final">
        <div className="cta-container-final">
          <div className="cta-content">
            <div className="cta-badge">
              <Rocket size={18} />
              <span>Inizia Oggi</span>
            </div>
            <h2>Pronto a Trasformare la Tua Customer Loyalty?</h2>
            <p>Unisciti a oltre 200 aziende che hanno già aumentato i ricavi del 40% con OMNILY PRO.
            Setup in 24 ore, ROI garantito, zero rischio.</p>

            <div className="cta-buttons">
              <Link to="/login" className="btn-cta-primary">
                <Rocket size={20} />
                Inizia Gratis 30 Giorni
                <ArrowRight size={20} />
              </Link>
              <button className="btn-cta-secondary">
                <Phone size={18} />
                Prenota Demo
              </button>
            </div>

            <div className="cta-features">
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>Nessuna carta di credito</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>Setup in 24 ore</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>Support 24/7</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>Garanzia 30 giorni</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <img
                src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
                alt="OMNILY PRO"
                className="logo-image-footer"
              />
            </div>
            <p>L'ecosistema completo Hardware + Software + AI per la customer loyalty che genera ROI reale.</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Prodotto</h4>
              <a href="#features">Funzionalità</a>
              <a href="#pricing">Prezzi</a>
              <a href="#">Integrazioni</a>
              <a href="#">API Docs</a>
              <a href="#">Clienti</a>
              <a href="#">Blog</a>
            </div>
            <div className="footer-column">
              <h4>Supporto</h4>
              <a href="#faq">FAQ</a>
              <a href="#">Documentazione</a>
              <a href="#">Status</a>
              <a href="#">Contatti</a>
              <a href="#">Chi Siamo</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Legal & Sicurezza</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">GDPR Compliance</a>
              <a href="#">Cookie Policy</a>
              <a href="#">Security</a>
              <a href="#">SLA</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 OMNILY PRO. All rights reserved.</p>
          <div className="footer-badges">
            <span className="badge-item">🔒 GDPR Compliant</span>
            <span className="badge-item">🛡️ ISO 27001</span>
            <span className="badge-item">⚡ 99.9% Uptime</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
