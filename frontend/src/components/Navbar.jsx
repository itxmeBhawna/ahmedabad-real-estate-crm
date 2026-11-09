import React from 'react';
import { Building2, Calendar, Globe, Sparkles, User, LogIn, LayoutDashboard, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ language, onLanguageChange, onOpenBookingModal, selectedProject, onNavigate, currentView }) {
  const { currentUser, isAuthenticated, isSalesHead } = useAuth();

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate && onNavigate('buyer')}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="font-serif text-lg font-bold tracking-wider text-white">
              AHMEDABAD <span className="text-gold-400">REALTY</span>
            </div>
            <div className="text-[11px] text-slate-400 tracking-widest uppercase flex items-center gap-1.5 font-medium">
              <span>RERA Approved</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block"></span>
              <span className="text-emerald-400 font-semibold">DPDP Protected</span>
            </div>
          </div>
        </div>

        {/* Center: Selected project pill */}
        {selectedProject && (
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="text-slate-400">Consulting on:</span>
            <span className="font-semibold text-gold-300">{selectedProject.name}</span>
            <span className="text-slate-500">({selectedProject.location})</span>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/80">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                  language === lang.code
                    ? 'bg-gold-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title={lang.label}
              >
                {lang.native}
              </button>
            ))}
          </div>

          {/* Book Visit Button */}
          <button
            onClick={onOpenBookingModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md shadow-gold-500/10 hover:shadow-gold-500/25 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Book Site Visit</span>
            <span className="sm:hidden">Visit</span>
          </button>

          {/* Staff Login / Portal Button */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-1.5">
              {/* Dashboard Link */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-gold-500 text-slate-950 border-gold-500 font-bold'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title="Lead Management Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dashboard</span>
              </button>

              {/* Admin Panel Link for Sales Head */}
              {isSalesHead && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    currentView === 'admin'
                      ? 'bg-gold-500 text-slate-950 border-gold-500 font-bold'
                      : 'bg-gold-500/10 text-gold-300 border-gold-500/30 hover:bg-gold-500/20'
                  }`}
                  title="Admin Fact Sheet & Slot Editor"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Admin</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-gold-400" />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

