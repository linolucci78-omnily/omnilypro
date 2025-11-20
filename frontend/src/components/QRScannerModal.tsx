import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner when modal closes
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          setIsScanning(false);
        }).catch(console.error);
      }
      return;
    }

    // Start scanner when modal opens
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Successfully scanned QR code
            console.log('QR Code scansionato:', decodedText);

            // Extract reward ID from QR code
            // Assumiamo che il QR contenga solo l'ID del premio o un JSON
            try {
              const data = JSON.parse(decodedText);
              if (data.rewardId) {
                onScanSuccess(data.rewardId);
              } else {
                onScanSuccess(decodedText); // Fallback to raw text
              }
            } catch {
              // Se non è JSON, usa il testo come ID
              onScanSuccess(decodedText);
            }

            // Stop scanner after successful scan
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
              setIsScanning(false);
              onClose();
            }).catch(console.error);
          },
          (errorMessage) => {
            // Handle scan error (can be ignored for continuous scanning)
          }
        );

        setIsScanning(true);
        setError('');
      } catch (err: any) {
        console.error('Errore avvio scanner:', err);
        setError('Impossibile accedere alla fotocamera. Verifica i permessi.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
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
          <div id="qr-reader" className="qr-reader"></div>
          {error && (
            <div className="qr-scanner-error">
              {error}
            </div>
          )}
        </div>

        <p className="qr-scanner-instructions">
          Posiziona il codice all'interno del riquadro per riscattare automaticamente il premio.
        </p>

        {/* Demo button - only in development */}
        {import.meta.env.DEV && (
          <button
            className="qr-scanner-demo-btn"
            onClick={handleSimulateScan}
          >
            [DEMO] Simula Scansione "Caffè"
          </button>
        )}
      </div>
    </>
  );
};

export default QRScannerModal;
