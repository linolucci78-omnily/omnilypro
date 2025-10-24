import React, { useState, useEffect } from 'react';
import { Globe, Save, Eye, Target, UtensilsCrossed, BookOpen, Phone } from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import DynamicFormGenerator from './DynamicFormGenerator';
import { directusClient } from '../../lib/directus';
import './WebsiteContentEditor.css';

interface WebsiteContentEditorProps {
  organizationId: string;
}

const WebsiteContentEditor: React.FC<WebsiteContentEditorProps> = ({
  organizationId
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Website and Template data
  const [actualWebsiteId, setActualWebsiteId] = useState<string | null>(null);
  const [content, setContent] = useState<any>({});
  const [editableFields, setEditableFields] = useState<any>(null);
  const [templateName, setTemplateName] = useState<string>('');

  // Toast state
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    loadWebsiteData();
  }, [organizationId]);

  const loadWebsiteData = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch websites from Directus by organization_id
      const websites = await directusClient.getOrganizationWebsites(organizationId);

      if (websites && websites.length > 0) {
        const website = websites[0];
        setActualWebsiteId(website.id.toString());

        // Get complete website data with pages, sections, and components
        const completeWebsite = await directusClient.getWebsiteComplete(website.id);

        // Convert Directus structure to legacy content format for DynamicFormGenerator
        const convertedContent: any = {};

        if (completeWebsite.pages && completeWebsite.pages.length > 0) {
          const homepage = completeWebsite.pages.find(p => p.is_homepage) || completeWebsite.pages[0];

          if (homepage.sections) {
            homepage.sections.forEach((section: any) => {
              const sectionType = section.section_type;
              const components = section.components || [];

              // Convert sections to legacy format
              if (sectionType === 'hero') {
                const headingComp = components.find((c: any) => c.component_type === 'heading');
                const buttonComp = components.find((c: any) => c.component_type === 'button');
                const imageComp = components.find((c: any) => c.component_type === 'image');

                convertedContent.hero = {
                  title: section.section_title || headingComp?.content_text || '',
                  subtitle: section.section_subtitle || '',
                  cta_text: buttonComp?.content_link_text || '',
                  image_url: imageComp?.content_image || ''
                };
              } else if (sectionType === 'menu' || sectionType === 'menu_food') {
                const menuComponents = components.filter((c: any) => c.component_type === 'menu_item');
                convertedContent.menu = {
                  title: section.section_title || '',
                  items: menuComponents.map((c: any) => ({
                    nome: c.item_name || '',
                    descrizione: c.item_description || '',
                    prezzo: c.item_price ? parseFloat(c.item_price) : 0,
                    foto: c.item_image || ''
                  }))
                };
              } else if (sectionType === 'about' || sectionType === 'chi_siamo') {
                const textComp = components.find((c: any) => c.component_type === 'text' || c.component_type === 'paragraph');
                convertedContent.about = {
                  title: section.section_title || '',
                  text: textComp?.content_text || textComp?.content_rich_text || ''
                };
              } else if (sectionType === 'contact' || sectionType === 'footer') {
                const phoneComp = components.find((c: any) => c.component_type === 'contact_phone');
                const emailComp = components.find((c: any) => c.component_type === 'contact_email');
                const addressComp = components.find((c: any) => c.component_type === 'contact_address');

                convertedContent.contact = {
                  phone: phoneComp?.content_text || '',
                  email: emailComp?.content_text || '',
                  address: addressComp?.content_text || ''
                };
              }
            });
          }
        }

        setContent(convertedContent);

        // Set template name
        if (completeWebsite.template) {
          setTemplateName(completeWebsite.template.name || 'Template');
        }

        // Use default schema (Directus doesn't store editable_fields in template)
        setEditableFields(getDefaultSchema());
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error loading website:', error);
      showToast('Errore nel caricamento del sito', 'error');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Default schema fallback (for sites without editable_fields defined)
  const getDefaultSchema = () => ({
    hero: {
      type: 'object',
      label: 'Hero Section',
      icon: 'Target',
      fields: {
        title: { type: 'text', label: 'Titolo Principale', required: true },
        subtitle: { type: 'text', label: 'Sottotitolo' },
        cta_text: { type: 'text', label: 'Testo Pulsante' },
        image_url: { type: 'image', label: 'Immagine Hero' }
      }
    },
    menu: {
      type: 'object',
      label: 'Menu / Prodotti',
      icon: 'UtensilsCrossed',
      fields: {
        title: { type: 'text', label: 'Titolo Sezione' },
        items: {
          type: 'repeater',
          label: 'Prodotti',
          maxItems: 50,
          fields: {
            nome: { type: 'text', label: 'Nome Prodotto', required: true },
            descrizione: { type: 'textarea', label: 'Descrizione' },
            prezzo: { type: 'decimal', label: 'Prezzo (€)', min: 0 },
            foto: { type: 'image', label: 'Foto Prodotto' }
          }
        }
      }
    },
    about: {
      type: 'object',
      label: 'Chi Siamo',
      icon: 'BookOpen',
      fields: {
        title: { type: 'text', label: 'Titolo' },
        text: { type: 'textarea', label: 'Testo Presentazione' }
      }
    },
    contact: {
      type: 'object',
      label: 'Contatti',
      icon: 'Phone',
      fields: {
        phone: { type: 'text', label: 'Telefono' },
        email: { type: 'text', label: 'Email' },
        address: { type: 'text', label: 'Indirizzo' }
      }
    }
  });

  const handleSave = async () => {
    if (!actualWebsiteId) {
      showToast('Nessun sito selezionato', 'warning');
      return;
    }

    try {
      setSaving(true);

      // TODO: Implement Directus save by updating sections and components
      // For now, use AdminWebsiteEditor from OrganizationWebsites component
      showToast('Per modificare il sito, usa il pulsante "Modifica" nella lista siti', 'info');

    } catch (error: any) {
      console.error('❌ Error saving content:', error);
      showToast('Errore nel salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!actualWebsiteId) {
    return (
      <div className="wce-no-site">
        <Globe size={64} className="wce-no-site-icon" />
        <h2>Nessun Sito Web</h2>
        <p>Questa organizzazione non ha ancora un sito web attivo.</p>
        <p className="wce-no-site-hint">
          Contatta l'amministratore per creare un sito.
        </p>
      </div>
    );
  }

  if (!editableFields) {
    return (
      <div className="wce-no-site">
        <Globe size={64} className="wce-no-site-icon" />
        <h2>Caricamento Schema...</h2>
        <p>Attendere il caricamento dello schema editable fields.</p>
      </div>
    );
  }

  return (
    <div className="website-content-editor">
      {/* Header */}
      <div className="wce-header">
        <div className="wce-header-content">
          <Globe size={32} />
          <div>
            <h1 className="wce-title">Modifica il Tuo Sito Web</h1>
            <p className="wce-subtitle">
              {templateName ? `Template: ${templateName}` : 'Aggiorna i contenuti del tuo sito vetrina'}
            </p>
          </div>
        </div>
        <div className="wce-header-actions">
          <button
            className="wce-btn wce-btn-primary"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            <Save size={20} />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>

      {/* Dynamic Content Editor */}
      <div className="wce-content">
        <DynamicFormGenerator
          schema={editableFields}
          content={content}
          onContentChange={setContent}
          organizationId={organizationId}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
          showToast={showToast}
        />
      </div>

      {/* Fixed Save Button for Mobile */}
      <div className="wce-fixed-save">
        <button
          className="wce-btn wce-btn-primary wce-btn-block"
          onClick={handleSave}
          disabled={saving || uploading}
        >
          <Save size={24} />
          {saving ? 'Salvataggio in corso...' : uploading ? 'Upload in corso...' : 'Salva Tutte le Modifiche'}
        </button>
      </div>

      {/* Toast */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
};

export default WebsiteContentEditor;
