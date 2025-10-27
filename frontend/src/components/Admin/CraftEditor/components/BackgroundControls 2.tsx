// @ts-nocheck
import React, { useState } from 'react';
import { Image as ImageIcon, Palette, Layers, ChevronDown, ChevronUp, Move } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { ImageUploader } from './ImageUploader';

export interface BackgroundSettings {
  // Background Type
  type?: 'color' | 'image' | 'gradient';

  // Color Background
  backgroundColor?: string;

  // Image Background
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto' | 'custom';
  backgroundPosition?: string;
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundAttachment?: 'scroll' | 'fixed' | 'local';

  // Gradient Background
  gradientType?: 'linear' | 'radial';
  gradientAngle?: number;
  gradientColor1?: string;
  gradientColor2?: string;
  gradientColor1Position?: number;
  gradientColor2Position?: number;

  // Overlay
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;

  // Effects
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
}

interface BackgroundControlsProps {
  settings: BackgroundSettings;
  onChange: (settings: BackgroundSettings) => void;
  organizationId?: string;
}

export const BackgroundControls: React.FC<BackgroundControlsProps> = ({
  settings,
  onChange,
  organizationId,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['type']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateSetting = (key: keyof BackgroundSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const AccordionSection: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, icon, children }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div style={{ marginBottom: '8px' }}>
        <div
          onClick={() => toggleSection(id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: isExpanded ? '#f9fafb' : '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: isExpanded ? '12px' : '0',
            border: '1px solid #e5e7eb',
            transition: 'all 0.2s',
          }}
        >
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
      {/* Background Type */}
      <AccordionSection id="type" title="Tipo Sfondo" icon={<Palette size={16} color="#6b7280" />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => updateSetting('type', 'color')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: settings.type === 'color' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              background: settings.type === 'color' ? '#eff6ff' : 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: settings.type === 'color' ? '#3b82f6' : '#6b7280',
            }}
          >
            <Palette size={16} style={{ marginBottom: '4px' }} />
            <div>Colore</div>
          </button>
          <button
            type="button"
            onClick={() => updateSetting('type', 'image')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: settings.type === 'image' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              background: settings.type === 'image' ? '#eff6ff' : 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: settings.type === 'image' ? '#3b82f6' : '#6b7280',
            }}
          >
            <ImageIcon size={16} style={{ marginBottom: '4px' }} />
            <div>Immagine</div>
          </button>
          <button
            type="button"
            onClick={() => updateSetting('type', 'gradient')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: settings.type === 'gradient' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              background: settings.type === 'gradient' ? '#eff6ff' : 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: settings.type === 'gradient' ? '#3b82f6' : '#6b7280',
            }}
          >
            <Layers size={16} style={{ marginBottom: '4px' }} />
            <div>Gradiente</div>
          </button>
        </div>

        {/* Color Settings */}
        {settings.type === 'color' && (
          <ColorPicker
            label="Colore Sfondo"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(value) => updateSetting('backgroundColor', value)}
          />
        )}

        {/* Image Settings */}
        {settings.type === 'image' && (
          <div>
            <ImageUploader
              label="Immagine Sfondo"
              value={settings.backgroundImage || ''}
              onChange={(value) => updateSetting('backgroundImage', value)}
              organizationId={organizationId}
              helpText="Carica un'immagine per lo sfondo"
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Dimensione
              </label>
              <select
                value={settings.backgroundSize || 'cover'}
                onChange={(e) => updateSetting('backgroundSize', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <option value="cover">Cover (riempi)</option>
                <option value="contain">Contain (contieni)</option>
                <option value="auto">Auto (originale)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Posizione
              </label>
              <select
                value={settings.backgroundPosition || 'center'}
                onChange={(e) => updateSetting('backgroundPosition', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <option value="center">Centro</option>
                <option value="top">Alto</option>
                <option value="bottom">Basso</option>
                <option value="left">Sinistra</option>
                <option value="right">Destra</option>
                <option value="top left">Alto Sinistra</option>
                <option value="top right">Alto Destra</option>
                <option value="bottom left">Basso Sinistra</option>
                <option value="bottom right">Basso Destra</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Ripetizione
              </label>
              <select
                value={settings.backgroundRepeat || 'no-repeat'}
                onChange={(e) => updateSetting('backgroundRepeat', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <option value="no-repeat">Nessuna</option>
                <option value="repeat">Ripeti</option>
                <option value="repeat-x">Ripeti Orizzontale</option>
                <option value="repeat-y">Ripeti Verticale</option>
              </select>
            </div>
          </div>
        )}

        {/* Gradient Settings */}
        {settings.type === 'gradient' && (
          <div>
            <ColorPicker
              label="Colore 1"
              value={settings.gradientColor1 || '#3b82f6'}
              onChange={(value) => updateSetting('gradientColor1', value)}
            />

            <ColorPicker
              label="Colore 2"
              value={settings.gradientColor2 || '#8b5cf6'}
              onChange={(value) => updateSetting('gradientColor2', value)}
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                <span>Angolo</span>
                <span>{settings.gradientAngle || 45}�</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={settings.gradientAngle || 45}
                onChange={(e) => updateSetting('gradientAngle', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Overlay */}
      <AccordionSection id="overlay" title="Overlay" icon={<Layers size={16} color="#6b7280" />}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.overlayEnabled || false}
              onChange={(e) => updateSetting('overlayEnabled', e.target.checked)}
              style={{ width: '20px', height: '20px', marginRight: '12px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Abilita Overlay</span>
          </label>
        </div>

        {settings.overlayEnabled && (
          <>
            <ColorPicker
              label="Colore Overlay"
              value={settings.overlayColor || '#000000'}
              onChange={(value) => updateSetting('overlayColor', value)}
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                <span>Opacit� Overlay</span>
                <span>{Math.round((settings.overlayOpacity || 0.5) * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.overlayOpacity || 0.5}
                onChange={(e) => updateSetting('overlayOpacity', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </AccordionSection>

      {/* Effects */}
      <AccordionSection id="effects" title="Effetti" icon={<Palette size={16} color="#6b7280" />}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Sfocatura</span>
            <span>{settings.blur || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={settings.blur || 0}
            onChange={(e) => updateSetting('blur', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Luminosit�</span>
            <span>{settings.brightness || 100}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={settings.brightness || 100}
            onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Contrasto</span>
            <span>{settings.contrast || 100}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={settings.contrast || 100}
            onChange={(e) => updateSetting('contrast', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Saturazione</span>
            <span>{settings.saturate || 100}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={settings.saturate || 100}
            onChange={(e) => updateSetting('saturate', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </AccordionSection>
    </div>
  );
};

/**
 * Helper function to generate CSS from background settings
 */
export const getBackgroundStyles = (settings: BackgroundSettings): React.CSSProperties => {
  const styles: React.CSSProperties = {};

  // Base background
  if (settings.type === 'color') {
    styles.backgroundColor = settings.backgroundColor || 'transparent';
  } else if (settings.type === 'image' && settings.backgroundImage) {
    styles.backgroundImage = `url(${settings.backgroundImage})`;
    styles.backgroundSize = settings.backgroundSize || 'cover';
    styles.backgroundPosition = settings.backgroundPosition || 'center';
    styles.backgroundRepeat = settings.backgroundRepeat || 'no-repeat';
    styles.backgroundAttachment = settings.backgroundAttachment || 'scroll';
  } else if (settings.type === 'gradient') {
    const color1 = settings.gradientColor1 || '#3b82f6';
    const color2 = settings.gradientColor2 || '#8b5cf6';
    const angle = settings.gradientAngle || 45;
    styles.background = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
  }

  // Effects
  const filters: string[] = [];
  if (settings.blur) filters.push(`blur(${settings.blur}px)`);
  if (settings.brightness && settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
  if (settings.contrast && settings.contrast !== 100) filters.push(`contrast(${settings.contrast}%)`);
  if (settings.saturate && settings.saturate !== 100) filters.push(`saturate(${settings.saturate}%)`);

  if (filters.length > 0) {
    styles.filter = filters.join(' ');
  }

  return styles;
};

/**
 * Helper function to generate overlay styles
 */
export const getOverlayStyles = (settings: BackgroundSettings): React.CSSProperties | null => {
  if (!settings.overlayEnabled) return null;

  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: settings.overlayColor || '#000000',
    opacity: settings.overlayOpacity || 0.5,
    pointerEvents: 'none' as const,
  };
};
