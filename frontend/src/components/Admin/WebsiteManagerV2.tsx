import React, { useState, useEffect } from 'react';
import {
  Globe,
  Building2,
  Search,
  Plus,
  Trash2,
  Edit2,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Paintbrush,
  Sparkles
} from 'lucide-react';
import PageLoader from '../UI/PageLoader';
import Toast from '../UI/Toast';
import ConfirmModal from '../UI/ConfirmModal';
import OmnilyVisualEditor from './OmnilyVisualEditor';
import { supabase } from '../../lib/supabase';
import { directusClient, type TemplateType } from '../../lib/directus';
import './WebsiteManager.css';

// Template options for Directus with preview images
const availableTemplates: {
  id: TemplateType;
  name: string;
  icon: string;
  description: string;
  preview: string;
  features: string[];
}[] = [
  {
    id: 'restaurant',
    name: 'Ristorante/Pizzeria',
    icon: '🍕',
    description: 'Perfetto per ristoranti, pizzerie e trattorie. Include menu, gallery foto piatti e form prenotazioni.',
    preview: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    features: ['Menu Interattivo', 'Gallery Piatti', 'Form Prenotazioni', 'Mappa Google']
  },
  {
    id: 'salon',
    name: 'Parrucchiere/Salone',
    icon: '💇',
    description: 'Ideale per saloni di bellezza e parrucchieri. Mostra servizi, team e sistema di prenotazione.',
    preview: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    features: ['Listino Servizi', 'Team', 'Prenotazioni Online', 'Gallery Lavori']
  },
  {
    id: 'gym',
    name: 'Palestra/Centro Fitness',
    icon: '💪',
    description: 'Dedicato a palestre e centri fitness. Include corsi, orari, trainer e abbonamenti.',
    preview: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    features: ['Corsi e Orari', 'Staff Trainer', 'Piani Abbonamento', 'Gallery Palestra']
  },
  {
    id: 'bakery',
    name: 'Panetteria/Pasticceria',
    icon: '🥖',
    description: 'Per panetterie, pasticcerie e forni. Vetrina prodotti, specialità del giorno e contatti.',
    preview: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
    features: ['Vetrina Prodotti', 'Specialità del Giorno', 'Ordini Online', 'Storia Tradizione']
  },
  {
    id: 'shop',
    name: 'Negozio/Shop',
    icon: '🏪',
    description: 'Versatile per negozi e attività commerciali. Catalogo prodotti, offerte e info contatti.',
    preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    features: ['Catalogo Prodotti', 'Offerte Speciali', 'Info Negozio', 'Social Links']
  },
  {
    id: 'generic',
    name: 'Generico',
    icon: '🌐',
    description: 'Template base versatile adattabile a qualsiasi tipo di attività. Parti da zero!',
    preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
    features: ['Hero Section', 'Features', 'Chi Siamo', 'Contatti']
  },
];

/**
 * 🎨 WEBSITE MANAGER V2
 *
 * NUOVO gestore siti che usa OmnilyVisualEditor (Craft.js)
 * Il VECCHIO WebsiteManager.tsx resta come backup
 */
const WebsiteManagerV2: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);

  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | ''>('');
  const [siteName, setSiteName] = useState('');
  const [editingWebsite, setEditingWebsite] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [creatingWebsite, setCreatingWebsite] = useState(false);

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
    setToast(prev => ({ ...prev, isOpen: false }));
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
    fetchData();
  }, []);

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
      showToast('Errore nel caricamento dei dati', 'error');
      setOrganizations([]);
      setWebsites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async (templateId: TemplateType) => {
    if (!selectedOrg || !siteName.trim()) {
      showToast('⚠️ Compila tutti i campi per creare il sito', 'warning');
      return;
    }

    setCreatingWebsite(true);

    try {
      console.log('🎨 Creating website with template:', {
        org: selectedOrg,
        template: templateId,
        name: siteName
      });

      // Create website from template using Directus
      const website = await directusClient.createWebsiteFromTemplate(
        selectedOrg,
        siteName,
        templateId
      );

      showToast('✅ Sito creato! Apertura editor...', 'success');

      // Reset form and gallery state
      setShowTemplateGallery(false);
      setSelectedOrg('');
      setSelectedTemplate('');
      setSiteName('');

      // Refresh list in background
      fetchData();

      // Open editor immediately (questo apre il Visual Editor)
      setTimeout(() => {
        setEditingWebsite(website.id);
        setCreatingWebsite(false);
      }, 500);

    } catch (error: any) {
      console.error('Error creating website:', error);
      showToast('❌ Errore nella creazione del sito: ' + error.message, 'error');
      setCreatingWebsite(false);
    }
  };

  const handleTogglePublish = async (websiteId: number, currentStatus: boolean, siteName: string) => {
    showConfirm(
      currentStatus ? '🔒 Sospendi Sito' : '🚀 Pubblica Sito',
      currentStatus
        ? `Vuoi sospendere "${siteName}"? Il sito non sarà più accessibile pubblicamente.`
        : `Vuoi pubblicare "${siteName}"? Il sito sarà accessibile pubblicamente.`,
      async () => {
        try {
          await directusClient.togglePublish(websiteId, !currentStatus);
          showToast(
            currentStatus ? '✅ Sito sospeso' : '✅ Sito pubblicato!',
            'success'
          );
          await fetchData();
        } catch (error: any) {
          showToast('❌ Errore: ' + error.message, 'error');
        }
        closeConfirm();
      },
      currentStatus ? 'warning' : 'info',
      currentStatus ? 'Sospendi' : 'Pubblica'
    );
  };

  const handleDeleteSite = async (siteId: number, siteName: string) => {
    showConfirm(
      '🗑️ Elimina Sito',
      `Sei sicuro di voler eliminare "${siteName}"? Questa azione è irreversibile.`,
      async () => {
        try {
          await directusClient.deleteWebsite(siteId);
          showToast('✅ Sito eliminato con successo', 'success');
          await fetchData();
        } catch (error: any) {
          showToast('❌ Errore: ' + error.message, 'error');
        }
        closeConfirm();
      },
      'danger',
      'Elimina'
    );
  };

  // Filter websites by search query
  const filteredWebsites = websites.filter(site =>
    site.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.orgName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <PageLoader />;
  }

  // Show editor if editing
  if (editingWebsite) {
    return (
      <OmnilyVisualEditor
        websiteId={editingWebsite}
        onClose={() => setEditingWebsite(null)}
        onSave={async () => {
          showToast('✅ Sito salvato!', 'success');
          await fetchData();
        }}
      />
    );
  }

  return (
    <div className="website-manager-dashboard">
      {/* HEADER */}
      <div className="wm-header">
        <div>
          <h1 className="wm-title">
            <Sparkles size={40} />
            Omnily Website Builder V2
          </h1>
          <p className="wm-subtitle">
            Sistema professionale con Craft.js Editor - Crea e gestisci siti web vetrina
          </p>
        </div>
      </div>

        {/* CREATE NEW WEBSITE CARD */}
        <div className="wm-card">
          <h2 className="wm-card-title">Crea un Nuovo Sito Web</h2>

          {!showTemplateGallery ? (
            <>
              <div className="wm-form-grid">
                {/* Organization Select */}
                <div className="wm-form-group">
                  <label>
                    <Building2 size={16} />
                    Organizzazione
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="wm-select"
                  >
                    <option value="">Seleziona un'organizzazione</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                {/* Site Name Input */}
                <div className="wm-form-group">
                  <label>
                    <LinkIcon size={16} />
                    Nome Sito
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="es. Pizzeria Napoli"
                    className="wm-input"
                  />
                </div>
              </div>

              <div className="wm-card-footer">
                <button
                  onClick={() => setShowTemplateGallery(true)}
                  disabled={!selectedOrg || !siteName.trim()}
                  className="wm-btn wm-btn-primary"
                  style={{ width: '100%', fontSize: '16px', padding: '14px' }}
                >
                  <Paintbrush size={20} />
                  Scegli Template →
                </button>
              </div>
            </>
          ) : (
            <>
              {/* TEMPLATE GALLERY */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                {/* Loading Overlay */}
                {creatingWebsite && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      border: '4px solid #e5e7eb',
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                      Creazione sito in corso...
                    </p>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      Apertura editor tra poco!
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Scegli il Template per "{siteName}"
                  </h3>
                  <button
                    onClick={() => setShowTemplateGallery(false)}
                    className="wm-btn"
                    style={{ padding: '8px 16px' }}
                    disabled={creatingWebsite}
                  >
                    ← Indietro
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                  marginTop: '20px'
                }}>
                  {availableTemplates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => {
                        if (!creatingWebsite) {
                          handleCreateSite(template.id);
                        }
                      }}
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: creatingWebsite ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        opacity: creatingWebsite ? 0.6 : 1,
                        pointerEvents: creatingWebsite ? 'none' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (!creatingWebsite) {
                          e.currentTarget.style.transform = 'translateY(-8px)';
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!creatingWebsite) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }
                      }}
                    >
                      {/* Preview Image */}
                      <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                        <img
                          src={template.preview}
                          alt={template.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          fontSize: '32px',
                          background: 'rgba(255,255,255,0.9)',
                          borderRadius: '50%',
                          width: '50px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {template.icon}
                        </div>
                      </div>

                      {/* Template Info */}
                      <div style={{ padding: '20px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
                          {template.name}
                        </h4>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
                          {template.description}
                        </p>

                        {/* Features */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {template.features.map((feature, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '12px',
                                padding: '4px 10px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '6px',
                                color: '#4b5563',
                                fontWeight: '500'
                              }}
                            >
                              ✓ {feature}
                            </span>
                          ))}
                        </div>

                        {/* CTA */}
                        <button
                          style={{
                            width: '100%',
                            marginTop: '16px',
                            padding: '12px',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }}
                        >
                          Usa Questo Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* WEBSITES LIST */}
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
                  {filteredWebsites.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                        <Globe size={64} style={{ opacity: 0.3, margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Nessun sito trovato</p>
                      </td>
                    </tr>
                  ) : (
                    filteredWebsites.map((site) => (
                      <tr key={site.id}>
                        <td>{site.orgName}</td>
                        <td>{site.site_name}</td>
                        <td>
                          {site.is_published ? (
                            <span className="wm-status-badge published">Pubblicato</span>
                          ) : (
                            <span className="wm-status-badge draft">Bozza</span>
                          )}
                        </td>
                        <td>
                          <span className="wm-subdomain-link">{site.custom_domain}</span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            {/* Toggle Publish */}
                            <button
                              onClick={() => handleTogglePublish(site.id, site.is_published, site.site_name)}
                              className="action-button-circle"
                              title={site.is_published ? 'Sospendi' : 'Pubblica'}
                              style={{
                                backgroundColor: site.is_published ? '#10b981' : '#6b7280',
                                color: 'white'
                              }}
                            >
                              {site.is_published ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>

                            {/* Edit with Omnily Visual Editor */}
                            <button
                              className="action-button-circle"
                              title="Editor Visuale Omnily"
                              onClick={() => setEditingWebsite(site.id)}
                              style={{ backgroundColor: '#3b82f6', color: 'white' }}
                            >
                              <Sparkles size={16} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteSite(site.id, site.site_name)}
                              className="action-button-circle"
                              title="Elimina"
                              style={{ backgroundColor: '#ef4444', color: 'white' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Toast */}
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
      </div>
    );
  };

export default WebsiteManagerV2;
