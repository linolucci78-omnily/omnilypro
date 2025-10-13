import React, { useState, useEffect } from 'react'
import { X, Camera, Images, Upload, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ImageUploadModalProps {
  isOpen: boolean
  organizationId: string
  onConfirm: (imageUrl: string) => void
  onCancel: () => void
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  organizationId,
  onConfirm,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'library' | 'upload'>('camera')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [libraryImages, setLibraryImages] = useState<string[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      loadLibraryImages()
    }
  }, [isOpen, activeTab, organizationId])

  const loadLibraryImages = async () => {
    setLoadingLibrary(true)
    setError('') // Reset error
    try {
      console.log('📸 Loading library images for organization:', organizationId)
      
      const { data, error } = await supabase.storage
        .from('email-images')
        .list(organizationId, {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('❌ Error loading library:', error)
        throw error
      }

      console.log('✅ Library loaded:', data?.length || 0, 'images')

      const images = data?.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('email-images')
          .getPublicUrl(`${organizationId}/${file.name}`)
        return publicUrl
      }) || []

      setLibraryImages(images)
    } catch (err: any) {
      console.error('❌ Errore caricamento libreria:', err)
      setError(`Errore: ${err.message || 'Impossibile caricare la libreria'}`)
    } finally {
      setLoadingLibrary(false)
    }
  }

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Seleziona un\'immagine valida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('L\'immagine deve essere inferiore a 5MB')
      return
    }

    setSelectedFile(file)
    setError('')

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Se foto da camera, upload automatico
    if (fromCamera) {
      setTimeout(() => handleUpload(file), 100)
    }
  }

  const handleUpload = async (file: File = selectedFile!) => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      // Upload diretto - il bucket è già stato creato alla creazione dell'organizzazione
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${organizationId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('email-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw new Error(uploadError.message)

      // URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('email-images')
        .getPublicUrl(filePath)

      onConfirm(publicUrl)
      setSelectedFile(null)
      setPreviewUrl('')
    } catch (err: any) {
      console.error('Errore upload:', err)
      setError(err.message || 'Errore durante l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleLibrarySelect = (imageUrl: string) => {
    onConfirm(imageUrl)
  }

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
          zIndex: 10001,
          padding: '20px'
        }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          zIndex: 10002
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🖼️</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Aggiungi Immagine
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <button
            onClick={() => setActiveTab('camera')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              backgroundColor: activeTab === 'camera' ? 'white' : 'transparent',
              borderBottom: activeTab === 'camera' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'camera' ? '600' : '500',
              color: activeTab === 'camera' ? '#3b82f6' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Camera size={20} />
            Scatta Foto
          </button>
          <button
            onClick={() => setActiveTab('library')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              backgroundColor: activeTab === 'library' ? 'white' : 'transparent',
              borderBottom: activeTab === 'library' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'library' ? '600' : '500',
              color: activeTab === 'library' ? '#3b82f6' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Images size={20} />
            Le Mie Foto
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              backgroundColor: activeTab === 'upload' ? 'white' : 'transparent',
              borderBottom: activeTab === 'upload' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === 'upload' ? '600' : '500',
              color: activeTab === 'upload' ? '#3b82f6' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Upload size={20} />
            Carica
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
          {/* TAB FOTOCAMERA */}
          {activeTab === 'camera' && (
            <div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  border: '3px dashed #3b82f6',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('camera-input')?.click()}
              >
                <Camera size={64} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
                <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                  Scatta una Foto
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  Usa la fotocamera del tuo dispositivo
                </p>
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileSelect(e, true)}
                  style={{ display: 'none' }}
                />
              </div>

              {previewUrl && activeTab === 'camera' && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}
                  />
                  {uploading && (
                    <div style={{ marginTop: '16px', color: '#3b82f6', fontSize: '14px' }}>
                      <Loader size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '8px' }} />
                      Caricamento in corso...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB LIBRERIA */}
          {activeTab === 'library' && (
            <div>
              {loadingLibrary ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <p>Caricamento immagini...</p>
                </div>
              ) : libraryImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <Images size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px' }}>
                    Nessuna immagine salvata
                  </p>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    Scatta una foto o carica un'immagine per iniziare
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {libraryImages.map((url, index) => (
                    <div
                      key={index}
                      onClick={() => handleLibrarySelect(url)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.2s',
                        aspectRatio: '1'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6'
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <img
                        src={url}
                        alt={`Immagine ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB UPLOAD */}
          {activeTab === 'upload' && (
            <div>
              <div
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                  transition: 'all 0.2s'
                }}
                onClick={() => document.getElementById('file-input')?.click()}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.backgroundColor = '#eff6ff'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
              >
                <Upload size={48} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
                <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  {selectedFile ? selectedFile.name : 'Clicca per selezionare un\'immagine'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  PNG, JPG, GIF fino a 5MB
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, false)}
                  style={{ display: 'none' }}
                />
              </div>

              {previewUrl && activeTab === 'upload' && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}
                  />
                </div>
              )}

              {selectedFile && activeTab === 'upload' && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => handleUpload()}
                    disabled={uploading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      backgroundColor: uploading ? '#d1d5db' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {uploading && <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />}
                    {uploading ? 'Caricamento...' : 'Carica Immagine'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '14px'
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ImageUploadModal
