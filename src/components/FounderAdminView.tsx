import React, { useEffect, useState } from 'react';
import { CheckCircle2, Shield, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FounderAdminView: React.FC = () => {
  const { user, languages } = useAuth();
  const [overview, setOverview] = useState<{
    stats: { totalStudents: number; totalTopics: number; totalVocab: number; totalAiCalls: number };
    langPopularity: Array<{ languageCode: string; learners: number }>;
    pendingReviews: Array<{ id: number; authorName: string; languageCode: string; rating: number; comment: string; status: string }>;
    draftTopics: Array<{ id: number; languageCode: string; cefrLevel: string; title: string; status: string }>;
    recentAuditLogs: Array<{ id: number; actorEmail: string; action: string; createdAt: string }>;
  } | null>(null);

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [topicLang, setTopicLang] = useState('es');
  const [topicLevel, setTopicLevel] = useState('A1');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicIntro, setTopicIntro] = useState('');
  const [vocabLang, setVocabLang] = useState('es');
  const [vocabWord, setVocabWord] = useState('');
  const [vocabTrans, setVocabTrans] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const loadOverview = async () => {
    const res = await fetch('/api/admin/overview', { credentials: 'include' });
    if (res.ok) {
      setOverview(await res.json());
    }
  };

  useEffect(() => {
    if (user?.role === 'founder') loadOverview();
  }, [user]);

  if (!user || user.role !== 'founder') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">
        Restricted: Only the Founder (Begzad Kurbanbayev) can access the administration console.
      </div>
    );
  }

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: annTitle, body: annBody }),
    });
    if (res.ok) {
      setAnnTitle('');
      setAnnBody('');
      setNotice('Announcement published to platform.');
      await loadOverview();
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: evTitle, description: evDesc, category: 'Platform Challenge' }),
    });
    if (res.ok) {
      setEvTitle('');
      setEvDesc('');
      setNotice('Community event created.');
      await loadOverview();
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        languageCode: topicLang,
        cefrLevel: topicLevel,
        title: topicTitle,
        introduction: topicIntro,
        status: 'review',
      }),
    });
    if (res.ok) {
      setTopicTitle('');
      setTopicIntro('');
      setNotice('New topic queued for Founder approval before publishing.');
      await loadOverview();
    }
  };

  const handleToggleTopicStatus = async (id: number, nextStatus: 'published' | 'review') => {
    await fetch(`/api/admin/topics/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadOverview();
  };

  const handleAddVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        languageCode: vocabLang,
        word: vocabWord,
        translationEn: vocabTrans,
      }),
    });
    if (res.ok) {
      setVocabWord('');
      setVocabTrans('');
      setNotice('Vocabulary entry added to verified curriculum.');
      await loadOverview();
    }
  };

  const handleModerateReview = async (id: number, status: 'approved' | 'rejected') => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    await loadOverview();
  };

  return (
    <div className="space-y-6 wl-fade-up">
      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Shield className="w-4 h-4" />
            <span>Founder Administration Console · {user.email}</span>
          </div>
          <h2 className="font-display text-2xl font-bold mt-1">
            World Languages Executive & Curriculum Control
          </h2>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
          {notice}
        </div>
      )}

      {overview && (
        <>
          {/* Platform Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Registered Students</div>
              <div className="font-mono-num text-2xl font-bold text-slate-950 mt-1">
                {overview.stats.totalStudents}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Curriculum Topics</div>
              <div className="font-mono-num text-2xl font-bold text-slate-950 mt-1">
                {overview.stats.totalTopics}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Lexicon Entries</div>
              <div className="font-mono-num text-2xl font-bold text-slate-950 mt-1">
                {overview.stats.totalVocab}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">AI Lab Operations</div>
              <div className="font-mono-num text-2xl font-bold text-blue-700 mt-1">
                {overview.stats.totalAiCalls}
              </div>
            </div>
          </div>

          {/* Content Creation & Approval */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleCreateTopic} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
              <h3 className="font-display text-base font-bold text-slate-950">Create Curriculum Topic (Approval Workflow)</h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Topic language"
                  value={topicLang}
                  onChange={(e) => setTopicLang(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
                <select
                  aria-label="Topic CEFR level"
                  value={topicLevel}
                  onChange={(e) => setTopicLevel(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                required
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="Topic title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                value={topicIntro}
                onChange={(e) => setTopicIntro(e.target.value)}
                placeholder="Lesson introduction and linguistic focus..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg cursor-pointer">
                Save to Review Queue
              </button>
            </form>

            <form onSubmit={handleAddVocab} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
              <h3 className="font-display text-base font-bold text-slate-950">Add Verified Vocabulary</h3>
              <select
                aria-label="Vocabulary language"
                value={vocabLang}
                onChange={(e) => setVocabLang(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={vocabWord}
                onChange={(e) => setVocabWord(e.target.value)}
                placeholder="Target-language word"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                required
                value={vocabTrans}
                onChange={(e) => setVocabTrans(e.target.value)}
                placeholder="English translation"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer">
                Add to Curriculum Lexicon
              </button>
            </form>
          </div>

          {/* Topic Publish Queue & Review Moderation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-slate-950">Content Approval Queue</h3>
              <div className="divide-y divide-slate-100 text-xs max-h-64 overflow-y-auto">
                {overview.draftTopics.slice(0, 8).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{t.title}</div>
                      <div className="text-slate-500">
                        {t.languageCode.toUpperCase()} · {t.cefrLevel} · Status: {t.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleTopicStatus(t.id, t.status === 'published' ? 'review' : 'published')
                      }
                      className="px-2.5 py-1 border border-slate-300 rounded-md font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      {t.status === 'published' ? 'Unpublish' : 'Approve & Publish'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-slate-950">Student Review Moderation</h3>
              {overview.pendingReviews.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {overview.pendingReviews.map((r) => (
                    <div key={r.id} className="py-2.5 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {r.authorName} · {r.rating}/5 ({r.status})
                        </div>
                        <p className="text-slate-600 mt-0.5">{r.comment}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          aria-label={`Approve review ${r.id}`}
                          onClick={() => handleModerateReview(r.id, 'approved')}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Reject review ${r.id}`}
                          onClick={() => handleModerateReview(r.id, 'rejected')}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No student feedback submitted yet.</p>
              )}
            </div>
          </div>

          {/* Announcements & Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handlePublishAnnouncement} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
              <h3 className="font-display text-base font-bold text-slate-950">Publish Platform Announcement</h3>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement headline"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                required
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Announcement message..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg cursor-pointer">
                Publish Announcement
              </button>
            </form>

            <form onSubmit={handleCreateEvent} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
              <h3 className="font-display text-base font-bold text-slate-950">Create Community Event</h3>
              <input
                type="text"
                required
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Event or challenge name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                required
                value={evDesc}
                onChange={(e) => setEvDesc(e.target.value)}
                placeholder="Challenge goals and dates..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer">
                Launch Event
              </button>
            </form>
          </div>

          {/* Security Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-display text-base font-bold text-slate-950 mb-3">Security & Audit Trail</h3>
            <div className="divide-y divide-slate-100 text-xs max-h-48 overflow-y-auto">
              {overview.recentAuditLogs.map((log) => (
                <div key={log.id} className="py-2 flex items-center justify-between">
                  <span className="font-mono text-slate-800">{log.action}</span>
                  <span className="text-slate-500">{log.actorEmail}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
