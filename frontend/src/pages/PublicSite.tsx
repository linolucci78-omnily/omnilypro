import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageLoader from '../components/UI/PageLoader';
import RestaurantClassic from '../components/templates/RestaurantClassic';
import { supabase } from '../lib/supabase';
import { directusClient } from '../lib/directus';

const PublicSite: React.FC = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<any>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!subdomain) {
        setError('Sottodominio non specificato');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch website data from Directus
        // For now, fetch all websites (we'll optimize this later with a proper endpoint)
        const directusUrl = import.meta.env.VITE_DIRECTUS_URL;
        const directusToken = import.meta.env.VITE_DIRECTUS_TOKEN;

        const response = await fetch(`${directusUrl}/items/organizations_websites`, {
          headers: {
            'Authorization': `Bearer ${directusToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Errore nella richiesta: ${response.status}`);
        }

        const { data: allWebsites } = await response.json();

        console.log('🔍 Looking for subdomain:', subdomain);
        console.log('📋 All websites:', allWebsites);

        // Find website by subdomain (convert site_name to slug)
        const siteData = allWebsites.find((site: any) => {
          const slug = site.site_name
            .toLowerCase()
            .normalize('NFD') // Normalizza caratteri accentati
            .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
            .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri speciali
            .replace(/\s+/g, '-') // Sostituisce spazi con trattini
            .replace(/-+/g, '-') // Rimuove trattini multipli
            .replace(/^-|-$/g, ''); // Rimuove trattini all'inizio/fine

          console.log(`Comparing: "${slug}" vs "${subdomain}" OR domain: "${site.domain}"`);
          return slug === subdomain || site.domain === `${subdomain}.omnilypro.com`;
        });

        console.log('✅ Found site:', siteData);

        if (!siteData) {
          setError('Sito non trovato');
          setLoading(false);
          return;
        }

        // Check if published
        if (!siteData.published) {
          setError('Questo sito non è ancora pubblicato');
          setLoading(false);
          return;
        }

        // Get complete website with pages, sections, and components
        const completeWebsite = await directusClient.getWebsiteComplete(siteData.id);
        setWebsite(completeWebsite);

        // Fetch organization name from Supabase
        if (siteData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', siteData.organization_id)
            .single();

          if (orgData) {
            setOrganizationName(orgData.name);
          }
        }

      } catch (err: any) {
        console.error('Error fetching website:', err);
        setError(err.message || 'Errore nel caricamento del sito');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [subdomain]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Oops!</h1>
          <p className="text-xl text-gray-600 mb-8">{error}</p>
          <a
            href="https://omnilypro.com"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Sito non trovato</h1>
          <p className="text-xl text-gray-600 mb-8">
            Il sito "{subdomain}" non esiste o non è stato pubblicato.
          </p>
          <a
            href="https://omnilypro.com"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    );
  }

  // Map template component_path to actual component
  const templateMap: Record<string, React.FC<any>> = {
    'RestaurantClassic': RestaurantClassic,
    ' RestaurantClassic': RestaurantClassic, // Handle space in front
    'restaurant-classic': RestaurantClassic,
  };

  // Debug: Log what data we have
  console.log('🔍 Website data check:', {
    hasCraftData: !!website.grapesjs_components,
    craftDataLength: website.grapesjs_components?.length,
    hasGrapesJsHtml: !!website.grapesjs_html,
    templatePath: website.template?.component_path,
  });

  // Check if website has Craft.js data (stored in grapesjs_components)
  if (website.grapesjs_components) {
    console.log('🎨 Rendering Craft.js website');

    // Import Craft.js renderer dynamically
    const CraftRenderer = React.lazy(() => import('../components/CraftRenderer'));

    return (
      <React.Suspense fallback={<PageLoader />}>
        <CraftRenderer data={website.grapesjs_components} />
      </React.Suspense>
    );
  }

  // Fallback: Check if website has old GrapesJS HTML
  if (website.grapesjs_html) {
    console.log('🎨 Rendering GrapesJS custom HTML (legacy)');

    // Include CSS in the HTML
    const htmlWithCss = website.grapesjs_css
      ? `<style>${website.grapesjs_css}</style>${website.grapesjs_html}`
      : website.grapesjs_html;

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: htmlWithCss
        }}
      />
    );
  }

  // Otherwise, use React template component
  console.log('📄 Rendering React template component (fallback)');
  const TemplateComponent = templateMap[website.template?.component_path || 'RestaurantClassic'] || RestaurantClassic;

  return <TemplateComponent website={website} organizationName={organizationName} />;
};

export default PublicSite;
