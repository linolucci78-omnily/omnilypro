// QUESTO È IL NUOVO STEP 6 - Sostituisci nel file CreateCampaignWizard.tsx

// Aggiungi questi stati all'inizio del componente (dopo gli altri useState):
const [sendOption, setSendOption] = useState<'draft' | 'schedule' | 'now'>('draft')
const [scheduledDate, setScheduledDate] = useState('')
const [scheduledTime, setScheduledTime] = useState('')

// Sostituisci la funzione handleCreateAndSend con questa:
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

// sendCampaignBatch rimane uguale (già esistente)

// NUOVO STEP 6 (sostituisci quello esistente):
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

// MODIFICA IL PULSANTE FINALE (nel footer):
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
