// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';
import { Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ColorPicker } from './ColorPicker';

interface ImageProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  borderRadius?: number;
  opacity?: number;
  filter?: string;
  boxShadow?: string;
}

// Settings Panel - Defined first
const ImageSettings = () => {
  const {
    actions: { setProp, delete: deleteNode },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          🖼️ Image Settings
        </h3>
        <button
          onClick={() => {
            if (window.confirm('Sei sicuro di voler eliminare questa immagine?')) {
              deleteNode();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
        >
          <Trash2 size={14} />
          Elimina
        </button>
      </div>

      {/* Image Upload */}
      <ImageUploader
        label="Upload Image"
        value={props.src}
        onChange={(value) => setProp((props: ImageProps) => (props.src = value))}
      />

      {/* Or URL */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
          Or Image URL
        </label>
        <input
          type="text"
          value={props.src}
          onChange={(e) => setProp((props: ImageProps) => (props.src = e.target.value))}
          placeholder="https://..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        />
      </div>

      {/* Alt Text */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Testo Alternativo
        </label>
        <input
          type="text"
          value={props.alt}
          onChange={(e) => setProp((props: ImageProps) => (props.alt = e.target.value))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Width */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Larghezza
        </label>
        <input
          type="text"
          value={props.width}
          onChange={(e) => setProp((props: ImageProps) => (props.width = e.target.value))}
          placeholder="100%, 500px, auto"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Height */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Altezza
        </label>
        <input
          type="text"
          value={props.height}
          onChange={(e) => setProp((props: ImageProps) => (props.height = e.target.value))}
          placeholder="auto, 300px"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Object Fit */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Adattamento
        </label>
        <select
          value={props.objectFit}
          onChange={(e) => setProp((props: ImageProps) => (props.objectFit = e.target.value as any))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <option value="cover">Cover (riempie)</option>
          <option value="contain">Contain (contiene)</option>
          <option value="fill">Fill (riempi)</option>
          <option value="none">None (originale)</option>
        </select>
      </div>

      {/* Border Radius */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
          <span>Border Radius</span>
          <span>{props.borderRadius || 0}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={props.borderRadius || 0}
          onChange={(e) => setProp((props: ImageProps) => (props.borderRadius = parseInt(e.target.value)))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Opacity */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
          <span>Opacity</span>
          <span>{Math.round((props.opacity || 1) * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.opacity || 1}
          onChange={(e) => setProp((props: ImageProps) => (props.opacity = parseFloat(e.target.value)))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Image Filters */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
          Image Filters
        </label>
        <input
          type="text"
          value={props.filter || ''}
          onChange={(e) => setProp((props: ImageProps) => (props.filter = e.target.value))}
          placeholder="blur(5px) brightness(1.2)"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        />
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', margin: 0 }}>
          Examples: blur(5px), brightness(1.2), contrast(1.5)
        </p>
      </div>

      {/* Box Shadow */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
          Box Shadow
        </label>
        <input
          type="text"
          value={props.boxShadow || ''}
          onChange={(e) => setProp((props: ImageProps) => (props.boxShadow = e.target.value))}
          placeholder="0 10px 25px rgba(0,0,0,0.1)"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        />
      </div>
    </div>
  );
};

export const Image: React.FC<ImageProps> = ({
  src = 'https://via.placeholder.com/600x400/667eea/ffffff?text=Immagine',
  alt = 'Immagine',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0,
  opacity = 1,
  filter,
  boxShadow,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        position: 'relative',
        width,
        height: height === 'auto' ? 'auto' : height,
        border: selected ? '2px solid #3b82f6' : 'none',
        outline: selected ? '2px dashed rgba(59, 130, 246, 0.3)' : 'none',
        outlineOffset: '4px',
        display: 'inline-block',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          borderRadius: `${borderRadius}px`,
          opacity,
          filter,
          boxShadow,
          display: 'block',
        }}
      />
    </div>
  );
};

Image.craft = {
  displayName: 'Image',
  props: {
    src: 'https://via.placeholder.com/600x400/667eea/ffffff?text=Immagine',
    alt: 'Immagine',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    borderRadius: 0,
    opacity: 1,
    filter: undefined,
    boxShadow: undefined,
  },
  related: {
    settings: ImageSettings,
  },
};
