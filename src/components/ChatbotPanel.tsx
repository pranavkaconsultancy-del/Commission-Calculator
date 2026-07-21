import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, TrendingUp, HelpCircle, CornerDownLeft, AlertCircle } from 'lucide-react';
import { Broker, Project, Property, Sale, Commission, Payment } from '../types';

interface ChatbotPanelProps {
  brokers: Broker[];
  projects: Project[];
  properties: Property[];
  sales: Sale[];
  commissions: Commission[];
  payments: Payment[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  {
    text: "What's our pending commission?",
    icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />
  },
  {
    text: "Who's our top earning broker?",
    icon: <TrendingUp className="h-3.5 w-3.5 text-teal-500" />
  },
  {
    text: "What's our total commission this month?",
    icon: <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
  },
  {
    text: "How are we doing?",
    icon: <Sparkles className="h-3.5 w-3.5 text-purple-500" />
  }
];

export function ChatbotPanel({
  brokers,
  projects,
  properties,
  sales,
  commissions,
  payments,
  isOpen,
  onToggle
}: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your SyncAI interactive financial assistant. Ask me anything about totals, pending commission, top-earning brokers, project summaries, or specific flat sales. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    setError(null);
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: questionText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: questionText,
          contextData: {
            brokers,
            projects,
            properties,
            sales,
            commissions,
            payments
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from the AI assistant.');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: data.answer || "I'm sorry, I couldn't formulate an answer.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'assistant',
        text: "Sorry, I had trouble communicating with the server. Please verify your connection or check the application logs.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // Helper function to render text with linebreaks and list formatting
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check if line is a bullet item
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        const content = line.replace(/^[\s*-]+/, '').trim();
        return (
          <li key={idx} className="list-disc ml-5 mb-1 text-slate-200">
            {parseInlineFormatting(content)}
          </li>
        );
      }
      
      return (
        <p key={idx} className="mb-2 last:mb-0 leading-relaxed text-slate-200">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  // Helper to parse bold (**text**) in lines
  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-teal-400">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Chat Button (Bottom Right) */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-teal-500 hover:bg-teal-600 text-slate-900 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group border border-teal-400"
        title="Open SyncAI Interactive Assistant"
        id="floating-chat-button"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-slate-900" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-slate-900" />
            <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chatbot Slide-out Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-50 w-full max-w-[420px] h-[550px] bg-[#0F1F3D] border border-[#1e3256] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right"
          id="chatbot-drawer"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0B162B] to-[#0F1F3D] text-white flex items-center justify-between border-b border-[#1e3256]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-500/10 rounded-lg border border-teal-500/20">
                <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white uppercase">SYNCAI Assistant</h3>
                <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 inline-block animate-pulse" />
                  Grounded • Real-time Data
                </span>
              </div>
            </div>
            <button
              onClick={() => onToggle(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md"
              id="chatbot-close-header"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#091324] space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-teal-500 text-slate-900 rounded-br-none font-medium'
                      : 'bg-[#13233F] text-slate-200 rounded-bl-none border border-[#1e3256]'
                  }`}
                >
                  <div className="space-y-1">
                    {msg.sender === 'assistant' ? (
                      <ul className="list-none p-0 m-0">{renderMessageText(msg.text)}</ul>
                    ) : (
                      <p className="text-slate-900">{msg.text}</p>
                    )}
                  </div>
                  <span className="block text-[9px] mt-1.5 opacity-60 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading / Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#13233F] text-slate-200 rounded-2xl rounded-bl-none px-4 py-3 border border-[#1e3256] shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Error badge */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Suggestions (Shown above inputs) */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-[#0B162B] border-t border-[#1e3256] space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Example Questions</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.text)}
                    className="flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-[#13233F] text-slate-200 border border-[#1e3256] rounded-xl hover:border-teal-400 transition-all hover:shadow-sm"
                  >
                    {q.icon}
                    <span className="line-clamp-2 leading-snug">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form 
            onSubmit={handleFormSubmit}
            className="p-3 bg-[#0B162B] border-t border-[#1e3256] flex gap-2 items-center"
            id="chatbot-input-form"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SyncAI Assistant..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-[#13233F] text-white placeholder-slate-400 border border-[#1e3256] rounded-xl focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              disabled={isLoading}
              id="chatbot-input-field"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-teal-500 text-slate-900 rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-teal-500 transition-colors flex items-center justify-center border border-teal-400"
              id="chatbot-submit-button"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
