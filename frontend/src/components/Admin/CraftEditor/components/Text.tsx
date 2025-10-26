// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { FileText, Palette, Settings } from 'lucide-react';

export interface TextProps {
  text?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export const Text: React.FC<TextProps> = ({
  text = 'Clicca per modificare',
  fontSize = 16,
  color = '#000000',
  fontWeight = 'normal',
  textAlign = 'left'
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((state) => ({
    selected: state.events.selected,
    isHovered: state.events.hovered,
    id: state.id
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      onClick={(e) => {
        e.stopPropagation();
        console.log('🖱️ Text clicked!', { text, id, selected });
      }}
      onMouseEnter={() => console.log('🐭 Mouse enter Text:', text)}
      style={{
        fontSize: `${fontSize}px`,
        color,
        fontWeight,
        textAlign,
        padding: '10px',
        cursor: 'pointer',
        outline: selected ? '3px solid #3b82f6' : (isHovered ? '2px dashed #3b82f6' : 'none'),
        outlineOffset: '2px',
        transition: 'outline 0.2s',
        position: 'relative',
        pointerEvents: 'auto'
      }}
    >
      {text}
      {selected && (
        <div style={{
          position: 'absolute',
          top: '-24px',
          left: '0',
          background: '#3b82f6',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          Text (Clicca per modificare)
        </div>
      )}
    </div>
  );
};

// Text Settings Toolbar Component
const TextSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  const [activeTab, setActiveTab] = React.useState('content');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        {[
          { id: 'content', label: 'Contenuto', Icon: FileText },
          { id: 'style', label: 'Stile', Icon: Palette },
          { id: 'advanced', label: 'Avanzate', Icon: Settings }
        ].map(tab => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
        {activeTab === 'content' && (
          <>
      {/* Text Content */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Testo
        </label>
        <textarea
          value={props.text}
          onChange={(e) => setProp((props: any) => props.text = e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Font Size */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Dimensione: {props.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          value={props.fontSize}
          onChange={(e) => setProp((props: any) => props.fontSize = parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Color */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Colore
        </label>
        <input
          type="color"
          value={props.color}
          onChange={(e) => setProp((props: any) => props.color = e.target.value)}
          style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>

      {/* Font Weight */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Peso Font
        </label>
        <select
          value={props.fontWeight}
          onChange={(e) => setProp((props: any) => props.fontWeight = e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: '#ffffff'
          }}
        >
          <option value="300">Leggero (300)</option>
          <option value="normal">Normale (400)</option>
          <option value="500">Medio (500)</option>
          <option value="600">Semi-Bold (600)</option>
          <option value="700">Bold (700)</option>
          <option value="800">Extra-Bold (800)</option>
        </select>
      </div>

      {/* Text Align */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Allineamento
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => setProp((props: any) => props.textAlign = align)}
              style={{
                flex: 1,
                padding: '8px',
                background: props.textAlign === align ? '#3b82f6' : '#f3f4f6',
                color: props.textAlign === align ? '#ffffff' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {align === 'left' && '←'}
              {align === 'center' && '↔'}
              {align === 'right' && '→'}
            </button>
          ))}
        </div>
      </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} />
                Stile Tipografia
              </h4>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>
                Tutti i controlli di stile si trovano nella tab Contenuto sopra.
              </p>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} />
                Impostazioni Avanzate
              </h4>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Per modificare padding, margin, background usa il Container padre o wrappa questo testo in un Container.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Clicca per modificare',
    fontSize: 16,
    color: '#000000',
    fontWeight: 'normal',
    textAlign: 'left'
  },
  related: {
    toolbar: TextSettings
  }
};
