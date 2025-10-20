import React, { useState, useEffect } from 'react';

// Placeholder for actual template components
const templates: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'restaurant-classic': React.lazy(() => import('../components/templates/RestaurantClassic')),
};

const SiteRendererPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<any | null>(null);

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        // 1. Get subdomain from hostname
        const hostname = window.location.hostname;
        // In development, you might use a query param. For now, we'll simulate.
        // Example: pizzerianapoli.localhost:5173 -> we need to handle this.
        // A simple approach for local dev: use a fixed subdomain or a query param.
        const subdomain = hostname.split('.')[0];

        if (!subdomain || subdomain === 'localhost' || subdomain === 'www') {
          setError('Nessun sito trovato per questo indirizzo.');
          setLoading(false);
          return;
        }

        // 2. Fetch website data from Strapi API
        const strapiUrl = import.meta.env.VITE_STRAPI_URL;
        const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

        if (!strapiUrl || !strapiToken) {
          throw new Error('Configurazione Strapi non trovata.');
        }

        // The actual API call
        const response = await fetch(
          `${strapiUrl}/api/organization-websites?filters[subdomain][$eq]=${subdomain}&populate=template,contenuto`,
          {
            headers: {
              Authorization: `Bearer ${strapiToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Errore nel recupero dei dati del sito.');
        }

        const json = await response.json();
        const siteData = json.data?.[0];

        if (!siteData) {
          setError(`Nessun sito pubblicato trovato per '${subdomain}'.`);
          setLoading(false);
          return;
        }

        setWebsiteData(siteData.attributes);

      } catch (err: any) {
        setError(err.message || 'Si è verificato un errore sconosciuto.');
      } finally {
        setLoading(false);
      }
    };

    fetchSiteData();
  }, []);

  // Render loading state
  if (loading) {
    return <div>Caricamento del sito...</div>;
  }

  // Render error state
  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <h1>Errore</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Render the site
  if (websiteData) {
    const templateSlug = websiteData.template?.data?.attributes?.slug; // As defined in Strapi
    const TemplateComponent = templates[templateSlug];

    if (TemplateComponent) {
      return (
        <React.Suspense fallback={<div>Caricamento template...</div>}>
          <TemplateComponent content={websiteData.contenuto} />
        </React.Suspense>
      );
    }

    return (
      <div style={{ padding: '2rem' }}>
        <h1>{websiteData.nome}</h1>
        <p>Template ''{templateSlug}'' non trovato. Impossibile renderizzare il sito.</p>
        <pre>{JSON.stringify(websiteData.contenuto, null, 2)}</pre>
      </div>
    );
  }

  return null; // Should not be reached if logic is correct
};

export default SiteRendererPage;
