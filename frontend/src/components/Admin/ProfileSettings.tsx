import React, { useState, useRef, useEffect } from 'react'
import {
  Camera, Save, User as UserIcon, Mail, Phone, Crown,
  MapPin, Globe, Linkedin, Sparkles, ExternalLink, Copy
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usersService, type SystemUser } from '../../services/usersService'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import './ProfileSettings.css'

const ProfileSettings: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userData, setUserData] = useState<SystemUser | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: ''
  })

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      if (!user) return

      const data = await usersService.getUser(user.id)
      if (data) {
        setUserData(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email,
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || ''
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showError('Seleziona un file immagine valido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('L\'immagine deve essere inferiore a 5MB')
      return
    }

    try {
      setUploading(true)

      // Delete old avatar if exists
      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('admin-avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('admin-avatars')
        .getPublicUrl(filePath)

      // Update user in database
      await usersService.updateUser(user.id, { avatar_url: publicUrl })

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      showSuccess('Avatar aggiornato con successo')

      // Dispatch event to refresh avatar in AdminLayout
      window.dispatchEvent(new Event('user-profile-updated'))
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      showError('Errore durante l\'upload dell\'avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)

      await usersService.updateUser(user.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        bio: formData.bio
      })

      showSuccess('Profilo aggiornato con successo')

      // Dispatch event to refresh data in AdminLayout
      window.dispatchEvent(new Event('user-profile-updated'))
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showError('Errore durante l\'aggiornamento del profilo')
    } finally {
      setLoading(false)
    }
  }

  const getFounderId = () => {
    // Prima prova a prendere il founder_id dal database
    if (userData?.founder_id) {
      return userData.founder_id
    }

    // Fallback: genera temporaneamente dall'user ID (fino a quando non viene applicata la migration)
    if (!user) return 'FD-XXXX-XX'
    const hash = user.id.split('-').join('').substring(0, 8).toUpperCase()
    return `FD-${hash.substring(0, 4)}-${hash.substring(4, 6)}`
  }

  const copyFounderId = () => {
    const founderId = getFounderId()
    navigator.clipboard.writeText(founderId)
    showSuccess('Founder ID copiato negli appunti')
  }

  if (!user || !userData) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Caricamento profilo...</p>
      </div>
    )
  }

  const displayName = formData.first_name && formData.last_name
    ? `${formData.first_name} ${formData.last_name}`
    : formData.first_name || formData.last_name || 'Admin User'

  return (
    <div className="founder-profile">
      {/* Header con Avatar Centrale */}
      <div className="founder-header">
        <div className="founder-avatar-container">
          <div className="founder-avatar">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt={displayName} />
            ) : (
              <div className="avatar-placeholder">
                <UserIcon size={80} />
              </div>
            )}
            {uploading && (
              <div className="avatar-uploading">
                <div className="spinner-small"></div>
              </div>
            )}
            <button
              className="avatar-edit-btn"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              <Camera size={18} />
            </button>
          </div>
          <span className="founder-badge">
            <Crown size={14} /> PROPRIETARIO
          </span>
        </div>

        <h1 className="founder-name">{displayName}</h1>
        <p className="founder-title">Founder & CEO of OmnilyPro</p>

        <div className="founder-meta">
          <div className="meta-item">
            <MapPin size={14} />
            <span>Italia</span>
          </div>
          <div className="meta-item">
            <Globe size={14} />
            <a href="https://omnilypro.com" target="_blank" rel="noopener noreferrer">
              omnilypro.com
            </a>
          </div>
          <div className="meta-item">
            <Mail size={14} />
            <span>{formData.email}</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Content Grid */}
      <form onSubmit={handleSubmit} className="founder-content">
        <div className="content-left">
          {/* Executive Bio */}
          <div className="founder-card">
            <div className="card-header-inline">
              <h3>Bio Esecutiva</h3>
              <button type="button" className="btn-ai">
                <Sparkles size={14} />
                Migliora con AI
              </button>
            </div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="bio-textarea"
              placeholder="Descrivi la tua esperienza, visione e ruolo come Founder di OmnilyPro. Cosa ti guida nel creare soluzioni innovative per il settore retail e POS?"
              rows={6}
            />
          </div>

          {/* Dettagli Personali */}
          <div className="founder-card">
            <h3>Dettagli Personali</h3>
            <div className="form-grid-2col">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Il tuo nome"
                />
              </div>
              <div className="form-group">
                <label>Cognome</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Il tuo cognome"
                />
              </div>
              <div className="form-group">
                <label>Email Personale</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Telefono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="content-right">
          {/* Founder ID Card */}
          <div className="founder-id-card">
            <div className="id-header">
              <Crown size={18} />
              <span>Founder ID</span>
            </div>
            <div className="id-code">{getFounderId()}</div>
            <p className="id-description">
              Questo ID garantisce accesso amministrativo completo su tutte le istanze della piattaforma OmnilyPro. Mantienilo riservato.
            </p>
            <button type="button" className="btn-copy-id" onClick={copyFounderId}>
              <Copy size={14} />
              Copia ID
            </button>
          </div>

          {/* Profilo Pubblico */}
          <div className="founder-card">
            <div className="card-header-inline">
              <h4>Profilo Pubblico</h4>
              <a href={`https://omnilypro.com/team/${user?.id}`} target="_blank" rel="noopener noreferrer" className="btn-icon">
                <ExternalLink size={14} />
              </a>
            </div>
            <a href={`https://omnilypro.com/team/${user?.id}`} target="_blank" rel="noopener noreferrer" className="public-profile-link">
              omnilypro.com/team/founder
            </a>
          </div>

          {/* Save Button */}
          <button type="submit" className="btn-save-founder" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvataggio...' : 'Salva Profilo'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileSettings
