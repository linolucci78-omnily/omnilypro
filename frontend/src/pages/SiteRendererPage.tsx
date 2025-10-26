import React, { useState, useEffect } from 'react';
import { directusClient } from '../lib/directus';
import { supabase } from '../lib/supabase';

// Placeholder for actual template components
const templates: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'restaurant-classic': React.lazy(() => import('../components/templates/RestaurantModern')),
  'RestaurantClassic': React.lazy(() => import('../components/templates/RestaurantModern')),
  'RestaurantModern': React.lazy(() => import('../components/templates/RestaurantModern')),
};

const SiteRendererPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<any | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        // 1. Get subdomain from hostname
        const hostname = window.location.hostname;
        let subdomain = hostname.split('.')[0];

        // 🧪 TESTING: If on localhost with /test-public-site, use test subdomain
        if (hostname === 'localhost' && window.location.pathname === '/test-public-site') {
          subdomain = 'saporiecolori'; // Hardcoded per testing locale
          console.log('🧪 TESTING MODE: Using test subdomain:', subdomain);
        }

        console.log('🌐 SiteRendererPage - Hostname:', hostname);
        console.log('🔍 SiteRendererPage - Subdomain:', subdomain);

        if (!subdomain || subdomain === 'localhost' || subdomain === 'www' || subdomain === 'app' || subdomain === 'admin') {
          setError('Nessun sito trovato per questo indirizzo.');
          setLoading(false);
          return;
        }

        // 2. Fetch website data from Directus API
        const directusUrl = import.meta.env.VITE_DIRECTUS_URL;
        const directusToken = import.meta.env.VITE_DIRECTUS_TOKEN;

        if (!directusUrl || !directusToken) {
          throw new Error('Configurazione Directus non trovata.');
        }

        // Fetch all websites from Directus
        const response = await fetch(`${directusUrl}/items/organizations_websites`, {
          headers: {
            'Authorization': `Bearer ${directusToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Errore nella richiesta: ${response.status}`);
        }

        const { data: allWebsites } = await response.json();

        // Find website by subdomain (convert site_name to slug)
        const siteData = allWebsites.find((site: any) => {
          const slug = site.site_name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          return slug === subdomain || site.domain === `${subdomain}.omnilypro.com`;
        });

        console.log('✅ Found site:', siteData);

        if (!siteData) {
          setError(`Nessun sito trovato per '${subdomain}'.`);
          setLoading(false);
          return;
        }

        // Check if published
        if (!siteData.published) {
          setError('Questo sito non è ancora pubblicato.');
          setLoading(false);
          return;
        }

        // Get complete website with pages, sections, and components
        console.log('📦 Fetching complete website data for ID:', siteData.id);
        const completeWebsite = await directusClient.getWebsiteComplete(siteData.id);
        console.log('📦 Complete website data received:', {
          id: completeWebsite.id,
          site_name: completeWebsite.site_name,
          has_grapesjs_components: !!completeWebsite.grapesjs_components,
          grapesjs_components_length: completeWebsite.grapesjs_components?.length,
          has_pages: !!completeWebsite.pages,
          pages_count: completeWebsite.pages?.length,
        });
        setWebsiteData(completeWebsite);

        // Fetch organization name from Supabase (optional, non-blocking)
        try {
          if (siteData.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', siteData.organization_id)
              .single();

            if (orgData && !orgError) {
              setOrganizationName(orgData.name);
            } else {
              console.warn('⚠️ Could not fetch organization name:', orgError);
            }
          }
        } catch (orgErr) {
          // Non-blocking: if organization fetch fails, just use site_name
          console.warn('⚠️ Organization fetch failed:', orgErr);
        }

      } catch (err: any) {
        console.error('❌ Error fetching website:', err);
        setError(err.message || 'Si è verificato un errore sconosciuto.');
      } finally {
        setLoading(false);
      }
    };

    fetchSiteData();
  }, []);

  // Render loading state - Simple loader without branding
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render error state
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

  // Render the site
  if (!websiteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Sito non trovato</h1>
          <p className="text-xl text-gray-600 mb-8">
            Questo sito non esiste o non è stato pubblicato.
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

  // Debug: Log what data we have
  console.log('🔍 Website data check:', {
    hasCraftData: !!websiteData.grapesjs_components,
    craftDataLength: websiteData.grapesjs_components?.length,
    hasGrapesJsHtml: !!websiteData.grapesjs_html,
    templatePath: websiteData.template?.component_path,
  });

  // Check if website has Craft.js data (stored in grapesjs_components)
  if (websiteData.grapesjs_components) {
    console.log('🎨 Rendering Craft.js website');

    // Import Craft.js renderer dynamically
    const CraftRenderer = React.lazy(() => import('../components/CraftRenderer'));

    return (
      <React.Suspense fallback={
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      }>
        <CraftRenderer data={websiteData.grapesjs_components} />
      </React.Suspense>
    );
  }

  // Fallback: Check if website has old GrapesJS HTML
  if (websiteData.grapesjs_html) {
    console.log('🎨 Rendering GrapesJS custom HTML (legacy)');

    // Include CSS in the HTML
    const htmlWithCss = websiteData.grapesjs_css
      ? `<style>${websiteData.grapesjs_css}</style>${websiteData.grapesjs_html}`
      : websiteData.grapesjs_html;

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
  const templatePath = websiteData.template?.component_path || 'RestaurantClassic';
  const TemplateComponent = templates[templatePath] || templates['RestaurantClassic'];

  return (
    <React.Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    }>
      <TemplateComponent website={websiteData} organizationName={organizationName} />
    </React.Suspense>
  );
};

export default SiteRendererPage;
