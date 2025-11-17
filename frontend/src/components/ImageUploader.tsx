import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  bucket?: string
  folder?: string
  maxSizeMB?: number
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Carica Immagine',
  bucket = 'website-images',
  folder = 'uploads',
  maxSizeMB = 5,
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Per favore seleziona un file immagine')
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`L'immagine deve essere massimo ${maxSizeMB}MB`)
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onChange(publicUrl)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Errore durante il caricamento')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    setError(null)
  }

  return (
    <div className="image-uploader">
      <label className="image-uploader-label">{label}</label>

      {value ? (
        // Preview with image
        <div className="image-preview-container">
          <img src={value} alt="Preview" className="uploaded-image-preview" />
          <button
            type="button"
            onClick={handleRemove}
            className="remove-image-btn"
            title="Rimuovi immagine"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Upload area
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="file-input-hidden"
            id={`file-upload-${Math.random()}`}
          />
          <label
            htmlFor={`file-upload-${Math.random()}`}
            className="upload-label"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader className="w-8 h-8 animate-spin text-gray-400" />
                <span>Caricamento...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <span>Clicca per caricare</span>
                <span className="upload-hint">
                  o trascina qui l'immagine
                </span>
                <span className="upload-size">Max {maxSizeMB}MB</span>
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      <style>{`
        .image-uploader {
          width: 100%;
        }

        .image-uploader-label {
          display: block;
          font-weight: 600;
          color: var(--omnily-gray-700);
          margin-bottom: var(--omnily-spacing-2);
          font-size: var(--omnily-font-size-sm);
        }

        .image-preview-container {
          position: relative;
          width: 100%;
          height: 200px;
          border-radius: var(--omnily-border-radius-lg);
          overflow: hidden;
          border: 2px solid var(--omnily-border-color);
        }

        .uploaded-image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image-btn {
          position: absolute;
          top: var(--omnily-spacing-2);
          right: var(--omnily-spacing-2);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-image-btn:hover {
          background: var(--omnily-error);
          transform: scale(1.1);
        }

        .upload-area {
          width: 100%;
          height: 200px;
          border: 2px dashed var(--omnily-border-color);
          border-radius: var(--omnily-border-radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: var(--omnily-gray-50);
        }

        .upload-area:hover {
          border-color: var(--omnily-primary);
          background: var(--omnily-primary-50);
        }

        .file-input-hidden {
          display: none;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--omnily-spacing-2);
          cursor: pointer;
          text-align: center;
          padding: var(--omnily-spacing-6);
        }

        .upload-label span {
          font-size: var(--omnily-font-size-sm);
          color: var(--omnily-gray-600);
          font-weight: 500;
        }

        .upload-hint {
          font-size: var(--omnily-font-size-xs);
          color: var(--omnily-gray-500);
        }

        .upload-size {
          font-size: var(--omnily-font-size-xs);
          color: var(--omnily-gray-400);
          margin-top: var(--omnily-spacing-2);
        }

        .upload-error {
          margin-top: var(--omnily-spacing-2);
          padding: var(--omnily-spacing-2) var(--omnily-spacing-3);
          background: var(--omnily-error-bg);
          color: var(--omnily-error);
          border-radius: var(--omnily-border-radius);
          font-size: var(--omnily-font-size-xs);
          font-weight: 500;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
