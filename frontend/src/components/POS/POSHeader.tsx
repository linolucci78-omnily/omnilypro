import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdLogout } from 'react-icons/md';
import './POSHeader.css';

interface POSHeaderProps {
  onMenuToggle: () => void;
}

const POSHeader: React.FC<POSHeaderProps> = ({ onMenuToggle }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMenuToggle();
  };

  const handleQuickLogout = async () => {
    console.log('🚪 LOGOUT HEADER CLICKED!');
    if (confirm('Sei sicuro di voler uscire?')) {
      try {
        console.log('🚪 Setting POS mode flag...');
        localStorage.setItem('pos-mode', 'true');
        console.log('🚪 Calling signOut...');
        await signOut();
        console.log('🚪 SignOut success');
      } catch (error) {
        console.error('❌ Errore logout:', error);
      }
    }
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
          className="pos-quick-logout"
          onClick={handleQuickLogout}
          title="Logout rapido"
        >
          <MdLogout size={20} />
        </button>
      </div>
    </header>
  );
};

export default POSHeader;