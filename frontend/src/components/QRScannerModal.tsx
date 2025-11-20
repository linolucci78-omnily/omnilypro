import React, { useEffect, useState } from 'react';
import { X, Camera } from 'lucide-react';
import './QRScannerModal.css';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (rewardId: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) {
      // Cancel scanner when modal closes
      if (isScanning && typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        const bridge = (window as any).OmnilyPOS;
        if (bridge.cancelQRScanner) {
          bridge.cancelQRScanner();
        }
      }
      setIsScanning(false);
      setScanStatus('idle');
      setError('');
      return;
    }

    // Setup global callback for QR scan result
    (window as any).omnilyRewardQRResultHandler = (result: any) => {
      console.log('✅ QR Code scansionato tramite bridge:', result);

      // Il bridge Android passa un oggetto, non una stringa!
      // Estrai il contenuto dal campo 'content' o 'qrCode'
      let qrData: string;
      if (typeof result === 'string') {
        qrData = result;
      } else if (result && result.content) {
        qrData = result.content;
      } else if (result && result.qrCode) {
        qrData = result.qrCode;
      } else {
        console.error('❌ Formato risultato bridge non riconosciuto:', result);
        setError('Formato QR code non valido');
        setScanStatus('error');
        return;
      }

      console.log('📦 QR Data estratto:', qrData);

      try {
        const data = JSON.parse(qrData);
        if (data.redemptionId) {
          onScanSuccess(data.redemptionId);
        } else if (data.rewardId) {
          onScanSuccess(data.rewardId);
        } else if (data.type === 'use_reward' && data.redemptionId) {
          onScanSuccess(data.redemptionId);
        } else {
          onScanSuccess(qrData);
        }
      } catch {
        // Se non è JSON, usa il testo come ID
        onScanSuccess(qrData);
      }

      setScanStatus('success');
      setIsScanning(false);
      onClose();
    };

    // Start scanner using Android bridge
    const startScanner = () => {
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        const bridge = (window as any).OmnilyPOS;

        if (bridge.readQRCode) {
          console.log('📱 Avvio scanner QR tramite bridge Android...');
          setScanStatus('scanning');
          setIsScanning(true);
          setError('');
          bridge.readQRCode('omnilyRewardQRResultHandler');
        } else {
          console.error('❌ readQRCode non disponibile nel bridge');
          setError('Scanner QR non disponibile su questo dispositivo.');
          setScanStatus('error');
        }
      } else {
        console.error('❌ Bridge Android non disponibile');
        setError('Funzionalità disponibile solo su dispositivo POS Android.');
        setScanStatus('error');
      }
    };

    startScanner();

    return () => {
      // Cleanup
      delete (window as any).omnilyRewardQRResultHandler;
    };
  }, [isOpen, onClose, onScanSuccess]);

  const handleSimulateScan = () => {
    // Funzione demo per simulare scansione
    const demoRewardId = '90be5608-863d-4537-a8d6-11d7ab4b404e'; // ID di un premio di esempio
    onScanSuccess(demoRewardId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="qr-scanner-backdrop" onClick={onClose} />
      <div className="qr-scanner-modal">
        <button className="qr-scanner-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="qr-scanner-title">Inquadra il QR Code del premio</h2>

        <div className="qr-scanner-container">
          {scanStatus === 'scanning' && !error && (
            <div className="qr-scanner-active">
              <Camera size={80} strokeWidth={1.5} />
              <p className="qr-scanner-status">Fotocamera attiva...</p>
              <p className="qr-scanner-substatus">Inquadra il QR code del premio</p>
            </div>
          )}

          {scanStatus === 'idle' && !error && (
            <div className="qr-scanner-idle">
              <Camera size={64} strokeWidth={1.5} />
              <p>Inizializzazione scanner...</p>
            </div>
          )}

          {error && (
            <div className="qr-scanner-error">
              {error}
            </div>
          )}
        </div>

        <p className="qr-scanner-instructions">
          {scanStatus === 'scanning'
            ? 'Posiziona il QR code all\'interno del mirino della fotocamera del dispositivo.'
            : 'Attendi che la fotocamera si attivi...'}
        </p>

        {/* Demo button - only in development */}
        {import.meta.env.DEV && (
          <button
            className="qr-scanner-demo-btn"
            onClick={handleSimulateScan}
          >
            [DEMO] Simula Scansione
          </button>
        )}
      </div>
    </>
  );
};

export default QRScannerModal;
