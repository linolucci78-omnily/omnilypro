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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
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

ContactSection.craft = {
  displayName: 'Contact Section',
  props: {
    title: 'Contact Us',
    subtitle: 'Get in touch with us',
    backgroundColor: '#f9fafb',
    textColor: '#1a1a1a',
    paddingTop: 60,
    paddingBottom: 60,
  },
  related: {
    toolbar: () => <div>Contact Section Settings</div>,
  },
};
