import React, { useState, useEffect, useRef } from 'react'
import { X, ArrowRight, ArrowLeft, Users, Send, CheckCircle, Loader, Link2, Image, Bold, Italic, Underline, Palette, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Undo, Redo, RemoveFormatting } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import InputModal from './UI/InputModal'

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
  tier: string | null
  total_spent: number
  visits: number
  marketing_consent: boolean
  last_visit: string | null
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
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)

  // Filtri clienti
  const [searchText, setSearchText] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterMinSpent, setFilterMinSpent] = useState('')
  const [filterMinVisits, setFilterMinVisits] = useState('')
  const [filterMarketingConsent, setFilterMarketingConsent] = useState<boolean | null>(null)

  // Step 6: Invio
  const [isCreating, setIsCreating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendOption, setSendOption] = useState<'draft' | 'schedule' | 'now'>('draft')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Ref per editor contenuto email
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  // Stati per modali inserimento elementi
  const [showButtonModal, setShowButtonModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      loadCustomers()
      loadOrganization()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedTemplate) {
      // Quando viene selezionato un template, pre-compila solo il subject
      // Il contenuto resta vuoto per permettere all'utente di scrivere il proprio messaggio
      setEmailSubject(selectedTemplate.subject)
    }
  }, [selectedTemplate])

  // Sincronizza emailContent con l'editor solo quando cambia step o si apre il modal
  useEffect(() => {
    if (editorRef.current && step === 3) {
      // Imposta il contenuto solo se l'editor è vuoto o diverso dallo stato
      if (editorRef.current.innerHTML !== emailContent) {
        editorRef.current.innerHTML = emailContent
      }
    }
  }, [step])

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
      // Non selezionare automaticamente il primo template - lascia scegliere l'utente
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
        .select('id, name, email, tier, total_spent, visits, marketing_consent, last_visit')
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

  // Funzioni helper per formattazione visuale WYSIWYG
  // Salva il Range della selezione quando l'editor perde il focus
  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
  }

  // Ripristina il Range salvato
  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedRangeRef.current)
      }
    }
  }

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const insertBold = () => applyFormatting('bold')
  const insertItalic = () => applyFormatting('italic')
  const insertUnderline = () => applyFormatting('underline')

  const insertBulletList = () => applyFormatting('insertUnorderedList')
  const insertNumberedList = () => applyFormatting('insertOrderedList')

  const alignLeft = () => applyFormatting('justifyLeft')
  const alignCenter = () => applyFormatting('justifyCenter')
  const alignRight = () => applyFormatting('justifyRight')

  const insertH1 = () => applyFormatting('formatBlock', 'h1')
  const insertH2 = () => applyFormatting('formatBlock', 'h2')
  const insertH3 = () => applyFormatting('formatBlock', 'h3')

  const undoEdit = () => applyFormatting('undo')
  const redoEdit = () => applyFormatting('redo')
  const removeFormat = () => applyFormatting('removeFormat')

  const handleColorPickerClick = () => {
    console.log('🎨 Click palette, stato attuale:', showColorPicker, '→ nuovo:', !showColorPicker)
    setShowColorPicker(!showColorPicker)
  }

  const applyColor = (color: string) => {
    console.log('🎨 applyColor chiamata con colore:', color)

    if (!savedRangeRef.current) {
      console.log('❌ Nessuna selezione salvata')
      setShowColorPicker(false)
      return
    }

    console.log('✅ Selezione salvata trovata:', savedRangeRef.current.toString())

    try {
      // 1. Ripristina la selezione
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedRangeRef.current)
        console.log('✅ Selezione ripristinata')
      }

      // 2. Estrai il contenuto selezionato
      const range = savedRangeRef.current
      const selectedText = range.toString()
      console.log('📝 Testo selezionato:', selectedText, 'lunghezza:', selectedText.length)

      if (selectedText.length > 0) {
        // 3. Crea un span con il colore
        const span = document.createElement('span')
        span.style.color = color
        span.textContent = selectedText
        console.log('📦 Span creato:', span.outerHTML)

        // 4. Sostituisci il contenuto selezionato con lo span
        range.deleteContents()
        range.insertNode(span)
        console.log('✅ Span inserito nel DOM')

        // 5. Posiziona il cursore dopo lo span
        range.setStartAfter(span)
        range.setEndAfter(span)
        selection?.removeAllRanges()
        selection?.addRange(range)

        // 6. Aggiorna il contenuto
        if (editorRef.current) {
          setEmailContent(editorRef.current.innerHTML)
          console.log('✅ Contenuto aggiornato')
        }

        console.log('✅✅✅ Colore applicato con successo:', color, 'a', selectedText)
      } else {
        console.log('⚠️ Testo selezionato vuoto')
      }
    } catch (error) {
      console.error('❌❌❌ Errore applicazione colore:', error)
    }

    // 7. Chiudi la palette
    setShowColorPicker(false)

    // 8. Rimetti focus sull'editor
    editorRef.current?.focus()
  }

  const updateContent = () => {
    if (editorRef.current) {
      setEmailContent(editorRef.current.innerHTML)
    }
  }

  const insertButtonInEmail = () => {
    setShowButtonModal(true)
  }

  const confirmButtonInsert = (values: Record<string, string>) => {
    if (!values.buttonUrl?.trim()) {
      showError('Inserisci un URL valido')
      return
    }

    const buttonHtml = `<div style="text-align: center; margin: 24px 0;"><a href="${values.buttonUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${orgData?.primary_color || '#ef4444'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${values.buttonText || 'Clicca qui'}</a></div>`

    document.execCommand('insertHTML', false, buttonHtml)
    updateContent()
    editorRef.current?.focus()
    setShowButtonModal(false)
  }

  const insertImageInEmail = () => {
    setShowImageModal(true)
  }

  const confirmImageInsert = (values: Record<string, string>) => {
    if (!values.imageUrl?.trim()) {
      showError('Inserisci un URL valido')
      return
    }

    const imageHtml = `<div style="text-align: center; margin: 20px 0;"><img src="${values.imageUrl}" alt="Immagine email" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`

    document.execCommand('insertHTML', false, imageHtml)
    updateContent()
    editorRef.current?.focus()
    setShowImageModal(false)
  }

  const handleSaveCampaign = async (action: 'draft' | 'schedule' | 'now') => {
    // Previeni chiamate multiple
    if (isCreating || isSending) {
      console.log('⚠️ Campaign creation already in progress, ignoring duplicate call')
      return
    }

    if (!selectedTemplate) {
      showError('Seleziona un template')
      return
    }

    if (selectedCustomerIds.length === 0) {
      showError('Seleziona almeno un destinatario')
      return
    }

    // Validazione per invio programmato
    if (action === 'schedule' && (!scheduledDate || !scheduledTime)) {
      showError('Seleziona data e ora per l\'invio programmato')
      return
    }

    setIsCreating(true)

    try {
      // Determina status e scheduled_for in base all'azione
      let status = 'draft'
      let scheduled_for = null

      if (action === 'schedule') {
        status = 'scheduled'
        scheduled_for = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      } else if (action === 'now') {
        status = 'sending'
      }

      // 1. Crea campagna
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          organization_id: organizationId,
          name: campaignName || `Campagna ${new Date().toLocaleDateString('it-IT')}`,
          description: campaignDescription || null,
          template_id: selectedTemplate.id,
          template_type: selectedTemplate.template_type,
          subject: emailSubject,
          custom_content: emailContent,
          status: status,
          scheduled_for: scheduled_for,
          total_recipients: selectedCustomerIds.length,
          target_filter: { type: 'manual', customer_ids: selectedCustomerIds }
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      console.log('✅ Campaign created:', campaign.id, 'Status:', status)

      // 2. Crea recipients
      const selectedCustomers = customers.filter(c => selectedCustomerIds.includes(c.id))
      const recipients = selectedCustomers.map(customer => ({
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

      setIsCreating(false)

      // 3. Azioni finali in base al tipo
      if (action === 'draft') {
        showSuccess('✅ Campagna salvata come bozza!')
        onCampaignCreated()
        handleClose()
      } else if (action === 'schedule') {
        const formattedDate = new Date(scheduled_for!).toLocaleString('it-IT')
        showSuccess(`📅 Campagna programmata per ${formattedDate}`)
        onCampaignCreated()
        handleClose()
      } else if (action === 'now') {
        showSuccess('📧 Avvio invio campagna...')
        setIsSending(true)
        await sendCampaignBatch(campaign.id, selectedCustomerIds.length)
      }

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
    setSelectedTemplate(null)
    setEmailSubject('')
    setEmailContent('')
    setSelectedCustomerIds([])
    setSendProgress(0)
    setSendOption('draft')
    setScheduledDate('')
    setScheduledTime('')
    onClose()
  }

  // Funzione per filtrare i clienti in base ai filtri
  const getFilteredCustomers = () => {
    let filtered = customers

    // Filtro ricerca testuale
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search)
      )
    }

    // Filtro tier
    if (filterTier !== 'all') {
      filtered = filtered.filter(c => c.tier === filterTier)
    }

    // Filtro spesa minima
    if (filterMinSpent) {
      const minSpent = parseFloat(filterMinSpent)
      if (!isNaN(minSpent)) {
        filtered = filtered.filter(c => c.total_spent >= minSpent)
      }
    }

    // Filtro visite minime
    if (filterMinVisits) {
      const minVisits = parseInt(filterMinVisits)
      if (!isNaN(minVisits)) {
        filtered = filtered.filter(c => c.visits >= minVisits)
      }
    }

    // Filtro consenso marketing
    if (filterMarketingConsent !== null) {
      filtered = filtered.filter(c => c.marketing_consent === filterMarketingConsent)
    }

    return filtered
  }

  const filteredCustomers = getFilteredCustomers()

  // Estrai i livelli unici dinamicamente dai clienti
  const availableTiers = Array.from(new Set(customers.map(c => c.tier).filter(tier => tier !== null))) as string[]
  availableTiers.sort()

  const canProceedStep1 = campaignName.trim().length > 0
  const canProceedStep2 = selectedTemplate !== null
  const canProceedStep3 = emailSubject.trim().length > 0 && emailContent.trim().length > 0
  const canProceedStep4 = true // Preview step sempre valido
  const canProceedStep5 = selectedCustomerIds.length > 0

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
                  Contenuto Email *
                </label>

                {/* Toolbar per formattazione e inserimento elementi */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {/* Riga 1: Formattazione testo */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    overflowX: 'scroll',
                    overflowY: 'visible',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    minWidth: 0,
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap'
                  }}>
                    <button
                      type="button"
                      onClick={insertBold}
                      title="Grassetto"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Bold size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={insertItalic}
                      title="Corsivo"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Italic size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={insertUnderline}
                      title="Sottolineato"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Underline size={18} />
                    </button>

                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={handleColorPickerClick}
                        title="Colore testo"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          backgroundColor: showColorPicker ? '#8b5cf6' : 'white',
                          color: showColorPicker ? 'white' : '#374151',
                          border: '1px solid ' + (showColorPicker ? '#8b5cf6' : '#d1d5db'),
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                        onMouseOver={(e) => {
                          if (!showColorPicker) {
                            e.currentTarget.style.backgroundColor = '#8b5cf6'
                            e.currentTarget.style.color = 'white'
                            e.currentTarget.style.borderColor = '#8b5cf6'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!showColorPicker) {
                            e.currentTarget.style.backgroundColor = 'white'
                            e.currentTarget.style.color = '#374151'
                            e.currentTarget.style.borderColor = '#d1d5db'
                          }
                        }}
                      >
                        <Palette size={18} />
                      </button>

                      {/* Palette colori */}
                      {showColorPicker && (
                        <div
                          onMouseDown={(e) => e.preventDefault()}
                          style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'white',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                            zIndex: 10003,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '8px',
                            width: '240px'
                          }}
                        >
                          {[
                            '#000000', // Nero
                            '#374151', // Grigio scuro
                            '#6b7280', // Grigio
                            '#ef4444', // Rosso
                            '#f59e0b', // Arancione
                            '#eab308', // Giallo
                            '#22c55e', // Verde
                            '#10b981', // Verde smeraldo
                            '#06b6d4', // Cyan
                            '#3b82f6', // Blu
                            '#6366f1', // Indaco
                            '#8b5cf6', // Viola
                            '#ec4899', // Rosa
                            '#f43f5e', // Rosa scuro
                            '#ffffff', // Bianco
                            '#d1d5db'  // Grigio chiaro
                          ].map(color => (
                            <button
                              key={color}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyColor(color)}
                              title={color}
                              style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: color,
                                border: color === '#ffffff' ? '2px solid #d1d5db' : '2px solid ' + color,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{
                      width: '1px',
                      height: '100%',
                      backgroundColor: '#d1d5db',
                      margin: '0 4px',
                      flexShrink: 0
                    }} />

                    {/* Liste */}
                    <button
                      type="button"
                      onClick={insertBulletList}
                      title="Elenco puntato"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f59e0b'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#f59e0b'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <List size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={insertNumberedList}
                      title="Elenco numerato"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f59e0b'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#f59e0b'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <ListOrdered size={18} />
                    </button>

                    <div style={{
                      width: '1px',
                      height: '100%',
                      backgroundColor: '#d1d5db',
                      margin: '0 4px',
                      flexShrink: 0
                    }} />

                    {/* Allineamento */}
                    <button
                      type="button"
                      onClick={alignLeft}
                      title="Allinea a sinistra"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#06b6d4'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#06b6d4'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <AlignLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={alignCenter}
                      title="Allinea al centro"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#06b6d4'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#06b6d4'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <AlignCenter size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={alignRight}
                      title="Allinea a destra"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#06b6d4'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#06b6d4'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <AlignRight size={18} />
                    </button>

                    <div style={{
                      width: '1px',
                      height: '100%',
                      backgroundColor: '#d1d5db',
                      margin: '0 4px',
                      flexShrink: 0
                    }} />

                    {/* Titoli */}
                    <button
                      type="button"
                      onClick={insertH1}
                      title="Titolo 1"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#ec4899'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#ec4899'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Heading1 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={insertH2}
                      title="Titolo 2"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#ec4899'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#ec4899'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Heading2 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={insertH3}
                      title="Titolo 3"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#ec4899'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#ec4899'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Heading3 size={18} />
                    </button>

                    <div style={{
                      width: '1px',
                      height: '100%',
                      backgroundColor: '#d1d5db',
                      margin: '0 4px',
                      flexShrink: 0
                    }} />

                    {/* Undo/Redo */}
                    <button
                      type="button"
                      onClick={undoEdit}
                      title="Annulla"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#6366f1'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#6366f1'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Undo size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={redoEdit}
                      title="Ripristina"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#6366f1'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#6366f1'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Redo size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={removeFormat}
                      title="Rimuovi formattazione"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#ef4444'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <RemoveFormatting size={18} />
                    </button>

                    <div style={{
                      width: '1px',
                      height: '100%',
                      backgroundColor: '#d1d5db',
                      margin: '0 4px',
                      flexShrink: 0
                    }} />

                    <button
                      type="button"
                      onClick={insertButtonInEmail}
                      title="Aggiungi pulsante"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Link2 size={16} />
                      <span>Pulsante</span>
                    </button>

                    <button
                      type="button"
                      onClick={insertImageInEmail}
                      title="Aggiungi immagine"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#10b981'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                    >
                      <Image size={16} />
                      <span>Immagine</span>
                    </button>
                  </div>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContent}
                  onBlur={() => {
                    saveSelection()
                    updateContent()
                  }}
                  data-placeholder="Scrivi qui il messaggio dell'email. Seleziona del testo e usa i bottoni per formattare..."
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                    minHeight: '250px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  💡 Il template grafico (logo, colori, layout) verrà applicato automaticamente
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                  📌 Seleziona del testo e usa i bottoni per formattare, oppure clicca per inserire elementi
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
                👁️ Anteprima Email Completa
              </h3>

              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '2px solid #3b82f6' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  📧 Da: {orgData?.email || organizationName}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  📝 Oggetto: {emailSubject}
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: '#1e40af', fontStyle: 'italic' }}>
                  ℹ️ Esempio con cliente: Mario Rossi (mario.rossi@email.com)
                </p>
              </div>

              <div style={{
                border: '3px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#f9fafb',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {/* Preview Email Content */}
                <div style={{
                  backgroundColor: orgData?.primary_color || '#ef4444',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  {orgData?.logo_url && (
                    <img
                      src={orgData.logo_url}
                      alt={organizationName}
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        marginBottom: '12px',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                    {organizationName}
                  </h2>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '40px 30px',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#374151'
                }}>
                  {emailContent ? (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{
                      __html: emailContent
                        // Sostituisci variabili
                        .replace(/\{\{customer_name\}\}/gi, 'Mario Rossi')
                        .replace(/\{\{organization_name\}\}/gi, organizationName)
                        .replace(/\{\{customer_email\}\}/gi, 'mario.rossi@email.com')
                        .replace(/\{\{customer_points\}\}/gi, '250')
                        .replace(/\{\{customer_tier\}\}/gi, 'Gold')
                        // Formattazione testo (grassetto prima per evitare conflitti con corsivo)
                        .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
                        .replace(/__([^_]+)__/g, '<u>$1</u>')
                        .replace(/\[COLOR:([^\]]+)\]([^\[]+)\[\/COLOR\]/g, '<span style="color:$1">$2</span>')
                        // Elementi speciali (bottoni e immagini)
                        .replace(/\[BUTTON:([^\|]+)\|([^\]]+)\]/g, '<div style="text-align: center; margin: 24px 0;"><a href="$2" style="display: inline-block; padding: 14px 32px; background-color: ' + (orgData?.primary_color || '#ef4444') + '; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">$1</a></div>')
                        .replace(/\[IMAGE:([^\]]+)\]/g, '<div style="text-align: center; margin: 20px 0;"><img src="$1" alt="Immagine email" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>')
                        // Converti newline in <br>
                        .replace(/\n/g, '<br>')
                    }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontStyle: 'italic' }}>
                      (Il tuo messaggio apparirà qui con le variabili sostituite)
                    </div>
                  )}
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
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                      Hai ricevuto questa email perché sei registrato al nostro programma fedeltà
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '10px', border: '2px solid #3b82f6' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  ✅ Questa è l'anteprima esatta di come apparirà l'email ai tuoi clienti
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                  Le variabili (come {'{{customer_name}}'}) sono state sostituite con dati di esempio. Ogni cliente riceverà i propri dati personalizzati.
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
                  {/* Stats and Selection Controls */}
                  <div style={{ padding: '24px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '2px solid #3b82f6', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', fontWeight: '700', color: '#1e40af', textAlign: 'center', marginBottom: '8px' }}>
                      {selectedCustomerIds.length} / {filteredCustomers.length}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', textAlign: 'center', marginBottom: '16px' }}>
                      Clienti selezionati {filteredCustomers.length !== customers.length && `(${filteredCustomers.length} filtrati su ${customers.length})`}
                    </div>

                    {filteredCustomers.length > 0 && (
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedCustomerIds(filteredCustomers.map(c => c.id))}
                          style={{
                            padding: '14px 24px',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Seleziona Tutti {filteredCustomers.length !== customers.length && 'Filtrati'}
                        </button>
                        <button
                          onClick={() => setSelectedCustomerIds([])}
                          style={{
                            padding: '14px 24px',
                            backgroundColor: 'white',
                            border: '2px solid #3b82f6',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Deseleziona Tutti
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pannello Filtri */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                      🔍 Filtri Clienti
                    </h4>

                    {/* Ricerca testuale */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        Cerca per nome o email
                      </label>
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Cerca cliente..."
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontWeight: '500'
                        }}
                      />
                    </div>

                    {/* Filtri in griglia */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      {/* Livello fedeltà */}
                      <div>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Livello
                        </label>
                        <select
                          value={filterTier}
                          onChange={(e) => setFilterTier(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="all">Tutti i livelli</option>
                          {availableTiers.map(tier => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      </div>

                      {/* Consenso marketing */}
                      <div>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Consenso marketing
                        </label>
                        <select
                          value={filterMarketingConsent === null ? 'all' : filterMarketingConsent.toString()}
                          onChange={(e) => {
                            const value = e.target.value
                            setFilterMarketingConsent(value === 'all' ? null : value === 'true')
                          }}
                          style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="all">Tutti</option>
                          <option value="true">Solo con consenso</option>
                          <option value="false">Senza consenso</option>
                        </select>
                      </div>

                      {/* Spesa minima */}
                      <div>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Spesa minima (€)
                        </label>
                        <input
                          type="number"
                          value={filterMinSpent}
                          onChange={(e) => setFilterMinSpent(e.target.value)}
                          placeholder="Es: 100"
                          min="0"
                          step="10"
                          style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        />
                      </div>

                      {/* Visite minime */}
                      <div>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Visite minime
                        </label>
                        <input
                          type="number"
                          value={filterMinVisits}
                          onChange={(e) => setFilterMinVisits(e.target.value)}
                          placeholder="Es: 5"
                          min="0"
                          step="1"
                          style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        />
                      </div>
                    </div>

                    {/* Pulsante reset filtri */}
                    {(searchText || filterTier !== 'all' || filterMinSpent || filterMinVisits || filterMarketingConsent !== null) && (
                      <button
                        onClick={() => {
                          setSearchText('')
                          setFilterTier('all')
                          setFilterMinSpent('')
                          setFilterMinVisits('')
                          setFilterMarketingConsent(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Cancella Filtri
                      </button>
                    )}
                  </div>

                  {filteredCustomers.length === 0 && customers.length === 0 ? (
                    <div style={{ padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #ef4444', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
                        ⚠️ Nessun cliente con email disponibile
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#991b1b' }}>
                        Aggiungi clienti con email valide prima di creare una campagna
                      </p>
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div style={{ padding: '24px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                        🔍 Nessun cliente corrisponde ai filtri
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#92400e' }}>
                        Modifica i filtri per vedere più clienti
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: 'white'
                    }}>
                      {filteredCustomers.map((customer, index) => {
                        const isSelected = selectedCustomerIds.includes(customer.id)
                        return (
                          <label
                            key={customer.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '20px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#eff6ff' : 'white',
                              borderBottom: index < filteredCustomers.length - 1 ? '1px solid #e5e7eb' : 'none',
                              transition: 'all 0.2s',
                              minHeight: '80px'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomerIds([...selectedCustomerIds, customer.id])
                                } else {
                                  setSelectedCustomerIds(selectedCustomerIds.filter(id => id !== customer.id))
                                }
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                marginRight: '16px',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                {customer.name}
                              </div>
                              <div style={{ fontSize: '15px', color: '#6b7280' }}>
                                {customer.email}
                              </div>
                              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                                {customer.tier && (
                                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                    🏆 {customer.tier}
                                  </span>
                                )}
                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                  💰 €{customer.total_spent.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                  👥 {customer.visits} visite
                                </span>
                                {customer.marketing_consent && (
                                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                                    ✓ Consenso
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {selectedCustomerIds.length === 0 && filteredCustomers.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '2px solid #f59e0b', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                        ⚠️ Seleziona almeno un cliente per continuare
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Opzioni di Invio */}
          {step === 6 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                📤 Modalità di Invio
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
                  {/* Riepilogo */}
                  <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '14px', color: '#6b7280' }}>Nome:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#111827', fontWeight: '600' }}>{campaignName}</p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '14px', color: '#6b7280' }}>Oggetto:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#111827', fontWeight: '600' }}>{emailSubject}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#6b7280' }}>Destinatari:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#111827', fontWeight: '600' }}>
                        {selectedCustomerIds.length} clienti
                      </p>
                    </div>
                  </div>

                  {/* Opzioni di Invio */}
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {/* Opzione 1: Salva come Bozza */}
                    <button
                      onClick={() => setSendOption('draft')}
                      style={{
                        padding: '20px',
                        backgroundColor: sendOption === 'draft' ? '#eff6ff' : 'white',
                        border: sendOption === 'draft' ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `3px solid ${sendOption === 'draft' ? '#3b82f6' : '#d1d5db'}`,
                          backgroundColor: sendOption === 'draft' ? '#3b82f6' : 'white',
                          marginRight: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {sendOption === 'draft' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                          📝 Salva come Bozza
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0 36px', fontSize: '14px', color: '#6b7280' }}>
                        Salva la campagna senza inviarla. Potrai inviarla in seguito dalla lista campagne.
                      </p>
                    </button>

                    {/* Opzione 2: Programma Invio */}
                    <div>
                      <button
                        onClick={() => setSendOption('schedule')}
                        style={{
                          width: '100%',
                          padding: '20px',
                          backgroundColor: sendOption === 'schedule' ? '#eff6ff' : 'white',
                          border: sendOption === 'schedule' ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `3px solid ${sendOption === 'schedule' ? '#3b82f6' : '#d1d5db'}`,
                            backgroundColor: sendOption === 'schedule' ? '#3b82f6' : 'white',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {sendOption === 'schedule' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                            📅 Programma Invio
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0 36px', fontSize: '14px', color: '#6b7280' }}>
                          Scegli data e ora per l'invio automatico della campagna.
                        </p>
                      </button>

                      {sendOption === 'schedule' && (
                        <div style={{ marginTop: '16px', marginLeft: '36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                              Data
                            </label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '16px',
                                border: '2px solid #d1d5db',
                                borderRadius: '8px',
                                fontWeight: '500'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                              Ora
                            </label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '16px',
                                border: '2px solid #d1d5db',
                                borderRadius: '8px',
                                fontWeight: '500'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Opzione 3: Invia Subito */}
                    <button
                      onClick={() => setSendOption('now')}
                      style={{
                        padding: '20px',
                        backgroundColor: sendOption === 'now' ? '#fef3c7' : 'white',
                        border: sendOption === 'now' ? '3px solid #f59e0b' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `3px solid ${sendOption === 'now' ? '#f59e0b' : '#d1d5db'}`,
                          backgroundColor: sendOption === 'now' ? '#f59e0b' : 'white',
                          marginRight: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {sendOption === 'now' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                          🚀 Invia Subito
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0 36px', fontSize: '14px', color: '#6b7280' }}>
                        Avvia immediatamente l'invio della campagna a tutti i destinatari selezionati.
                      </p>
                    </button>
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
                onClick={() => handleSaveCampaign(sendOption)}
                disabled={isCreating || (sendOption === 'schedule' && (!scheduledDate || !scheduledTime))}
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor:
                    (isCreating || (sendOption === 'schedule' && (!scheduledDate || !scheduledTime)))
                      ? '#9ca3af'
                      : sendOption === 'now' ? '#ef4444' : '#3b82f6',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  cursor: (isCreating || (sendOption === 'schedule' && (!scheduledDate || !scheduledTime))) ? 'not-allowed' : 'pointer',
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
                ) : sendOption === 'draft' ? (
                  <>
                    Salva Bozza
                  </>
                ) : sendOption === 'schedule' ? (
                  <>
                    Programma Invio
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    Invia Ora
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Inserimento Bottone */}
      <InputModal
        isOpen={showButtonModal}
        title="Aggiungi Pulsante con Link"
        icon="🔗"
        fields={[
          {
            name: 'buttonText',
            label: 'Testo del pulsante',
            type: 'text',
            placeholder: 'Es: Scopri di più',
            required: true,
            defaultValue: 'Scopri di più'
          },
          {
            name: 'buttonUrl',
            label: 'URL destinazione',
            type: 'url',
            placeholder: 'https://tuosito.com/offerta',
            required: true
          }
        ]}
        confirmText="Inserisci Pulsante"
        onConfirm={confirmButtonInsert}
        onCancel={() => setShowButtonModal(false)}
        confirmButtonColor="#3b82f6"
      />

      {/* Modal Inserimento Immagine */}
      <InputModal
        isOpen={showImageModal}
        title="Aggiungi Immagine"
        icon="🖼️"
        fields={[
          {
            name: 'imageUrl',
            label: 'URL dell\'immagine',
            type: 'url',
            placeholder: 'https://tuosito.com/immagine.jpg',
            required: true
          }
        ]}
        confirmText="Inserisci Immagine"
        onConfirm={confirmImageInsert}
        onCancel={() => setShowImageModal(false)}
        confirmButtonColor="#10b981"
      />
    </>
  )
}

export default CreateCampaignWizard
