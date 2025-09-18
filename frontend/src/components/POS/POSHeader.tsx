import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './POSHeader.css';

interface POSHeaderProps {
  onMenuToggle: () => void;
}

const POSHeader: React.FC<POSHeaderProps> = ({ onMenuToggle }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleMenuToggle = () => {
    console.log('🍔 Hamburger clicked!'); // Debug
    onMenuToggle();
  };

  const handleQuickLogout = async () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      try {
        await signOut();
        navigate('/?posomnily=true');
      } catch (error) {
        console.error('Errore logout:', error);
      }
    }
  };

  return (
    <header className="pos-header">
      {/* Hamburger Menu Button */}
      <button
        className="pos-hamburger-btn"
        onClick={handleMenuToggle}
        onTouchEnd={handleMenuToggle}
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
←
        </button>
      </div>
    </header>
  );
};

export default POSHeader;