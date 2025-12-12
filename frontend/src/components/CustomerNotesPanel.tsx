/**
 * Customer Notes Panel
 * Pannello laterale per gestire note del cliente
 */

import React, { useState } from 'react';
import { X, StickyNote, Plus, Trash2, Archive, CheckCircle, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';
import { StaffNote } from '../services/staffNotesService';
import CreateNoteModal from './CreateNoteModal';
import ConfirmModal from './UI/ConfirmModal';
import './CustomerNotesPanel.css';

interface CustomerNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  notes: StaffNote[];
  onCreateNote: (noteData: {
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    show_popup: boolean;
  }) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  onArchiveNote?: (noteId: string) => Promise<void>;
  onMarkAsRead?: (noteId: string) => Promise<void>;
  primaryColor?: string;
  secondaryColor?: string;
}

const CustomerNotesPanel: React.FC<CustomerNotesPanelProps> = ({
  isOpen,
  onClose,
  customerName,
  notes,
  onCreateNote,
  onDeleteNote,
  onArchiveNote,
  onMarkAsRead,
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444'
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; noteId: string | null }>({ show: false, noteId: null });
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle size={20} color="#ef4444" />;
      case 'high': return <AlertCircle size={20} color="#f59e0b" />;
      case 'normal': return <Info size={20} color="#3b82f6" />;
      case 'low': return <Bell size={20} color="#6b7280" />;
      default: return <Info size={20} color="#3b82f6" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'URGENTE';
      case 'high': return 'Alta';
      case 'normal': return 'Normale';
      case 'low': return 'Bassa';
      default: return 'Normale';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attiva';
      case 'read': return 'Letta';
      case 'completed': return 'Completata';
      case 'archived': return 'Archiviata';
      default: return status;
    }
  };

  const handleDelete = async (noteId: string) => {
    if (onDeleteNote) {
      await onDeleteNote(noteId);
      setDeleteConfirm({ show: false, noteId: null });
    }
  };

  if (!isOpen) return null;

  // Filtra note per stato
  const activeNotes = notes.filter(note => note.status !== 'archived');
  const archivedNotes = notes.filter(note => note.status === 'archived');
  const displayNotes = activeTab === 'active' ? activeNotes : archivedNotes;

  return (
    <>
      {/* Overlay */}
      <div
        className="customer-notes-panel-overlay"
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div className={`customer-notes-panel open`}>
        {/* Header */}
        <div
          className="customer-notes-panel-header"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            boxShadow: `0 8px 32px ${primaryColor}40, 0 4px 16px ${primaryColor}30`
          }}
        >
          <div className="header-left">
            <StickyNote size={24} />
            <div>
              <h2>Note Staff</h2>
              <p>{customerName}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="notes-tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
            style={activeTab === 'active' ? {
              borderBottomColor: primaryColor,
              color: primaryColor
            } : {}}
          >
            Attive ({activeNotes.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveTab('archived')}
            style={activeTab === 'archived' ? {
              borderBottomColor: primaryColor,
              color: primaryColor
            } : {}}
          >
            Archiviate ({archivedNotes.length})
          </button>
        </div>

        {/* Action Bar */}
        {activeTab === 'active' && (
          <div className="customer-notes-panel-action-bar">
            <button
              className="btn-create-note"
              onClick={() => setShowCreateModal(true)}
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              <Plus size={18} /> Nuova Nota
            </button>
            <div className="notes-count">
              {activeNotes.length} nota{activeNotes.length !== 1 ? 'e' : ''}
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="customer-notes-panel-content">
          {activeTab === 'active' ? (
            // Card view for active notes
            displayNotes.length > 0 ? (
              displayNotes.map((note) => (
                <div
                  key={note.id}
                  className={`note-card ${note.status}`}
                  style={{ borderLeftColor: getPriorityColor(note.priority) }}
                >
                  <div className="note-card-header">
                    <div className="note-icon">{getPriorityIcon(note.priority)}</div>
                    <div className="note-info">
                      <h3>{note.title}</h3>
                      <div className="note-badges">
                        <span
                          className="priority-badge"
                          style={{ background: getPriorityColor(note.priority) }}
                        >
                          {getPriorityLabel(note.priority)}
                        </span>
                        {note.show_popup && (
                          <span className="popup-badge">POPUP</span>
                        )}
                        <span className="status-badge">{getStatusLabel(note.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="note-card-content">
                    <p>{note.content}</p>
                  </div>

                  <div className="note-card-footer">
                    <div className="note-meta">
                      <span className="note-author">
                        {note.created_by?.name || 'Staff'} • {new Date(note.created_at).toLocaleString('it-IT')}
                      </span>
                    </div>

                    <div className="note-actions">
                      {note.status === 'active' && onMarkAsRead && (
                        <button
                          className="action-btn read-btn"
                          onClick={() => onMarkAsRead(note.id)}
                          title="Segna come letta"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {onArchiveNote && (
                        <button
                          className="action-btn archive-btn"
                          onClick={() => onArchiveNote(note.id)}
                          title="Archivia"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      {onDeleteNote && (
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setDeleteConfirm({ show: true, noteId: note.id })}
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="notes-empty">
                <StickyNote size={64} style={{ opacity: 0.2 }} />
                <h3>Nessuna nota</h3>
                <p>Crea una nuova nota per questo cliente</p>
                <button
                  className="btn-create-empty"
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                  }}
                >
                  <Plus size={18} /> Crea Prima Nota
                </button>
              </div>
            )
          ) : (
            // Table view for archived notes
            displayNotes.length > 0 ? (
              <div className="notes-table-container">
                <table className="notes-table">
                  <thead>
                    <tr>
                      <th>Priorità</th>
                      <th>Titolo</th>
                      <th>Contenuto</th>
                      <th>Data</th>
                      <th>Creato da</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayNotes.map((note) => (
                      <tr key={note.id}>
                        <td>
                          <span
                            className="priority-badge-small"
                            style={{ background: getPriorityColor(note.priority) }}
                          >
                            {getPriorityLabel(note.priority)}
                          </span>
                        </td>
                        <td className="note-title-cell">{note.title}</td>
                        <td className="note-content-cell">{note.content}</td>
                        <td className="note-date-cell">
                          {new Date(note.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td>{note.created_by?.name || 'Staff'}</td>
                        <td>
                          <div className="table-actions">
                            {onDeleteNote && (
                              <button
                                className="action-btn delete-btn"
                                onClick={() => setDeleteConfirm({ show: true, noteId: note.id })}
                                title="Elimina"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="notes-empty">
                <Archive size={64} style={{ opacity: 0.2 }} />
                <h3>Nessuna nota archiviata</h3>
                <p>Le note archiviate appariranno qui</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateNote={onCreateNote}
        customerName={customerName}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        title="Elimina Nota"
        message="Sei sicuro di voler eliminare questa nota? Questa azione non può essere annullata."
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={() => deleteConfirm.noteId && handleDelete(deleteConfirm.noteId)}
        onCancel={() => setDeleteConfirm({ show: false, noteId: null })}
        type="danger"
      />
    </>
  );
};

export default CustomerNotesPanel;
