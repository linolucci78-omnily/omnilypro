// @ts-nocheck
import React, { type ReactNode } from 'react';
import { useNode } from '@craftjs/core';
import { Trash2, Box, Maximize2 } from 'lucide-react';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from './BackgroundControls';
import { ColorPicker } from './ColorPicker';

export interface ContainerProps {
  children?: ReactNode;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  boxShadow?: string;
  width?: string;
  minHeight?: number;
  background?: BackgroundSettings;
}

const ContainerSettings = () => {
  const {
    actions: { setProp, delete: deleteNode },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div>
      {/* Header con pulsante elimina */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={16} />
          Impostazioni Container
        </h3>
        <button
          onClick={() => {
            if (window.confirm('Sei sicuro di voler eliminare questo container?')) {
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

      {/* Dimensioni */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Maximize2 size={14} />
          Dimensioni
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            Larghezza
          </label>
          <select
            value={props.width || '100%'}
            onChange={(e) => setProp((props: ContainerProps) => (props.width = e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="100%">Piena (100%)</option>
            <option value="75%">3/4 (75%)</option>
            <option value="66.666%">2/3 (66%)</option>
            <option value="50%">Met� (50%)</option>
            <option value="33.333%">1/3 (33%)</option>
            <option value="25%">1/4 (25%)</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Altezza Minima</span>
            <span>{props.minHeight || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="800"
            step="50"
            value={props.minHeight || 0}
            onChange={(e) => setProp((props: ContainerProps) => (props.minHeight = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Spaziatura */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600' }}>
          Spaziatura
        </h4>

        {/* Padding */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Padding Interno</span>
            <span>{props.padding || 20}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={props.padding || 20}
            onChange={(e) => setProp((props: ContainerProps) => (props.padding = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Margin */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Margine Esterno</span>
            <span>{props.margin || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={props.margin || 0}
            onChange={(e) => setProp((props: ContainerProps) => (props.margin = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Bordi */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600' }}>
          Bordi
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Border Radius</span>
            <span>{props.borderRadius || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={props.borderRadius || 0}
            onChange={(e) => setProp((props: ContainerProps) => (props.borderRadius = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Spessore Bordo</span>
            <span>{props.borderWidth || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={props.borderWidth || 0}
            onChange={(e) => setProp((props: ContainerProps) => (props.borderWidth = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        {(props.borderWidth || 0) > 0 && (
          <>
            <ColorPicker
              label="Colore Bordo"
              value={props.borderColor || '#e5e7eb'}
              onChange={(value) => setProp((props: ContainerProps) => (props.borderColor = value))}
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Stile Bordo
              </label>
              <select
                value={props.borderStyle || 'solid'}
                onChange={(e) => setProp((props: ContainerProps) => (props.borderStyle = e.target.value as any))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <option value="solid">Solido</option>
                <option value="dashed">Tratteggiato</option>
                <option value="dotted">Punteggiato</option>
              </select>
            </div>
          </>
        )}

        {/* Box Shadow */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            Ombra
          </label>
          <select
            value={props.boxShadow || 'none'}
            onChange={(e) => setProp((props: ContainerProps) => (props.boxShadow = e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="none">Nessuna</option>
            <option value="0 1px 2px rgba(0,0,0,0.05)">Piccola</option>
            <option value="0 4px 6px rgba(0,0,0,0.1)">Media</option>
            <option value="0 10px 15px rgba(0,0,0,0.1)">Grande</option>
            <option value="0 20px 25px rgba(0,0,0,0.15)">Extra Large</option>
          </select>
        </div>
      </div>

      {/* Background */}
      <div style={{ padding: '0 16px 16px' }}>
        <BackgroundControls
          settings={props.background || {}}
          onChange={(background) => setProp((props: ContainerProps) => (props.background = background))}
        />
      </div>
    </div>
  );
};

export const Container: React.FC<ContainerProps> = ({
  children,
  padding = 20,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin = 0,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  borderRadius = 0,
  borderWidth = 0,
  borderColor = '#e5e7eb',
  borderStyle = 'solid',
  boxShadow = 'none',
  width = '100%',
  minHeight = 0,
  background = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const backgroundStyles = getBackgroundStyles(background);
  const overlayStyles = getOverlayStyles(background);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        position: 'relative',
        width,
        minHeight: minHeight || 'auto',
        paddingTop: paddingTop ?? padding,
        paddingBottom: paddingBottom ?? padding,
        paddingLeft: paddingLeft ?? padding,
        paddingRight: paddingRight ?? padding,
        marginTop: marginTop ?? margin,
        marginBottom: marginBottom ?? margin,
        marginLeft: marginLeft ?? margin,
        marginRight: marginRight ?? margin,
        borderRadius: `${borderRadius}px`,
        border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
        boxShadow,
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '2px',
        ...backgroundStyles,
      }}
    >
      {/* Overlay */}
      {overlayStyles && <div style={{ ...overlayStyles, borderRadius: `${borderRadius}px` }} />}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    padding: 20,
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    boxShadow: 'none',
    width: '100%',
    minHeight: 0,
    background: {},
  },
  related: {
    toolbar: ContainerSettings,
  },
};
