/**
 * Create Note Modal
 * Modal per creare nuove note staff (sia per clienti che generali)
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle, Bell, Users, User, Search, Check, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CreateNoteModal.css';

interface CreateNoteModalProps {
  isOpen: boolean;
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
  customerName?: string; // Nome del cliente se è una nota per cliente specifico
  organizationId?: string; // Per caricare lista staff e clienti
  showRecipients?: boolean; // Se true, mostra selezione destinatari
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  onCreateNote,
  customerName,
  organizationId,
  showRecipients = false
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

  // Load staff and customers when modal opens and showRecipients is true
  useEffect(() => {
    if (isOpen && showRecipients && organizationId) {
      loadRecipients();
    }
  }, [isOpen, showRecipients, organizationId]);

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
        .limit(100); // Limit for performance

      if (customersError) throw customersError;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Inserisci titolo e contenuto della nota');
      return;
    }

    // Validate recipients if showRecipients is true
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

      // Add recipients if enabled
      if (showRecipients) {
        noteData.recipients = {
          all_staff: allStaff,
          staff_ids: allStaff ? [] : selectedStaffIds,
          customer_ids: selectedCustomerIds
        };
      }

      await onCreateNote(noteData);

      // Reset form
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
    <div className="create-note-modal-overlay" onClick={onClose}>
      <div className="create-note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-note-modal-header">
          <h2>
            {customerName ? `Nuova Nota per ${customerName}` : 'Nuova Nota Generale'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-note-modal-content">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="note-title">Titolo</label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Cliente deve pagare €50"
                maxLength={100}
                required
              />
            </div>

            {/* Content */}
            <div className="form-group">
              <label htmlFor="note-content">Contenuto</label>
              <textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descrizione dettagliata della nota..."
                rows={5}
                required
              />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Priorità</label>
              <div className="priority-buttons">
                {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-btn ${priority === p ? 'active' : ''}`}
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

            {/* Show Popup Toggle (solo per note cliente) */}
            {customerName && (
              <div className="form-group">
                <div className="toggle-container">
                  <div className="toggle-label-wrapper">
                    <label htmlFor="popup-toggle" className="toggle-label-text">
                      Mostra popup automatico
                    </label>
                    <p className="help-text-inline">
                      Questa nota apparirà in un popup quando si apre il cliente
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      id="popup-toggle"
                      type="checkbox"
                      checked={showPopup}
                      onChange={(e) => setShowPopup(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}

            {/* Recipients Section - New Design */}
            {showRecipients && (
              <div className="recipients-wrapper">
                <div className="recipients-header">
                  <Users size={20} />
                  Destinatari
                </div>

                {/* Broadcast Card */}
                <div className="broadcast-card">
                  <div className="broadcast-toggle">
                    <div>
                      <div className="broadcast-label">
                        <Users size={20} />
                        Invia a tutto lo Staff
                      </div>
                      <p className="broadcast-description">
                        La nota sarà visibile a tutti i membri dello staff dell'organizzazione
                      </p>
                    </div>
                    <label className="toggle-switch">
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
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {!allStaff && (
                  <>
                    {/* Tabs */}
                    <div className="recipients-tabs">
                      <button
                        type="button"
                        className={`recipient-tab ${activeRecipientTab === 'staff' ? 'active' : ''}`}
                        onClick={() => setActiveRecipientTab('staff')}
                      >
                        <User size={16} />
                        Staff
                        <span className="recipient-tab-badge">{selectedStaffIds.length}</span>
                      </button>
                      <button
                        type="button"
                        className={`recipient-tab ${activeRecipientTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveRecipientTab('customers')}
                      >
                        <Users size={16} />
                        Clienti
                        <span className="recipient-tab-badge">{selectedCustomerIds.length}</span>
                      </button>
                    </div>

                    {/* Search */}
                    <div className="recipients-search">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder={`Cerca ${activeRecipientTab === 'staff' ? 'membro staff' : 'cliente'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Recipients Grid */}
                    {activeRecipientTab === 'staff' && staffMembers.length > 0 && (
                      <div className="recipients-grid">
                        {staffMembers
                          .filter(staff =>
                            !searchQuery ||
                            (staff.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (staff.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                          .map(staff => (
                            <div
                              key={staff.id}
                              className={`recipient-card ${selectedStaffIds.includes(staff.id) ? 'selected' : ''}`}
                              onClick={() => toggleStaffSelection(staff.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStaffIds.includes(staff.id)}
                                onChange={() => {}}
                              />
                              <div className="recipient-checkbox-custom">
                                <Check size={14} />
                              </div>
                              <div className="recipient-info">
                                <p className="recipient-card-name">{staff.name || 'Senza nome'}</p>
                                <p className="recipient-card-email">{staff.email}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {activeRecipientTab === 'customers' && customers.length > 0 && (
                      <div className="recipients-grid">
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
                              className={`recipient-card ${selectedCustomerIds.includes(customer.id) ? 'selected' : ''}`}
                              onClick={() => toggleCustomerSelection(customer.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCustomerIds.includes(customer.id)}
                                onChange={() => {}}
                              />
                              <div className="recipient-checkbox-custom">
                                <Check size={14} />
                              </div>
                              <div className="recipient-info">
                                <p className="recipient-card-name">{customer.name}</p>
                                <p className="recipient-card-email">{customer.email || customer.phone || 'Nessun contatto'}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {loadingRecipients && (
                      <div className="recipients-empty">
                        <Users size={48} />
                        <p>Caricamento destinatari...</p>
                      </div>
                    )}
                  </>
                )}

                {/* Summary */}
                {(allStaff || selectedStaffIds.length > 0 || selectedCustomerIds.length > 0) && (
                  <div className="recipients-summary">
                    <CheckCircle size={20} />
                    {allStaff ? (
                      <span>Nota sarà inviata a tutto lo staff</span>
                    ) : (
                      <span>
                        {selectedStaffIds.length} staff, {selectedCustomerIds.length} clienti selezionati
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="create-note-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creazione...' : 'Crea Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNoteModal;
