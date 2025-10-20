/**
 * Strapi CMS Service
 * Gestisce la comunicazione con Strapi per i siti web delle organizzazioni
 */

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface WebsiteTemplate {
  id: number;
  attributes: {
    name: string;
    description: string;
    category: 'ristorante' | 'bar' | 'negozio' | 'servizi' | 'generico';
    is_active: boolean;
    price_tier: 'free' | 'basic' | 'premium';
    preview_image?: {
      data?: {
        id: number;
        attributes: {
          url: string;
          alternativeText?: string;
        };
      };
    };
    demo_url?: string;
    sezioni?: unknown[]; // Dynamic Zone sections
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
}

interface OrganizationWebsite {
  id: number;
  attributes: {
    organization_id: string;
    subdomain: string;
    custom_domain?: string;
    is_published: boolean;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    content_data?: Record<string, unknown>; // JSON contenuti editabili
    template?: {
      data?: WebsiteTemplate;
    };
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Headers comuni per le richieste Strapi
 */
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
});

/**
 * Gestisce gli errori delle richieste Strapi
 */
const handleStrapiError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Strapi Error: ${response.statusText}`);
  }
  return response;
};

// ====================================
// WEBSITE TEMPLATES
// ====================================

/**
 * Ottiene tutti i template disponibili
 */
export const getTemplates = async (filters?: {
  category?: string;
  is_active?: boolean;
}): Promise<WebsiteTemplate[]> => {
  try {
    let url = `${STRAPI_URL}/api/website-templates?populate=*`;
    
    // Aggiungi filtri se presenti
    if (filters?.category) {
      url += `&filters[category][$eq]=${filters.category}`;
    }
    if (filters?.is_active !== undefined) {
      url += `&filters[is_active][$eq]=${filters.is_active}`;
    }

    const response = await fetch(url, {
      headers: getHeaders(),
    });

    await handleStrapiError(response);
    const result: StrapiResponse<WebsiteTemplate[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Errore nel recupero dei template:', error);
    throw error;
  }
};

/**
 * Ottiene un template specifico per ID
 */
export const getTemplateById = async (id: number): Promise<WebsiteTemplate | null> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/website-templates/${id}?populate=deep`,
      {
        headers: getHeaders(),
      }
    );

    await handleStrapiError(response);
    const result: StrapiResponse<WebsiteTemplate> = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Errore nel recupero del template ${id}:`, error);
    return null;
  }
};

// ====================================
// ORGANIZATION WEBSITES
// ====================================

/**
 * Ottiene il sito di un'organizzazione per organization_id
 */
export const getWebsiteByOrganizationId = async (
  organizationId: string
): Promise<OrganizationWebsite | null> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/organization-websites?` +
      `filters[organization_id][$eq]=${organizationId}&` +
      `populate=deep`,
      {
        headers: getHeaders(),
      }
    );

    await handleStrapiError(response);
    const result: StrapiResponse<OrganizationWebsite[]> = await response.json();
    return result.data[0] || null;
  } catch (error) {
    console.error(`Errore nel recupero del sito per org ${organizationId}:`, error);
    return null;
  }
};

/**
 * Ottiene un sito per subdomain
 */
export const getWebsiteBySubdomain = async (
  subdomain: string
): Promise<OrganizationWebsite | null> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/organization-websites?` +
      `filters[subdomain][$eq]=${subdomain}&` +
      `populate=deep`,
      {
        headers: getHeaders(),
      }
    );

    await handleStrapiError(response);
    const result: StrapiResponse<OrganizationWebsite[]> = await response.json();
    return result.data[0] || null;
  } catch (error) {
    console.error(`Errore nel recupero del sito per subdomain ${subdomain}:`, error);
    return null;
  }
};

/**
 * Crea un nuovo sito per un'organizzazione
 */
export const createWebsite = async (data: {
  organization_id: string;
  subdomain: string;
  template_id: number;
  content_data?: Record<string, unknown>;
  seo_title?: string;
  seo_description?: string;
  is_published?: boolean;
}): Promise<OrganizationWebsite> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/organization-websites`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          data: {
            organization_id: data.organization_id,
            subdomain: data.subdomain,
            template: data.template_id,
            content_data: data.content_data || {},
            seo_title: data.seo_title,
            seo_description: data.seo_description,
            is_published: data.is_published || false,
          },
        }),
      }
    );

    await handleStrapiError(response);
    const result: StrapiResponse<OrganizationWebsite> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Errore nella creazione del sito:', error);
    throw error;
  }
};

/**
 * Aggiorna i contenuti di un sito
 */
export const updateWebsiteContent = async (
  websiteId: number,
  content_data: Record<string, unknown>
): Promise<OrganizationWebsite> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/organization-websites/${websiteId}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          data: {
            content_data,
          },
        }),
      }
    );

    await handleStrapiError(response);
    const result: StrapiResponse<OrganizationWebsite> = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Errore nell'aggiornamento del sito ${websiteId}:`, error);
    throw error;
  }
};

/**
 * Pubblica/Nasconde un sito
 */
export const toggleWebsitePublish = async (
  websiteId: number,
  is_published: boolean
): Promise<OrganizationWebsite> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/organization-websites/${websiteId}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          data: {
            is_published,
          },
        }),
      }
    );

    await handleStrapiError(response);
    const result: StrapiResponse<OrganizationWebsite> = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Errore nel toggle publish del sito ${websiteId}:`, error);
    throw error;
  }
};

/**
 * Elimina un sito
 */
export const deleteWebsite = async (websiteId: number): Promise<void> => {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/organization-websites/${websiteId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );

    await handleStrapiError(response);
  } catch (error) {
    console.error(`Errore nell'eliminazione del sito ${websiteId}:`, error);
    throw error;
  }
};

// ====================================
// UTILITY
// ====================================

/**
 * Verifica la connessione con Strapi
 */
export const checkStrapiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${STRAPI_URL}/api/website-templates?pagination[limit]=1`, {
      headers: getHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.error('Errore connessione Strapi:', error);
    return false;
  }
};

/**
 * Ottiene l'URL completo di un'immagine Strapi
 */
export const getStrapiImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${STRAPI_URL}${imageUrl}`;
};

export default {
  // Templates
  getTemplates,
  getTemplateById,
  
  // Websites
  getWebsiteByOrganizationId,
  getWebsiteBySubdomain,
  createWebsite,
  updateWebsiteContent,
  toggleWebsitePublish,
  deleteWebsite,
  
  // Utility
  checkStrapiConnection,
  getStrapiImageUrl,
};
