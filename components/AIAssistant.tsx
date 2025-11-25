import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Send, Bot } from 'lucide-react';
import { AIInsight, Transaction } from '../types.ts';
import { analyzeFinances, chatWithAdvisor } from '../services/geminiService.ts';

interface AIAssistantProps {
  transactions: Transaction[];
  totalBalance: number;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ transactions, totalBalance }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      const data = await analyzeFinances(transactions, totalBalance);
      setInsights(data);
      setLoadingInsights(false);
    };

    fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, totalBalance]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSending(true);

    const context = `Баланс: ${totalBalance}. Последние транзакции: ${JSON.stringify(transactions.slice(0, 5))}`;
    const response = await chatWithAdvisor(userMsg, context);

    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Top Header & Insights */}
      <div className="bg-indigo-600 pt-10 px-4 pb-4 text-white shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-2 mb-4">
           <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
             <Sparkles className="text-yellow-300" size={20} />
           </div>
           <div>
             <h3 className="font-bold text-lg leading-tight">Gemini Advisor</h3>
             <p className="text-xs text-indigo-200">Ваш личный финансист</p>
           </div>
        </div>
        
        {/* Insights Carousel (Collapsible ideally, but kept compact) */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
           {loadingInsights ? (
             <div className="bg-white/10 p-3 rounded-xl w-full flex items-center gap-2 border border-white/10">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-xs">Анализирую ваши расходы...</span>
             </div>
           ) : (
             insights.map((insight, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-xl min-w-[220px] max-w-[220px] border border-white/10 shrink-0">
                   <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${insight.type === 'warning' ? 'bg-orange-400' : 'bg-emerald-400'}`}></div>
                      <p className="font-bold text-xs text-white truncate">{insight.title}</p>
                   </div>
                   <p className="text-[11px] text-indigo-100 line-clamp-3 leading-relaxed opacity-90">{insight.description}</p>
                </div>
             ))
           )}
        </div>
      </div>

      {/* Chat Area - Expands to fill space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center opacity-60 p-8">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Bot size={32} className="text-indigo-400" />
             </div>
             <p className="text-sm font-medium text-slate-500">Я готов помочь с финансами.</p>
             <p className="text-xs mt-2 max-w-[200px]">Спросите меня о балансе, расходах или советах по экономии.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              m.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center">
              <Loader2 className="animate-spin text-indigo-600" size={16} />
              <span className="text-xs text-slate-400">Печатает...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-[90px]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задайте вопрос..."
            className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 placeholder-slate-400 transition-shadow"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="bg-indigo-600 text-white w-14 h-14 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};