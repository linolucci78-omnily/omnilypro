import React, { ReactNode, useState, FormEvent } from 'react';
import { X, SendHorizontal, Mic } from 'lucide-react';

interface OverlayProps {
  children: ReactNode;
  onClose: () => void;
  isOpen: boolean;
  onSendText?: (text: string) => void;
  onStartListening?: () => void;
  isListening?: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ children, onClose, isOpen, onSendText, onStartListening, isListening }) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onSendText) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/95 animate-in fade-in duration-300">

      {/* Close Button (Top Right) */}
      <button
        onClick={onClose}
        className="omny-close-button"
      >
        <X size={28} />
      </button>

      <style>{`
        .omny-close-button {
          position: absolute !important;
          top: 48px !important;
          right: 48px !important;
          padding: 16px !important;
          border-radius: 50% !important;
          background: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.8) !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          z-index: 100 !important;
        }

        .omny-close-button:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }
      `}</style>

      {/* Content Container - FULL HEIGHT */}
      <div className="w-full h-full relative flex flex-col items-center justify-end pb-0">
        {children}

        {/* Controls Area - Floating at bottom */}
        <div className="absolute bottom-8 w-full max-w-md px-6 z-50 flex items-center justify-center gap-3">

          {/* Microphone Button */}
          <button
            type="button"
            onClick={onStartListening}
            disabled={isListening}
            className={`flex-shrink-0 p-4 rounded-full transition-all shadow-2xl ${
              isListening
                ? 'bg-red-500 animate-pulse'
                : 'bg-white/10 hover:bg-white/20'
            } text-white disabled:opacity-50 relative`}
            title="Parla con Omny"
          >
            <Mic size={24} />
            {isListening && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-white bg-red-500 px-2 py-1 rounded whitespace-nowrap">
                🎤 In ascolto...
              </span>
            )}
          </button>

          {/* Text Input Form - Centered and clean */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 relative group"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Scrivi a Omny..."
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-white/30 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all shadow-2xl hover:bg-white/10"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 disabled:opacity-0 disabled:hover:bg-transparent transition-all"
            >
              <SendHorizontal size={20} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Overlay;
