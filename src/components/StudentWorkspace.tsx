import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Compass,
  FileCheck2,
  Globe,
  Headphones,
  Home,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Mic,
  Shield,
  Sparkles,
  User,
  Volume2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUiCopy } from '../i18n/translations';
import { FounderAdminView } from './FounderAdminView';
import { CoursesView } from './labs/CoursesView';
import { CulturesCommunityView } from './labs/CulturesCommunityView';
import { DashboardPayload, DashboardView } from './labs/DashboardView';
import { ExamsProgressionView } from './labs/ExamsProgressionView';
import { GrammarLabView } from './labs/GrammarLabView';
import { ListeningLabView } from './labs/ListeningLabView';
import { PhoneticsView } from './labs/PhoneticsView';
import { PlacementView } from './labs/PlacementView';
import { ProfileView } from './labs/ProfileView';
import { ReadingLabView } from './labs/ReadingLabView';
import { SpeakingWritingLabView } from './labs/SpeakingWritingLabView';
import { VocabularySrsView } from './labs/VocabularySrsView';

interface StudentWorkspaceProps {
  onExitToHome: () => void;
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({ onExitToHome }) => {
  const {
    user,
    languages,
    activeLanguageCode,
    setActiveLanguageCode,
    interfaceLanguage,
    logout,
  } = useAuth();
  const copy = getUiCopy(interfaceLanguage);

  const [activeTab, setActiveTab] = useState<string>(
    user?.role === 'founder' ? 'founder' : 'dashboard'
  );
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLanguage =
    languages.find((l) => l.code === activeLanguageCode) ||
    languages[0] || {
      id: 1,
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      script: 'Latin',
      direction: 'ltr' as const,
      family: 'Romance',
      region: 'Iberia & Americas',
      variantsJson: ['Castilian'],
      phoneticsFocusJson: ['Alveolar trill'],
      grammarPillarsJson: ['Ser vs estar'],
      progressionFramework: 'CEFR A1–C2',
      description: '',
      isPublished: true,
    };

  const loadDashboard = useCallback(async (overrideCode?: string) => {
    const codeToLoad = overrideCode ?? activeLanguageCode;
    setLoadingDash(true);
    try {
      const res = await fetch(`/api/dashboard?lang=${codeToLoad}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } finally {
      setLoadingDash(false);
    }
  }, [activeLanguageCode]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const isRtl = activeLanguage.direction === 'rtl' || interfaceLanguage === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = activeLanguage.code || 'en';
    return () => {
      document.documentElement.dir = interfaceLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = interfaceLanguage || 'en';
    };
  }, [activeLanguage.direction, activeLanguage.code, interfaceLanguage]);

  const handleSwitchLanguage = async (code: string, dialectVariant?: string) => {
    setActiveLanguageCode(code);
    await fetch('/api/user-languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ languageCode: code, dialectVariant }),
    });
    if (dialectVariant) {
      await loadDashboard(code);
    }
  };

  if (!user) return null;

  const navItems = [
    { id: 'dashboard', label: copy.dashboardOverview, icon: LayoutDashboard },
    { id: 'placement', label: 'Placement', icon: Compass },
    { id: 'phonetics', label: copy.phonetics, icon: Volume2 },
    { id: 'courses', label: copy.courses, icon: BookOpen },
    { id: 'vocabulary', label: copy.vocabulary, icon: Layers },
    { id: 'grammar', label: copy.grammar, icon: Sparkles },
    { id: 'reading', label: copy.reading, icon: BookOpen },
    { id: 'listening', label: copy.listening, icon: Headphones },
    { id: 'speaking', label: copy.speakingWriting, icon: Mic },
    { id: 'exams', label: copy.examinations, icon: FileCheck2 },
    { id: 'cultures', label: copy.cultures, icon: Globe },
    { id: 'profile', label: copy.profile, icon: User },
  ];

  if (user.role === 'founder') {
    navItems.unshift({ id: 'founder', label: copy.founderConsole, icon: Shield });
  }

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex"
      dir={activeLanguage.direction === 'rtl' || interfaceLanguage === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Desktop Sidebar */}
      <aside
        aria-label="Workspace navigation"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-2 mb-4">
            <button
              type="button"
              onClick={onExitToHome}
              className="font-display text-base font-bold text-slate-950 hover:text-blue-700 text-left cursor-pointer"
            >
              World Languages
            </button>
            <button
              type="button"
              aria-label="Close navigation drawer"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2 text-xs">
          <div className="px-2">
            <div className="font-semibold text-slate-900 truncate">{user.displayName}</div>
            <div className="text-slate-500 truncate">{user.email}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExitToHome}
              className="flex-1 py-2 px-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                onExitToHome();
              }}
              className="flex-1 py-2 px-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-800 inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open workspace menu"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="truncate">
              <span className="text-xs text-slate-500">Workspace</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-display text-sm font-bold text-slate-950 capitalize">
                {activeTab === 'founder' ? 'Founder Administration' : `${activeLanguage.name} · ${activeTab}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="ws-lang-switch" className="sr-only">
              Active target language
            </label>
            <select
              id="ws-lang-switch"
              value={activeLanguage.code}
              onChange={(e) => handleSwitchLanguage(e.target.value)}
              className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-2"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>

            {activeLanguage.variantsJson?.length > 1 && (
              <select
                aria-label="Regional dialect variant"
                value={dashboardData?.activeLanguage.dialectVariant || activeLanguage.variantsJson[0]}
                onChange={(e) => handleSwitchLanguage(activeLanguage.code, e.target.value)}
                className="hidden sm:block text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-2 max-w-[180px]"
              >
                {activeLanguage.variantsJson.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'founder' && <FounderAdminView />}
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              language={activeLanguage}
              data={dashboardData}
              loading={loadingDash}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'placement' && (
            <PlacementView
              language={activeLanguage}
              onCompleted={loadDashboard}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'phonetics' && <PhoneticsView language={activeLanguage} />}
          {activeTab === 'courses' && (
            <CoursesView
              language={activeLanguage}
              onProgressUpdated={loadDashboard}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'vocabulary' && (
            <VocabularySrsView language={activeLanguage} onProgressUpdated={loadDashboard} />
          )}
          {activeTab === 'grammar' && (
            <GrammarLabView language={activeLanguage} onProgressUpdated={loadDashboard} />
          )}
          {activeTab === 'reading' && (
            <ReadingLabView language={activeLanguage} onProgressUpdated={loadDashboard} />
          )}
          {activeTab === 'listening' && (
            <ListeningLabView language={activeLanguage} onProgressUpdated={loadDashboard} />
          )}
          {activeTab === 'speaking' && (
            <SpeakingWritingLabView
              language={activeLanguage}
              currentLevel={dashboardData?.activeLanguage.currentLevel ?? 'Pre-A1'}
              onProgressUpdated={loadDashboard}
            />
          )}
          {activeTab === 'exams' && (
            <ExamsProgressionView language={activeLanguage} onProgressUpdated={loadDashboard} />
          )}
          {activeTab === 'cultures' && <CulturesCommunityView language={activeLanguage} />}
          {activeTab === 'profile' && <ProfileView language={activeLanguage} />}
        </main>
      </div>
    </div>
  );
};
