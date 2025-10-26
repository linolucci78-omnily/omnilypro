// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';

interface GallerySectionProps {
  title?: string;
  subtitle?: string;
  images?: string[];
  backgroundColor?: string;
  textColor?: string;
  columns?: number;
  paddingTop?: number;
  paddingBottom?: number;
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
            gap: '20px',
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                aspectRatio: '4/3',
                overflow: 'hidden',
                borderRadius: '8px',
              }}
            >
              <img
                src={image}
                alt={`Gallery ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
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
  },
  related: {
    toolbar: () => <div>Gallery Section Settings</div>,
  },
};
