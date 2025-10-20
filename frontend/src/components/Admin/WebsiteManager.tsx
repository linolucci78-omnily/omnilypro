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
import AdminWebsiteEditor from './AdminWebsiteEditor';
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

  // Editor state
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);

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

        console.log('Strapi Config:', { strapiUrl, hasToken: !!strapiToken });
        console.log('Token first 20 chars:', strapiToken?.substring(0, 20));
        console.log('Token last 20 chars:', strapiToken?.substring(strapiToken.length - 20));

        if (strapiUrl && strapiToken) {
          const templatesResponse = await fetch(`${strapiUrl}/api/website-templates`, {
            headers: {
              'Authorization': `Bearer ${strapiToken}`,
            },
          });
          console.log('Templates Response Status:', templatesResponse.status);
          if (!templatesResponse.ok) {
            const errorText = await templatesResponse.text();
            console.error('Templates fetch failed:', templatesResponse.status, errorText);
            throw new Error(`Failed to fetch templates: ${templatesResponse.status}`);
          }
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
              documentId: site.documentId,  // Strapi 5 uses documentId for updates/deletes
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

  useEffect(() => {
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

      // Default content for new site (example data that can be edited later)
      const defaultContent = {
        nome: orgName,
        hero: {
          title: orgName,
          subtitle: 'La nostra passione, la vostra soddisfazione',
          cta_text: 'Scopri di più',
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop'
        },
        menu: {
          title: 'Il Nostro Menu',
          items: [
            {
              nome: 'Prodotto Esempio 1',
              descrizione: 'Descrizione del prodotto che può essere modificata',
              prezzo: 12.50,
              foto: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'
            },
            {
              nome: 'Prodotto Esempio 2',
              descrizione: 'Un altro prodotto di esempio',
              prezzo: 15.00,
              foto: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop'
            },
            {
              nome: 'Prodotto Esempio 3',
              descrizione: 'Terzo prodotto di esempio',
              prezzo: 18.00,
              foto: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop'
            }
          ]
        },
        gallery: {
          title: 'La Nostra Gallery',
          images: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop'
          ]
        },
        about: {
          title: 'Chi Siamo',
          text: 'La nostra storia inizia con una passione per l\'eccellenza. Siamo impegnati a offrire i migliori prodotti e servizi ai nostri clienti. Questo testo può essere modificato dalla dashboard.'
        },
        contact: {
          phone: '+39 06 1234567',
          email: 'info@esempio.com',
          address: 'Via Esempio 123, Roma'
        }
      };

      const payload = {
        data: {
          organization_id: selectedOrg,
          template: selectedTemplate,
          subdomain: subdomain,
          nome: `Sito di ${orgName}`,
          is_published: false, // Start as draft
          contenuto: defaultContent // Pre-populated with example content
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
        documentId: newSite.data.documentId,
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

  const handleTogglePublish = (site: any) => {
    const action = site.is_published ? 'sospendere' : 'pubblicare';
    const newStatus = !site.is_published;

    showConfirm(
      site.is_published ? 'Sospendi Sito' : 'Pubblica Sito',
      `Sei sicuro di voler ${action} il sito "${site.orgName}"?`,
      async () => {
        try {
          const strapiUrl = import.meta.env.VITE_STRAPI_URL;
          const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

          console.log('🔄 Toggle publish request:', { documentId: site.documentId, newStatus });

          const response = await fetch(`${strapiUrl}/api/organization-websites/${site.documentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${strapiToken}`,
            },
            body: JSON.stringify({
              data: {
                is_published: newStatus
              }
            }),
          });

          console.log('📡 Response status:', response.status);

          if (!response.ok) {
            const errorBody = await response.json();
            console.error('❌ Strapi error:', errorBody);
            throw new Error(`Errore nell'aggiornamento: ${errorBody.error?.message || response.statusText}`);
          }

          // Update UI
          setWebsites(prev => prev.map(s =>
            s.id === site.id
              ? { ...s, is_published: newStatus }
              : s
          ));

          showToast(`Sito ${newStatus ? 'pubblicato' : 'sospeso'} con successo!`, 'success');
          closeConfirm();
        } catch (error: any) {
          console.error('Error toggling publish:', error);
          showToast(error.message || 'Errore nell\'aggiornamento dello stato del sito.', 'error');
          closeConfirm();
        }
      },
      'info',
      action.charAt(0).toUpperCase() + action.slice(1),
      'Annulla'
    );
  };

  const handleEditSite = (documentId: string) => {
    setEditingWebsiteId(documentId);
  };

  const handleCloseEditor = () => {
    setEditingWebsiteId(null);
  };

  const handleSaveEditor = async () => {
    // Reload websites list after save
    await fetchData();
    showToast('Sito aggiornato con successo!', 'success');
    setEditingWebsiteId(null);
  };

  const handleDeleteSite = (site: any) => {
    // First confirmation
    showConfirm(
      'Elimina Sito',
      `Sei sicuro di voler eliminare definitivamente il sito "${site.orgName}"? Questa azione NON può essere annullata!`,
      () => {
        // Close first modal
        closeConfirm();

        // Second confirmation
        setTimeout(() => {
          showConfirm(
            'Conferma Definitiva',
            'Confermi di voler procedere con l\'eliminazione? Questa è l\'ultima conferma.',
            async () => {
              try {
                const strapiUrl = import.meta.env.VITE_STRAPI_URL;
                const strapiToken = import.meta.env.VITE_STRAPI_API_TOKEN;

                console.log('🗑️ Delete request:', { documentId: site.documentId });

                const response = await fetch(`${strapiUrl}/api/organization-websites/${site.documentId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${strapiToken}`,
                  },
                });

                if (!response.ok) {
                  const errorBody = await response.json();
                  console.error('❌ Delete error:', errorBody);
                  throw new Error(`Errore nell'eliminazione: ${errorBody.error?.message || response.statusText}`);
                }

                // Update UI
                setWebsites(prev => prev.filter(s => s.id !== site.id));

                showToast('Sito eliminato con successo!', 'success');
                closeConfirm();
              } catch (error: any) {
                console.error('Error deleting site:', error);
                showToast(error.message || 'Errore nell\'eliminazione del sito.', 'error');
                closeConfirm();
              }
            },
            'danger',
            'Elimina Definitivamente',
            'Annulla'
          );
        }, 300);
      },
      'danger',
      'Procedi',
      'Annulla'
    );
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
                              title={site.is_published ? "Sospendi sito" : "Pubblica sito"}
                              onClick={() => handleTogglePublish(site)}
                            >
                                {site.is_published ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                            </button>
                            <button
                              className="action-button-circle"
                              title="Modifica contenuti"
                              onClick={() => handleEditSite(site.documentId)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-button-circle"
                              title="Elimina sito"
                              onClick={() => handleDeleteSite(site)}
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

      {/* Toast Notification */}
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
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Admin Website Editor Modal */}
      {editingWebsiteId && (
        <AdminWebsiteEditor
          websiteId={editingWebsiteId}
          onClose={handleCloseEditor}
          onSave={handleSaveEditor}
        />
      )}
    </div>
  );
};

export default WebsiteManager;
