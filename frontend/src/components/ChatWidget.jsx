import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Calendar, Bot, User, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const PROMPTS = {
  en: [
    "What is the price of a 3 BHK in Shivalik Grand?",
    "What amenities does Shivalik Grand offer?",
    "What is the RERA registration number?",
    "Is Aavkar Residency near a metro station?",
    "Can I schedule a site visit?",
    "What is the maximum discount on 3 BHK?",
  ],
  hi: [
    "Shivalik Grand में 3 BHK की कीमत क्या है?",
    "क्या-क्या सुख-सुविधाएं (Amenities) उपलब्ध हैं?",
    "RERA रजिस्ट्रेशन नंबर क्या है?",
    "क्या Aavkar Residency मेट्रो स्टेशन के पास है?",
    "मुझे साइट विजिट बुक करनी है।",
    "क्या 10% डिस्काउंट मिल सकता है?",
  ],
  gu: [
    "Shivalik Grand માં 3 BHK નો ભાવ શું છે?",
    "કઈ કઈ સુવિધાઓ (Amenities) આપવામાં આવી છે?",
    "ગુજરાત રેરા (GUJRERA) નંબર શું છે?",
    "શું Aavkar Residency મેટ્રો સ્ટેશન નજીક છે?",
    "હું સાઇટ મુલાકાત (Site Visit) કરવા માંગુ છું.",
    "શું ફાઇનલ ભાવમાં ડિસ્કાઉન્ટ મળશે?",
  ],
};

const PLACEHOLDERS = {
  en: "Ask about floor plans, pricing, RERA, possession, or amenities...",
  hi: "फ्लैट्स, मूल्य, RERA, पोजीशन या एमिनिटीज के बारे में पूछें...",
  gu: "ભાવ, ફ્લોર પ્લાન, રેરા કે સુવિધાઓ વિશે પૂછો...",
};

export default function ChatWidget({ language, selectedProject, onOpenBookingModal }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: language === 'gu'
        ? 'નમસ્તે! હું આપનો અમદાવાદ રિયલ એસ્ટેટ AI સહાયક છું. Shivalik Grand અને Aavkar Residency વિશે કોઈપણ પ્રશ્ન પૂછો.'
        : language === 'hi'
        ? 'नमस्ते! मैं आपका अहमदाबाद रियल एस्टेट AI सलाहकार हूँ। Shivalik Grand और Aavkar Residency के बारे में कोई भी प्रश्न पूछें।'
        : 'Welcome! I am your Ahmedabad Real Estate AI Advisor. Ask me anything about Shivalik Grand or Aavkar Residency fact-sheets.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await api.sendChatMessage({
        message: text,
        language,
        projectId: selectedProject?.id || null,
      });

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: resp.reply,
        handoffRequired: resp.handoff_required,
        handoffReason: resp.handoff_reason,
        suggestedAction: resp.suggested_action,
        matchedCategory: resp.matched_category,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `⚠️ Network error: ${err.message}. Please check if backend is running on port 8000.`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallbackClick = () => {
    setCallbackRequested(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: language === 'gu'
            ? 'આપની કૉલબૅક વિનંતી નોંધાઈ ગઈ છે. અમારા વરિષ્ઠ સેલ્સ એક્ઝિક્યુટિવ રાહુલ ચૌહાણ ટૂંક સમયમાં આપનો સંપર્ક કરશે.'
            : language === 'hi'
            ? 'आपका कॉलबैक अनुरोध दर्ज कर लिया गया है। हमारे वरिष्ठ बिक्री सलाहकार राहुल चौहान शीघ्र ही आपसे संपर्क करेंगे।'
            : 'Your callback request has been logged. Our Senior Sales Executive, Rahul Chouhan, will reach out to you shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[650px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-gold-500/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                Ahmedabad Property AI Advisor
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                Grounded
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {selectedProject ? `Focused on ${selectedProject.name}` : 'Knowledge base: Shivalik Grand & Aavkar Residency'}
            </div>
          </div>
        </div>

        {/* Quick action button in header */}
        <button
          onClick={onOpenBookingModal}
          className="text-xs px-3 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 flex items-center gap-1.5 transition-all font-medium"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Visit</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-gold-500 text-slate-950'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                  : msg.isError
                  ? 'bg-rose-950/80 border border-rose-800 text-rose-200 rounded-tl-none'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Category pill if grounded */}
              {msg.matchedCategory && (
                <div className="mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-400 bg-gold-950/60 border border-gold-800/40 px-2 py-0.5 rounded">
                    Fact Sheet • {msg.matchedCategory}
                  </span>
                </div>
              )}

              {/* Message text */}
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Guardrail alert box */}
              {msg.handoffRequired && (
                <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>RERA & Pricing Policy Guardrail</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 mb-2">
                    Official RERA guidelines prohibit automatic discount quotes without registered developer approval.
                  </p>
                  <button
                    onClick={handleCallbackClick}
                    disabled={callbackRequested}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 disabled:opacity-50"
                  >
                    {callbackRequested ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Callback Scheduled</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Connect with Sales Executive</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Booking Intent card */}
              {msg.suggestedAction === 'open_booking_form' && (
                <div className="mt-3 p-3 rounded-xl bg-gold-950/40 border border-gold-700/60 text-gold-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-gold-300 mb-1">
                    <Calendar className="w-4 h-4 text-gold-400" />
                    <span>Real-Time Site Visit Booking</span>
                  </div>
                  <p className="text-[11px] text-gold-200/80 mb-2">
                    Pick a 1-hour slot (Mon–Sat, 10 AM – 5 PM IST) to visit the property in person.
                  </p>
                  <button
                    onClick={onOpenBookingModal}
                    className="w-full py-1.5 px-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-slate-950 font-semibold flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 shadow-md shadow-gold-500/10"
                  >
                    <span>View Available Slots & Book Now</span>
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-500 text-slate-950 flex items-center justify-center text-xs font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700/60 text-xs text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse delay-75"></span>
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse delay-150"></span>
              <span className="ml-1 text-slate-400">Verifying fact-sheets...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
        <span className="text-[11px] text-slate-500 flex items-center gap-1 py-1 font-medium">
          <Sparkles className="w-3 h-3 text-gold-400" />
          Suggested:
        </span>
        {(PROMPTS[language] || PROMPTS.en).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex-shrink-0 active:scale-95 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.en}
          disabled={loading}
          className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:hover:bg-gold-500 text-slate-950 flex items-center justify-center transition-all shadow-md shadow-gold-500/10 active:scale-95 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

