/**
 * Staff Notes Hub
 * Dashboard per gestire note generali tra operatori
 */

import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Archive, CheckCircle, AlertTriangle, Info, AlertCircle, Bell, Filter } from 'lucide-react';
import staffNotesService, { type StaffNote } from '../services/staffNotesService';
import CreateNotePage from './CreateNotePage';
import ConfirmModal from './UI/ConfirmModal';
import './StaffNotesHub.css';

interface StaffNotesHubProps {
  organizationId: string;
  onClose?: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

const StaffNotesHub: React.FC<StaffNotesHubProps> = ({
  organizationId,
  onClose,
  primaryColor = '#3b82f6',
  secondaryColor = '#2563eb'
}) => {
  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'read' | 'completed'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; noteId: string | null }>({ show: false, noteId: null });

  // Load notes
  const loadNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await staffNotesService.getGeneralNotes(organizationId);
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [organizationId]);

  // Create general note
  const handleCreateNote = async (noteData: {
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    show_popup: boolean;
    recipients?: {
      staff_ids?: string[];
      customer_ids?: string[];
      all_staff?: boolean;
    };
  }) => {
    try {
      await staffNotesService.createNote({
        organization_id: organizationId,
        note_type: 'general',
        title: noteData.title,
        content: noteData.content,
        priority: noteData.priority,
        show_popup: false, // General notes non hanno popup
        is_broadcast: noteData.recipients?.all_staff || false,
        recipients: noteData.recipients
      });

      await loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  // Mark as read
  const handleMarkAsRead = async (noteId: string) => {
    try {
      await staffNotesService.markAsRead(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark as completed
  const handleMarkAsCompleted = async (noteId: string) => {
    try {
      await staffNotesService.markAsCompleted(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  // Archive note
  const handleArchive = async (noteId: string) => {
    try {
      await staffNotesService.archiveNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  // Delete note
  const handleDelete = async (noteId: string) => {
    try {
      await staffNotesService.deleteNote(noteId);
      await loadNotes();
      setDeleteConfirm({ show: false, noteId: null });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

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

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (filterStatus === 'all') return note.status !== 'archived';
    return note.status === filterStatus;
  });

  return (
    <div className="staff-notes-hub">
      <div
        className="staff-notes-header"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          boxShadow: `0 8px 32px ${primaryColor}40, 0 4px 16px ${primaryColor}30`
        }}
      >
        <div className="staff-notes-header-left">
          <StickyNote size={28} color="white" />
          <div>
            <h1>Note Staff</h1>
            <p>Comunicazioni tra operatori</p>
          </div>
        </div>
        <button
          className="btn-create-note"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            color: 'white'
          }}
        >
          <Plus size={20} /> Nuova Nota
        </button>
      </div>

      {/* Filters */}
      <div className="staff-notes-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
          style={filterStatus === 'all' ? {
            background: `${primaryColor}15`,
            color: primaryColor,
            borderColor: primaryColor
          } : {}}
        >
          <Filter size={16} /> Tutte ({notes.filter(n => n.status !== 'archived').length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
          style={filterStatus === 'active' ? {
            background: `${primaryColor}15`,
            color: primaryColor,
            borderColor: primaryColor
          } : {}}
        >
          Attive ({notes.filter(n => n.status === 'active').length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'read' ? 'active' : ''}`}
          onClick={() => setFilterStatus('read')}
          style={filterStatus === 'read' ? {
            background: `${primaryColor}15`,
            color: primaryColor,
            borderColor: primaryColor
          } : {}}
        >
          Lette ({notes.filter(n => n.status === 'read').length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
          style={filterStatus === 'completed' ? {
            background: `${primaryColor}15`,
            color: primaryColor,
            borderColor: primaryColor
          } : {}}
        >
          Completate ({notes.filter(n => n.status === 'completed').length})
        </button>
      </div>

      {/* Notes List */}
      <div className="staff-notes-content">
        {loading ? (
          <div className="staff-notes-loading">Caricamento...</div>
        ) : filteredNotes.length > 0 ? (
          <div className="staff-notes-grid">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`staff-note-card ${note.status}`}
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
                    {note.status === 'active' && (
                      <button
                        className="action-btn read-btn"
                        onClick={() => handleMarkAsRead(note.id)}
                        title="Segna come letta"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {(note.status === 'active' || note.status === 'read') && (
                      <button
                        className="action-btn complete-btn"
                        onClick={() => handleMarkAsCompleted(note.id)}
                        title="Segna come completata"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn archive-btn"
                      onClick={() => handleArchive(note.id)}
                      title="Archivia"
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => setDeleteConfirm({ show: true, noteId: note.id })}
                      title="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="staff-notes-empty">
            <StickyNote size={64} style={{ opacity: 0.2 }} />
            <h2>Nessuna nota</h2>
            <p>Crea una nuova nota per iniziare</p>
          </div>
        )}
      </div>

      {/* Create Note Page */}
      {showCreateModal && (
        <CreateNotePage
          onClose={() => setShowCreateModal(false)}
          onCreateNote={handleCreateNote}
          organizationId={organizationId}
          showRecipients={true}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};

export default StaffNotesHub;
