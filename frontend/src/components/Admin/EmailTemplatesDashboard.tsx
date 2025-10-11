import React, { useState, useEffect } from 'react'
import {
  Mail,
  Edit,
  Eye,
  Copy,
  Trash2,
  Plus,
  Save,
  Send,
  Settings,
  Code,
  Palette,
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  MessageSquare,
  Image,
  Link,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  Database,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import PageLoader from '../UI/PageLoader'
import EmailSettingsManager from './EmailSettingsManager'
import EmailLogsViewer from './EmailLogsViewer'
import EmailEditor from './EmailEditor'
import './AdminLayout.css'
import { supabase } from '../../lib/supabase'

interface EmailTemplate {
  id: string
  organization_id: string | null
  template_type: string
  name: string
  subject: string
  html_body: string
  text_body: string | null
  variables: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Colonne opzionali aggiunte con migration
  allowed_plans?: string[]
  description?: string
  usage_count?: number
  last_used?: string | null
  created_by?: string
  preview_data?: Record<string, string>
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  template_count: number
}

const EmailTemplatesDashboard: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'preview' | 'settings' | 'logs'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editorContent, setEditorContent] = useState('')
  const [editorSubject, setEditorSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Ref per accedere all'istanza dell'editor
  const editorInstanceRef = React.useRef<any>(null)

  // Carica template dal database
  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .is('organization_id', null) // Solo template globali (admin)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTemplates(data || [])

      // Calcola categorie dinamicamente dai template_type
      const typeCounts: Record<string, number> = {}
      data?.forEach(t => {
        typeCounts[t.template_type] = (typeCounts[t.template_type] || 0) + 1
      })

      const dynamicCategories: TemplateCategory[] = Object.entries(typeCounts).map(([type, count]) => ({
        id: type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        description: `Template di tipo ${type}`,
        template_count: count
      }))

      setCategories(dynamicCategories)
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dei template')
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Crea nuovo template
  const createTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      setSaving(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from('email_templates')
        .insert([{
          organization_id: null, // Template globale
          template_type: template.template_type || 'custom',
          name: template.name,
          subject: template.subject,
          html_body: template.html_body,
          text_body: template.text_body,
          variables: template.variables || [],
          is_active: template.is_active ?? true,
          allowed_plans: template.allowed_plans || ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
          description: template.description || '',
          created_by: 'Admin'
        }])
        .select()
        .single()

      if (insertError) throw insertError

      await loadTemplates()
      setSuccess('Template creato con successo!')
      setShowCreateModal(false)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Errore nella creazione del template')
      console.error('Error creating template:', err)
    } finally {
      setSaving(false)
    }
  }

  // Aggiorna template
  const updateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      await loadTemplates()
      setSuccess('Template aggiornato con successo!')

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Errore nell\'aggiornamento del template')
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  // Elimina template
  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo template?')) return

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await loadTemplates()
      setSuccess('Template eliminato con successo!')

      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null)
        setActiveTab('list')
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Errore nell\'eliminazione del template')
      console.error('Error deleting template:', err)
    }
  }

  // Duplica template
  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      setSaving(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from('email_templates')
        .insert([{
          organization_id: null,
          template_type: template.template_type,
          name: `${template.name} (Copia)`,
          subject: template.subject,
          html_body: template.html_body,
          text_body: template.text_body,
          variables: template.variables,
          is_active: false, // Inattivo per default quando duplicato
          allowed_plans: template.allowed_plans || ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
          description: template.description || '',
          created_by: 'Admin'
        }])
        .select()
        .single()

      if (insertError) throw insertError

      await loadTemplates()
      setSuccess('Template duplicato con successo!')

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Errore nella duplicazione del template')
      console.error('Error duplicating template:', err)
    } finally {
      setSaving(false)
    }
  }

  // Toggle attivo/inattivo
  const toggleTemplateActive = async (template: EmailTemplate) => {
    await updateTemplate(template.id, { is_active: !template.is_active })
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditorContent(template.html_body)
    setEditorSubject(template.subject)
    setActiveTab('editor')
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('preview')
  }

  const handleSaveTemplate = async (htmlFromEditor?: string) => {
    if (!selectedTemplate) return

    // Estrai HTML dall'editor tramite ref
    let currentHtml = htmlFromEditor
    if (!currentHtml && editorInstanceRef.current) {
      try {
        const editor = editorInstanceRef.current
        currentHtml = editor.getHtml?.() || editor.editor?.getHtml?.() || editorContent
      } catch (e) {
        currentHtml = editorContent
      }
    }
    if (!currentHtml) {
      currentHtml = editorContent
    }

    // Assicurati che sia una stringa
    if (typeof currentHtml !== 'string') {
      currentHtml = String(currentHtml || '')
    }

    await updateTemplate(selectedTemplate.id, {
      subject: editorSubject,
      html_body: currentHtml
    })
  }

  const renderPreview = (template: EmailTemplate) => {
    let content = template.html_body
    let subject = template.subject

    // Replace variables with preview data
    if (template.preview_data) {
      Object.entries(template.preview_data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        content = content.replace(regex, value)
        subject = subject.replace(regex, value)
      })
    }

    return { content, subject }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return <PageLoader message="Caricamento sistema email..." size="medium" />
  }

  return (
    <div className="admin-dashboard">
      {/* Success/Error Messages */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <Check size={20} />
          {success}
        </div>
      )}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Mail size={32} />
            <div>
              <h1>Email Templates</h1>
              <p>Sistema di gestione template email - {templates.length} template</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <Upload size={16} />
              Importa
            </button>
            <button className="btn-secondary">
              <Download size={16} />
              Esporta
            </button>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Nuovo Template
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FileText size={16} />
          Lista Template
        </button>
        {selectedTemplate && (
          <>
            <button
              className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <Edit size={16} />
              Editor
            </button>
            <button
              className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={16} />
              Anteprima
            </button>
          </>
        )}
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          Impostazioni
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Database size={16} />
          Log Email
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Category Stats */}
          <div className="dashboard-stats">
            {categories.map((category) => (
              <div key={category.id} className="stat-card">
                <div className="stat-icon primary">
                  <MessageSquare size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{category.template_count}</div>
                  <div className="stat-label">{category.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="dashboard-section">
            <div className="section-toolbar">
              <div className="toolbar-filters">
                <div className="search-input">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Cerca template..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="all">Tutte le Categorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                <button className="btn-secondary">
                  <Filter size={16} />
                  Più Filtri
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="templates-grid">
              {templates
                .filter(t =>
                  (searchTerm === '' ||
                   t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   t.subject.toLowerCase().includes(searchTerm.toLowerCase())) &&
                  (selectedCategory === 'all' || t.template_type === selectedCategory.toLowerCase())
                )
                .map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <div className="template-info">
                      <h3>{template.name}</h3>
                      <span className="template-category">{template.template_type}</span>
                    </div>
                    <div className="template-status">
                      <span
                        className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleTemplateActive(template)}
                        title="Clicca per attivare/disattivare"
                      >
                        {template.is_active ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                  </div>

                  <div className="template-content">
                    <div className="template-subject">
                      <strong>Oggetto:</strong> {template.subject}
                    </div>
                    {template.description && (
                      <p className="template-description">{template.description}</p>
                    )}

                    {template.variables && template.variables.length > 0 && (
                      <div className="template-variables">
                        <strong>Variabili:</strong>
                        <div className="variables-list">
                          {template.variables.slice(0, 3).map((variable) => (
                            <span key={variable} className="variable-tag">
                              {`{{${variable}}}`}
                            </span>
                          ))}
                          {template.variables.length > 3 && (
                            <span className="variable-tag more">
                              +{template.variables.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {template.allowed_plans && (
                      <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                        <strong>Piani:</strong> {template.allowed_plans.join(', ')}
                      </div>
                    )}

                    <div className="template-stats">
                      {template.usage_count !== undefined && (
                        <div className="stat">
                          <Zap size={14} />
                          <span>Utilizzato {template.usage_count} volte</span>
                        </div>
                      )}
                      <div className="stat">
                        <Calendar size={14} />
                        <span>Aggiornato {formatDate(template.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="template-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handlePreviewTemplate(template)}
                      title="Anteprima"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditTemplate(template)}
                      title="Modifica"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Duplica"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy size={16} />
                    </button>
                    <button className="btn-icon" title="Invia Test">
                      <Send size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Elimina"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'editor' && selectedTemplate && (
        <div style={{
          width: '100%',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          margin: 0
        }}>
          {/* Header con azioni - compatto */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  {selectedTemplate.name}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  {selectedTemplate.template_type}
                </p>
              </div>
              <input
                type="text"
                value={editorSubject}
                onChange={(e) => setEditorSubject(e.target.value)}
                placeholder="Oggetto Email"
                style={{
                  flex: 1,
                  maxWidth: '400px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                onClick={() => handlePreviewTemplate(selectedTemplate)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <Eye size={16} />
                Anteprima
              </button>
              <button
                className="btn-primary"
                onClick={() => handleSaveTemplate()}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <Save size={16} />
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>

          {/* Editor GrapeJS - full width */}
          <div style={{ flex: 1, overflow: 'hidden', background: '#f8fafc' }}>
            <EmailEditor
              html={editorContent}
              onChange={(html) => setEditorContent(html)}
              onSave={(html) => handleSaveTemplate(html)}
              onEditorReady={(editor) => {
                editorInstanceRef.current = editor
              }}
              variables={selectedTemplate.variables || []}
            />
          </div>
        </div>
      )}

      {activeTab === 'preview' && selectedTemplate && (
        <div className="dashboard-section">
          <div className="preview-container">
            <div className="preview-toolbar">
              <div className="preview-info">
                <h3>Anteprima: {selectedTemplate.name}</h3>
                <span>Oggetto: {renderPreview(selectedTemplate).subject}</span>
              </div>
              <div className="preview-actions">
                <button className="btn-secondary">
                  <Send size={16} />
                  Invia Test
                </button>
                <button className="btn-primary">
                  <Edit size={16} />
                  Modifica Template
                </button>
              </div>
            </div>

            <div className="preview-frame">
              <div
                className="email-preview"
                dangerouslySetInnerHTML={{
                  __html: renderPreview(selectedTemplate).content
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="dashboard-section">
          <EmailSettingsManager />
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="dashboard-section">
          <EmailLogsViewer />
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Crea Nuovo Template</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: '#6b7280'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <CreateTemplateForm
              onSubmit={createTemplate}
              onCancel={() => setShowCreateModal(false)}
              saving={saving}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Form per creare nuovo template
const CreateTemplateForm: React.FC<{
  onSubmit: (template: Partial<EmailTemplate>) => void
  onCancel: () => void
  saving: boolean
}> = ({ onSubmit, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    template_type: 'custom',
    name: '',
    subject: '',
    description: '',
    html_body: '',
    text_body: '',
    variables: '',
    allowed_plans: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    is_active: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const variablesArray = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)

    onSubmit({
      ...formData,
      variables: variablesArray
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tipo Template</label>
        <select
          value={formData.template_type}
          onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
          className="form-select"
          required
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
        >
          <option value="custom">Custom</option>
          <option value="receipt">Receipt</option>
          <option value="birthday">Birthday</option>
          <option value="promo">Promo</option>
          <option value="welcome">Welcome</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nome Template *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="form-input"
          required
          placeholder="Es: Scontrino Digitale"
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Oggetto Email *</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="form-input"
          required
          placeholder="Es: Grazie per il tuo acquisto - {{store_name}}"
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Descrizione</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="form-input"
          placeholder="Breve descrizione del template"
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Contenuto HTML *</label>
        <textarea
          value={formData.html_body}
          onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
          className="form-textarea"
          required
          rows={10}
          placeholder="<div>Contenuto HTML dell'email...</div>"
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: '14px' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Variabili (separate da virgola)</label>
        <input
          type="text"
          value={formData.variables}
          onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
          className="form-input"
          placeholder="store_name, customer_name, total"
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
        />
        <small style={{ color: '#6b7280', fontSize: '12px' }}>Es: store_name, customer_name, total</small>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Piani Consentiti</label>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map(plan => (
            <label key={plan} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={formData.allowed_plans.includes(plan)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, allowed_plans: [...formData.allowed_plans, plan] })
                  } else {
                    setFormData({ ...formData, allowed_plans: formData.allowed_plans.filter(p => p !== plan) })
                  }
                }}
              />
              {plan}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <span style={{ fontWeight: '600' }}>Template Attivo</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          style={{ padding: '10px 20px' }}
        >
          Annulla
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
          style={{ padding: '10px 20px' }}
        >
          {saving ? 'Creazione...' : 'Crea Template'}
        </button>
      </div>
    </form>
  )
}

export default EmailTemplatesDashboard