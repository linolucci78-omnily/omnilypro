// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { X, Save, Eye, EyeOff, Undo, Redo, Layers, Monitor, Tablet, Smartphone } from 'lucide-react';
import { directusClient } from '../../lib/directus';
import { useToast } from '../../contexts/ToastContext';

// Import Craft components
import { Container } from './CraftEditor/components/Container';
import { Text } from './CraftEditor/components/Text';
import { Button } from './CraftEditor/components/Button';
import { Section } from './CraftEditor/components/Section';
import { Row } from './CraftEditor/components/Row';
import { Column } from './CraftEditor/components/Column';
import { Image } from './CraftEditor/components/Image';
import { Navigation } from './CraftEditor/components/Navigation';
import { ContactForm } from './CraftEditor/components/ContactForm';

// Import Sections
import { HeroSection } from './CraftEditor/sections/HeroSection';
import { FeaturesSection } from './CraftEditor/sections/FeaturesSection';
import { ContactSection } from './CraftEditor/sections/ContactSection';
import { GallerySection } from './CraftEditor/sections/GallerySection';
import { MenuSection } from './CraftEditor/sections/MenuSection';
import { FooterSection } from './CraftEditor/sections/FooterSection';
import { LoyaltySection } from './CraftEditor/sections/LoyaltySection';

// Import Panels
import { Toolbox } from './CraftEditor/panels/Toolbox';
import { SettingsPanel } from './CraftEditor/panels/SettingsPanel';

// Import Context
import { ViewportProvider } from './CraftEditor/contexts/ViewportContext';

import './CraftEditor/styles.css';

interface OmnilyVisualEditorProps {
  websiteId: number;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const OmnilyVisualEditor: React.FC<OmnilyVisualEditorProps> = ({
  websiteId,
  onClose,
  onSave
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showLayers, setShowLayers] = useState(true); // Always show settings panel by default
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    loadWebsite();
  }, [websiteId]);

  const loadWebsite = async () => {
    try {
      setLoading(true);
      const data = await directusClient.getWebsiteById(websiteId);

      // Parse craftjs_content if it's a string
      if (data.craftjs_content && typeof data.craftjs_content === 'string') {
        try {
          data.craftjs_content = JSON.parse(data.craftjs_content);
        } catch (e) {
          console.warn('Failed to parse craftjs_content, using default');
          data.craftjs_content = null;
        }
      }

      setWebsiteData(data);
    } catch (error) {
      console.error('Error loading website:', error);
      showError('Errore nel caricamento', 'Impossibile caricare il sito web');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (query: any) => {
    try {
      setSaving(true);
      console.log('🔄 Inizio salvataggio...');
      const json = query.serialize();
      console.log('📦 JSON serializzato:', json);
      console.log('📊 Numero di nodi:', Object.keys(json).length);

      await directusClient.updateWebsite(websiteId, {
        craftjs_content: json
      });
      console.log('✅ Salvataggio su Directus completato');

      await onSave();
      console.log('✅ Callback onSave completata');
      showSuccess('Sito salvato!', 'Tutte le modifiche sono state salvate con successo');
    } catch (error) {
      console.error('❌ Errore durante il salvataggio:', error);
      showError('Errore nel salvataggio', error.message || 'Si è verificato un errore durante il salvataggio');
    } finally {
      setSaving(false);
      console.log('🏁 Processo di salvataggio terminato');
    }
  };

  if (loading) {
    return (
      <div className="omnily-editor-loading">
        <div className="loader"></div>
        <p>Caricamento editor...</p>
      </div>
    );
  }

  return (
    <div className="omnily-visual-editor">
      <Editor
        resolver={{
          Container,
          Text,
          Button,
          Section,
          Row,
          Column,
          Image,
          Navigation,
          ContactForm,
          HeroSection,
          FeaturesSection,
          ContactSection,
          GallerySection,
          MenuSection,
          FooterSection,
          LoyaltySection
        }}
        enabled={!previewMode}
        onNodesChange={(query) => {
          console.log('🔄 Nodes changed:', query.getSerializedNodes());
        }}
      >
        {/* Top Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <h2 className="toolbar-title">
              {websiteData?.site_name || 'Editor Visuale'}
            </h2>
            <span style={{ marginLeft: '16px', fontSize: '13px', color: '#9ca3af' }}>
              {previewMode ? '👁️ Anteprima' : '✏️ Modifica'}
            </span>
          </div>

          <div className="toolbar-center">
            {/* Device Preview Buttons */}
            <div style={{ display: 'flex', gap: '4px', marginRight: '16px', background: '#1f2937', padding: '4px', borderRadius: '6px' }}>
              <button
                className="toolbar-btn"
                onClick={() => setViewportMode('desktop')}
                title="Anteprima Desktop"
                style={{
                  backgroundColor: viewportMode === 'desktop' ? '#3b82f6' : 'transparent',
                  padding: '6px 12px',
                  minWidth: 'auto'
                }}
              >
                <Monitor size={18} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => setViewportMode('tablet')}
                title="Anteprima Tablet"
                style={{
                  backgroundColor: viewportMode === 'tablet' ? '#3b82f6' : 'transparent',
                  padding: '6px 12px',
                  minWidth: 'auto'
                }}
              >
                <Tablet size={18} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => setViewportMode('mobile')}
                title="Anteprima Mobile"
                style={{
                  backgroundColor: viewportMode === 'mobile' ? '#3b82f6' : 'transparent',
                  padding: '6px 12px',
                  minWidth: 'auto'
                }}
              >
                <Smartphone size={18} />
              </button>
            </div>

            <button
              className="toolbar-btn"
              onClick={() => setPreviewMode(!previewMode)}
              title={previewMode ? 'Modifica' : 'Anteprima'}
            >
              {previewMode ? <Eye size={18} /> : <EyeOff size={18} />}
              {previewMode ? 'Anteprima' : 'Modifica'}
            </button>

            <button
              className="toolbar-btn"
              onClick={() => setShowLayers(!showLayers)}
              title={showLayers ? "Nascondi Pannello Impostazioni" : "Mostra Pannello Impostazioni"}
              style={{
                backgroundColor: showLayers ? '#3b82f6' : '#374151'
              }}
            >
              <Layers size={18} />
              {showLayers ? 'Nascondi' : 'Mostra'} Pannello
            </button>
          </div>

          <div className="toolbar-right">
            <button
              className="toolbar-btn toolbar-btn-save"
              onClick={(e) => {
                const editor = (e.target as any).closest('.omnily-visual-editor');
                const query = editor?.querySelector('[data-cy="editor-frame"]')?.__craftjs;
                if (query) handleSave(query);
              }}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>

            <button
              className="toolbar-btn toolbar-btn-close"
              onClick={onClose}
            >
              <X size={18} />
              Chiudi
            </button>
          </div>
        </div>

        <div className="editor-content">
          {/* Left Sidebar - Toolbox */}
          {!previewMode && (
            <div className="editor-sidebar editor-sidebar-left">
              <Toolbox />
            </div>
          )}

          {/* Main Canvas */}
          <div className="editor-canvas" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '20px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            <div style={{
              width: viewportMode === 'mobile' ? '375px' : viewportMode === 'tablet' ? '768px' : '100%',
              maxWidth: viewportMode === 'desktop' ? '1200px' : undefined,
              margin: '0 auto',
              background: '#ffffff',
              boxShadow: viewportMode !== 'desktop' ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
              borderRadius: viewportMode !== 'desktop' ? '8px' : '0',
              overflow: 'visible',
              transition: 'all 0.3s ease',
              minHeight: '100%'
            }}>
              <ViewportProvider viewportMode={viewportMode}>
                <Frame data={websiteData?.craftjs_content}>
                  <Element is={Container} canvas>
                    <Element is={HeroSection} />
                    <Element is={FeaturesSection} />
                    <Element is={ContactSection} />
                  </Element>
                </Frame>
              </ViewportProvider>
            </div>
          </div>

          {/* Right Sidebar - Settings */}
          {!previewMode && showLayers && (
            <div className="editor-sidebar editor-sidebar-right" style={{ background: '#f9fafb' }}>
              {console.log('✅ Rendering SettingsPanel', { previewMode, showLayers })}
              <SettingsPanel />
            </div>
          )}
          {(!showLayers || previewMode) && console.log('❌ Settings Panel HIDDEN', { previewMode, showLayers })}
        </div>
      </Editor>
    </div>
  );
};

export default OmnilyVisualEditor;
