import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronRight } from 'lucide-react';
import { ChatMessage } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface AssistantProps {
  contextData: string;
}

const Assistant: React.FC<AssistantProps> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await getGeminiResponse(userMsg.text, contextData);
    
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const suggestions = [
    "Explain this concept simply",
    "How does this relate to real life?",
    "What happens if I increase temperature?",
    "Quiz me on this topic!"
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 group ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-brand-primary'}`}
        aria-label="Toggle AI Tutor"
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <>
             <MessageCircle size={28} className="text-white" />
             <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-secondary"></span>
              </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 w-[90vw] md:w-96 h-[600px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-dark p-5 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                 <Sparkles size={20} className="text-brand-secondary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg leading-tight">AI Tutor</h3>
                <p className="text-xs text-white/80 font-medium">Always here to help</p>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="text-xs text-white/60 hover:text-white underline">
                Clear
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scroll-smooth">
            
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-4">
                 <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Bot size={32} className="text-brand-primary" />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-lg">Hello! I'm your AI Tutor.</h4>
                   <p className="text-sm text-slate-500 mt-1">I can help you understand simulations, solve problems, or explain concepts.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-2 w-full">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(s)}
                        className="text-left text-sm p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-primary hover:text-brand-primary hover:shadow-sm transition-all flex items-center justify-between group"
                      >
                        {s}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg, idx) => (
              <div key={msg.id} className={`flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand-primary text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] p-4 text-sm shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-brand-primary text-white rounded-2xl rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center shadow-sm">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                   <span className="w-2 h-2 bg-brand-primary/50 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-brand-primary/50 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-brand-primary/50 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 bg-slate-100 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-slate-400"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1.5 p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand-primary transition-colors shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Assistant;