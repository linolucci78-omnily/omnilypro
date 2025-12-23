import { useEffect } from 'react';

/**
 * GlobalStylesFix - Inietta stili critici direttamente nel DOM
 * Questo componente aggiunge uno style tag all'head per sovrascrivere
 * TUTTI gli stili dei .back-button con massima priorità
 */
const GlobalStylesFix = () => {
  useEffect(() => {
    // Crea uno style element
    const styleId = 'global-back-button-fix';

    // Rimuovi style esistente se presente
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Crea nuovo style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* GLOBAL BACK BUTTON FIX - Injected via GlobalStylesFix component */
      /* Maximum specificity + !important to override ALL component styles */

      button.back-button,
      a.back-button,
      .back-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 0.75rem !important;
        padding: 1rem 1.75rem !important;
        background: white !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 12px !important;
        color: var(--primary-color, #8b5cf6) !important;
        font-size: 1rem !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        margin: 1.5rem 0 1.5rem 1.5rem !important;
        line-height: 1.5 !important;
        text-decoration: none !important;
        width: auto !important;
        min-width: auto !important;
        min-height: 48px !important;
        height: auto !important;
        white-space: nowrap !important;
        overflow: visible !important;
        vertical-align: middle !important;
        box-sizing: border-box !important;
        flex-shrink: 0 !important;
      }

      button.back-button:hover,
      a.back-button:hover,
      .back-button:hover {
        border-color: var(--primary-color, #8b5cf6) !important;
        background: #faf5ff !important;
        transform: translateX(-4px) !important;
      }

      /* Assicura che icone e testo dentro il pulsante siano visibili */
      button.back-button > *,
      a.back-button > *,
      .back-button > * {
        display: inline-flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
      }

      button.back-button svg,
      a.back-button svg,
      .back-button svg {
        width: 20px !important;
        height: 20px !important;
        flex-shrink: 0 !important;
      }

      button.back-button span,
      a.back-button span,
      .back-button span {
        line-height: 1.5 !important;
        white-space: nowrap !important;
      }

      /* Back buttons in colored headers */
      .referral-header button.back-button,
      .referral-header a.back-button,
      .referral-header .back-button,
      .loyalty-header button.back-button,
      .loyalty-header a.back-button,
      .loyalty-header .back-button,
      .loyalty-system-header button.back-button,
      .loyalty-system-header a.back-button,
      .loyalty-system-header .back-button,
      .wallet-header button.back-button,
      .wallet-header a.back-button,
      .wallet-header .back-button,
      .hub-header button.back-button,
      .hub-header a.back-button,
      .hub-header .back-button,
      .business-details-header button.back-button,
      .business-details-header a.back-button,
      .business-details-header .back-button,
      .gc-settings-header button.back-button,
      .gc-settings-header a.back-button,
      .gc-settings-header .back-button,
      .loyalty-tiers-header button.back-button,
      .loyalty-tiers-header a.back-button,
      .loyalty-tiers-header .back-button,
      [class*="-header"] button.back-button,
      [class*="-header"] a.back-button,
      [class*="-header"] .back-button {
        background: rgba(255, 255, 255, 0.2) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        color: white !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        padding: 1rem 1.75rem !important;
        gap: 0.75rem !important;
        font-size: 1rem !important;
        width: auto !important;
        min-width: auto !important;
        min-height: 48px !important;
        height: auto !important;
        justify-content: flex-start !important;
        white-space: nowrap !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
      }

      .referral-header button.back-button:hover,
      .referral-header a.back-button:hover,
      .referral-header .back-button:hover,
      .loyalty-header button.back-button:hover,
      .loyalty-header a.back-button:hover,
      .loyalty-header .back-button:hover,
      .loyalty-system-header button.back-button:hover,
      .loyalty-system-header a.back-button:hover,
      .loyalty-system-header .back-button:hover,
      .wallet-header button.back-button:hover,
      .wallet-header a.back-button:hover,
      .wallet-header .back-button:hover,
      .hub-header button.back-button:hover,
      .hub-header a.back-button:hover,
      .hub-header .back-button:hover,
      .business-details-header button.back-button:hover,
      .business-details-header a.back-button:hover,
      .business-details-header .back-button:hover,
      .gc-settings-header button.back-button:hover,
      .gc-settings-header a.back-button:hover,
      .gc-settings-header .back-button:hover,
      .loyalty-tiers-header button.back-button:hover,
      .loyalty-tiers-header a.back-button:hover,
      .loyalty-tiers-header .back-button:hover,
      [class*="-header"] button.back-button:hover,
      [class*="-header"] a.back-button:hover,
      [class*="-header"] .back-button:hover {
        background: rgba(255, 255, 255, 0.3) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
    `;

    // Aggiungi allo head come ultimo elemento
    document.head.appendChild(style);

    console.log('✅ GlobalStylesFix v4: Back button auto-width to fit text perfectly');

    // Cleanup quando il componente viene smontato
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  return null; // Questo componente non renderizza nulla
};

export default GlobalStylesFix;
