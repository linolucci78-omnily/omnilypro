// @ts-nocheck
import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';

// Import all Craft.js components used in the editor
import { Container } from './Admin/CraftEditor/components/Container';
import { Text } from './Admin/CraftEditor/components/Text';
import { Button } from './Admin/CraftEditor/components/Button';
import { Image } from './Admin/CraftEditor/components/Image';
import { HeroSection } from './Admin/CraftEditor/sections/HeroSection';
import { MenuSection } from './Admin/CraftEditor/sections/MenuSection';
import { FeaturesSection } from './Admin/CraftEditor/sections/FeaturesSection';

interface CraftRendererProps {
  data: string; // JSON serializzato da Craft.js
}

/**
 * CraftRenderer - Renderizza un sito Craft.js in modalità visualizzazione (senza editor)
 *
 * Questo componente viene usato da PublicSite.tsx per mostrare i siti pubblici
 * creati con Craft.js editor
 */
const CraftRenderer: React.FC<CraftRendererProps> = ({ data }) => {
  let parsedData;

  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('❌ Errore parsing Craft.js data:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>
            Errore nel caricamento del sito
          </h1>
          <p style={{ color: '#6b7280' }}>
            Il sito non può essere visualizzato a causa di un errore nei dati.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="craft-renderer" style={{ width: '100%', minHeight: '100vh' }}>
      <Editor
        resolver={{
          Container,
          Text,
          Button,
          Image,
          HeroSection,
          MenuSection,
          FeaturesSection,
        }}
        enabled={false} // IMPORTANTE: disabilita editing
      >
        <Frame data={parsedData}>
          <Element
            is={Container}
            canvas
            background="#ffffff"
            padding={0}
            custom={{ displayName: 'Website' }}
          />
        </Frame>
      </Editor>
    </div>
  );
};

export default CraftRenderer;
