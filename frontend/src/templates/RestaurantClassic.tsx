import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import './RestaurantClassic.css';

interface RestaurantClassicProps {
  website: {
    nome: string;
    subdomain: string;
    contenuto: any;
    organization_id: string;
  };
  organizationName?: string;
}

const RestaurantClassic: React.FC<RestaurantClassicProps> = ({ website, organizationName }) => {
  const { contenuto } = website;

  // Default content structure
  const defaultContent = {
    hero: {
      titolo: organizationName || website.nome,
      sottotitolo: 'Benvenuti nel nostro locale',
      immagine: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=800&fit=crop'
    },
    menu: {
      piatti: []
    },
    about: {
      testo: 'La nostra storia e la nostra passione per la cucina di qualità.'
    },
    contatti: {
      telefono: '',
      email: '',
      indirizzo: '',
      orari: {}
    }
  };

  // Merge with actual content
  const content = { ...defaultContent, ...contenuto };

  return (
    <div className="restaurant-classic">
      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${content.hero.immagine})`
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{content.hero.titolo}</h1>
          <p className="hero-subtitle">{content.hero.sottotitolo}</p>
        </div>
      </section>

      {/* About Section */}
      {content.about && (
        <section className="about-section">
          <div className="section-container">
            <h2 className="section-title">Chi Siamo</h2>
            <p className="section-text">
              {content.about.testo}
            </p>
          </div>
        </section>
      )}

      {/* Menu Section */}
      {content.menu && content.menu.piatti && content.menu.piatti.length > 0 && (
        <section className="menu-section">
          <div className="section-container">
            <h2 className="section-title">Il Nostro Menu</h2>
            <div className="menu-items">
              {content.menu.piatti.map((piatto: any, index: number) => (
                <div key={index} className="menu-item">
                  <div className="menu-item-header">
                    <h3 className="menu-item-name">{piatto.nome}</h3>
                    {piatto.prezzo && (
                      <span className="menu-item-price">€{piatto.prezzo}</span>
                    )}
                  </div>
                  {piatto.descrizione && (
                    <p className="menu-item-description">{piatto.descrizione}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="contact-section">
        <div className="section-container">
          <h2 className="section-title">Contattaci</h2>

          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info">
              {content.contatti.telefono && (
                <div className="contact-item">
                  <Phone className="contact-icon" size={24} />
                  <div className="contact-details">
                    <h3>Telefono</h3>
                    <a href={`tel:${content.contatti.telefono}`}>
                      {content.contatti.telefono}
                    </a>
                  </div>
                </div>
              )}

              {content.contatti.email && (
                <div className="contact-item">
                  <Mail className="contact-icon" size={24} />
                  <div className="contact-details">
                    <h3>Email</h3>
                    <a href={`mailto:${content.contatti.email}`}>
                      {content.contatti.email}
                    </a>
                  </div>
                </div>
              )}

              {content.contatti.indirizzo && (
                <div className="contact-item">
                  <MapPin className="contact-icon" size={24} />
                  <div className="contact-details">
                    <h3>Indirizzo</h3>
                    <p>{content.contatti.indirizzo}</p>
                  </div>
                </div>
              )}

              {content.contatti.orari && Object.keys(content.contatti.orari).length > 0 && (
                <div className="contact-item">
                  <Clock className="contact-icon" size={24} />
                  <div className="contact-details">
                    <h3>Orari</h3>
                    <div className="opening-hours">
                      {Object.entries(content.contatti.orari).map(([giorno, orario]) => (
                        <div key={giorno} className="opening-day">
                          <span className="opening-day-name">{giorno}:</span>
                          <span className="opening-day-time">{orario as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map Placeholder */}
            <div className="map-placeholder">
              <p>Mappa Google Maps</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <p className="footer-text">
          © {new Date().getFullYear()} {content.hero.titolo}. Powered by OmnilyPro.
        </p>
      </footer>
    </div>
  );
};

export default RestaurantClassic;
