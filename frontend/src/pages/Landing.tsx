import React from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Building2, Shield, BarChart3, Zap, Users, TrendingUp, Award, CheckCircle, ArrowRight, Play, Star } from 'lucide-react'

const Landing: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Rocket size={16} />
            #1 Loyalty Platform Italia
          </div>
          <h1 className="hero-title">
            Trasforma la Customer Loyalty
            <span className="title-accent">della tua Azienda</span>
          </h1>
          <p className="hero-subtitle">
            OMNILY PRO è la piattaforma SaaS che permette alle aziende italiane di creare, gestire e ottimizzare programmi loyalty enterprise con ROI garantito del +40%.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">
              Inizia Gratis 30 Giorni
              <ArrowRight size={20} />
            </Link>
            <button className="btn btn-demo">
              <Play size={18} />
              Vedi Demo Live
            </button>
          </div>
          
          <div className="hero-trust">
            <p>Già scelto da:</p>
            <div className="trust-logos">
              <div className="trust-item">🏢 200+ Aziende</div>
              <div className="trust-item">⚡ 1M+ Transazioni</div>
              <div className="trust-item">🏆 99.9% Uptime</div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="preview-title">OMNILY PRO Dashboard</div>
            </div>
            <div className="preview-content">
              <div className="preview-sidebar">
                <div className="sidebar-item active">📊 Dashboard</div>
                <div className="sidebar-item">🎯 Campaigns</div>
                <div className="sidebar-item">👥 Customers</div>
                <div className="sidebar-item">📈 Analytics</div>
              </div>
              <div className="preview-main">
                <div className="preview-stats">
                  <div className="stat-box">17.5K<br/><small>Stamps</small></div>
                  <div className="stat-box">1.8K<br/><small>Rewards</small></div>
                  <div className="stat-box">845<br/><small>Customers</small></div>
                </div>
                <div className="preview-chart">
                  <div className="chart-bars">
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '80%'}}></div>
                    <div className="bar" style={{height: '45%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                    <div className="bar" style={{height: '65%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ROI Section */}
      <div className="roi-section">
        <div className="roi-container">
          <div className="roi-content">
            <h2>ROI Dimostrato in 30 Giorni</h2>
            <div className="roi-stats">
              <div className="roi-stat">
                <div className="roi-number">+40%</div>
                <div className="roi-label">Ritorno Clienti</div>
              </div>
              <div className="roi-stat">
                <div className="roi-number">+65%</div>
                <div className="roi-label">Engagement</div>
              </div>
              <div className="roi-stat">
                <div className="roi-number">-30%</div>
                <div className="roi-label">Costi Acquisizione</div>
              </div>
              <div className="roi-stat">
                <div className="roi-number">€2.5M</div>
                <div className="roi-label">Revenue Generato</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="features-section">
        <div className="features-header">
          <h2>Tutto quello che serve per il successo</h2>
          <p>Una piattaforma completa per trasformare la customer experience della tua azienda</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Building2 size={32} />
            </div>
            <h3>Multi-Tenant Enterprise</h3>
            <p>Gestione simultanea di più brand e organizzazioni con isolamento completo dei dati e personalizzazione per ogni tenant.</p>
            <ul className="feature-list">
              <li><CheckCircle size={16} /> Isolamento dati garantito</li>
              <li><CheckCircle size={16} /> Branding personalizzato</li>
              <li><CheckCircle size={16} /> Gestione centralizzata</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart3 size={32} />
            </div>
            <h3>Analytics Avanzate</h3>
            <p>Dashboard in tempo reale con metriche dettagliate, segmentazione clienti e insights predittivi per ottimizzare le strategie.</p>
            <ul className="feature-list">
              <li><CheckCircle size={16} /> Real-time dashboards</li>
              <li><CheckCircle size={16} /> Predictive analytics</li>
              <li><CheckCircle size={16} /> Customer segmentation</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={32} />
            </div>
            <h3>Sicurezza Enterprise</h3>
            <p>Conformità GDPR, crittografia end-to-end, audit trail completi e controllo accessi granulare per la massima sicurezza.</p>
            <ul className="feature-list">
              <li><CheckCircle size={16} /> GDPR Compliant</li>
              <li><CheckCircle size={16} /> End-to-end encryption</li>
              <li><CheckCircle size={16} /> Audit trails completi</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Pricing Section */}
      <div className="pricing-section">
        <div className="pricing-header">
          <h2>Piani su Misura per la tua Azienda</h2>
          <p>Inizia gratis, scala quando serve. Nessun costo nascosto.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-header-card">
              <h3>Starter</h3>
              <div className="pricing-price">Gratis</div>
              <div className="pricing-period">30 giorni di prova</div>
            </div>
            <ul className="pricing-features">
              <li><CheckCircle size={16} /> Fino a 500 clienti</li>
              <li><CheckCircle size={16} /> 3 campagne loyalty</li>
              <li><CheckCircle size={16} /> Analytics base</li>
              <li><CheckCircle size={16} /> Support email</li>
            </ul>
            <Link to="/login" className="btn btn-outline">Inizia Gratis</Link>
          </div>
          
          <div className="pricing-card featured">
            <div className="pricing-badge">Più Popolare</div>
            <div className="pricing-header-card">
              <h3>Professional</h3>
              <div className="pricing-price">€299<span>/mese</span></div>
              <div className="pricing-period">Fatturazione annuale</div>
            </div>
            <ul className="pricing-features">
              <li><CheckCircle size={16} /> Fino a 10.000 clienti</li>
              <li><CheckCircle size={16} /> Campagne illimitate</li>
              <li><CheckCircle size={16} /> Analytics avanzate</li>
              <li><CheckCircle size={16} /> API completa</li>
              <li><CheckCircle size={16} /> Support prioritario</li>
              <li><CheckCircle size={16} /> Branding personalizzato</li>
            </ul>
            <Link to="/login" className="btn btn-primary">Inizia Subito</Link>
          </div>
          
          <div className="pricing-card">
            <div className="pricing-header-card">
              <h3>Enterprise</h3>
              <div className="pricing-price">Custom</div>
              <div className="pricing-period">Contattaci per un preventivo</div>
            </div>
            <ul className="pricing-features">
              <li><CheckCircle size={16} /> Clienti illimitati</li>
              <li><CheckCircle size={16} /> Multi-tenant</li>
              <li><CheckCircle size={16} /> White-label completo</li>
              <li><CheckCircle size={16} /> SLA garantito</li>
              <li><CheckCircle size={16} /> Account manager dedicato</li>
              <li><CheckCircle size={16} /> Onboarding personalizzato</li>
            </ul>
            <button className="btn btn-outline">Contattaci</button>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="testimonials-section">
        <div className="testimonials-header">
          <h2>Cosa dicono i nostri clienti</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p>"OMNILY PRO ha trasformato il nostro business. In 6 mesi abbiamo aumentato la retention del 45% e il revenue per cliente del 30%."</p>
            <div className="testimonial-author">
              <div className="author-info">
                <div className="author-name">Marco Rossi</div>
                <div className="author-title">CEO, RetailMax Italia</div>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p>"La piattaforma più completa sul mercato. Setup in 24 ore e ROI visibile dalla prima settimana. Consigliatissimo!"</p>
            <div className="testimonial-author">
              <div className="author-info">
                <div className="author-name">Giulia Bianchi</div>
                <div className="author-title">Marketing Director, Fashion Group</div>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p>"Support incredibile e funzionalità enterprise vere. Abbiamo migrato 3 brand in una settimana senza problemi."</p>
            <div className="testimonial-author">
              <div className="author-info">
                <div className="author-name">Andrea Verdi</div>
                <div className="author-title">CTO, HospitalityTech</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-container">
          <h2>Pronto per trasformare la tua Customer Loyalty?</h2>
          <p>Unisciti a oltre 200 aziende che hanno già aumentato i ricavi del 40% con OMNILY PRO</p>
          <div className="cta-actions">
            <Link to="/login" className="btn btn-primary btn-large">
              Inizia Gratis 30 Giorni
              <ArrowRight size={20} />
            </Link>
            <button className="btn btn-outline btn-large">
              Prenota Demo
            </button>
          </div>
          <div className="cta-guarantee">
            <p>✅ Setup gratuito • ✅ Nessun contratto • ✅ Support 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing