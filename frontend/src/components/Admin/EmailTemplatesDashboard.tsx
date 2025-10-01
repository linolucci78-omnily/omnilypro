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
  AlignCenter
} from 'lucide-react'
import './AdminDashboard.css'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  category: string
  html_content: string
  text_content: string
  variables: string[]
  created_at: string
  updated_at: string
  created_by: string
  usage_count: number
  last_used: string
  is_active: boolean
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
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'preview'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editorContent, setEditorContent] = useState('')
  const [editorSubject, setEditorSubject] = useState('')

  // Mock data
  const mockCategories: TemplateCategory[] = [
    { id: '1', name: 'Welcome', description: 'Template di benvenuto per nuovi utenti', template_count: 5 },
    { id: '2', name: 'Billing', description: 'Template per fatturazione e pagamenti', template_count: 8 },
    { id: '3', name: 'Marketing', description: 'Template per campagne marketing', template_count: 12 },
    { id: '4', name: 'Support', description: 'Template per supporto clienti', template_count: 6 },
    { id: '5', name: 'System', description: 'Template per notifiche di sistema', template_count: 4 }
  ]

  const mockTemplates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Benvenuto Nuovo Business Owner',
      subject: 'Benvenuto in OMNILY Pro, {{business_name}}!',
      description: 'Email di benvenuto per nuovi business owner che si registrano',
      category: 'Welcome',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">Benvenuto in OMNILY Pro!</h1>
          <p>Ciao <strong>{{owner_name}}</strong>,</p>
          <p>Siamo entusiasti di dare il benvenuto a <strong>{{business_name}}</strong> nella famiglia OMNILY Pro!</p>
          <p>Il tuo account è stato attivato e puoi iniziare subito a configurare il tuo loyalty program.</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>I tuoi prossimi passi:</h3>
            <ul>
              <li>Configura le tue prime ricompense</li>
              <li>Personalizza il tuo programma fedeltà</li>
              <li>Invita i tuoi primi clienti</li>
            </ul>
          </div>
          <a href="{{dashboard_url}}" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Inizia Subito</a>
        </div>
      `,
      text_content: 'Benvenuto in OMNILY Pro! Il tuo account {{business_name}} è stato attivato.',
      variables: ['owner_name', 'business_name', 'dashboard_url'],
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-15T14:30:00Z',
      created_by: 'Admin',
      usage_count: 156,
      last_used: '2025-01-15T09:30:00Z',
      is_active: true,
      preview_data: {
        owner_name: 'Mario Rossi',
        business_name: 'Caffè del Centro',
        dashboard_url: 'https://app.omnily.com/dashboard'
      }
    },
    {
      id: '2',
      name: 'Promemoria Pagamento',
      subject: 'Promemoria: Fattura {{invoice_number}} in scadenza',
      description: 'Promemoria per fatture in scadenza',
      category: 'Billing',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f56565;">Promemoria Pagamento</h2>
          <p>Gentile <strong>{{customer_name}}</strong>,</p>
          <p>Ti ricordiamo che la fattura <strong>{{invoice_number}}</strong> di <strong>€{{amount}}</strong> scade il <strong>{{due_date}}</strong>.</p>
          <div style="background: #fed7d7; border: 1px solid #f56565; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>Dettagli Fattura:</strong><br>
            Numero: {{invoice_number}}<br>
            Importo: €{{amount}}<br>
            Scadenza: {{due_date}}
          </div>
          <a href="{{payment_url}}" style="background: #f56565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Paga Ora</a>
        </div>
      `,
      text_content: 'Promemoria: La fattura {{invoice_number}} di €{{amount}} scade il {{due_date}}.',
      variables: ['customer_name', 'invoice_number', 'amount', 'due_date', 'payment_url'],
      created_at: '2025-01-08T15:20:00Z',
      updated_at: '2025-01-12T11:45:00Z',
      created_by: 'System',
      usage_count: 89,
      last_used: '2025-01-15T08:15:00Z',
      is_active: true,
      preview_data: {
        customer_name: 'Luca Bianchi',
        invoice_number: 'INV-2025-001',
        amount: '99.00',
        due_date: '25 Gennaio 2025',
        payment_url: 'https://pay.omnily.com/inv-001'
      }
    },
    {
      id: '3',
      name: 'Campagna Sconti Natale',
      subject: '🎄 Offerta Speciale Natale: 30% di sconto!',
      description: 'Template per campagne marketing stagionali',
      category: 'Marketing',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
          <h1 style="text-align: center;">🎄 Offerta Speciale Natale!</h1>
          <p style="font-size: 18px; text-align: center;">Ciao {{customer_name}},</p>
          <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; text-align: center; margin: 20px 0;">
            <h2 style="font-size: 36px; margin: 0;">30% DI SCONTO</h2>
            <p style="font-size: 20px;">Su tutti i prodotti fino al 31 Dicembre!</p>
            <p style="background: #ffd700; color: #333; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold;">Codice: {{discount_code}}</p>
          </div>
          <a href="{{shop_url}}" style="background: #ffd700; color: #333; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: block; text-align: center; font-weight: bold; margin: 20px 0;">ACQUISTA ORA</a>
        </div>
      `,
      text_content: 'Offerta Speciale Natale! 30% di sconto con il codice {{discount_code}}',
      variables: ['customer_name', 'discount_code', 'shop_url'],
      created_at: '2024-12-01T10:00:00Z',
      updated_at: '2024-12-15T16:30:00Z',
      created_by: 'Marketing Team',
      usage_count: 2340,
      last_used: '2024-12-24T18:00:00Z',
      is_active: false,
      preview_data: {
        customer_name: 'Anna Verdi',
        discount_code: 'NATALE30',
        shop_url: 'https://shop.example.com'
      }
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setTemplates(mockTemplates)
      setCategories(mockCategories)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditorContent(template.html_content)
    setEditorSubject(template.subject)
    setActiveTab('editor')
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('preview')
  }

  const renderPreview = (template: EmailTemplate) => {
    let content = template.html_content
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
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-title">
              <Mail size={32} />
              <div>
                <h1>Email Templates</h1>
                <p>Caricamento sistema email...</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loading-spinner">Caricamento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
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
      </div>

      {activeTab === 'list' && (
        <>
          {/* Category Stats */}
          <div className="dashboard-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem',
            padding: '0'
          }}>
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
            <div className="templates-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1rem'
            }}>
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <div className="template-info">
                      <h3>{template.name}</h3>
                      <span className="template-category">{template.category}</span>
                    </div>
                    <div className="template-status">
                      <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
                        {template.is_active ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                  </div>

                  <div className="template-content">
                    <div className="template-subject">
                      <strong>Oggetto:</strong> {template.subject}
                    </div>
                    <p className="template-description">{template.description}</p>

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

                    <div className="template-stats">
                      <div className="stat">
                        <Zap size={14} />
                        <span>Utilizzato {template.usage_count} volte</span>
                      </div>
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
                    <button className="btn-icon" title="Duplica">
                      <Copy size={16} />
                    </button>
                    <button className="btn-icon" title="Invia Test">
                      <Send size={16} />
                    </button>
                    <button className="btn-icon danger" title="Elimina">
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
        <div className="dashboard-section">
          <div className="editor-container">
            <div className="editor-toolbar">
              <div className="toolbar-group">
                <button className="toolbar-btn">
                  <Bold size={16} />
                </button>
                <button className="toolbar-btn">
                  <Italic size={16} />
                </button>
                <button className="toolbar-btn">
                  <List size={16} />
                </button>
              </div>
              <div className="toolbar-group">
                <button className="toolbar-btn">
                  <AlignLeft size={16} />
                </button>
                <button className="toolbar-btn">
                  <AlignCenter size={16} />
                </button>
              </div>
              <div className="toolbar-group">
                <button className="toolbar-btn">
                  <Image size={16} />
                </button>
                <button className="toolbar-btn">
                  <Link size={16} />
                </button>
              </div>
              <div className="toolbar-group">
                <button className="btn-primary">
                  <Save size={16} />
                  Salva
                </button>
              </div>
            </div>

            <div className="editor-form">
              <div className="form-group">
                <label>Oggetto Email</label>
                <input
                  type="text"
                  value={editorSubject}
                  onChange={(e) => setEditorSubject(e.target.value)}
                  className="form-input"
                  placeholder="Inserisci oggetto email..."
                />
              </div>

              <div className="form-group">
                <label>Contenuto HTML</label>
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="form-textarea"
                  rows={20}
                  placeholder="Inserisci contenuto HTML..."
                />
              </div>

              <div className="editor-sidebar">
                <h4>Variabili Disponibili</h4>
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable} className="variable-item">
                    <code>{`{{${variable}}}`}</code>
                    <button className="btn-icon" title="Inserisci">
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
    </div>
  )
}

export default EmailTemplatesDashboard