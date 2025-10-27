// @ts-nocheck
import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Menu, Trash2, Plus, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { ImageUploader } from './ImageUploader';
import { useConfirm } from '../../../../hooks/useConfirm';
import ConfirmModal from '../../../UI/ConfirmModal';

export interface MenuItem {
  id: string;
  label: string;
  link: string;
  external?: boolean;
}

export interface NavigationProps {
  // Logo
  logoUrl?: string;
  logoText?: string;
  showLogo?: boolean;

  // Menu Items
  menuItems?: MenuItem[];

  // Layout
  position?: 'fixed' | 'sticky' | 'static';
  alignment?: 'left' | 'center' | 'right' | 'space-between';

  // Style
  backgroundColor?: string;
  textColor?: string;
  hoverColor?: string;
  activeColor?: string;

  // Spacing
  padding?: number;
  gap?: number;

  // Typography
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;

  // Mobile
  mobileBreakpoint?: number;
  showMobileMenu?: boolean;
}

const NavigationSettings: React.FC = () => {
  const {
    actions: { setProp, delete: deleteNode },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['items']));
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      label: 'Nuova Voce',
      link: '#',
      external: false,
    };
    setProp((props: NavigationProps) => {
      props.menuItems = [...(props.menuItems || []), newItem];
    });
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setProp((props: NavigationProps) => {
      props.menuItems = (props.menuItems || []).map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
    });
  };

  const removeMenuItem = (id: string) => {
    setProp((props: NavigationProps) => {
      props.menuItems = (props.menuItems || []).filter(item => item.id !== id);
    });
  };

  const moveMenuItem = (id: string, direction: 'up' | 'down') => {
    setProp((props: NavigationProps) => {
      const items = [...(props.menuItems || [])];
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      props.menuItems = items;
    });
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

  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  return (
    <div>
      <ConfirmModal
        isOpen={isOpen}
        title={options?.title}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Menu size={16} />
          Impostazioni Menu
        </h3>
        <button
          onClick={() => {
            confirm({
              title: 'Elimina Menu',
              message: 'Sei sicuro di voler eliminare questo menu di navigazione?',
              type: 'danger',
              confirmText: 'Elimina',
              cancelText: 'Annulla',
              onConfirm: () => deleteNode()
            });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
        >
          <Trash2 size={14} />
          Elimina
        </button>
      </div>

      {/* Logo */}
      <AccordionSection id="logo" title="Logo" icon={<Menu size={16} color="#6b7280" />}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
            <input
              type="checkbox"
              checked={props.showLogo ?? true}
              onChange={(e) => setProp((props: NavigationProps) => (props.showLogo = e.target.checked))}
              style={{ width: '20px', height: '20px', marginRight: '12px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Logo</span>
          </label>
        </div>

        {props.showLogo && (
          <>
            <ImageUploader
              label="Immagine Logo"
              value={props.logoUrl || ''}
              onChange={(value) => setProp((props: NavigationProps) => (props.logoUrl = value))}
              helpText="Logo del sito (consigliato: 200x60px)"
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Testo Logo (alternativo)
              </label>
              <input
                type="text"
                value={props.logoText || ''}
                onChange={(e) => setProp((props: NavigationProps) => (props.logoText = e.target.value))}
                placeholder="Nome Sito"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
                Usato se non c'è immagine logo
              </p>
            </div>
          </>
        )}
      </AccordionSection>

      {/* Menu Items */}
      <AccordionSection id="items" title="Voci Menu" icon={<Menu size={16} color="#6b7280" />}>
        <div>
          {(props.menuItems || []).map((item, index) => (
            <div
              key={item.id}
              style={{
                marginBottom: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <GripVertical size={16} color="#9ca3af" style={{ cursor: 'grab' }} />
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                  placeholder="Nome voce"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
                <button
                  onClick={() => moveMenuItem(item.id, 'up')}
                  disabled={index === 0}
                  style={{
                    padding: '4px 8px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    opacity: index === 0 ? 0.5 : 1,
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveMenuItem(item.id, 'down')}
                  disabled={index === (props.menuItems?.length || 0) - 1}
                  style={{
                    padding: '4px 8px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: index === (props.menuItems?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                    opacity: index === (props.menuItems?.length || 0) - 1 ? 0.5 : 1,
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => removeMenuItem(item.id)}
                  style={{
                    padding: '4px 8px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <input
                type="text"
                value={item.link}
                onChange={(e) => updateMenuItem(item.id, { link: e.target.value })}
                placeholder="#sezione o https://..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  marginBottom: '6px',
                }}
              />

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={item.external || false}
                  onChange={(e) => updateMenuItem(item.id, { external: e.target.checked })}
                  style={{ width: '16px', height: '16px', marginRight: '8px' }}
                />
                <span>Link esterno (apri in nuova scheda)</span>
              </label>
            </div>
          ))}

          <button
            onClick={addMenuItem}
            style={{
              width: '100%',
              padding: '10px',
              background: '#eff6ff',
              color: '#3b82f6',
              border: '1px dashed #3b82f6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            Aggiungi Voce Menu
          </button>
        </div>
      </AccordionSection>

      {/* Layout */}
      <AccordionSection id="layout" title="Layout" icon={<Menu size={16} color="#6b7280" />}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            Posizione
          </label>
          <select
            value={props.position || 'static'}
            onChange={(e) => setProp((props: NavigationProps) => (props.position = e.target.value as any))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="static">Statico</option>
            <option value="sticky">Sticky (scorre con pagina)</option>
            <option value="fixed">Fisso (sempre visibile)</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            Allineamento
          </label>
          <select
            value={props.alignment || 'space-between'}
            onChange={(e) => setProp((props: NavigationProps) => (props.alignment = e.target.value as any))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="left">Sinistra</option>
            <option value="center">Centro</option>
            <option value="right">Destra</option>
            <option value="space-between">Spazio tra (Logo | Menu)</option>
          </select>
        </div>
      </AccordionSection>

      {/* Style */}
      <AccordionSection id="style" title="Stile" icon={<Menu size={16} color="#6b7280" />}>
        <ColorPicker
          label="Colore Sfondo"
          value={props.backgroundColor || '#ffffff'}
          onChange={(value) => setProp((props: NavigationProps) => (props.backgroundColor = value))}
        />

        <ColorPicker
          label="Colore Testo"
          value={props.textColor || '#1f2937'}
          onChange={(value) => setProp((props: NavigationProps) => (props.textColor = value))}
        />

        <ColorPicker
          label="Colore Hover"
          value={props.hoverColor || '#3b82f6'}
          onChange={(value) => setProp((props: NavigationProps) => (props.hoverColor = value))}
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span>Padding</span>
            <span>{props.padding || 20}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={props.padding || 20}
            onChange={(e) => setProp((props: NavigationProps) => (props.padding = parseInt(e.target.value)))}
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
            <span>Dimensione Testo</span>
            <span>{props.fontSize || 16}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="24"
            value={props.fontSize || 16}
            onChange={(e) => setProp((props: NavigationProps) => (props.fontSize = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>
      </AccordionSection>
    </div>
  );
};

export const Navigation: React.FC<NavigationProps> = ({
  logoUrl,
  logoText = 'Il Mio Sito',
  showLogo = true,
  menuItems = [],
  position = 'static',
  alignment = 'space-between',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  hoverColor = '#3b82f6',
  padding = 20,
  fontSize = 16,
  fontWeight = 500,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        position,
        top: position === 'fixed' || position === 'sticky' ? 0 : undefined,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor,
        padding: `${padding}px`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        outline: selected ? '2px solid #3b82f6' : 'none',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: alignment,
        gap: '40px',
      }}>
        {/* Logo */}
        {showLogo && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} style={{ height: '40px', objectFit: 'contain' }} />
            ) : (
              <span style={{
                fontSize: fontSize * 1.25,
                fontWeight: 700,
                color: textColor,
              }}>
                {logoText}
              </span>
            )}
          </div>
        )}

        {/* Menu Items */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}>
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.link}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              style={{
                fontSize,
                fontWeight,
                color: textColor,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = textColor}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

Navigation.craft = {
  displayName: 'Navigation',
  props: {
    logoText: 'Il Mio Sito',
    showLogo: true,
    menuItems: [
      { id: '1', label: 'Home', link: '#home', external: false },
      { id: '2', label: 'Chi Siamo', link: '#about', external: false },
      { id: '3', label: 'Servizi', link: '#services', external: false },
      { id: '4', label: 'Contatti', link: '#contact', external: false },
    ],
    position: 'sticky',
    alignment: 'space-between',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    hoverColor: '#3b82f6',
    padding: 20,
    fontSize: 16,
    fontWeight: 500,
  },
  related: {
    settings: NavigationSettings,
  },
};
