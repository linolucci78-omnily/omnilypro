// @ts-nocheck
import React, { type ReactNode } from 'react';
import { useNode, Element } from '@craftjs/core';
import { Gift, Star, Zap, Award, TrendingUp, Users, Sparkles, Trash2 } from 'lucide-react';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { useConfirm } from '../../../../hooks/useConfirm';
import ConfirmModal from '../../../UI/ConfirmModal';

export interface LoyaltySectionProps {
  children?: ReactNode;
  sectionId?: string;
  sectionName?: string;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

const defaultFeatures = [
  {
    icon: 'gift',
    title: 'Accumula Punti',
    description: 'Guadagna punti ad ogni acquisto e convertili in premi e sconti esclusivi'
  },
  {
    icon: 'star',
    title: 'Vantaggi VIP',
    description: 'Diventa cliente VIP e accedi a promozioni esclusive riservate ai più fedeli'
  },
  {
    icon: 'zap',
    title: 'Premi Immediati',
    description: 'Sblocca ricompense speciali e ricevi sorprese ad ogni traguardo raggiunto'
  },
  {
    icon: 'award',
    title: 'Porta un Amico',
    description: 'Invita i tuoi amici e ricevi punti bonus quando fanno il primo acquisto'
  },
  {
    icon: 'trending-up',
    title: 'Offerte Personalizzate',
    description: 'Ricevi sconti e promozioni pensate apposta per te in base alle tue preferenze'
  },
  {
    icon: 'users',
    title: 'Comunità Esclusiva',
    description: 'Entra a far parte della nostra community e partecipa ad eventi riservati'
  }
];

const LoyaltySettings = () => {
  const confirmHook = useConfirm();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = confirmHook;

  const {
    actions: { setProp, delete: deleteNode },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' };
  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '6px' };

  return (
    <div style={{ padding: '16px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          Impostazioni Sezione Fidelizzazione
        </h3>
        <button
          onClick={() => {
            confirm({
              title: 'Elimina Sezione Fidelity',
              message: 'Sei sicuro di voler eliminare questa sezione?',
              confirmText: 'Elimina',
              cancelText: 'Annulla',
              type: 'danger',
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

      {/* Nome Sezione per Menu */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Nome Sezione (per menu)</label>
        <input
          type="text"
          value={props.sectionName || ''}
          onChange={(e) => setProp((props: LoyaltySectionProps) => (props.sectionName = e.target.value))}
          placeholder="es. Fidelity, Premi"
          style={inputStyle}
        />
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
          Nome visualizzato nel menu di navigazione
        </p>
      </div>

      {/* ID Ancora */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>ID Ancora (per link)</label>
        <input
          type="text"
          value={props.sectionId || ''}
          onChange={(e) => {
            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            setProp((props: LoyaltySectionProps) => (props.sectionId = value));
          }}
          placeholder="es. fidelity, loyalty"
          style={{ ...inputStyle, fontFamily: 'monospace' }}
        />
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
          Link: #{props.sectionId || 'id-sezione'}
        </p>
      </div>

      {/* Titolo */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Titolo</label>
        <input
          type="text"
          value={props.title}
          onChange={(e) => setProp((props: LoyaltySectionProps) => (props.title = e.target.value))}
          style={inputStyle}
        />
      </div>

      {/* Sottotitolo */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Sottotitolo</label>
        <textarea
          value={props.subtitle}
          onChange={(e) => setProp((props: LoyaltySectionProps) => (props.subtitle = e.target.value))}
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
        />
      </div>

      {/* Colore di Sfondo */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Colore Sfondo</label>
        <input
          type="color"
          value={props.backgroundColor}
          onChange={(e) => setProp((props: LoyaltySectionProps) => (props.backgroundColor = e.target.value))}
          style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>

      {/* Colore Testo */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Colore Testo</label>
        <input
          type="color"
          value={props.textColor}
          onChange={(e) => setProp((props: LoyaltySectionProps) => (props.textColor = e.target.value))}
          style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>

      {/* Colore Accento */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Colore Accento</label>
        <input
          type="color"
          value={props.accentColor}
          onChange={(e) => setProp((props: LoyaltySectionProps) => (props.accentColor = e.target.value))}
          style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};

export const LoyaltySection: React.FC<LoyaltySectionProps> = ({
  children,
  sectionId,
  sectionName,
  title = 'Unisciti al Nostro Programma Fedeltà',
  subtitle = 'Ogni acquisto ti avvicina a premi esclusivi. Accumula punti, sblocca vantaggi e goditi esperienze riservate ai nostri clienti più affezionati.',
  backgroundColor = '#0f172a',
  textColor = '#ffffff',
  accentColor = '#f59e0b',
  features = defaultFeatures,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <section
      id={sectionId}
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        position: 'relative',
        width: '100%',
        padding: '80px 20px',
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${adjustBrightness(backgroundColor, 20)} 100%)`,
        color: textColor,
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '-2px',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'pulse 3s ease-in-out infinite 1s',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: `${accentColor}22`,
              borderRadius: '50px',
              marginBottom: '24px',
              border: `2px solid ${accentColor}`,
            }}
          >
            <Sparkles size={20} color={accentColor} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: accentColor }}>
              Powered by Omnily
            </span>
          </div>

          <h2
            style={{
              fontSize: '48px',
              fontWeight: '800',
              margin: '0 0 20px 0',
              background: `linear-gradient(135deg, ${textColor} 0%, ${accentColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2',
            }}
          >
            {title}
          </h2>

          <p
            style={{
              fontSize: '20px',
              color: `${textColor}cc`,
              maxWidth: '800px',
              margin: '0 auto 40px',
              lineHeight: '1.6',
            }}
          >
            {subtitle}
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '16px 40px',
                fontSize: '18px',
                fontWeight: '600',
                background: accentColor,
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: `0 10px 30px ${accentColor}44`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Iscriviti Ora
            </button>
            <button
              style={{
                padding: '16px 40px',
                fontSize: '18px',
                fontWeight: '600',
                background: 'transparent',
                color: textColor,
                border: `2px solid ${textColor}33`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${textColor}33`;
                e.currentTarget.style.color = textColor;
              }}
            >
              Scopri i Vantaggi
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '60px',
          }}
        >
          {features.map((feature, index) => {
            // Map icon string to lucide-react component
            const getIcon = (iconName: string) => {
              const icons = {
                gift: Gift,
                star: Star,
                zap: Zap,
                award: Award,
                'trending-up': TrendingUp,
                users: Users,
              };
              const IconComponent = icons[iconName] || Gift;
              return <IconComponent size={48} color={accentColor} strokeWidth={1.5} />;
            };

            return (
              <div
                key={index}
                style={{
                  padding: '32px',
                  background: `${textColor}08`,
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  border: `1px solid ${textColor}11`,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.boxShadow = `0 20px 40px ${accentColor}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = `${textColor}11`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    marginBottom: '16px',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                  }}
                >
                  {getIcon(feature.icon)}
                </div>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: textColor,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: `${textColor}cc`,
                    lineHeight: '1.6',
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px',
            padding: '48px',
            background: `${accentColor}11`,
            borderRadius: '24px',
            border: `2px solid ${accentColor}33`,
          }}
        >
          {[
            { value: '1000+', label: 'Membri Attivi' },
            { value: '500+', label: 'Premi Riscattati' },
            { value: '4.8★', label: 'Valutazione Media' },
            { value: '15%', label: 'Sconto Massimo' },
          ].map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: accentColor,
                  marginBottom: '8px',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: `${textColor}cc`,
                  fontWeight: '600',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Content Area - Droppable */}
        <Element
          id="loyalty-custom-content"
          is="div"
          canvas
          style={{
            marginTop: '40px',
            minHeight: children ? 'auto' : '100px',
            padding: '20px',
            border: selected ? '2px dashed rgba(255,255,255,0.3)' : '2px dashed transparent',
            borderRadius: '12px',
            transition: 'all 0.3s'
          }}
        >
          {children}
        </Element>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </section>
  );
};

// Helper function to adjust brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

LoyaltySection.craft = {
  displayName: 'Loyalty Section',
  props: {
    sectionId: 'fidelity',
    sectionName: 'Fidelity',
    title: 'Unisciti al Nostro Programma Fedeltà',
    subtitle:
      'Ogni acquisto ti avvicina a premi esclusivi. Accumula punti, sblocca vantaggi e goditi esperienze riservate ai nostri clienti più affezionati.',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#f59e0b',
    features: defaultFeatures,
  },
  related: {
    settings: LoyaltySettings,
  },
};
