import React, { useState } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import { X, Save, Eye, Loader, Settings, Layers as LayersIcon } from 'lucide-react';

// Importa componenti base
import { Container } from './components/Container';
import { Text } from './components/Text';
import { Button } from './components/Button';
import { HeroSection } from './sections/HeroSection';

// Importa pannelli
import { Toolbox } from './panels/Toolbox';
import { SettingsPanel } from './panels/SettingsPanel';

import './styles.css';

interface CraftEditorProps {
  websiteId: number;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: string; // JSON serializzato da Craft.js
}

const CraftEditor: React.FC<CraftEditorProps> = ({
  websiteId,
  onClose,
  onSave,
  initialData
}) => {
  const [saving, setSaving] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

  const handleSave = async (query: any) => {
    try {
      setSaving(true);

      // Serializza lo stato corrente dell'editor
      const json = query.serialize();

      console.log('💾 Salvataggio editor:', json);

      if (onSave) {
        await onSave(json);
      }

      alert('✅ Sito salvato con successo!');
    } catch (error) {
      console.error('❌ Errore salvataggio:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="craft-editor-wrapper">
      <Editor
        resolver={{
          Container,
          Text,
          Button,
          HeroSection,
        }}
      >
        {/* HEADER */}
        <div className="craft-header">
          <div className="craft-header-left">
            <h1 className="craft-title">🎨 Omnily Visual Editor</h1>
            <span className="craft-subtitle">Website Builder</span>
          </div>

          <div className="craft-header-right">
            <button
              className="craft-btn craft-btn-ghost"
              onClick={() => setShowLayers(!showLayers)}
              title="Toggle Layers"
            >
              <LayersIcon size={18} />
              {showLayers ? 'Nascondi' : 'Mostra'} Layers
            </button>

            <button
              className="craft-btn craft-btn-ghost"
              onClick={() => setShowSettings(!showSettings)}
              title="Toggle Settings"
            >
              <Settings size={18} />
              {showSettings ? 'Nascondi' : 'Mostra'} Settings
            </button>

            <button
              className="craft-btn craft-btn-secondary"
              onClick={() => alert('Anteprima non ancora implementata')}
            >
              <Eye size={18} />
              Anteprima
            </button>

            <button
              className="craft-btn craft-btn-primary"
              onClick={() => {
                const { query } = window.craftEditor;
                if (query) handleSave(query);
              }}
              disabled={saving}
            >
              {saving ? <Loader size={18} className="spin" /> : <Save size={18} />}
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>

            <button
              className="craft-btn craft-btn-ghost"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="craft-main">
          {/* SIDEBAR SINISTRA - Toolbox */}
          <Toolbox />

          {/* CANVAS CENTRALE */}
          <div className="craft-canvas-wrapper">
            <div className="craft-device-selector">
              <button className="craft-device-btn active">🖥️ Desktop</button>
              <button className="craft-device-btn">📱 Tablet</button>
              <button className="craft-device-btn">📱 Mobile</button>
            </div>

            <div className="craft-canvas-scroll">
              <div className="craft-canvas">
                <Frame data={initialData}>
                  <Element
                    is={Container}
                    canvas
                    background="#ffffff"
                    padding={0}
                    custom={{ displayName: 'Website Root' }}
                  >
                    {/* Contenuto iniziale vuoto o caricato */}
                    <Element
                      is={HeroSection}
                      title="Benvenuti nel nostro sito"
                      subtitle="Crea il tuo sito web professionale"
                    />
                  </Element>
                </Frame>
              </div>
            </div>
          </div>

          {/* SIDEBAR DESTRA - Layers & Settings */}
          <div className="craft-right-panel">
            {showLayers && (
              <div className="craft-panel craft-layers-panel">
                <div className="craft-panel-header">
                  <h3>🗂️ Layers</h3>
                </div>
                <div className="craft-panel-content">
                  <Layers />
                </div>
              </div>
            )}

            {showSettings && (
              <div className="craft-panel craft-settings-panel">
                <SettingsPanel />
              </div>
            )}
          </div>
        </div>
      </Editor>
    </div>
  );
};

// Esponi il query per il salvataggio
if (typeof window !== 'undefined') {
  (window as any).craftEditor = {};
}

export default CraftEditor;
