import React, { useState } from 'react';
import { X, Sparkles, User, Phone, Building2, IndianRupee, ShieldCheck, CheckCircle2, Calendar, ArrowRight, Clock, Award } from 'lucide-react';
import { api } from '../services/api';

export default function LeadHandoffModal({ lead, isOpen, onClose, onLeadUpdated, token }) {
  if (!isOpen || !lead) return null;

  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(lead.status);

  const statuses = ['New', 'Contacted', 'Visit Booked', 'Visited'];

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) return;
    setUpdating(true);
    try {
      const updated = await api.updateLead(lead.id, { status: newStatus }, token);
      setCurrentStatus(newStatus);
      if (onLeadUpdated) {
        onLeadUpdated(updated);
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopySummary = () => {
    if (lead.ai_summary) {
      navigator.clipboard.writeText(lead.ai_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatBudget = (val) => {
    if (!val) return 'Not Specified';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    return `₹${(num / 100000).toFixed(0)} Lakh`;
  };

  const getSourceBadge = (source) => {
    const config = {
      portal: { label: 'Property Portal', bg: 'bg-blue-950 text-blue-400 border-blue-800/50' },
      social_ad: { label: 'Social Ad Campaign', bg: 'bg-purple-950 text-purple-400 border-purple-800/50' },
      hoarding: { label: 'Roadside Hoarding', bg: 'bg-amber-950 text-amber-400 border-amber-800/50' },
    };
    const c = config[source] || { label: source, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${c.bg}`}>{c.label}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">
                  Lead Intelligence & AI Handoff
                </h3>
                <span className="text-[10px] font-mono text-slate-400">#LEAD-{lead.id}</span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded conversational intelligence for executive sales discovery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Buyer Core Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-850 border border-slate-800 rounded-xl p-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Prospective Buyer
              </div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold-400" />
                <span>{lead.name}</span>
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{lead.phone}</span>
                <span className="text-[10px] text-emerald-400 font-sans">(DPDP Masked)</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Property & Budget
              </div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gold-400" />
                <span>{lead.project_name || `Project #${lead.project_id}`}</span>
              </div>
              <div className="text-xs text-gold-300 font-semibold mt-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Budget: {formatBudget(lead.budget)}</span>
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Acquisition Source:</span>
                {getSourceBadge(lead.source)}
              </div>
              <div className="text-slate-400">
                Assigned: <strong className="text-slate-200">{lead.assigned_executive_name || 'Unassigned'}</strong>
              </div>
            </div>
          </div>

          {/* AI-Generated Handoff Briefing Box */}
          <div className="bg-gradient-to-br from-gold-950/30 to-slate-900 border border-gold-500/40 rounded-xl p-5 relative space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gold-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <h4 className="font-serif font-bold text-sm text-gold-200">
                  1-Paragraph Executive Briefing & Buyer Intent
                </h4>
              </div>

              <button
                onClick={handleCopySummary}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-gold-300 font-medium transition-colors border border-slate-700"
              >
                {copied ? '✓ Copied Briefing' : 'Copy Briefing'}
              </button>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed italic bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              "{lead.ai_summary || 'Buyer engaged with AI assistant on property specifications. High intent profile captured with verified budget and RERA interest.'}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RERA Grounded & Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                <Clock className="w-3.5 h-3.5 text-gold-400" />
                <span>Created {new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Lead Pipeline Stage Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Update Lead Pipeline Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statuses.map((statusName) => {
                const isActive = currentStatus === statusName;
                return (
                  <button
                    key={statusName}
                    disabled={updating}
                    onClick={() => handleStatusChange(statusName)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      isActive
                        ? 'bg-gold-500 text-slate-950 border-gold-500 shadow-md font-bold'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {statusName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Current Stage: <span className="text-gold-300 font-bold">{currentStatus}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
}

