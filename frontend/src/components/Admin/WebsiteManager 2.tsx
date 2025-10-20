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
  ToggleRight
} from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import ConfirmModal from '../UI/ConfirmModal';
import { supabase } from '../../lib/supabase'; // Import Supabase client
import './WebsiteManager.css';

// Mock data for templates and websites - will be replaced later
const mockTemplates = [
  { id: 'template_1', name: 'Restaurant Classic' },
  { id: 'template_2', name: 'Cafe Modern' },
  { id: 'template_3', name: 'Beauty & Wellness' },
];

const mockWebsites = [
    { id: 'site_1', orgName: 'Pizzeria Napoli', templateName: 'Restaurant Classic', subdomain: 'pizzerianapoli', is_published: true, custom_domain: 'www.pizzerianapoli.it' },
    { id: 'site_2', orgName: 'Bar Centrale', templateName: 'Cafe Modern', subdomain: 'barcentrale', is_published: false, custom_domain: '' },
];

const WebsiteManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);

  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subdomain, setSubdomain] = useState('');

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

        // 2. Fetch templates from Strapi
        const strapiUrl = import.meta.env.VITE_STRAPI_URL;
        const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

        if (strapiUrl && strapiToken) {
          const templatesResponse = await fetch(`${strapiUrl}/api/website-templates`, {
            headers: {
              'Authorization': `Bearer ${strapiToken}`,
            },
          });
          if (!templatesResponse.ok) throw new Error('Failed to fetch templates');
          const templatesJson = await templatesResponse.json();
          const formattedTemplates = templatesJson.data.map((t: any) => ({ id: t.id, name: t.nome }));
          setTemplates(formattedTemplates || []);

          // 3. Fetch existing websites from Strapi
          const websitesResponse = await fetch(`${strapiUrl}/api/organization-websites?populate=template`, {
            headers: {
              'Authorization': `Bearer ${strapiToken}`,
            },
          });
          if (!websitesResponse.ok) throw new Error('Failed to fetch websites');
          const websitesJson = await websitesResponse.json();

          const formattedWebsites = websitesJson.data.map((site: any) => {
            const org = organizations.find(o => o.id === site.organization_id);
            return {
              id: site.id,
              orgName: org ? org.name : 'ID non trovato',
              templateName: site.template?.nome || 'Nessun template',
              subdomain: site.subdomain,
              is_published: site.is_published,
              custom_domain: site.custom_domain || 'N/A',
            };
          });
          setWebsites(formattedWebsites || []);

        } else {
          console.error('Strapi URL or Token is not configured in .env file.');
          setTemplates([]);
          setWebsites([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setOrganizations([]);
        setTemplates([]);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSite = async () => {
    if (!selectedOrg || !selectedTemplate || !subdomain) {
      showToast('Per favore, compila tutti i campi.', 'warning');
      return;
    }

    try {
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      if (!strapiUrl || !strapiToken) {
        throw new Error('Strapi URL or Token not configured');
      }

      const orgName = organizations.find(o => o.id === selectedOrg)?.name || subdomain;

      const payload = {
        data: {
          organization_id: selectedOrg,
          template: selectedTemplate,
          subdomain: subdomain,
          nome: `Sito di ${orgName}`,
          is_published: false, // Start as draft
          contenuto: {} // Start with empty content
        },
      };

      const response = await fetch(`${strapiUrl}/api/organization-websites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${strapiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('Strapi error:', errorBody);
        throw new Error(`Creazione sito fallita: ${errorBody.error?.message || response.statusText}`);
      }

      const newSite = await response.json();

      // Optimistically update UI
      setWebsites(prev => [...prev, {
        id: newSite.data.id,
        orgName: orgName,
        templateName: templates.find(t => t.id === selectedTemplate)?.name || 'N/A',
        subdomain: subdomain,
        is_published: false,
        custom_domain: 'N/A',
      }]);

      showToast(`Sito per ${orgName} creato con successo!`, 'success');
      // Reset form
      setSelectedOrg('');
      setSelectedTemplate('');
      setSubdomain('');

    } catch (error: any) {
      console.error('Failed to create site:', error);
      showToast(`Errore: ${error.message}. Ricorda di impostare i permessi 'create' per il ruolo Public e per il token API in Strapi.`, 'error');
    }
  };
  
  const handleOrgChange = (orgId: string) => {
    setSelectedOrg(orgId);
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      const suggestedSubdomain = org.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')   // Rimuove caratteri non validi (NO trattini iniziali)
        .replace(/\s+/g, '')            // Rimuove spazi (tutto attaccato)
        .replace(/^-|-$/g, '');         // Rimuove trattini all'inizio e fine
      setSubdomain(suggestedSubdomain);
    }
  };

  const handleTogglePublish = async (siteId: number, currentStatus: boolean, siteName: string) => {
    const action = currentStatus ? 'sospendere' : 'pubblicare';
    const confirmMessage = `Sei sicuro di voler ${action} il sito "${siteName}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      const response = await fetch(`${strapiUrl}/api/organization-websites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${strapiToken}`,
        },
        body: JSON.stringify({
          data: {
            is_published: !currentStatus
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento dello stato');
      }

      // Update UI
      setWebsites(prev => prev.map(site =>
        site.id === siteId
          ? { ...site, is_published: !currentStatus }
          : site
      ));

      alert(`✅ Sito ${!currentStatus ? 'pubblicato' : 'sospeso'} con successo!`);
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('❌ Errore nell\'aggiornamento dello stato del sito.');
    }
  };

  const handleEditSite = (siteId: number, subdomain: string) => {
    alert(`🚧 Funzionalità in sviluppo!\n\nProssimamente potrai modificare:\n- Contenuti del sito\n- Immagini\n- Menu/prodotti\n- Informazioni contatti\n\nPer ora il sito è visualizzabile su:\nhttp://localhost:5173/sites/${subdomain}`);
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
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

      const response = await fetch(`${strapiUrl}/api/organization-websites/${siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${strapiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del sito');
      }

      // Update UI
      setWebsites(prev => prev.filter(site => site.id !== siteId));

      alert('✅ Sito eliminato con successo!');
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('❌ Errore nell\'eliminazione del sito.');
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
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="" disabled>Seleziona un template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Subdomain Input */}
          <div className="wm-form-group">
            <label htmlFor="subdomain-input">
              <LinkIcon size={16} />
              Sottodominio
            </label>
            <div className="wm-subdomain-wrapper">
              <input
                id="subdomain-input"
                type="text"
                className="wm-input"
                placeholder="es. pizzerianapoli"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
              />
              <span className="wm-subdomain-suffix">.omnilypro.com</span>
            </div>
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
                      <th>Subdomain</th>
                      <th>Template</th>
                      <th>Stato</th>
                      <th>Dominio Custom</th>
                      <th style={{ textAlign: 'center' }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websites.map((site) => (
                      <tr key={site.id}>
                        <td>{site.orgName}</td>
                        <td>
                            <a href={`http://${site.subdomain}.omnilypro.com`} target="_blank" rel="noopener noreferrer" className="wm-subdomain-link">
                                {site.subdomain}.omnilypro.com
                            </a>
                        </td>
                        <td>{site.templateName}</td>
                        <td>
                            <div className={`wm-status-badge ${site.is_published ? 'published' : 'draft'}`}>
                                {site.is_published ? 'Pubblicato' : 'Bozza'}
                            </div>
                        </td>
                        <td>{site.custom_domain || 'N/A'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="actions-cell">
                            <button
                              className="action-button-circle"
                              title="Pubblica/Sospendi"
                              onClick={() => handleTogglePublish(site.id, site.is_published, site.orgName)}
                            >
                                {site.is_published ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                            </button>
                            <button
                              className="action-button-circle"
                              title="Modifica"
                              onClick={() => handleEditSite(site.id, site.subdomain)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-button-circle"
                              title="Elimina"
                              onClick={() => handleDeleteSite(site.id, site.orgName)}
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
    </div>
  );
};

export default WebsiteManager;
