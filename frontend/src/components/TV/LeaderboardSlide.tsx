import React from 'react'
import { Crown, Medal, TrendingUp } from 'lucide-react'
import { Customer } from '../../services/tvService'
import './LeaderboardSlide.css'

// MOCK DATA for Prototype (fallback)
const MOCK_LEADERS = [
    { id: '1', name: 'Mario Rossi', tier: 'Chef VIP', points: 1250, avatar: 'MR' },
    { id: '2', name: 'Giulia Bianchi', tier: 'Gourmet', points: 980, avatar: 'GB' },
    { id: '3', name: 'Luca Verdi', tier: 'Gourmet', points: 850, avatar: 'LV' },
    { id: '4', name: 'Anna Neri', tier: 'Buongustaio', points: 620, avatar: 'AN' },
    { id: '5', name: 'Marco Gialli', tier: 'Buongustaio', points: 450, avatar: 'MG' }
]

interface LeaderboardSlideProps {
    customers?: Customer[]
    pointsName?: string
}

const LeaderboardSlide: React.FC<LeaderboardSlideProps> = ({ customers, pointsName = 'pts' }) => {
    // Use real data if available, otherwise fallback to mock
    const leaders = customers && customers.length > 0 ? customers : MOCK_LEADERS

    // Ensure we have at least 3 leaders for the podium
    const paddedLeaders = [...leaders]
    while (paddedLeaders.length < 5) {
        paddedLeaders.push(MOCK_LEADERS[paddedLeaders.length] || MOCK_LEADERS[0])
    }

    const [top1, top2, top3, ...rest] = paddedLeaders

    return (
        <div className="tv-slide-vertical leaderboard-slide-container">

            {/* Header */}
            <div className="leaderboard-header animate-fade-in">
                <div className="leaderboard-header-badge">
                    <Crown size={24} color="#ea580c" />
                    <span className="leaderboard-header-badge-text">
                        Hall of Fame
                    </span>
                </div>
                <h2 className="leaderboard-header-title">
                    Top Customers
                </h2>
            </div>

            <div className="leaderboard-container">

                {/* PODIUM (Top 3) */}
                <div className="leaderboard-podium">

                    {/* #2 Silver */}
                    <div className="leaderboard-podium-place leaderboard-podium-silver animate-podium delay-200">
                        {/* Position Badge */}
                        <div className="leaderboard-position-badge silver">
                            2
                        </div>
                        <div className="leaderboard-avatar small silver">
                            {top2.avatar}
                        </div>
                        <div className="leaderboard-podium-content small">
                            <Medal size={32} color="#94a3b8" />
                            <h3 className="leaderboard-name small">{top2.name}</h3>
                            <div>
                                <span className="leaderboard-points small silver">{top2.points}</span>
                                <span className="leaderboard-points-label small silver">{pointsName}</span>
                            </div>
                        </div>
                    </div>

                    {/* #1 Gold */}
                    <div className="leaderboard-podium-place leaderboard-podium-gold animate-podium delay-400">
                        <div className="leaderboard-avatar large">
                            <Crown size={60} color="#f59e0b" className="leaderboard-crown" />
                            {top1.avatar}
                        </div>
                        <div className="leaderboard-podium-content large">
                            <div className="leaderboard-rank-number">1</div>
                            <h3 className="leaderboard-name">{top1.name}</h3>
                            <div className="leaderboard-points-badge">
                                <span className="leaderboard-points">{top1.points}</span>
                                <span className="leaderboard-points-label">{pointsName}</span>
                            </div>
                        </div>
                    </div>

                    {/* #3 Bronze */}
                    <div className="leaderboard-podium-place leaderboard-podium-bronze animate-podium">
                        {/* Position Badge */}
                        <div className="leaderboard-position-badge bronze">
                            3
                        </div>
                        <div className="leaderboard-avatar small bronze">
                            {top3.avatar}
                        </div>
                        <div className="leaderboard-podium-content small">
                            <Medal size={32} color="#c2410c" />
                            <h3 className="leaderboard-name small bronze">{top3.name}</h3>
                            <div>
                                <span className="leaderboard-points small bronze">{top3.points}</span>
                                <span className="leaderboard-points-label small bronze">{pointsName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BEST OF THE REST (List) */}
                <div className="leaderboard-rest">
                    <h4 className="leaderboard-rest-header">
                        In scalata
                    </h4>
                    {rest.map((leader, i) => (
                        <div
                            key={i}
                            className="leaderboard-rest-item animate-slide-in"
                            style={{ animationDelay: `${500 + (i * 100)}ms` }}
                        >
                            <span className="leaderboard-rest-rank">#{i + 4}</span>
                            <div className="leaderboard-rest-avatar">
                                {leader.avatar}
                            </div>
                            <div className="leaderboard-rest-info">
                                <span className="leaderboard-rest-name">{leader.name}</span>
                                <span className="leaderboard-rest-tier">{leader.tier}</span>
                            </div>
                            <div className="leaderboard-rest-points">
                                <div>
                                    <span className="leaderboard-rest-points-value">{leader.points}</span>
                                    <span className="leaderboard-rest-points-label">{pointsName}</span>
                                    <TrendingUp size={16} color="#22c55e" className="leaderboard-rest-trend" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default LeaderboardSlide
