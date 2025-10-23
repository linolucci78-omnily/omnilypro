import React from 'react';
import './RestaurantClassic.css';

// Helper function to extract content from Directus sections/components structure
const extractContentFromDirectus = (sections: any[]) => {
  const content: any = {};

  console.log('📦 Processing sections:', sections);

  sections.forEach((section: any) => {
    const sectionType = section.section_type;
    const components = section.components || [];

    console.log(`📄 Section type: ${sectionType}, components:`, components);

    // Map section types to content structure
    if (sectionType === 'hero') {
      const headingComp = components.find((c: any) => c.component_type === 'heading');
      const buttonComp = components.find((c: any) => c.component_type === 'button');
      const imageComp = components.find((c: any) => c.component_type === 'image');

      console.log('🎯 Hero heading:', headingComp);
      console.log('🎯 Hero button:', buttonComp);
      console.log('🎯 Hero image:', imageComp);

      content.hero = {
        title: headingComp?.content_text || headingComp?.content || '',
        subtitle: '',
        cta_text: buttonComp?.content_text || buttonComp?.content || 'Scopri di più',
        image_url: imageComp?.image_url || ''
      };

      console.log('🎯 Hero content created:', content.hero);
    } else if (sectionType === 'menu' || sectionType === 'menu_food') {
      const menuComponents = components.filter((c: any) => c.component_type === 'menu_item');
      console.log('🍽️ Menu components:', menuComponents);

      content.menu = {
        title: section.section_title || 'Il Nostro Menu',
        items: menuComponents.map((c: any) => {
          const item = {
            nome: c.name || c.content || '',
            descrizione: c.description || '',
            prezzo: c.price ? parseFloat(c.price) : 0,
            foto: c.image_url || ''
          };
          console.log('🍽️ Menu item created:', item);
          return item;
        })
      };

      console.log('🍽️ Menu content created:', content.menu);
    } else if (sectionType === 'gallery') {
      const imageComponents = components.filter((c: any) => c.component_type === 'image');
      content.gallery = {
        title: section.section_title || 'La Nostra Gallery',
        images: imageComponents.map((c: any) => c.image_url || '')
      };
    } else if (sectionType === 'about') {
      content.about = {
        title: section.section_title || 'Chi Siamo',
        text: components.find((c: any) => c.component_type === 'text' || c.component_type === 'paragraph')?.content || ''
      };
    } else if (sectionType === 'contact' || sectionType === 'footer') {
      const phoneComp = components.find((c: any) => c.component_type === 'contact_phone');
      const emailComp = components.find((c: any) => c.component_type === 'contact_email');
      const addressComp = components.find((c: any) => c.component_type === 'contact_address');

      content.contact = {
        phone: phoneComp?.content || '',
        email: emailComp?.content || '',
        address: addressComp?.content || ''
      };
    }
  });

  return content;
};

// Professional Restaurant Template - Full Screen & Modern Design
// Content structure is designed to be easily editable via POS forms
const RestaurantClassic = ({ website, organizationName }: any) => {
  // Extract content from website object
  // Support both old Strapi format (contenuto/content) and new Directus format (pages/sections/components)
  let content = website?.contenuto || website?.content || {};

  // If content is empty, try to extract from Directus structure
  if (!content || Object.keys(content).length === 0) {
    if (website?.pages && website.pages.length > 0) {
      const homepage = website.pages.find((p: any) => p.is_homepage) || website.pages[0];

      console.log('🔍 Extracting from Directus structure');
      console.log('Homepage:', homepage);
      console.log('Sections:', homepage?.sections);

      if (homepage?.sections) {
        content = extractContentFromDirectus(homepage.sections);
        console.log('✅ Extracted content:', content);
      }
    }
  }

  if (!content || Object.keys(content).length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Errore: contenuto non disponibile.</h2>
        <p>Il sito non è stato ancora configurato con contenuti.</p>
        <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '1rem', marginTop: '2rem' }}>
          {JSON.stringify({ website, content }, null, 2)}
        </pre>
      </div>
    );
  }

  // Safely access content with fallbacks
  const hero = content.hero || {};
  const heroTitle = hero.title || 'Benvenuti';
  const heroSubtitle = hero.subtitle || 'La nostra cucina, la vostra passione';
  const heroCta = hero.cta_text || 'Scopri di più';
  const heroImage = hero.image_url;

  const menu = content.menu || {};
  const menuTitle = menu.title || 'Il Nostro Menu';
  const menuItems = menu.items || [];

  const gallery = content.gallery || {};
  const galleryTitle = gallery.title || 'La Nostra Gallery';
  const galleryImages = gallery.images || [];

  const about = content.about || {};
  const aboutTitle = about.title || 'Chi Siamo';
  const aboutText = about.text || 'La nostra storia e passione per la cucina.';

  const contact = content.contact || {};
  const restaurantName = content.nome || website?.site_name || organizationName || 'Ristorante';
  const phone = contact.phone || '';
  const email = contact.email || '';
  const address = contact.address || '';

  return (
    <div className="restaurant-template">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">{restaurantName}</div>
          <div className="navbar-menu">
            <a href="#hero" className="navbar-link">Home</a>
            <a href="#menu" className="navbar-link">Menu</a>
            <a href="#gallery" className="navbar-link">Gallery</a>
            <a href="#about" className="navbar-link">Chi Siamo</a>
            <a href="#loyalty" className="navbar-link">Programma Fedeltà</a>
            <a href="#contact" className="navbar-link">Contatti</a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Fullscreen */}
      <div
        id="hero"
        className={`hero-section ${heroImage ? 'has-image' : ''}`}
      >
        {heroImage && (
          <img
            src={heroImage}
            alt="Hero background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0
            }}
          />
        )}
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">{heroTitle}</h1>
          <p className="hero-subtitle">{heroSubtitle}</p>
          <a href="#menu" className="hero-cta">{heroCta}</a>
        </div>
      </div>

      {/* Menu Section */}
      {menuItems.length > 0 && (
        <section id="menu" className="menu-section">
          <h2 className="section-title">{menuTitle}</h2>
          <div className="menu-container">
            {menuItems.map((item: any, index: number) => (
              <div key={index} className="menu-item">
                {item.foto && (
                  <img
                    src={item.foto}
                    alt={item.nome || 'Piatto'}
                    className="menu-item-image"
                  />
                )}
                <div className="menu-item-content">
                  <div className="menu-item-header">
                    <h3 className="menu-item-name">{item.nome || 'Piatto'}</h3>
                    {item.prezzo && (
                      <span className="menu-item-price">€{item.prezzo.toFixed(2)}</span>
                    )}
                  </div>
                  {item.descrizione && (
                    <p className="menu-item-description">{item.descrizione}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="gallery-section">
          <h2 className="section-title">{galleryTitle}</h2>
          <div className="gallery-grid">
            {galleryImages.map((image: any, index: number) => (
              <div key={index} className="gallery-item">
                <img src={image.url || image} alt={`Gallery ${index + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      {aboutText && (
        <section id="about" className="about-section">
          <div className="about-container">
            <h2 className="section-title">{aboutTitle}</h2>
            <p className="about-text">{aboutText}</p>
          </div>
        </section>
      )}

      {/* Loyalty Program Section */}
      <section id="loyalty" className="loyalty-section">
        <div className="loyalty-container">
          <div className="loyalty-header">
            <div className="loyalty-badge">PROGRAMMA FEDELTÀ</div>
            <h2 className="loyalty-main-title">Ogni Acquisto ti Premia</h2>
            <p className="loyalty-subtitle">Inizia subito a guadagnare vantaggi esclusivi</p>
          </div>

          <div className="loyalty-stats">
            <div className="loyalty-stat">
              <div className="stat-value">10%</div>
              <div className="stat-label">Cashback sui primi acquisti</div>
            </div>
            <div className="loyalty-stat-divider"></div>
            <div className="loyalty-stat">
              <div className="stat-value">Gratis</div>
              <div className="stat-label">Iscrizione senza costi</div>
            </div>
            <div className="loyalty-stat-divider"></div>
            <div className="loyalty-stat">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Vantaggi sempre attivi</div>
            </div>
          </div>

          <div className="loyalty-benefits">
            <div className="loyalty-benefit">
              <div className="loyalty-benefit-header">
                <div className="loyalty-number">1</div>
                <h3 className="loyalty-benefit-title">Accumula Punti</h3>
              </div>
              <p className="loyalty-benefit-text">1€ speso = 1 punto guadagnato<br/>100 punti = 10€ di sconto</p>
            </div>
            <div className="loyalty-benefit">
              <div className="loyalty-benefit-header">
                <div className="loyalty-number">2</div>
                <h3 className="loyalty-benefit-title">Scegli il Tuo Premio</h3>
              </div>
              <p className="loyalty-benefit-text">Prodotti gratuiti, buoni sconto<br/>o offerte speciali personalizzate</p>
            </div>
            <div className="loyalty-benefit">
              <div className="loyalty-benefit-header">
                <div className="loyalty-number">3</div>
                <h3 className="loyalty-benefit-title">Accesso Prioritario</h3>
              </div>
              <p className="loyalty-benefit-text">Anteprime esclusive, eventi VIP<br/>e promozioni prima di tutti</p>
            </div>
          </div>

          <div className="loyalty-cta-section">
            <div className="loyalty-cta-wrapper">
              <a href="#contact" className="loyalty-cta-primary">Iscriviti Gratis Ora</a>
              <p className="loyalty-guarantee">Nessun costo nascosto • Vantaggi immediati • Cancellazione gratuita</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2 className="section-title" style={{ color: 'white' }}>Contattaci</h2>
        <div className="contact-container">
          {phone && (
            <div className="contact-item">
              <h3 className="contact-title">Telefono</h3>
              <p className="contact-info">
                <a href={`tel:${phone}`} className="contact-link">{phone}</a>
              </p>
            </div>
          )}
          {email && (
            <div className="contact-item">
              <h3 className="contact-title">Email</h3>
              <p className="contact-info">
                <a href={`mailto:${email}`} className="contact-link">{email}</a>
              </p>
            </div>
          )}
          {address && (
            <div className="contact-item">
              <h3 className="contact-title">Indirizzo</h3>
              <p className="contact-info">{address}</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          © {new Date().getFullYear()} {restaurantName}. Tutti i diritti riservati.
        </p>
        <p className="footer-text" style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>
          Powered by OmnilyPro
        </p>
      </footer>
    </div>
  );
};

export default RestaurantClassic;
