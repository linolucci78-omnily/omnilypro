import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Crown, Award, Star, X } from 'lucide-react';
import './TierUpgradeModal.css';

interface TierUpgradeModalProps {
  isOpen: boolean;
  customerName: string;
  oldTierName: string;
  newTierName: string;
  newTierColor: string;
  pointsName?: string;
  onClose: () => void;
}

const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  isOpen,
  customerName,
  oldTierName,
  newTierName,
  newTierColor,
  pointsName = 'Punti',
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Attiva animazione dopo un piccolo delay
      setTimeout(() => setIsAnimating(true), 100);

      // Suona le trombe! 🎺
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.8;
      audio.play().catch(e => console.error('Error playing celebration sound:', e));
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300); // Delay per animazione uscita
  };

  if (!isOpen) return null;

  // Seleziona icona in base al tier
  const getTierIcon = (tierName: string) => {
    const tier = tierName.toLowerCase();
    if (tier.includes('platinum') || tier.includes('diamond')) return <Crown size={80} />;
    if (tier.includes('gold')) return <Trophy size={80} />;
    if (tier.includes('silver')) return <Sparkles size={80} />;
    return <Award size={80} />;
  };

  return (
    <div className={`tier-upgrade-overlay ${isAnimating ? 'active' : ''}`} onClick={handleClose}>
      <div
        className={`tier-upgrade-modal ${isAnimating ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ '--tier-color': newTierColor } as React.CSSProperties}
      >
        {/* Confetti Animation */}
        <div className="tier-confetti">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>

        {/* Close Button */}
        <button className="tier-upgrade-close" onClick={handleClose}>
          <X size={24} />
        </button>

        {/* Content */}
        <div className="tier-upgrade-content">
          {/* Icon Container with glow effect */}
          <div className="tier-icon-container">
            <div className="tier-icon-glow"></div>
            {getTierIcon(newTierName)}
          </div>

          {/* Congratulations Text */}
          <h2 className="tier-upgrade-title">
            🎊 Congratulazioni! 🎊
          </h2>

          {/* Customer Name */}
          <p className="tier-upgrade-customer">
            <strong>{customerName}</strong>
          </p>

          {/* Tier Upgrade Message */}
          <p className="tier-upgrade-message">
            ha raggiunto il prestigioso livello
          </p>

          {/* New Tier Badge */}
          <div className="tier-upgrade-badge">
            <Star className="tier-badge-icon" size={32} />
            <span className="tier-badge-name">{newTierName}</span>
            <Star className="tier-badge-icon" size={32} />
          </div>

          {/* Tier Transition */}
          <div className="tier-transition">
            <span className="tier-old">{oldTierName}</span>
            <span className="tier-arrow">→</span>
            <span className="tier-new">{newTierName}</span>
          </div>

          {/* Benefits Message */}
          <div className="tier-benefits">
            <p>✨ Nuovi vantaggi sbloccati!</p>
            <ul>
              <li>🎁 Accesso a premi esclusivi</li>
              <li>⭐ Vantaggi speciali riservati</li>
              <li>🚀 Maggiori {pointsName} per acquisto</li>
            </ul>
          </div>

          {/* CTA Button */}
          <button className="tier-upgrade-cta" onClick={handleClose}>
            Fantastico! 🎉
          </button>
        </div>

        {/* Sparkles decoration */}
        <div className="tier-sparkles">
          <Sparkles className="sparkle sparkle-1" size={20} />
          <Sparkles className="sparkle sparkle-2" size={24} />
          <Sparkles className="sparkle sparkle-3" size={18} />
          <Sparkles className="sparkle sparkle-4" size={22} />
        </div>
      </div>
    </div>
  );
};

export default TierUpgradeModal;
