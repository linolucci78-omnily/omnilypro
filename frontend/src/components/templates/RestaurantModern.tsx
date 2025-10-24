import React from 'react';
import './RestaurantModern.css';

// Helper function to extract content from Directus sections/components structure
const extractContentFromDirectus = (sections: any[]) => {
  const content: any = {};

  sections.forEach((section: any) => {
    const sectionType = section.section_type;
    const components = section.components || [];

    // HERO SECTION
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
    }

    // ABOUT SECTION
    else if (sectionType === 'about' || sectionType === 'chi_siamo') {
      const textComp = components.find((c: any) => c.component_type === 'text' || c.component_type === 'paragraph');
      const imageComp = components.find((c: any) => c.component_type === 'image');

      content.about = {
        title: section.section_title || 'Chi Siamo',
        subtitle: section.section_subtitle || '',
        text: textComp?.content_text || textComp?.content_rich_text || '',
        image_url: imageComp?.content_image || ''
      };
    }

    // GALLERY SECTION
    else if (sectionType === 'gallery') {
      const imageComponents = components.filter((c: any) => c.component_type === 'image');

      content.gallery = {
        title: section.section_title || 'Gallery',
        subtitle: section.section_subtitle || 'I nostri piatti',
        images: imageComponents.map((c: any) => ({
          url: c.content_image || '',
          alt: c.image_alt_text || 'Foto'
        }))
      };
    }

    // MENU SECTION
    else if (sectionType === 'menu' || sectionType === 'menu_food') {
      const menuComponents = components.filter((c: any) => c.component_type === 'menu_item');

      content.menu = {
        title: section.section_title || 'Il Nostro Menu',
        subtitle: section.section_subtitle || 'Scopri le nostre specialità',
        items: menuComponents.map((c: any) => ({
          nome: c.item_name || c.content_text || '',
          descrizione: c.item_description || '',
          prezzo: c.item_price ? parseFloat(c.item_price) : 0,
          foto: c.item_image || c.content_image || '',
          categoria: c.category || ''
        }))
      };
    }

    // RECENSIONI / TESTIMONIALS
    else if (sectionType === 'recensioni' || sectionType === 'testimonials' || sectionType === 'reviews') {
      const reviewComponents = components.filter((c: any) => c.component_type === 'testimonial' || c.component_type === 'review');

      content.recensioni = {
        title: section.section_title || 'Recensioni',
        subtitle: section.section_subtitle || 'Cosa dicono di noi',
        reviews: reviewComponents.map((c: any) => ({
          author: c.testimonial_author || c.item_name || 'Cliente',
          text: c.content_text || c.content_rich_text || '',
          rating: c.testimonial_rating || 5,
          date: c.created_at || ''
        }))
      };
    }

    // SERVIZI / FEATURES
    else if (sectionType === 'servizi' || sectionType === 'features' || sectionType === 'services') {
      content.servizi = {
        title: section.section_title || 'I Nostri Servizi',
        subtitle: section.section_subtitle || '',
        items: components.map((c: any) => ({
          title: c.item_name || c.content_text || '',
          description: c.item_description || c.content_rich_text || '',
          icon: c.content_image || '🍽️'
        }))
      };
    }

    // ORARI
    else if (sectionType === 'orari' || sectionType === 'hours' || sectionType === 'opening_hours') {
      content.orari = {
        title: section.section_title || 'Orari di Apertura',
        subtitle: section.section_subtitle || '',
        schedule: components.map((c: any) => ({
          day: c.item_name || c.content_text || '',
          hours: c.item_description || c.content_rich_text || ''
        }))
      };
    }

    // CONTACT / FOOTER
    else if (sectionType === 'contact' || sectionType === 'footer') {
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
  const about = content.about || {};
  const gallery = content.gallery || {};
  const menu = content.menu || {};
  const recensioni = content.recensioni || {};
  const servizi = content.servizi || {};
  const orari = content.orari || {};
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
            {about.title && <a href="#about">Chi Siamo</a>}
            {menu.items?.length > 0 && <a href="#menu">Menu</a>}
            {gallery.images?.length > 0 && <a href="#gallery">Gallery</a>}
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

      {/* About Section */}
      {about.title && (
        <section id="about" className="modern-about">
          <div className="about-container">
            <div className="about-content">
              <h2 className="section-title">{about.title}</h2>
              {about.subtitle && <p className="section-subtitle">{about.subtitle}</p>}
              {about.text && <p className="about-text">{about.text}</p>}
            </div>
            {about.image_url && (
              <div className="about-image">
                <img src={about.image_url} alt={about.title} />
              </div>
            )}
          </div>
        </section>
      )}

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

      {/* Gallery Section */}
      {gallery.images && gallery.images.length > 0 && (
        <section id="gallery" className="modern-gallery">
          <div className="gallery-header">
            <h2 className="section-title">{gallery.title || 'Gallery'}</h2>
            <p className="section-subtitle">{gallery.subtitle || 'I nostri piatti'}</p>
          </div>
          <div className="gallery-grid">
            {gallery.images.map((image: any, index: number) => (
              <div key={index} className="gallery-item">
                <img src={image.url} alt={image.alt || `Foto ${index + 1}`} />
                <div className="gallery-overlay" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Servizi Section */}
      {servizi.items && servizi.items.length > 0 && (
        <section id="servizi" className="modern-servizi">
          <div className="servizi-header">
            <h2 className="section-title">{servizi.title || 'I Nostri Servizi'}</h2>
            {servizi.subtitle && <p className="section-subtitle">{servizi.subtitle}</p>}
          </div>
          <div className="servizi-grid">
            {servizi.items.map((item: any, index: number) => (
              <div key={index} className="servizi-card">
                <div className="servizi-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recensioni Section */}
      {recensioni.reviews && recensioni.reviews.length > 0 && (
        <section id="recensioni" className="modern-recensioni">
          <div className="recensioni-header">
            <h2 className="section-title">{recensioni.title || 'Recensioni'}</h2>
            <p className="section-subtitle">{recensioni.subtitle || 'Cosa dicono di noi'}</p>
          </div>
          <div className="recensioni-grid">
            {recensioni.reviews.map((review: any, index: number) => (
              <div key={index} className="recensioni-card">
                <div className="recensioni-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < (review.rating || 5) ? 'star-filled' : 'star-empty'}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="recensioni-text">"{review.text}"</p>
                <div className="recensioni-author">
                  <strong>{review.author || 'Cliente'}</strong>
                  {review.date && <span className="recensioni-date"> - {new Date(review.date).toLocaleDateString('it-IT')}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Orari Section */}
      {orari.schedule && orari.schedule.length > 0 && (
        <section id="orari" className="modern-orari">
          <div className="orari-header">
            <h2 className="section-title">{orari.title || 'Orari di Apertura'}</h2>
            {orari.subtitle && <p className="section-subtitle">{orari.subtitle}</p>}
          </div>
          <div className="orari-list">
            {orari.schedule.map((item: any, index: number) => (
              <div key={index} className="orari-item">
                <span className="orari-day">{item.day}</span>
                <span className="orari-hours">{item.hours}</span>
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
