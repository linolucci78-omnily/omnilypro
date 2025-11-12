import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, Upload, User, Mail, Phone, MapPin, Save, Loader, Calendar, UserCheck, Bell, Users, FileText, Gift, CheckCircle, Download, Lock, AlertCircle } from 'lucide-react'
import './EditCustomerModal.css'
import { supabase } from '../lib/supabase'
import type { Customer } from '../lib/supabase'
import AddressAutocomplete from './AddressAutocomplete'

interface EditCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onUpdate: (customerId: string, updates: Partial<Customer>) => Promise<void>
  primaryColor?: string
  secondaryColor?: string
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onUpdate,
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444'
}) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    gender: customer.gender || '',
    birth_date: customer.birth_date || '',
    referral_code: customer.referral_code || '',
    referred_by: customer.referred_by || '',
    notes: customer.notes || '',
    marketing_consent: customer.marketing_consent || false,
    notifications_enabled: customer.notifications_enabled || false,
    password: '' // Password temporanea per accesso app
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(customer.avatar_url || null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(customer.avatar_url || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null)

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Rileva se è un dispositivo touch (mobile/tablet)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Sincronizza formData quando customer cambia
  useEffect(() => {
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      gender: customer.gender || '',
      birth_date: customer.birth_date || '',
      referral_code: customer.referral_code || '',
      referred_by: customer.referred_by || '',
      notes: customer.notes || '',
      marketing_consent: customer.marketing_consent || false,
      notifications_enabled: customer.notifications_enabled || false,
      password: '' // Reset password
    })
    setAvatarUrl(customer.avatar_url || null)
    setAvatarPreview(customer.avatar_url || null)
    setPasswordSuccess(false)
    setPasswordError(null)
  }, [customer])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      console.error('File non valido: deve essere un\'immagine')
      return
    }

    // Verifica dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('Immagine troppo grande (max 5MB)')
      return
    }

    setIsUploading(true)

    try {
      // Crea preview locale
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload su Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${customer.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      console.log('📤 Uploading avatar:', filePath)

      const { data, error } = await supabase.storage
        .from('customer-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Errore upload:', error)
        throw error
      }

      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('customer-avatars')
        .getPublicUrl(filePath)

      console.log('✅ Avatar caricato:', publicUrl)
      setAvatarUrl(publicUrl)

    } catch (error) {
      console.error('❌ Errore caricamento avatar:', error)
      setAvatarPreview(customer.avatar_url || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleGalleryClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleSave = async () => {
    setIsSaving(true)
    setPasswordError(null)

    try {
      // Se è stata fornita una password, imposta la password tramite Edge Function
      if (formData.password && formData.password.length > 0) {
        console.log('🔑 Impostazione password per cliente:', customer.id)

        try {
          const { data: { session } } = await supabase.auth.getSession()

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-customer-password`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({
                customer_id: customer.id,
                password: formData.password
              })
            }
          )

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Errore impostazione password')
          }

          console.log('✅ Password impostata con successo')
          setPasswordSuccess(true)
        } catch (passwordError: any) {
          console.error('❌ Errore impostazione password:', passwordError)
          setPasswordError(passwordError.message || 'Errore durante l\'impostazione della password')
          // Non blocchiamo il salvataggio degli altri dati
        }
      }

      // Salva le altre modifiche al cliente
      const updates: Partial<Customer> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: (formData.gender as 'male' | 'female' | undefined) || undefined,
        birth_date: formData.birth_date || undefined,
        referral_code: formData.referral_code || undefined,
        referred_by: formData.referred_by || undefined,
        notes: formData.notes || undefined,
        marketing_consent: formData.marketing_consent,
        notifications_enabled: formData.notifications_enabled,
        avatar_url: avatarUrl || undefined
      }

      console.log('💾 Salvando modifiche cliente:', updates)

      await onUpdate(customer.id, updates)

      console.log('✅ Cliente aggiornato con successo')

      // Mostra messaggio di successo
      showToast('✅ Dati cliente aggiornati con successo!', 'success')

      // Chiudi modal dopo 2 secondi (solo se non ci sono errori di password)
      if (!passwordError) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Errore salvataggio cliente:', error)
      showToast('❌ Errore durante il salvataggio dei dati', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const generateConsentDocument = () => {
    const timestamp = customer.privacy_signed_at
      ? new Date(customer.privacy_signed_at).toLocaleString('it-IT')
      : new Date().toLocaleString('it-IT')
    const documentId = `GDPR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MODULO CONSENSO PRIVACY GDPR - OMNILY PRO</title>
    <style>
        @page {
            margin: 2cm;
            size: A4;
            @top-center { content: "OMNILY PRO - Modulo Consenso Privacy GDPR"; }
            @bottom-center { content: "Pagina " counter(page) " di " counter(pages); }
        }
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            line-height: 1.8;
            color: #000;
            font-size: 11pt;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #ef4444;
            padding-bottom: 25px;
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .company-logo {
            color: #ef4444;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        .document-title {
            font-size: 20px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
        }
        .document-subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
        }
        .document-id {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 9pt;
            color: #888;
        }
        .section {
            margin: 30px 0;
            page-break-inside: avoid;
        }
        .section h3 {
            background: #f5f5f5;
            padding: 10px 15px;
            margin: 20px 0 15px 0;
            border-left: 4px solid #ef4444;
            font-size: 14pt;
            text-transform: uppercase;
            font-weight: bold;
        }
        .subsection {
            margin: 20px 0;
            padding-left: 15px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .data-table th, .data-table td {
            border: 1px solid #ddd;
            padding: 12px 15px;
            text-align: left;
        }
        .data-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .checkbox-row {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #ddd;
            background: #fafafa;
            display: flex;
            align-items: flex-start;
        }
        .checkbox-row input {
            margin-right: 10px;
            transform: scale(1.2);
            margin-top: 3px;
        }
        .checkbox-text {
            flex: 1;
            line-height: 1.6;
        }
        .required {
            color: #ef4444;
            font-weight: bold;
        }
        .optional {
            color: #666;
            font-style: italic;
        }
        .signature-section {
            border: 2px solid #333;
            margin: 30px 0;
            padding: 20px;
            page-break-inside: avoid;
        }
        .signature-box {
            border: 2px dashed #ccc;
            height: 180px;
            margin: 20px 0;
            position: relative;
            background: #fafafa;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-image {
            max-width: 95%;
            max-height: 95%;
            border: 1px solid #ddd;
        }
        .signature-details {
            margin-top: 15px;
            font-size: 10pt;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        .legal-text {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-left: 5px solid #ef4444;
            font-size: 10pt;
            line-height: 1.6;
        }
        .footer {
            margin-top: 60px;
            font-size: 9pt;
            color: #666;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            page-break-inside: avoid;
        }
        .privacy-rights {
            background: #e8f4fd;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #bee5eb;
            border-radius: 5px;
        }
        .rights-list {
            columns: 2;
            column-gap: 30px;
            list-style-type: none;
            padding: 0;
        }
        .rights-list li {
            margin: 10px 0;
            padding-left: 20px;
            position: relative;
            break-inside: avoid;
        }
        .rights-list li::before {
            content: "⚖";
            position: absolute;
            left: 0;
            color: #ef4444;
        }
        .contact-info {
            background: #fff3cd;
            padding: 15px;
            margin: 20px 0;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
        }
        .timestamps {
            font-family: monospace;
            background: #f8f9fa;
            padding: 10px;
            margin: 10px 0;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <div class="document-id">ID: ${documentId}</div>

    <div class="header">
        <div class="company-logo">OMNILY PRO</div>
        <div class="document-title">Modulo Consenso al Trattamento dei Dati Personali</div>
        <div class="document-subtitle">Ai sensi del Regolamento UE 2016/679 (GDPR) e del Codice Privacy D.Lgs. 196/2003</div>
    </div>

    <div class="section">
        <h3>I. Identificazione del Titolare del Trattamento</h3>
        <div class="legal-text">
            <strong>OMNILY PRO S.r.l.</strong><br>
            Sede Legale: Via Roma 123, 00100 Roma (RM)<br>
            P.IVA: 12345678901 - C.F.: 12345678901<br>
            Email: privacy@omnilypro.com - Tel: +39 06 1234567<br>
            <strong>Data Protection Officer (DPO):</strong> dpo@omnilypro.com
        </div>
    </div>

    <div class="section">
        <h3>II. Dati dell'Interessato</h3>
        <table class="data-table">
            <tr>
                <th>Nome e Cognome</th>
                <td>${customer.name}</td>
            </tr>
            <tr>
                <th>Indirizzo Email</th>
                <td>${customer.email || 'Non fornito'}</td>
            </tr>
            <tr>
                <th>Numero di Telefono</th>
                <td>${customer.phone || 'Non fornito'}</td>
            </tr>
            <tr>
                <th>Data di Nascita</th>
                <td>${customer.birth_date || 'Non fornita'}</td>
            </tr>
            <tr>
                <th>Indirizzo</th>
                <td>${customer.address || 'Non fornito'}</td>
            </tr>
            <tr>
                <th>Data Registrazione</th>
                <td>${customer.created_at ? new Date(customer.created_at).toLocaleString('it-IT') : 'Non disponibile'}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>III. Finalità e Base Giuridica del Trattamento</h3>

        <div class="subsection">
            <h4>A) Trattamenti Necessari (Base Giuridica: Art. 6, par. 1, lett. b) GDPR)</h4>
            <ul>
                <li><strong>Gestione del rapporto contrattuale:</strong> Erogazione dei servizi di loyalty management</li>
                <li><strong>Adempimenti di legge:</strong> Obblighi fiscali, contabili e amministrativi</li>
                <li><strong>Sicurezza:</strong> Prevenzione frodi e attività illecite</li>
            </ul>
        </div>

        <div class="subsection">
            <h4>B) Trattamenti basati sul consenso (Base Giuridica: Art. 6, par. 1, lett. a) GDPR)</h4>
            <ul>
                <li><strong>Marketing diretto:</strong> Invio comunicazioni commerciali e promozionali</li>
                <li><strong>Profilazione:</strong> Analisi preferenze per offerte personalizzate</li>
                <li><strong>Newsletter:</strong> Invio periodico di informazioni sui servizi</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h3>IV. Consensi Espressi dall'Interessato</h3>

        <div class="checkbox-row">
            <input type="checkbox" checked disabled>
            <div class="checkbox-text">
                <strong class="required">[CONSENSO OBBLIGATORIO]</strong><br>
                <strong>Acconsento al trattamento dei miei dati personali</strong> per le finalità necessarie all'erogazione dei servizi richiesti,
                alla gestione del rapporto contrattuale e agli adempimenti di legge,
                ai sensi dell'Art. 6, par. 1, lett. b) GDPR.
                <div class="timestamps"><strong>Consenso espresso il:</strong> ${timestamp}</div>
            </div>
        </div>

        <div class="checkbox-row">
            <input type="checkbox" ${customer.marketing_consent ? 'checked' : ''} disabled>
            <div class="checkbox-text">
                <strong class="optional">[CONSENSO FACOLTATIVO]</strong><br>
                <strong>Acconsento al trattamento dei miei dati personali per finalità di marketing</strong>,
                incluso l'invio di comunicazioni commerciali, newsletter, offerte promozionali e profilazione
                per la personalizzazione dei servizi, ai sensi dell'Art. 6, par. 1, lett. a) GDPR.
                <div class="timestamps"><strong>Consenso ${customer.marketing_consent ? 'PRESTATO' : 'NON PRESTATO'} il:</strong> ${timestamp}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>V. Categorie di Dati Trattati</h3>
        <ul>
            <li><strong>Dati anagrafici:</strong> Nome, cognome, data di nascita</li>
            <li><strong>Dati di contatto:</strong> Email, telefono, indirizzo postale</li>
            <li><strong>Dati comportamentali:</strong> Preferenze, cronologia acquisti, interazioni</li>
            <li><strong>Dati tecnici:</strong> Indirizzo IP, cookies, dati di navigazione</li>
        </ul>
    </div>

    <div class="section">
        <h3>VI. Modalità del Trattamento</h3>
        <div class="legal-text">
            I dati personali sono trattati con strumenti automatizzati e non, con modalità e logiche
            strettamente correlate alle finalità indicate e, comunque, in modo da garantire la sicurezza
            e la riservatezza dei dati stessi mediante appropriate misure tecniche e organizzative.
        </div>
    </div>

    <div class="section">
        <h3>VII. Periodo di Conservazione</h3>
        <ul>
            <li><strong>Dati contrattuali:</strong> 10 anni dalla cessazione del rapporto</li>
            <li><strong>Dati marketing:</strong> Fino a revoca del consenso o 2 anni dall'ultima interazione</li>
            <li><strong>Dati tecnici:</strong> 12 mesi dalla raccolta</li>
        </ul>
    </div>

    <div class="section">
        <h3>VIII. Comunicazione e Diffusione</h3>
        <div class="legal-text">
            I dati potranno essere comunicati a soggetti terzi solo per finalità strettamente connesse
            all'erogazione dei servizi (fornitori tecnologici, consulenti, autorità competenti)
            e nel rispetto delle prescrizioni di legge. I dati non saranno mai diffusi.
        </div>
    </div>

    <div class="section">
        <h3>IX. Trasferimento Extra-UE</h3>
        <div class="legal-text">
            Alcuni dati potrebbero essere trasferiti verso paesi terzi o organizzazioni internazionali
            solo in presenza di una decisione di adeguatezza della Commissione Europea o mediante
            l'adozione di garanzie appropriate (Standard Contractual Clauses, Binding Corporate Rules).
        </div>
    </div>

    <div class="section">
        <h3>X. Diritti dell'Interessato</h3>
        <div class="privacy-rights">
            <p><strong>L'interessato ha diritto di ottenere dal Titolare del trattamento:</strong></p>
            <ul class="rights-list">
                <li><strong>Accesso (Art. 15):</strong> Conferma che sia in corso un trattamento e informazioni sui dati</li>
                <li><strong>Rettifica (Art. 16):</strong> Correzione dei dati inesatti o integrazione di quelli incompleti</li>
                <li><strong>Cancellazione (Art. 17):</strong> Cancellazione dei dati (diritto all'oblio)</li>
                <li><strong>Limitazione (Art. 18):</strong> Limitazione del trattamento in specifiche circostanze</li>
                <li><strong>Portabilità (Art. 20):</strong> Ricevere i propri dati in formato strutturato</li>
                <li><strong>Opposizione (Art. 21):</strong> Opporsi al trattamento per motivi legittimi</li>
                <li><strong>Revoca consenso:</strong> Revocare il consenso in qualsiasi momento</li>
                <li><strong>Reclamo (Art. 77):</strong> Presentare reclamo all'Autorità di controllo</li>
            </ul>
        </div>

        <div class="contact-info">
            <strong>Per esercitare i tuoi diritti contatta:</strong><br>
            📧 Email: privacy@omnilypro.com<br>
            📞 Telefono: +39 06 1234567<br>
            📮 Posta: OMNILY PRO S.r.l., Via Roma 123, 00100 Roma (RM)<br>
            <strong>Autorità Garante:</strong> www.gpdp.it - garante@gpdp.it
        </div>
    </div>

    <div class="signature-section">
        <h3>XI. Firma Digitale e Validità del Consenso</h3>
        <div class="signature-box">
            <img src="${customer.signature_data}" class="signature-image" alt="Firma digitale del cliente" />
        </div>
        <div class="signature-details">
            <table class="data-table">
                <tr>
                    <th>Firma apposta in data</th>
                    <td>${timestamp}</td>
                </tr>
                <tr>
                    <th>Modalità di firma</th>
                    <td>Firma elettronica avanzata tracciata su dispositivo digitale</td>
                </tr>
                <tr>
                    <th>Validità legale</th>
                    <td>Conforme agli artt. 20-21 del Regolamento eIDAS (UE) 910/2014</td>
                </tr>
                <tr>
                    <th>Hash documento</th>
                    <td>${documentId}</td>
                </tr>
                <tr>
                    <th>Sistema di raccolta</th>
                    <td>OMNILY PRO Loyalty Management Platform v.1.0</td>
                </tr>
            </table>
        </div>

        <div class="legal-text">
            <strong>DICHIARAZIONE DI CONSENSO INFORMATO</strong><br>
            Il sottoscritto dichiara di aver ricevuto l'informativa sul trattamento dei dati personali
            ai sensi dell'Art. 13 GDPR, di averla letta e compresa, e di esprimere liberamente i consensi
            sopra indicati con piena consapevolezza delle conseguenze.
        </div>
    </div>

    <div class="footer">
        <p><strong>OMNILY PRO S.r.l.</strong> - Sistema di Gestione Clienti e Loyalty Program</p>
        <p>📄 <strong>Documento ID:</strong> ${documentId} | 📅 <strong>Generato il:</strong> ${new Date().toLocaleString('it-IT')}</p>
        <p>✅ <strong>Validità legale:</strong> Documento conforme al GDPR (UE) 2016/679 e al Codice Privacy D.Lgs. 196/2003</p>
        <p>🔐 <strong>Firma elettronica:</strong> Conforme al Regolamento eIDAS (UE) 910/2014</p>
        <p><em>Questo documento è stato generato automaticamente dal sistema e costituisce prova del consenso espresso dall'interessato.</em></p>
    </div>
</body>
</html>`
  }

  const handleDownloadPrivacy = () => {
    if (!customer.signature_data) return

    // Genera il documento HTML completo
    const consentDocument = generateConsentDocument()
    const blob = new Blob([consentDocument], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `consenso-privacy-${customer.name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="edit-customer-overlay" onClick={onClose} />

      {/* Side Panel */}
      <div
        className={`edit-customer-panel ${isOpen ? 'open' : ''}`}
        style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}
      >
        {/* Header */}
        <div className="edit-customer-header">
          <div className="edit-customer-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={28} />
              <div>
                <h2>Modifica Dati Cliente</h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  Aggiorna le informazioni e l'avatar di {customer.name}
                </p>
              </div>
            </div>
          </div>
          <button className="edit-customer-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="edit-customer-content">
          {/* Avatar Section */}
          <div className="edit-customer-avatar-section">
            <div className="avatar-preview-wrapper">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={customer.name}
                  className="avatar-preview-image"
                />
              ) : (
                <div className="avatar-preview-placeholder" style={{ background: primaryColor }}>
                  <span>{getInitials(customer.name)}</span>
                </div>
              )}
              {isUploading && (
                <div className="avatar-upload-overlay">
                  <Loader className="spinner" size={32} />
                </div>
              )}
            </div>

            <div className="avatar-upload-buttons">
              {/* Mostra "Scatta Foto" solo su dispositivi touch (mobile/tablet) */}
              {isTouchDevice && (
                <button
                  className="avatar-upload-btn camera"
                  onClick={handleCameraClick}
                  disabled={isUploading}
                >
                  <Camera size={20} />
                  Scatta Foto
                </button>
              )}
              <button
                className="avatar-upload-btn gallery"
                onClick={handleGalleryClick}
                disabled={isUploading}
              >
                <Upload size={20} />
                Carica {isTouchDevice ? 'Foto' : 'Immagine'}
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
          </div>

          {/* Form Fields */}
          <div className="edit-customer-form">
            {/* Nome */}
            <div className="form-group">
              <label>
                <User size={18} />
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Mario Rossi"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="mario.rossi@example.com"
              />
            </div>

            {/* Password per Accesso App */}
            <div className="form-group">
              <label>
                <Lock size={18} />
                Password App Cliente
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  handleInputChange('password', e.target.value)
                  setPasswordSuccess(false)
                  setPasswordError(null)
                }}
                placeholder="Minimo 6 caratteri"
              />
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Imposta una password per permettere al cliente di accedere all'app. Lascia vuoto per non modificare.
              </small>
              {passwordSuccess && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#d1fae5',
                  border: '1px solid #10b981',
                  borderRadius: '0.375rem',
                  color: '#065f46',
                  fontSize: '0.875rem'
                }}>
                  <CheckCircle size={16} />
                  <span>Password impostata con successo! Il cliente può ora accedere all'app.</span>
                </div>
              )}
              {passwordError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '0.375rem',
                  color: '#991b1b',
                  fontSize: '0.875rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Telefono */}
            <div className="form-group">
              <label>
                <Phone size={18} />
                Telefono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+39 333 1234567"
              />
            </div>

            {/* Indirizzo con Autocomplete Google */}
            <div className="form-group">
              <label>
                <MapPin size={18} />
                Indirizzo
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(address) => handleInputChange('address', address)}
                placeholder="Via Roma 123, Milano"
              />
            </div>

            {/* Genere */}
            <div className="form-group">
              <label>
                <Users size={18} />
                Genere
              </label>
              <div className="gender-options">
                <label className={`gender-option ${formData.gender === 'male' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  />
                  <span>👨 Maschio</span>
                </label>
                <label className={`gender-option ${formData.gender === 'female' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  />
                  <span>👩 Femmina</span>
                </label>
              </div>
            </div>

            {/* Data di Nascita */}
            <div className="form-group">
              <label>
                <Calendar size={18} />
                Data di Nascita
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
            </div>

            {/* Marketing Consent */}
            <div className="form-group-toggle">
              <div className="toggle-header">
                <div className="toggle-label">
                  <UserCheck size={18} />
                  <span>Consenso Marketing</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.marketing_consent}
                    onChange={(e) => handleInputChange('marketing_consent', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="toggle-description">Accetta di ricevere comunicazioni promozionali</p>
            </div>

            {/* Notifications Enabled */}
            <div className="form-group-toggle">
              <div className="toggle-header">
                <div className="toggle-label">
                  <Bell size={18} />
                  <span>Notifiche Attive</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.notifications_enabled}
                    onChange={(e) => handleInputChange('notifications_enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="toggle-description">Riceve notifiche email sui suoi punti e premi</p>
            </div>

            {/* Codice Referral */}
            <div className="form-group">
              <label>
                <Gift size={18} />
                Codice Referral
              </label>
              <input
                type="text"
                value={formData.referral_code}
                onChange={(e) => handleInputChange('referral_code', e.target.value)}
                placeholder="Codice referral del cliente"
              />
            </div>

            {/* Referito da */}
            <div className="form-group">
              <label>
                <Users size={18} />
                Referito da
              </label>
              <input
                type="text"
                value={formData.referred_by}
                onChange={(e) => handleInputChange('referred_by', e.target.value)}
                placeholder="Chi ha riferito questo cliente"
              />
            </div>

            {/* Note */}
            <div className="form-group">
              <label>
                <FileText size={18} />
                Note Interne
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Aggiungi note o informazioni aggiuntive sul cliente..."
                rows={4}
              />
            </div>

            {/* Privacy Info - Solo visualizzazione */}
            {customer.privacy_consent && (
              <div className="privacy-info-box">
                <div className="privacy-info-header">
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                  <span>Privacy Firmata</span>
                </div>
                <div className="privacy-info-content">
                  {customer.privacy_signed_at && (
                    <p>
                      <strong>Data firma:</strong>{' '}
                      {new Date(customer.privacy_signed_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  {customer.signature_data && (
                    <div className="signature-preview">
                      <div className="signature-preview-header">
                        <strong>Firma:</strong>
                        <button
                          className="download-privacy-btn"
                          onClick={handleDownloadPrivacy}
                          title="Scarica Privacy Firmata"
                        >
                          <Download size={16} />
                          Scarica
                        </button>
                      </div>
                      <img src={customer.signature_data} alt="Firma cliente" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="edit-customer-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isSaving}>
            Annulla
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isSaving || !formData.name || !formData.email}
            style={{ background: primaryColor }}
          >
            {isSaving ? (
              <>
                <Loader className="spinner" size={18} />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <span style={{ fontSize: '1.125rem', fontWeight: '500' }}>{toast.message}</span>
        </div>
      )}
    </>
  )
}

export default EditCustomerModal
