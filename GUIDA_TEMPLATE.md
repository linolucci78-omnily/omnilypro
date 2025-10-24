# Guida: Come Creare un Nuovo Template

## 1. STRUTTURA BASE

Un template React ha questa struttura:

```typescript
import React from 'react';
import './MioTemplate.css';

// Funzione helper per estrarre dati da Directus
const extractContentFromDirectus = (sections: any[]) => {
  const content: any = {};

  sections.forEach((section: any) => {
    const sectionType = section.section_type;
    const components = section.components || [];

    // Estrai dati in base al tipo di sezione
    if (sectionType === 'hero') {
      content.hero = {
        title: section.section_title,
        subtitle: section.section_subtitle,
        // ... altri campi
      };
    }

    if (sectionType === 'menu') {
      content.menu = {
        title: section.section_title,
        items: components.map(c => ({
          nome: c.item_name,
          prezzo: c.item_price,
          // ... altri campi
        }))
      };
    }
  });

  return content;
};

// Componente Template
const MioTemplate = ({ website, organizationName }: any) => {
  // Estrai contenuto
  let content = {};
  if (website?.pages && website.pages.length > 0) {
    const homepage = website.pages.find((p: any) => p.is_homepage) || website.pages[0];
    if (homepage?.sections) {
      content = extractContentFromDirectus(homepage.sections);
    }
  }

  // Rendering
  return (
    <div className="mio-template">
      {/* Navbar */}
      <nav>...</nav>

      {/* Hero */}
      <section className="hero">
        <h1>{content.hero?.title}</h1>
      </section>

      {/* Menu */}
      <section className="menu">
        {content.menu?.items.map(item => (
          <div key={item.nome}>
            <h3>{item.nome}</h3>
            <p>€ {item.prezzo}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default MioTemplate;
```

## 2. TIPI DI SEZIONI SUPPORTATE

### Hero Section
```javascript
section_type: "hero"
components: [
  { component_type: "heading", content_text: "Titolo" },
  { component_type: "button", content_link_text: "CTA" }
]
```

### Menu Section
```javascript
section_type: "menu"
components: [
  {
    component_type: "menu_item",
    item_name: "Pizza",
    item_price: 10.00,
    item_description: "Descrizione",
    item_image: "url"
  }
]
```

### Gallery Section
```javascript
section_type: "gallery"
components: [
  { component_type: "image", content_image: "url" }
]
```

### Contact Section
```javascript
section_type: "contact"
components: [
  { component_type: "contact_phone", content_text: "+39..." },
  { component_type: "contact_email", content_text: "email@..." }
]
```

## 3. AGGIUNGERE IL TEMPLATE AL SISTEMA

1. Crea file `MioTemplate.tsx` in `src/components/templates/`
2. Crea file `MioTemplate.css` per lo stile
3. Registra il template in `SiteRendererPage.tsx`:

```typescript
const templates = {
  'MioTemplate': React.lazy(() => import('../components/templates/MioTemplate')),
};
```

4. Su Directus, assegna il template al sito

## 4. BEST PRACTICES

- ✅ Usa sempre fallback per dati mancanti
- ✅ Gestisci sezioni opzionali con `&&`
- ✅ Ordina sempre per `sort_order`
- ✅ Usa `section_title` e `section_subtitle` per titoli sezioni
- ✅ Usa `item_*` per dati strutturati (menu, prodotti)
- ✅ Usa `content_*` per contenuti generici (testo, link, immagini)

## 5. CSS STYLING

```css
.mio-template {
  font-family: 'Inter', sans-serif;
}

.hero {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    height: 70vh;
  }
}
```

## 6. ESEMPIO COMPLETO: Bakery Template

Vedi `RestaurantModern.tsx` come riferimento completo con:
- ✅ Hero fullscreen
- ✅ Menu grid
- ✅ Contact section
- ✅ Animazioni CSS
- ✅ Responsive design
