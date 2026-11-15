import React, { createContext, useContext, useEffect, useState } from 'react';
import { LanguageEnvironment, UserLanguageProgress, UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  enrolledLanguages: UserLanguageProgress[];
  languages: LanguageEnvironment[];
  activeLanguageCode: string;
  interfaceLanguage: string;
  loading: boolean;
  setActiveLanguageCode: (code: string) => void;
  setInterfaceLanguage: (code: string) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [enrolledLanguages, setEnrolledLanguages] = useState<UserLanguageProgress[]>([]);
  const [languages, setLanguages] = useState<LanguageEnvironment[]>([]);
  const [activeLanguageCode, setActiveLanguageCode] = useState<string>('es');
  const [interfaceLanguage, setInterfaceLanguage] = useState<string>('en');
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const [meRes, langRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/languages'),
      ]);
      if (langRes.ok) {
        const langData = await langRes.json();
        setLanguages(langData.languages ?? []);
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user ?? null);
        const enrolled: UserLanguageProgress[] = meData.enrolledLanguages ?? [];
        setEnrolledLanguages(enrolled);
        if (meData.user?.interfaceLanguage) {
          setInterfaceLanguage(meData.user.interfaceLanguage);
        }
        const active = enrolled.find((e) => e.isActive) ?? enrolled[0];
        if (active) {
          setActiveLanguageCode(active.languageCode);
        }
      }
    } catch (err) {
      console.error('Session load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setEnrolledLanguages([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        enrolledLanguages,
        languages,
        activeLanguageCode,
        interfaceLanguage,
        loading,
        setActiveLanguageCode,
        setInterfaceLanguage,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
