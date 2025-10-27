// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { getResponsivePadding } from '../utils/responsive';
import { useViewport } from '../contexts/ViewportContext';
import { FileText, Palette, Settings, Image as ImageIcon, Plus, X } from 'lucide-react';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from '../components/BackgroundControls';

interface GallerySectionProps {
  title?: string;
  subtitle?: string;
  images?: string[];
  backgroundColor?: string;
  textColor?: string;
  columns?: number;
  paddingTop?: number;
  paddingBottom?: number;
  minHeight?: number;
  background?: BackgroundSettings;
  sectionId?: string; // ID per ancore di navigazione
  // Effetti immagini
  imageHoverEffect?: 'zoom' | 'brightness' | 'grayscale' | 'none';
  imageBorderRadius?: number;
  imageAspectRatio?: string;
  imageObjectFit?: 'cover' | 'contain' | 'fill';
  imageGap?: number;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  title = 'Gallery',
  subtitle = 'Browse our collection',
  images = [
    'https://via.placeholder.com/400x300',
    'https://via.placeholder.com/400x300',
    'https://via.placeholder.com/400x300',
    'https://via.placeholder.com/400x300',
  ],
  backgroundColor = '#ffffff',
  textColor = '#1a1a1a',
  columns = 4,
  paddingTop = 60,
  paddingBottom = 60,
  minHeight = 0,
  background = {},
  sectionId = 'gallery',
  imageHoverEffect = 'zoom',
  imageBorderRadius = 8,
  imageAspectRatio = '4/3',
  imageObjectFit = 'cover',
  imageGap = 20,
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

  // Calculate responsive values
  const responsiveColumns = viewportMode === 'mobile' ? 1 : viewportMode === 'tablet' ? 2 : columns;
  const responsivePaddingTop = getResponsivePadding(paddingTop, viewportMode);
  const responsivePaddingBottom = getResponsivePadding(paddingBottom, viewportMode);
  const responsiveMinHeight = minHeight && viewportMode === 'mobile' ? minHeight * 0.6 : minHeight && viewportMode === 'tablet' ? minHeight * 0.8 : minHeight;
  const responsiveGap = viewportMode === 'mobile' ? imageGap * 0.75 : imageGap;

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

  // Hover effect classes
  const getHoverClass = () => {
    switch (imageHoverEffect) {
      case 'zoom': return 'gallery-image-zoom';
      case 'brightness': return 'gallery-image-brightness';
      case 'grayscale': return 'gallery-image-grayscale';
      default: return '';
    }
  };

  return (
    <section
      id={sectionId}
      className={selected ? 'node-selected' : ''}
      data-cy="Gallery Section"
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
            gap: `${responsiveGap}px`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                aspectRatio: imageAspectRatio,
                overflow: 'hidden',
                borderRadius: `${imageBorderRadius}px`,
                transition: 'transform 0.3s ease',
              }}
              className={getHoverClass()}
            >
              <img
                src={image}
                alt={`Gallery ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: imageObjectFit,
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Gallery Section Settings Toolbar - TIPO ELEMENTOR
const GallerySectionSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  const [activeTab, setActiveTab] = useState('content');
  const [newImageUrl, setNewImageUrl] = useState('');

  const addImage = () => {
    if (newImageUrl.trim()) {
      setProp((props: any) => {
        props.images = [...(props.images || []), newImageUrl];
      });
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setProp((props: any) => {
      props.images = props.images.filter((_: any, i: number) => i !== index);
    });
  };

  const updateImage = (index: number, newUrl: string) => {
    setProp((props: any) => {
      props.images[index] = newUrl;
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
                placeholder="es: gallery, galleria, foto"
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
                Usa questo ID nei link del menu (es: #gallery, #foto)
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
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} />
                Immagini Gallery ({props.images?.length || 0})
              </h4>

              {/* Lista immagini */}
              <div style={{ marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                {(props.images || []).map((image: string, index: number) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <img src={image} alt={`Preview ${index}`} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => updateImage(index, e.target.value)}
                      placeholder="URL immagine"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      style={{
                        padding: '6px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Aggiungi immagine */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="URL nuova immagine"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <button
                  onClick={addImage}
                  style={{
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} />
                  Aggiungi
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                Numero Colonne: {props.columns}
              </label>
              <input
                type="range"
                min="1"
                max="6"
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

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                Stile Immagini
              </h4>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Effetto Hover
                </label>
                <select
                  value={props.imageHoverEffect}
                  onChange={(e) => setProp((props: any) => props.imageHoverEffect = e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                >
                  <option value="none">Nessuno</option>
                  <option value="zoom">Zoom</option>
                  <option value="brightness">Luminosità</option>
                  <option value="grayscale">Scala di grigi</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Bordo Arrotondato: {props.imageBorderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={props.imageBorderRadius}
                  onChange={(e) => setProp((props: any) => props.imageBorderRadius = parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Aspect Ratio
                </label>
                <select
                  value={props.imageAspectRatio}
                  onChange={(e) => setProp((props: any) => props.imageAspectRatio = e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                >
                  <option value="1/1">Quadrato (1:1)</option>
                  <option value="4/3">Orizzontale (4:3)</option>
                  <option value="16/9">Widescreen (16:9)</option>
                  <option value="3/4">Verticale (3:4)</option>
                  <option value="9/16">Verticale (9:16)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Object Fit
                </label>
                <select
                  value={props.imageObjectFit}
                  onChange={(e) => setProp((props: any) => props.imageObjectFit = e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                >
                  <option value="cover">Cover (riempi)</option>
                  <option value="contain">Contain (adatta)</option>
                  <option value="fill">Fill (stiracchia)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Gap tra Immagini: {props.imageGap}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={props.imageGap}
                  onChange={(e) => setProp((props: any) => props.imageGap = parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
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

GallerySection.craft = {
  displayName: 'Gallery Section',
  props: {
    title: 'Gallery',
    subtitle: 'Browse our collection',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    columns: 4,
    paddingTop: 60,
    paddingBottom: 60,
    minHeight: 0,
    background: {},
    sectionId: 'gallery',
    imageHoverEffect: 'zoom',
    imageBorderRadius: 8,
    imageAspectRatio: '4/3',
    imageObjectFit: 'cover',
    imageGap: 20,
  },
  related: {
    toolbar: GallerySectionSettings,
  },
};
