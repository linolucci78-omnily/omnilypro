import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MdLogout } from 'react-icons/md';
import ConfirmModal from '../UI/ConfirmModal';
import './POSHeader.css';

interface POSHeaderProps {
  onMenuToggle: () => void;
}

const POSHeader: React.FC<POSHeaderProps> = ({ onMenuToggle }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      // IMPORTANTE: Navigate PRIMA del signOut per evitare flash della pagina desktop
      // L'utente vede subito la pagina login POS, poi facciamo signOut in background
      localStorage.setItem('pos-mode', 'true');
      navigate('/login?posomnily=true', { replace: true });

      // SignOut DOPO il navigate (in background, l'utente è già sulla pagina giusta)
      await signOut();
      console.log('🚪 SignOut completato');
    } catch (error) {
      console.error('❌ Errore logout:', error);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
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


      {/* User Info + Quick Logout */}
      <div className="pos-header-user">
        <div className="pos-user-info">
          <span className="pos-user-name">{user?.email?.split('@')[0]}</span>
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