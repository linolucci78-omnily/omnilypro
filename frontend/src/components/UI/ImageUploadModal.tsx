import React, { useState } from 'react'
import { X, Upload, Loader } from 'lucide-react'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valida tipo file
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido')
      return
    }

    // Valida dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'immagine deve essere inferiore a 5MB')
      return
    }

    setSelectedFile(file)
    setError('')

    // Crea preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')

    try {
      // 1. Verifica/Crea bucket se non esiste
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === 'email-images')

      if (!bucketExists) {
        console.log('📦 Bucket non esiste, lo creo...')
        const { error: createError } = await supabase.storage.createBucket('email-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        })

        if (createError) {
          console.error('Errore creazione bucket:', createError)
          // Ignora se il bucket esiste già (race condition)
          if (!createError.message.includes('already exists')) {
            throw new Error('Impossibile creare storage. Contatta l\'amministratore.')
          }
        } else {
          console.log('✅ Bucket creato automaticamente!')
        }
      }

      // 2. Nome file unico
      const timestamp = Date.now()
      const fileName = `${timestamp}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${organizationId}/${fileName}`

      // 3. Upload su Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('email-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(uploadError.message)
      }

      // 4. Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('email-images')
        .getPublicUrl(filePath)

      console.log('✅ Immagine caricata:', publicUrl)
      onConfirm(publicUrl)

      // Reset
      setSelectedFile(null)
      setPreviewUrl('')
    } catch (err: any) {
      console.error('Errore upload:', err)
      setError(err.message || 'Errore durante l\'upload')
    } finally {
      setUploading(false)
    }
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          maxWidth: '500px',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '24px' }}>🖼️</span>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}
            >
              Carica Immagine
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}
        >
          {/* File Input */}
          <div
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: '#f9fafb'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload size={32} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
            <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              {selectedFile ? selectedFile.name : 'Clicca per selezionare un\'immagine'}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              PNG, JPG, GIF fino a 5MB
            </p>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
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

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '20px 24px',
            borderTop: '1px solid #e5e7eb',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onCancel}
            disabled={uploading}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: uploading ? 0.5 : 1
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: !selectedFile || uploading ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {uploading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {uploading ? 'Caricamento...' : 'Carica'}
          </button>
        </div>
      </div>
    </>
  )
}

export default ImageUploadModal
