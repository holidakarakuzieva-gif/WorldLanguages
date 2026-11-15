import React, { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { X, Shield, KeyRound, Mail, UserCheck } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { INTERFACE_LANGUAGES } from '../i18n/translations';

interface AuthModalProps {
  isOpen: boolean;
  initialTab: 'login' | 'signup' | 'founder';
  defaultTargetLanguage?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab,
  defaultTargetLanguage = 'es',
  onClose,
  onSuccess,
}) => {
  const { languages, refreshSession } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'founder' | 'reset'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [interfaceLang, setInterfaceLang] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(20);
  const [country, setCountry] = useState('');
  const [founderInitialized, setFounderInitialized] = useState(true);
  const [founderBootstrapMode, setFounderBootstrapMode] = useState(false);

  const [resetCode, setResetCode] = useState('');
  const [resetPreviewCode, setResetPreviewCode] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
    setTargetLanguage(defaultTargetLanguage);
    setError(null);
    setNotice(null);
    if (initialTab === 'founder') {
      setEmail('aiworldlanguages@gmail.com');
      fetch('/api/auth/founder-status')
        .then((r) => r.json())
        .then((data) => {
          setFounderInitialized(Boolean(data.initialized));
          setFounderBootstrapMode(!data.initialized && !data.envConfigured);
        })
        .catch(() => {});
    } else {
      setEmail('');
    }
    setPassword('');
  }, [initialTab, isOpen, defaultTargetLanguage]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken, targetLanguageCode: targetLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Sign-In failed.');
      await refreshSession();
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Sign-In cancelled or failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (tab === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
            displayName,
            nativeLanguage,
            interfaceLanguage: interfaceLang,
            targetLanguageCode: targetLanguage,
            dailyGoalMinutes,
            country: country || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not create account.');
        await refreshSession();
        onSuccess();
      } else if (tab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid credentials.');
        await refreshSession();
        onSuccess();
      } else if (tab === 'founder') {
        const endpoint = founderBootstrapMode ? '/api/auth/founder-bootstrap' : '/api/auth/login';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.needsFounderBootstrap) {
            setFounderBootstrapMode(true);
            setFounderInitialized(false);
            throw new Error('Founder password is not yet activated in the database. Enter your chosen founder password to activate now.');
          }
          throw new Error(data.error || 'Founder authentication failed.');
        }
        await refreshSession();
        onSuccess();
      } else if (tab === 'reset') {
        if (resetStep === 'request') {
          const res = await fetch('/api/auth/password-reset/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Reset failed.');
          setNotice(data.message);
          if (data.verificationCodePreview) setResetPreviewCode(data.verificationCodePreview);
          setResetStep('confirm');
        } else {
          const res = await fetch('/api/auth/password-reset/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: resetCode, newPassword: password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not reset password.');
          setNotice(data.message);
          setTab('login');
          setResetStep('request');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="auth-modal-title" className="font-display text-lg font-bold text-slate-900">
              {tab === 'signup'
                ? 'Create Free Student Account'
                : tab === 'founder'
                ? 'Founder Administration Sign-In'
                : tab === 'reset'
                ? 'Reset Account Password'
                : 'Sign In to World Languages'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              100% free global language education · Individual multi-language progress
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-2 rounded-md transition-colors whitespace-nowrap ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 rounded-md transition-colors whitespace-nowrap ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('founder');
                setEmail('aiworldlanguages@gmail.com');
                setError(null);
                fetch('/api/auth/founder-status')
                  .then((r) => r.json())
                  .then((data) => {
                    setFounderInitialized(Boolean(data.initialized));
                    setFounderBootstrapMode(!data.initialized && !data.envConfigured);
                  })
                  .catch(() => {});
              }}
              className={`flex-1 py-2 rounded-md transition-colors whitespace-nowrap ${
                tab === 'founder' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Founder Access
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}
          {notice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {notice}
              {resetPreviewCode && (
                <div className="mt-1 font-mono font-semibold">
                  Verification Code: {resetPreviewCode}
                </div>
              )}
            </div>
          )}

          {tab === 'founder' && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Protected Founder Console (Begzad Kurbanbayev)</p>
                <p className="mt-0.5">
                  {founderBootstrapMode
                    ? 'First-time secure activation: set your initial founder password below (stored as a salted scrypt hash in PostgreSQL, never in source code) or sign in with Google.'
                    : founderInitialized
                    ? 'Verified founder email allowlist active. Enter your founder password or use Google Sign-In.'
                    : 'Enter the founder password configured in FOUNDER_BOOTSTRAP_PASSWORD or use Google Sign-In.'}
                </p>
              </div>
            </div>
          )}

          {tab === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Laylo Karimova"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="auth-email"
                type="email"
                required
                readOnly={tab === 'founder'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white read-only:bg-slate-50"
              />
            </div>
          </div>

          {tab === 'reset' && resetStep === 'confirm' && (
            <div>
              <label htmlFor="reset-code" className="block text-xs font-medium text-slate-700 mb-1">
                Verification Code
              </label>
              <input
                id="reset-code"
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="8-character code"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          )}

          {(tab !== 'reset' || resetStep === 'confirm') && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 mb-1">
                {tab === 'reset' ? 'New Password' : founderBootstrapMode ? 'Activate Founder Password (10+ chars)' : 'Password'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={tab === 'founder' ? 10 : 8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>
          )}

          {tab === 'signup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="signup-target" className="block text-xs font-medium text-slate-700 mb-1">
                  First Language to Study
                </label>
                <select
                  id="signup-target"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="signup-native" className="block text-xs font-medium text-slate-700 mb-1">
                  Native / Familiar Language
                </label>
                <input
                  id="signup-native"
                  type="text"
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="signup-iface" className="block text-xs font-medium text-slate-700 mb-1">
                  Interface Language
                </label>
                <select
                  id="signup-iface"
                  value={interfaceLang}
                  onChange={(e) => setInterfaceLang(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {INTERFACE_LANGUAGES.map((il) => (
                    <option key={il.code} value={il.code}>
                      {il.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="signup-goal" className="block text-xs font-medium text-slate-700 mb-1">
                  Daily Target (minutes)
                </label>
                <select
                  id="signup-goal"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value={10}>10 min / day</option>
                  <option value={20}>20 min / day</option>
                  <option value={30}>30 min / day</option>
                  <option value={60}>60 min / day</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="signup-country" className="block text-xs font-medium text-slate-700 mb-1">
                  Country (Optional, for global learner map)
                </label>
                <input
                  id="signup-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., Uzbekistan, Japan, Brazil"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            {busy
              ? 'Please wait...'
              : tab === 'signup'
              ? 'Create Free Account'
              : tab === 'founder'
              ? founderBootstrapMode
                ? 'Activate & Enter Founder Console'
                : 'Sign In as Founder'
              : tab === 'reset'
              ? resetStep === 'request'
                ? 'Generate Reset Code'
                : 'Confirm Password Reset'
              : 'Sign In'}
          </button>

          {tab !== 'reset' && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500">or continue with verified Google account</span>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Continue with Google
              </button>
            </>
          )}

          {tab === 'login' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setTab('reset');
                  setResetStep('request');
                  setError(null);
                }}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                Forgot password? Reset via email verification
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
