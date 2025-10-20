import React, { useState, useEffect } from 'react';
import { X, Save, Globe, Eye, Settings } from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import DynamicFormGenerator from '../POS/DynamicFormGenerator';
import './AdminWebsiteEditor.css';

interface AdminWebsiteEditorProps {
  websiteId: string;
  onClose: () => void;
  onSave: () => void;
}

const AdminWebsiteEditor: React.FC<AdminWebsiteEditorProps> = ({
  websiteId,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  // Website data
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [content, setContent] = useState<any>({});
  const [editableFields, setEditableFields] = useState<any>(null);
  const [templateName, setTemplateName] = useState<string>('');

  // Settings data
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

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
  }, [websiteId]);

  const loadWebsiteData = async () => {
    try {
      setLoading(true);
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      const response = await fetch(
        `${strapiUrl}/api/organization-websites/${websiteId}?populate=template`,
        {
          headers: {
            'Authorization': `Bearer ${strapiToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Errore nel caricamento del sito');

      const data = await response.json();
      const siteData = data.data;

      setWebsiteData(siteData);
      setContent(siteData.contenuto || {});

      // Load settings
      setSubdomain(siteData.subdomain || '');
      setCustomDomain(siteData.custom_domain || '');
      setIsPublished(siteData.is_published || false);
      setSeoTitle(siteData.seo_title || '');
      setSeoDescription(siteData.seo_description || '');

      // Get template and editable_fields
      const template = siteData.template?.data;
      if (template) {
        setTemplateName(template.attributes?.name || template.nome || 'Template');

        const fields = template.attributes?.editable_fields || template.editable_fields;

        if (fields && Object.keys(fields).length > 0) {
          setEditableFields(fields);
        } else {
          setEditableFields(getDefaultSchema());
        }
      } else {
        setEditableFields(getDefaultSchema());
      }
    } catch (error: any) {
      console.error('Error loading website:', error);
      showToast('Errore nel caricamento del sito', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSchema = () => ({
    hero: {
      type: 'object',
      label: '🎯 Hero Section',
      fields: {
        title: { type: 'text', label: 'Titolo Principale', required: true },
        subtitle: { type: 'text', label: 'Sottotitolo' },
        cta_text: { type: 'text', label: 'Testo Pulsante' },
        image_url: { type: 'image', label: 'Immagine Hero' }
      }
    },
    menu: {
      type: 'object',
      label: '🍽️ Menu / Prodotti',
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
      label: '📖 Chi Siamo',
      fields: {
        title: { type: 'text', label: 'Titolo' },
        text: { type: 'textarea', label: 'Testo Presentazione' }
      }
    },
    contact: {
      type: 'object',
      label: '📞 Contatti',
      fields: {
        phone: { type: 'text', label: 'Telefono' },
        email: { type: 'text', label: 'Email' },
        address: { type: 'text', label: 'Indirizzo' }
      }
    }
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      const updateData: any = {
        contenuto: content,
      };

      // Include settings if on settings tab
      if (activeTab === 'settings') {
        updateData.subdomain = subdomain;
        updateData.custom_domain = customDomain || null;
        updateData.is_published = isPublished;
        updateData.seo_title = seoTitle || null;
        updateData.seo_description = seoDescription || null;
      }

      const response = await fetch(`${strapiUrl}/api/organization-websites/${websiteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${strapiToken}`,
        },
        body: JSON.stringify({
          data: updateData
        }),
      });

      if (!response.ok) throw new Error('Errore nel salvataggio');

      showToast('✅ Modifiche salvate con successo!', 'success');

      // Wait a bit before calling onSave to refresh parent
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (error: any) {
      console.error('Error saving:', error);
      showToast('❌ Errore nel salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-editor-modal">
        <div className="admin-editor-content" style={{ padding: '3rem', textAlign: 'center' }}>
          <PageLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-editor-modal" onClick={onClose}>
      <div className="admin-editor-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-editor-header">
          <div className="admin-editor-header-left">
            <Globe size={28} />
            <div>
              <h2 className="admin-editor-title">Modifica Sito Web</h2>
              <p className="admin-editor-subtitle">{templateName}</p>
            </div>
          </div>
          <div className="admin-editor-header-right">
            <button
              className="admin-editor-btn admin-editor-btn-primary"
              onClick={handleSave}
              disabled={saving || uploading}
            >
              <Save size={20} />
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
            <button className="admin-editor-btn-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-editor-tabs">
          <button
            className={`admin-editor-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <Eye size={18} />
            Contenuti
          </button>
          <button
            className={`admin-editor-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            Impostazioni
          </button>
        </div>

        {/* Content */}
        <div className="admin-editor-body">
          {activeTab === 'content' && editableFields && (
            <DynamicFormGenerator
              schema={editableFields}
              content={content}
              onContentChange={setContent}
              organizationId={websiteData?.organization_id || 'admin'}
              onUploadStart={() => setUploading(true)}
              onUploadEnd={() => setUploading(false)}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <div className="admin-editor-settings">
              <div className="admin-settings-section">
                <h3>🔗 Dominio</h3>

                <div className="admin-form-group">
                  <label>Sottodominio</label>
                  <div className="admin-subdomain-wrapper">
                    <input
                      type="text"
                      className="admin-input"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="es. pizzerianapoli"
                    />
                    <span className="admin-subdomain-suffix">.omnilypro.com</span>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Dominio Custom (opzionale)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="es. www.tuosito.it"
                  />
                </div>
              </div>

              <div className="admin-settings-section">
                <h3>📄 SEO</h3>

                <div className="admin-form-group">
                  <label>Titolo SEO</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titolo per motori di ricerca"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Descrizione SEO</label>
                  <textarea
                    className="admin-textarea"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Descrizione per motori di ricerca"
                    rows={3}
                  />
                </div>
              </div>

              <div className="admin-settings-section">
                <h3>🌐 Pubblicazione</h3>

                <div className="admin-form-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                    />
                    <span>Sito pubblicato (visibile al pubblico)</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="admin-editor-footer">
          <button className="admin-editor-btn admin-editor-btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button
            className="admin-editor-btn admin-editor-btn-primary"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            <Save size={20} />
            {saving ? 'Salvataggio in corso...' : uploading ? 'Upload in corso...' : 'Salva Modifiche'}
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
    </div>
  );
};

export default AdminWebsiteEditor;
