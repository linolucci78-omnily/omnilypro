import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MdLogout, MdNotifications } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import staffNotesService from '../../services/staffNotesService';
import ConfirmModal from '../UI/ConfirmModal';
import './POSHeader.css';

interface POSHeaderProps {
  onMenuToggle: () => void;
  organizationId?: string;
}

const POSHeader: React.FC<POSHeaderProps> = ({ onMenuToggle, organizationId }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadNotesCount, setUnreadNotesCount] = useState(0);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMenuToggle();
  };

  const handleQuickLogout = () => {
    console.log('🚪 LOGOUT HEADER CLICKED!');
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      console.log('🚪 POS Header Logout - Starting...');
      // IMPORTANTE: Imposta flag POS prima del signOut
      // ProtectedRoute lo leggerà e farà redirect automatico a /login?posomnily=true
      localStorage.setItem('pos-mode', 'true');

      // SignOut: ProtectedRoute intercetterà e farà redirect automatico al POS
      await signOut();
      console.log('🚪 SignOut completato - ProtectedRoute gestirà il redirect');
    } catch (error) {
      console.error('❌ Errore logout:', error);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Load unread notes count for this staff member
  useEffect(() => {
    const loadUnreadNotes = async () => {
      if (!user?.id || !organizationId) return;

      try {
        // Get notes for this staff member that haven't been read
        const notes = await staffNotesService.getNotesForStaff(user.id, organizationId);

        // Count unread notes (status = 'active' and not read by this user)
        const unreadCount = notes.filter(note => note.status === 'active').length;
        setUnreadNotesCount(unreadCount);
      } catch (error) {
        console.error('Error loading unread notes:', error);
      }
    };

    loadUnreadNotes();

    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadNotes, 30000);
    return () => clearInterval(interval);
  }, [user?.id, organizationId]);

  const handleNotificationsClick = () => {
    // Navigate to chat/notes section
    navigate('/pos?section=chat');
  };

  return (
    <header className="pos-header">
      {/* Hamburger Menu Button */}
      <button
        className="pos-hamburger-btn"
        onClick={handleMenuToggle}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMenuToggle(e as any);
        }}
        aria-label="Apri menu"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      {/* Logo */}
      <div className="pos-header-logo">
        <img
          src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
          alt="OMNILY PRO"
        />
      </div>

      {/* Notifications Bell */}
      <button
        className="pos-notifications-btn"
        onClick={handleNotificationsClick}
        title="Note Staff"
      >
        <MdNotifications size={28} />
        {unreadNotesCount > 0 && (
          <span className="pos-notifications-badge">{unreadNotesCount}</span>
        )}
      </button>

      {/* User Info + Quick Logout */}
      <div className="pos-header-user">
        <div className="pos-user-info">
          <span className="pos-user-name">
            {user?.user_metadata?.full_name ||
             localStorage.getItem('staffName') ||
             user?.email?.split('@')[0] ||
             'Operatore'}
          </span>
          <span className="pos-user-status">🟢 Online</span>
        </div>
        <button
          className="pos-quick-logout-posheader pos-quick-logout"
          onClick={handleQuickLogout}
          title="Logout rapido"
        >
          <MdLogout size={36} />
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Conferma Logout"
        message="Sei sicuro di voler uscire dal sistema POS?"
        confirmText="Esci"
        cancelText="Annulla"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        type="danger"
      />
    </header>
  );
};

export default POSHeader;