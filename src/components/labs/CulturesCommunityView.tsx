import React, { useEffect, useState } from 'react';
import { Calendar, Globe, MessageSquare } from 'lucide-react';
import { CulturalEntryItem, LanguageEnvironment } from '../../types';

interface CulturesCommunityViewProps {
  language: LanguageEnvironment;
}

export const CulturesCommunityView: React.FC<CulturesCommunityViewProps> = ({ language }) => {
  const [entries, setEntries] = useState<CulturalEntryItem[]>([]);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [events, setEvents] = useState<Array<{ id: number; title: string; category: string; description: string; startsAt: string }>>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  useEffect(() => {
    const url = showAllLanguages ? '/api/cultures' : `/api/cultures?lang=${language.code}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }, [language.code, showAllLanguages]);

  useEffect(() => {
    fetch('/api/community')
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ languageCode: language.code, rating, comment }),
    });
    const data = await res.json();
    if (res.ok) {
      setComment('');
      setReviewNotice(data.message);
    }
  };

  return (
    <div className="space-y-6 wl-fade-up">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Globe className="w-4 h-4" />
            <span>World Cultures Encyclopedia</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1">
            Historical Context & Modern Everyday Society
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAllLanguages(!showAllLanguages)}
          className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          {showAllLanguages ? `Filter to ${language.name}` : 'Explore All Regions'}
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <article key={entry.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500">{entry.region} · {entry.category}</div>
                <h3 className="font-display text-xl font-bold text-slate-950 mt-1">{entry.title}</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-slate-900">Historical Traditions & Origins</div>
                  <p className="text-slate-700 mt-1 leading-relaxed">{entry.historicalContext}</p>
                </div>
                <div className="p-3.5 bg-blue-50/40 border border-blue-200 rounded-lg">
                  <div className="text-xs font-semibold text-blue-900">Contemporary Society & Everyday Practice</div>
                  <p className="text-slate-700 mt-1 leading-relaxed">{entry.modernPractice}</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Sources: {entry.referencesJson.join(' · ')}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
          No localized encyclopedia essay filtered to {language.name} yet. Click "Explore All Regions" above to read global cultural studies!
        </div>
      )}

      {/* Community Events & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Calendar className="w-4 h-4" />
            <span>Platform Challenges & Events</span>
          </div>
          {events.map((ev) => (
            <div key={ev.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500">{ev.category} · Starts {ev.startsAt}</div>
              <div className="font-display text-sm font-bold text-slate-950 mt-0.5">{ev.title}</div>
              <p className="text-xs text-slate-600 mt-1">{ev.description}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitReview} className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <MessageSquare className="w-4 h-4" />
            <span>Submit Student Feedback</span>
          </div>
          <p className="text-xs text-slate-600">
            Share honest feedback on your {language.name} learning experience. Reviews are moderated by the Founder before appearing publicly.
          </p>
          <div>
            <label htmlFor="rev-rating" className="block text-xs font-medium text-slate-700 mb-1">Rating</label>
            <select
              id="rev-rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} / 5</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rev-comment" className="block text-xs font-medium text-slate-700 mb-1">Reflection</label>
            <textarea
              id="rev-comment"
              rows={3}
              required
              minLength={8}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What helped you most, and what should we improve?"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          {reviewNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              {reviewNotice}
            </div>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Submit Feedback for Review
          </button>
        </form>
      </div>
    </div>
  );
};
