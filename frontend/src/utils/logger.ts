/**
 * Sistema di logging intelligente per OmnilyPro
 *
 * In sviluppo: mostra tutti i log
 * In produzione: mostra solo errori critici (a meno che DEBUG mode sia attivo)
 *
 * Per attivare debug mode in produzione:
 * localStorage.setItem('OMNILY_DEBUG', 'true')
 */

const isDevelopment = import.meta.env.DEV;
const isDebugMode = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('OMNILY_DEBUG') === 'true';
};

export const logger = {
  /**
   * Log generale - Mostrato solo in sviluppo o se DEBUG mode attivo
   */
  log: (...args: any[]) => {
    if (isDevelopment || isDebugMode()) {
      console.log(...args);
    }
  },

  /**
   * Info - Mostrato solo in sviluppo o se DEBUG mode attivo
   */
  info: (...args: any[]) => {
    if (isDevelopment || isDebugMode()) {
      console.info(...args);
    }
  },

  /**
   * Warning - Sempre mostrato (anche in produzione)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Errori - SEMPRE mostrati (critico per debugging)
   */
  error: (...args: any[]) => {
    console.error(...args);

    // In produzione, potresti anche inviare errori a un servizio tipo Sentry
    if (!isDevelopment) {
      // TODO: Integrazione Sentry o altro error tracking
      // Sentry.captureException(args[0]);
    }
  },

  /**
   * Debug dettagliato - Mostrato solo in sviluppo o se DEBUG mode attivo
   */
  debug: (...args: any[]) => {
    if (isDevelopment || isDebugMode()) {
      console.debug(...args);
    }
  },

  /**
   * Tabelle - Mostrate solo in sviluppo o se DEBUG mode attivo
   */
  table: (data: any) => {
    if (isDevelopment || isDebugMode()) {
      console.table(data);
    }
  },

  /**
   * Gruppi - Mostrati solo in sviluppo o se DEBUG mode attivo
   */
  group: (label: string) => {
    if (isDevelopment || isDebugMode()) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment || isDebugMode()) {
      console.groupEnd();
    }
  },

  /**
   * Attiva debug mode in produzione (richiede password)
   * Password: omnily2025debug
   */
  enableDebug: (password?: string) => {
    if (typeof window === 'undefined') return;

    // Password segreta per attivare debug mode
    const SECRET_PASSWORD = 'omnily2025debug';

    if (!password) {
      console.log('🔒 Debug mode protetto. Usa: enableDebug("password")');
      return;
    }

    if (password !== SECRET_PASSWORD) {
      console.error('❌ Password errata!');
      return;
    }

    localStorage.setItem('OMNILY_DEBUG', 'true');
    console.log('🔍 Debug mode ATTIVATO - Ricarica la pagina per vedere tutti i log');
  },

  /**
   * Disattiva debug mode
   */
  disableDebug: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('OMNILY_DEBUG');
      console.log('🔇 Debug mode DISATTIVATO - Ricarica la pagina');
    }
  }
};

// Esponi funzioni globali per debug in produzione
if (typeof window !== 'undefined') {
  (window as any).enableDebug = logger.enableDebug;
  (window as any).disableDebug = logger.disableDebug;
}

// Esempio di utilizzo:
// import { logger } from '@/utils/logger'
//
// logger.log('Questo si vede solo in dev o con debug attivo')
// logger.error('Questo si vede SEMPRE - è un errore critico!')
// logger.warn('Questo si vede SEMPRE - è un warning importante')
//
// In produzione, per vedere tutti i log:
// 1. Apri console
// 2. Scrivi: enableDebug()
// 3. Ricarica pagina
// 4. Ora vedi tutti i log!
