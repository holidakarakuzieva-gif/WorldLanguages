import React, { useEffect, useState } from 'react';
import { Bookmark, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { LanguageEnvironment, ReadingMaterialItem } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface ReadingLabViewProps {
  language: LanguageEnvironment;
  onProgressUpdated: () => Promise<void>;
}

export const ReadingLabView: React.FC<ReadingLabViewProps> = ({
  language,
  onProgressUpdated,
}) => {
  const [materials, setMaterials] = useState<ReadingMaterialItem[]>([]);
  const [selected, setSelected] = useState<ReadingMaterialItem | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [inspectedWord, setInspectedWord] = useState<{
    word: string;
    translation: string;
    pos: string;
    note: string;
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // AI Story Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genre, setGenre] = useState('Mystery');
  const [cefrLevel, setCefrLevel] = useState('A1');
  const [theme, setTheme] = useState('');
  const [characters, setCharacters] = useState('');
  const [setting, setSetting] = useState('');
  const [wordCount, setWordCount] = useState(220);
  const [outlineContext, setOutlineContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const loadLibrary = async () => {
    const res = await fetch(`/api/reading/${language.code}`, { credentials: 'include' });
    const data = await res.json();
    const list: ReadingMaterialItem[] = data.materials ?? [];
    setMaterials(list);
    if (list.length > 0) {
      setSelected((prev) => (prev ? list.find((m) => m.id === prev.id) ?? list[0] : list[0]));
    } else {
      setSelected(null);
    }
  };

  useEffect(() => {
    loadLibrary();
    setInspectedWord(null);
    setQuizScore(null);
    setAnswers({});
  }, [language.code]);

  const handleInspectWord = async (rawToken: string) => {
    const clean = rawToken.replace(/[.,!?;:«»"'()「」。、،؟]/g, '').trim();
    if (!clean || !selected) return;

    const glossaryMatch = selected.glossaryJson?.[clean] || selected.glossaryJson?.[clean.toLowerCase()];
    if (glossaryMatch) {
      setInspectedWord({ word: clean, ...glossaryMatch });
      return;
    }

    setInspectedWord({ word: clean, translation: 'Looking up in context...', pos: '', note: '' });
    try {
      const res = await fetch('/api/ai/word-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          word: clean,
          sentence: selected.content.slice(0, 260),
          languageCode: language.code,
          languageName: language.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInspectedWord({
          word: data.lemma || clean,
          translation: data.translation,
          pos: data.partOfSpeech,
          note: data.grammaticalNote || data.definition,
        });
      } else {
        setInspectedWord({
          word: clean,
          translation: 'Contextual lookup requires GEMINI_API_KEY',
          pos: 'word',
          note: 'You can still save this word to your SRS deck.',
        });
      }
    } catch {
      setInspectedWord({ word: clean, translation: 'Offline lookup unavailable', pos: '', note: '' });
    }
  };

  const handleSaveWordToSrs = async () => {
    if (!inspectedWord) return;
    const res = await fetch('/api/vocabulary/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        languageCode: language.code,
        cefrLevel: selected?.cefrLevel ?? 'A1',
        word: inspectedWord.word,
        translationEn: inspectedWord.translation,
        partOfSpeech: inspectedWord.pos || 'word',
        definition: inspectedWord.note || inspectedWord.translation,
        exampleSentence: selected?.title ?? inspectedWord.word,
      }),
    });
    if (res.ok) {
      setSavedNotice(`"${inspectedWord.word}" added to your Spaced Repetition flashcard queue.`);
      await onProgressUpdated();
    }
  };

  const handleCompleteReading = async () => {
    if (!selected) return;
    const qs = selected.questionsJson ?? [];
    let correct = 0;
    qs.forEach((q, i) => {
      if (answers[i] === q.answerIndex) correct += 1;
    });
    const score = qs.length > 0 ? Math.round((correct / qs.length) * 100) : 100;
    setQuizScore(score);
    await fetch('/api/reading/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        materialId: selected.id,
        languageCode: language.code,
        completed: true,
        comprehensionScore: score,
      }),
    });
    await loadLibrary();
    await onProgressUpdated();
  };

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/ai/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          languageCode: language.code,
          languageName: language.name,
          cefrLevel,
          genre,
          theme,
          characters,
          setting,
          wordCount,
          outlineContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Story generation failed.');
      if (data.continuityOutline) setOutlineContext(data.continuityOutline);
      setShowGenerator(false);
      await loadLibrary();
      if (data.material) setSelected(data.material);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Story generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">
            Interactive Reading Library & AI Story Studio
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Click any word in a passage for instant translation, grammatical context, and one-click SRS saving.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGenerator(!showGenerator)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {showGenerator ? 'Close Story Generator' : 'Generate Original AI Story'}
        </button>
      </div>

      {showGenerator && (
        <form onSubmit={handleGenerateStory} className="bg-white border border-blue-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-950">
              Custom AI Story & Chapter Generator ({language.name})
            </h3>
            <span className="text-xs text-slate-500">Tagged clearly as AI-generated supplementary reading</span>
          </div>
          {genError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">{genError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label htmlFor="story-genre" className="block font-medium text-slate-700 mb-1">Genre</label>
              <input
                id="story-genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Mystery, Fantasy, Historical..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="story-level" className="block font-medium text-slate-700 mb-1">CEFR Level</label>
              <select
                id="story-level"
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="story-words" className="block font-medium text-slate-700 mb-1">Approx. Word Count</label>
              <input
                id="story-words"
                type="number"
                min={120}
                max={800}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="story-chars" className="block font-medium text-slate-700 mb-1">Characters</label>
              <input
                id="story-chars"
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="e.g., Detective Sato and an archivist"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="story-setting" className="block font-medium text-slate-700 mb-1">Setting</label>
              <input
                id="story-setting"
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="e.g., Autumn train station"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="story-theme" className="block font-medium text-slate-700 mb-1">Theme</label>
              <input
                id="story-theme"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., Friendship & forgotten letters"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          {outlineContext && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold">Continuity Outline Active:</span> {outlineContext}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {generating ? 'Generating Chapter...' : outlineContext ? 'Generate Next Chapter' : 'Create Story'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Library List */}
        <div className="lg:col-span-4 space-y-3">
          {materials.length > 0 ? (
            materials.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelected(m);
                  setInspectedWord(null);
                  setQuizScore(null);
                  setAnswers({});
                }}
                className={`w-full text-left p-4 rounded-xl border cursor-pointer ${
                  selected?.id === m.id ? 'bg-blue-50/60 border-blue-600' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{m.cefrLevel} · {m.genre}</span>
                  {m.completed && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Read
                    </span>
                  )}
                </div>
                <div className="font-display text-sm font-bold text-slate-950 mt-1">{m.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {m.wordCount} words · {m.sourceType === 'ai_generated' ? 'AI Original Story' : 'Verified Curriculum'}
                </div>
              </button>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-600">
              No preset reading passages yet for {language.name}. Click "Generate Original AI Story" above to create one calibrated to your level!
            </div>
          )}
        </div>

        {/* Interactive Reader */}
        <div className="lg:col-span-8">
          {selected && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">
                    {selected.cefrLevel} · {selected.genre} · {selected.sourceType === 'ai_generated' ? 'AI-Generated Story' : 'Verified Curriculum'}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-slate-950 mt-0.5">{selected.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    aria-label="Text size"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as typeof fontSize)}
                    className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
                  >
                    <option value="sm">Text: Compact</option>
                    <option value="base">Text: Standard</option>
                    <option value="lg">Text: Large</option>
                  </select>
                  <select
                    aria-label="Audio speed"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
                  >
                    <option value={0.8}>0.8x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.2}>1.2x</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => playLanguageAudio(selected.content, language.code, 'Kore', playbackRate)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Narrate
                  </button>
                </div>
              </div>

              {/* Clickable Text Tokens */}
              <div
                className={`leading-loose text-slate-900 ${
                  fontSize === 'lg' ? 'text-lg' : fontSize === 'sm' ? 'text-sm' : 'text-base'
                }`}
              >
                {selected.content.split(/(\s+)/).map((tok, i) => {
                  if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleInspectWord(tok)}
                      className="hover:bg-blue-100 hover:text-blue-900 rounded px-0.5 transition-colors cursor-pointer inline"
                    >
                      {tok}
                    </button>
                  );
                })}
              </div>

              {/* Clicked Word Inspector */}
              {inspectedWord && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-950">
                      {inspectedWord.word}{' '}
                      <span className="text-xs font-normal text-slate-600">{inspectedWord.pos}</span>
                    </div>
                    <div className="text-sm text-blue-900 font-medium mt-0.5">{inspectedWord.translation}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{inspectedWord.note}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveWordToSrs}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Save to Flashcards
                  </button>
                </div>
              )}

              {savedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  {savedNotice}
                </div>
              )}

              {/* Comprehension Quiz */}
              {selected.questionsJson?.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <h4 className="font-display text-base font-bold text-slate-950">Comprehension Check</h4>
                  {selected.questionsJson.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 border border-slate-200 rounded-lg space-y-2">
                      <div className="text-sm font-medium text-slate-900">{q.question}</div>
                      <div className="space-y-1.5 text-xs">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`read-q-${qIdx}`}
                              checked={answers[qIdx] === oIdx}
                              onChange={() => setAnswers((p) => ({ ...p, [qIdx]: oIdx }))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    {quizScore !== null && (
                      <span className="font-mono-num text-xs font-semibold text-emerald-800">
                        Comprehension Score: {quizScore}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCompleteReading}
                      className="ml-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Complete Reading & Record Score
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
