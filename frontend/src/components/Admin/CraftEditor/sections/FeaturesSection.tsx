// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { FileText, Palette, Settings, Plus, X } from 'lucide-react';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from '../components/BackgroundControls';
import { getResponsivePadding, getResponsiveFontSize } from '../utils/responsive';
import { useViewport } from '../contexts/ViewportContext';

interface Feature {
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  backgroundColor?: string;
  textColor?: string;
  columns?: number;
  paddingTop?: number;
  paddingBottom?: number;
  minHeight?: number;
  background?: BackgroundSettings;
  sectionId?: string; // ID per ancore di navigazione
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  title = 'Our Features',
  subtitle = 'Discover what makes us special',
  features = [
    { title: 'Feature 1', description: 'Description for feature 1' },
    { title: 'Feature 2', description: 'Description for feature 2' },
    { title: 'Feature 3', description: 'Description for feature 3' },
  ],
  backgroundColor = '#ffffff',
  textColor = '#1a1a1a',
  columns = 3,
  paddingTop = 60,
  paddingBottom = 60,
  minHeight = 0,
  background = {},
  sectionId = 'features',
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
  const responsiveColumns = viewportMode === 'mobile' ? 1 : viewportMode === 'tablet' ? Math.min(columns, 2) : columns;
  const responsivePaddingTop = getResponsivePadding(paddingTop, viewportMode);
  const responsivePaddingBottom = getResponsivePadding(paddingBottom, viewportMode);
  const responsiveMinHeight = minHeight && viewportMode === 'mobile' ? minHeight * 0.6 : minHeight && viewportMode === 'tablet' ? minHeight * 0.8 : minHeight;

  // Build style object without conflicts
  const sectionStyle: React.CSSProperties = {
    ...backgroundStyles,
    color: textColor,
    paddingTop: `${responsivePaddingTop}px`,
    paddingBottom: `${responsivePaddingBottom}px`,
    minHeight: responsiveMinHeight ? `${responsiveMinHeight}px` : 'auto',
    position: 'relative',
  };

  // Only add backgroundColor if no background was set
  if (!backgroundStyles.background && !backgroundStyles.backgroundImage) {
    sectionStyle.backgroundColor = backgroundColor;
  }

  return (
    <section
      id={sectionId}
      className={selected ? 'node-selected' : ''}
      data-cy="Features Section"
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      style={sectionStyle}
    >
      {overlayStyles && <div style={{ ...overlayStyles }} />}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '15px', fontWeight: 'bold' }}>
            {title}
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.8 }}>
            {subtitle}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
            gap: viewportMode === 'mobile' ? '20px' : '30px',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '30px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '24px', marginBottom: '15px', fontWeight: '600' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '16px', opacity: 0.8 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FeaturesSection Settings Toolbar - TIPO ELEMENTOR
const FeaturesSectionSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  const [activeTab, setActiveTab] = useState('content');

  // Feature management functions
  const addFeature = () => {
    setProp((props: any) => {
      props.features = [...(props.features || []), { title: 'New Feature', description: 'Feature description', icon: '' }];
    });
  };

  const removeFeature = (index: number) => {
    setProp((props: any) => {
      props.features = props.features.filter((_: any, i: number) => i !== index);
    });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    setProp((props: any) => {
      props.features[index][field] = value;
    });
  };

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
                placeholder="es: features, about, services"
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
                Usa questo ID nei link del menu (es: #features, #about)
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

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                  Features ({(props.features || []).length})
                </label>
                <button
                  onClick={addFeature}
                  style={{
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  Aggiungi
                </button>
              </div>

              {/* Lista features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {(props.features || []).map((feature: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Feature {index + 1}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        style={{
                          padding: '4px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={feature.title}
                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                        placeholder="Titolo feature"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: 'white'
                        }}
                      />
                      <textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                        placeholder="Descrizione feature"
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          resize: 'vertical',
                          background: 'white',
                          fontFamily: 'inherit'
                        }}
                      />
                      <input
                        type="text"
                        value={feature.icon || ''}
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        placeholder="URL icona (opzionale)"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Numero Colonne: {props.columns}
              </label>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={props.columns}
                onChange={(e) => setProp((props: any) => props.columns = parseInt(e.target.value))}
                style={{ width: '100%' }}
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

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Colore Testo
              </label>
              <input
                type="color"
                value={props.textColor}
                onChange={(e) => setProp((props: any) => props.textColor = e.target.value)}
                style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
              />
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
                min="0"
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

FeaturesSection.craft = {
  displayName: 'Features Section',
  props: {
    title: 'Our Features',
    subtitle: 'Discover what makes us special',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    columns: 3,
    paddingTop: 60,
    paddingBottom: 60,
    minHeight: 0,
    background: {},
    sectionId: 'features',
  },
  related: {
    toolbar: FeaturesSectionSettings,
  },
};
