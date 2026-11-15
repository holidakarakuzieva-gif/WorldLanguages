import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { LanguageEnvironment } from '../../types';

interface ExamsProgressionViewProps {
  language: LanguageEnvironment;
  onProgressUpdated: () => Promise<void>;
}

export const ExamsProgressionView: React.FC<ExamsProgressionViewProps> = ({
  language,
  onProgressUpdated,
}) => {
  const [currentLevel, setCurrentLevel] = useState('Pre-A1');
  const [progression, setProgression] = useState<{
    eligibleForNextLevel: boolean;
    unmetRequirements: string[];
  }>({ eligibleForNextLevel: false, unmetRequirements: [] });
  const [attempts, setAttempts] = useState<Array<{ id: number; examType: string; targetLevel: string; score: number; passed: boolean; status: string }>>([]);
  const [takingExam, setTakingExam] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [examMsg, setExamMsg] = useState<string | null>(null);

  const loadExams = async () => {
    const res = await fetch(`/api/exams/${language.code}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCurrentLevel(data.currentLevel ?? 'Pre-A1');
      setProgression(data.progression ?? { eligibleForNextLevel: false, unmetRequirements: [] });
      setAttempts(data.attempts ?? []);
    }
  };

  useEffect(() => {
    loadExams();
    setTakingExam(false);
    setExamMsg(null);
  }, [language.code]);

  const examQuestions = [
    {
      prompt: `1. Script & Phonology: Which phonological feature governs ${language.name} articulation?`,
      options: [language.phoneticsFocusJson[0], 'Zero vowel distinctions', 'Unstressed silence'],
      answerIndex: 0,
    },
    {
      prompt: `2. Grammar Mastery: Which core grammatical pillar shapes ${language.name} syntax?`,
      options: [language.grammarPillarsJson[0], 'Arbitrary word shuffling', 'None'],
      answerIndex: 0,
    },
    {
      prompt: `3. Written Framework: What script system does ${language.name} utilize?`,
      options: [language.script, 'Linear A', 'Morse code'],
      answerIndex: 0,
    },
  ];

  const handleExamAction = async (saveOnly = false) => {
    let correct = 0;
    examQuestions.forEach((q, i) => {
      if (answers[i] === q.answerIndex) correct += 1;
    });
    const score = Math.round((correct / examQuestions.length) * 100);

    const res = await fetch('/api/exams/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        languageCode: language.code,
        examType: 'level',
        targetLevel: currentLevel === 'Pre-A1' ? 'A1' : currentLevel,
        answers,
        score,
        status: saveOnly ? 'in_progress' : 'completed',
      }),
    });
    const data = await res.json();
    if (saveOnly) {
      setExamMsg('Examination progress saved so you can resume later.');
    } else if (data.promotedTo) {
      setExamMsg(`Congratulations! All mastery gates passed (${score}%). Promoted to ${data.promotedTo}.`);
    } else {
      setExamMsg(`Level Examination scored ${score}%. Ensure all mandatory topic & skill thresholds are met to unlock the next level.`);
    }
    setTakingExam(false);
    await loadExams();
    await onProgressUpdated();
  };

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <FileCheck2 className="w-4 h-4" />
          <span>Examinations & Level Progression Rules</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-950 mt-1">
          Current Proficiency: {currentLevel} ({language.name})
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Advancement requires mandatory curriculum completion, skill mastery thresholds (70%), and passing the cumulative Level Examination—never automatic XP alone.
        </p>

        <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            {progression.eligibleForNextLevel ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>All progression gates satisfied for promotion!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Remaining Progression Requirements</span>
              </>
            )}
          </div>
          {!progression.eligibleForNextLevel && (
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
              {progression.unmetRequirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              setTakingExam(!takingExam);
              setExamMsg(null);
            }}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            {takingExam ? 'Cancel Examination' : `Launch ${currentLevel} Cumulative Level Examination`}
          </button>
        </div>
      </div>

      {examMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
          {examMsg}
        </div>
      )}

      {takingExam && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-950">
            Cumulative Level Examination · {language.name}
          </h3>
          {examQuestions.map((q, qIdx) => (
            <div key={qIdx} className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="text-sm font-medium text-slate-900">{q.prompt}</div>
              <div className="space-y-1.5 text-xs">
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`exam-q-${qIdx}`}
                      checked={answers[qIdx] === oIdx}
                      onChange={() => setAnswers((p) => ({ ...p, [qIdx]: oIdx }))}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => handleExamAction(true)}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Save & Resume Later
            </button>
            <button
              type="button"
              onClick={() => handleExamAction(false)}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Submit Final Examination
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-display text-base font-bold text-slate-950 mb-3">Examination History</h3>
        {attempts.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {attempts.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between">
                <span className="font-medium text-slate-800 capitalize">
                  {a.examType} Exam ({a.targetLevel}) · {a.status}
                </span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {a.score}% · {a.passed ? 'Passed' : 'Not Passed'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No examinations taken yet for {language.name}.</p>
        )}
      </div>
    </div>
  );
};
