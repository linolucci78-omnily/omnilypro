import React, { useState } from 'react'
import { X, Monitor, Smartphone, Link as LinkIcon, Copy, Share2, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import './DisplayOptionsModal.css'

interface DisplayOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
  primaryColor: string
  secondaryColor: string
}

export const DisplayOptionsModal: React.FC<DisplayOptionsModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
  primaryColor,
  secondaryColor
}) => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTvModal, setShowTvModal] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Get current URL base
  const baseUrl = window.location.origin
  const displayUrl = `${baseUrl}/lottery/display/${eventId}`

  // Get local IP (questo sarà approssimativo, in produzione potresti volerlo dal backend)
  const localIp = window.location.hostname

  const handleOpenLocal = () => {
    window.open(displayUrl, 'LotteryDisplay', 'fullscreen=yes,width=1920,height=1080')
    onClose()
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Display Lotteria - ${eventName}`,
          text: `Apri questo link per visualizzare il display della lotteria "${eventName}"`,
          url: displayUrl
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink(displayUrl)
    }
  }

  return (
    <>
      {/* Main options modal - hide when sub-modal is open */}
      {!showShareModal && !showTvModal && (
        <div className="display-options-overlay" onClick={onClose}>
          <div className="display-options-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="display-options-close">
          <X size={24} />
        </button>

        <div className="display-options-header">
          <Monitor size={32} style={{ color: primaryColor }} />
          <h2>Gestione Display</h2>
          <p className="display-options-subtitle">Scegli come aprire il display per "{eventName}"</p>
        </div>

        <div className="display-options-grid">
          {/* Option 1: Open locally */}
          <button
            className="display-option-card"
            onClick={handleOpenLocal}
            style={{ borderColor: `${primaryColor}40` }}
          >
            <div className="display-option-icon" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              <Monitor size={32} />
            </div>
            <h3>Apri qui</h3>
            <p>Apre il display su questo dispositivo in una nuova finestra</p>
            <div className="display-option-badge">Stesso dispositivo</div>
          </button>

          {/* Option 2: Share link with QR */}
          <button
            className="display-option-card"
            onClick={() => {
              setShowShareModal(true)
            }}
            style={{ borderColor: `${secondaryColor}40` }}
          >
            <div className="display-option-icon" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Smartphone size={32} />
            </div>
            <h3>Condividi link</h3>
            <p>Mostra QR code e link da condividere con altri dispositivi</p>
            <div className="display-option-badge">QR + Link</div>
          </button>

          {/* Option 3: TV/PC direct link */}
          <button
            className="display-option-card"
            onClick={() => {
              setShowTvModal(true)
            }}
            style={{ borderColor: `${primaryColor}60` }}
          >
            <div className="display-option-icon" style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}>
              <LinkIcon size={32} />
            </div>
            <h3>Link diretto TV/PC</h3>
            <p>Istruzioni per aprire il display su computer o TV</p>
            <div className="display-option-badge">Setup permanente</div>
          </button>
        </div>
      </div>
        </div>
      )}

      {/* Share Modal with QR Code */}
      {showShareModal && (
        <div className="display-share-overlay" onClick={() => setShowShareModal(false)}>
          <div className="display-share-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowShareModal(false)} className="display-options-close">
              <X size={24} />
            </button>

            <div className="display-share-header">
              <Smartphone size={32} style={{ color: secondaryColor }} />
              <h2>Condividi Display</h2>
            </div>

            <div className="display-share-content">
              <p className="display-share-instruction">Scansiona con smartphone o tablet:</p>

              <div className="qr-code-container">
                <QRCodeSVG
                  value={displayUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                />
              </div>

              <p className="display-share-instruction">Oppure copia il link:</p>

              <div className="display-url-box">
                <code>{displayUrl}</code>
              </div>

              <div className="display-share-actions">
                <button
                  className="btn-copy"
                  onClick={() => handleCopyLink(displayUrl)}
                  style={{ backgroundColor: copied ? '#10b981' : primaryColor }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copiato!' : 'Copia Link'}
                </button>

                {navigator.share && (
                  <button
                    className="btn-share"
                    onClick={handleShare}
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <Share2 size={18} />
                    Condividi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TV/PC Instructions Modal */}
      {showTvModal && (
        <div className="display-share-overlay" onClick={() => setShowTvModal(false)}>
          <div className="display-share-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTvModal(false)} className="display-options-close">
              <X size={24} />
            </button>

            <div className="display-share-header">
              <Monitor size={32} style={{ color: primaryColor }} />
              <h2>Apri su TV/PC</h2>
            </div>

            <div className="display-tv-content">
              <div className="tv-instruction-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Apri il browser sul TV/PC</h3>
                  <p>Apri Chrome, Firefox, Edge o Safari</p>
                </div>
              </div>

              <div className="tv-instruction-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Vai all'indirizzo:</h3>
                  <div className="display-url-box large">
                    <code>{displayUrl}</code>
                  </div>
                  <button
                    className="btn-copy-inline"
                    onClick={() => handleCopyLink(displayUrl)}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiato!' : 'Copia'}
                  </button>
                </div>
              </div>

              <div className="tv-instruction-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Il display si aprirà automaticamente</h3>
                  <p>Vedrai il display dell'evento:</p>
                  <div className="event-name-highlight" style={{ borderColor: primaryColor, color: primaryColor }}>
                    📺 {eventName}
                  </div>
                </div>
              </div>

              <div className="tv-instruction-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Controllo remoto</h3>
                  <p>Una volta aperto il display, potrai controllarlo da questo telecomando!</p>
                </div>
              </div>

              <div className="tv-alternative">
                <p><strong>Link diretto (opzionale):</strong></p>
                <div className="display-url-box">
                  <code style={{ fontSize: '0.8rem' }}>{displayUrl}</code>
                </div>
                <button
                  className="btn-copy-inline"
                  onClick={() => handleCopyLink(displayUrl)}
                  style={{ marginTop: '0.5rem' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiato!' : 'Copia link diretto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
