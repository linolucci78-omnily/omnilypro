import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { createPrintService } from '../services/printService'
import {
  Printer,
  Save,
  RefreshCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Ruler,
  Move,
  Type,
  Sparkles,
  Palette,
  Info,
  CheckCircle,
  XCircle,
  X,
  Upload,
  Play
} from 'lucide-react'
import './ReceiptLayoutEditor.css'

interface ReceiptLayoutSettings {
  id?: string
  organization_id: string
  line_spacing: number
  section_spacing: number
  header_alignment: 'left' | 'center' | 'right'
  items_alignment: 'left' | 'center' | 'right'
  footer_alignment: 'left' | 'center' | 'right'
  font_size_small: number
  font_size_normal: number
  font_size_large: number
  show_logo: boolean
  logo_url: string | null
  logo_size: 'small' | 'medium' | 'large'
  logo_alignment: 'left' | 'center' | 'right'
  show_qr_code: boolean
  qr_alignment: 'left' | 'center' | 'right'
  show_separator_lines: boolean
  show_thank_you_message: boolean
  thank_you_message: string
  paper_width: number
  font_family: 'courier' | 'monospace' | 'sans-serif'
  header_text: string
  show_store_info: boolean
  qr_size: 'small' | 'medium' | 'large'
  bold_totals: boolean
  show_operator: boolean
}

interface ReceiptLayoutEditorProps {
  organizationId: string
  organizationName: string
  onClose?: () => void
}

const ReceiptLayoutEditor: React.FC<ReceiptLayoutEditorProps> = ({
  organizationId,
  organizationName,
  onClose
}) => {
  const [settings, setSettings] = useState<ReceiptLayoutSettings>({
    organization_id: organizationId,
    line_spacing: 1,
    section_spacing: 1,
    header_alignment: 'center',
    items_alignment: 'left',
    footer_alignment: 'center',
    font_size_small: 20,
    font_size_normal: 24,
    font_size_large: 30,
    show_logo: false,
    logo_url: null,
    logo_size: 'medium',
    logo_alignment: 'center',
    show_qr_code: true,
    qr_alignment: 'center',
    show_separator_lines: true,
    show_thank_you_message: true,
    thank_you_message: 'Grazie per la visita!',
    paper_width: 384,
    font_family: 'courier',
    header_text: 'SCONTRINO FISCALE',
    show_store_info: true,
    qr_size: 'medium',
    bold_totals: true,
    show_operator: true
  })

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [printingTest, setPrintingTest] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Preset templates
  const presets = {
    minimal: {
      name: 'Minimal',
      settings: {
        line_spacing: 0,
        section_spacing: 1,
        header_alignment: 'center' as const,
        items_alignment: 'left' as const,
        footer_alignment: 'center' as const,
        font_size_small: 18,
        font_size_normal: 22,
        font_size_large: 28,
        show_separator_lines: false,
        font_family: 'sans-serif' as const,
        bold_totals: true
      }
    },
    classic: {
      name: 'Classic',
      settings: {
        line_spacing: 1,
        section_spacing: 1,
        header_alignment: 'center' as const,
        items_alignment: 'left' as const,
        footer_alignment: 'center' as const,
        font_size_small: 20,
        font_size_normal: 24,
        font_size_large: 30,
        show_separator_lines: true,
        font_family: 'courier' as const,
        bold_totals: true
      }
    },
    compact: {
      name: 'Compact',
      settings: {
        line_spacing: 0,
        section_spacing: 0,
        header_alignment: 'left' as const,
        items_alignment: 'left' as const,
        footer_alignment: 'left' as const,
        font_size_small: 16,
        font_size_normal: 20,
        font_size_large: 24,
        show_separator_lines: true,
        font_family: 'monospace' as const,
        bold_totals: false
      }
    },
    elegant: {
      name: 'Elegant',
      settings: {
        line_spacing: 2,
        section_spacing: 2,
        header_alignment: 'center' as const,
        items_alignment: 'center' as const,
        footer_alignment: 'center' as const,
        font_size_small: 22,
        font_size_normal: 26,
        font_size_large: 32,
        show_separator_lines: true,
        font_family: 'sans-serif' as const,
        bold_totals: true
      }
    }
  }

  const applyPreset = (presetKey: keyof typeof presets) => {
    const preset = presets[presetKey]
    setSettings({ ...settings, ...preset.settings })
  }

  // Carica impostazioni esistenti
  useEffect(() => {
    loadSettings()
  }, [organizationId])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const loadSettings = async () => {
    try {
      // Load organization light logo (white logo for receipts)
      const { data: orgData } = await supabase
        .from('organizations')
        .select('logo_light')
        .eq('id', organizationId)
        .single()

      // Load receipt layout settings
      const { data, error } = await supabase
        .from('receipt_layout_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (data && !error) {
        // If no logo_url in settings, use organization light logo
        if (!data.logo_url && orgData?.logo_light) {
          setSettings({ ...data, logo_url: orgData.logo_light })
        } else {
          setSettings(data)
        }
      } else {
        // No settings exist, use organization light logo in defaults
        if (orgData?.logo_light) {
          setSettings(prev => ({ ...prev, logo_url: orgData.logo_light }))
        }
      }
    } catch (error) {
      console.log('Nessuna configurazione esistente, uso valori di default')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from('receipt_layout_settings')
        .select('id')
        .eq('organization_id', organizationId)
        .single()

      if (existing) {
        // Update
        await supabase
          .from('receipt_layout_settings')
          .update(settings)
          .eq('id', existing.id)
      } else {
        // Insert
        await supabase
          .from('receipt_layout_settings')
          .insert([settings])
      }

      setNotification({ type: 'success', message: 'Configurazione salvata con successo!' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Errore nel salvataggio' })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetClick = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    setSettings({
      ...settings,
      line_spacing: 1,
      section_spacing: 1,
      header_alignment: 'center',
      items_alignment: 'left',
      footer_alignment: 'center',
      font_size_small: 20,
      font_size_normal: 24,
      font_size_large: 30,
      show_logo: false,
      logo_size: 'medium',
      logo_alignment: 'center',
      show_qr_code: true,
      qr_alignment: 'center',
      show_separator_lines: true,
      show_thank_you_message: true,
      thank_you_message: 'Grazie per la visita!',
      font_family: 'courier',
      header_text: 'SCONTRINO FISCALE',
      show_store_info: true,
      qr_size: 'medium',
      bold_totals: true
    })
    setShowResetConfirm(false)
    setNotification({ type: 'success', message: 'Impostazioni ripristinate ai valori predefiniti' })
  }

  const printTestReceipt = async () => {
    setPrintingTest(true)
    try {
      console.log('🖨️ Stampa scontrino di prova...')

      // Config stampante
      const printConfig = {
        storeName: organizationName,
        storeAddress: '',
        storePhone: '',
        storeTax: '',
        paperWidth: 384,
        fontSizeNormal: 24,
        fontSizeLarge: 32,
        printDensity: 3,
        layoutSettings: settings
      }

      // Dati scontrino di prova
      const testReceiptData = {
        receiptNumber: 'TEST001',
        timestamp: new Date(),
        items: [
          { name: 'Caffè Espresso', quantity: 2, price: 1.50, total: 3.00 },
          { name: 'Cornetto', quantity: 1, price: 2.50, total: 2.50 },
          { name: 'Acqua Naturale', quantity: 1, price: 1.00, total: 1.00 }
        ],
        subtotal: 6.50,
        tax: 1.43,
        total: 7.93,
        paymentMethod: 'Contanti',
        cashierName: 'Test Operatore',
        customerPoints: 8,
        loyaltyCard: 'test-customer-id'
      }

      // Crea servizio stampa e stampa
      const printService = createPrintService(printConfig)
      const initialized = await printService.initialize()

      if (initialized) {
        const printed = await printService.printReceiptOptimized(testReceiptData)
        if (printed) {
          console.log('✅ Scontrino di prova stampato con successo!')
          setNotification({ type: 'success', message: 'Scontrino di prova stampato con successo!' })
        } else {
          console.error('❌ Errore durante la stampa dello scontrino di prova')
          setNotification({ type: 'error', message: 'Errore durante la stampa dello scontrino' })
        }
      } else {
        console.error('❌ Impossibile inizializzare la stampante')
        setNotification({ type: 'error', message: 'Impossibile inizializzare la stampante' })
      }
    } catch (error) {
      console.error('❌ Errore stampa scontrino di prova:', error)
      setNotification({ type: 'error', message: 'Errore durante la stampa' })
    } finally {
      setPrintingTest(false)
    }
  }

  const getAlignmentStyle = (alignment: string) => {
    return { textAlign: alignment as 'left' | 'center' | 'right' }
  }

  const getLogoSize = () => {
    switch (settings.logo_size) {
      case 'small': return '48px'
      case 'large': return '96px'
      default: return '64px'
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>Caricamento...</div>
  }

  return (
    <div className="receipt-editor-container">
      <div className="receipt-editor-header">
        <h2>
          <Printer />
          Editor Layout Scontrini
        </h2>
        <p>Personalizza l'aspetto dei tuoi scontrini stampati</p>
        <div className="receipt-editor-actions">
          <button
            onClick={printTestReceipt}
            disabled={printingTest}
            className="receipt-editor-btn"
            style={{ backgroundColor: '#10b981', color: 'white' }}
          >
            <Play size={18} />
            {printingTest ? 'Stampa...' : 'Test Stampa'}
          </button>
          <button
            onClick={handleResetClick}
            className="receipt-editor-btn receipt-editor-btn-reset"
          >
            <RefreshCw size={18} />
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="receipt-editor-btn receipt-editor-btn-save"
          >
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Preset Templates */}
      <div className="receipt-editor-card">
        <h3><Palette size={20} /> Template Pronti - Inizia da qui!</h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Scegli un template e personalizzalo, oppure crea il tuo da zero
        </p>
        <div className="receipt-editor-presets">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              className="receipt-editor-preset-btn"
              onClick={() => applyPreset(key as keyof typeof presets)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="receipt-editor-grid">
        {/* CONTROLLI */}
        <div className="receipt-editor-controls">
          {/* Spaziature */}
          <div className="receipt-editor-card">
            <h3><Ruler size={20} /> Spaziature</h3>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Spazio tra righe: {settings.line_spacing}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={settings.line_spacing}
                onChange={(e) => setSettings({ ...settings, line_spacing: parseInt(e.target.value) })}
                className="receipt-editor-slider"
              />
            </div>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Spazio tra sezioni: {settings.section_spacing}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={settings.section_spacing}
                onChange={(e) => setSettings({ ...settings, section_spacing: parseInt(e.target.value) })}
                className="receipt-editor-slider"
              />
            </div>
          </div>

          {/* Allineamento */}
          <div className="receipt-editor-card">
            <h3><Move size={20} /> Allineamento</h3>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Intestazione
              </label>
              <div className="receipt-editor-button-group">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSettings({ ...settings, header_alignment: align as any })
                    }}
                    className={`receipt-editor-align-btn ${settings.header_alignment === align ? 'active' : ''}`}
                  >
                    {align === 'left' && <AlignLeft size={20} />}
                    {align === 'center' && <AlignCenter size={20} />}
                    {align === 'right' && <AlignRight size={20} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Articoli
              </label>
              <div className="receipt-editor-button-group">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSettings({ ...settings, items_alignment: align as any })
                    }}
                    className={`receipt-editor-align-btn ${settings.items_alignment === align ? 'active' : ''}`}
                  >
                    {align === 'left' && <AlignLeft size={20} />}
                    {align === 'center' && <AlignCenter size={20} />}
                    {align === 'right' && <AlignRight size={20} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Piè di pagina
              </label>
              <div className="receipt-editor-button-group">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSettings({ ...settings, footer_alignment: align as any })
                    }}
                    className={`receipt-editor-align-btn ${settings.footer_alignment === align ? 'active' : ''}`}
                  >
                    {align === 'left' && <AlignLeft size={20} />}
                    {align === 'center' && <AlignCenter size={20} />}
                    {align === 'right' && <AlignRight size={20} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dimensioni Font */}
          <div className="receipt-editor-card">
            <h3><Type size={20} /> Dimensioni Testo</h3>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Testo piccolo: {settings.font_size_small}px
              </label>
              <input
                type="range"
                min="16"
                max="28"
                value={settings.font_size_small}
                onChange={(e) => setSettings({ ...settings, font_size_small: parseInt(e.target.value) })}
                className="receipt-editor-slider"
              />
            </div>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Testo normale: {settings.font_size_normal}px
              </label>
              <input
                type="range"
                min="20"
                max="32"
                value={settings.font_size_normal}
                onChange={(e) => setSettings({ ...settings, font_size_normal: parseInt(e.target.value) })}
                className="receipt-editor-slider"
              />
            </div>

            <div className="receipt-editor-field">
              <label className="receipt-editor-label">
                Testo grande: {settings.font_size_large}px
              </label>
              <input
                type="range"
                min="24"
                max="40"
                value={settings.font_size_large}
                onChange={(e) => setSettings({ ...settings, font_size_large: parseInt(e.target.value) })}
                className="receipt-editor-slider"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="receipt-editor-card">
            <h3><ImageIcon size={20} /> Logo</h3>

            <div className="receipt-editor-field">
              <label className="receipt-editor-checkbox-label">
                <span className="receipt-editor-checkbox-text">Mostra logo</span>
                <label className="receipt-editor-toggle">
                  <input
                    type="checkbox"
                    checked={settings.show_logo}
                    onChange={(e) => setSettings({ ...settings, show_logo: e.target.checked })}
                  />
                  <span className="receipt-editor-toggle-slider"></span>
                </label>
              </label>
            </div>

            {settings.show_logo && (
              <>
                <div className="receipt-editor-info">
                  <Info size={16} />
                  <span>Il logo bianco viene caricato automaticamente dalla sezione Branding dell'organizzazione</span>
                </div>

                <div className="receipt-editor-field">
                  <label className="receipt-editor-label">
                    Dimensione logo
                  </label>
                  <select
                    value={settings.logo_size}
                    onChange={(e) => setSettings({ ...settings, logo_size: e.target.value as any })}
                    className="receipt-editor-select"
                  >
                    <option value="small">Piccolo</option>
                    <option value="medium">Medio</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                <div className="receipt-editor-field">
                  <label className="receipt-editor-label">
                    Allineamento logo
                  </label>
                  <div className="receipt-editor-button-group">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSettings({ ...settings, logo_alignment: align as any })
                        }}
                        className={`receipt-editor-align-btn ${settings.logo_alignment === align ? 'active' : ''}`}
                      >
                        {align === 'left' && <AlignLeft size={20} />}
                        {align === 'center' && <AlignCenter size={20} />}
                        {align === 'right' && <AlignRight size={20} />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Elementi */}
          <div className="receipt-editor-card">
            <h3><Sparkles size={20} /> Elementi</h3>

            <div className="receipt-editor-checkbox-group">
              <label className="receipt-editor-checkbox-label">
                <span className="receipt-editor-checkbox-text">Mostra QR code</span>
                <label className="receipt-editor-toggle">
                  <input
                    type="checkbox"
                    checked={settings.show_qr_code}
                    onChange={(e) => setSettings({ ...settings, show_qr_code: e.target.checked })}
                  />
                  <span className="receipt-editor-toggle-slider"></span>
                </label>
              </label>

              {settings.show_qr_code && (
                <div className="receipt-editor-field">
                  <label className="receipt-editor-label">
                    Allineamento QR code
                  </label>
                  <div className="receipt-editor-button-group">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSettings({ ...settings, qr_alignment: align as any })
                        }}
                        className={`receipt-editor-align-btn ${settings.qr_alignment === align ? 'active' : ''}`}
                      >
                        {align === 'left' && <AlignLeft size={20} />}
                        {align === 'center' && <AlignCenter size={20} />}
                        {align === 'right' && <AlignRight size={20} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="receipt-editor-field">
                <label className="receipt-editor-label">
                  Testo intestazione
                </label>
                <input
                  type="text"
                  value={settings.header_text}
                  onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
                  placeholder="SCONTRINO FISCALE"
                  className="receipt-editor-input"
                />
              </div>

              <label className="receipt-editor-checkbox-label">
                <span className="receipt-editor-checkbox-text">Mostra linee separatrici</span>
                <label className="receipt-editor-toggle">
                  <input
                    type="checkbox"
                    checked={settings.show_separator_lines}
                    onChange={(e) => setSettings({ ...settings, show_separator_lines: e.target.checked })}
                  />
                  <span className="receipt-editor-toggle-slider"></span>
                </label>
              </label>

              <label className="receipt-editor-checkbox-label">
                <span className="receipt-editor-checkbox-text">Mostra messaggio di ringraziamento</span>
                <label className="receipt-editor-toggle">
                  <input
                    type="checkbox"
                    checked={settings.show_thank_you_message}
                    onChange={(e) => setSettings({ ...settings, show_thank_you_message: e.target.checked })}
                  />
                  <span className="receipt-editor-toggle-slider"></span>
                </label>
              </label>

              {settings.show_thank_you_message && (
                <div className="receipt-editor-field">
                  <input
                    type="text"
                    value={settings.thank_you_message}
                    onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })}
                    placeholder="Grazie per la visita!"
                    className="receipt-editor-input"
                  />
                </div>
              )}

              <label className="receipt-editor-checkbox-label">
                <span className="receipt-editor-checkbox-text">Mostra operatore</span>
                <label className="receipt-editor-toggle">
                  <input
                    type="checkbox"
                    checked={settings.show_operator}
                    onChange={(e) => setSettings({ ...settings, show_operator: e.target.checked })}
                  />
                  <span className="receipt-editor-toggle-slider"></span>
                </label>
              </label>
            </div>

            <div className="receipt-editor-info">
              <Info size={16} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
              <span>Le modifiche verranno applicate a tutti i tipi di stampa: scontrini, voucher, tessere fedeltà, ecc.</span>
            </div>
          </div>
        </div>

        {/* ANTEPRIMA */}
        <div className="receipt-editor-preview-container">
          <div className="receipt-editor-preview-card">
            <h3>
              <Printer size={20} />
              Anteprima
            </h3>

            <div className="receipt-editor-preview-wrapper">
              <div
                className="receipt-preview-paper"
                style={{
                  width: `${settings.paper_width}px`
                }}
              >
                {/* Logo */}
                {settings.show_logo && settings.logo_url && (
                  <div style={{ ...getAlignmentStyle(settings.logo_alignment), marginBottom: `${settings.section_spacing * 0.5}rem` }}>
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="receipt-preview-logo"
                      style={{ maxHeight: getLogoSize() }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Header */}
                <div style={{ marginBottom: `${settings.section_spacing * 0.5}rem` }}>
                  <div style={{ ...getAlignmentStyle(settings.header_alignment), fontSize: `${settings.font_size_large}px`, fontWeight: 'bold', marginBottom: `${settings.line_spacing * 0.25}rem` }}>
                    {organizationName}
                  </div>
                  <div style={{ ...getAlignmentStyle(settings.header_alignment), fontSize: `${settings.font_size_normal}px` }}>
                    {settings.header_text}
                  </div>
                </div>

                {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}

                {/* Info */}
                <div style={{ marginBottom: `${settings.section_spacing * 0.5}rem`, fontSize: `${settings.font_size_small}px` }}>
                  <div style={{ marginBottom: `${settings.line_spacing * 0.25}rem` }}>N. 0001</div>
                  <div style={{ marginBottom: `${settings.line_spacing * 0.25}rem` }}>Data: {new Date().toLocaleString('it-IT')}</div>
                  <div>Operatore: Demo</div>
                </div>

                {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}

                {/* Items */}
                <div style={{ marginBottom: `${settings.section_spacing * 0.5}rem` }}>
                  <div style={{ ...getAlignmentStyle(settings.items_alignment), fontSize: `${settings.font_size_normal}px`, fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    ARTICOLI
                  </div>
                  {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}
                  <div style={{ fontSize: `${settings.font_size_small}px`, marginTop: '0.5rem' }}>
                    <div style={{ ...getAlignmentStyle(settings.items_alignment), marginBottom: `${settings.line_spacing * 0.25}rem` }}>2x Caffè Espresso €3.00</div>
                    <div style={{ ...getAlignmentStyle(settings.items_alignment) }}>1x Cornetto €2.50</div>
                  </div>
                </div>

                {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}

                {/* Totals */}
                <div style={{ marginBottom: `${settings.section_spacing * 0.5}rem`, fontSize: `${settings.font_size_small}px` }}>
                  <div style={{ marginBottom: `${settings.line_spacing * 0.25}rem` }}>Subtotale: €5.50</div>
                  <div style={{ marginBottom: `${settings.line_spacing * 0.25}rem` }}>IVA (22%): €1.21</div>
                  {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}
                  <div style={{ fontWeight: 'bold', fontSize: `${settings.font_size_normal}px`, marginBottom: `${settings.line_spacing * 0.25}rem` }}>TOTALE: €6.71</div>
                  {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}
                  <div>Pagamento: Contanti</div>
                </div>

                {/* Footer */}
                {settings.show_thank_you_message && (
                  <>
                    {settings.show_separator_lines && <div className="receipt-preview-separator"></div>}
                    <div style={{ ...getAlignmentStyle(settings.footer_alignment), marginBottom: `${settings.section_spacing * 0.5}rem`, fontSize: `${settings.font_size_normal}px` }}>
                      {settings.thank_you_message}
                    </div>
                  </>
                )}

                {/* QR Code */}
                {settings.show_qr_code && (
                  <div style={{ ...getAlignmentStyle(settings.qr_alignment), marginBottom: `${settings.section_spacing * 0.5}rem` }}>
                    <div className="receipt-preview-qr-placeholder"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="receipt-editor-info" style={{ marginTop: '1rem' }}>
              <Info size={16} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
              <span>Questa è un'anteprima approssimativa. L'aspetto finale sulla stampante termica potrebbe variare leggermente.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            background: notification.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 1000,
            animation: 'slideInRight 0.3s ease-out',
            minWidth: '300px',
            maxWidth: '500px'
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#1f2937' }}>
              Ripristinare impostazioni?
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', lineHeight: 1.6 }}>
              Tutte le impostazioni personalizzate verranno perse e ripristinate ai valori predefiniti. Questa azione non può essere annullata.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                Annulla
              </button>
              <button
                onClick={confirmReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Ripristina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ReceiptLayoutEditor
