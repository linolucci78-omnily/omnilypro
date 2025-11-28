import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react'
import { aiService, type AIMessage } from '../../services/aiService'
import './OmnyAssistant.css'

import { createPortal } from 'react-dom'

const OmnyAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<AIMessage[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            handleSendMessage('Ciao')
        }
    }, [isOpen])

    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    // Speech Recognition Setup
    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            const recognition = new SpeechRecognition()
            recognition.lang = 'it-IT'
            recognition.continuous = false
            recognition.interimResults = false

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => setIsListening(false)

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                setInputValue(transcript)
                handleSendMessage(transcript)
            }

            recognition.start()
        } else {
            alert('Il tuo browser non supporta il riconoscimento vocale.')
        }
    }

    // Speech Synthesis Setup
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any current speech
            window.speechSynthesis.cancel()

            // Strip markdown symbols for cleaner speech
            const cleanText = text.replace(/[*#_`]/g, '')

            const utterance = new SpeechSynthesisUtterance(cleanText)
            utterance.lang = 'it-IT'
            utterance.rate = 1.0
            utterance.pitch = 1.0

            utterance.onstart = () => setIsSpeaking(true)
            utterance.onend = () => setIsSpeaking(false)

            window.speechSynthesis.speak(utterance)
        }
    }

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return

        // Add user message
        const userMsg: AIMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: new Date()
        }

        // Don't add 'Ciao' trigger to visible messages if it's the auto-init
        if (text !== 'Ciao' || messages.length > 0) {
            setMessages(prev => [...prev, userMsg])
        }

        setInputValue('')
        setIsTyping(true)

        try {
            const response = await aiService.sendMessage(text)
            setMessages(prev => [...prev, response])
            // Speak the response
            speak(response.content)
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(inputValue)
        }
    }

    return createPortal(
        <div className="omny-assistant-container">
            {isOpen && (
                <div className="omny-chat-window">
                    <div className="chat-header">
                        <div className="header-info">
                            <div className="assistant-avatar">
                                <Bot size={20} />
                            </div>
                            <div className="header-text">
                                <h3>Omny Assistant <span className="demo-badge">DEMO</span></h3>
                            </div>
                        </div>
                        <button
                            className="close-btn"
                            onClick={() => {
                                setIsOpen(false)
                                window.speechSynthesis.cancel()
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="message-content">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message assistant">
                                <div className="message-avatar">
                                    <Bot size={16} />
                                </div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        {isSpeaking && (
                            <div className="voice-indicator speaking">
                                <span>Omny sta parlando...</span>
                                <div className="wave-bars">
                                    <div></div><div></div><div></div>
                                </div>
                            </div>
                        )}
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder={isListening ? "Ti ascolto..." : "Chiedi a Omny..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isTyping || isListening}
                            />
                            <button
                                className={`mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={startListening}
                                disabled={isTyping}
                                title="Parla con Omny"
                            >
                                <Sparkles size={16} className={isListening ? 'pulse' : ''} />
                            </button>
                            <button
                                className="send-btn"
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                className={`omny-assistant-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>
        </div>,
        document.body
    )
}

export default OmnyAssistant
