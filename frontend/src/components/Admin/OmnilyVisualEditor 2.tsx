// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { X, Save, Eye, EyeOff, Undo, Redo, Layers } from 'lucide-react';
import { directusClient } from '../../lib/directus';

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

// Import Panels
import { Toolbox } from './CraftEditor/panels/Toolbox';
import { SettingsPanel } from './CraftEditor/panels/SettingsPanel';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showLayers, setShowLayers] = useState(true);

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
      alert('Errore nel caricamento del sito');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (query: any) => {
    try {
      setSaving(true);
      const json = query.serialize();

      await directusClient.updateWebsiteContent(websiteId, {
        craftjs_content: json
      });

      await onSave();
      alert(' Sito salvato con successo!');
    } catch (error) {
      console.error('Error saving website:', error);
      alert('L Errore nel salvataggio del sito');
    } finally {
      setSaving(false);
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
          FooterSection
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
              title="Mostra/Nascondi Layers"
            >
              <Layers size={18} />
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
          <div className="editor-canvas">
            <Frame data={websiteData?.craftjs_content}>
              <Element is={Container} canvas>
                <Element is={HeroSection} />
                <Element is={FeaturesSection} />
                <Element is={ContactSection} />
              </Element>
            </Frame>
          </div>

          {/* Right Sidebar - Settings */}
          {!previewMode && showLayers && (
            <div className="editor-sidebar editor-sidebar-right">
              <SettingsPanel />
            </div>
          )}
        </div>
      </Editor>
    </div>
  );
};

export default OmnilyVisualEditor;
