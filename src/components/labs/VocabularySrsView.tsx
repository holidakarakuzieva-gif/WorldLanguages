import React, { useEffect, useState } from 'react';
import { Plus, RotateCw, Volume2 } from 'lucide-react';
import { LanguageEnvironment, SrsCard } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface VocabularySrsViewProps {
  language: LanguageEnvironment;
  onProgressUpdated: () => Promise<void>;
}

export const VocabularySrsView: React.FC<VocabularySrsViewProps> = ({
  language,
  onProgressUpdated,
}) => {
  const [cards, setCards] = useState<SrsCard[]>([]);
  const [summary, setSummary] = useState({
    dueToday: 0,
    overdue: 0,
    newWords: 0,
    learning: 0,
    mastered: 0,
  });
  const [mode, setMode] = useState<'target_to_native' | 'native_to_target' | 'spelling'>('target_to_native');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTrans, setNewTrans] = useState('');
  const [newExample, setNewExample] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDeck = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/srs/${language.code}`, { credentials: 'include' });
      const data = await res.json();
      setCards(data.cards ?? []);
      if (data.summary) setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
    setCardIdx(0);
    setFlipped(false);
    setSpellingFeedback(null);
  }, [language.code]);

  const activeCard = cards[cardIdx % Math.max(1, cards.length)];

  const handleGrade = async (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeCard) return;
    await fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        vocabId: activeCard.id,
        languageCode: language.code,
        grade,
      }),
    });
    setFlipped(false);
    setSpellingInput('');
    setSpellingFeedback(null);
    setCardIdx((i) => (i + 1) % Math.max(1, cards.length));
    await loadDeck();
    await onProgressUpdated();
  };

  const handleCheckSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const targetClean = activeCard.word.split('·')[0].trim().toLowerCase();
    const userClean = spellingInput.trim().toLowerCase();
    if (userClean === targetClean) {
      setSpellingFeedback('Exact match! Choose Good or Easy to schedule your next interval.');
      setFlipped(true);
    } else {
      setSpellingFeedback(`Expected: "${activeCard.word}". Reveal the card and mark Again if needed.`);
      setFlipped(true);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vocabulary/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        languageCode: language.code,
        word: newWord,
        translationEn: newTrans,
        exampleSentence: newExample || newWord,
      }),
    });
    if (res.ok) {
      setNewWord('');
      setNewTrans('');
      setNewExample('');
      setShowAdd(false);
      await loadDeck();
      await onProgressUpdated();
    }
  };

  if (loading) {
    return <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      {/* SRS Telemetry Header */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Due Today', val: summary.dueToday, cls: 'text-blue-700' },
          { label: 'Overdue', val: summary.overdue, cls: 'text-amber-700' },
          { label: 'New', val: summary.newWords, cls: 'text-slate-900' },
          { label: 'Learning', val: summary.learning, cls: 'text-slate-900' },
          { label: 'Mastered', val: summary.mastered, cls: 'text-emerald-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className={`font-mono-num text-xl font-bold mt-1 ${item.cls}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Mode Switcher + Add Custom Word */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
          {[
            { id: 'target_to_native', label: 'Target → Native' },
            { id: 'native_to_target', label: 'Native → Target' },
            { id: 'spelling', label: 'Spelling Recall' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id as typeof mode);
                setFlipped(false);
                setSpellingFeedback(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === m.id ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Word to Deck
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddWord} className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder={`${language.name} word`}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="text"
            required
            value={newTrans}
            onChange={(e) => setNewTrans(e.target.value)}
            placeholder="Translation & meaning"
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              placeholder="Optional example sentence"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Active Flashcard */}
      {activeCard ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {activeCard.cefrLevel} · {activeCard.partOfSpeech} · Status: {activeCard.srsStatus}
            </span>
            <span className="font-mono-num">
              Card {(cardIdx % cards.length) + 1} / {cards.length}
            </span>
          </div>

          <div className="text-center py-4">
            {mode === 'target_to_native' ? (
              <>
                <div className="font-display text-3xl font-extrabold text-slate-950">
                  {activeCard.word}
                </div>
                {activeCard.romanization && (
                  <div className="text-sm text-slate-500 mt-1">
                    {activeCard.romanization} {activeCard.ipa ? `· ${activeCard.ipa}` : ''}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-display text-2xl font-bold text-slate-950">
                  {activeCard.translationEn}
                </div>
                <div className="text-xs text-slate-500 mt-1">{activeCard.definition}</div>
              </>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => playLanguageAudio(activeCard.word, language.code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Listen Pronunciation
              </button>
            </div>
          </div>

          {mode === 'spelling' && !flipped && (
            <form onSubmit={handleCheckSpelling} className="flex gap-2">
              <input
                type="text"
                aria-label="Type target language spelling"
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                placeholder={`Type the ${language.name} word...`}
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Check
              </button>
            </form>
          )}

          {spellingFeedback && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
              {spellingFeedback}
            </div>
          )}

          {!flipped ? (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="w-full py-3 bg-slate-900 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Reveal Meaning & Grammatical Notes
            </button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="text-center">
                <div className="font-display text-xl font-bold text-blue-800">
                  {mode === 'target_to_native' ? activeCard.translationEn : activeCard.word}
                </div>
                <p className="text-sm text-slate-600 mt-1">{activeCard.definition}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-900">Example: {activeCard.exampleSentence}</div>
                <div className="text-slate-600">{activeCard.exampleTranslation}</div>
                {activeCard.grammaticalInfoJson && (
                  <div className="text-slate-500 pt-1">
                    Grammar:{' '}
                    {Object.entries(activeCard.grammaticalInfoJson)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(' · ')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleGrade('again')}
                  className="py-2.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Again (1d)
                </button>
                <button
                  type="button"
                  onClick={() => handleGrade('hard')}
                  className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Hard
                </button>
                <button
                  type="button"
                  onClick={() => handleGrade('good')}
                  className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Good
                </button>
                <button
                  type="button"
                  onClick={() => handleGrade('easy')}
                  className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Easy
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
          No vocabulary cards yet. Add a word above or save words while reading!
        </div>
      )}
    </div>
  );
};
