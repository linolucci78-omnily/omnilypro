import React from 'react';

const CustomerDisplay: React.FC = () => {

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '1rem' }}>
        🖥️ CUSTOMER DISPLAY
      </h1>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <img
          src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
          alt="OMNILY PRO"
          style={{ height: '60px', marginBottom: '1rem' }}
        />
        <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Benvenuto!</h2>
        <p style={{ color: '#6b7280', fontSize: '1.2rem', margin: 0 }}>
          Customer Display 4" Funzionante ✅
        </p>
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#ef4444',
          color: 'white',
          borderRadius: '8px',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          TOTALE: €6.10
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;