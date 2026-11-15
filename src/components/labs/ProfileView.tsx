import React, { useState } from 'react';
import { Download, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INTERFACE_LANGUAGES } from '../../i18n/translations';
import { LanguageEnvironment } from '../../types';

interface ProfileViewProps {
  language: LanguageEnvironment;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ language }) => {
  const { user, refreshSession, setInterfaceLanguage } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [nativeLanguage, setNativeLanguage] = useState(user?.nativeLanguage ?? 'English');
  const [ifaceLang, setIfaceLang] = useState(user?.interfaceLanguage ?? 'en');
  const [country, setCountry] = useState(user?.country ?? '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.dailyGoalMinutes ?? 20);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        displayName,
        nativeLanguage,
        interfaceLanguage: ifaceLang,
        country: country || null,
        dailyGoalMinutes,
      }),
    });
    if (res.ok) {
      setInterfaceLanguage(ifaceLang);
      await refreshSession();
      setSavedMsg('Profile preferences saved to PostgreSQL.');
    }
  };

  const handleOfflineCache = async () => {
    try {
      const res = await fetch(`/api/srs/${language.code}`, { credentials: 'include' });
      const data = await res.json();
      localStorage.setItem(`wl_offline_pack_${language.code}`, JSON.stringify(data.cards ?? []));
      setOfflineSaved(true);
    } catch {
      setOfflineSaved(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 wl-fade-up">
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-950">Student Profile & Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="prof-name" className="block font-medium text-slate-700 mb-1">Display Name</label>
            <input
              id="prof-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="prof-native" className="block font-medium text-slate-700 mb-1">Native / Explanation Language</label>
            <input
              id="prof-native"
              type="text"
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="prof-iface" className="block font-medium text-slate-700 mb-1">Interface Language</label>
            <select
              id="prof-iface"
              value={ifaceLang}
              onChange={(e) => setIfaceLang(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {INTERFACE_LANGUAGES.map((il) => (
                <option key={il.code} value={il.code}>{il.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prof-goal" className="block font-medium text-slate-700 mb-1">Daily Study Target</label>
            <select
              id="prof-goal"
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value={10}>10 minutes / day</option>
              <option value={20}>20 minutes / day</option>
              <option value={30}>30 minutes / day</option>
              <option value={60}>60 minutes / day</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="prof-country" className="block font-medium text-slate-700 mb-1">Country (Optional)</label>
            <input
              id="prof-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {savedMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            {savedMsg}
          </div>
        )}

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Profile Settings
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-slate-950">Offline Study Pack</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Save your {language.name} vocabulary flashcards locally for offline review while traveling.
          </p>
          {offlineSaved && (
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              Offline {language.name} flashcard pack cached in browser storage.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleOfflineCache}
          className="px-4 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Save {language.name} Offline
        </button>
      </div>
    </div>
  );
};
