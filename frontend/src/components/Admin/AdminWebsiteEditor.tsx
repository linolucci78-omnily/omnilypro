import React, { useState, useEffect } from 'react';
import { X, Save, Globe, Eye, Settings, Monitor, Smartphone } from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import DynamicFormGenerator from '../POS/DynamicFormGenerator';
import { directusClient } from '../../lib/directus';
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
  const [viewMode, setViewMode] = useState<'desktop' | 'pos'>('desktop');

  // Website data
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [content, setContent] = useState<any>({});
  const [editableFields, setEditableFields] = useState<any>(null);
  const [templateName, setTemplateName] = useState<string>('');

  // Settings data
  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');
  const [isPublished, setIsPublished] = useState(false);

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

      // Load website with pages, sections, and components from Directus
      const siteData = await directusClient.getWebsiteComplete(parseInt(websiteId));

      setWebsiteData(siteData);

      // Load settings
      setSiteName(siteData.site_name || '');
      setDomain(siteData.domain || '');
      setIsPublished(siteData.published || false);

      // Convert Directus structure to editable content format
      // This creates a structure compatible with DynamicFormGenerator
      const contentData: any = {};

      if (siteData.pages && siteData.pages.length > 0) {
        const homepage = siteData.pages.find(p => p.is_homepage) || siteData.pages[0];

        if (homepage.sections) {
          homepage.sections.forEach(section => {
            const sectionKey = section.section_type;
            contentData[sectionKey] = {
              title: section.section_title || '',
              subtitle: section.section_subtitle || '',
              components: section.components || []
            };
          });
        }
      }

      setContent(contentData);
      setTemplateName(siteData.site_name);
      setEditableFields(getDefaultSchema());

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

      const updateData: any = {
        site_name: siteName,
        domain: domain || null,
        published: isPublished,
      };

      // Update website basic info
      await directusClient.updateWebsite(parseInt(websiteId), updateData);

      // TODO: Update sections and components based on content changes
      // This would require iterating through content and updating each section/component
      // For now, we just update the website settings

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
                <h3>📝 Informazioni Generali</h3>

                <div className="admin-form-group">
                  <label>Nome Sito</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="es. Pizzeria Da Mario"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Dominio (opzionale)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="es. pizzeriadamario.com"
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
