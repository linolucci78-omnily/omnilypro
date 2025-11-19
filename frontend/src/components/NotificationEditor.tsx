import { useState } from 'react'
import { Bell, Send, Eye, Save, Sparkles, PartyPopper, Trophy, Coins } from 'lucide-react'
import './NotificationEditor.css'

// =====================================================
// Types
// =====================================================
type AnimationType = 'none' | 'points' | 'confetti' | 'trophy' | 'sparkles'
type TargetAudience = 'all' | 'tier' | 'specific'

interface NotificationTemplate {
  id?: string
  name: string
  category: 'welcome' | 'points_earned' | 'tier_upgrade' | 'promotion' | 'custom'
  title: string
  message: string
  animationType: AnimationType
  animationData: Record<string, any>
}

interface NotificationEditorProps {
  organizationId: string
  onSave?: (template: NotificationTemplate) => void
  onSend?: (campaign: any) => void
}

// =====================================================
// NotificationEditor Component
// =====================================================
export default function NotificationEditor({
  organizationId,
  onSave,
  onSend
}: NotificationEditorProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'templates'>('create')

  // Form state
  const [templateName, setTemplateName] = useState('')
  const [category, setCategory] = useState<NotificationTemplate['category']>('custom')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [animationType, setAnimationType] = useState<AnimationType>('none')
  const [animationData, setAnimationData] = useState<Record<string, any>>({})

  // Audience targeting
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all')
  const [selectedTier, setSelectedTier] = useState('bronze')

  // Preview state
  const [showPreview, setShowPreview] = useState(false)

  // =====================================================
  // Handlers
  // =====================================================
  const handleSaveTemplate = () => {
    const template: NotificationTemplate = {
      name: templateName,
      category,
      title,
      message,
      animationType,
      animationData
    }

    console.log('Saving template:', template)
    onSave?.(template)

    // Reset form
    setTemplateName('')
    setTitle('')
    setMessage('')
    setAnimationType('none')
    setAnimationData({})
  }

  const handleSendNow = () => {
    const campaign = {
      organizationId,
      title,
      message,
      animationType,
      animationData,
      targetAudience,
      selectedTier: targetAudience === 'tier' ? selectedTier : undefined
    }

    console.log('Sending campaign:', campaign)
    onSend?.(campaign)
  }

  const handleTestAnimation = () => {
    // Trigger local animation test
    window.dispatchEvent(new CustomEvent('onesignal-animation', {
      detail: {
        type: animationType,
        data: animationData
      }
    }))
  }

  // =====================================================
  // Animation Config
  // =====================================================
  const animationOptions = [
    { value: 'none', label: 'Nessuna Animazione', icon: null },
    { value: 'points', label: 'Coin Fountain', icon: Coins, color: 'text-yellow-600' },
    { value: 'confetti', label: 'Confetti', icon: PartyPopper, color: 'text-pink-600' },
    { value: 'trophy', label: 'Trophy', icon: Trophy, color: 'text-purple-600' },
    { value: 'sparkles', label: 'Sparkles', icon: Sparkles, color: 'text-blue-600' }
  ]

  const categoryOptions = [
    { value: 'welcome', label: 'Benvenuto' },
    { value: 'points_earned', label: 'Punti Guadagnati' },
    { value: 'tier_upgrade', label: 'Tier Upgrade' },
    { value: 'promotion', label: 'Promozione' },
    { value: 'custom', label: 'Personalizzato' }
  ]

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="notification-editor bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Notification Editor</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Crea e gestisci notifiche push con animazioni per i tuoi clienti
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b bg-gray-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-semibold border-b-3 transition-all ${
              activeTab === 'create'
                ? 'border-b-2 bg-white text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            style={activeTab === 'create' ? { borderBottomColor: 'var(--primary-color, #dc2626)' } : {}}
          >
            Crea Notifica
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 text-sm font-semibold border-b-3 transition-all ${
              activeTab === 'templates'
                ? 'border-b-2 bg-white text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            style={activeTab === 'templates' ? { borderBottomColor: 'var(--primary-color, #dc2626)' } : {}}
          >
            Templates Salvati
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'create' ? (
          <div className="space-y-6">
            {/* Template Name (optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Template (opzionale)
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Es: Benvenuto Nuovo Cliente"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Titolo Notifica *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: Hai guadagnato 50 punti!"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Messaggio *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Es: Complimenti! Hai appena guadagnato 50 punti con il tuo ultimo acquisto."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Animation Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Animazione
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {animationOptions.map(opt => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnimationType(opt.value as AnimationType)}
                      className={`animation-button ${animationType === opt.value ? 'active' : ''}`}
                    >
                      {Icon && (
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${opt.color || 'text-gray-400'}`} />
                      )}
                      <p className="text-xs font-semibold text-center">
                        {opt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Animation Data (if points selected) */}
            {animationType === 'points' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numero Punti da Mostrare
                </label>
                <input
                  type="number"
                  value={animationData.points || 50}
                  onChange={(e) => setAnimationData({ ...animationData, points: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Target Audience
              </label>
              <div className="space-y-3">
                <label className="audience-option flex items-center gap-3">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={targetAudience === 'all'}
                    onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Tutti i Clienti</span>
                </label>

                <label className="audience-option flex items-center gap-3">
                  <input
                    type="radio"
                    name="audience"
                    value="tier"
                    checked={targetAudience === 'tier'}
                    onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Tier Specifico</span>
                </label>

                {targetAudience === 'tier' && (
                  <div className="ml-7">
                    <select
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Preview</p>
                <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm mb-1">{title || 'Titolo notifica'}</p>
                      <p className="text-gray-600 text-xs">{message || 'Messaggio notifica...'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-600 rounded-lg transition-all hover:border-gray-300 hover:shadow-md hover:text-gray-900 focus:outline-none"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Nascondi' : 'Mostra'} Preview
              </button>

              {animationType !== 'none' && (
                <button
                  onClick={handleTestAnimation}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-lg transition-all hover:border-purple-300 hover:shadow-md focus:outline-none"
                >
                  <Sparkles className="w-4 h-4" />
                  Test Animazione
                </button>
              )}

              {templateName && (
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg transition-all hover:border-blue-300 hover:shadow-md focus:outline-none"
                >
                  <Save className="w-4 h-4" />
                  Salva Template
                </button>
              )}

              <button
                onClick={handleSendNow}
                disabled={!title || !message}
                className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                style={{
                  backgroundColor: 'var(--primary-color, #dc2626)',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
                onMouseEnter={(e) => {
                  if (!(!title || !message)) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.25)';
                }}
              >
                <Send className="w-4 h-4" />
                Invia Ora
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nessun template salvato</p>
            <button
              onClick={() => setActiveTab('create')}
              className="mt-4 px-4 py-2 text-white rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--primary-color, #dc2626)',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.25)';
              }}
            >
              Crea il Primo Template
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
