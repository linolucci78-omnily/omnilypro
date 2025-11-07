import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, Upload, User, Mail, Phone, MapPin, Save, Loader, Calendar, UserCheck, Bell, Users } from 'lucide-react'
import './EditCustomerModal.css'
import { supabase } from '../lib/supabase'
import type { Customer } from '../lib/supabase'

interface EditCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onUpdate: (customerId: string, updates: Partial<Customer>) => Promise<void>
  primaryColor?: string
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onUpdate,
  primaryColor = '#dc2626'
}) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    gender: customer.gender || '',
    birth_date: customer.birth_date || '',
    marketing_consent: customer.marketing_consent || false,
    notifications_enabled: customer.notifications_enabled || false
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(customer.avatar_url || null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(customer.avatar_url || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
      marketing_consent: customer.marketing_consent || false,
      notifications_enabled: customer.notifications_enabled || false
    })
    setAvatarUrl(customer.avatar_url || null)
    setAvatarPreview(customer.avatar_url || null)
  }, [customer])

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un file immagine')
      return
    }

    // Verifica dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine è troppo grande. Massimo 5MB.')
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
      alert('Errore durante il caricamento dell\'immagine')
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

    try {
      const updates: Partial<Customer> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: (formData.gender as 'male' | 'female' | undefined) || undefined,
        birth_date: formData.birth_date || undefined,
        marketing_consent: formData.marketing_consent,
        notifications_enabled: formData.notifications_enabled,
        avatar_url: avatarUrl || undefined
      }

      console.log('💾 Salvando modifiche cliente:', updates)

      await onUpdate(customer.id, updates)

      console.log('✅ Cliente aggiornato con successo')
      onClose()
    } catch (error) {
      console.error('❌ Errore salvataggio cliente:', error)
      alert('Errore durante il salvataggio')
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* Overlay */}
      <div className="edit-customer-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="edit-customer-modal" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
        {/* Header */}
        <div className="edit-customer-header">
          <div>
            <h2>Modifica Dati Cliente</h2>
            <p>Aggiorna le informazioni e l'avatar di {customer.name}</p>
          </div>
          <button className="edit-customer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
            <button
              className="avatar-upload-btn camera"
              onClick={handleCameraClick}
              disabled={isUploading}
            >
              <Camera size={20} />
              Scatta Foto
            </button>
            <button
              className="avatar-upload-btn gallery"
              onClick={handleGalleryClick}
              disabled={isUploading}
            >
              <Upload size={20} />
              Carica Foto
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

          {/* Indirizzo */}
          <div className="form-group">
            <label>
              <MapPin size={18} />
              Indirizzo
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
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
        </div>

        {/* Actions */}
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
    </>
  )
}

export default EditCustomerModal
