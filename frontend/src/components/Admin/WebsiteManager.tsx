import React, { useState, useEffect } from 'react';
import {
  Globe,
  Building2,
  Palette,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Paintbrush,
  Layout
} from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import ConfirmModal from '../UI/ConfirmModal';
import DirectusVisualEditor from './DirectusVisualEditor';
import WebsiteVisualEditor from './WebsiteVisualEditor';
import { supabase } from '../../lib/supabase';
import { directusClient, type TemplateType } from '../../lib/directus';
import './WebsiteManager.css';

// Template options for Directus
const availableTemplates: { id: TemplateType; name: string }[] = [
  { id: 'restaurant', name: 'Ristorante/Pizzeria' },
  { id: 'salon', name: 'Parrucchiere/Salone' },
  { id: 'gym', name: 'Palestra/Centro Fitness' },
  { id: 'bakery', name: 'Panetteria/Pasticceria' },
  { id: 'shop', name: 'Negozio/Shop' },
  { id: 'generic', name: 'Generico' },
];

const WebsiteManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);

  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | ''>('');
  const [siteName, setSiteName] = useState('');
  const [visualEditingWebsite, setVisualEditingWebsite] = useState<number | null>(null);
  const [grapesJSEditingWebsite, setGrapesJSEditingWebsite] = useState<number | null>(null);

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

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Conferma',
    cancelText: 'Annulla',
    type: 'warning',
    onConfirm: () => {}
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'warning' | 'danger' | 'info' = 'warning',
    confirmText: string = 'Conferma',
    cancelText: string = 'Annulla'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch organizations from Supabase
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name', { ascending: true });

        if (orgsError) throw orgsError;
        const organizations = orgsData || [];
        setOrganizations(organizations);

        // 2. Fetch all websites from Directus
        // We'll aggregate websites from all organizations
        const allWebsites: any[] = [];

        for (const org of organizations) {
          try {
            const orgWebsites = await directusClient.getOrganizationWebsites(org.id);
            const formattedSites = orgWebsites.map(site => ({
              id: site.id,
              organization_id: site.organization_id,
              orgName: org.name,
              site_name: site.site_name,
              domain: site.domain,
              is_published: site.published,
              custom_domain: site.domain || 'N/A',
            }));
            allWebsites.push(...formattedSites);
          } catch (err) {
            console.error(`Error fetching websites for org ${org.id}:`, err);
          }
        }

        setWebsites(allWebsites);

      } catch (error) {
        console.error('Error fetching data:', error);
        setOrganizations([]);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSite = async () => {
    if (!selectedOrg || !selectedTemplate || !siteName) {
      showToast('Per favore, compila tutti i campi.', 'warning');
      return;
    }

    try {
      const orgName = organizations.find(o => o.id === selectedOrg)?.name || 'Organizzazione';

      // Create website from template using Directus
      const newSite = await directusClient.createWebsiteFromTemplate(
        selectedOrg,
        siteName,
        selectedTemplate as TemplateType
      );

      // Update UI
      setWebsites(prev => [...prev, {
        id: newSite.id,
        organization_id: newSite.organization_id,
        orgName: orgName,
        site_name: newSite.site_name,
        domain: newSite.domain,
        is_published: newSite.published,
        custom_domain: newSite.domain || 'N/A',
      }]);

      showToast(`Sito "${siteName}" creato con successo per ${orgName}!`, 'success');

      // Reset form
      setSelectedOrg('');
      setSelectedTemplate('');
      setSiteName('');

    } catch (error: any) {
      console.error('Failed to create site:', error);
      showToast(`Errore: ${error.message}`, 'error');
    }
  };
  
  const handleOrgChange = (orgId: string) => {
    setSelectedOrg(orgId);
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      // Suggest site name based on organization name
      setSiteName(`Sito ${org.name}`);
    }
  };

  const handleTogglePublish = async (siteId: number, currentStatus: boolean, siteName: string) => {
    const action = currentStatus ? 'sospendere' : 'pubblicare';
    const confirmMessage = `Sei sicuro di voler ${action} il sito "${siteName}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await directusClient.togglePublish(siteId, !currentStatus);

      // Update UI
      setWebsites(prev => prev.map(site =>
        site.id === siteId
          ? { ...site, is_published: !currentStatus }
          : site
      ));

      showToast(`Sito ${!currentStatus ? 'pubblicato' : 'sospeso'} con successo!`, 'success');
    } catch (error) {
      console.error('Error toggling publish:', error);
      showToast('Errore nell\'aggiornamento dello stato del sito.', 'error');
    }
  };

  const handleEditSite = (siteId: number, siteName: string) => {
    alert(`🚧 Funzionalità in sviluppo!\n\nProssimamente potrai modificare:\n- Contenuti del sito\n- Immagini\n- Menu/prodotti\n- Informazioni contatti\n\nSito: ${siteName}`);
  };

  const handleDeleteSite = async (siteId: number, siteName: string) => {
    const confirmMessage = `⚠️ ATTENZIONE!\n\nSei sicuro di voler eliminare definitivamente il sito "${siteName}"?\n\nQuesta azione NON può essere annullata!`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Double confirmation for delete
    const doubleConfirm = window.confirm('Confermi di voler procedere con l\'eliminazione?');
    if (!doubleConfirm) {
      return;
    }

    try {
      console.log('🗑️ Tentativo eliminazione sito:', { siteId, siteName });
      await directusClient.deleteWebsite(siteId);
      console.log('✅ Sito eliminato con successo da Directus');

      // Update UI
      setWebsites(prev => prev.filter(site => site.id !== siteId));

      showToast('Sito eliminato con successo!', 'success');
    } catch (error: any) {
      console.error('❌ Error deleting site:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
      });
      showToast(`Errore nell'eliminazione del sito: ${error.message || 'Errore sconosciuto'}`, 'error');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="website-manager-dashboard">
      {/* Header */}
      <div className="wm-header">
        <div>
          <h1 className="wm-title">
            <Globe size={40} />
            Gestione Siti Web
          </h1>
          <p className="wm-subtitle">
            Crea, assegna e gestisci i siti vetrina per le organizzazioni.
          </p>
        </div>
      </div>

      {/* Create New Site Card */}
      <div className="wm-card">
        <h2 className="wm-card-title">Crea un Nuovo Sito Web</h2>
        <div className="wm-form-grid">
          {/* Organization Select */}
          <div className="wm-form-group">
            <label htmlFor="organization-select">
              <Building2 size={16} />
              Organizzazione
            </label>
            <select
              id="organization-select"
              className="wm-select"
              value={selectedOrg}
              onChange={(e) => handleOrgChange(e.target.value)}
            >
              <option value="" disabled>Seleziona un'organizzazione</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Template Select */}
          <div className="wm-form-group">
            <label htmlFor="template-select">
              <Palette size={16} />
              Template Sito
            </label>
            <select
              id="template-select"
              className="wm-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
            >
              <option value="" disabled>Seleziona un template</option>
              {availableTemplates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Site Name Input */}
          <div className="wm-form-group">
            <label htmlFor="sitename-input">
              <LinkIcon size={16} />
              Nome Sito
            </label>
            <input
              id="sitename-input"
              type="text"
              className="wm-input"
              placeholder="es. Pizzeria Napoli"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
        </div>
        <div className="wm-card-footer">
          <button className="wm-btn wm-btn-primary" onClick={handleCreateSite}>
            <Plus size={18} />
            Crea Sito Web
          </button>
        </div>
      </div>
      
      {/* Websites List */}
      <div className="wm-card">
        <h2 className="wm-card-title">Siti Web Esistenti</h2>
         <div className="crm-table-card">
              <div className="crm-table-scroll">
                <table className="crm-customers-table">
                  <thead>
                    <tr>
                      <th>Organizzazione</th>
                      <th>Nome Sito</th>
                      <th>Stato</th>
                      <th>Dominio</th>
                      <th style={{ textAlign: 'center' }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websites.map((site) => (
                      <tr key={site.id}>
                        <td>{site.orgName}</td>
                        <td>{site.site_name}</td>
                        <td>
                            <div className={`wm-status-badge ${site.is_published ? 'published' : 'draft'}`}>
                                {site.is_published ? 'Pubblicato' : 'Bozza'}
                            </div>
                        </td>
                        <td>
                            {site.domain ? (
                              <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="wm-subdomain-link">
                                {site.domain}
                              </a>
                            ) : (
                              'N/A'
                            )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="actions-cell">
                            <button
                              className="action-button-circle"
                              title={site.is_published ? "Sospendi pubblicazione" : "Pubblica sito"}
                              onClick={() => handleTogglePublish(site.id, site.is_published, site.site_name)}
                              style={{
                                backgroundColor: site.is_published ? '#10b981' : '#6b7280',
                                color: 'white'
                              }}
                            >
                                {site.is_published ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button
                              className="action-button-circle"
                              title="Visual Editor (Directus)"
                              onClick={() => setVisualEditingWebsite(site.id)}
                              style={{ backgroundColor: '#a855f7', color: 'white' }}
                            >
                              <Paintbrush size={16} />
                            </button>
                            <button
                              className="action-button-circle"
                              title="Page Builder (GrapesJS)"
                              onClick={() => setGrapesJSEditingWebsite(site.id)}
                              style={{ backgroundColor: '#3b82f6', color: 'white' }}
                            >
                              <Layout size={16} />
                            </button>
                            <button
                              className="action-button-circle"
                              title="Modifica impostazioni"
                              onClick={() => handleEditSite(site.id, site.site_name)}
                              style={{ backgroundColor: '#f59e0b', color: 'white' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-button-circle"
                              title="Elimina sito"
                              onClick={() => handleDeleteSite(site.id, site.site_name)}
                              style={{ backgroundColor: '#ef4444', color: 'white' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
      </div>

      {/* Visual Editor Modal (Directus) */}
      {visualEditingWebsite && (
        <DirectusVisualEditor
          websiteId={visualEditingWebsite}
          onClose={() => setVisualEditingWebsite(null)}
        />
      )}

      {/* Page Builder Modal (GrapesJS) */}
      {grapesJSEditingWebsite && (
        <WebsiteVisualEditor
          websiteId={grapesJSEditingWebsite}
          onClose={() => setGrapesJSEditingWebsite(null)}
          onSave={() => {
            setGrapesJSEditingWebsite(null);
            // Ricarica la lista siti
            const fetchData = async () => {
              try {
                const { data: orgsData } = await supabase
                  .from('organizations')
                  .select('id, name')
                  .order('name', { ascending: true });

                const organizations = orgsData || [];
                const allWebsites: any[] = [];

                for (const org of organizations) {
                  try {
                    const orgWebsites = await directusClient.getOrganizationWebsites(org.id);
                    const formattedSites = orgWebsites.map(site => ({
                      id: site.id,
                      organization_id: site.organization_id,
                      orgName: org.name,
                      site_name: site.site_name,
                      domain: site.domain,
                      is_published: site.published,
                      custom_domain: site.domain || 'N/A',
                    }));
                    allWebsites.push(...formattedSites);
                  } catch (err) {
                    console.error(`Error fetching websites for org ${org.id}:`, err);
                  }
                }

                setWebsites(allWebsites);
              } catch (error) {
                console.error('Error refreshing data:', error);
              }
            };
            fetchData();
          }}
        />
      )}

      {/* Toast notifications */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        onConfirm={() => {
          confirmModal.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default WebsiteManager;
