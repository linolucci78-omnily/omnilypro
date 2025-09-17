import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Rileva automaticamente modalità POS dai parametri URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('pos') === 'true') {
  document.body.classList.add('pos-mode');
  console.log('POS mode activated for device:', urlParams.get('device') || 'unknown');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
