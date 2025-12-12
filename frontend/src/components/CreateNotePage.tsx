/**
 * Create Note Page - Full Screen Component
 * Componente a schermo intero per creare note staff
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle, Bell, Users, User, Search, Check, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CreateNotePage.css';

interface CreateNotePageProps {
  onClose: () => void;
  onCreateNote: (noteData: {
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    show_popup: boolean;
    recipients?: {
      staff_ids?: string[];
      customer_ids?: string[];
      all_staff?: boolean;
    };
  }) => Promise<void>;
  customerName?: string;
  organizationId?: string;
  showRecipients?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

const CreateNotePage: React.FC<CreateNotePageProps> = ({
  onClose,
  onCreateNote,
  customerName,
  organizationId,
  showRecipients = false,
  primaryColor = '#3b82f6',
  secondaryColor = '#2563eb'
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [showPopup, setShowPopup] = useState(false);
  const [creating, setCreating] = useState(false);

  // Recipients
  const [allStaff, setAllStaff] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [activeRecipientTab, setActiveRecipientTab] = useState<'staff' | 'customers'>('staff');
  const [searchQuery, setSearchQuery] = useState('');

  // Load recipients
  useEffect(() => {
    if (showRecipients && organizationId) {
      loadRecipients();
    }
  }, [showRecipients, organizationId]);

  const loadRecipients = async () => {
    if (!organizationId) return;

    setLoadingRecipients(true);
    try {
      // Load staff members
      const { data: staff, error: staffError } = await supabase
        .from('staff_members')
        .select('id, name, email')
        .eq('organization_id', organizationId)
        .order('name');

      if (staffError) throw staffError;
      setStaffMembers(staff || []);

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('organization_id', organizationId)
        .order('name')
        .limit(100);

      if (customersError) throw customersError;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Inserisci titolo e contenuto della nota');
      return;
    }

    if (showRecipients && !allStaff && selectedStaffIds.length === 0 && selectedCustomerIds.length === 0) {
      alert('Seleziona almeno un destinatario');
      return;
    }

    setCreating(true);
    try {
      const noteData: any = {
        title: title.trim(),
        content: content.trim(),
        priority,
        show_popup: showPopup
      };

      if (showRecipients) {
        noteData.recipients = {
          all_staff: allStaff,
          staff_ids: allStaff ? [] : selectedStaffIds,
          customer_ids: selectedCustomerIds
        };
      }

      await onCreateNote(noteData);

      // Reset and close
      setTitle('');
      setContent('');
      setPriority('normal');
      setShowPopup(false);
      setAllStaff(false);
      setSelectedStaffIds([]);
      setSelectedCustomerIds([]);
      onClose();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Errore durante la creazione della nota');
    } finally {
      setCreating(false);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const getPriorityIcon = (p: string) => {
    switch (p) {
      case 'urgent': return <AlertTriangle size={20} color="#ef4444" />;
      case 'high': return <AlertCircle size={20} color="#f59e0b" />;
      case 'normal': return <Info size={20} color="#3b82f6" />;
      case 'low': return <Bell size={20} color="#6b7280" />;
      default: return <Info size={20} color="#3b82f6" />;
    }
  };

  return (
    <div className="create-note-page">
      {/* Header */}
      <div
        className="create-note-page-header"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <button className="create-note-back-btn" onClick={onClose}>
          <ArrowLeft size={24} />
        </button>
        <h1>{customerName ? `Nuova Nota per ${customerName}` : 'Nuova Nota Generale'}</h1>
      </div>

      {/* Content */}
      <div className="create-note-page-content">
        <form onSubmit={handleSubmit} className="create-note-form">
          <div className="create-note-form-grid">
            {/* Left Column */}
            <div className="create-note-left-col">
              {/* Title */}
              <div className="cnp-form-group">
                <label htmlFor="note-title">Titolo</label>
                <input
                  id="note-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Cliente deve pagare €50"
                  maxLength={100}
                  required
                  className="cnp-input"
                />
              </div>

              {/* Content */}
              <div className="cnp-form-group">
                <label htmlFor="note-content">Contenuto</label>
                <textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descrizione dettagliata della nota..."
                  rows={8}
                  required
                  className="cnp-textarea"
                />
              </div>

              {/* Priority */}
              <div className="cnp-form-group">
                <label>Priorità</label>
                <div className="cnp-priority-buttons">
                  {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`cnp-priority-btn ${priority === p ? 'active' : ''}`}
                      onClick={() => setPriority(p)}
                    >
                      {getPriorityIcon(p)}
                      <span>
                        {p === 'urgent' && 'URGENTE'}
                        {p === 'high' && 'Alta'}
                        {p === 'normal' && 'Normale'}
                        {p === 'low' && 'Bassa'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Popup Toggle */}
              {customerName && (
                <div className="cnp-form-group">
                  <div className="cnp-toggle-container">
                    <div className="cnp-toggle-label-wrapper">
                      <label htmlFor="popup-toggle" className="cnp-toggle-label-text">
                        Mostra popup automatico
                      </label>
                      <p className="cnp-help-text">
                        Questa nota apparirà in un popup quando si apre il cliente
                      </p>
                    </div>
                    <label className="cnp-toggle-switch">
                      <input
                        id="popup-toggle"
                        type="checkbox"
                        checked={showPopup}
                        onChange={(e) => setShowPopup(e.target.checked)}
                      />
                      <span className="cnp-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Recipients */}
            {showRecipients && (
              <div className="create-note-right-col">
                <div className="cnp-recipients-wrapper">
                  <div className="cnp-recipients-header">
                    <Users size={20} />
                    <span>Destinatari</span>
                  </div>

                  {/* Broadcast Card */}
                  <div
                    className="cnp-broadcast-card"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                    }}
                  >
                    <div className="cnp-broadcast-toggle">
                      <div>
                        <div className="cnp-broadcast-label">
                          <Users size={20} />
                          Invia a tutto lo Staff
                        </div>
                        <p className="cnp-broadcast-description">
                          La nota sarà visibile a tutti i membri dello staff
                        </p>
                      </div>
                      <label className="cnp-toggle-switch">
                        <input
                          type="checkbox"
                          checked={allStaff}
                          onChange={(e) => {
                            setAllStaff(e.target.checked);
                            if (e.target.checked) {
                              setSelectedStaffIds([]);
                              setSelectedCustomerIds([]);
                            }
                          }}
                        />
                        <span className="cnp-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {!allStaff && (
                    <>
                      {/* Tabs */}
                      <div className="cnp-recipients-tabs">
                        <button
                          type="button"
                          className={`cnp-recipient-tab ${activeRecipientTab === 'staff' ? 'active' : ''}`}
                          onClick={() => setActiveRecipientTab('staff')}
                          style={activeRecipientTab === 'staff' ? {
                            borderBottomColor: primaryColor,
                            color: primaryColor
                          } : {}}
                        >
                          <User size={16} />
                          Staff
                          <span className="cnp-recipient-tab-badge">{selectedStaffIds.length}</span>
                        </button>
                        <button
                          type="button"
                          className={`cnp-recipient-tab ${activeRecipientTab === 'customers' ? 'active' : ''}`}
                          onClick={() => setActiveRecipientTab('customers')}
                          style={activeRecipientTab === 'customers' ? {
                            borderBottomColor: primaryColor,
                            color: primaryColor
                          } : {}}
                        >
                          <Users size={16} />
                          Clienti
                          <span className="cnp-recipient-tab-badge">{selectedCustomerIds.length}</span>
                        </button>
                      </div>

                      {/* Search */}
                      <div className="cnp-recipients-search">
                        <Search size={18} />
                        <input
                          type="text"
                          placeholder={`Cerca ${activeRecipientTab === 'staff' ? 'staff' : 'cliente'}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Recipients List */}
                      {activeRecipientTab === 'staff' && staffMembers.length > 0 && (
                        <div className="cnp-recipients-grid">
                          {staffMembers
                            .filter(staff =>
                              !searchQuery ||
                              (staff.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (staff.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .map(staff => (
                              <div
                                key={staff.id}
                                className={`cnp-recipient-card ${selectedStaffIds.includes(staff.id) ? 'selected' : ''}`}
                                onClick={() => toggleStaffSelection(staff.id)}
                              >
                                <div className="cnp-recipient-checkbox">
                                  <Check size={16} />
                                </div>
                                <div className="cnp-recipient-info">
                                  <p className="cnp-recipient-name">{staff.name || 'Senza nome'}</p>
                                  <p className="cnp-recipient-email">{staff.email}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {activeRecipientTab === 'customers' && customers.length > 0 && (
                        <div className="cnp-recipients-grid">
                          {customers
                            .filter(customer =>
                              !searchQuery ||
                              customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (customer.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (customer.phone?.includes(searchQuery))
                            )
                            .map(customer => (
                              <div
                                key={customer.id}
                                className={`cnp-recipient-card ${selectedCustomerIds.includes(customer.id) ? 'selected' : ''}`}
                                onClick={() => toggleCustomerSelection(customer.id)}
                              >
                                <div className="cnp-recipient-checkbox">
                                  <Check size={16} />
                                </div>
                                <div className="cnp-recipient-info">
                                  <p className="cnp-recipient-name">{customer.name}</p>
                                  <p className="cnp-recipient-email">{customer.email || customer.phone || 'Nessun contatto'}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {loadingRecipients && (
                        <div className="cnp-recipients-empty">
                          <Users size={48} />
                          <p>Caricamento destinatari...</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Summary */}
                  {(allStaff || selectedStaffIds.length > 0 || selectedCustomerIds.length > 0) && (
                    <div className="cnp-recipients-summary">
                      <CheckCircle size={20} />
                      {allStaff ? (
                        <span>Nota sarà inviata a tutto lo staff</span>
                      ) : (
                        <span>
                          {selectedStaffIds.length} staff, {selectedCustomerIds.length} clienti
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="create-note-page-footer">
            <button type="button" className="cnp-btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button
              type="submit"
              className="cnp-btn-primary"
              disabled={creating}
              style={{
                background: creating ? '#9ca3af' : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              {creating ? 'Creazione...' : 'Crea Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotePage;
