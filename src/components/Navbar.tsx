import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { getUiCopy } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: (tab: 'login' | 'signup' | 'founder') => void;
  onEnterWorkspace: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onEnterWorkspace,
  onNavigateSection,
}) => {
  const { user, interfaceLanguage } = useAuth();
  const copy = getUiCopy(interfaceLanguage);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: copy.navHome, id: 'top' },
    { label: copy.navLanguages, id: 'languages' },
    { label: copy.courses, id: 'how-it-works' },
    { label: copy.navLabs, id: 'laboratories' },
    { label: copy.navCultures, id: 'cultures' },
  ];

  const handleNav = (id: string) => {
    setMobileOpen(false);
    onNavigateSection(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNav('top');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          World Languages
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 border-transparent hover:border-blue-700"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onEnterWorkspace}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.role === 'founder' ? copy.founderConsole : 'Open Dashboard'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copy.ctaStart}
            </button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-blue-700"
            >
              {item.label}
            </button>
          ))}
          {!user && (
            <div className="pt-2 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-800"
              >
                {copy.ctaSignIn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth('founder');
                }}
                className="flex-1 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-800"
              >
                Founder
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
