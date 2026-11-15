import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { StudentWorkspace } from './components/StudentWorkspace';

function WorldLanguagesShell() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'workspace'>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('wl_view') === 'workspace') {
      return 'workspace';
    }
    return 'landing';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup' | 'founder'>('signup');
  const [targetLangForSignup, setTargetLangForSignup] = useState<string>('es');

  const navigateView = (next: 'landing' | 'workspace') => {
    setView(next);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('wl_view', next);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && user) {
      navigateView('workspace');
    }
  }, [user]);

  const handleOpenAuth = (tab: 'login' | 'signup' | 'founder', targetLang?: string) => {
    setAuthTab(tab);
    if (targetLang) setTargetLangForSignup(targetLang);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading World Languages...</div>
      </div>
    );
  }

  return (
    <>
      {view === 'workspace' && user ? (
        <StudentWorkspace onExitToHome={() => navigateView('landing')} />
      ) : (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onEnterWorkspace={() => {
            if (user) navigateView('workspace');
            else handleOpenAuth('login');
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialTab={authTab}
        defaultTargetLanguage={targetLangForSignup}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          navigateView('workspace');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorldLanguagesShell />
    </AuthProvider>
  );
}
