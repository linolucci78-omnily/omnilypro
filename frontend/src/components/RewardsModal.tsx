import React, { useState, useEffect } from 'react';
import { X, Gift, Clock, Heart, Lock, QrCode, Sparkles, CheckCircle } from 'lucide-react';
import { rewardsService, type Reward } from '../services/rewardsService';
import ConfirmRedeemModal from './ConfirmRedeemModal';
import Toast, { ToastType } from './Toast';
import './RewardsModal.css';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  organizationId: string;
  pointsName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  onCustomerUpdate?: () => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  customer,
  organizationId,
  pointsName = 'Punti',
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444',
  onCustomerUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'redeem' | 'redeemed'>('redeem');
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [currentPoints, setCurrentPoints] = useState(customer.points); // Punti locali aggiornabili
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Sincronizza i punti locali quando cambiano nella prop
  useEffect(() => {
    setCurrentPoints(customer.points);
  }, [customer.points]);

  // Calcola il prossimo premio che il cliente può raggiungere
  // Trova il premio con il punteggio più basso che è ancora sopra i punti attuali del cliente
  const nextReward = allRewards.length > 0
    ? allRewards
        .filter(reward => reward.points_required > currentPoints)
        .sort((a, b) => a.points_required - b.points_required)[0]
    : null;

  const pointsMissing = nextReward ? Math.max(0, nextReward.points_required - currentPoints) : 0;
  const progressPercentage = nextReward ? Math.min(100, (currentPoints / nextReward.points_required) * 100) : 0;

  // Setup callback globale per lo scanner QR
  useEffect(() => {
    if (!isOpen) return;

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
        setToast({
          message: 'Formato QR code non valido',
          type: 'error',
          isVisible: true
        });
        return;
      }

      console.log('📦 QR Data estratto:', qrData);
      handleQRScan(qrData);
    };

    return () => {
      // Cleanup
      delete (window as any).omnilyRewardQRResultHandler;
    };
  }, [isOpen]);

  // Avvia scanner QR direttamente tramite bridge Android
  const startQRScanner = () => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      if (bridge.readQRCode) {
        console.log('📱 Avvio scanner QR tramite bridge Android...');
        bridge.readQRCode('omnilyRewardQRResultHandler');
      } else {
        console.error('❌ readQRCode non disponibile nel bridge');
        setToast({
          message: 'Scanner QR non disponibile su questo dispositivo.',
          type: 'error',
          isVisible: true
        });
      }
    } else {
      console.error('❌ Bridge Android non disponibile');
      setToast({
        message: 'Funzionalità disponibile solo su dispositivo POS Android.',
        type: 'error',
        isVisible: true
      });
    }
  };

  // Gestisci scansione QR Code
  const handleQRScan = async (qrData: string) => {
    console.log('🔍 QR Code scansionato:', qrData);
    console.log('🔍 Tipo di qrData:', typeof qrData);

    try {
      // Prova a parsare come JSON (nuovo formato)
      console.log('📦 Tentativo di parsing JSON...');
      const parsed = JSON.parse(qrData);
      console.log('✅ JSON parsed con successo:', parsed);
      console.log('📦 parsed.type:', parsed.type);
      console.log('📦 parsed.redemptionId:', parsed.redemptionId);

      if (parsed.type === 'use_reward') {
        // QR Code per USARE un premio già riscattato
        console.log('🎫 Usare premio riscattato, redemption ID:', parsed.redemptionId);

        const result = await rewardsService.markRewardAsUsed(parsed.redemptionId);

        if (!result.success) {
          setToast({
            message: result.error || 'Errore durante l\'utilizzo del premio',
            type: 'error',
            isVisible: true
          });
          return;
        }

        setToast({
          message: '✅ Premio utilizzato con successo!',
          type: 'success',
          isVisible: true
        });

        // Aggiorna i dati del cliente
        if (onCustomerUpdate) {
          onCustomerUpdate();
        }

        return;
      }
    } catch (e) {
      // Non è JSON, potrebbe essere il vecchio formato (solo reward ID)
      console.error('❌ Errore parsing JSON:', e);
      console.log('📦 Formato vecchio, cerco tra i premi disponibili');
    }

    // Gestisci come reward ID (formato vecchio o per riscattare)
    const rewardId = qrData;
    console.log('📦 Tutti i premi disponibili:', allRewards.map(r => ({ id: r.id, name: r.name })));

    const reward = allRewards.find(r => r.id === rewardId);

    if (!reward) {
      console.error('❌ Premio NON trovato con ID:', rewardId);
      setToast({
        message: 'Premio non trovato o non disponibile',
        type: 'error',
        isVisible: true
      });
      return;
    }

    console.log('✅ Premio trovato:', reward);

    // Verifica se il premio è disponibile
    const isAvailable = availableRewards.some(r => r.id === reward.id);
    const canRedeem = isAvailable && customer.points >= reward.points_required;

    if (!canRedeem) {
      setToast({
        message: `Non hai abbastanza punti per riscattare questo premio`,
        type: 'error',
        isVisible: true
      });
      return;
    }

    // Seleziona il premio e apri il modal di conferma
    setSelectedReward(reward);
    setShowConfirmModal(true);
  };

  // Gestisci il riscatto del premio
  const handleRedeemReward = async () => {
    if (!selectedReward) return;

    try {
      const result = await rewardsService.redeemForCustomer(
        organizationId,
        customer.id,
        selectedReward.id,
        customer.points,
        customer.tier || 'Bronze'
      );

      if (!result.success) {
        setToast({
          message: result.error || 'Errore durante il riscatto del premio',
          type: 'error',
          isVisible: true
        });
        return;
      }

      // Aggiorna immediatamente i punti locali (ottimistico)
      const newPoints = currentPoints - selectedReward.points_required;
      setCurrentPoints(newPoints);

      // Ricarica i dati
      const active = await rewardsService.getActive(organizationId);
      setAllRewards(active);

      const available = await rewardsService.getAvailableForCustomer(
        organizationId,
        newPoints,
        customer.tier || 'Bronze'
      );
      setAvailableRewards(available);

      // Ricarica lo storico riscatti
      const history = await rewardsService.getRedemptionsByCustomer(customer.id, organizationId);
      setRedemptionHistory(history);

      // Chiudi i modali
      setShowConfirmModal(false);
      setSelectedReward(null);

      // Aggiorna i dati del cliente nel parent
      if (onCustomerUpdate) {
        onCustomerUpdate();
      }

      // Mostra toast di successo
      setToast({
        message: '🎉 Premio riscattato con successo!',
        type: 'success',
        isVisible: true
      });

      // Passa al tab "Premi Riscattati"
      setTimeout(() => {
        setActiveTab('redeemed');
      }, 500);
    } catch (error) {
      console.error('Errore durante il riscatto:', error);
      setToast({
        message: 'Errore durante il riscatto del premio',
        type: 'error',
        isVisible: true
      });
    }
  };

  // Carica premi disponibili
  useEffect(() => {
    if (!isOpen || !organizationId) return;

    const loadRewards = async () => {
      setLoadingRewards(true);
      try {
        const active = await rewardsService.getActive(organizationId);
        setAllRewards(active);

        const available = await rewardsService.getAvailableForCustomer(
          organizationId,
          customer.points,
          customer.tier || 'Bronze'
        );
        setAvailableRewards(available);
      } catch (error) {
        console.error('Error loading rewards:', error);
      } finally {
        setLoadingRewards(false);
      }
    };

    loadRewards();
  }, [isOpen, organizationId, customer.points, customer.tier]);

  // Carica storico riscatti
  useEffect(() => {
    if (!isOpen || activeTab !== 'redeemed' || !customer.id) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const history = await rewardsService.getRedemptionsByCustomer(customer.id, organizationId);
        setRedemptionHistory(history);
      } catch (error) {
        console.error('Error loading redemption history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [isOpen, activeTab, customer.id]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="rewards-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="rewards-modal">
        {/* Header */}
        <div className="rewards-modal-header">
          <div className="rewards-modal-header-content">
            <div className="rewards-modal-icon">
              <Gift size={24} />
            </div>
            <h2>Gestione Premi</h2>
          </div>
          <button className="rewards-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="rewards-modal-content">
          {/* Balance Card */}
          <div
            className="rewards-balance-card"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          >
            <div className="rewards-balance-header">IL TUO SALDO</div>

            <div className="rewards-balance-amount">
              <div className="rewards-balance-icon">
                <Heart size={32} />
              </div>
              <div className="rewards-balance-text">
                <div className="rewards-balance-number">{currentPoints}</div>
                <div className="rewards-balance-label">{pointsName.toLowerCase()} disponibili</div>
              </div>
            </div>

            {/* Progress bar per prossimo obiettivo */}
            {nextReward ? (
              <div className="rewards-goal-card">
                <div className="rewards-goal-header">
                  <span>Prossimo obiettivo: {nextReward.name}</span>
                  <span className="rewards-goal-points">{nextReward.points_required} 💎</span>
                </div>
                <div className="rewards-progress-bar">
                  <div
                    className="rewards-progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="rewards-goal-missing">
                  Mancano {pointsMissing} {pointsName.toLowerCase()}
                </div>
              </div>
            ) : availableRewards.length > 0 && (
              <div
                className="rewards-goal-card"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Effetto sparkle animato */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                  animation: 'shimmer 3s infinite',
                  pointerEvents: 'none'
                }} />

                <div className="rewards-goal-header" style={{ color: 'white', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gift size={20} strokeWidth={2.5} />
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>Puoi riscattare: {availableRewards[0].name}</span>
                  <span
                    className="rewards-goal-points"
                    style={{
                      color: 'white',
                      background: 'rgba(255, 255, 255, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      marginLeft: 'auto'
                    }}
                  >
                    {availableRewards[0].points_required} <Heart size={14} style={{ display: 'inline', marginBottom: '2px' }} />
                  </span>
                </div>
                <div
                  className="rewards-goal-missing"
                  style={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    position: 'relative',
                    zIndex: 1,
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px'
                  }}
                >
                  <CheckCircle size={18} strokeWidth={2.5} />
                  Pronto al riscatto! {availableRewards.length > 1 ? `(+${availableRewards.length - 1} altri premi)` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="rewards-tabs">
            <button
              className={`rewards-tab ${activeTab === 'redeem' ? 'active' : ''}`}
              onClick={() => setActiveTab('redeem')}
            >
              <Gift size={20} />
              Riscatta Premio
            </button>
            <button
              className={`rewards-tab ${activeTab === 'redeemed' ? 'active' : ''}`}
              onClick={() => setActiveTab('redeemed')}
            >
              <Clock size={20} />
              Premi Riscattati
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'redeem' ? (
            <div className="rewards-list-section">
              <div className="rewards-list-header">
                <h3>Premi Disponibili</h3>
                <span className="rewards-count">{allRewards.length} riscattabili</span>
              </div>

              {loadingRewards ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  Caricamento premi...
                </p>
              ) : allRewards.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  Nessun premio configurato
                </p>
              ) : (
                <div className="rewards-grid">
                  {allRewards.map(reward => {
                    const isAvailable = availableRewards.some(r => r.id === reward.id);
                    const canRedeem = isAvailable && currentPoints >= reward.points_required;
                    const pointsMissing = Math.max(0, reward.points_required - currentPoints);

                    return (
                      <div key={reward.id} className="rewards-modal-card">
                        <div className="rewards-modal-card-header">
                          {reward.image_url ? (
                            <img
                              src={reward.image_url}
                              alt={reward.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div className="rewards-modal-card-icon">
                              <Gift size={48} />
                            </div>
                          )}
                          <div className="rewards-modal-card-badge">
                            <Heart size={14} />
                            {reward.points_required}
                          </div>
                        </div>

                        <h4 className="rewards-modal-card-title">{reward.name}</h4>
                        {reward.description && (
                          <p className="rewards-modal-card-description">{reward.description}</p>
                        )}

                        {reward.required_tier && (
                          <p className="rewards-modal-card-tier">Richiede: {reward.required_tier}</p>
                        )}

                        {/* Mostra punti mancanti se non hai abbastanza punti */}
                        {pointsMissing > 0 && isAvailable && (
                          <p className="rewards-modal-card-missing">
                            Mancano {pointsMissing} 💎
                          </p>
                        )}

                        <button
                          className="rewards-modal-card-btn"
                          disabled={!canRedeem}
                          onClick={() => {
                            setSelectedReward(reward);
                            setShowConfirmModal(true);
                          }}
                        >
                          {!isAvailable && reward.required_tier ? (
                            <>
                              <Lock size={16} />
                              Richiede {reward.required_tier}
                            </>
                          ) : !canRedeem ? (
                            <>
                              <Lock size={16} />
                              {pointsName} Insufficienti
                            </>
                          ) : (
                            'Riscatta'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rewards-history-section">
              <div className="rewards-history-header">
                <h3>Cronologia Riscatto</h3>
                <span className="rewards-history-count">Totale: {redemptionHistory.length}</span>
              </div>

              {loadingHistory ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  Caricamento storico...
                </p>
              ) : redemptionHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  Nessun premio riscattato ancora
                </p>
              ) : (
                <div className="rewards-history-list">
                  {redemptionHistory.map(redemption => {
                    const isUsed = redemption.used_at !== null;
                    const statusClass = isUsed ? 'used' : 'waiting';

                    return (
                      <div key={redemption.id} className={`reward-history-item ${statusClass}`}>
                        <div className="reward-history-icon">
                          <Gift size={20} />
                        </div>
                        <div className="reward-history-info">
                          <h5>{redemption.reward_name}</h5>
                          <p className="reward-history-date">
                            Riscattato il {new Date(redemption.redeemed_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {isUsed && redemption.used_at && (
                            <p className="reward-history-used-date">
                              Usato il {new Date(redemption.used_at).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                        <div className="reward-history-right">
                          <div className={`reward-status-badge ${statusClass}`}>
                            {isUsed ? '✓ Usato' : '⏱ In Attesa'}
                          </div>
                          <div className="reward-history-points">
                            -{redemption.points_spent} 💎
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating QR Button - Only on "Riscatta Premio" tab */}
      {activeTab === 'redeem' && (
        <button
          className="rewards-qr-fab"
          onClick={startQRScanner}
          title="Scansiona QR Code"
        >
          <QrCode size={28} />
        </button>
      )}

      {/* Confirm Redeem Modal */}
      <ConfirmRedeemModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedReward(null);
        }}
        onConfirm={handleRedeemReward}
        reward={selectedReward}
        customerPoints={customer.points}
        pointsName={pointsName}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </>
  );
};

export default RewardsModal;
