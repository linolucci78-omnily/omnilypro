/**
 * Edit Organization Modal
 *
 * Modal for super admin to edit organization details
 * Includes: basic info, plan settings, branding, and contact info
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CreditCard,
  Palette,
  Phone,
  Mail,
  Globe,
  MapPin,
  Save,
  AlertCircle
} from 'lucide-react';
import type { Organization } from '../lib/supabase';
import './EditOrganizationModal.css';

interface EditOrganizationModalProps {
  isOpen: boolean;
  organization: Organization | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<Organization>) => Promise<void>;
}

type TabType = 'basic' | 'plan' | 'branding' | 'contact';

const PLAN_TYPES = ['free', 'starter', 'professional', 'enterprise', 'custom'];

const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({
  isOpen,
  organization,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<Partial<Organization>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
        email: organization.email,
        phone: organization.phone,
        website: organization.website,
        address: organization.address,
        plan_type: organization.plan_type,
        plan_status: organization.plan_status,
        max_customers: organization.max_customers,
        max_workflows: organization.max_workflows,
        primary_color: organization.primary_color,
        secondary_color: organization.secondary_color,
        is_active: organization.is_active,
        pos_enabled: organization.pos_enabled,
        pos_model: organization.pos_model
      });
    }
  }, [organization]);

  const handleChange = (field: keyof Organization, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!organization) return;

    try {
      setIsSaving(true);
      setError(null);
      await onSave(organization.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <>
      <div className="edit-org-overlay" onClick={onClose} />

      <div className="edit-org-modal">
        {/* Header */}
        <div className="edit-org-header">
          <div className="edit-org-header-content">
            <Building2 size={24} />
            <div>
              <h2>Modifica Azienda</h2>
              <p>{organization.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="edit-org-close-btn" disabled={isSaving}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="edit-org-tabs">
          <button
            className={`edit-org-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <Building2 size={18} />
            Informazioni Base
          </button>
          <button
            className={`edit-org-tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            <CreditCard size={18} />
            Piano & Limiti
          </button>
          <button
            className={`edit-org-tab ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            <Palette size={18} />
            Branding
          </button>
          <button
            className={`edit-org-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <Phone size={18} />
            Contatti
          </button>
        </div>

        {/* Content */}
        <div className="edit-org-content">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="edit-org-tab-content">
              <div className="form-group">
                <label className="form-label">Nome Azienda *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="form-input"
                  disabled={isSaving}
                  placeholder="Es: Pizzeria Da Mario"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug (URL) *</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
                  className="form-input"
                  disabled={isSaving}
                  placeholder="es: pizzeria-da-mario"
                />
                <p className="form-hint">Usato per URL: app.omnily.pro/{formData.slug}</p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    disabled={isSaving}
                  />
                  <span>Azienda Attiva</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.pos_enabled || false}
                    onChange={(e) => handleChange('pos_enabled', e.target.checked)}
                    disabled={isSaving}
                  />
                  <span>POS Abilitato</span>
                </label>
              </div>

              {formData.pos_enabled && (
                <div className="form-group">
                  <label className="form-label">Modello POS</label>
                  <input
                    type="text"
                    value={formData.pos_model || ''}
                    onChange={(e) => handleChange('pos_model', e.target.value)}
                    className="form-input"
                    disabled={isSaving}
                    placeholder="Es: ZCS Printer X1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Plan & Limits Tab */}
          {activeTab === 'plan' && (
            <div className="edit-org-tab-content">
              <div className="form-group">
                <label className="form-label">Tipo Piano *</label>
                <select
                  value={formData.plan_type || 'free'}
                  onChange={(e) => handleChange('plan_type', e.target.value)}
                  className="form-select"
                  disabled={isSaving}
                >
                  {PLAN_TYPES.map(plan => (
                    <option key={plan} value={plan}>
                      {plan.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Stato Piano *</label>
                <select
                  value={formData.plan_status || 'active'}
                  onChange={(e) => handleChange('plan_status', e.target.value)}
                  className="form-select"
                  disabled={isSaving}
                >
                  <option value="trial">Trial</option>
                  <option value="active">Attivo</option>
                  <option value="suspended">Sospeso</option>
                  <option value="cancelled">Cancellato</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Clienti</label>
                  <input
                    type="number"
                    value={formData.max_customers || 0}
                    onChange={(e) => handleChange('max_customers', parseInt(e.target.value))}
                    className="form-input"
                    disabled={isSaving}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Workflows</label>
                  <input
                    type="number"
                    value={formData.max_workflows || 0}
                    onChange={(e) => handleChange('max_workflows', parseInt(e.target.value))}
                    className="form-input"
                    disabled={isSaving}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="edit-org-tab-content">
              <div className="form-group">
                <label className="form-label">Colore Primario</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={formData.primary_color || '#dc2626'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="color-picker"
                    disabled={isSaving}
                  />
                  <input
                    type="text"
                    value={formData.primary_color || '#dc2626'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="form-input"
                    disabled={isSaving}
                    placeholder="#dc2626"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Colore Secondario</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={formData.secondary_color || '#ef4444'}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="color-picker"
                    disabled={isSaving}
                  />
                  <input
                    type="text"
                    value={formData.secondary_color || '#ef4444'}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="form-input"
                    disabled={isSaving}
                    placeholder="#ef4444"
                  />
                </div>
              </div>

              <div className="color-preview-box">
                <div className="color-preview-item">
                  <div
                    className="color-preview-circle"
                    style={{ background: formData.primary_color || '#dc2626' }}
                  />
                  <span>Primario</span>
                </div>
                <div className="color-preview-item">
                  <div
                    className="color-preview-circle"
                    style={{ background: formData.secondary_color || '#ef4444' }}
                  />
                  <span>Secondario</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === 'contact' && (
            <div className="edit-org-tab-content">
              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="form-input"
                  disabled={isSaving}
                  placeholder="info@azienda.it"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} />
                  Telefono
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="form-input"
                  disabled={isSaving}
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Globe size={16} />
                  Sito Web
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="form-input"
                  disabled={isSaving}
                  placeholder="https://www.azienda.it"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={16} />
                  Indirizzo
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="form-textarea"
                  disabled={isSaving}
                  rows={3}
                  placeholder="Via Roma 123, 00100 Roma (RM)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="edit-org-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="edit-org-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSaving}
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditOrganizationModal;
