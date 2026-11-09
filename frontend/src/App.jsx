import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import BuyerPortal from './pages/BuyerPortal';
import LoginPage from './pages/LoginPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AdminPanel from './pages/AdminPanel';

function AppContent() {
  const { isAuthenticated, isSalesHead, isSalesExecutive, loading } = useAuth();

  // Determine initial view from URL hash if available
  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'login') return 'login';
    if (hash === 'dashboard') return 'dashboard';
    if (hash === 'admin') return 'admin';
    return 'buyer';
  };

  const [currentView, setCurrentView] = useState(getInitialView);

  // Sync hash with current view
  const navigateTo = (view) => {
    setCurrentView(view);
    window.location.hash = view === 'buyer' ? '' : view;
  };

  // Listen to hash changes (browser back/forward button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['buyer', 'login', 'dashboard', 'admin'].includes(hash)) {
        setCurrentView(hash || 'buyer');
      } else if (!hash) {
        setCurrentView('buyer');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Guard protected routes
  useEffect(() => {
    if (!loading) {
      if ((currentView === 'dashboard' || currentView === 'admin') && !isAuthenticated) {
        navigateTo('login');
      } else if (currentView === 'admin' && isAuthenticated && !isSalesHead) {
        navigateTo('dashboard');
      }
    }
  }, [currentView, isAuthenticated, isSalesHead, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <div className="inline-block w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-2"></div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(targetView) => navigateTo(targetView)}
        onCancel={() => navigateTo('buyer')}
      />
    );
  }

  if (currentView === 'dashboard') {
    return <ExecutiveDashboard onNavigate={navigateTo} />;
  }

  if (currentView === 'admin') {
    return <AdminPanel onNavigate={navigateTo} />;
  }

  // Default: Buyer Portal
  return <BuyerPortal onNavigate={navigateTo} currentView="buyer" />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
