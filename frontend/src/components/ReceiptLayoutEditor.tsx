import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Printer, Save, RefreshCw, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from 'lucide-react'

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
  show_qr_code: boolean
  show_separator_lines: boolean
  show_thank_you_message: boolean
  thank_you_message: string
  paper_width: number
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
    show_qr_code: true,
    show_separator_lines: true,
    show_thank_you_message: true,
    thank_you_message: 'Grazie per la visita!',
    paper_width: 384
  })

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Carica impostazioni esistenti
  useEffect(() => {
    loadSettings()
  }, [organizationId])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('receipt_layout_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (data && !error) {
        setSettings(data)
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

      alert('✅ Configurazione salvata con successo!')
    } catch (error) {
      alert('❌ Errore nel salvataggio')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Ripristinare le impostazioni predefinite?')) {
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
        show_qr_code: true,
        show_separator_lines: true,
        show_thank_you_message: true,
        thank_you_message: 'Grazie per la visita!'
      })
    }
  }

  const getAlignmentStyle = (alignment: string) => {
    switch (alignment) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  const getLogoSize = () => {
    switch (settings.logo_size) {
      case 'small': return 'h-12'
      case 'large': return 'h-24'
      default: return 'h-16'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Caricamento...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Printer className="w-6 h-6" />
            Editor Layout Scontrini
          </h2>
          <p className="text-gray-600 mt-1">
            Personalizza l'aspetto dei tuoi scontrini stampati
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONTROLLI */}
        <div className="space-y-6">
          {/* Spaziature */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📏 Spaziature</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spazio tra righe: {settings.line_spacing}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={settings.line_spacing}
                  onChange={(e) => setSettings({ ...settings, line_spacing: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spazio tra sezioni: {settings.section_spacing}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={settings.section_spacing}
                  onChange={(e) => setSettings({ ...settings, section_spacing: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Allineamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📐 Allineamento</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intestazione
                </label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => setSettings({ ...settings, header_alignment: align as any })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        settings.header_alignment === align
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Articoli
                </label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => setSettings({ ...settings, items_alignment: align as any })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        settings.items_alignment === align
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Piè di pagina
                </label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => setSettings({ ...settings, footer_alignment: align as any })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        settings.footer_alignment === align
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dimensioni Font */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔤 Dimensioni Testo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testo piccolo: {settings.font_size_small}px
                </label>
                <input
                  type="range"
                  min="16"
                  max="28"
                  value={settings.font_size_small}
                  onChange={(e) => setSettings({ ...settings, font_size_small: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testo normale: {settings.font_size_normal}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="32"
                  value={settings.font_size_normal}
                  onChange={(e) => setSettings({ ...settings, font_size_normal: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testo grande: {settings.font_size_large}px
                </label>
                <input
                  type="range"
                  min="24"
                  max="40"
                  value={settings.font_size_large}
                  onChange={(e) => setSettings({ ...settings, font_size_large: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🖼️ Logo</h3>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_logo}
                  onChange={(e) => setSettings({ ...settings, show_logo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Mostra logo</span>
              </label>

              {settings.show_logo && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Logo
                    </label>
                    <input
                      type="text"
                      value={settings.logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dimensione logo
                    </label>
                    <select
                      value={settings.logo_size}
                      onChange={(e) => setSettings({ ...settings, logo_size: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="small">Piccolo</option>
                      <option value="medium">Medio</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Elementi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">✨ Elementi</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_qr_code}
                  onChange={(e) => setSettings({ ...settings, show_qr_code: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Mostra QR code</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_separator_lines}
                  onChange={(e) => setSettings({ ...settings, show_separator_lines: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Mostra linee separatrici</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_thank_you_message}
                  onChange={(e) => setSettings({ ...settings, show_thank_you_message: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Mostra messaggio di ringraziamento</span>
              </label>

              {settings.show_thank_you_message && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={settings.thank_you_message}
                    onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })}
                    placeholder="Grazie per la visita!"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ANTEPRIMA */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">👁️ Anteprima</h3>

            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[800px]">
              <div
                className="bg-white mx-auto font-mono text-xs leading-tight"
                style={{
                  width: `${settings.paper_width}px`,
                  padding: '20px'
                }}
              >
                {/* Logo */}
                {settings.show_logo && settings.logo_url && (
                  <div className={`mb-${settings.section_spacing} ${getAlignmentStyle(settings.header_alignment)}`}>
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className={`${getLogoSize()} object-contain inline-block`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Header */}
                <div className={`mb-${settings.section_spacing} space-y-${settings.line_spacing}`}>
                  <div className={getAlignmentStyle(settings.header_alignment)} style={{ fontSize: `${settings.font_size_large}px` }}>
                    {organizationName}
                  </div>
                  <div className={getAlignmentStyle(settings.header_alignment)} style={{ fontSize: `${settings.font_size_normal}px` }}>
                    SCONTRINO FISCALE
                  </div>
                </div>

                {settings.show_separator_lines && <div className="border-t border-gray-400 my-2"></div>}

                {/* Info */}
                <div className={`mb-${settings.section_spacing} space-y-${settings.line_spacing}`} style={{ fontSize: `${settings.font_size_small}px` }}>
                  <div>N. 0001</div>
                  <div>Data: {new Date().toLocaleString('it-IT')}</div>
                  <div>Operatore: Demo</div>
                </div>

                {settings.show_separator_lines && <div className="border-t border-gray-400 my-2"></div>}

                {/* Items */}
                <div className={`mb-${settings.section_spacing}`}>
                  <div className={`${getAlignmentStyle(settings.items_alignment)} font-bold mb-2`} style={{ fontSize: `${settings.font_size_normal}px` }}>
                    ARTICOLI
                  </div>
                  {settings.show_separator_lines && <div className="border-t border-gray-400 my-1"></div>}
                  <div className={`space-y-${settings.line_spacing} mt-2`} style={{ fontSize: `${settings.font_size_small}px` }}>
                    <div className={getAlignmentStyle(settings.items_alignment)}>2x Caffè Espresso €3.00</div>
                    <div className={getAlignmentStyle(settings.items_alignment)}>1x Cornetto €2.50</div>
                  </div>
                </div>

                {settings.show_separator_lines && <div className="border-t border-gray-400 my-2"></div>}

                {/* Totals */}
                <div className={`mb-${settings.section_spacing} space-y-${settings.line_spacing}`} style={{ fontSize: `${settings.font_size_small}px` }}>
                  <div>Subtotale: €5.50</div>
                  <div>IVA (22%): €1.21</div>
                  {settings.show_separator_lines && <div className="border-t border-gray-400 my-1"></div>}
                  <div className="font-bold" style={{ fontSize: `${settings.font_size_normal}px` }}>TOTALE: €6.71</div>
                  {settings.show_separator_lines && <div className="border-t border-gray-400 my-1"></div>}
                  <div>Pagamento: Contanti</div>
                </div>

                {/* Footer */}
                {settings.show_thank_you_message && (
                  <>
                    {settings.show_separator_lines && <div className="border-t border-gray-400 my-2"></div>}
                    <div className={`mb-${settings.section_spacing} ${getAlignmentStyle(settings.footer_alignment)}`} style={{ fontSize: `${settings.font_size_normal}px` }}>
                      {settings.thank_you_message}
                    </div>
                  </>
                )}

                {/* QR Code */}
                {settings.show_qr_code && (
                  <div className={`mb-${settings.section_spacing} ${getAlignmentStyle(settings.footer_alignment)}`}>
                    <div className="w-24 h-24 bg-gray-200 inline-block"></div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              ℹ️ Questa è un'anteprima approssimativa. L'aspetto finale sulla stampante termica potrebbe variare leggermente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptLayoutEditor
