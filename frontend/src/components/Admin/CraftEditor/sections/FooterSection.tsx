// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';

interface FooterSectionProps {
  companyName?: string;
  copyright?: string;
  backgroundColor?: string;
  textColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  companyName = 'Your Company',
  copyright = '© 2024 All rights reserved.',
  backgroundColor = '#1a1a1a',
  textColor = '#ffffff',
  paddingTop = 40,
  paddingBottom = 40,
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <footer
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      style={{
        backgroundColor,
        color: textColor,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          textAlign: 'center',
        }}
      >
        <h3 style={{ fontSize: '24px', marginBottom: '15px', fontWeight: 'bold' }}>
          {companyName}
        </h3>
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          {copyright}
        </p>
      </div>
    </footer>
  );
};

FooterSection.craft = {
  displayName: 'Footer Section',
  props: {
    companyName: 'Your Company',
    copyright: '© 2024 All rights reserved.',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    paddingTop: 40,
    paddingBottom: 40,
  },
  related: {
    toolbar: () => <div>Footer Section Settings</div>,
  },
};
