import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  Save,
  Search,
  Filter,
  Package,
  Award,
  Star,
  Target,
  AlertCircle,
  CheckCircle,
  Loader,
  Tag,
  Wrench,
  Sparkles,
  Gift
} from 'lucide-react'
import { rewardsService, type Reward } from '../services/rewardsService'
import { supabase } from '../lib/supabase'
import './RewardsManagement.css'

interface RewardsManagementProps {
  organizationId: string
  primaryColor: string
  secondaryColor: string
}

type RewardCategory = 'product' | 'discount' | 'service' | 'experience' | 'other'

interface LoyaltyTier {
  name: string
  threshold: string
  multiplier: string
  color: string
}

interface RewardFormData {
  name: string
  description: string
  points_required: number
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: string
  required_tier: string
  stock_quantity?: number
  is_active: boolean
  image_url?: string
  category?: RewardCategory
}

const CATEGORIES: {value: RewardCategory; label: string; Icon: React.FC<{size?: number}>}[] = [
  { value: 'product', label: 'Prodotti', Icon: Package },
  { value: 'discount', label: 'Sconti', Icon: Tag },
  { value: 'service', label: 'Servizi', Icon: Wrench },
  { value: 'experience', label: 'Esperienze', Icon: Sparkles },
  { value: 'other', label: 'Altro', Icon: Gift }
]

const REWARD_TYPES: {value: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'; label: string}[] = [
  { value: 'discount', label: 'Sconto' },
  { value: 'freeProduct', label: 'Prodotto Gratuito' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'giftCard', label: 'Buono Regalo' }
]

const RewardsManagement: React.FC<RewardsManagementProps> = ({
  organizationId,
  primaryColor,
  secondaryColor
}) => {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | 'all'>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([])
  const [validationError, setValidationError] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<RewardFormData>({
    name: '',
    description: '',
    points_required: 0,
    type: 'discount',
    value: '',
    required_tier: '',
    stock_quantity: undefined,
    is_active: true,
    image_url: undefined,
    category: 'product'
  })

  useEffect(() => {
    fetchRewards()
    fetchLoyaltyTiers()
  }, [organizationId])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const allRewards = await rewardsService.getAll(organizationId)
      setRewards(allRewards)
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLoyaltyTiers = async () => {
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('loyalty_tiers')
        .eq('id', organizationId)
        .single()

      if (error) throw error

      if (org?.loyalty_tiers && Array.isArray(org.loyalty_tiers)) {
        setLoyaltyTiers(org.loyalty_tiers as LoyaltyTier[])
      } else {
        // Default tiers se non configurati
        setLoyaltyTiers([
          { name: 'Iniziale', threshold: '0', multiplier: '1', color: '#94a3b8' },
          { name: 'Affezionato', threshold: '300', multiplier: '1.5', color: '#3b82f6' },
          { name: 'VIP', threshold: '800', multiplier: '2', color: '#f59e0b' }
        ])
      }
    } catch (error) {
      console.error('Error fetching loyalty tiers:', error)
      // Set default tiers in case of error
      setLoyaltyTiers([
        { name: 'Iniziale', threshold: '0', multiplier: '1', color: '#94a3b8' },
        { name: 'Affezionato', threshold: '300', multiplier: '1.5', color: '#3b82f6' },
        { name: 'VIP', threshold: '800', multiplier: '2', color: '#f59e0b' }
      ])
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('Per favore seleziona un file immagine')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError('L\'immagine è troppo grande. Massimo 5MB.')
      return
    }

    setValidationError('')

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}-${Date.now()}.${fileExt}`
      const filePath = `rewards/${fileName}`

      const { data, error } = await supabase.storage
        .from('reward-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('reward-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
    } catch (error) {
      console.error('Errore upload immagine:', error)
      setValidationError('Errore durante il caricamento dell\'immagine')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || formData.points_required <= 0 || !formData.required_tier) {
      setValidationError('Compila tutti i campi obbligatori (Nome, Punti e Livello Richiesto)')
      return
    }

    setValidationError('')

    try {
      // Map formData to RewardInput
      const rewardData = {
        name: formData.name,
        type: formData.type,
        value: formData.value,
        points_required: formData.points_required,
        required_tier: formData.required_tier,
        description: formData.description,
        image_url: formData.image_url,
        is_active: formData.is_active,
        stock_quantity: formData.stock_quantity
      }

      if (editingReward) {
        await rewardsService.update(editingReward.id, organizationId, rewardData)
      } else {
        await rewardsService.create(organizationId, rewardData)
      }

      await fetchRewards()
      handleCloseModal()
    } catch (error) {
      console.error('Errore salvataggio premio:', error)
      setValidationError('Errore durante il salvataggio')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo premio?')) return

    try {
      await rewardsService.delete(id, organizationId)
      await fetchRewards()
    } catch (error) {
      console.error('Errore eliminazione premio:', error)
      // Potremmo mostrare una toast notification qui invece di validationError
      console.error('Errore eliminazione premio')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await rewardsService.toggleStatus(id, organizationId, isActive)
      await fetchRewards()
    } catch (error) {
      console.error('Errore aggiornamento stato:', error)
    }
  }

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward)
    setFormData({
      name: reward.name,
      description: reward.description || '',
      points_required: reward.points_required,
      type: reward.type,
      value: reward.value || '',
      required_tier: reward.required_tier,
      stock_quantity: reward.stock_quantity,
      is_active: reward.is_active,
      image_url: reward.image_url,
      category: (reward as any).category || 'product'
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingReward(null)
    setValidationError('')
    setFormData({
      name: '',
      description: '',
      points_required: 0,
      type: 'discount',
      value: '',
      required_tier: '',
      stock_quantity: undefined,
      is_active: true,
      image_url: undefined,
      category: 'product'
    })
  }

  // Filtri
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reward.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || (reward as any).category === selectedCategory
    const matchesActive = showInactive || reward.is_active

    return matchesSearch && matchesCategory && matchesActive
  })

  const getBadge = (reward: Reward) => {
    if (!reward.is_active) return { label: 'INATTIVO', color: '#6b7280' }
    if (reward.stock_quantity && reward.stock_quantity < 5) return { label: 'STOCK BASSO', color: '#f59e0b' }
    if ((reward as any).is_new) return { label: 'NUOVO', color: '#10b981' }
    if (reward.redemption_count && reward.redemption_count > 50) return { label: 'POPOLARE', color: '#3b82f6' }
    return null
  }

  return (
    <div
      className="rewards-management"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="rewards-management-header">
        <div>
          <h1>Gestione Premi</h1>
          <p>Crea e gestisci il catalogo premi del tuo programma fedeltà</p>
        </div>
        <button
          className="btn-add-reward"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} />
          <span>Nuovo Premio</span>
        </button>
      </div>

      {/* Filtri e Ricerca */}
      <div className="rewards-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca premi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tutti
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <cat.Icon size={16} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <span>Mostra inattivi</span>
        </label>
      </div>

      {/* Grid Premi */}
      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Caricamento premi...</p>
        </div>
      ) : filteredRewards.length > 0 ? (
        <div className="rewards-grid">
          {filteredRewards.map(reward => {
            const badge = getBadge(reward)
            return (
              <div key={reward.id} className="reward-card-modern">
                {badge && (
                  <div className="reward-badge" style={{ background: badge.color }}>
                    {badge.label}
                  </div>
                )}

                <div className="reward-image-container">
                  {reward.image_url ? (
                    <img src={reward.image_url} alt={reward.name} />
                  ) : (
                    <div className="reward-image-placeholder">
                      <Package size={48} />
                    </div>
                  )}
                </div>

                <div className="reward-content">
                  <h3>{reward.name}</h3>
                  {reward.description && (
                    <p className="reward-description">{reward.description}</p>
                  )}

                  <div className="reward-meta">
                    <div className="reward-points-badge">
                      <Target size={16} />
                      <span>{reward.points_required} punti</span>
                    </div>
                    {reward.required_tier && (
                      <div className="reward-tier-badge">
                        <Star size={16} />
                        <span>{reward.required_tier}</span>
                      </div>
                    )}
                  </div>

                  {reward.stock_quantity !== undefined && (
                    <div className="reward-stock">
                      <Package size={14} />
                      <span>Stock: {reward.stock_quantity}</span>
                    </div>
                  )}

                  <div className="reward-actions">
                    <label className="toggle-switch-modern">
                      <input
                        type="checkbox"
                        checked={reward.is_active}
                        onChange={(e) => handleToggleActive(reward.id, e.target.checked)}
                      />
                      <span className="toggle-slider-modern"></span>
                    </label>

                    <div className="reward-action-buttons">
                      <button
                        className="btn-action-edit"
                        onClick={() => handleEdit(reward)}
                        title="Modifica"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-action-delete"
                        onClick={() => handleDelete(reward.id)}
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state-modern">
          <Award size={64} />
          <h3>Nessun premio trovato</h3>
          <p>Crea il tuo primo premio per iniziare</p>
          <button
            className="btn-add-reward"
            onClick={() => setShowModal(true)}
          >
            <Plus size={20} />
            <span>Crea Premio</span>
          </button>
        </div>
      )}

      {/* Modal Crea/Modifica */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={handleCloseModal} />
          <div className="modal-reward">
            <div className="modal-header">
              <h2>{editingReward ? 'Modifica Premio' : 'Nuovo Premio'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              {/* Upload Immagine */}
              <div className="form-section">
                <label className="form-label-bold">Immagine Premio</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="image-upload-placeholder">
                      {uploading ? (
                        <Loader className="spinner" size={32} />
                      ) : (
                        <>
                          <Upload size={32} />
                          <p>Clicca per caricare un'immagine</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
              </div>

              {/* Form Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Premio *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Buono Sconto 10€"
                  />
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descrizione</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrivi il premio..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Punti Richiesti *</label>
                  <input
                    type="number"
                    value={formData.points_required || ''}
                    onChange={(e) => setFormData({ ...formData, points_required: e.target.value ? parseInt(e.target.value) : 0 })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Livello Richiesto *</label>
                  <select
                    value={formData.required_tier}
                    onChange={(e) => setFormData({ ...formData, required_tier: e.target.value })}
                  >
                    <option value="">Seleziona livello...</option>
                    {loyaltyTiers.map(tier => (
                      <option key={tier.name} value={tier.name}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Disponibile</label>
                  <input
                    type="number"
                    value={formData.stock_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Illimitato"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  {/* Placeholder per mantenere layout a 2 colonne */}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo Premio *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {REWARD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Valore</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="es. 10€ o 10%"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Livello Richiesto (opzionale)</label>
                <input
                  type="text"
                  value={formData.required_tier || ''}
                  onChange={(e) => setFormData({ ...formData, required_tier: e.target.value || undefined })}
                  placeholder="es. Gold, Platinum..."
                />
              </div>

              <div className="form-group-toggle">
                <label className="toggle-switch-modern">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="toggle-slider-modern"></span>
                </label>
                <span className="toggle-label-text">Premio Attivo</span>
              </div>
            </div>

            {validationError && (
              <div style={{
                padding: '1rem 2rem',
                background: '#fee2e2',
                borderTop: '2px solid #fecaca',
                borderBottom: '2px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#991b1b'
              }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{validationError}</span>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCloseModal}>
                <X size={20} />
                <span>Annulla</span>
              </button>
              <button className="btn-save" onClick={handleSubmit}>
                <Save size={20} />
                <span>{editingReward ? 'Salva Modifiche' : 'Crea Premio'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RewardsManagement
