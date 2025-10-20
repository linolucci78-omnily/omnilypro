/**
 * Strapi CMS Client per OmnilyPro
 * Gestisce comunicazione con backend Strapi per Website Builder
 */

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN || '';

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
    nome: string;
    slug: string;
    categoria: 'ristorante' | 'bar' | 'negozio' | 'servizi' | 'beauty' | 'altro';
    descrizione?: string;
    anteprima?: {
      data: {
        attributes: {
          url: string;
          alternativeText?: string;
        };
      };
    };
    sezioni?: any[]; // Dynamic Zone
    editable_fields: any; // JSON schema dei campi editabili
    contenuto_default?: any; // JSON contenuto di default
    component_path: string; // Path del componente React
    is_active: boolean;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface OrganizationWebsite {
  id: number;
  attributes: {
    organization_id: string;
    subdomain: string;
    nome: string;
    custom_domain?: string;
    is_published: boolean;
    is_maintenance: boolean;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    og_image?: {
      data: {
        attributes: {
          url: string;
        };
      };
    };
    analytics_id?: string;
    template?: {
      data: WebsiteTemplate;
    };
    contenuto: any; // JSON contenuto editabile
    createdAt: string;
    updatedAt: string;
    locale?: string; // i18n
  };
}

class StrapiClient {
  private baseURL: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseURL = url;
    this.token = token;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<StrapiResponse<T>> {
    const url = `${this.baseURL}/api${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || `Strapi API Error: ${response.status}`);
    }

    return response.json();
  }

  // ==================== WEBSITE TEMPLATES ====================

  /**
   * Ottieni tutti i template disponibili
   */
  async getTemplates(filters?: {
    category?: string;
    is_active?: boolean;
    price_tier?: string;
  }): Promise<WebsiteTemplate[]> {
    const params = new URLSearchParams();
    params.append('populate', '*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(`filters[${key}][$eq]`, String(value));
        }
      });
    }

    const response = await this.fetch<WebsiteTemplate[]>(
      `/website-templates?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Ottieni singolo template per ID
   */
  async getTemplate(id: number): Promise<WebsiteTemplate> {
    const response = await this.fetch<WebsiteTemplate>(
      `/website-templates/${id}?populate=*`
    );
    return response.data;
  }

  /**
   * Crea nuovo template (solo admin)
   */
  async createTemplate(data: Partial<WebsiteTemplate['attributes']>): Promise<WebsiteTemplate> {
    const response = await this.fetch<WebsiteTemplate>('/website-templates', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    return response.data;
  }

  /**
   * Aggiorna template esistente (solo admin)
   */
  async updateTemplate(
    id: number,
    data: Partial<WebsiteTemplate['attributes']>
  ): Promise<WebsiteTemplate> {
    const response = await this.fetch<WebsiteTemplate>(`/website-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
    return response.data;
  }

  /**
   * Elimina template (solo admin)
   */
  async deleteTemplate(id: number): Promise<void> {
    await this.fetch(`/website-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== ORGANIZATION WEBSITES ====================

  /**
   * Ottieni siti per organization_id
   */
  async getOrganizationWebsites(organizationId: string): Promise<OrganizationWebsite[]> {
    const params = new URLSearchParams();
    params.append('populate', '*');
    params.append('filters[organization_id][$eq]', organizationId);

    const response = await this.fetch<OrganizationWebsite[]>(
      `/organization-websites?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Ottieni sito per subdomain
   */
  async getWebsiteBySubdomain(subdomain: string): Promise<OrganizationWebsite | null> {
    const params = new URLSearchParams();
    params.append('populate', '*');
    params.append('filters[subdomain][$eq]', subdomain);
    params.append('filters[is_published][$eq]', 'true');

    const response = await this.fetch<OrganizationWebsite[]>(
      `/organization-websites?${params.toString()}`
    );
    return response.data[0] || null;
  }

  /**
   * Crea nuovo sito per organizzazione
   */
  async createOrganizationWebsite(
    data: Partial<OrganizationWebsite['attributes']>
  ): Promise<OrganizationWebsite> {
    const response = await this.fetch<OrganizationWebsite>('/organization-websites', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    return response.data;
  }

  /**
   * Aggiorna contenuto sito
   */
  async updateOrganizationWebsite(
    id: number,
    data: Partial<OrganizationWebsite['attributes']>
  ): Promise<OrganizationWebsite> {
    const response = await this.fetch<OrganizationWebsite>(
      `/organization-websites/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ data }),
      }
    );
    return response.data;
  }

  /**
   * Pubblica/Depubblica sito
   */
  async togglePublish(id: number, isPublished: boolean): Promise<OrganizationWebsite> {
    return this.updateOrganizationWebsite(id, { is_published: isPublished });
  }

  /**
   * Elimina sito organizzazione
   */
  async deleteOrganizationWebsite(id: number): Promise<void> {
    await this.fetch(`/organization-websites/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== UPLOAD MEDIA ====================

  /**
   * Upload file/immagine
   */
  async uploadFile(file: File, ref?: string, refId?: number, field?: string): Promise<any> {
    const formData = new FormData();
    formData.append('files', file);
    
    if (ref) formData.append('ref', ref);
    if (refId) formData.append('refId', String(refId));
    if (field) formData.append('field', field);

    const response = await fetch(`${this.baseURL}/api/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }
}

// Singleton instance
export const strapiClient = new StrapiClient(STRAPI_URL, STRAPI_API_TOKEN);

// Export types
export type { WebsiteTemplate, OrganizationWebsite, StrapiResponse };
