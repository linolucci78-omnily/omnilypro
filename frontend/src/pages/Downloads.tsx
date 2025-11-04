import React from 'react'
import { Download, MonitorSmartphone, Apple, Monitor } from 'lucide-react'
import './Downloads.css'

const Downloads: React.FC = () => {
  const macDownloadUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/downloads/OMNILY-Setup-Tool-Mac.dmg'
  const winDownloadUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/downloads/OMNILY-Setup-Tool-Windows.exe'

  return (
    <div className="downloads-page">
      <div className="downloads-header">
        <div className="header-icon">
          <MonitorSmartphone size={48} />
        </div>
        <h1>OMNILY Device Setup Tool</h1>
        <p>Configura dispositivi POS in pochi click</p>
      </div>

      <div className="downloads-grid">
        {/* Mac Download Card */}
        <div className="download-card">
          <div className="card-icon mac">
            <Apple size={64} />
          </div>
          <h2>macOS</h2>
          <p className="version">Versione 1.0.0</p>
          <p className="size">~ 112 MB</p>
          <a
            href={macDownloadUrl}
            className="download-button mac"
            download="OMNILY-Setup-Tool-Mac.dmg"
          >
            <Download size={20} />
            Scarica per Mac
          </a>
          <div className="requirements">
            <p><strong>Requisiti:</strong></p>
            <ul>
              <li>macOS 10.13 o successivo</li>
              <li>Apple Silicon (M1/M2/M3) o Intel</li>
            </ul>
          </div>
        </div>

        {/* Windows Download Card */}
        <div className="download-card">
          <div className="card-icon windows">
            <Monitor size={64} />
          </div>
          <h2>Windows</h2>
          <p className="version">Versione 1.0.0</p>
          <p className="size">~ 99 MB</p>
          <a
            href={winDownloadUrl}
            className="download-button windows"
            download="OMNILY-Setup-Tool-Windows.exe"
          >
            <Download size={20} />
            Scarica per Windows
          </a>
          <div className="requirements">
            <p><strong>Requisiti:</strong></p>
            <ul>
              <li>Windows 10 o successivo</li>
              <li>x64 o ARM64</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="setup-guide">
        <h2>📖 Guida Rapida</h2>
        <div className="guide-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Scarica il file</h3>
              <p>Scegli la versione per il tuo sistema operativo (Mac o Windows)</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Installa l'applicazione</h3>
              <p><strong>Mac:</strong> Apri il file .dmg e trascina l'app in Applicazioni<br/>
              <strong>Windows:</strong> Esegui il file .exe per installare</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Prepara il POS</h3>
              <p>
                • Factory Reset completato<br/>
                • Debug USB abilitato<br/>
                • Hub Management disattivato (impostazioni)<br/>
                • Nessun account Google
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Collega e configura</h3>
              <p>Collega il POS via USB e segui le istruzioni nell'applicazione</p>
            </div>
          </div>
        </div>
      </div>

      <div className="warning-box">
        <h3>⚠️ Importante</h3>
        <ul>
          <li>Il POS deve essere in <strong>Factory Reset</strong> prima di iniziare</li>
          <li><strong>NON aggiungere</strong> account Google al dispositivo</li>
          <li>Disattiva <strong>Hub Management</strong> nelle impostazioni del POS</li>
          <li>Il cavo USB deve essere collegato durante tutto il processo</li>
        </ul>
      </div>
    </div>
  )
}

export default Downloads
