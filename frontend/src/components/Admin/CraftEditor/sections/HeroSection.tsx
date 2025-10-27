// @ts-nocheck
import React, { useState } from 'react';
import { useNode, Element } from '@craftjs/core';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from '../components/BackgroundControls';
import { FileText, Palette, Settings } from 'lucide-react';
import { getResponsivePadding } from '../utils/responsive';
import { useViewport } from '../contexts/ViewportContext';

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  minHeight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  background?: BackgroundSettings;
  sectionId?: string; // ID per le ancore di navigazione
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Benvenuti',
  subtitle = 'Il tuo sottotitolo',
  backgroundColor = '#667eea',
  minHeight = 400,
  paddingTop = 60,
  paddingBottom = 60,
  background = {},
  sectionId = 'hero'
}) => {
  const {
    connectors: { connect, drag },
    selected
  } = useNode((node) => ({
    selected: node.events.selected
  }));

  const { viewportMode } = useViewport();

  const backgroundStyles = getBackgroundStyles(background);
  const overlayStyles = getOverlayStyles(background);

  // Calculate responsive values based on viewportMode
  const responsiveMinHeight = viewportMode === 'mobile' ? minHeight * 0.6 : viewportMode === 'tablet' ? minHeight * 0.8 : minHeight;
  const responsivePaddingTop = getResponsivePadding(paddingTop, viewportMode);
  const responsivePaddingBottom = getResponsivePadding(paddingBottom, viewportMode);

  // Build style object without conflicts
  const sectionStyle: React.CSSProperties = {
    ...backgroundStyles,
    minHeight: `${responsiveMinHeight}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: `${responsivePaddingTop}px`,
    paddingBottom: `${responsivePaddingBottom}px`,
    paddingLeft: viewportMode === 'mobile' ? '15px' : '20px',
    paddingRight: viewportMode === 'mobile' ? '15px' : '20px',
    position: 'relative',
  };

  // Only add background gradient if no background was set
  if (!backgroundStyles.background && !backgroundStyles.backgroundImage) {
    sectionStyle.background = `linear-gradient(135deg, ${backgroundColor} 0%, #764ba2 100%)`;
  }

  return (
    <div
      id={sectionId}
      className={selected ? 'node-selected' : ''}
      ref={(ref) => connect(drag(ref as HTMLElement))}
      style={sectionStyle}
      data-cy="Hero Section"
    >
      {overlayStyles && <div style={{ ...overlayStyles }} />}
      <Element
        id="hero-container"
        is={Container}
        canvas
        background="transparent"
        padding={20}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={20}
        custom={{ displayName: 'Hero Content' }}
      >
        <Element id="hero-title" is={Text} text={title} fontSize={48} fontWeight={700} color="#ffffff" textAlign="center" />
        <Element id="hero-subtitle" is={Text} text={subtitle} fontSize={20} fontWeight={400} color="#ffffff" textAlign="center" />
        <Element id="hero-button" is={Button} text="Scopri di più" backgroundColor="#ffffff" color="#667eea" />
      </Element>
    </div>
  );
};

// HeroSection Settings Toolbar - TIPO ELEMENTOR
const HeroSectionSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  const [activeTab, setActiveTab] = useState('content');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* TABS - Tipo Elementor */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
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

      {/* TAB CONTENT */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>

        {/* CONTENUTO TAB */}
        {activeTab === 'content' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                ID Sezione (per link menu)
              </label>
              <input
                type="text"
                value={props.sectionId}
                onChange={(e) => setProp((props: any) => props.sectionId = e.target.value)}
                placeholder="es: hero, about, services"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}
              />
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 16px 0' }}>
                Usa questo ID nei link del menu (es: #hero, #about)
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Titolo
              </label>
              <input
                type="text"
                value={props.title}
                onChange={(e) => setProp((props: any) => props.title = e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Sottotitolo
              </label>
              <input
                type="text"
                value={props.subtitle}
                onChange={(e) => setProp((props: any) => props.subtitle = e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </div>
          </>
        )}

        {/* STILE TAB */}
        {activeTab === 'style' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} />
                Background
              </h4>
              <BackgroundControls
                settings={props.background || {}}
                onChange={(background) => setProp((props: any) => props.background = background)}
              />
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Colore Sfondo (Fallback)
              </label>
              <input
                type="color"
                value={props.backgroundColor}
                onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
                style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
              />
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                Usato se non imposti un'immagine di background
              </p>
            </div>
          </>
        )}

        {/* AVANZATE TAB */}
        {activeTab === 'advanced' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Altezza Minima: {props.minHeight}px
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                value={props.minHeight}
                onChange={(e) => setProp((props: any) => props.minHeight = parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Padding Top: {props.paddingTop}px
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={props.paddingTop}
                onChange={(e) => setProp((props: any) => props.paddingTop = parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Padding Bottom: {props.paddingBottom}px
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={props.paddingBottom}
                onChange={(e) => setProp((props: any) => props.paddingBottom = parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

HeroSection.craft = {
  displayName: 'Hero Section',
  props: {
    title: 'Benvenuti',
    subtitle: 'Il tuo sottotitolo',
    backgroundColor: '#667eea',
    minHeight: 400,
    paddingTop: 60,
    paddingBottom: 60,
    background: {}
  },
  related: {
    toolbar: HeroSectionSettings
  }
};
