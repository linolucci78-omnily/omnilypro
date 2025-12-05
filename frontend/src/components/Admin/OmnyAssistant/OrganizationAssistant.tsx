import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import Overlay from './Overlay';
import AssistantVisualizer, { AssistantState } from './AssistantVisualizer';
import { OrganizationAssistantService, AssistantMessage } from './organizationAssistantService';

interface OrganizationAssistantProps {
  onClose?: () => void;
  organizationId?: string | null;
}

const OrganizationAssistant: React.FC<OrganizationAssistantProps> = ({ onClose, organizationId }) => {
  console.log('🎨 OrganizationAssistant mounted with organizationId:', organizationId);

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>(AssistantState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const serviceRef = useRef<OrganizationAssistantService | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug: log messages when they change
  useEffect(() => {
    console.log('💬 Messages updated:', messages);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Text-to-Speech function
  const speak = useCallback((text: string) => {
    console.log('🔊 speak() called with text:', text);

    // Strip markdown symbols for cleaner speech
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\n/g, ' ');
    console.log('🔊 Clean text:', cleanText);

    // Check if we're running in Android WebView with TTS bridge
    const hasAndroidBridge = typeof (window as any).Android !== 'undefined' &&
                             typeof (window as any).Android.speak === 'function';

    if (hasAndroidBridge) {
      console.log('🔊 Using Android native TTS');
      try {
        setIsSpeaking(true);
        setAssistantState(AssistantState.SPEAKING);
        (window as any).Android.speak(cleanText);

        // Since Android TTS doesn't have callbacks, simulate end after estimated duration
        const estimatedDuration = cleanText.length * 50; // ~50ms per character
        setTimeout(() => {
          setIsSpeaking(false);
          setAssistantState(AssistantState.LISTENING);
        }, estimatedDuration);

        console.log('✅ Android TTS called');
        return;
      } catch (err) {
        console.error('❌ Error calling Android TTS:', err);
        // Fall through to web TTS
      }
    }

    // Fallback to Web Speech API
    if (!('speechSynthesis' in window)) {
      console.error('❌ speechSynthesis NOT available and no Android bridge');
      return;
    }

    console.log('✅ Using web speechSynthesis');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'it-IT';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const italianVoice = voices.find(v => v.lang === 'it-IT' && v.name.includes('Google')) || voices.find(v => v.lang === 'it-IT');
    if (italianVoice) {
      utterance.voice = italianVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAssistantState(AssistantState.SPEAKING);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setAssistantState(AssistantState.LISTENING);
    };

    utterance.onerror = (event) => {
      console.error('❌ TTS error:', event);
      setIsSpeaking(false);
      setAssistantState(AssistantState.LISTENING);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new OrganizationAssistantService(
      (state) => setAssistantState(state),
      (error) => setErrorMsg(error),
      (message) => {
        setMessages(prev => [...prev, message]);
        // Speak assistant messages
        if (message.role === 'assistant') {
          speak(message.content);
        }
      }
    );

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [speak]);

  const handleStart = useCallback(async () => {
    console.log('🚀 handleStart called with organizationId:', organizationId);
    setIsOverlayOpen(true);
    setAssistantState(AssistantState.CONNECTING);
    setErrorMsg(null);

    try {
      if (serviceRef.current) {
        console.log('📞 Calling connect with organizationId:', organizationId);
        await serviceRef.current.connect(organizationId);
      }
    } catch (err: any) {
      console.error('Failed to connect:', err);
      setErrorMsg(err.message || 'Connessione fallita');
      setAssistantState(AssistantState.ERROR);
    }
  }, [organizationId]);

  // Auto-open overlay when organizationId is provided (opened from dashboard)
  useEffect(() => {
    console.log('🔍 Auto-open check:', { organizationId, isOverlayOpen });
    if (organizationId && !isOverlayOpen) {
      console.log('✨ Auto-opening overlay!');
      handleStart();
    }
  }, [organizationId, isOverlayOpen, handleStart]);

  const handleStop = useCallback(() => {
    setIsOverlayOpen(false);
    setAssistantState(AssistantState.IDLE);
    setAudioLevel(0);

    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }

    // Chiama onClose se fornito (per chiudere il modal parent)
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleSendText = useCallback(async (text: string) => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.sendTextMessage(text);
    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  }, []);

  // Voice Recognition
  const startListening = useCallback(() => {
    console.log('🔍 Inizio test riconoscimento vocale...');

    // Test if API exists
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('❌ API Speech Recognition NON disponibile');
      setErrorMsg('Il tuo browser non supporta il riconoscimento vocale');
      setAssistantState(AssistantState.ERROR);
      return;
    }

    console.log('✅ API Speech Recognition disponibile');

    // Initialize speech recognition directly (permissions already granted on Android)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'it-IT';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('✅ 🎤 Ascolto ATTIVATO - Parla ora!');
      setIsListening(true);
      setAssistantState(AssistantState.LISTENING);
      setErrorMsg(null);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Torna a LISTENING dopo aver processato, non a IDLE
      if (assistantState !== AssistantState.THINKING && assistantState !== AssistantState.SPEAKING) {
        setAssistantState(AssistantState.LISTENING);
      }
      console.log('🎤 Ascolto terminato');
    };

    recognitionRef.current.onresult = (event: any) => {
      console.log('📥 onresult triggered! Event:', event);
      console.log('📊 Results length:', event.results.length);

      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        console.log(`Result [${i}]: "${transcript}" (isFinal: ${isFinal})`);

        if (isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Show interim results as user speaks
      if (interim) {
        console.log('✏️ 🎤 Interim (stai parlando):', interim);
        setInterimTranscript(interim);
      }

      // When final result is ready, send message
      if (final) {
        console.log('✅ 🎤 Final riconosciuto:', final);
        setInterimTranscript('');
        setIsListening(false);
        handleSendText(final);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('❌ 🎤 ERRORE riconoscimento:', event.error);
      setIsListening(false);
      setInterimTranscript('');

      // Handle specific errors
      if (event.error === 'no-speech') {
        console.log('⏳ Nessun parlato rilevato, riprova...');
        setAssistantState(AssistantState.LISTENING);
        // Non mostrare errore per no-speech, è normale
      } else if (event.error === 'aborted') {
        console.log('🛑 Riconoscimento interrotto');
        setAssistantState(AssistantState.LISTENING);
      } else if (event.error === 'not-allowed') {
        console.error('❌ Permesso microfono NEGATO');
        setErrorMsg('Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.');
        setAssistantState(AssistantState.ERROR);
      } else if (event.error === 'network') {
        console.error('❌ Errore di rete');
        setErrorMsg('Errore di connessione. Verifica la connessione internet.');
        setAssistantState(AssistantState.ERROR);
      } else {
        console.error('❌ Errore sconosciuto:', event.error);
        setErrorMsg(`Errore: ${event.error}`);
        setAssistantState(AssistantState.ERROR);
      }
    };

    try {
      console.log('🚀 Avvio riconoscimento vocale...');
      recognitionRef.current.start();
    } catch (err) {
      console.error('❌ Errore start recognition:', err);
      setErrorMsg('Impossibile avviare il riconoscimento vocale');
      setAssistantState(AssistantState.ERROR);
    }
  }, [handleSendText, assistantState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Get state label
  const getStateLabel = () => {
    switch (assistantState) {
      case AssistantState.CONNECTING:
        return 'Sto connettendo...';
      case AssistantState.LISTENING:
        return 'In ascolto...';
      case AssistantState.THINKING:
        return 'Sto pensando...';
      case AssistantState.SPEAKING:
        return 'Rispondo...';
      case AssistantState.ERROR:
        return 'Errore di connessione';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Main UI */}
      <div className="z-10 text-center max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Omny Assistant
        </h1>
        <p className="text-gray-400 mb-12">
          Il tuo assistente intelligente per l'organizzazione
        </p>

        {/* Trigger Button */}
        <button
          onClick={handleStart}
          className="group relative flex items-center justify-center w-24 h-24 mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-2xl border border-white/5 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        >
          {/* Breathing glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

          {/* Icon */}
          <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />

          {/* Color indicators */}
          <div className="absolute bottom-4 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-[#4285F4]" />
            <div className="w-1 h-1 rounded-full bg-[#DB4437]" />
            <div className="w-1 h-1 rounded-full bg-[#F4B400]" />
            <div className="w-1 h-1 rounded-full bg-[#0F9D58]" />
          </div>
        </button>

        <p className="mt-8 text-sm text-gray-500 font-medium">
          Clicca per iniziare
        </p>
      </div>

      {/* Full Screen Assistant Overlay */}
      <Overlay
        isOpen={isOverlayOpen}
        onClose={handleStop}
        onSendText={handleSendText}
        onStartListening={startListening}
        isListening={isListening}
      >
        <div className="w-full h-full relative flex flex-col items-center justify-end pb-8">

          {/* Messages Display - Chat Style - MASSIMO SCHERMO */}
          <div className="omny-chat-container">

            {/* Error Message (se presente) */}
            {errorMsg && (
              <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            {/* Interim transcript (quando parli) */}
            {interimTranscript && (
              <div className="mb-4 text-center">
                <p className="text-blue-400 italic text-lg">
                  "{interimTranscript}"
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-[calc(100%-100px)]">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-white/40 text-xl font-light">
                    Inizia a parlare con Omny...
                  </p>
                  <p className="text-white/30 text-sm mt-2">
                    Clicca il microfono o scrivi un messaggio
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`max-w-[80%] px-6 py-4 rounded-3xl shadow-xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          : 'bg-gradient-to-br from-purple-500/40 to-purple-600/40 text-white border border-purple-400/30'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                          <div className="w-2 h-2 rounded-full bg-purple-300"></div>
                          <span className="text-sm font-semibold">Omny</span>
                        </div>
                      )}
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

        </div>
      </Overlay>

    </div>
  );
};

export default OrganizationAssistant;

// Stili CSS dedicati per evitare conflitti
const styles = `
  .omny-chat-container {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    height: 100% !important;
    overflow-y: auto !important;
    background: rgba(0, 0, 0, 0.75) !important;
    backdrop-filter: blur(24px) !important;
    border-radius: 0 !important;
    padding-top: 130px !important;
    padding-left: 24px !important;
    padding-right: 24px !important;
    padding-bottom: 120px !important;
    border: none !important;
    box-shadow: none !important;
    z-index: 10 !important;
  }

  .omny-chat-container > * + * {
    margin-top: 20px !important;
  }
`;

// Inietta gli stili
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
