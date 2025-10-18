import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageLoader from '../components/UI/PageLoader';
import RestaurantClassic from '../components/templates/RestaurantClassic';
import { supabase } from '../lib/supabase';

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

        // Fetch website data from Strapi
        const strapiUrl = import.meta.env.VITE_STRAPI_URL;
        const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

        if (!strapiUrl || !strapiToken) {
          throw new Error('Configurazione Strapi mancante');
        }

        const response = await fetch(
          `${strapiUrl}/api/organization-websites?filters[subdomain][$eq]=${subdomain}&populate=template`,
          {
            headers: {
              'Authorization': `Bearer ${strapiToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Errore nella richiesta: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          setError('Sito non trovato');
          setLoading(false);
          return;
        }

        const siteData = data.data[0];

        // Check if published
        if (!siteData.is_published) {
          setError('Questo sito non è ancora pubblicato');
          setLoading(false);
          return;
        }

        setWebsite(siteData);

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

  // Get template component (default to RestaurantClassic)
  const TemplateComponent = templateMap[website.template?.component_path || 'RestaurantClassic'] || RestaurantClassic;

  return <TemplateComponent website={website} organizationName={organizationName} />;
};

export default PublicSite;
