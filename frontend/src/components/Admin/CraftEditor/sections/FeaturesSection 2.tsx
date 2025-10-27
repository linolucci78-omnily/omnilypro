// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { FileText, Palette, Settings } from 'lucide-react';
import { BackgroundControls, getBackgroundStyles, getOverlayStyles, type BackgroundSettings } from '../components/BackgroundControls';

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
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <section
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
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
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '30px',
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
  },
  related: {
    toolbar: () => <div>Features Section Settings</div>,
  },
};
