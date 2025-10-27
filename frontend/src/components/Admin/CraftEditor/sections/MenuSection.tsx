// @ts-nocheck
import React, { useState } from 'react';
import { useNode, Element } from '@craftjs/core';
import { SelectionIndicator, getSelectionStyles } from '../components/SelectionIndicator';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from '../components/BackgroundControls';
import { Type, Palette, Layout, Maximize2, Sparkles, Image as ImageIcon, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getResponsivePadding } from '../utils/responsive';
import { useViewport } from '../contexts/ViewportContext';

interface MenuItem {
  name: string;
  description: string;
  price: number;
  image?: string;
}

interface MenuSectionProps {
  // Contenuto
  title?: string;
  subtitle?: string;
  items?: MenuItem[];

  // Layout
  columns?: number;
  showImages?: boolean;
  maxWidth?: string;

  // Colori
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
  priceColor?: string;
  cardBackground?: string;

  // Spaziatura
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  cardPadding?: number;
  gap?: number;

  // Effetti
  cardShadow?: string;
  cardRadius?: number;
  hoverEffect?: boolean;

  // Effetti Immagini Prodotti
  imageHoverEffect?: 'zoom' | 'brightness' | 'grayscale' | 'none';
  imageBorderRadius?: number;
  imageAspectRatio?: string;
  imageObjectFit?: 'cover' | 'contain' | 'fill';
  imageOverlay?: boolean;
  imageOverlayColor?: string;
  imageOverlayOpacity?: number;

  // Background Properties
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto' | 'custom';
  backgroundPosition?: string;
  backgroundAttachment?: 'scroll' | 'fixed' | 'local';
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
}

// Settings Panel - MUST be defined before MenuSection.craft
const MenuSectionSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['contenuto']));
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, image: '' });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addItem = () => {
    if (newItem.name && newItem.price > 0) {
      setProp((props: MenuSectionProps) => {
        props.items = [...(props.items || []), { ...newItem }];
      });
      setNewItem({ name: '', description: '', price: 0, image: '' });
    }
  };

  const removeItem = (index: number) => {
    setProp((props: MenuSectionProps) => {
      props.items = props.items?.filter((_, i) => i !== index);
    });
  };

  // Styles
  const accordionHeaderStyle = (isExpanded: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: isExpanded ? '#f9fafb' : '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: isExpanded ? '12px' : '8px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
  });

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    transition: 'border 0.2s',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  };

  const sliderLabelStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  };

  const buttonGroupStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    marginBottom: '16px',
  };

  const buttonStyle = (isActive: boolean) => ({
    padding: '8px',
    border: isActive ? '2px solid #3b82f6' : '1.5px solid #e5e7eb',
    borderRadius: '6px',
    background: isActive ? '#eff6ff' : '#fff',
    color: isActive ? '#3b82f6' : '#6b7280',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center' as const,
  });

  const AccordionSection: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, icon, children }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div style={{ marginBottom: '8px' }}>
        <div onClick={() => toggleSection(id)} style={accordionHeaderStyle(isExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon}
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{title}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {isExpanded && <div style={{ paddingLeft: '8px', paddingRight: '8px' }}>{children}</div>}
      </div>
    );
  };

  return (
    <div>
      {/* Contenuto Section */}
      <AccordionSection id="contenuto" title="Contenuto" icon={<Type size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Titolo</label>
            <input
              type="text"
              value={props.title}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.title = e.target.value))}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Sottotitolo</label>
            <input
              type="text"
              value={props.subtitle}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.subtitle = e.target.value))}
              style={inputStyle}
            />
          </div>

          <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Prodotti ({props.items?.length || 0})</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
            {props.items?.map((item, index) => (
              <div key={index} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>€{item.price.toFixed(2)}</div>
                </div>
                <button onClick={() => removeItem(index)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Elimina</button>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Aggiungi Prodotto</h4>
            <input
              type="text"
              placeholder="Nome prodotto"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              style={{ ...inputStyle, marginBottom: '8px' }}
            />
            <textarea
              placeholder="Descrizione"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              style={{ ...inputStyle, marginBottom: '8px', minHeight: '60px', resize: 'vertical' }}
            />
            <input
              type="number"
              placeholder="Prezzo"
              value={newItem.price || ''}
              onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
              step="0.50"
              min="0"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <button
              onClick={addItem}
              disabled={!newItem.name || newItem.price <= 0}
              style={{
                width: '100%',
                padding: '10px',
                background: newItem.name && newItem.price > 0 ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: newItem.name && newItem.price > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Aggiungi
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Colori Section */}
      <AccordionSection id="colori" title="Colori" icon={<Palette size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Colore Sfondo Sezione</label>
            <input
              type="color"
              value={props.backgroundColor}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.backgroundColor = e.target.value))}
              style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Colore Testo</label>
            <input
              type="color"
              value={props.textColor}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.textColor = e.target.value))}
              style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Colore Titolo</label>
            <input
              type="color"
              value={props.titleColor}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.titleColor = e.target.value))}
              style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Colore Prezzo</label>
            <input
              type="color"
              value={props.priceColor}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.priceColor = e.target.value))}
              style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Colore Sfondo Card</label>
            <input
              type="color"
              value={props.cardBackground}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.cardBackground = e.target.value))}
              style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Layout Section */}
      <AccordionSection id="layout" title="Layout" icon={<Layout size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Colonne</label>
            <select
              value={props.columns}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.columns = parseInt(e.target.value)))}
              style={inputStyle}
            >
              <option value={1}>1 Colonna</option>
              <option value={2}>2 Colonne</option>
              <option value={3}>3 Colonne</option>
              <option value={4}>4 Colonne</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Larghezza Massima</label>
            <input
              type="text"
              value={props.maxWidth}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.maxWidth = e.target.value))}
              style={inputStyle}
              placeholder="es. 1200px, 100%, 90vw"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.showImages}
                onChange={(e) => setProp((props: MenuSectionProps) => (props.showImages = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Immagini</span>
            </label>
          </div>
        </div>
      </AccordionSection>

      {/* Spaziatura Section */}
      <AccordionSection id="spaziatura" title="Spaziatura" icon={<Maximize2 size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Padding Superiore (px): {props.paddingTop}</label>
            <input
              type="range"
              min="0"
              max="120"
              value={props.paddingTop}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.paddingTop = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Padding Inferiore (px): {props.paddingBottom}</label>
            <input
              type="range"
              min="0"
              max="120"
              value={props.paddingBottom}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.paddingBottom = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Padding Sinistro (px): {props.paddingLeft}</label>
            <input
              type="range"
              min="0"
              max="120"
              value={props.paddingLeft}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.paddingLeft = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Padding Destro (px): {props.paddingRight}</label>
            <input
              type="range"
              min="0"
              max="120"
              value={props.paddingRight}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.paddingRight = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Padding Card (px): {props.cardPadding}</label>
            <input
              type="range"
              min="12"
              max="48"
              value={props.cardPadding}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.cardPadding = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Spaziatura tra Card (px): {props.gap}</label>
            <input
              type="range"
              min="10"
              max="60"
              value={props.gap}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.gap = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Effetti Section */}
      <AccordionSection id="effetti" title="Effetti" icon={<Sparkles size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Raggio Bordi Card (px): {props.cardRadius}</label>
            <input
              type="range"
              min="0"
              max="30"
              value={props.cardRadius}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.cardRadius = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Ombra Card</label>
            <select
              value={props.cardShadow}
              onChange={(e) => setProp((props: MenuSectionProps) => (props.cardShadow = e.target.value))}
              style={inputStyle}
            >
              <option value="none">Nessuna</option>
              <option value="0 1px 3px rgba(0,0,0,0.1)">Leggera</option>
              <option value="0 4px 20px rgba(0,0,0,0.08)">Media</option>
              <option value="0 10px 40px rgba(0,0,0,0.12)">Forte</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.hoverEffect}
                onChange={(e) => setProp((props: MenuSectionProps) => (props.hoverEffect = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Abilita Effetto Hover Card</span>
            </label>
          </div>

          {/* Divisore */}
          <div style={{ margin: '24px 0', borderTop: '2px solid #e5e7eb', paddingTop: '16px' }}>
            <div style={{ ...labelStyle, fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
              <ImageIcon size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Effetti Immagini Prodotti
            </div>

            {/* Image Hover Effect */}
            <div style={{ marginBottom: '16px' }}>
              <div style={labelStyle}>Effetto Hover Immagine</div>
              <div style={buttonGroupStyle}>
                {[
                  { value: 'none', label: 'Nessuno', emoji: '⭕' },
                  { value: 'zoom', label: 'Zoom', emoji: '🔍' },
                  { value: 'brightness', label: 'Luminosità', emoji: '💡' },
                  { value: 'grayscale', label: 'B&N', emoji: '⚫' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProp((p: MenuSectionProps) => (p.imageHoverEffect = option.value as any))}
                    style={buttonStyle((props.imageHoverEffect || 'none') === option.value)}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '4px' }}>{option.emoji}</div>
                    <div style={{ fontSize: '10px' }}>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Border Radius */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sliderLabelStyle}>
                <span>Bordi Immagine</span>
                <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.imageBorderRadius || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={props.imageBorderRadius || 0}
                onChange={(e) => setProp((p: MenuSectionProps) => (p.imageBorderRadius = parseInt(e.target.value)))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Image Object Fit */}
            <div style={{ marginBottom: '16px' }}>
              <div style={labelStyle}>Adattamento Immagine</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { value: 'cover', label: 'Cover' },
                  { value: 'contain', label: 'Contain' },
                  { value: 'fill', label: 'Fill' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProp((p: MenuSectionProps) => (p.imageObjectFit = option.value as any))}
                    style={buttonStyle((props.imageObjectFit || 'cover') === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Overlay */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
              onClick={() => setProp((p: MenuSectionProps) => (p.imageOverlay = !p.imageOverlay))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} color="#6b7280" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Overlay su Immagini
                </span>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '22px',
                  background: props.imageOverlay ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '11px',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: props.imageOverlay ? '20px' : '2px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Image Overlay Controls */}
            {props.imageOverlay && (
              <div
                style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  marginTop: '12px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={labelStyle}>Colore Overlay Immagini</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={props.imageOverlayColor || '#000000'}
                      onChange={(e) => setProp((p: MenuSectionProps) => (p.imageOverlayColor = e.target.value))}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={props.imageOverlayColor || '#000000'}
                      onChange={(e) => setProp((p: MenuSectionProps) => (p.imageOverlayColor = e.target.value))}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={sliderLabelStyle}>
                    <span>Opacità Overlay</span>
                    <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                      {Math.round((props.imageOverlayOpacity || 0.3) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={props.imageOverlayOpacity || 0.3}
                    onChange={(e) => setProp((p: MenuSectionProps) => (p.imageOverlayOpacity = parseFloat(e.target.value)))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* Sfondo Section */}
      <AccordionSection id="sfondo" title="Sfondo" icon={<ImageIcon size={16} color="#6b7280" />}>
        <BackgroundControls
          settings={{
            backgroundColor: props.backgroundColor,
            backgroundImage: props.backgroundImage,
            backgroundSize: props.backgroundSize,
            backgroundPosition: props.backgroundPosition,
            backgroundAttachment: props.backgroundAttachment,
            overlayEnabled: props.overlay,
            overlayColor: props.overlayColor,
            overlayOpacity: props.overlayOpacity,
          }}
          onChange={(settings) => {
            setProp((props: any) => {
              props.backgroundColor = settings.backgroundColor;
              props.backgroundImage = settings.backgroundImage;
              props.backgroundSize = settings.backgroundSize;
              props.backgroundPosition = settings.backgroundPosition;
              props.backgroundAttachment = settings.backgroundAttachment;
              props.overlay = settings.overlayEnabled;
              props.overlayColor = settings.overlayColor;
              props.overlayOpacity = settings.overlayOpacity;
            });
          }}
        />
      </AccordionSection>
    </div>
  );
};

export const MenuSection: React.FC<MenuSectionProps> = ({
  // Contenuto
  title = 'Il Nostro Menu',
  subtitle = 'Scopri le nostre specialità',
  items = [
    { name: 'Margherita DOC', description: 'Pomodoro, mozzarella di bufala, basilico', price: 8.50 },
    { name: 'Diavola', description: 'Pomodoro, mozzarella, salame piccante', price: 9.50 },
    { name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmigiano, taleggio', price: 10.50 },
  ],

  // Layout
  columns = 2,
  showImages = true,
  maxWidth = '1200px',

  // Colori
  backgroundColor = '#f8f9fa',
  textColor = '#1a1a1a',
  titleColor = '#1a1a1a',
  priceColor = '#3b82f6',
  cardBackground = '#ffffff',

  // Spaziatura
  paddingTop = 60,
  paddingBottom = 60,
  paddingLeft = 20,
  paddingRight = 20,
  cardPadding = 24,
  gap = 30,

  // Effetti
  cardShadow = '0 4px 20px rgba(0, 0, 0, 0.08)',
  cardRadius = 12,
  hoverEffect = true,

  // Effetti Immagini
  imageHoverEffect = 'zoom',
  imageBorderRadius = 0,
  imageAspectRatio = '16/9',
  imageObjectFit = 'cover',
  imageOverlay = false,
  imageOverlayColor = '#000000',
  imageOverlayOpacity = 0.3,

  // Background
  backgroundImage,
  backgroundSize = 'cover',
  backgroundPosition = 'center',
  backgroundAttachment = 'scroll',
  overlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.5,
}) => {
  const {
    connectors: { connect, drag },
    selected,
    dom
  } = useNode((state) => ({
    selected: state.events.selected,
    dom: state.dom
  }));

  const { viewportMode } = useViewport();

  // Calculate responsive values
  const responsiveColumns = viewportMode === 'mobile' ? 1 : viewportMode === 'tablet' ? Math.min(columns, 2) : columns;
  const responsivePaddingTop = getResponsivePadding(paddingTop, viewportMode);
  const responsivePaddingBottom = getResponsivePadding(paddingBottom, viewportMode);
  const responsivePaddingLeft = getResponsivePadding(paddingLeft, viewportMode);
  const responsivePaddingRight = getResponsivePadding(paddingRight, viewportMode);
  const responsiveGap = viewportMode === 'mobile' ? gap * 0.6 : viewportMode === 'tablet' ? gap * 0.8 : gap;

  const width = dom ? dom.clientWidth : 0;
  const height = dom ? dom.clientHeight : 0;

  return (
    <section
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        backgroundColor,
        color: textColor,
        padding: `${responsivePaddingTop}px ${responsivePaddingRight}px ${responsivePaddingBottom}px ${responsivePaddingLeft}px`,
        position: 'relative',
        ...getSelectionStyles(selected),
        ...getBackgroundStyles({ backgroundImage, backgroundSize, backgroundPosition, backgroundAttachment }),
      }}
    >
      {!!backgroundImage && overlay && (
        <div style={getOverlayStyles({ overlayEnabled: true, overlayColor, overlayOpacity }) || undefined} />
      )}
      {selected && <SelectionIndicator name="Menu Section" width={width} height={height} />}
      <div style={{ maxWidth, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '16px',
            color: titleColor
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              fontSize: '1.125rem',
              color: textColor,
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Menu Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${responsiveColumns === 1 ? '100%' : '300px'}, 1fr))`,
          gap: `${responsiveGap}px`,
        }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                background: cardBackground,
                borderRadius: `${cardRadius}px`,
                overflow: 'hidden',
                boxShadow: cardShadow,
                transition: hoverEffect ? 'transform 0.3s ease, box-shadow 0.3s ease' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (hoverEffect) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (hoverEffect) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = cardShadow;
                }
              }}
            >
              {showImages && item.image && (
                <div style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius: `${imageBorderRadius || 0}px`,
                }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`menu-item-image-${imageHoverEffect || 'none'}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: imageObjectFit || 'cover',
                      borderRadius: `${imageBorderRadius || 0}px`,
                      transition: 'all 0.4s ease',
                    }}
                  />
                  {/* Image Overlay */}
                  {imageOverlay && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: imageOverlayColor || '#000000',
                      opacity: imageOverlayOpacity || 0.3,
                      borderRadius: `${imageBorderRadius || 0}px`,
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              )}
              <div style={{ padding: `${cardPadding}px` }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: titleColor,
                    margin: 0,
                  }}>
                    {item.name}
                  </h3>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: priceColor,
                  }}>
                    €{item.price.toFixed(2)}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

MenuSection.craft = {
  displayName: 'Menu Section',
  props: {
    // Contenuto
    title: 'Il Nostro Menu',
    subtitle: 'Scopri le nostre specialità',
    items: [
      { name: 'Margherita DOC', description: 'Pomodoro, mozzarella di bufala, basilico', price: 8.50 },
      { name: 'Diavola', description: 'Pomodoro, mozzarella, salame piccante', price: 9.50 },
      { name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmigiano, taleggio', price: 10.50 },
    ],
    // Layout
    columns: 2,
    showImages: true,
    maxWidth: '1200px',
    // Colori
    backgroundColor: '#f8f9fa',
    textColor: '#1a1a1a',
    titleColor: '#1a1a1a',
    priceColor: '#3b82f6',
    cardBackground: '#ffffff',
    // Spaziatura
    paddingTop: 60,
    paddingBottom: 60,
    paddingLeft: 20,
    paddingRight: 20,
    cardPadding: 24,
    gap: 30,
    // Effetti
    cardShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    cardRadius: 12,
    hoverEffect: true,
    // Effetti Immagini
    imageHoverEffect: 'zoom',
    imageBorderRadius: 0,
    imageAspectRatio: '16/9',
    imageObjectFit: 'cover',
    imageOverlay: false,
    imageOverlayColor: '#000000',
    imageOverlayOpacity: 0.3,
    // Background
    backgroundImage: undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'scroll',
    overlay: false,
    overlayColor: '#000000',
    overlayOpacity: 0.5,
  },
  related: {
    settings: MenuSectionSettings,
  },
};

