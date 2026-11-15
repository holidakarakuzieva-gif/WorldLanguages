import React, { useEffect, useState } from 'react';
import { CheckCircle2, FastForward } from 'lucide-react';
import { GrammarTopicItem, LanguageEnvironment } from '../../types';

interface GrammarLabViewProps {
  language: LanguageEnvironment;
  onProgressUpdated: () => Promise<void>;
}

export const GrammarLabView: React.FC<GrammarLabViewProps> = ({
  language,
  onProgressUpdated,
}) => {
  const [topics, setTopics] = useState<GrammarTopicItem[]>([]);
  const [selected, setSelected] = useState<GrammarTopicItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGrammar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/grammar/${language.code}`, { credentials: 'include' });
      const data = await res.json();
      setTopics(data.topics ?? []);
      if (data.topics?.length > 0) {
        setSelected((prev) =>
          prev ? data.topics.find((t: GrammarTopicItem) => t.id === prev.id) ?? data.topics[0] : data.topics[0]
        );
      } else {
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrammar();
    setAnswers({});
    setSubmittedScore(null);
  }, [language.code]);

  const handleSubmit = async (diagnosticSkip = false) => {
    if (!selected) return;
    let score = 100;
    if (!diagnosticSkip) {
      const ex = selected.exercisesJson;
      let correct = 0;
      ex.forEach((item) => {
        if (answers[item.id] === item.answerIndex) correct += 1;
      });
      score = ex.length > 0 ? Math.round((correct / ex.length) * 100) : 100;
    }

    await fetch('/api/grammar/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        grammarTopicId: selected.id,
        languageCode: language.code,
        score,
        diagnosticSkipped: diagnosticSkip,
      }),
    });

    setSubmittedScore(score);
    await loadGrammar();
    await onProgressUpdated();
  };

  if (loading) {
    return <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 wl-fade-up" dir={language.direction}>
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-display text-base font-bold text-slate-950">Grammar Academy</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent structural reference & interactive drills for {language.name}
          </p>
        </div>
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelected(t);
              setAnswers({});
              setSubmittedScore(null);
            }}
            className={`w-full text-left p-4 rounded-xl border cursor-pointer ${
              selected?.id === t.id ? 'bg-blue-50/60 border-blue-600' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t.cefrLevel} · {t.difficulty}</span>
              {t.userProgress?.mastered && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mastered ({t.userProgress.score}%)
                </span>
              )}
            </div>
            <div className="font-display text-sm font-bold text-slate-950 mt-1">{t.title}</div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-8">
        {selected ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-blue-700">
                  {selected.cefrLevel} · {selected.difficulty}
                </div>
                <h3 className="font-display text-2xl font-bold text-slate-950 mt-1">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                Mark Known via Diagnostic
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">{selected.explanation}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900">Structural Patterns</div>
                <ul className="mt-2 list-disc pl-4 text-slate-700 space-y-1">
                  {selected.patternsJson.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                <div className="font-semibold text-amber-900">Common Learner Mistakes</div>
                <div className="mt-2 space-y-2">
                  {selected.commonMistakesJson.map((m, i) => (
                    <div key={i} className="text-slate-700">
                      <span className="line-through text-red-700">{m.wrong}</span> →{' '}
                      <span className="font-semibold text-emerald-800">{m.right}</span>
                      <div className="text-slate-600 mt-0.5">{m.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-2">Model Examples</h4>
              <div className="space-y-2">
                {selected.examplesJson.map((ex, i) => (
                  <div key={i} className="p-3 border border-slate-200 rounded-lg text-xs">
                    <div className="font-semibold text-slate-900">{ex.target}</div>
                    <div className="text-slate-500 mt-0.5">
                      {ex.gloss} · {ex.translation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Exercises */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="font-display text-base font-bold text-slate-950">Interactive Practice</h4>
              {selected.exercisesJson.map((ex) => {
                const chosen = answers[ex.id];
                const isRevealed = submittedScore !== null;
                return (
                  <div key={ex.id} className="p-4 border border-slate-200 rounded-lg space-y-2">
                    <div className="text-sm font-medium text-slate-900">{ex.prompt}</div>
                    <div className="space-y-1.5 text-xs">
                      {ex.options.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={ex.id}
                            checked={chosen === idx}
                            onChange={() => setAnswers((p) => ({ ...p, [ex.id]: idx }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    {isRevealed && (
                      <div
                        className={`mt-2 p-2.5 rounded-md text-xs ${
                          chosen === ex.answerIndex
                            ? 'bg-emerald-50 text-emerald-900'
                            : 'bg-red-50 text-red-900'
                        }`}
                      >
                        {chosen === ex.answerIndex ? 'Correct: ' : 'Explanation: '}
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                {submittedScore !== null && (
                  <span className="font-mono-num text-xs font-semibold text-slate-900">
                    Recorded Score: {submittedScore}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="ml-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Check Answers & Save Mastery
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
            Select a grammar topic from the left panel.
          </div>
        )}
      </div>
    </div>
  );
};
