// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { FileText, Palette, Settings } from 'lucide-react';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from '../components/BackgroundControls';

interface ContactSectionProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  minHeight?: number;
  background?: BackgroundSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title = 'Contact Us',
  subtitle = 'Get in touch with us',
  backgroundColor = '#f9fafb',
  textColor = '#1a1a1a',
  paddingTop = 60,
  paddingBottom = 60,
  minHeight = 0,
  background = {},
}) => {
  const { connectors: { connect, drag } } = useNode();

  const backgroundStyles = getBackgroundStyles(background);
  const overlayStyles = getOverlayStyles(background);

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      style={{
        ...backgroundStyles,
        background: backgroundStyles.background || backgroundColor,
        backgroundColor: backgroundStyles.backgroundColor || backgroundColor,
        color: textColor,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        minHeight: minHeight ? `${minHeight}px` : 'auto',
        position: 'relative',
      }}
    >
      {overlayStyles && <div style={{ ...overlayStyles }} />}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '15px', fontWeight: 'bold' }}>
            {title}
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.8 }}>
            {subtitle}
          </p>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="text"
            placeholder="Name"
            style={{
              padding: '12px',
              fontSize: '16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          />
          <input
            type="email"
            placeholder="Email"
            style={{
              padding: '12px',
              fontSize: '16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          />
          <textarea
            placeholder="Message"
            rows={5}
            style={{
              padding: '12px',
              fontSize: '16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '12px 32px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

// ContactSection Settings Toolbar - TIPO ELEMENTOR
const ContactSectionSettings = () => {
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

ContactSection.craft = {
  displayName: 'Contact Section',
  props: {
    title: 'Contact Us',
    subtitle: 'Get in touch with us',
    backgroundColor: '#f9fafb',
    textColor: '#1a1a1a',
    paddingTop: 60,
    paddingBottom: 60,
    minHeight: 0,
    background: {},
  },
  related: {
    toolbar: ContactSectionSettings,
  },
};
