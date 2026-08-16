import React, { useState, useRef, useEffect } from 'react';
import { askAssistant, generateDailyExecutiveDigest } from '../lib/ai';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { useStopsStore } from '../store/stops';
import toast from 'react-hot-toast';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { orders, production_entries, articles, cartons, bons_de_commande } = useMesStore();
  const { machines } = useProductionStore();
  const { stops } = useStopsStore();

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isOpen]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: queryText }]);
    setInput('');
    setLoading(true);

    const contextData = {
      orders: orders.filter(o => o.status !== 'Closed' && (o.status as any) !== 'Terminé'),
      production_entries: production_entries.slice(0, 25),
      articles: articles.slice(0, 20).map(a => ({ id: a.id, reference: a.reference, designation: a.designation })),
      cartons: cartons.slice(0, 20).map(c => ({ carton_number: c.carton_number, status: c.status, quantity: c.quantity })),
      bons_de_commande: bons_de_commande.filter(b => b.status !== 'Terminé'),
      machines: machines.map(m => ({ id: m.id, name: m.name, code: m.code, status: m.status })),
      stops: stops.slice(0, 10)
    };

    const recentMessages = messages.slice(-6);
    const aiRes = await askAssistant(queryText, contextData, recentMessages);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiRes }]);
    setLoading(false);
  };

  const handleSend = () => {
    sendQuery(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendQuery(prompt);
  };

  const quickPrompts = [
    { label: '📋 Briefing du jour', query: 'Fais-moi un briefing complet sur la production et les ordres en cours aujourd\'hui.' },
    { label: '⚙️ État des machines', query: 'Quel est l\'état actuel de toutes les machines et y a-t-il des arrêts signalés ?' },
    { label: '🚨 Ordres urgents', query: 'Quels sont les ordres de fabrication à priorité Haute qui restent à produire ?' },
    { label: '⚠️ Analyse des pertes', query: 'Quel est le volume de déchets récent et quelles sont les causes principales ?' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] sm:w-[420px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">Assistant Usine IA</h4>
                <p className="text-[10px] text-blue-200 mt-0.5">FactoryFlow TN • Google Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="my-auto flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1">Posez une question sur votre usine</h5>
                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                  Interrogez en direct les indicateurs de production, les arrêts machines et les commandes en cours.
                </p>

                {/* Quick Prompts */}
                <div className="flex flex-col gap-2 w-full">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPrompt(p.query)}
                      className="text-left text-xs font-semibold px-3 py-2 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl transition-all shadow-2xs"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm bg-blue-600 text-white rounded-br-xs shadow-sm">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-sm leading-relaxed">
                      <div 
                        className="prose prose-xs max-w-none text-slate-800"
                        dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} 
                      />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question usine..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-blue-500/30"
      >
        <span className="material-symbols-outlined text-[28px]">{isOpen ? 'close' : 'smart_toy'}</span>
      </button>
    </div>
  );
}
