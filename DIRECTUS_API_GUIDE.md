# Guida API Directus per Website Builder

## ✅ Setup Completato

- **URL**: https://omnilypro-directus.onrender.com
- **Admin Panel**: https://omnilypro-directus.onrender.com/admin
- **API Token**: `vEBE2gnXO-CzxdlAb2Sw2EjzEK6pGPo_`
- **Database**: PostgreSQL su Neon (dedicato)

---

## 📋 Collections Disponibili

### 1. `organizations_websites`
Ogni sito web di un'organizzazione

**Campi:**
- `id` - ID univoco (auto)
- `organization_id` - ID organizzazione
- `site_name` - Nome del sito
- `domain` - Dominio (es. "prova.omnilypro.com")
- `published` - Pubblicato (true/false)
- `created_at` - Data creazione

### 2. `website_pages`
Le pagine di ogni sito

**Campi:**
- `id` - ID univoco (auto)
- `website_id` - Relazione al sito (M2O)
- `page_name` - Nome pagina (es. "Home")
- `slug` - URL slug (es. "home", "about-us")
- `title` - SEO Title
- `meta_description` - Meta description
- `is_homepage` - È la homepage? (true/false)
- `published` - Pubblicata (true/false)
- `sort_order` - Ordine nel menu (1, 2, 3...)
- `created_at` - Data creazione
- `updated_at` - Data ultima modifica

---

## 🔑 Autenticazione

Tutte le richieste devono includere l'header Authorization:

```javascript
headers: {
  'Authorization': 'Bearer vEBE2gnXO-CzxdlAb2Sw2EjzEK6pGPo_'
}
```

---

## 🚀 Esempi di utilizzo in React

### Setup base (config)

```javascript
// src/config/directus.js
export const DIRECTUS_URL = 'https://omnilypro-directus.onrender.com';
export const DIRECTUS_TOKEN = 'vEBE2gnXO-CzxdlAb2Sw2EjzEK6pGPo_';

export const directusFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Directus API error: ${response.statusText}`);
  }

  return response.json();
};
```

---

### 1. Ottenere tutti i siti di un'organizzazione

```javascript
import { directusFetch } from './config/directus';

// GET /items/organizations_websites?filter[organization_id][_eq]=org_123
const getOrganizationWebsites = async (organizationId) => {
  const data = await directusFetch(
    `/items/organizations_websites?filter[organization_id][_eq]=${organizationId}`
  );
  return data.data; // Array di siti
};

// Esempio uso:
const websites = await getOrganizationWebsites('org_test_001');
console.log(websites);
/*
[
  {
    id: 1,
    organization_id: "org_test_001",
    site_name: "Sito di Prova",
    domain: "prova.omnilypro.com",
    published: true,
    created_at: "2025-10-23T15:13:44.357Z"
  }
]
*/
```

---

### 2. Ottenere un singolo sito per ID

```javascript
// GET /items/organizations_websites/1
const getWebsiteById = async (websiteId) => {
  const data = await directusFetch(`/items/organizations_websites/${websiteId}`);
  return data.data;
};

// Esempio uso:
const website = await getWebsiteById(1);
```

---

### 3. Ottenere tutte le pagine di un sito

```javascript
// GET /items/website_pages?filter[website_id][_eq]=1
const getWebsitePages = async (websiteId) => {
  const data = await directusFetch(
    `/items/website_pages?filter[website_id][_eq]=${websiteId}&sort=sort_order`
  );
  return data.data;
};

// Esempio uso:
const pages = await getWebsitePages(1);
console.log(pages);
/*
[
  {
    id: 1,
    website_id: 1,
    page_name: "HOME",
    slug: "home",
    title: "sito di prova",
    meta_description: "Pagina home del sito di prova",
    is_homepage: true,
    published: true,
    sort_order: "1",
    created_at: "2025-10-23T15:17:09.668Z",
    updated_at: "2025-10-23T15:17:09.668Z"
  }
]
*/
```

---

### 4. Ottenere pagine CON i dati del sito (relazione)

```javascript
// GET /items/website_pages?filter[website_id][_eq]=1&fields=*,website_id.*
const getWebsitePagesWithSite = async (websiteId) => {
  const data = await directusFetch(
    `/items/website_pages?filter[website_id][_eq]=${websiteId}&fields=*,website_id.*&sort=sort_order`
  );
  return data.data;
};

// Esempio uso:
const pages = await getWebsitePagesWithSite(1);
console.log(pages[0].website_id);
/*
{
  id: 1,
  organization_id: "org_test_001",
  site_name: "Sito di Prova",
  domain: "prova.omnilypro.com",
  published: true,
  created_at: "2025-10-23T15:13:44.357Z"
}
*/
```

---

### 5. Creare un nuovo sito

```javascript
// POST /items/organizations_websites
const createWebsite = async (websiteData) => {
  const data = await directusFetch('/items/organizations_websites', {
    method: 'POST',
    body: JSON.stringify(websiteData),
  });
  return data.data;
};

// Esempio uso:
const newWebsite = await createWebsite({
  organization_id: 'org_123',
  site_name: 'Nuovo Sito',
  domain: 'nuovo.omnilypro.com',
  published: false
});
console.log(newWebsite.id); // ID del sito creato
```

---

### 6. Creare una nuova pagina

```javascript
// POST /items/website_pages
const createPage = async (pageData) => {
  const data = await directusFetch('/items/website_pages', {
    method: 'POST',
    body: JSON.stringify(pageData),
  });
  return data.data;
};

// Esempio uso:
const newPage = await createPage({
  website_id: 1,
  page_name: 'About Us',
  slug: 'about-us',
  title: 'Chi Siamo - Omnilypro',
  meta_description: 'Scopri chi siamo',
  is_homepage: false,
  published: true,
  sort_order: 2
});
```

---

### 7. Aggiornare un sito

```javascript
// PATCH /items/organizations_websites/1
const updateWebsite = async (websiteId, updates) => {
  const data = await directusFetch(`/items/organizations_websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.data;
};

// Esempio uso:
const updated = await updateWebsite(1, {
  site_name: 'Sito Aggiornato',
  published: true
});
```

---

### 8. Eliminare una pagina

```javascript
// DELETE /items/website_pages/1
const deletePage = async (pageId) => {
  await directusFetch(`/items/website_pages/${pageId}`, {
    method: 'DELETE',
  });
};

// Esempio uso:
await deletePage(2);
```

---

## 🔍 Query Avanzate

### Filtri

```javascript
// Filtra per campo
filter[published][_eq]=true

// Filtra per range
filter[created_at][_gte]=2025-01-01

// Filtra con OR
filter[_or][0][slug][_eq]=home&filter[_or][1][slug][_eq]=about

// Cerca nel testo
filter[site_name][_contains]=Prova
```

### Ordinamento

```javascript
// Ascendente
sort=sort_order

// Discendente
sort=-created_at

// Multiplo
sort=sort_order,-created_at
```

### Paginazione

```javascript
// Limita risultati
limit=10

// Offset
offset=20

// Esempio: pagina 2 con 10 risultati per pagina
limit=10&offset=10
```

### Selezione campi

```javascript
// Solo alcuni campi
fields=id,site_name,domain

// Tutti i campi + relazioni
fields=*,website_id.*

// Campi annidati specifici
fields=id,page_name,website_id.site_name,website_id.domain
```

---

## 📦 Esempio Componente React

```javascript
import React, { useEffect, useState } from 'react';
import { directusFetch } from '../config/directus';

function WebsitePagesList({ organizationId }) {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        setLoading(true);
        const data = await directusFetch(
          `/items/organizations_websites?filter[organization_id][_eq]=${organizationId}&filter[published][_eq]=true`
        );
        setWebsites(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, [organizationId]);

  if (loading) return <div>Caricamento...</div>;
  if (error) return <div>Errore: {error}</div>;

  return (
    <div>
      <h2>I tuoi siti</h2>
      {websites.map(site => (
        <div key={site.id}>
          <h3>{site.site_name}</h3>
          <p>{site.domain}</p>
        </div>
      ))}
    </div>
  );
}

export default WebsitePagesList;
```

---

## 🔐 Sicurezza

⚠️ **IMPORTANTE**: Il token API è sensibile!

**NON committarlo nel repository pubblico!**

Usa variabili d'ambiente:

```javascript
// .env.local
REACT_APP_DIRECTUS_URL=https://omnilypro-directus.onrender.com
REACT_APP_DIRECTUS_TOKEN=vEBE2gnXO-CzxdlAb2Sw2EjzEK6pGPo_

// src/config/directus.js
export const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL;
export const DIRECTUS_TOKEN = process.env.REACT_APP_DIRECTUS_TOKEN;
```

Aggiungi al `.gitignore`:
```
.env.local
.env
```

---

## 📚 Documentazione Completa

- **API Reference**: https://docs.directus.io/reference/introduction.html
- **Query Filters**: https://docs.directus.io/reference/query.html
- **SDK JavaScript**: https://docs.directus.io/guides/sdk/getting-started.html

---

## 🆘 Troubleshooting

### Errore 403 Forbidden
- Verifica che il token sia corretto
- Controlla che il token abbia i permessi sulla collection

### Errore 401 Unauthorized
- Il token è scaduto o non valido
- Rigenera un nuovo token

### Errore 404 Not Found
- L'endpoint o l'item non esiste
- Verifica l'URL

### Servizio in sleep (piano Free Render)
- Primo request dopo 15 min = lento (15-30 secondi)
- Soluzione: upgrade a piano Starter o warm-up periodico

---

## 🎯 Prossimi Passi

1. ✅ Integrare le chiamate API nel frontend OmnilyPro
2. 🔄 Creare le collections per sezioni e componenti delle pagine
3. 📝 Implementare il website builder drag & drop
4. 🖼️ Configurare storage per immagini (Cloudinary/S3)
5. 🌐 Collegare i domini custom ai siti

---

**Directus è pronto! 🚀**
