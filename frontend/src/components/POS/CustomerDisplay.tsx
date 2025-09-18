import React, { useState, useEffect } from 'react';
import './CustomerDisplay.css';

interface Transaction {
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  points: number;
  customerName?: string;
}

const CustomerDisplay: React.FC = () => {
  const [transaction, setTransaction] = useState<Transaction>({
    items: [],
    total: 0,
    points: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for updates from main POS screen
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TRANSACTION_UPDATE') {
        setTransaction(event.data.transaction);
      }
      if (event.data.type === 'PROCESSING_START') {
        setIsProcessing(true);
      }
      if (event.data.type === 'PROCESSING_END') {
        setIsProcessing(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Demo data for testing
  useEffect(() => {
    // Simulate some demo data
    setTimeout(() => {
      setTransaction({
        items: [
          { name: 'Cappuccino', price: 2.50, quantity: 1 },
          { name: 'Cornetto', price: 1.80, quantity: 2 }
        ],
        total: 6.10,
        points: 61,
        customerName: 'Mario Rossi'
      });
    }, 2000);
  }, []);

  return (
    <div className="customer-display">
      {/* Header */}
      <header className="cd-header">
        <img
          src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
          alt="OMNILY PRO"
          className="cd-logo"
        />
        <div className="cd-time">
          {currentTime.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="cd-main">
        {isProcessing ? (
          // Processing State
          <div className="cd-processing">
            <div className="cd-spinner"></div>
            <h2>Elaborazione in corso...</h2>
            <p>Attendere prego</p>
          </div>
        ) : (
          <>
            {/* Welcome Message */}
            <div className="cd-welcome">
              <h1>Benvenuto{transaction.customerName ? ` ${transaction.customerName}` : ''}!</h1>
              <p>Il tuo ordine</p>
            </div>

            {/* Items List */}
            {transaction.items.length > 0 && (
              <div className="cd-items">
                {transaction.items.map((item, index) => (
                  <div key={index} className="cd-item">
                    <div className="cd-item-info">
                      <span className="cd-item-name">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="cd-item-qty">x{item.quantity}</span>
                      )}
                    </div>
                    <div className="cd-item-price">
                      €{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="cd-total">
              <div className="cd-total-label">TOTALE</div>
              <div className="cd-total-amount">€{transaction.total.toFixed(2)}</div>
            </div>

            {/* Loyalty Points */}
            {transaction.points > 0 && (
              <div className="cd-loyalty">
                <div className="cd-points">
                  <span className="cd-points-icon">🎯</span>
                  <span className="cd-points-text">
                    Hai guadagnato <strong>{transaction.points} punti!</strong>
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="cd-footer">
        <p>Grazie per aver scelto OMNILY PRO</p>
        <div className="cd-promo">
          ✨ Accumula punti ad ogni acquisto!
        </div>
      </footer>
    </div>
  );
};

export default CustomerDisplay;