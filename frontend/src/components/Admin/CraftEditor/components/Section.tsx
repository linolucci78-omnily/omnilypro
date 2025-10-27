// @ts-nocheck
import React, { type ReactNode } from 'react';
import { useNode } from '@craftjs/core';
import { Trash2, Square, Maximize2 } from 'lucide-react';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from './BackgroundControls';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../ConfirmModal';

export interface SectionProps {
  children?: ReactNode;
  sectionId?: string;
  sectionName?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  minHeight?: number;
  maxWidth?: number | string;
  background?: BackgroundSettings;
}

const SectionSettings = () => {
  const {
    actions: { setProp, delete: deleteNode },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  return (
    <div>
      <ConfirmModal
        isOpen={isOpen}
        title={options?.title}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

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
          <Square size={16} />
          Impostazioni Sezione
        </h3>
        <button
          onClick={() => {
            confirm({
              title: 'Elimina Sezione',
              message: 'Sei sicuro di voler eliminare questa sezione?',
              type: 'danger',
              confirmText: 'Elimina',
              cancelText: 'Annulla',
              onConfirm: () => deleteNode()
            });
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

      {/* ID/Ancora per navigazione */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600' }}>
          🔗 Navigazione
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            Nome Sezione (per menu)
          </label>
          <input
            type="text"
            value={props.sectionName || ''}
            onChange={(e) => setProp((props: SectionProps) => (props.sectionName = e.target.value))}
            placeholder="es. Home, Chi Siamo, Contatti"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
            Nome visualizzato nel menu di navigazione
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            ID Ancora (per link)
          </label>
          <input
            type="text"
            value={props.sectionId || ''}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
              setProp((props: SectionProps) => (props.sectionId = value));
            }}
            placeholder="es. home, chi-siamo, contatti"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          />
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
            Link: #{props.sectionId || 'id-sezione'}
          </p>
        </div>
      </div>

      {/* Spacing Controls */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Maximize2 size={14} />
          Spaziatura
        </h4>

        {/* Unified Padding */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Padding</span>
            <span>{props.padding || 40}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={props.padding || 40}
            onChange={(e) => setProp((props: SectionProps) => (props.padding = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Individual Padding */}
        <details style={{ marginBottom: '16px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            Padding Avanzato
          </summary>

          <div style={{ paddingLeft: '12px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span>Alto</span>
                <span>{props.paddingTop ?? props.padding ?? 40}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={props.paddingTop ?? props.padding ?? 40}
                onChange={(e) => setProp((props: SectionProps) => (props.paddingTop = parseInt(e.target.value)))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span>Basso</span>
                <span>{props.paddingBottom ?? props.padding ?? 40}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={props.paddingBottom ?? props.padding ?? 40}
                onChange={(e) => setProp((props: SectionProps) => (props.paddingBottom = parseInt(e.target.value)))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span>Sinistra</span>
                <span>{props.paddingLeft ?? props.padding ?? 40}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={props.paddingLeft ?? props.padding ?? 40}
                onChange={(e) => setProp((props: SectionProps) => (props.paddingLeft = parseInt(e.target.value)))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span>Destra</span>
                <span>{props.paddingRight ?? props.padding ?? 40}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={props.paddingRight ?? props.padding ?? 40}
                onChange={(e) => setProp((props: SectionProps) => (props.paddingRight = parseInt(e.target.value)))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </details>

        {/* Min Height */}
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
            onChange={(e) => setProp((props: SectionProps) => (props.minHeight = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Max Width */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            Larghezza Massima
          </label>
          <select
            value={props.maxWidth || '100%'}
            onChange={(e) => setProp((props: SectionProps) => (props.maxWidth = e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="100%">Piena (100%)</option>
            <option value="1536">Extra Large (1536px)</option>
            <option value="1280">Large (1280px)</option>
            <option value="1024">Medium (1024px)</option>
            <option value="768">Small (768px)</option>
          </select>
        </div>
      </div>

      {/* Background Controls */}
      <div style={{ padding: '0 16px 16px' }}>
        <BackgroundControls
          settings={props.background || {}}
          onChange={(background) => setProp((props: SectionProps) => (props.background = background))}
        />
      </div>
    </div>
  );
};

export const Section: React.FC<SectionProps> = ({
  children,
  sectionId,
  sectionName,
  padding = 40,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  minHeight = 0,
  maxWidth = '100%',
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
    <section
      id={sectionId}
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: minHeight || 'auto',
        paddingTop: paddingTop ?? padding,
        paddingBottom: paddingBottom ?? padding,
        paddingLeft: paddingLeft ?? padding,
        paddingRight: paddingRight ?? padding,
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '-2px',
        ...backgroundStyles,
      }}
    >
      {/* Overlay */}
      {overlayStyles && <div style={overlayStyles} />}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </section>
  );
};

Section.craft = {
  displayName: 'Section',
  props: {
    padding: 40,
    minHeight: 0,
    maxWidth: '100%',
    background: {},
  },
  related: {
    settings: SectionSettings,
  },
};
