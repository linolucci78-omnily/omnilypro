/**
 * Customer Note Popup
 * Mostra popup automatico quando si apre un cliente con note non lette
 */

import React, { useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';
import { StaffNote } from '../services/staffNotesService';
import './CustomerNotePopup.css';

interface CustomerNotePopupProps {
  notes: StaffNote[];
  onClose: () => void;
  onMarkShown: (noteId: string) => void;
}

const CustomerNotePopup: React.FC<CustomerNotePopupProps> = ({ notes, onClose, onMarkShown }) => {
  // NON marchiamo più le note come shown automaticamente
  // Il popup continuerà a comparire finché la nota non viene segnata come letta nel pannello Note

  if (notes.length === 0) return null;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle size={24} color="#ef4444" />;
      case 'high':
        return <AlertCircle size={24} color="#f59e0b" />;
      case 'normal':
        return <Info size={24} color="#3b82f6" />;
      case 'low':
        return <Bell size={24} color="#6b7280" />;
      default:
        return <Info size={24} color="#3b82f6" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'normal':
        return '#3b82f6';
      case 'low':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'URGENTE';
      case 'high':
        return 'Alta';
      case 'normal':
        return 'Normale';
      case 'low':
        return 'Bassa';
      default:
        return 'Normale';
    }
  };

  return (
    <div className="customer-note-popup-overlay">
      <div className="customer-note-popup">
        <div className="customer-note-popup-header">
          <h2>
            <Bell size={24} />
            Note Importanti
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="customer-note-popup-content">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`note-card note-priority-${note.priority}`}
              style={{ borderLeftColor: getPriorityColor(note.priority) }}
            >
              <div className="note-card-header">
                <div className="note-icon">{getPriorityIcon(note.priority)}</div>
                <div className="note-info">
                  <h3>{note.title}</h3>
                  <span className="note-priority-badge" style={{ background: getPriorityColor(note.priority) }}>
                    {getPriorityLabel(note.priority)}
                  </span>
                </div>
              </div>

              <div className="note-card-content">
                <p>{note.content}</p>
              </div>

              {note.created_by && (
                <div className="note-card-footer">
                  <span className="note-author">
                    {note.created_by.name} • {new Date(note.created_at).toLocaleString('it-IT')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="customer-note-popup-footer">
          <button className="btn-primary" onClick={onClose}>
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerNotePopup;
