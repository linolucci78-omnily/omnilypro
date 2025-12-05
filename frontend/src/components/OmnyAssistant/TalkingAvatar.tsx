import React, { useEffect, useState } from 'react'
import './TalkingAvatar.css'

interface TalkingAvatarProps {
    isSpeaking: boolean
    isListening: boolean
    size?: number
}

const TalkingAvatar: React.FC<TalkingAvatarProps> = ({
    isSpeaking,
    isListening,
    size = 120
}) => {
    const [visualState, setVisualState] = useState<'idle' | 'speaking' | 'listening'>('idle')

    useEffect(() => {
        if (isListening) {
            setVisualState('listening')
        } else if (isSpeaking) {
            setVisualState('speaking')
        } else {
            setVisualState('idle')
        }
    }, [isSpeaking, isListening])

    return (
        <div className={`talking-avatar-container ${visualState}`} style={{ width: size, height: size }}>
            {/* Outer Glow Ring */}
            <div className="avatar-glow-ring"></div>

            {/* Main Avatar Circle */}
            <div className="avatar-circle">
                {/* Face / Visualizer */}
                <div className="avatar-face">
                    {visualState === 'idle' && (
                        <div className="face-idle">
                            <div className="eye left"></div>
                            <div className="eye right"></div>
                            <div className="mouth-idle"></div>
                        </div>
                    )}

                    {visualState === 'listening' && (
                        <div className="face-listening">
                            <div className="listening-wave"></div>
                            <div className="listening-wave"></div>
                            <div className="listening-wave"></div>
                        </div>
                    )}

                    {visualState === 'speaking' && (
                        <div className="face-speaking">
                            <div className="eye left blink"></div>
                            <div className="eye right blink"></div>
                            <div className="mouth-speaking">
                                <div className="voice-bar"></div>
                                <div className="voice-bar"></div>
                                <div className="voice-bar"></div>
                                <div className="voice-bar"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Text */}
            <div className="avatar-status-text">
                {visualState === 'listening' && "Ti ascolto..."}
                {visualState === 'speaking' && "Omny sta parlando..."}
                {visualState === 'idle' && "Sono qui per te"}
            </div>
        </div>
    )
}

export default TalkingAvatar
