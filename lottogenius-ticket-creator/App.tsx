import React, { useState, useRef, useEffect } from 'react';
import { TicketData } from './types';
import { generateLuckyTicketDetails } from './services/geminiService';
import { Ticket } from './components/Ticket';
import { Printer, Wand2, RefreshCw, Ticket as TicketIcon, Users, Trophy, Sparkles, Zap, Play, RotateCcw, History, Crown, X, Maximize2 } from 'lucide-react';

const INITIAL_STATE: TicketData = {
  id: '',
  customerName: '',
  eventName: 'Gran Lotteria Nazionale',
  eventDate: new Date().toISOString().split('T')[0],
  ticketNumber: '---',
  fortune: '',
  price: 5.00,
  isGenerated: false,
};

type ExtractionPhase = 'idle' | 'countdown' | 'spinning' | 'slowing' | 'tease' | 'locked' | 'celebrating';

const App: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState<TicketData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  
  // App Mode: 'generator' | 'extraction'
  const [mode, setMode] = useState<'generator' | 'extraction'>('generator');
  
  // Data Store
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [winners, setWinners] = useState<TicketData[]>([]); // Track history of winners
  
  // Extraction State
  const [extractionPhase, setExtractionPhase] = useState<ExtractionPhase>('idle');
  const [currentWinner, setCurrentWinner] = useState<TicketData | null>(null);
  const [extractionDisplay, setExtractionDisplay] = useState("000-000");
  const [countdownValue, setCountdownValue] = useState(3);
  
  // Refs for animation control
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName) return;

    setIsLoading(true);
    
    try {
      const geminiData = await generateLuckyTicketDetails(formData.customerName, formData.eventName);
      
      const newTicket: TicketData = {
        ...formData,
        id: crypto.randomUUID(),
        ticketNumber: geminiData.luckyNumber,
        fortune: geminiData.fortune,
        isGenerated: true
      };

      setFormData(newTicket);
      // Add to pool automatically
      setTickets(prev => [...prev, newTicket]);

    } catch (err) {
      console.error("Failed to generate ticket details", err);
      alert("Si è verificato un errore durante la generazione del biglietto.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetForm = () => {
    setFormData({ 
        ...INITIAL_STATE, 
        eventName: formData.eventName, 
        eventDate: formData.eventDate,
        price: formData.price 
    });
  };

  const handleResetGame = () => {
      if(confirm("Sei sicuro di voler resettare la partita? I vincitori saranno azzerati.")) {
          setWinners([]);
          setExtractionPhase('idle');
          setExtractionDisplay("000-000");
          setCurrentWinner(null);
      }
  };

  // --- CINEMATIC EXTRACTION LOGIC ---
  const runLotterySequence = () => {
    // Filter out tickets that have already won
    const availableTickets = tickets.filter(t => !winners.some(w => w.id === t.id));

    if (availableTickets.length === 0) {
        if (tickets.length === 0) {
            alert("Nessun biglietto generato! Crea prima dei biglietti.");
        } else {
            alert("Tutti i biglietti sono stati estratti! Resetta il gioco per ricominciare.");
        }
        return;
    }

    // 0. COUNTDOWN PHASE
    setExtractionPhase('countdown');
    setCountdownValue(3);
    
    const countdownInterval = setInterval(() => {
        setCountdownValue(prev => {
            if (prev <= 1) {
                clearInterval(countdownInterval);
                startSpinning(availableTickets); // Start actual spin
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const startSpinning = (availableTickets: TicketData[]) => {
    // 1. Setup
    setExtractionPhase('spinning');
    setCurrentWinner(null);
    
    // Select winner
    const randomIndex = Math.floor(Math.random() * availableTickets.length);
    const winner = availableTickets[randomIndex];

    // Find a "fake" loser to stop on briefly (The Tease)
    let teaseTicket = availableTickets[(randomIndex + 1) % availableTickets.length];
    // If there's only 1 ticket, tease ticket is the same, so we create a fake number
    if (availableTickets.length === 1) {
        teaseTicket = { ...winner, ticketNumber: "???" };
    }

    let speed = 50; // Initial speed (ms)
    const minDuration = 2500; // Minimum fast spin time
    const startTime = Date.now();

    const spinLoop = () => {
        // Visual trick: Display ANY ticket from the full pool during spin for variety
        const randomVisualTicket = tickets[Math.floor(Math.random() * tickets.length)];
        setExtractionDisplay(randomVisualTicket.ticketNumber);

        const elapsed = Date.now() - startTime;

        // Phase 2: Slow Down (Deceleration physics)
        if (elapsed > minDuration) {
            if (extractionPhase !== 'slowing') setExtractionPhase('slowing');
            speed = speed * 1.15; // Decelerate by 15% each tick
        }

        // Phase 3: THE TEASE (Stop on wrong number)
        if (speed > 600) {
            setExtractionPhase('tease');
            setExtractionDisplay(teaseTicket.ticketNumber); // Show wrong number
            
            // Hold the wrong number for a moment...
            setTimeout(() => {
                // CLICK! Move to real winner
                setExtractionDisplay(winner.ticketNumber);
                setExtractionPhase('locked');
                
                // Heartbeat phase (Locked)
                setTimeout(() => {
                    setCurrentWinner(winner);
                    setWinners(prev => [winner, ...prev]); // Add to winners history
                    setExtractionPhase('celebrating');
                }, 2500); // Longer wait for max tension
                
            }, 800); // Tease duration
            
            return; // End loop
        }

        animationRef.current = setTimeout(spinLoop, speed);
    };

    spinLoop();
  };

  // Cleanup animation on unmount
  useEffect(() => {
      return () => {
          if (animationRef.current) clearTimeout(animationRef.current);
      };
  }, []);

  // Calculate remaining players
  const remainingPlayers = tickets.length - winners.length;

  // Helper to close overlay
  const closeOverlay = () => {
      setExtractionPhase('idle');
      setExtractionDisplay("000-000");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-200">
      
      {/* --- CINEMATIC FULL SCREEN OVERLAY --- */}
      {extractionPhase !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-100"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            
            {/* Spotlight Effect */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 rounded-full blur-[120px] transition-all duration-1000 
                ${extractionPhase === 'locked' ? 'bg-red-900/20 scale-110' : ''}
                ${extractionPhase === 'celebrating' ? 'bg-gold-500/30 scale-150' : ''}
            `}></div>

            {/* CONTENT CONTAINER */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-4">
                
                {/* PHASE: COUNTDOWN */}
                {extractionPhase === 'countdown' && (
                    <div className="text-[15rem] font-black text-white animate-ping duration-1000">
                        {countdownValue}
                    </div>
                )}

                {/* PHASE: SPINNING / TEASE / LOCKED */}
                {(extractionPhase === 'spinning' || extractionPhase === 'slowing' || extractionPhase === 'tease' || extractionPhase === 'locked') && (
                    <div className="flex flex-col items-center gap-8">
                        <div className="text-gold-500 uppercase tracking-[0.5em] text-xl animate-pulse">
                            {extractionPhase === 'tease' ? 'Attenzione...' : 'Estrazione in corso'}
                        </div>
                        
                        <div className={`
                            font-mono text-7xl md:text-9xl font-black transition-all duration-200
                            ${extractionPhase === 'spinning' ? 'text-slate-300 blur-sm scale-95' : ''}
                            ${extractionPhase === 'slowing' ? 'text-gold-200 scale-100' : ''}
                            ${extractionPhase === 'tease' ? 'text-slate-400 scale-100 rotate-1' : ''}
                            ${extractionPhase === 'locked' ? 'text-white scale-125 drop-shadow-[0_0_35px_rgba(255,0,0,0.8)] animate-[pulse_0.6s_ease-in-out_infinite]' : ''}
                        `}>
                            {extractionDisplay}
                        </div>

                        {extractionPhase === 'locked' && (
                            <p className="text-red-500 uppercase tracking-widest text-sm animate-pulse mt-8">Verifica vincitore...</p>
                        )}
                    </div>
                )}

                {/* PHASE: CELEBRATING */}
                {extractionPhase === 'celebrating' && currentWinner && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-500">
                         <div className="mb-6 text-gold-400 uppercase tracking-[0.5em] text-xl">Vincitore Confermato</div>
                         
                         <h1 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold-200 via-gold-400 to-gold-600 text-center mb-8 drop-shadow-2xl">
                            {currentWinner.customerName}
                         </h1>
                         
                         <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex flex-col items-center gap-2 mb-12 transform rotate-[-2deg]">
                            <span className="text-slate-400 text-sm uppercase tracking-widest">Biglietto Vincente</span>
                            <span className="text-4xl font-mono font-bold text-white">{currentWinner.ticketNumber}</span>
                         </div>

                         <div className="flex gap-4">
                            <button 
                                onClick={closeOverlay}
                                className="bg-white text-black hover:bg-slate-200 font-bold py-4 px-10 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <X className="w-5 h-5" /> Chiudi Show
                            </button>
                         </div>

                         {/* Confetti Particles (CSS Only representation) */}
                         <div className="absolute inset-0 pointer-events-none overflow-hidden w-screen h-screen">
                             {[...Array(20)].map((_, i) => (
                                 <div key={i} className={`absolute w-3 h-3 bg-gold-500 rounded-sm animate-[spin_3s_linear_infinite]`} 
                                      style={{
                                          top: `${Math.random() * 100}%`, 
                                          left: `${Math.random() * 100}%`,
                                          animationDelay: `${Math.random() * 2}s`,
                                          opacity: 0.6
                                      }}></div>
                             ))}
                         </div>
                    </div>
                )}
            </div>
        </div>
      )}


      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:p-6 no-print sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMode('generator')}>
                <div className="bg-gold-500 p-2 rounded-lg shadow-lg shadow-gold-500/20">
                    <TicketIcon className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white tracking-tight">LottoGenius</h1>
                    <p className="text-slate-400 text-xs uppercase tracking-widest">Sistema Lotteria Integrato</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setMode('generator')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${mode === 'generator' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    <Wand2 className="w-4 h-4" />
                    Generazione
                </button>
                <button 
                    onClick={() => setMode('extraction')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${mode === 'extraction' ? 'bg-gold-600 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    <Trophy className="w-4 h-4" />
                    Estrazione
                    <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{tickets.length}</span>
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-8 gap-8 relative w-full max-w-7xl mx-auto">
        
        {/* --- MODE: GENERATOR --- */}
        {mode === 'generator' && (
            <>
                {/* FORM SECTION */}
                <section className={`w-full max-w-lg transition-all duration-500 no-print ${formData.isGenerated ? 'hidden' : 'block'}`}>
                    <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300">
                            Nuovo Biglietto
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Inserisci i dati del partecipante per generare un numero univoco.
                        </p>
                    </div>

                    <form onSubmit={handleGenerate} className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                        <div className="space-y-2 relative z-10">
                            <label className="text-xs font-bold text-gold-500 uppercase tracking-widest">Nome Partecipante</label>
                            <input 
                                type="text" 
                                name="customerName"
                                required
                                value={formData.customerName}
                                onChange={handleInputChange}
                                placeholder="Es. Mario Rossi"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all text-lg"
                            />
                        </div>

                        <div className="space-y-2 relative z-10">
                            <label className="text-xs font-bold text-gold-500 uppercase tracking-widest">Nome Evento</label>
                            <input 
                                type="text" 
                                name="eventName"
                                required
                                value={formData.eventName}
                                onChange={handleInputChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold-500 uppercase tracking-widest">Data</label>
                                <input 
                                    type="date" 
                                    name="eventDate"
                                    required
                                    value={formData.eventDate}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold-500 uppercase tracking-widest">Prezzo (€)</label>
                                <input 
                                    type="number" 
                                    name="price"
                                    min="0"
                                    step="0.50"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-slate-950 font-black py-4 px-6 rounded-lg flex items-center justify-center gap-3 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 uppercase tracking-wider relative z-10"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                                    <span>Generazione in corso...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    <span>Genera Biglietto</span>
                                </>
                            )}
                        </button>
                    </form>
                </section>

                {/* RESULT SECTION */}
                {formData.isGenerated && (
                    <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <div className="no-print text-center">
                            <h2 className="text-3xl font-serif font-bold text-white mb-2">Biglietto Creato!</h2>
                            <p className="text-slate-400">Il biglietto è stato salvato nel sistema di estrazione.</p>
                        </div>

                        <div ref={ticketRef} className="w-full">
                            <Ticket data={formData} />
                        </div>

                        <div className="flex gap-4 no-print flex-wrap justify-center">
                            <button 
                                onClick={handleResetForm}
                                className="bg-slate-800 text-white hover:bg-slate-700 font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Nuovo Biglietto
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 px-8 rounded-full flex items-center gap-2 shadow-lg shadow-white/10 transition-all transform hover:scale-105"
                            >
                                <Printer className="w-5 h-5" />
                                Stampa Subito
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* --- MODE: EXTRACTION (DASHBOARD) --- */}
        {mode === 'extraction' && (
            <div className="w-full max-w-6xl">
                
                {/* Game Stats Bar */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 px-4 border-b border-slate-800 pb-6 gap-4">
                    <div className="flex gap-12">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Biglietti Totali</p>
                            <p className="text-3xl text-white font-serif font-bold">{tickets.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">In Gara</p>
                            <p className="text-3xl text-gold-500 font-serif font-bold">{remainingPlayers}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Vincitori</p>
                            <p className="text-3xl text-green-400 font-serif font-bold">{winners.length}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                         {winners.length > 0 && (
                            <button 
                                onClick={handleResetGame}
                                className="text-xs text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-2 border border-red-900/50 hover:bg-red-900/20 px-4 py-2 rounded transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        )}
                        <button 
                            onClick={runLotterySequence}
                            disabled={remainingPlayers === 0}
                            className="bg-gradient-to-r from-gold-600 to-gold-400 text-slate-900 font-bold py-3 px-8 rounded-lg flex items-center gap-2 hover:from-gold-500 hover:to-gold-300 transform hover:-translate-y-1 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                        >
                            <Maximize2 className="w-5 h-5" />
                            {winners.length === 0 ? "Avvia Show" : "Estrai Prossimo"}
                        </button>
                    </div>
                </div>

                {/* DASHBOARD GRID */}
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: HALL OF FAME */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-gold-500" />
                                    <h3 className="font-bold text-white">Hall of Fame</h3>
                                </div>
                            </div>
                            <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                                {winners.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-2">
                                        <Trophy className="w-10 h-10 opacity-20" />
                                        <p className="text-sm italic">In attesa del primo vincitore...</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {winners.map((w, idx) => (
                                            <li key={w.id} className="bg-gradient-to-r from-slate-800 to-transparent p-4 rounded-xl border-l-4 border-gold-500 relative group">
                                                <div className="absolute top-0 right-0 text-[5rem] font-serif font-bold text-slate-800/50 -mt-6 -mr-2 z-0 pointer-events-none group-hover:text-gold-900/20 transition-colors">
                                                    {winners.length - idx}
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-gold-400 text-xs font-mono mb-1">{w.ticketNumber}</p>
                                                    <p className="text-white font-bold text-lg leading-tight">{w.customerName}</p>
                                                    <p className="text-slate-500 text-xs mt-1">{w.eventName}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: TICKET POOL */}
                    <div className="lg:col-span-2">
                         <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl h-full">
                             <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-slate-400" />
                                    <h3 className="font-bold text-slate-300">Partecipanti in Gara</h3>
                                </div>
                                <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300">
                                    {remainingPlayers} / {tickets.length}
                                </span>
                            </div>
                            
                            <div className="p-4">
                                {remainingPlayers === 0 && tickets.length > 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-xl">
                                        <Sparkles className="w-12 h-12 text-gold-600 mb-4" />
                                        <h3 className="text-2xl font-serif text-white mb-2">Estrazione Completata!</h3>
                                        <p className="text-slate-500">Tutti i biglietti sono stati estratti.</p>
                                    </div>
                                ) : tickets.length === 0 ? (
                                     <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-xl">
                                        <TicketIcon className="w-12 h-12 text-slate-700 mb-4" />
                                        <p className="text-slate-500">Nessun biglietto generato.<br/>Torna alla generazione per iniziare.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {tickets.map(t => {
                                            const isWinner = winners.some(w => w.id === t.id);
                                            if (isWinner) return null;
                                            return (
                                                <div key={t.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                                                            <TicketIcon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-300 font-medium text-sm">{t.customerName}</p>
                                                            <p className="text-slate-600 text-xs">{t.eventName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono text-gold-500/70 font-bold">{t.ticketNumber}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>

                </div>
            </div>
        )}

      </main>
      
      <footer className="p-6 text-center text-slate-700 text-xs no-print border-t border-slate-900 bg-slate-950">
        &copy; {new Date().getFullYear()} LottoGenius. Sistema Certificato AI.
      </footer>
    </div>
  );
};

export default App;