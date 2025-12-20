import React, { useEffect, useState } from 'react'
import { Ticket, Clock } from 'lucide-react'
import './LotterySlide.css'

// Odometer Component for rolling numbers - CSS optimized
const Odometer = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        const duration = 1000; // 1 second animation
        const startValue = displayValue;
        const endValue = value;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        if (value !== displayValue) {
            requestAnimationFrame(animate);
        }
    }, [value]);

    return <span>{displayValue.toLocaleString()}</span>;
};

interface LotterySlideProps {
    lotteryName?: string
    jackpot?: number
    prizeName?: string
    prizeImage?: string
    lastWinner?: string
    lastPrize?: string
    drawDate?: string
    pointsName?: string
    lastWinnerGender?: 'male' | 'female'
}

const LotterySlide: React.FC<LotterySlideProps> = ({
    lotteryName = 'Lotteria Settimanale',
    jackpot = 15400,
    prizeName = 'Weekend da Sogno',
    prizeImage = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=200&q=80',
    lastWinner,
    lastPrize,
    drawDate,
    pointsName = 'PUNTI',
    lastWinnerGender
}) => {
    // Simulate Pot Growing
    const [pot, setPot] = useState(jackpot)

    // Update pot when jackpot prop changes
    useEffect(() => {
        setPot(jackpot)
    }, [jackpot])

    useEffect(() => {
        const interval = setInterval(() => {
            setPot(prev => prev + Math.floor(Math.random() * 50))
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="tv-slide-vertical lottery-container">

            {/* Header with Neon Effect */}
            <div className="lottery-header animate-scale-in">
                <div className="lottery-neon-glow"></div>

                <div className="lottery-title-badge">
                    <Ticket size={80} color="#fcd34d" />
                    <span className="lottery-title-text">
                        {lotteryName}
                    </span>
                </div>
            </div>

            {/* MAIN JACKPOT DISPLAY */}
            <div
                className="lottery-jackpot-section animate-fade-in"
                style={{ animationDelay: '200ms' }}
            >
                <span className="lottery-jackpot-label">
                    Montepremi Attuale
                </span>

                <h1 className="lottery-jackpot-amount">
                    <Odometer value={pot} />
                </h1>

                <div className="lottery-points-label">{pointsName}</div>

                {/* SUPER PRIZE TEASER */}
                <div
                    className="lottery-prize-teaser animate-fade-in"
                    style={{ animationDelay: '500ms' }}
                >
                    <img
                        src={prizeImage}
                        alt="Dream Prize"
                        className="lottery-prize-image"
                    />
                    <div className="lottery-prize-info">
                        <span className="lottery-prize-label">SUPER PREMIO</span>
                        <span className="lottery-prize-name">{prizeName}</span>
                    </div>
                </div>
            </div>

            {/* Footer Grid - Conditional layout based on available data */}
            <div className={`lottery-footer-grid ${lastWinner ? 'two-columns' : 'single-column'}`}>

                {/* Countdown Box - Only show if draw date is provided */}
                {drawDate && (
                    <div className="lottery-countdown-box">
                        <div className="lottery-countdown-icon">
                            <Clock size={50} />
                        </div>
                        <div className="lottery-countdown-content">
                            <span className="lottery-countdown-label">PROSSIMA ESTRAZIONE</span>
                            <span className="lottery-countdown-date">
                                {new Date(drawDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Last Winner Box - Only show if we have a winner name */}
                {lastWinner && (
                    <div className="lottery-winner-box">
                        <img
                            src={`https://api.dicebear.com/7.x/${
                                lastWinnerGender === 'female' ? 'avataaars' :
                                lastWinnerGender === 'male' ? 'avataaars' :
                                'avataaars'
                            }/svg?seed=${lastWinner}&gender=${
                                lastWinnerGender === 'female' ? 'female' :
                                lastWinnerGender === 'male' ? 'male' :
                                ''
                            }`}
                            alt="Winner"
                            className="lottery-winner-avatar"
                        />
                        <div className="lottery-winner-content">
                            <span className="lottery-winner-label">ULTIMO VINCITORE</span>
                            <span className="lottery-winner-name">{lastWinner}</span>
                            {lastPrize && (
                                <span className="lottery-winner-prize">Ha vinto {lastPrize}!</span>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default LotterySlide
