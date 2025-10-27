// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Type, Palette, Maximize2, Mail, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../ConfirmModal';

export interface ContactFormProps {
  // Campi Form
  showNameField?: boolean;
  showEmailField?: boolean;
  showPhoneField?: boolean;
  showSubjectField?: boolean;
  showMessageField?: boolean;

  // Labels
  nameLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  subjectLabel?: string;
  messageLabel?: string;
  buttonText?: string;

  // Placeholders
  namePlaceholder?: string;
  emailPlaceholder?: string;
  phonePlaceholder?: string;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;

  // Email Settings
  recipientEmail?: string;

  // Stile
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  inputBorderRadius?: number;
  labelColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonHoverBackgroundColor?: string;

  // Font
  fontFamily?: string;
  fontSize?: number;
  labelFontSize?: number;
  buttonFontSize?: number;

  // Spaziatura
  padding?: number;
  gap?: number;
  inputPadding?: number;
  buttonPadding?: number;

  // Layout
  layout?: 'vertical' | 'horizontal';
  columns?: number;
}

const ContactFormSettings: React.FC = () => {
  const {
    actions: { setProp, delete: deleteNode },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['campi']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const accordionHeaderStyle = (isExpanded: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: isExpanded ? '#f9fafb' : '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: isExpanded ? '12px' : '8px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
  });

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  };

  const sliderLabelStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
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
        <div onClick={() => toggleSection(id)} style={accordionHeaderStyle(isExpanded)}>
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

  const FONT_OPTIONS = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Palatino, serif',
    'Garamond, serif',
    'Comic Sans MS, cursive',
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Poppins, sans-serif',
    'Montserrat, sans-serif',
    'Open Sans, sans-serif',
  ];

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

      {/* Header con pulsante elimina */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} />
          Contact Form Settings
        </h3>
        <button
          onClick={() => {
            confirm({
              title: 'Elimina Form',
              message: 'Sei sicuro di voler eliminare questo form di contatto?',
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

      {/* Campi Form */}
      <AccordionSection id="campi" title="Campi Form" icon={<Type size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.showNameField}
                onChange={(e) => setProp((props: ContactFormProps) => (props.showNameField = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Campo Nome</span>
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.showEmailField}
                onChange={(e) => setProp((props: ContactFormProps) => (props.showEmailField = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Campo Email</span>
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.showPhoneField}
                onChange={(e) => setProp((props: ContactFormProps) => (props.showPhoneField = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Campo Telefono</span>
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.showSubjectField}
                onChange={(e) => setProp((props: ContactFormProps) => (props.showSubjectField = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Campo Oggetto</span>
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={props.showMessageField}
                onChange={(e) => setProp((props: ContactFormProps) => (props.showMessageField = e.target.checked))}
                style={{ width: '20px', height: '20px', marginRight: '12px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Mostra Campo Messaggio</span>
            </label>
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>
              <Mail size={14} />
              <span>Email Destinatario</span>
            </div>
            <input
              type="email"
              value={props.recipientEmail}
              onChange={(e) => setProp((props: ContactFormProps) => (props.recipientEmail = e.target.value))}
              style={inputStyle}
              placeholder="info@example.com"
            />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              📧 Le email del form verranno inviate qui
            </p>
          </div>
        </div>
      </AccordionSection>

      {/* Colori */}
      <AccordionSection id="colori" title="Colori" icon={<Palette size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>Colore Sfondo Form</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={props.backgroundColor}
                onChange={(e) => setProp((props: ContactFormProps) => (props.backgroundColor = e.target.value))}
                style={{ width: '48px', height: '48px', borderRadius: '8px', border: '2px solid #e5e7eb', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={props.backgroundColor}
                onChange={(e) => setProp((props: ContactFormProps) => (props.backgroundColor = e.target.value))}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>Colore Input</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={props.inputBackgroundColor}
                onChange={(e) => setProp((props: ContactFormProps) => (props.inputBackgroundColor = e.target.value))}
                style={{ width: '48px', height: '48px', borderRadius: '8px', border: '2px solid #e5e7eb', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={props.inputBackgroundColor}
                onChange={(e) => setProp((props: ContactFormProps) => (props.inputBackgroundColor = e.target.value))}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>Colore Bottone</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={props.buttonBackgroundColor}
                onChange={(e) => setProp((props: ContactFormProps) => (props.buttonBackgroundColor = e.target.value))}
                style={{ width: '48px', height: '48px', borderRadius: '8px', border: '2px solid #e5e7eb', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={props.buttonBackgroundColor}
                onChange={(e) => setProp((props: ContactFormProps) => (props.buttonBackgroundColor = e.target.value))}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Font */}
      <AccordionSection id="font" title="Tipografia" icon={<Type size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>Font Family</div>
            <select
              value={props.fontFamily}
              onChange={(e) => setProp((props: ContactFormProps) => (props.fontFamily = e.target.value))}
              style={inputStyle}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Dimensione Font Input</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={props.fontSize}
              onChange={(e) => setProp((props: ContactFormProps) => (props.fontSize = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Dimensione Font Label</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.labelFontSize}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="20"
              value={props.labelFontSize}
              onChange={(e) => setProp((props: ContactFormProps) => (props.labelFontSize = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Dimensione Font Bottone</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.buttonFontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={props.buttonFontSize}
              onChange={(e) => setProp((props: ContactFormProps) => (props.buttonFontSize = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Spaziatura */}
      <AccordionSection id="spaziatura" title="Spaziatura" icon={<Maximize2 size={16} color="#6b7280" />}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Padding Form</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.padding}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={props.padding}
              onChange={(e) => setProp((props: ContactFormProps) => (props.padding = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Spaziatura tra Campi</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.gap}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="40"
              value={props.gap}
              onChange={(e) => setProp((props: ContactFormProps) => (props.gap = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Padding Input</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.inputPadding}px</span>
            </div>
            <input
              type="range"
              min="6"
              max="24"
              value={props.inputPadding}
              onChange={(e) => setProp((props: ContactFormProps) => (props.inputPadding = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={sliderLabelStyle}>
              <span>Bordi Arrotondati Input</span>
              <span style={{ color: '#3b82f6', fontWeight: '700' }}>{props.inputBorderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={props.inputBorderRadius}
              onChange={(e) => setProp((props: ContactFormProps) => (props.inputBorderRadius = parseInt(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </AccordionSection>
    </div>
  );
};

export const ContactForm: React.FC<ContactFormProps> = ({
  showNameField = true,
  showEmailField = true,
  showPhoneField = false,
  showSubjectField = true,
  showMessageField = true,
  nameLabel = 'Nome',
  emailLabel = 'Email',
  phoneLabel = 'Telefono',
  subjectLabel = 'Oggetto',
  messageLabel = 'Messaggio',
  buttonText = 'Invia Messaggio',
  namePlaceholder = 'Il tuo nome',
  emailPlaceholder = 'la-tua@email.com',
  phonePlaceholder = '+39 123 456 7890',
  subjectPlaceholder = 'Oggetto del messaggio',
  messagePlaceholder = 'Scrivi il tuo messaggio...',
  recipientEmail = 'info@example.com',
  backgroundColor = '#ffffff',
  borderColor = '#e5e7eb',
  borderRadius = 12,
  borderWidth = 1,
  inputBackgroundColor = '#f9fafb',
  inputTextColor = '#1f2937',
  inputBorderColor = '#e5e7eb',
  inputBorderRadius = 8,
  labelColor = '#374151',
  buttonBackgroundColor = '#3b82f6',
  buttonTextColor = '#ffffff',
  buttonHoverBackgroundColor = '#2563eb',
  fontFamily = 'Inter, sans-serif',
  fontSize = 14,
  labelFontSize = 14,
  buttonFontSize = 16,
  padding = 24,
  gap = 16,
  inputPadding = 12,
  buttonPadding = 12,
  layout = 'vertical',
  columns = 1,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Implementare l'invio email tramite backend
      // Per ora simuliamo l'invio
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Form data to send:', {
        ...formData,
        recipientEmail,
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${inputPadding}px`,
    backgroundColor: inputBackgroundColor,
    color: inputTextColor,
    border: `1.5px solid ${inputBorderColor}`,
    borderRadius: `${inputBorderRadius}px`,
    fontSize: `${fontSize}px`,
    fontFamily,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    color: labelColor,
    fontSize: `${labelFontSize}px`,
    fontWeight: '600',
    fontFamily,
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        backgroundColor,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        fontFamily,
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
        {showNameField && (
          <div>
            <label style={labelStyle}>{nameLabel}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={namePlaceholder}
              style={inputStyle}
              required
            />
          </div>
        )}

        {showEmailField && (
          <div>
            <label style={labelStyle}>{emailLabel}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={emailPlaceholder}
              style={inputStyle}
              required
            />
          </div>
        )}

        {showPhoneField && (
          <div>
            <label style={labelStyle}>{phoneLabel}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={phonePlaceholder}
              style={inputStyle}
            />
          </div>
        )}

        {showSubjectField && (
          <div>
            <label style={labelStyle}>{subjectLabel}</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={subjectPlaceholder}
              style={inputStyle}
              required
            />
          </div>
        )}

        {showMessageField && (
          <div>
            <label style={labelStyle}>{messageLabel}</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={messagePlaceholder}
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: `${buttonPadding}px ${buttonPadding * 2}px`,
            backgroundColor: buttonBackgroundColor,
            color: buttonTextColor,
            border: 'none',
            borderRadius: `${inputBorderRadius}px`,
            fontSize: `${buttonFontSize}px`,
            fontWeight: '600',
            fontFamily,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = buttonHoverBackgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonBackgroundColor;
          }}
        >
          <Send size={16} />
          {isSubmitting ? 'Invio in corso...' : buttonText}
        </button>

        {submitStatus === 'success' && (
          <div style={{
            padding: '12px',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            ✓ Messaggio inviato con successo!
          </div>
        )}

        {submitStatus === 'error' && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            ✗ Errore nell'invio. Riprova più tardi.
          </div>
        )}
      </form>
    </div>
  );
};

ContactForm.craft = {
  displayName: 'Contact Form',
  props: {
    showNameField: true,
    showEmailField: true,
    showPhoneField: false,
    showSubjectField: true,
    showMessageField: true,
    nameLabel: 'Nome',
    emailLabel: 'Email',
    phoneLabel: 'Telefono',
    subjectLabel: 'Oggetto',
    messageLabel: 'Messaggio',
    buttonText: 'Invia Messaggio',
    namePlaceholder: 'Il tuo nome',
    emailPlaceholder: 'la-tua@email.com',
    phonePlaceholder: '+39 123 456 7890',
    subjectPlaceholder: 'Oggetto del messaggio',
    messagePlaceholder: 'Scrivi il tuo messaggio...',
    recipientEmail: 'info@example.com',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    inputBackgroundColor: '#f9fafb',
    inputTextColor: '#1f2937',
    inputBorderColor: '#e5e7eb',
    inputBorderRadius: 8,
    labelColor: '#374151',
    buttonBackgroundColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    buttonHoverBackgroundColor: '#2563eb',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    labelFontSize: 14,
    buttonFontSize: 16,
    padding: 24,
    gap: 16,
    inputPadding: 12,
    buttonPadding: 12,
    layout: 'vertical',
    columns: 1,
  },
  related: {
    settings: ContactFormSettings,
  },
};
