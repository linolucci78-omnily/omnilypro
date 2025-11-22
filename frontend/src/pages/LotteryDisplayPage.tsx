import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LotteryExtractionFullPage } from '../components/LotteryExtractionDisplay'

/**
 * Lottery Display Page
 * Full-screen extraction display for giant screens
 *
 * Usage: /lottery/display/:eventId
 * Example: /lottery/display/123e4567-e89b-12d3-a456-426614174000
 */
const LotteryDisplayPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()

  if (!eventId) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        fontSize: '2rem',
        fontFamily: 'sans-serif'
      }}>
        ⚠️ Event ID mancante
      </div>
    )
  }

  return <LotteryExtractionFullPage eventId={eventId} />
}

export default LotteryDisplayPage
