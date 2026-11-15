import React, { useEffect, useState } from 'react';
import { Bookmark, ExternalLink, Headphones, Volume2 } from 'lucide-react';
import { LanguageEnvironment, ListeningResourceItem } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface ListeningLabViewProps {
  language: LanguageEnvironment;
  onProgressUpdated: () => Promise<void>;
}

export const ListeningLabView: React.FC<ListeningLabViewProps> = ({
  language,
  onProgressUpdated,
}) => {
  const [resources, setResources] = useState<ListeningResourceItem[]>([]);
  const [selected, setSelected] = useState<ListeningResourceItem | null>(null);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [speed, setSpeed] = useState(1.0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [savedWordMsg, setSavedWordMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/listening/${language.code}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.resources ?? [];
        setResources(list);
        setSelected(list[0] ?? null);
      })
      .catch(() => {});
  }, [language.code]);

  const handleSaveLineWord = async (word: string, translationContext: string) => {
    const clean = word.replace(/[.,!?;:«»"'()「」。、،؟]/g, '').trim();
    if (!clean) return;
    await fetch('/api/vocabulary/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        languageCode: language.code,
        word: clean,
        translationEn: `From subtitle: ${translationContext}`,
        exampleSentence: translationContext,
      }),
    });
    setSavedWordMsg(`Saved "${clean}" to your Spaced Repetition deck.`);
    await onProgressUpdated();
  };

  const handleCompleteListening = async () => {
    if (!selected) return;
    let correct = 0;
    selected.questionsJson.forEach((q, i) => {
      if (answers[i] === q.answerIndex) correct += 1;
    });
    const score =
      selected.questionsJson.length > 0
        ? Math.round((correct / selected.questionsJson.length) * 100)
        : 100;
    await fetch('/api/listening/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ languageCode: language.code, score }),
    });
    setResultMsg(`Listening assessment recorded (${score}%). +25 XP earned.`);
    await onProgressUpdated();
  };

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <Headphones className="w-4 h-4" />
          <span>Listening Laboratory · Legal External Educational Media</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-950 mt-1">
          Authentic {language.name} Audio & Interactive Subtitles
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          We link strictly to official educational channels and licensed/public-domain media rather than hosting copyrighted works. Practice line-by-line shadowing and save vocabulary directly from transcripts.
        </p>
      </div>

      {resources.length > 0 && selected ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {resources.map((resItem) => (
              <button
                key={resItem.id}
                type="button"
                onClick={() => {
                  setSelected(resItem);
                  setActiveLineIdx(0);
                  setResultMsg(null);
                }}
                className={`w-full text-left p-4 rounded-xl border cursor-pointer ${
                  selected.id === resItem.id ? 'bg-blue-50/60 border-blue-600' : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-xs text-slate-500">{resItem.cefrLevel} · {resItem.accent}</div>
                <div className="font-display text-sm font-bold text-slate-950 mt-1">{resItem.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{resItem.sourceName}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500">
                  {selected.cefrLevel} · {selected.mediaType} · Verified {selected.lastVerifiedAt}
                </div>
                <h3 className="font-display text-xl font-bold text-slate-950 mt-0.5">{selected.title}</h3>
                <p className="text-xs text-slate-600 mt-1">License: {selected.licenseStatus}</p>
              </div>
              <a
                href={selected.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                Open Official Source
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Synchronized Transcript (click any word to save to SRS)
              </span>
              <select
                aria-label="Listening playback speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
              >
                <option value={0.75}>0.75x Slow</option>
                <option value={1.0}>1.0x Natural</option>
                <option value={1.2}>1.2x Fast</option>
              </select>
            </div>

            <div className="space-y-3">
              {selected.subtitlesJson.map((line, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-colors ${
                    activeLineIdx === idx ? 'bg-blue-50/50 border-blue-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono-num text-xs text-slate-500">
                      00:{String(line.startSec).padStart(2, '0')} – 00:{String(line.endSec).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLineIdx(idx);
                        playLanguageAudio(line.text, language.code, 'Kore', speed);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Repeat Line
                    </button>
                  </div>
                  <div className="text-base font-medium text-slate-950">
                    {line.text.split(/(\s+)/).map((tok, tIdx) =>
                      /^\s+$/.test(tok) ? (
                        <span key={tIdx}>{tok}</span>
                      ) : (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => handleSaveLineWord(tok, line.translation)}
                          title="Save word to SRS flashcards"
                          className="hover:bg-blue-200/70 rounded px-0.5 cursor-pointer inline"
                        >
                          {tok}
                        </button>
                      )
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{line.translation}</div>
                </div>
              ))}
            </div>

            {savedWordMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                <span>{savedWordMsg}</span>
              </div>
            )}

            {selected.questionsJson.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-display text-base font-bold text-slate-950">Listening Comprehension</h4>
                {selected.questionsJson.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 border border-slate-200 rounded-lg space-y-2">
                    <div className="text-sm font-medium text-slate-900">{q.question}</div>
                    <div className="space-y-1.5 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`listen-q-${qIdx}`}
                            checked={answers[qIdx] === oIdx}
                            onChange={() => setAnswers((p) => ({ ...p, [qIdx]: oIdx }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {resultMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                    {resultMsg}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCompleteListening}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Submit Listening Comprehension
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
          Curated external listening links for {language.name} are growing! Meanwhile, you can use AI Narration inside the Reading Library and live dialogue in the Speaking Laboratory.
        </div>
      )}
    </div>
  );
};
