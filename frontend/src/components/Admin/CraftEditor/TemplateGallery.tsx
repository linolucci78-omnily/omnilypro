import React from 'react';
import { useEditor } from '@craftjs/core';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  content: string;
}

const templates: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch',
    thumbnail: 'https://via.placeholder.com/300x200?text=Blank',
    content: '{"ROOT":{"type":"Container","props":{},"nodes":[]}}',
  },
  {
    id: 'simple',
    name: 'Simple Landing',
    description: 'A simple landing page template',
    thumbnail: 'https://via.placeholder.com/300x200?text=Simple+Landing',
    content: '{"ROOT":{"type":"Container","props":{},"nodes":[]}}',
  },
];

interface TemplateGalleryProps {
  onSelectTemplate?: (template: Template) => void;
  onClose?: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, onClose }) => {
  const { actions } = useEditor();

  const handleSelectTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
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
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '1000px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Choose a Template</h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px',
              }}
            >
              ×
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => handleSelectTemplate(template)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={template.thumbnail}
                alt={template.name}
                style={{ width: '100%', height: '150px', objectFit: 'cover' }}
              />
              <div style={{ padding: '15px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {template.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  {template.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
