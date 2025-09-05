import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Supabase handles the session from the magic link.
  // We just need to provide the new password.

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setMessage('Password aggiornata con successo! Ora puoi effettuare il login.');
      setTimeout(() => navigate('/login'), 3000);

    } catch (error) {
      setError(`Errore nell'aggiornamento della password: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Crea una nuova password</h1>
          <p>Inserisci la tua nuova password di seguito.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Nuova Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua nuova password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading || !!message}
          >
            {loading ? '🔄 Salvataggio...' : 'Salva Nuova Password'}
          </button>

          {error && (
            <div className="auth-message error">
              <p>❌ {error}</p>
            </div>
          )}

          {message && (
            <div className="auth-message success">
              <p>✅ {message}</p>
              <p><Link to="/login">Vai al Login</Link></p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
