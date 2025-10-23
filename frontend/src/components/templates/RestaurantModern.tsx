import React from 'react';
import './RestaurantModern.css';

// Helper function to extract content from Directus sections/components structure
const extractContentFromDirectus = (sections: any[]) => {
  const content: any = {};

  sections.forEach((section: any) => {
    const sectionType = section.section_type;
    const components = section.components || [];

    if (sectionType === 'hero') {
      const headingComp = components.find((c: any) => c.component_type === 'heading');
      const buttonComp = components.find((c: any) => c.component_type === 'button');
      const imageComp = components.find((c: any) => c.component_type === 'image');

      content.hero = {
        title: section.section_title || headingComp?.content_text || 'Benvenuti',
        subtitle: section.section_subtitle || 'La nostra cucina, la vostra passione',
        cta_text: buttonComp?.content_link_text || 'Scopri il Menu',
        image_url: imageComp?.content_image || ''
      };
    } else if (sectionType === 'menu' || sectionType === 'menu_food') {
      const menuComponents = components.filter((c: any) => c.component_type === 'menu_item');

      content.menu = {
        title: section.section_title || 'Il Nostro Menu',
        subtitle: section.section_subtitle || 'Scopri le nostre specialità',
        items: menuComponents.map((c: any) => ({
          nome: c.item_name || c.content_text || '',
          descrizione: c.item_description || '',
          prezzo: c.item_price ? parseFloat(c.item_price) : 0,
          foto: c.item_image || c.content_image || ''
        }))
      };
    } else if (sectionType === 'contact' || sectionType === 'footer') {
      const phoneComp = components.find((c: any) => c.component_type === 'contact_phone' || c.component_label?.toLowerCase().includes('telefono'));
      const emailComp = components.find((c: any) => c.component_type === 'contact_email' || c.component_label?.toLowerCase().includes('email'));
      const addressComp = components.find((c: any) => c.component_type === 'contact_address' || c.component_label?.toLowerCase().includes('indirizzo'));

      content.contact = {
        phone: phoneComp?.content_text || phoneComp?.content_link_url || '',
        email: emailComp?.content_text || '',
        address: addressComp?.content_text || ''
      };
    }
  });

  return content;
};

const RestaurantModern = ({ website, organizationName }: any) => {
  let content = website?.contenuto || website?.content || {};

  if (!content || Object.keys(content).length === 0) {
    if (website?.pages && website.pages.length > 0) {
      const homepage = website.pages.find((p: any) => p.is_homepage) || website.pages[0];
      if (homepage?.sections) {
        content = extractContentFromDirectus(homepage.sections);
      }
    }
  }

  const hero = content.hero || {};
  const menu = content.menu || {};
  const contact = content.contact || {};
  const restaurantName = website?.site_name || organizationName || 'Ristorante';

  return (
    <div className="restaurant-modern">
      {/* Navigation */}
      <nav className="modern-nav">
        <div className="nav-container">
          <div className="nav-logo">{restaurantName}</div>
          <div className="nav-menu">
            <a href="#hero">Home</a>
            <a href="#menu">Menu</a>
            <a href="#contact">Contatti</a>
            <a href="#menu" className="nav-cta">Prenota</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="modern-hero">
        {hero.image_url && (
          <div className="hero-bg" style={{ backgroundImage: `url(${hero.image_url})` }} />
        )}
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            {hero.title || 'Benvenuti'}
          </h1>
          <p className="hero-subtitle">
            {hero.subtitle || 'Autentica cucina italiana'}
          </p>
          <div className="hero-buttons">
            <a href="#menu" className="btn-primary">
              {hero.cta_text || 'Scopri il Menu'}
            </a>
            <a href="#contact" className="btn-secondary">
              Contattaci
            </a>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* Menu Section */}
      {menu.items && menu.items.length > 0 && (
        <section id="menu" className="modern-menu">
          <div className="menu-header">
            <h2 className="section-title">{menu.title || 'Il Nostro Menu'}</h2>
            <p className="section-subtitle">{menu.subtitle || 'Le nostre specialità'}</p>
          </div>
          <div className="menu-grid">
            {menu.items.map((item: any, index: number) => (
              <div key={index} className="menu-card">
                {item.foto && (
                  <div className="menu-card-image">
                    <img src={item.foto} alt={item.nome} />
                    <div className="menu-card-overlay" />
                  </div>
                )}
                <div className="menu-card-content">
                  <div className="menu-card-header">
                    <h3>{item.nome}</h3>
                    {item.prezzo > 0 && (
                      <span className="menu-card-price">€ {item.prezzo.toFixed(2)}</span>
                    )}
                  </div>
                  {item.descrizione && (
                    <p className="menu-card-description">{item.descrizione}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="modern-contact">
        <div className="contact-content">
          <h2>Vieni a Trovarci</h2>
          <p>Siamo aperti tutti i giorni per servirti al meglio</p>
          <div className="contact-info">
            {contact.address && (
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <h4>Indirizzo</h4>
                  <p>{contact.address}</p>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h4>Telefono</h4>
                  <p><a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <h4>Email</h4>
                  <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <p>&copy; {new Date().getFullYear()} {restaurantName}. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
};

export default RestaurantModern;
