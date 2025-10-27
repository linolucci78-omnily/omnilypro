// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';
import { Type, Palette, Settings, AlignLeft, AlignCenter, AlignRight, Move, Maximize2, Square, ImageIcon } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

export interface ButtonProps {
  text?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  backgroundColor?: string;
  color?: string;
  padding?: string;
  fontSize?: number;
  fontWeight?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  boxShadow?: string;
  hoverBackgroundColor?: string;
  hoverColor?: string;
  width?: string;
  display?: 'inline-block' | 'block';
  textAlign?: 'left' | 'center' | 'right';
  buttonAlign?: 'left' | 'center' | 'right';
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export const Button: React.FC<ButtonProps> = ({
  text = 'Click me',
  icon,
  iconPosition = 'left',
  iconSize = 20,
  backgroundColor = '#3b82f6',
  color = '#ffffff',
  padding = '10px 20px',
  fontSize = 16,
  fontWeight = 600,
  borderRadius = 6,
  borderWidth = 0,
  borderColor = '#000000',
  borderStyle = 'solid',
  boxShadow = 'none',
  hoverBackgroundColor,
  hoverColor,
  width = 'auto',
  display = 'inline-block',
  textAlign = 'center',
  buttonAlign = 'left',
  marginTop = 0,
  marginBottom = 0,
  marginLeft = 0,
  marginRight = 0
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  const [isHovered, setIsHovered] = React.useState(false);

  // Calculate alignment style for the wrapper
  const wrapperAlignment = buttonAlign === 'center' ? 'center' : buttonAlign === 'right' ? 'flex-end' : 'flex-start';

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        display: 'flex',
        justifyContent: wrapperAlignment,
        width: '100%',
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '2px',
      }}
    >
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isHovered && hoverBackgroundColor ? hoverBackgroundColor : backgroundColor,
          color: isHovered && hoverColor ? hoverColor : color,
          padding,
          fontSize: `${fontSize}px`,
          fontWeight,
          border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
          borderRadius: `${borderRadius}px`,
          boxShadow,
          cursor: 'pointer',
          transition: 'all 0.2s',
          width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textAlign,
          marginLeft: `${marginLeft}px`,
          marginRight: `${marginRight}px`
        }}
      >
        {icon && iconPosition === 'left' && (
          <img src={icon} alt="" style={{ width: `${iconSize}px`, height: `${iconSize}px`, objectFit: 'contain' }} />
        )}
        {text}
        {icon && iconPosition === 'right' && (
          <img src={icon} alt="" style={{ width: `${iconSize}px`, height: `${iconSize}px`, objectFit: 'contain' }} />
        )}
      </button>
    </div>
  );
};

// Button Settings Toolbar Component
const ButtonSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  const [activeTab, setActiveTab] = React.useState('content');

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' };
  const inputStyle = { width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '4px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        {[
          { id: 'content', label: 'Contenuto', Icon: Type },
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
            {/* Testo */}
            <div>
              <label style={labelStyle}>Testo Pulsante</label>
              <input
                type="text"
                value={props.text || ''}
                onChange={(e) => setProp((props: any) => props.text = e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Icona/Immagine */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} />
                Icona/Immagine (opzionale)
              </h4>

              <ImageUploader
                label="Carica Icona"
                value={props.icon}
                onChange={(value) => setProp((props: ButtonProps) => (props.icon = value))}
              />

              <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                <label style={labelStyle}>O inserisci URL</label>
                <input
                  type="text"
                  value={props.icon || ''}
                  onChange={(e) => setProp((props: any) => props.icon = e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              {props.icon && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Posizione Icona</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { value: 'left', label: 'Sinistra' },
                        { value: 'right', label: 'Destra' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setProp((props: any) => props.iconPosition = value)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: props.iconPosition === value ? '#3b82f6' : '#f3f4f6',
                            color: props.iconPosition === value ? '#fff' : '#374151',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Dimensione Icona: {props.iconSize || 20}px</label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={props.iconSize || 20}
                      onChange={(e) => setProp((props: any) => props.iconSize = parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Dimensione Font */}
            <div>
              <label style={labelStyle}>Dimensione Font: {props.fontSize || 16}px</label>
              <input
                type="range"
                min="10"
                max="48"
                value={props.fontSize || 16}
                onChange={(e) => setProp((props: any) => props.fontSize = parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Peso Font */}
            <div>
              <label style={labelStyle}>Peso Font</label>
              <select
                value={props.fontWeight || 600}
                onChange={(e) => setProp((props: any) => props.fontWeight = parseInt(e.target.value))}
                style={inputStyle}
              >
                <option value="300">Leggero (300)</option>
                <option value="400">Normale (400)</option>
                <option value="500">Medio (500)</option>
                <option value="600">Semi-Bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra-Bold (800)</option>
              </select>
            </div>

            {/* Allineamento Testo */}
            <div>
              <label style={labelStyle}>Allineamento Testo nel Pulsante</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight }
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setProp((props: any) => props.textAlign = value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: props.textAlign === value ? '#3b82f6' : '#f3f4f6',
                      color: props.textAlign === value ? '#fff' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            {/* Colori */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} />
                Colori
              </h4>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Colore Sfondo</label>
                <input
                  type="color"
                  value={props.backgroundColor || '#3b82f6'}
                  onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Colore Testo</label>
                <input
                  type="color"
                  value={props.color || '#ffffff'}
                  onChange={(e) => setProp((props: any) => props.color = e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Sfondo Hover</label>
                <input
                  type="color"
                  value={props.hoverBackgroundColor || '#2563eb'}
                  onChange={(e) => setProp((props: any) => props.hoverBackgroundColor = e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Testo Hover</label>
                <input
                  type="color"
                  value={props.hoverColor || props.color || '#ffffff'}
                  onChange={(e) => setProp((props: any) => props.hoverColor = e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Dimensioni */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize2 size={16} />
                Dimensioni
              </h4>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Padding Preset</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Piccolo', value: '6px 16px' },
                    { label: 'Medio', value: '10px 20px' },
                    { label: 'Grande', value: '14px 28px' },
                    { label: 'XL', value: '18px 36px' }
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setProp((props: any) => props.padding = size.value)}
                      style={{
                        padding: '8px',
                        background: props.padding === size.value ? '#3b82f6' : '#f3f4f6',
                        color: props.padding === size.value ? '#fff' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Larghezza</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'Auto', value: 'auto' },
                    { label: '100%', value: '100%' }
                  ].map((w) => (
                    <button
                      key={w.value}
                      onClick={() => setProp((props: any) => props.width = w.value)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: props.width === w.value ? '#3b82f6' : '#f3f4f6',
                        color: props.width === w.value ? '#fff' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bordi & Ombra */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Square size={16} />
                Bordi & Ombra
              </h4>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Raggio Bordo: {props.borderRadius || 6}px</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={props.borderRadius || 6}
                  onChange={(e) => setProp((props: any) => props.borderRadius = parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Larghezza Bordo: {props.borderWidth || 0}px</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={props.borderWidth || 0}
                  onChange={(e) => setProp((props: any) => props.borderWidth = parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {(props.borderWidth || 0) > 0 && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Colore Bordo</label>
                    <input
                      type="color"
                      value={props.borderColor || '#000000'}
                      onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
                      style={{ width: '100%', height: '36px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Stile Bordo</label>
                    <select
                      value={props.borderStyle || 'solid'}
                      onChange={(e) => setProp((props: any) => props.borderStyle = e.target.value)}
                      style={inputStyle}
                    >
                      <option value="solid">Solido</option>
                      <option value="dashed">Tratteggiato</option>
                      <option value="dotted">Punteggiato</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Ombra</label>
                <select
                  value={props.boxShadow || 'none'}
                  onChange={(e) => setProp((props: any) => props.boxShadow = e.target.value)}
                  style={inputStyle}
                >
                  <option value="none">Nessuna</option>
                  <option value="0 1px 2px rgba(0,0,0,0.05)">Piccola</option>
                  <option value="0 4px 6px rgba(0,0,0,0.1)">Media</option>
                  <option value="0 10px 15px rgba(0,0,0,0.1)">Grande</option>
                  <option value="0 20px 25px rgba(0,0,0,0.15)">Extra Large</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            {/* Posizionamento */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Move size={16} />
                Posizionamento
              </h4>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Allineamento Pulsante nella Pagina</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { value: 'left', icon: AlignLeft, label: 'Sinistra' },
                    { value: 'center', icon: AlignCenter, label: 'Centro' },
                    { value: 'right', icon: AlignRight, label: 'Destra' }
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setProp((props: any) => props.buttonAlign = value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: props.buttonAlign === value ? '#3b82f6' : '#f3f4f6',
                        color: props.buttonAlign === value ? '#fff' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Margini */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize2 size={16} />
                Margini
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>Top (px)</label>
                  <input
                    type="number"
                    value={props.marginTop || 0}
                    onChange={(e) => setProp((props: any) => props.marginTop = parseInt(e.target.value))}
                    style={inputStyle}
                    min="0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bottom (px)</label>
                  <input
                    type="number"
                    value={props.marginBottom || 0}
                    onChange={(e) => setProp((props: any) => props.marginBottom = parseInt(e.target.value))}
                    style={inputStyle}
                    min="0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Left (px)</label>
                  <input
                    type="number"
                    value={props.marginLeft || 0}
                    onChange={(e) => setProp((props: any) => props.marginLeft = parseInt(e.target.value))}
                    style={inputStyle}
                    min="0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Right (px)</label>
                  <input
                    type="number"
                    value={props.marginRight || 0}
                    onChange={(e) => setProp((props: any) => props.marginRight = parseInt(e.target.value))}
                    style={inputStyle}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text: 'Click me',
    icon: undefined,
    iconPosition: 'left',
    iconSize: 20,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '10px 20px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 6,
    borderWidth: 0,
    borderColor: '#000000',
    borderStyle: 'solid',
    boxShadow: 'none',
    hoverBackgroundColor: '#2563eb',
    hoverColor: undefined,
    width: 'auto',
    display: 'inline-block',
    textAlign: 'center',
    buttonAlign: 'left',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  },
  related: {
    toolbar: ButtonSettings
  }
};
