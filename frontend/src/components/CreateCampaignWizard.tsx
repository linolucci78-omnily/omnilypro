import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Users, Mail, Eye, Send, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface CreateCampaignWizardProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
  onCampaignCreated: () => void
}

interface EmailTemplate {
  id: string
  template_type: string
  name: string
  subject: string
  html_body: string
  variables: string[] | null
}

interface Customer {
  id: string
  name: string
  email: string | null
  loyalty_tier: string | null
}

const CreateCampaignWizard: React.FC<CreateCampaignWizardProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onCampaignCreated
}) => {
  const [step, setStep] = useState(1)
  const { showError, showSuccess } = useToast()

  // Step 1: Dati campagna
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')

  // Step 2: Template
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Step 3: Personalizzazione
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')

  // Organization data per preview
  const [orgData, setOrgData] = useState<any>(null)
  const [orgLoading, setOrgLoading] = useState(false)

  // Step 5: Destinatari
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<'all' | 'filtered'>('all')
  const [customersLoading, setCustomersLoading] = useState(false)

  // Step 6: Invio
  const [isCreating, setIsCreating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      loadCustomers()
      loadOrganization()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedTemplate && !emailSubject) {
      setEmailSubject(selectedTemplate.subject)
    }
  }, [selectedTemplate])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .is('organization_id', null)
        .eq('is_active', true)
        .order('template_type')

      if (error) throw error
      setTemplates(data || [])
      if (data && data.length > 0) {
        setSelectedTemplate(data[0])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      showError('Errore nel caricamento dei template')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadCustomers = async () => {
    setCustomersLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, loyalty_tier')
        .eq('organization_id', organizationId)
        .order('name')

      if (error) throw error

      // Filtra clienti con email valida (non null e non stringa vuota)
      const customersWithEmail = (data || []).filter(c => c.email && c.email.trim().length > 0)
      console.log(`📧 Clienti totali: ${data?.length}, con email: ${customersWithEmail.length}`)
      setCustomers(customersWithEmail)
    } catch (error) {
      console.error('Error loading customers:', error)
      showError('Errore nel caricamento dei clienti')
    } finally {
      setCustomersLoading(false)
    }
  }

  const loadOrganization = async () => {
    setOrgLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url, primary_color, secondary_color, email, phone, address, website')
        .eq('id', organizationId)
        .single()

      if (error) throw error
      setOrgData(data)
    } catch (error) {
      console.error('Error loading organization:', error)
      showError('Errore nel caricamento dati organizzazione')
    } finally {
      setOrgLoading(false)
    }
  }

  const handleCreateAndSend = async () => {
    if (!selectedTemplate) {
      showError('Seleziona un template')
      return
    }

    if (customers.length === 0) {
      showError('Nessun cliente con email disponibile')
      return
    }

    setIsCreating(true)

    try {
      // 1. Crea campagna con contenuto personalizzato
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          organization_id: organizationId,
          name: campaignName || `Campagna ${new Date().toLocaleDateString('it-IT')}`,
          description: campaignDescription || null,
          template_id: selectedTemplate.id,
          template_type: selectedTemplate.template_type,
          subject: emailSubject,
          custom_content: emailContent, // Salva il contenuto personalizzato
          status: 'draft',
          total_recipients: customers.length,
          target_filter: selectedRecipients === 'all' ? null : { type: 'all' }
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      console.log('✅ Campaign created:', campaign.id)

      // 2. Crea recipients
      const recipients = customers.map(customer => ({
        campaign_id: campaign.id,
        organization_id: organizationId,
        customer_id: customer.id,
        email: customer.email!,
        name: customer.name,
        status: 'pending'
      }))

      const { error: recipientsError } = await supabase
        .from('email_campaign_recipients')
        .insert(recipients)

      if (recipientsError) throw recipientsError

      console.log('✅ Recipients created:', recipients.length)

      showSuccess('Campagna creata! Invio in corso...')
      setIsCreating(false)
      setIsSending(true)

      // 3. Avvia invio batch
      await sendCampaignBatch(campaign.id, customers.length)

    } catch (error: any) {
      console.error('Error creating campaign:', error)
      showError(`Errore: ${error.message}`)
      setIsCreating(false)
      setIsSending(false)
    }
  }

  const sendCampaignBatch = async (campaignId: string, totalRecipients: number) => {
    try {
      let processed = 0

      // Invia batch finché ci sono recipient pending
      while (processed < totalRecipients) {
        const { data, error } = await supabase.functions.invoke('send-campaign', {
          body: { campaign_id: campaignId, batch_size: 50 }
        })

        if (error) throw error

        processed += data.processed || 0
        const progress = Math.round((processed / totalRecipients) * 100)
        setSendProgress(progress)

        console.log(`📊 Progress: ${processed}/${totalRecipients} (${progress}%)`)

        // Se non ci sono più pending, esce dal loop
        if (!data.has_more_pending) break

        // Pausa di 2 secondi tra un batch e l'altro
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      showSuccess('🎉 Campagna inviata con successo!')
      setIsSending(false)
      onCampaignCreated()
      handleClose()

    } catch (error: any) {
      console.error('Error sending campaign:', error)
      showError(`Errore durante l'invio: ${error.message}`)
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setCampaignName('')
    setCampaignDescription('')
    setEmailSubject('')
    setEmailContent('')
    setSelectedRecipients('all')
    setSendProgress(0)
    onClose()
  }

  const canProceedStep1 = campaignName.trim().length > 0
  const canProceedStep2 = selectedTemplate !== null
  const canProceedStep3 = emailSubject.trim().length > 0 && emailContent.trim().length > 0
  const canProceedStep4 = true // Preview step sempre valido
  const canProceedStep5 = customers.length > 0

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={handleClose}
      />

      {/* Wizard Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px', backgroundColor: '#ef4444', color: 'white', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
                Crea Nuova Campagna
              </h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                Step {step} di 6
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isCreating || isSending}
              style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: (isCreating || isSending) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '20px', width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(step / 6) * 100}%`,
                height: '100%',
                backgroundColor: 'white',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Step 1: Dati Campagna */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                📝 Informazioni Campagna
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Nome Campagna *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Es: Promozione Primavera 2025"
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontWeight: '500'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Descrivi brevemente questa campagna..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontWeight: '500',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Selezione Template */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                📧 Scegli Template Email
              </h3>

              {templatesLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Loader size={48} className="spinning" style={{ opacity: 0.3 }} />
                  <p style={{ margin: '12px 0 0 0', fontSize: '16px', color: '#6b7280' }}>Caricamento template...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      style={{
                        padding: '24px',
                        backgroundColor: selectedTemplate?.id === template.id ? '#eff6ff' : 'white',
                        border: selectedTemplate?.id === template.id ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        minHeight: '80px'
                      }}
                    >
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        {template.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        Tipo: {template.template_type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Personalizzazione Contenuto */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                ✏️ Scrivi il Messaggio Email
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Oggetto Email *
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Es: Offerta Speciale per te!"
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontWeight: '500'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Contenuto Email * (Touch-friendly)
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Scrivi qui il messaggio principale dell'email. Puoi usare variabili come {{customer_name}} per personalizzare..."
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontWeight: '500',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                    minHeight: '250px'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  💡 Il template grafico (logo, colori, layout) verrà applicato automaticamente
                </p>
              </div>

              {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                <div style={{ padding: '20px', backgroundColor: '#dbeafe', borderRadius: '10px', border: '2px solid #3b82f6' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', margin: '0 0 12px 0' }}>
                    📝 Variabili Disponibili (copia e incolla nel testo)
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'white',
                          border: '2px solid #3b82f6',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#1e40af',
                          fontFamily: 'monospace',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const varText = `{{${variable}}}`
                          setEmailContent(emailContent + varText)
                        }}
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                  <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#1e40af' }}>
                    👆 Clicca su una variabile per aggiungerla al testo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: PREVIEW EMAIL */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                👁️ Anteprima Email
              </h3>

              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '2px solid #3b82f6' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  📧 Da: {orgData?.email || organizationName}
                </p>
                <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  📝 Oggetto: {emailSubject}
                </p>
              </div>

              <div style={{
                border: '3px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#f9fafb'
              }}>
                {/* Preview Email Content */}
                <div style={{
                  backgroundColor: orgData?.primary_color || '#ef4444',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  {orgData?.logo_url ? (
                    <img
                      src={orgData.logo_url}
                      alt={organizationName}
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        marginBottom: '16px',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                      {organizationName}
                    </h2>
                  )}
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '40px 30px',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#374151'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {emailContent || '(Il tuo messaggio apparirà qui)'}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '30px',
                  textAlign: 'center',
                  borderTop: '2px solid #e5e7eb',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>{organizationName}</strong></p>
                  {orgData?.address && <p style={{ margin: '0 0 4px 0' }}>{orgData.address}</p>}
                  {orgData?.phone && <p style={{ margin: '0 0 4px 0' }}>Tel: {orgData.phone}</p>}
                  {orgData?.email && <p style={{ margin: '0 0 4px 0' }}>Email: {orgData.email}</p>}
                  {orgData?.website && <p style={{ margin: '0 0 4px 0' }}>Web: {orgData.website}</p>}
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '2px solid #f59e0b', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                  ℹ️ Questa è un'anteprima. Le variabili come {{customer_name}} verranno sostituite per ogni cliente.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Selezione Destinatari */}
          {step === 5 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                <Users size={28} style={{ display: 'inline', marginRight: '8px' }} />
                Seleziona Destinatari
              </h3>

              {customersLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Loader size={48} className="spinning" style={{ opacity: 0.3 }} />
                  <p style={{ margin: '12px 0 0 0', fontSize: '16px', color: '#6b7280' }}>Caricamento clienti...</p>
                </div>
              ) : (
                <div>
                  {/* Stats */}
                  <div style={{ padding: '24px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '2px solid #3b82f6', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', fontWeight: '700', color: '#1e40af', textAlign: 'center', marginBottom: '8px' }}>
                      {customers.length}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', textAlign: 'center' }}>
                      Clienti con email
                    </div>
                  </div>

                  {customers.length === 0 && (
                    <div style={{ padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #ef4444', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
                        ⚠️ Nessun cliente con email disponibile
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#991b1b' }}>
                        Aggiungi clienti con email valide prima di creare una campagna
                      </p>
                    </div>
                  )}

                  {customers.length > 0 && (
                    <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                        La campagna verrà inviata a tutti i {customers.length} clienti con email valida.
                        In futuro potrai filtrare per tag, livello fedeltà, ecc.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Conferma e Invio */}
          {step === 6 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                <Eye size={28} style={{ display: 'inline', marginRight: '8px' }} />
                Riepilogo e Invio
              </h3>

              {isSending ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Loader size={64} className="spinning" style={{ color: '#3b82f6', marginBottom: '20px' }} />
                  <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 12px 0' }}>
                    Invio in corso...
                  </h4>
                  <div style={{ fontSize: '48px', fontWeight: '700', color: '#3b82f6', marginBottom: '12px' }}>
                    {sendProgress}%
                  </div>
                  <div style={{ width: '100%', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: `${sendProgress}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Attendere, non chiudere la finestra...
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '16px', color: '#111827' }}>Nome Campagna:</strong>
                      <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>{campaignName}</p>
                    </div>
                    {campaignDescription && (
                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ fontSize: '16px', color: '#111827' }}>Descrizione:</strong>
                        <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>{campaignDescription}</p>
                      </div>
                    )}
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '16px', color: '#111827' }}>Template:</strong>
                      <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>{selectedTemplate?.name}</p>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '16px', color: '#111827' }}>Oggetto:</strong>
                      <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>{emailSubject}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#111827' }}>Destinatari:</strong>
                      <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
                        {customers.length} clienti
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                      ⚠️ L'invio della campagna inizierà immediatamente!
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#92400e' }}>
                      Verifica tutti i dati prima di procedere
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {step > 1 && !isSending && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isCreating}
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#374151',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  minHeight: '70px'
                }}
              >
                <ArrowLeft size={24} />
                Indietro
              </button>
            )}

            {step < 6 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3) ||
                  (step === 4 && !canProceedStep4) ||
                  (step === 5 && !canProceedStep5)
                }
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor:
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3) ||
                    (step === 4 && !canProceedStep4) ||
                    (step === 5 && !canProceedStep5)
                      ? '#9ca3af'
                      : '#3b82f6',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  cursor:
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3) ||
                    (step === 4 && !canProceedStep4) ||
                    (step === 5 && !canProceedStep5)
                      ? 'not-allowed'
                      : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  minHeight: '70px',
                  transition: 'all 0.2s'
                }}
              >
                Avanti
                <ArrowRight size={24} />
              </button>
            )}

            {step === 6 && !isSending && (
              <button
                onClick={handleCreateAndSend}
                disabled={isCreating || !canProceedStep5}
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor: (isCreating || !canProceedStep5) ? '#9ca3af' : '#ef4444',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  cursor: (isCreating || !canProceedStep5) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  minHeight: '70px',
                  transition: 'all 0.2s'
                }}
              >
                {isCreating ? (
                  <>
                    <Loader size={24} className="spinning" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    Crea e Invia Campagna
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default CreateCampaignWizard
