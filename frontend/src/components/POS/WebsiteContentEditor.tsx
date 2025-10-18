import React, { useState, useEffect } from 'react';
import { Globe, Save, Eye, Target, UtensilsCrossed, BookOpen, Phone } from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import DynamicFormGenerator from './DynamicFormGenerator';
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
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      // Fetch website by organization_id with template populated
      const response = await fetch(
        `${strapiUrl}/api/organization-websites?filters[organization_id][$eq]=${organizationId}&populate=template`,
        {
          headers: {
            'Authorization': `Bearer ${strapiToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Errore nel caricamento del sito');

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const siteData = data.data[0];
        setActualWebsiteId(siteData.documentId);

        // Set content
        setContent(siteData.contenuto || {});

        // Get template and editable_fields
        const template = siteData.template?.data;
        if (template) {
          setTemplateName(template.attributes?.name || template.nome || 'Template');

          // Check if template has editable_fields
          const fields = template.attributes?.editable_fields || template.editable_fields;

          if (fields && Object.keys(fields).length > 0) {
            console.log('✅ Editable fields loaded:', fields);
            setEditableFields(fields);
          } else {
            console.warn('⚠️ Template has no editable_fields, using default fallback');
            // Fallback schema for backward compatibility
            setEditableFields(getDefaultSchema());
          }
        } else {
          console.warn('⚠️ No template found, using default fallback schema');
          setEditableFields(getDefaultSchema());
        }
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
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      const response = await fetch(`${strapiUrl}/api/organization-websites/${actualWebsiteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${strapiToken}`,
        },
        body: JSON.stringify({
          data: {
            contenuto: content
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio');
      }

      showToast('Contenuti salvati con successo!', 'success');
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
