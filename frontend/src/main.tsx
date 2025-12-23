import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/design-system.css'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary'
import './global-fixes.css' // IMPORTANT: Load last to override all component styles

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
// Force rebuild - Fix back-button global styles - 2025-12-20
