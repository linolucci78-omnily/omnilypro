import React, { useState, useEffect } from 'react'
import { Printer, Save, TestTube, Upload, Download, Settings } from 'lucide-react'
import { createPrintService, type PrintConfig } from '../../services/printService'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import ReceiptDemo from './ReceiptDemo'

interface PrintTemplate {
  id?: string
  name: string
  store_name: string
  store_address: string
  store_phone: string
  store_tax: string
  logo_base64?: string
  paper_width: number
  font_size_normal: number
  font_size_large: number
  print_density: number
  organization_id: string
  is_default: boolean
  organizations?: {
    name: string
  }
}

interface PrintTemplateManagerProps {
  organizationId?: string
}

const PrintTemplateManager: React.FC<PrintTemplateManagerProps> = ({ organizationId }) => {
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [sendingToPOS, setSendingToPOS] = useState(false)
  const [currentReceiptData, setCurrentReceiptData] = useState<any>(null)
  const { showSuccess, showError, showWarning } = useToast()

  const [defaultOrgId, setDefaultOrgId] = useState<string>('')

  const defaultTemplate: PrintTemplate = {
    name: 'Template Standard',
    store_name: 'Il Mio Negozio',
    store_address: 'Via Roma 123, 00100 Roma',
    store_phone: 'Tel: 06 1234567',
    store_tax: '12345678901',
    paper_width: 384, // 58mm
    font_size_normal: 24,
    font_size_large: 32,
    print_density: 3,
    organization_id: organizationId || defaultOrgId,
    is_default: true
  }

  const [formData, setFormData] = useState<PrintTemplate>(defaultTemplate)

  useEffect(() => {
    loadTemplates()
    checkUserPermissions()
    loadDevices()
    if (!organizationId) {
      loadOrganizations()
    }
  }, [organizationId])

  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: orgUsers } = await supabase
        .from('organization_users')
        .select('org_id, role, organizations(name)')
        .eq('user_id', user?.id)

      // Imposta la prima organizzazione come default se non è specificata
      if (!organizationId && orgUsers && orgUsers.length > 0) {
        setDefaultOrgId(orgUsers[0].org_id)
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const loadDevices = async () => {
    try {
      let query = supabase
        .from('devices')
        .select('id, name, store_location, status, organization_id, organizations(name)')
        .order('name')

      // If organizationId is provided, filter devices by organization
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query

      if (error) throw error
      setDevices(data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const sendTestPrintToPOS = async (deviceId: string) => {
    if (!selectedTemplate) {
      showWarning('Seleziona un template prima di inviare la stampa')
      return
    }

    if (!currentReceiptData) {
      showWarning('Dati dello scontrino non disponibili')
      return
    }

    setSendingToPOS(true)
    try {
      // Serialize receipt data to ensure Date objects are converted to strings
      const serializedReceiptData = {
        ...currentReceiptData,
        timestamp: currentReceiptData.timestamp instanceof Date
          ? currentReceiptData.timestamp.toISOString()
          : currentReceiptData.timestamp
      }

      console.log('📋 Sending receipt data to POS:', serializedReceiptData)

      const { error } = await supabase
        .from('device_commands')
        .insert({
          device_id: deviceId,
          command_type: 'test_print',
          payload: {
            template: selectedTemplate,
            receiptData: serializedReceiptData
          },
          status: 'pending'
        })

      if (error) throw error

      showSuccess('Comando di stampa inviato al POS')
      setShowDeviceModal(false)
    } catch (error) {
      console.error('Error sending test print to POS:', error)
      showError('Errore durante l\'invio del comando al POS')
    } finally {
      setSendingToPOS(false)
    }
  }

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('print_templates')
        .select('*, organizations(name)')
        .order('is_default', { ascending: false })

      // If organizationId is provided, filter by it
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query

      if (error) throw error

      setTemplates(data || [])
      if (data && data.length > 0) {
        setSelectedTemplate(data[0])
        setFormData(data[0])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      showError('Errore nel caricamento dei template')
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplate = async () => {
    if (!formData.name || !formData.store_name || !formData.organization_id) {
      showWarning('Compila i campi obbligatori (Nome Template, Nome Negozio, Organizzazione)')
      return
    }

    setIsLoading(true)
    try {
      if (formData.id) {
        // Update existing template
        const { error } = await supabase
          .from('print_templates')
          .update({
            name: formData.name,
            store_name: formData.store_name,
            store_address: formData.store_address,
            store_phone: formData.store_phone,
            store_tax: formData.store_tax,
            logo_base64: formData.logo_base64,
            paper_width: formData.paper_width,
            font_size_normal: formData.font_size_normal,
            font_size_large: formData.font_size_large,
            print_density: formData.print_density,
            is_default: formData.is_default
          })
          .eq('id', formData.id)

        if (error) throw error
        showSuccess('Template aggiornato con successo')
      } else {
        // Create new template
        const { error } = await supabase
          .from('print_templates')
          .insert([{
            name: formData.name,
            store_name: formData.store_name,
            store_address: formData.store_address,
            store_phone: formData.store_phone,
            store_tax: formData.store_tax,
            logo_base64: formData.logo_base64,
            paper_width: formData.paper_width,
            font_size_normal: formData.font_size_normal,
            font_size_large: formData.font_size_large,
            print_density: formData.print_density,
            organization_id: formData.organization_id,
            is_default: formData.is_default
          }])
          .select()

        if (error) throw error
        showSuccess('Template creato con successo')
      }

      setIsEditing(false)
      await loadTemplates()
    } catch (error: any) {
      console.error('Error saving template:', error)
      showError(`Errore: ${error?.message || 'Errore nel salvataggio del template'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPrint = async () => {
    console.log('TEST STAMPA CHIAMATO', selectedTemplate ? 'template OK' : 'NESSUN TEMPLATE')

    if (!selectedTemplate) {
      showWarning('Seleziona un template da testare')
      return
    }

    setIsTesting(true)
    try {
      const printConfig: PrintConfig = {
        storeName: selectedTemplate.store_name,
        storeAddress: selectedTemplate.store_address,
        storePhone: selectedTemplate.store_phone,
        storeTax: selectedTemplate.store_tax,
        logoBase64: selectedTemplate.logo_base64,
        paperWidth: selectedTemplate.paper_width,
        fontSizeNormal: selectedTemplate.font_size_normal,
        fontSizeLarge: selectedTemplate.font_size_large,
        printDensity: selectedTemplate.print_density
      }

      const printService = createPrintService(printConfig)
      console.log('PrintService creato, inizializzo...')

      const initialized = await printService.initialize()
      console.log('Stampante inizializzata:', initialized)

      if (!initialized) {
        showError('Impossibile inizializzare la stampante')
        return
      }

      console.log('Invio stampa test...')
      const success = await printService.printTestReceipt()
      console.log('Risultato stampa:', success)

      if (success) {
        showSuccess('Stampa di test completata')
      } else {
        showError('Errore durante la stampa di test')
      }
    } catch (error) {
      console.error('ERRORE Test print:', error)
      showError('Errore durante la stampa di test')
    } finally {
      setIsTesting(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Seleziona un file immagine valido')
      return
    }

    if (file.size > 100 * 1024) { // 100KB limit
      showError('Il file deve essere inferiore a 100KB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setFormData(prev => ({ ...prev, logo_base64: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const exportTemplate = () => {
    if (!selectedTemplate) return

    const dataStr = JSON.stringify(selectedTemplate, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `template_${selectedTemplate.name.replace(/\s+/g, '_')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setFormData({
          ...imported,
          id: undefined, // Remove ID for new template
          organization_id: organizationId,
          is_default: false
        })
        setIsEditing(true)
        showSuccess('Template importato, modifica e salva')
      } catch (error) {
        showError('File template non valido')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Printer size={24} style={{ color: '#3b82f6' }} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Gestione Template Stampa
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Template List */}
        <div>
          <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            Template Esistenti
          </h4>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => {
                const orgId = organizationId || defaultOrgId || (organizations.length > 0 ? organizations[0].id : '')
                setFormData({
                  ...defaultTemplate,
                  organization_id: orgId
                })
                setSelectedTemplate(null)
                setIsEditing(true)
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Nuovo Template
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <label style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'center'
            }}>
              <Upload size={16} style={{ marginRight: '4px' }} />
              Importa
              <input
                type="file"
                accept=".json"
                onChange={importTemplate}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={exportTemplate}
              disabled={!selectedTemplate}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: selectedTemplate ? '#10b981' : '#f3f4f6',
                color: selectedTemplate ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: selectedTemplate ? 'pointer' : 'not-allowed'
              }}
            >
              <Download size={16} style={{ marginRight: '4px' }} />
              Esporta
            </button>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              Caricamento...
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setFormData(template)
                    setIsEditing(false)
                  }}
                  style={{
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedTemplate?.id === template.id ? '#eff6ff' : 'white',
                    borderColor: selectedTemplate?.id === template.id ? '#3b82f6' : '#e5e7eb'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                    {template.name}
                    {template.is_default && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '4px'
                      }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {template.store_name}
                    {template.organizations && (
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                        {template.organizations.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Form */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {isEditing ? 'Modifica Template' : 'Dettagli Template'}
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isEditing && selectedTemplate && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Settings size={14} style={{ marginRight: '4px' }} />
                    Modifica
                  </button>
                  <button
                    onClick={testPrint}
                    disabled={isTesting}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isTesting ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: isTesting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <TestTube size={14} style={{ marginRight: '4px' }} />
                    {isTesting ? 'Stampa...' : 'Test Browser'}
                  </button>
                  <button
                    onClick={() => setShowDeviceModal(true)}
                    disabled={!selectedTemplate || devices.length === 0}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: (!selectedTemplate || devices.length === 0) ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: (!selectedTemplate || devices.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Printer size={14} style={{ marginRight: '4px' }} />
                    Stampa Scontrino su POS
                  </button>
                </>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      if (selectedTemplate) {
                        setFormData(selectedTemplate)
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    onClick={saveTemplate}
                    disabled={isLoading}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save size={14} style={{ marginRight: '4px' }} />
                    {isLoading ? 'Salva...' : 'Salva'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Basic Info */}
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Nome Template *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              {!organizationId && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                    Organizzazione *
                  </label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: isEditing ? 'white' : '#f9fafb',
                      color: '#111827'
                    }}
                  >
                    <option value="">Seleziona organizzazione...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Nome Negozio *
                </label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Indirizzo
                </label>
                <input
                  type="text"
                  value={formData.store_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_address: e.target.value }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Telefono
                </label>
                <input
                  type="text"
                  value={formData.store_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_phone: e.target.value }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  P.IVA
                </label>
                <input
                  type="text"
                  value={formData.store_tax}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_tax: e.target.value }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              {/* Logo Upload */}
              {isEditing && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                    Logo (max 100KB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {formData.logo_base64 && (
                    <img
                      src={formData.logo_base64}
                      alt="Logo preview"
                      style={{ marginTop: '8px', maxHeight: '60px' }}
                    />
                  )}
                </div>
              )}

              {/* Print Settings */}
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Larghezza Carta (px)
                </label>
                <input
                  type="number"
                  value={formData.paper_width}
                  onChange={(e) => setFormData(prev => ({ ...prev, paper_width: parseInt(e.target.value) || 384 }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Font Normale
                </label>
                <input
                  type="number"
                  value={formData.font_size_normal}
                  onChange={(e) => setFormData(prev => ({ ...prev, font_size_normal: parseInt(e.target.value) || 24 }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Font Grande
                </label>
                <input
                  type="number"
                  value={formData.font_size_large}
                  onChange={(e) => setFormData(prev => ({ ...prev, font_size_large: parseInt(e.target.value) || 32 }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Densità Stampa
                </label>
                <select
                  value={formData.print_density}
                  onChange={(e) => setFormData(prev => ({ ...prev, print_density: parseInt(e.target.value) }))}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    color: '#111827'
                  }}
                >
                  <option value={1}>Leggera</option>
                  <option value={2}>Normale</option>
                  <option value={3}>Media</option>
                  <option value={4}>Scura</option>
                  <option value={5}>Molto Scura</option>
                </select>
              </div>

              {isEditing && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    />
                    Template predefinito
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Demo */}
      {selectedTemplate && (
        <ReceiptDemo
          printConfig={{
            storeName: selectedTemplate.store_name,
            storeAddress: selectedTemplate.store_address,
            storePhone: selectedTemplate.store_phone,
            storeTax: selectedTemplate.store_tax,
            logoBase64: selectedTemplate.logo_base64,
            paperWidth: selectedTemplate.paper_width,
            fontSizeNormal: selectedTemplate.font_size_normal,
            fontSizeLarge: selectedTemplate.font_size_large,
            printDensity: selectedTemplate.print_density
          }}
          onReceiptDataChange={setCurrentReceiptData}
        />
      )}

      {/* Device Selection Modal */}
      {showDeviceModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDeviceModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                🖨️ Seleziona Dispositivo POS
              </h3>
              <button
                onClick={() => setShowDeviceModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
                📋 <strong>Template:</strong> {selectedTemplate?.name}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#3b82f6' }}>
                {selectedTemplate?.store_name}
              </p>
            </div>

            {devices.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280'
              }}>
                <Printer size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Nessun dispositivo disponibile per questa organizzazione
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => sendTestPrintToPOS(device.id)}
                    disabled={sendingToPOS || device.status === 'offline'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: device.status === 'offline' ? '#f9fafb' : 'white',
                      cursor: (sendingToPOS || device.status === 'offline') ? 'not-allowed' : 'pointer',
                      opacity: device.status === 'offline' ? 0.5 : 1,
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (device.status !== 'offline' && !sendingToPOS) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (device.status !== 'offline') {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                        {device.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        📍 {device.store_location}
                        {device.organizations && (
                          <span style={{ marginLeft: '8px', color: '#9ca3af' }}>
                            • {device.organizations.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: device.status === 'online' ? '#d1fae5' : '#fee2e2',
                      color: device.status === 'online' ? '#065f46' : '#991b1b'
                    }}>
                      {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeviceModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrintTemplateManager