// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';

export interface ButtonProps {
  text?: string;
  backgroundColor?: string;
  color?: string;
  padding?: string;
}

export const Button: React.FC<ButtonProps> = ({
  text = 'Click me',
  backgroundColor = '#3b82f6',
  color = '#ffffff',
  padding = '10px 20px'
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <button
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        backgroundColor,
        color,
        padding,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '2px',
        transition: 'outline 0.2s'
      }}
    >
      {text}
    </button>
  );
};

// Button Settings Toolbar Component
const ButtonSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Button Text */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Testo Pulsante
        </label>
        <input
          type="text"
          value={props.text}
          onChange={(e) => setProp((props: any) => props.text = e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}
        />
      </div>

      {/* Background Color */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Colore Sfondo
        </label>
        <input
          type="color"
          value={props.backgroundColor}
          onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
          style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>

      {/* Text Color */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Colore Testo
        </label>
        <input
          type="color"
          value={props.color}
          onChange={(e) => setProp((props: any) => props.color = e.target.value)}
          style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>

      {/* Padding Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          Dimensione
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: 'Piccolo', value: '6px 16px' },
            { label: 'Medio', value: '10px 20px' },
            { label: 'Grande', value: '14px 28px' },
            { label: 'Extra Large', value: '18px 36px' }
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => setProp((props: any) => props.padding = size.value)}
              style={{
                padding: '8px',
                background: props.padding === size.value ? '#3b82f6' : '#f3f4f6',
                color: props.padding === size.value ? '#ffffff' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text: 'Click me',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '10px 20px'
  },
  related: {
    toolbar: ButtonSettings
  }
};
