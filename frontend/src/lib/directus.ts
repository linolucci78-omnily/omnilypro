/**
 * Directus Client per Website Builder
 *
 * Gestisce tutte le chiamate API a Directus per:
 * - Organizations Websites
 * - Website Pages
 * - Page Sections
 * - Section Components
 */

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://omnilypro-directus.onrender.com';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'ejtLayi_fWbvPXQ1Afax78ym7TvvfXDz';

// ============================================
// TYPES
// ============================================

export interface DirectusWebsite {
  id: number;
  organization_id: string;
  site_name: string;
  domain: string | null;
  published: boolean;
  created_at: string;
  template?: {
    id: number;
    name: string;
    component_path: string;
  } | null;
}

export interface DirectusPage {
  id: number;
  website_id: number;
  page_name: string;
  slug: string;
  title: string;
  meta_description: string | null;
  is_homepage: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DirectusSection {
  id: number;
  page_id: number;
  section_type: string;
  section_name: string;
  section_title: string | null;
  section_subtitle: string | null;
  sort_order: number;
  visible: boolean;
  background_color: string | null;
  background_image: string | null;
  layout_style: string;
  padding_top: string;
  padding_bottom: string;
  text_align: string;
  created_at: string;
  updated_at: string;
}

export interface DirectusComponent {
  id: number;
  section_id: number;
  component_type: string;
  component_label: string;
  content_text: string | null;
  content_rich_text: string | null;
  content_image: string | null;
  image_alt_text: string | null;
  content_link_url: string | null;
  content_link_text: string | null;
  button_style: string | null;
  item_name: string | null;
  item_description: string | null;
  item_price: number | null;
  item_image: string | null;
  testimonial_author: string | null;
  testimonial_rating: number | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface DirectusPageWithSections extends DirectusPage {
  sections: DirectusSectionWithComponents[];
}

export interface DirectusSectionWithComponents extends DirectusSection {
  components: DirectusComponent[];
}

export interface DirectusWebsiteComplete extends DirectusWebsite {
  pages: DirectusPageWithSections[];
}

// Template types
export type TemplateType = 'restaurant' | 'salon' | 'gym' | 'bakery' | 'shop' | 'generic';

// ============================================
// API CLIENT
// ============================================

class DirectusClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Directus API Error: ${error}`);
    }

    const data = await response.json();
    return data.data;
  }

  // ============================================
  // WEBSITES
  // ============================================

  async getOrganizationWebsites(organizationId: string): Promise<DirectusWebsite[]> {
    const filter = JSON.stringify({ organization_id: { _eq: organizationId } });
    return this.request<DirectusWebsite[]>(
      `/items/organizations_websites?filter=${encodeURIComponent(filter)}&sort=-created_at`
    );
  }

  async getWebsiteById(websiteId: number): Promise<DirectusWebsite> {
    return this.request<DirectusWebsite>(`/items/organizations_websites/${websiteId}`);
  }

  async getWebsiteComplete(websiteId: number): Promise<DirectusWebsiteComplete> {
    // First get the website
    const website = await this.request<DirectusWebsite>(`/items/organizations_websites/${websiteId}`);

    // Then get pages with sections and components
    const pageFilter = JSON.stringify({ website_id: { _eq: websiteId } });
    const pages = await this.request<DirectusPageWithSections[]>(
      `/items/website_pages?filter=${encodeURIComponent(pageFilter)}&sort=sort_order`
    );

    // For each page, get sections with components
    const pagesWithSections = await Promise.all(
      pages.map(async (page) => {
        const sectionFilter = JSON.stringify({ page_id: { _eq: page.id } });
        const sections = await this.request<DirectusSectionWithComponents[]>(
          `/items/page_sections?filter=${encodeURIComponent(sectionFilter)}&sort=sort_order`
        );

        // For each section, get components
        const sectionsWithComponents = await Promise.all(
          sections.map(async (section) => {
            const componentFilter = JSON.stringify({ section_id: { _eq: section.id } });
            const components = await this.request<DirectusComponent[]>(
              `/items/section_components?filter=${encodeURIComponent(componentFilter)}&sort=sort_order`
            );
            return { ...section, components };
          })
        );

        return { ...page, sections: sectionsWithComponents };
      })
    );

    return { ...website, pages: pagesWithSections };
  }

  async createWebsite(data: {
    organization_id: string;
    site_name: string;
    domain?: string;
    published?: boolean;
  }): Promise<DirectusWebsite> {
    return this.request<DirectusWebsite>('/items/organizations_websites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebsite(websiteId: number, data: Partial<DirectusWebsite>): Promise<DirectusWebsite> {
    return this.request<DirectusWebsite>(`/items/organizations_websites/${websiteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWebsite(websiteId: number): Promise<void> {
    await this.request(`/items/organizations_websites/${websiteId}`, {
      method: 'DELETE',
    });
  }

  async togglePublish(websiteId: number, published: boolean): Promise<DirectusWebsite> {
    return this.updateWebsite(websiteId, { published });
  }

  // ============================================
  // PAGES
  // ============================================

  async getWebsitePages(websiteId: number): Promise<DirectusPage[]> {
    const filter = JSON.stringify({ website_id: { _eq: websiteId } });
    return this.request<DirectusPage[]>(
      `/items/website_pages?filter=${encodeURIComponent(filter)}&sort=sort_order`
    );
  }

  async getPageWithSections(pageId: number): Promise<DirectusPageWithSections> {
    // Get page first
    const page = await this.request<DirectusPage>(`/items/website_pages/${pageId}`);

    // Get sections with components
    const sectionFilter = JSON.stringify({ page_id: { _eq: pageId } });
    const sections = await this.request<DirectusSectionWithComponents[]>(
      `/items/page_sections?filter=${encodeURIComponent(sectionFilter)}&sort=sort_order`
    );

    // For each section, get components
    const sectionsWithComponents = await Promise.all(
      sections.map(async (section) => {
        const componentFilter = JSON.stringify({ section_id: { _eq: section.id } });
        const components = await this.request<DirectusComponent[]>(
          `/items/section_components?filter=${encodeURIComponent(componentFilter)}&sort=sort_order`
        );
        return { ...section, components };
      })
    );

    return { ...page, sections: sectionsWithComponents };
  }

  async createPage(data: {
    website_id: number;
    page_name: string;
    slug: string;
    title: string;
    meta_description?: string;
    is_homepage?: boolean;
    published?: boolean;
    sort_order?: number;
  }): Promise<DirectusPage> {
    return this.request<DirectusPage>('/items/website_pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePage(pageId: number, data: Partial<DirectusPage>): Promise<DirectusPage> {
    return this.request<DirectusPage>(`/items/website_pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePage(pageId: number): Promise<void> {
    await this.request(`/items/website_pages/${pageId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // SECTIONS
  // ============================================

  async getPageSections(pageId: number): Promise<DirectusSection[]> {
    const filter = JSON.stringify({ page_id: { _eq: pageId } });
    return this.request<DirectusSection[]>(
      `/items/page_sections?filter=${encodeURIComponent(filter)}&sort=sort_order`
    );
  }

  async getSectionWithComponents(sectionId: number): Promise<DirectusSectionWithComponents> {
    // Get section first
    const section = await this.request<DirectusSection>(`/items/page_sections/${sectionId}`);

    // Get components
    const componentFilter = JSON.stringify({ section_id: { _eq: sectionId } });
    const components = await this.request<DirectusComponent[]>(
      `/items/section_components?filter=${encodeURIComponent(componentFilter)}&sort=sort_order`
    );

    return { ...section, components };
  }

  async createSection(data: {
    page_id: number;
    section_type: string;
    section_name: string;
    section_title?: string;
    section_subtitle?: string;
    sort_order?: number;
    visible?: boolean;
    background_color?: string;
    layout_style?: string;
    padding_top?: string;
    padding_bottom?: string;
    text_align?: string;
  }): Promise<DirectusSection> {
    return this.request<DirectusSection>('/items/page_sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSection(sectionId: number, data: Partial<DirectusSection>): Promise<DirectusSection> {
    return this.request<DirectusSection>(`/items/page_sections/${sectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSection(sectionId: number): Promise<void> {
    await this.request(`/items/page_sections/${sectionId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // COMPONENTS
  // ============================================

  async getSectionComponents(sectionId: number): Promise<DirectusComponent[]> {
    const filter = JSON.stringify({ section_id: { _eq: sectionId } });
    return this.request<DirectusComponent[]>(
      `/items/section_components?filter=${encodeURIComponent(filter)}&sort=sort_order`
    );
  }

  async createComponent(data: {
    section_id: number;
    component_type: string;
    component_label: string;
    content_text?: string;
    content_rich_text?: string;
    content_image?: string;
    image_alt_text?: string;
    content_link_url?: string;
    content_link_text?: string;
    button_style?: string;
    item_name?: string;
    item_description?: string;
    item_price?: number;
    item_image?: string;
    testimonial_author?: string;
    testimonial_rating?: number;
    sort_order?: number;
    visible?: boolean;
  }): Promise<DirectusComponent> {
    return this.request<DirectusComponent>('/items/section_components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponent(componentId: number, data: Partial<DirectusComponent>): Promise<DirectusComponent> {
    return this.request<DirectusComponent>(`/items/section_components/${componentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(componentId: number): Promise<void> {
    await this.request(`/items/section_components/${componentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // TEMPLATES - Crea sito da template
  // ============================================

  async createWebsiteFromTemplate(
    organizationId: string,
    siteName: string,
    templateType: TemplateType
  ): Promise<DirectusWebsiteComplete> {
    // 1. Crea il sito
    const website = await this.createWebsite({
      organization_id: organizationId,
      site_name: siteName,
      published: false,
    });

    // 2. Crea la homepage
    const page = await this.createPage({
      website_id: website.id,
      page_name: 'Home',
      slug: 'home',
      title: `${siteName} - Home`,
      meta_description: `Benvenuto su ${siteName}`,
      is_homepage: true,
      published: false,
      sort_order: 1,
    });

    // 3. Crea sezioni e componenti in base al template
    await this.createTemplateContent(page.id, templateType, siteName);

    // 4. Ritorna il sito completo
    return this.getWebsiteComplete(website.id);
  }

  private async createTemplateContent(
    pageId: number,
    templateType: TemplateType,
    siteName: string
  ): Promise<void> {
    switch (templateType) {
      case 'restaurant':
        await this.createRestaurantTemplate(pageId, siteName);
        break;
      case 'salon':
        await this.createSalonTemplate(pageId, siteName);
        break;
      case 'gym':
        await this.createGymTemplate(pageId, siteName);
        break;
      case 'bakery':
        await this.createBakeryTemplate(pageId, siteName);
        break;
      case 'shop':
        await this.createShopTemplate(pageId, siteName);
        break;
      default:
        await this.createGenericTemplate(pageId, siteName);
    }
  }

  private async createRestaurantTemplate(pageId: number, siteName: string): Promise<void> {
    // Hero Section
    const heroSection = await this.createSection({
      page_id: pageId,
      section_type: 'hero',
      section_name: 'Hero Homepage',
      section_title: `Benvenuti da ${siteName}`,
      section_subtitle: 'La tradizione incontra il gusto',
      sort_order: 1,
      visible: true,
      background_color: '#1a1a1a',
      layout_style: 'centered',
      padding_top: 'large',
      padding_bottom: 'large',
      text_align: 'center',
    });

    await this.createComponent({
      section_id: heroSection.id,
      component_type: 'heading',
      component_label: 'Titolo Principale',
      content_text: 'Le Migliori Specialità',
      sort_order: 1,
      visible: true,
    });

    await this.createComponent({
      section_id: heroSection.id,
      component_type: 'button',
      component_label: 'Bottone Prenota',
      content_link_text: 'Prenota un Tavolo',
      content_link_url: '#contact',
      button_style: 'primary',
      sort_order: 2,
      visible: true,
    });

    // Menu Section
    const menuSection = await this.createSection({
      page_id: pageId,
      section_type: 'menu_food',
      section_name: 'Menu',
      section_title: 'Il Nostro Menu',
      section_subtitle: 'Piatti preparati con ingredienti freschi',
      sort_order: 2,
      visible: true,
      background_color: '#f8f8f8',
      layout_style: 'grid_2_cols',
      padding_top: 'large',
      padding_bottom: 'large',
      text_align: 'left',
    });

    // Aggiungi piatti di esempio
    const piatti = [
      { name: 'Piatto 1', description: 'Descrizione del piatto 1', price: 12.00 },
      { name: 'Piatto 2', description: 'Descrizione del piatto 2', price: 15.00 },
      { name: 'Piatto 3', description: 'Descrizione del piatto 3', price: 18.00 },
    ];

    for (let i = 0; i < piatti.length; i++) {
      await this.createComponent({
        section_id: menuSection.id,
        component_type: 'menu_item',
        component_label: piatti[i].name,
        item_name: piatti[i].name,
        item_description: piatti[i].description,
        item_price: piatti[i].price,
        sort_order: i + 1,
        visible: true,
      });
    }

    // Footer Section
    const footerSection = await this.createSection({
      page_id: pageId,
      section_type: 'footer',
      section_name: 'Contatti',
      section_title: 'Vieni a Trovarci',
      sort_order: 3,
      visible: true,
      background_color: '#1a1a1a',
      layout_style: 'grid_3_cols',
      padding_top: 'large',
      padding_bottom: 'large',
      text_align: 'center',
    });

    await this.createComponent({
      section_id: footerSection.id,
      component_type: 'contact_info',
      component_label: 'Indirizzo',
      content_text: 'Via Example 123\n00100 Città',
      sort_order: 1,
      visible: true,
    });

    await this.createComponent({
      section_id: footerSection.id,
      component_type: 'contact_info',
      component_label: 'Telefono',
      content_text: '+39 123 456 7890',
      content_link_url: 'tel:+39123456789',
      sort_order: 2,
      visible: true,
    });
  }

  // Placeholder per altri template
  private async createSalonTemplate(pageId: number, siteName: string): Promise<void> {
    // TODO: Implementare template parrucchiere
    await this.createGenericTemplate(pageId, siteName);
  }

  private async createGymTemplate(pageId: number, siteName: string): Promise<void> {
    // TODO: Implementare template palestra
    await this.createGenericTemplate(pageId, siteName);
  }

  private async createBakeryTemplate(pageId: number, siteName: string): Promise<void> {
    // TODO: Implementare template panetteria
    await this.createGenericTemplate(pageId, siteName);
  }

  private async createShopTemplate(pageId: number, siteName: string): Promise<void> {
    // TODO: Implementare template negozio
    await this.createGenericTemplate(pageId, siteName);
  }

  private async createGenericTemplate(pageId: number, siteName: string): Promise<void> {
    // Template generico base
    const heroSection = await this.createSection({
      page_id: pageId,
      section_type: 'hero',
      section_name: 'Hero Homepage',
      section_title: `Benvenuti su ${siteName}`,
      sort_order: 1,
      visible: true,
      background_color: '#ffffff',
      layout_style: 'centered',
      padding_top: 'large',
      padding_bottom: 'large',
      text_align: 'center',
    });

    await this.createComponent({
      section_id: heroSection.id,
      component_type: 'heading',
      component_label: 'Titolo Principale',
      content_text: siteName,
      sort_order: 1,
      visible: true,
    });
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const directusClient = new DirectusClient(DIRECTUS_URL, DIRECTUS_TOKEN);
