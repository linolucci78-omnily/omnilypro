import React from 'react';
import { TicketData } from '../types';
import { QrCode, Ticket as TicketIcon } from 'lucide-react';

interface TicketProps {
  data: TicketData;
}

export const Ticket: React.FC<TicketProps> = ({ data }) => {
  if (!data.isGenerated) return null;

  return (
    <div className="w-full max-w-5xl mx-auto my-8 filter drop-shadow-2xl transform transition-transform hover:scale-[1.01] duration-300 print:transform-none print:shadow-none print:m-0 print:w-full print:h-screen print:flex print:items-center">
      {/* Wrapper for the ticket shape */}
      <div className="flex flex-col md:flex-row bg-[#fdfbf7] text-slate-900 rounded-xl overflow-hidden border-4 border-gold-500/30 print:border-4 print:border-black print:flex-row print:rounded-none w-full">
        
        {/* LEFT SIDE: Main Ticket Info */}
        <div className="flex-1 p-8 md:p-12 relative border-b-2 md:border-b-0 md:border-r-4 border-dashed border-slate-300 print:border-r-2 print:border-b-0 print:w-[75%]">
            
          {/* Decorative background elements (hidden in print) */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-60 h-60 bg-gold-100 rounded-full opacity-50 blur-3xl pointer-events-none print:hidden"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-purple-100 rounded-full opacity-50 blur-3xl pointer-events-none print:hidden"></div>

          {/* Header */}
          <div className="relative z-10 flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-2 text-gold-600 mb-2 print:text-black">
                <TicketIcon className="w-8 h-8" />
                <span className="text-sm font-bold tracking-[0.3em] uppercase">Biglietto Ufficiale</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-slate-900 leading-tight print:text-5xl">
                {data.eventName || "Evento Speciale"}
              </h1>
            </div>
            <div className="text-right hidden sm:block print:block">
               <p className="text-sm text-slate-500 uppercase tracking-wider print:text-black">Prezzo</p>
               <p className="text-3xl font-bold text-slate-900">€ {data.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Main Number - THE BIG NUMBER REQUESTED */}
          <div className="relative z-10 my-10 py-10 border-y-2 border-slate-200 text-center print:border-black print:py-6">
            <p className="text-sm text-slate-500 uppercase tracking-[0.5em] mb-4 print:text-black">Codice Vincente</p>
            <h2 className="font-mono text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-yellow-500 print:text-black print:bg-none tracking-tighter">
              {data.ticketNumber}
            </h2>
          </div>

          {/* Details Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-8 text-sm print:gap-4">
            <div>
              <p className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-2 print:text-black">Titolare del Biglietto</p>
              <p className="font-serif font-bold text-3xl text-slate-800">{data.customerName}</p>
            </div>
            <div className="text-right md:text-left">
              <p className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-2 print:text-black">Data Estrazione</p>
              <p className="font-semibold text-xl">{new Date(data.eventDate).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Fortune Footer */}
          <div className="relative z-10 mt-10 pt-6 border-t border-slate-100 italic text-slate-600 font-serif text-xl text-center print:text-black print:border-black">
            "{data.fortune}"
          </div>
          
          {/* Cutout Circles */}
          <div className="absolute -right-4 top-1/2 w-8 h-8 bg-slate-900 rounded-full transform -translate-y-1/2 z-20 hidden md:block print:hidden"></div>
          <div className="absolute -left-4 top-1/2 w-8 h-8 bg-slate-900 rounded-full transform -translate-y-1/2 z-20 hidden md:block print:hidden"></div>
        </div>

        {/* RIGHT SIDE: Stub (Tear-off) */}
        <div className="w-full md:w-96 bg-slate-50 p-8 flex flex-col justify-between relative print:w-[25%] print:bg-white print:border-l-2 print:border-black">
            {/* Cutout for perforation match */}
            <div className="absolute -left-4 top-1/2 w-8 h-8 bg-slate-900 rounded-full transform -translate-y-1/2 z-20 hidden md:block print:hidden"></div>

            <div className="text-center md:text-left">
                <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2 line-clamp-2">{data.eventName}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{new Date(data.eventDate).toLocaleDateString('it-IT')}</p>
            </div>

            <div className="my-6 flex flex-col items-center justify-center space-y-4">
                <div className="w-40 h-40 bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-center print:border-black">
                   {/* Fake QR Code visual */}
                   <QrCode className="w-full h-full text-slate-900" />
                </div>
                <p className="font-mono text-xl font-bold text-slate-500 tracking-widest print:text-black">{data.id.slice(0, 6).toUpperCase()}</p>
            </div>

            <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-2 md:hidden">€ {data.price.toFixed(2)}</div>
                <p className="text-[10px] text-slate-400 uppercase leading-tight print:text-black">
                    Conservare con cura.<br/>Vale come ricevuta.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};