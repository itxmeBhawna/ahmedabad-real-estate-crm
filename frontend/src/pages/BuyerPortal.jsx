import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Building, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProjectShowcase from '../components/ProjectShowcase';
import ChatWidget from '../components/ChatWidget';
import VisitBookingModal from '../components/VisitBookingModal';
import { api } from '../services/api';

export default function BuyerPortal({ onNavigate, currentView = 'buyer' }) {
  const [language, setLanguage] = useState('en');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Load projects from backend
  useEffect(() => {
    api.getProjects()
      .then((data) => {
        setProjects(data || []);
        if (data && data.length > 0) {
          setSelectedProject(data[0]); // default to Shivalik Grand
        }
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => {
        setLoadingProjects(false);
      });
  }, []);

  const handleBookingSuccess = (visit) => {
    setToastMessage(`Site visit booked successfully for ${visit.project_name}! Reference: #SV-${visit.id}`);
    setTimeout(() => setToastMessage(null), 8000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-gold-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        onOpenBookingModal={() => setIsBookingOpen(true)}
        selectedProject={selectedProject}
        onNavigate={onNavigate}
        currentView={currentView}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="sticky top-20 z-50 max-w-xl mx-auto px-4 mt-4 w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-xl flex items-center justify-between text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-400 hover:text-white ml-2 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Hero Tagline */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Real Estate Experience • Ahmedabad City</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
            Discover Verified Homes with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500">
              Instant AI Booking
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Direct access to Gujarat RERA-registered developments in Bopal & South Bopal.
            Instant fact-sheet queries, multilingual support, and zero-conflict site visit scheduling.
          </p>
        </div>

        {/* Project Showcase Section */}
        {loadingProjects ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="inline-block w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Loading verified Ahmedabad developments...</div>
          </div>
        ) : (
          <ProjectShowcase
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onBookVisit={(project) => {
              setSelectedProject(project);
              setIsBookingOpen(true);
            }}
          />
        )}

        {/* AI Chat & Knowledge Base Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <span>Interactive AI Consultation</span>
                <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Multilingual
                </span>
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Answers grounded in official project fact sheets. Unapproved pricing is automatically transferred to sales executives.
              </p>
            </div>
          </div>

          <ChatWidget
            language={language}
            selectedProject={selectedProject}
            onOpenBookingModal={() => setIsBookingOpen(true)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-900/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 Ahmedabad Realty CRM. Built with SQLAlchemy 2.0, FastAPI, React & Tailwind CSS.
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 font-medium">Digital Personal Data Protection (DPDP) Compliant</span>
            <span>•</span>
            <span className="text-gold-400 font-medium">Gujarat RERA Validated</span>
          </div>
        </div>
      </footer>

      {/* Visit Booking Modal */}
      <VisitBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        projects={projects}
        defaultProject={selectedProject}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}

