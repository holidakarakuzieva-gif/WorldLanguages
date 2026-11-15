import React, { useState } from 'react';
import { CheckCircle2, Compass, Volume2 } from 'lucide-react';
import { LanguageEnvironment } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface PlacementViewProps {
  language: LanguageEnvironment;
  onCompleted: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const PlacementView: React.FC<PlacementViewProps> = ({
  language,
  onCompleted,
  onNavigateTab,
}) => {
  const [step, setStep] = useState<'intro' | 'assessment' | 'result'>('intro');
  const [vocabAns, setVocabAns] = useState<number | null>(null);
  const [grammarAns, setGrammarAns] = useState<number | null>(null);
  const [readingAns, setReadingAns] = useState<number | null>(null);
  const [listeningAns, setListeningAns] = useState<number | null>(null);
  const [writingSample, setWritingSample] = useState('');
  const [speakingConfirmed, setSpeakingConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    estimatedLevel: string;
    compositeScore: number;
    strengths: string[];
    weaknesses: string[];
    explanation: string;
    recommendedFirstLesson: string;
  } | null>(null);

  const handleZeroStart = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/placement/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ languageCode: language.code, mode: 'beginner_zero' }),
      });
      const data = await res.json();
      setResult(data.result);
      setStep('result');
      await onCompleted();
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const vocabScore = vocabAns === 0 ? 85 : vocabAns === 1 ? 45 : 20;
      const grammarScore = grammarAns === 0 ? 85 : grammarAns === 1 ? 45 : 15;
      const readingScore = readingAns === 0 ? 85 : 30;
      const listeningScore = listeningAns === 0 ? 80 : 25;
      const writingRelevanceScore = writingSample.trim().length > 40 ? 80 : writingSample.trim().length > 10 ? 50 : 0;

      const res = await fetch('/api/placement/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          languageCode: language.code,
          mode: 'diagnostic',
          evidence: {
            vocabularyScore: vocabScore,
            grammarScore,
            readingScore,
            listeningScore,
            writingLength: writingSample.trim().length,
            writingRelevanceScore,
            speakingAnswered: speakingConfirmed,
          },
        }),
      });
      const data = await res.json();
      setResult(data.result);
      setStep('result');
      await onCompleted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 wl-fade-up">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <Compass className="w-4 h-4" />
          <span>Multi-Skill Placement Evaluation · {language.name}</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-950 mt-1">
          Establish Your Accurate Starting Pathway
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          {language.progressionFramework}. Instead of guessing from a single quiz, we evaluate vocabulary, grammar, reading comprehension, listening, writing, and speaking together.
        </p>

        {step === 'intro' && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Start From Absolute Zero</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  New to {language.name} ({language.script})? Begin cleanly at Pre-A1 with our Phonetics & Pronunciation Academy and Lesson 01.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleZeroStart}
                className="mt-4 w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Choose Beginner Pathway (Pre-A1)
              </button>
            </div>

            <div className="p-5 border border-blue-200 bg-blue-50/40 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Take 6-Skill Diagnostic</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Already studied {language.name}? Answer vocabulary, grammar, reading, listening, and short production prompts for calibrated placement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('assessment')}
                className="mt-4 w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Begin Diagnostic Assessment
              </button>
            </div>
          </div>
        )}

        {step === 'assessment' && (
          <form onSubmit={handleSubmitDiagnostic} className="mt-6 space-y-6">
            {/* 1. Vocabulary */}
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-blue-700">1. Lexical Recognition</div>
              <p className="text-sm font-medium text-slate-900 mt-1">
                How comfortably can you recognize core {language.name} words in {language.script} without translations?
              </p>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  'I can read everyday articles and infer nuanced meanings (B1–C1)',
                  'I recognize common greetings, numbers, and everyday nouns (A1–A2)',
                  'I am still learning the script and first words (Pre-A1)',
                ].map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vocab"
                      required
                      checked={vocabAns === idx}
                      onChange={() => setVocabAns(idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Grammar */}
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-blue-700">2. Structural Grammar ({language.grammarPillarsJson[0]})</div>
              <p className="text-sm font-medium text-slate-900 mt-1">
                Which statement best reflects your command of {language.grammarPillarsJson[0]}?
              </p>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  'I use it accurately in spontaneous past, future, and complex clauses',
                  'I understand basic present patterns with occasional hesitation',
                  'I have not studied this structure yet',
                ].map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="grammar"
                      required
                      checked={grammarAns === idx}
                      onChange={() => setGrammarAns(idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Reading */}
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-blue-700">3. Reading Comprehension</div>
              <p className="text-sm font-medium text-slate-900 mt-1">
                Evaluate this statement about {language.name} ({language.nativeName}): "{language.description}"
              </p>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  'I can read short unadapted paragraphs and summarize main ideas',
                  'I need word-by-word glosses for every sentence',
                ].map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reading"
                      required
                      checked={readingAns === idx}
                      onChange={() => setReadingAns(idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Listening */}
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700">4. Listening Discrimination</span>
                <button
                  type="button"
                  onClick={() => playLanguageAudio(language.nativeName, language.code)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Play Audio Sample
                </button>
              </div>
              <p className="text-sm font-medium text-slate-900 mt-1">
                Listen to natural {language.name} cadence. How well can you follow native speakers at normal speed?
              </p>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  'I catch key ideas and distinguish natural sound contrasts',
                  'I need slow speech and subtitles to follow',
                ].map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="listening"
                      required
                      checked={listeningAns === idx}
                      onChange={() => setListeningAns(idx)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Writing & Speaking */}
            <div className="p-4 border border-slate-200 rounded-lg space-y-3">
              <div className="text-xs font-semibold text-blue-700">5. Short Written & Spoken Production</div>
              <label htmlFor="placement-writing" className="block text-xs text-slate-700">
                Write 1–3 sentences in {language.name} (or explain what you can already express):
              </label>
              <textarea
                id="placement-writing"
                rows={3}
                value={writingSample}
                onChange={(e) => setWritingSample(e.target.value)}
                placeholder={`Write a sample in ${language.name}...`}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={speakingConfirmed}
                  onChange={(e) => setSpeakingConfirmed(e.target.checked)}
                />
                <span>I can hold a basic spoken exchange in {language.name} without reading notes</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {busy ? 'Evaluating...' : 'Compute Multi-Skill Placement'}
              </button>
            </div>
          </form>
        )}

        {step === 'result' && result && (
          <div className="mt-6 p-5 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-display text-lg font-bold">
                Estimated Proficiency: {result.estimatedLevel} ({result.compositeScore}%)
              </h3>
            </div>
            <p className="text-sm text-slate-700">{result.explanation}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="font-semibold text-emerald-700">Identified Strengths</div>
                <ul className="mt-1 list-disc pl-4 text-slate-700">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="font-semibold text-amber-700">Priority Growth Areas</div>
                <ul className="mt-1 list-disc pl-4 text-slate-700">
                  {result.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="text-xs text-slate-800">
              <span className="font-semibold">Recommended First Step:</span> {result.recommendedFirstLesson}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('phonetics')}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Open Phonetics Academy
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('courses')}
                className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Start Recommended Course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
