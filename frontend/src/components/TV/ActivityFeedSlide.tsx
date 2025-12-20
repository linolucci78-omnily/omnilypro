import React, { useState, useEffect } from 'react'
import { Gift, UserPlus, Star, Coffee, ShoppingBag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './ActivityFeedSlide.css'

interface ActivityEvent {
    type: 'redeem' | 'levelup' | 'join'
    user: string
    detail: string
    time: string
    icon: React.ReactNode
    timestamp: Date
}

interface ActivityFeedSlideProps {
    organizationId?: string
}

const ActivityFeedSlide: React.FC<ActivityFeedSlideProps> = ({ organizationId }) => {
    const [visibleEvents, setVisibleEvents] = useState<ActivityEvent[]>([])

    // Helper function to format relative time
    const getRelativeTime = (date: Date) => {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Proprio ora'
        if (diffMins < 60) return `${diffMins} min fa`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h fa`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}g fa`
    }

    // Load real activity events from Supabase
    const loadActivityEvents = async () => {
        if (!organizationId) return

        try {
            const events: ActivityEvent[] = []

            // 1. Load recent reward redemptions (last 24 hours)
            const { data: redemptions } = await supabase
                .from('reward_redemptions')
                .select('customer_id, reward_name, redeemed_at, customers(name)')
                .eq('organization_id', organizationId)
                .gte('redeemed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('redeemed_at', { ascending: false })
                .limit(10)

            if (redemptions) {
                redemptions.forEach((redemption: any) => {
                    const customerName = redemption.customers?.name || 'Cliente'
                    // Shorten name for privacy (e.g., "Marco Rossi" -> "Marco R.")
                    const shortName = customerName.split(' ').map((part: string, i: number) =>
                        i === 0 ? part : `${part[0]}.`
                    ).join(' ')

                    events.push({
                        type: 'redeem',
                        user: shortName,
                        detail: redemption.reward_name,
                        time: getRelativeTime(new Date(redemption.redeemed_at)),
                        icon: <Gift size={24} />,
                        timestamp: new Date(redemption.redeemed_at)
                    })
                })
            }

            // 2. Load recent new customers (last 7 days)
            const { data: newCustomers } = await supabase
                .from('customers')
                .select('name, created_at')
                .eq('organization_id', organizationId)
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })
                .limit(5)

            if (newCustomers) {
                newCustomers.forEach((customer: any) => {
                    const shortName = customer.name.split(' ').map((part: string, i: number) =>
                        i === 0 ? part : `${part[0]}.`
                    ).join(' ')

                    events.push({
                        type: 'join',
                        user: shortName,
                        detail: 'Nuovo Iscritto!',
                        time: getRelativeTime(new Date(customer.created_at)),
                        icon: <UserPlus size={24} />,
                        timestamp: new Date(customer.created_at)
                    })
                })
            }

            // Sort all events by timestamp (most recent first)
            events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

            // Show only top 3 most recent events
            setVisibleEvents(events.slice(0, 3))

        } catch (error) {
            console.error('Error loading activity feed:', error)
        }
    }

    useEffect(() => {
        loadActivityEvents()

        // Reload events every 10 seconds
        const interval = setInterval(loadActivityEvents, 10000)
        return () => clearInterval(interval)
    }, [organizationId])

    // Real-time subscription for new events
    useEffect(() => {
        if (!organizationId) return

        // Subscribe to new redemptions
        const redemptionsChannel = supabase
            .channel('activity-feed-redemptions')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reward_redemptions',
                    filter: `organization_id=eq.${organizationId}`
                },
                () => {
                    console.log('New redemption detected, reloading feed...')
                    loadActivityEvents()
                }
            )
            .subscribe()

        // Subscribe to new customers
        const customersChannel = supabase
            .channel('activity-feed-customers')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'customers',
                    filter: `organization_id=eq.${organizationId}`
                },
                () => {
                    console.log('New customer detected, reloading feed...')
                    loadActivityEvents()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(redemptionsChannel)
            supabase.removeChannel(customersChannel)
        }
    }, [organizationId])

    // If no events, show a placeholder
    if (visibleEvents.length === 0) {
        return (
            <div className="tv-slide-vertical activity-feed-container">
                <div className="activity-feed-header animate-fade-in">
                    <h2 className="activity-feed-title">Live Feed</h2>
                    <p className="activity-feed-subtitle">Attività in tempo reale</p>
                </div>
                <div className="activity-feed-list">
                    <div className="activity-feed-empty">
                        <UserPlus size={48} style={{ opacity: 0.3, color: 'white' }} />
                        <p style={{ color: 'white', opacity: 0.6, marginTop: '20px' }}>
                            In attesa di nuove attività...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="tv-slide-vertical activity-feed-container">
            <div className="activity-feed-header animate-fade-in">
                <h2 className="activity-feed-title">
                    Live Feed
                </h2>
                <p className="activity-feed-subtitle">
                    Attività in tempo reale
                </p>
            </div>

            <div className="activity-feed-list">
                {visibleEvents.map((event, index) => (
                    <div
                        key={`${event.user}-${index}-${event.timestamp.getTime()}`}
                        className={`activity-feed-item ${event.type} animate-slide-in`}
                        style={{
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        <div className="activity-feed-icon">
                            {event.icon}
                        </div>

                        <div className="activity-feed-content">
                            <div className="activity-feed-content-header">
                                <span className="activity-feed-user">{event.user}</span>
                                <span className="activity-feed-time">{event.time}</span>
                            </div>
                            <span className="activity-feed-detail">
                                {event.type === 'redeem' ? 'Ha riscattato:' :
                                    event.type === 'levelup' ? 'Nuovo Status:' :
                                        'Nuovo Iscritto'}
                                {event.type !== 'join' && (
                                    <strong className="activity-feed-detail-highlight"> {event.detail}</strong>
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ActivityFeedSlide
