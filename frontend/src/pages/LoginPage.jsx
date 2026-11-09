import React, { useState } from 'react';
import { Building2, Lock, Mail, ShieldCheck, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLoginSuccess, onCancel }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user.role === 'sales_head') {
        onLoginSuccess('admin');
      } else if (user.role === 'sales_executive') {
        onLoginSuccess('dashboard');
      } else {
        onLoginSuccess('buyer');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-gold-500 selection:text-slate-950">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto shadow-xl shadow-gold-500/20">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-wider text-white">
            AHMEDABAD <span className="text-gold-400">REALTY</span>
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
            Staff Portal • Lead Management & Admin Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.chouhan@realty.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold text-sm transition-all shadow-md shadow-gold-500/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold text-center mb-2 flex items-center justify-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-gold-400" />
              <span>One-Click Role Demo Logins</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('amit.desai@realty.in', 'HeadPass@2025')}
              className="w-full py-2 px-3 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left text-xs flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-white group-hover:text-gold-400">Amit Desai</span>
                <span className="text-[11px] text-slate-400 ml-1.5">(Sales Head • Admin)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rahul.chouhan@realty.in', 'Exec@2025!')}
              className="w-full py-2 px-3 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left text-xs flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-white group-hover:text-gold-400">Rahul Chouhan</span>
                <span className="text-[11px] text-slate-400 ml-1.5">(Sales Executive)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
            </button>
          </div>
        </div>

        {/* Back to buyer portal link */}
        <div className="text-center">
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-gold-400 transition-colors"
          >
            ← Return to Public Buyer Portal
          </button>
        </div>
      </div>
    </div>
  );
}

