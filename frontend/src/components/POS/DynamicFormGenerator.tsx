import React, { useRef, useState } from 'react';
import { Upload, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FieldSchema {
  type: string;
  label?: string;
  required?: boolean;
  min?: number;
  max?: number;
  fields?: { [key: string]: FieldSchema };
  maxItems?: number;
}

interface DynamicFormGeneratorProps {
  schema: { [key: string]: FieldSchema };
  content: any;
  onContentChange: (newContent: any) => void;
  organizationId: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const DynamicFormGenerator: React.FC<DynamicFormGeneratorProps> = ({
  schema,
  content,
  onContentChange,
  organizationId,
  onUploadStart,
  onUploadEnd,
  showToast
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>(() => {
    // Initialize all sections as expanded by default
    const initial: { [key: string]: boolean } = {};
    Object.keys(schema).forEach((key, index) => {
      initial[key] = index === 0; // Only first section expanded
    });
    return initial;
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newContent = JSON.parse(JSON.stringify(content)); // Deep clone

    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const isArrayIndex = !isNaN(parseInt(keys[i + 1]));

      if (isArrayIndex && !Array.isArray(current[key])) {
        current[key] = [];
      } else if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;

    onContentChange(newContent);
  };

  const handleImageUpload = async (path: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Per favore seleziona un\'immagine valida', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ L\'immagine deve essere inferiore a 5MB', 'warning');
      return;
    }

    try {
      onUploadStart?.();

      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}-${path.replace(/\./g, '-')}-${Date.now()}.${fileExt}`;
      const filePath = `website-images/${organizationId}/${fileName}`;

      const { error } = await supabase.storage
        .from('IMG')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('IMG')
        .getPublicUrl(filePath);

      handleFieldChange(path, publicUrl);
      showToast('✅ Immagine caricata!', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(`❌ Errore: ${error.message}`, 'error');
    } finally {
      onUploadEnd?.();
      if (fileInputRefs.current[path]) {
        fileInputRefs.current[path]!.value = '';
      }
    }
  };

  const getValueByPath = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const renderField = (key: string, fieldSchema: FieldSchema, path: string): React.ReactNode => {
    const value = getValueByPath(content, path);
    const label = fieldSchema.label || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

    switch (fieldSchema.type) {
      case 'text':
        return (
          <div key={path} className="wce-form-group">
            <label>
              {label}
              {fieldSchema.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              type="text"
              className="wce-input wce-input-large"
              value={value || ''}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              required={fieldSchema.required}
              placeholder={label}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={path} className="wce-form-group">
            <label>
              {label}
              {fieldSchema.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <textarea
              className="wce-textarea wce-input-large"
              value={value || ''}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              required={fieldSchema.required}
              rows={4}
              placeholder={label}
            />
          </div>
        );

      case 'number':
      case 'decimal':
        return (
          <div key={path} className="wce-form-group">
            <label>
              {label}
              {fieldSchema.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              type="number"
              className="wce-input wce-input-large"
              value={value || ''}
              onChange={(e) => handleFieldChange(path, parseFloat(e.target.value) || 0)}
              required={fieldSchema.required}
              min={fieldSchema.min}
              max={fieldSchema.max}
              step={fieldSchema.type === 'decimal' ? '0.01' : '1'}
              placeholder={label}
            />
          </div>
        );

      case 'media':
      case 'image':
        return (
          <div key={path} className="wce-form-group">
            <label>
              {label}
              {fieldSchema.required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
              ref={(el) => { fileInputRefs.current[path] = el; }}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(path, e)}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="wce-btn wce-btn-secondary wce-btn-upload"
              onClick={() => fileInputRefs.current[path]?.click()}
            >
              <Upload size={20} />
              Carica Immagine
            </button>
            {value && (
              <div className="wce-image-preview">
                <img src={value} alt={label} />
              </div>
            )}
          </div>
        );

      case 'object':
        // Object type renders as a collapsible section with nested fields
        return (
          <div key={path} className="wce-section">
            <div
              className="wce-section-header"
              onClick={() => toggleSection(path)}
              style={{ cursor: 'pointer' }}
            >
              <h2>{label}</h2>
              {expandedSections[path] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
            {expandedSections[path] && (
              <div className="wce-section-content">
                {fieldSchema.fields && Object.entries(fieldSchema.fields).map(([subKey, subSchema]) =>
                  renderField(subKey, subSchema, `${path}.${subKey}`)
                )}
              </div>
            )}
          </div>
        );

      case 'repeater':
        const items = value || [];
        return (
          <div key={path} className="wce-form-group">
            <label>{label}</label>
            <div className="wce-menu-items">
              {items.map((item: any, index: number) => (
                <div key={index} className="wce-menu-item-card">
                  <div className="wce-menu-item-header">
                    <h4>{label} #{index + 1}</h4>
                    <button
                      type="button"
                      className="wce-btn-icon wce-btn-danger"
                      onClick={() => {
                        const newItems = items.filter((_: any, i: number) => i !== index);
                        handleFieldChange(path, newItems);
                      }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  {fieldSchema.fields && Object.entries(fieldSchema.fields).map(([subKey, subSchema]) =>
                    renderField(subKey, subSchema, `${path}.${index}.${subKey}`)
                  )}
                </div>
              ))}
            </div>
            {(!fieldSchema.maxItems || items.length < fieldSchema.maxItems) && (
              <button
                type="button"
                className="wce-btn wce-btn-add"
                onClick={() => {
                  const newItem: any = {};
                  if (fieldSchema.fields) {
                    Object.keys(fieldSchema.fields).forEach(key => {
                      newItem[key] = '';
                    });
                  }
                  handleFieldChange(path, [...items, newItem]);
                }}
              >
                <Plus size={20} />
                Aggiungi {label}
              </button>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={path} className="wce-form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFieldChange(path, e.target.checked)}
                style={{ width: '28px', height: '28px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '1.2rem' }}>{label}</span>
            </label>
          </div>
        );

      default:
        return (
          <div key={path} className="wce-form-group">
            <label>{label}</label>
            <input
              type="text"
              className="wce-input wce-input-large"
              value={value || ''}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              placeholder={`${label} (tipo: ${fieldSchema.type})`}
            />
          </div>
        );
    }
  };

  return (
    <div className="dynamic-form">
      {Object.entries(schema).map(([key, fieldSchema]) =>
        renderField(key, fieldSchema, key)
      )}
    </div>
  );
};

export default DynamicFormGenerator;
