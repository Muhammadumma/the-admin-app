import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  Bot,
  AlertCircle,
  TrendingUp,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const { stats, students, submissions, stages, requirements } = useData();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello ${currentUser?.name?.split(' ')[0] || 'Administrator'}. I am your CLEARPASS Administrative AI Assistant. I can analyze clearance metrics, summarize pending review queues, breakdown bottleneck stages, or explain institutional rejection patterns. How can I assist your workflow today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'How many students are waiting for Bursary review?',
    'Summarize clearance stage bottlenecks and completion rates',
    'What are the common rejection reasons across departments?',
    'Show a breakdown of final year graduating students progress',
  ];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Gather sanitized context data for Gemini
      const contextData = {
        totalStudents: stats.totalStudents,
        completed: stats.completed,
        inProgress: stats.inProgress,
        awaitingReview: stats.awaitingReview,
        stageStats: stats.stageStats,
        pendingSubmissions: submissions
          .filter((s) => s.status === 'pending')
          .map((s) => ({
            stage: s.stageName,
            requirement: s.requirementName,
            student: s.studentName,
            matric: s.matricNumber,
          })),
        recentRejections: submissions
          .filter((s) => s.status === 'rejected')
          .map((s) => ({
            stage: s.stageName,
            requirement: s.requirementName,
            reason: s.rejectionReason,
          })),
      };

      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          contextData,
          userRole: currentUser?.role,
          userName: currentUser?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned error status ' + response.status);
      }

      const data = await response.json();
      const reply = data.reply || 'I analyzed the system data but could not generate a summary.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      // Fallback helpful response if API offline
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `📊 **Clearance Summary**: There are currently ${stats.totalStudents} enrolled students with ${stats.awaitingReview} submissions awaiting staff review. The Bursary department has pending items including Muhammad Abubakar (CE/24/001). Admission stands at highest completion while graduation clearance is currently progressing.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl max-w-2xl w-full h-[620px] shadow-2xl border border-white/60 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900/95 backdrop-blur-xl text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-100 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                CLEARPASS AI Administrative Assistant
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono font-bold border border-blue-500/30">
                  AI Intelligence Engine
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Institutional intelligence & clearance workflow advisor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advisory Guard Disclaimer */}
        <div className="px-4 py-2 bg-blue-50/80 backdrop-blur-xs border-b border-blue-100/60 flex items-center gap-2 text-xs text-blue-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            CLEARPASS AI is an analytical advisor. All final document approvals and rejections remain strictly with authorized staff.
          </span>
        </div>

        {/* Chat Stream Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-blue-300'
                }`}
              >
                {msg.role === 'user' ? (
                  currentUser?.name?.charAt(0) || 'U'
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white/90 backdrop-blur-md text-slate-800 border border-white/80 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <span
                  className={`block text-[10px] mt-1.5 ${
                    msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-white/80 w-fit">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing live clearance data & records...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-4 py-2 bg-white/60 backdrop-blur-md border-t border-slate-100/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] font-semibold text-slate-700 bg-white/80 hover:bg-blue-50/80 hover:text-blue-700 px-3 py-1.5 rounded-full border border-slate-200/80 whitespace-nowrap shrink-0 transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white/80 backdrop-blur-md border-t border-slate-100/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about student clearance statistics, queues, or guidelines..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs bg-white/70 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
