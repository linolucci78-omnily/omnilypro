// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link2, Loader } from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  organizationId?: string;
  aspectRatio?: string;
  helpText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  organizationId = 'admin',
  aspectRatio,
  helpText,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Per favore seleziona un file immagine valido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Il file è troppo grande. Dimensione massima: 5MB');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Convert to base64 for preview (in a real app, upload to server/cloud)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange(base64);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Errore nel caricamento del file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Errore durante l\'upload');
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      // Basic URL validation
      try {
        new URL(urlValue);
        onChange(urlValue);
        setUrlValue('');
        setShowUrlInput(false);
        setError('');
      } catch {
        setError('URL non valido');
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlValue('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#374151'
        }}>
          {label}
        </label>
      )}

      {/* Preview or Upload Area */}
      {value ? (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '100%',
              height: aspectRatio ? 'auto' : '200px',
              aspectRatio: aspectRatio || 'auto',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              position: 'relative',
            }}
          >
            <img
              src={value}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Remove button overlay */}
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
            >
              <X size={18} color="white" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '32px 16px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              background: isUploading ? '#f9fafb' : 'white',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#eff6ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {isUploading ? (
              <>
                <Loader size={32} color="#3b82f6" className="spin" />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Caricamento...
                </span>
              </>
            ) : (
              <>
                <Upload size={32} color="#9ca3af" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Clicca per caricare un'immagine
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  PNG, JPG, GIF fino a 5MB
                </span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* URL Input Option */}
          <div style={{ marginTop: '12px' }}>
            {showUrlInput ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlValue('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'white',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Link2 size={14} />
                Oppure inserisci URL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#ef4444',
        }}>
          {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <p style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#6b7280',
        }}>
          {helpText}
        </p>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};
