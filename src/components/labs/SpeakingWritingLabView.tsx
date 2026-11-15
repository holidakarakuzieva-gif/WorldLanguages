import React, { useRef, useState } from 'react';
import { Mic, PenTool, Send, Square, Volume2 } from 'lucide-react';
import { LanguageEnvironment } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface SpeakingWritingLabViewProps {
  language: LanguageEnvironment;
  currentLevel: string;
  onProgressUpdated: () => Promise<void>;
}

export const SpeakingWritingLabView: React.FC<SpeakingWritingLabViewProps> = ({
  language,
  currentLevel,
  onProgressUpdated,
}) => {
  const [labTab, setLabTab] = useState<'speaking' | 'writing'>('speaking');

  // Speaking Tutor State
  const [mode, setMode] = useState<'structured' | 'free'>('structured');
  const [topic, setTopic] = useState('Hobbies and daily routine');
  const [personality, setPersonality] = useState('Warm Academic Mentor');
  const [register, setRegister] = useState<'formal' | 'informal'>('informal');
  const [correctionPref, setCorrectionPref] = useState<'immediate' | 'after' | 'on_request'>('immediate');
  const [voiceName, setVoiceName] = useState('Kore');
  const [studentInput, setStudentInput] = useState('');
  const [history, setHistory] = useState<Array<{
    role: 'tutor' | 'student';
    text: string;
    translation?: string;
    corrections?: Array<{ original: string; corrected: string; explanation: string }>;
    rubricNote?: { grammarAccuracy?: string; vocabularyRange?: string; comprehensibility?: string };
  }>>([]);
  const [recording, setRecording] = useState(false);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Writing Laboratory State
  const [writingCefr, setWritingCefr] = useState(currentLevel === 'Pre-A1' ? 'A2' : currentLevel);
  const [writingPrompt, setWritingPrompt] = useState(
    `Write a short message or paragraph in ${language.name} describing your city and daily routine.`
  );
  const [writingText, setWritingText] = useState('');
  const [writingResult, setWritingResult] = useState<{
    originalText: string;
    evaluation: {
      mistakes: Array<{
        originalFragment: string;
        category: string;
        explanation: string;
        suggestedCorrection: string;
      }>;
      improvedVersion: string;
      overallAssessment: string;
      criteriaScores: {
        grammarAndAccents: number;
        vocabularyAndNaturalness: number;
        coherenceAndTask: number;
      };
    };
  } | null>(null);
  const [writingBusy, setWritingBusy] = useState(false);
  const [writingError, setWritingError] = useState<string | null>(null);

  const sendTutorTurn = async (messageText: string) => {
    if (!messageText.trim()) return;
    setTutorBusy(true);
    setTutorError(null);
    const nextHistory = [...history, { role: 'student' as const, text: messageText }];
    setHistory(nextHistory);
    setStudentInput('');

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          languageCode: language.code,
          languageName: language.name,
          cefrLevel: currentLevel === 'Pre-A1' ? 'A1' : currentLevel,
          mode,
          topic,
          personality,
          register,
          correctionPreference: correctionPref,
          history: nextHistory.map((h) => ({ role: h.role, text: h.text })),
          studentMessage: messageText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tutor request failed.');
      setHistory((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: data.tutorReply,
          translation: data.replyTranslation,
          corrections: data.corrections,
          rubricNote: data.rubricNote,
        },
      ]);
      playLanguageAudio(data.tutorReply, language.code, voiceName);
      await onProgressUpdated();
    } catch (err: unknown) {
      setTutorError(err instanceof Error ? err.message : 'Unable to reach AI Tutor.');
    } finally {
      setTutorBusy(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    setTutorError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
          reader.readAsDataURL(blob);
        });
        setTutorBusy(true);
        try {
          const resp = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
              languageName: language.name,
              languageCode: language.code,
              targetPrompt: topic,
            }),
          });
          const data = await resp.json();
          if (resp.ok && data.transcript) {
            await sendTutorTurn(data.transcript);
          } else {
            setTutorError(data.error || 'Could not transcribe spoken audio.');
          }
        } finally {
          setTutorBusy(false);
        }
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setTutorError('Microphone access is needed for real spoken audio recognition.');
    }
  };

  const handleEvaluateWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    setWritingBusy(true);
    setWritingError(null);
    try {
      const res = await fetch('/api/ai/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          languageCode: language.code,
          languageName: language.name,
          cefrLevel: writingCefr,
          prompt: writingPrompt,
          studentText: writingText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Writing evaluation failed.');
      setWritingResult(data);
      await onProgressUpdated();
    } catch (err: unknown) {
      setWritingError(err instanceof Error ? err.message : 'Writing evaluation failed.');
    } finally {
      setWritingBusy(false);
    }
  };

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit text-xs font-medium">
        <button
          type="button"
          onClick={() => setLabTab('speaking')}
          className={`px-4 py-2 rounded-md inline-flex items-center gap-1.5 cursor-pointer ${
            labTab === 'speaking' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          AI Speaking Tutor
        </button>
        <button
          type="button"
          onClick={() => setLabTab('writing')}
          className={`px-4 py-2 rounded-md inline-flex items-center gap-1.5 cursor-pointer ${
            labTab === 'writing' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Writing Laboratory (A2–C2)
        </button>
      </div>

      {labTab === 'speaking' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tutor Customization */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="font-display text-base font-bold text-slate-950">AI Tutor Configuration</h3>

            <div>
              <label htmlFor="tutor-mode" className="block font-medium text-slate-700 mb-1">Conversation Mode</label>
              <select
                id="tutor-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'structured' | 'free')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="structured">Mode A: Structured Course Questions</option>
                <option value="free">Mode B: Free Conversation</option>
              </select>
            </div>

            <div>
              <label htmlFor="tutor-topic" className="block font-medium text-slate-700 mb-1">Subject / Topic</label>
              <input
                id="tutor-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="tutor-voice" className="block font-medium text-slate-700 mb-1">AI Voice</label>
              <select
                id="tutor-voice"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tutor-personality" className="block font-medium text-slate-700 mb-1">Tutor Style & Register</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  id="tutor-personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Warm Academic Mentor">Warm Mentor</option>
                  <option value="Strict Examiner">Strict Examiner</option>
                  <option value="Conversational Friend">Friendly Local</option>
                </select>
                <select
                  aria-label="Register"
                  value={register}
                  onChange={(e) => setRegister(e.target.value as 'formal' | 'informal')}
                  className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="informal">Informal</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tutor-correction" className="block font-medium text-slate-700 mb-1">Correction Timing</label>
              <select
                id="tutor-correction"
                value={correctionPref}
                onChange={(e) => setCorrectionPref(e.target.value as typeof correctionPref)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="immediate">Correct mistakes immediately</option>
                <option value="after">Correct after finishing speaking</option>
                <option value="on_request">Provide corrections only when asked</option>
              </select>
            </div>
          </div>

          {/* Conversation Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
              {history.length === 0 ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                  Start speaking with your microphone or type a message in {language.name}. Your AI tutor tracks grammar accuracy, vocabulary range, and comprehensibility transparently.
                </div>
              ) : (
                history.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-sm ${
                      turn.role === 'student'
                        ? 'bg-blue-50/70 border-blue-200 ml-8'
                        : 'bg-slate-50 border-slate-200 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>{turn.role === 'student' ? 'You' : `${language.name} AI Tutor`}</span>
                      {turn.role === 'tutor' && (
                        <button
                          type="button"
                          onClick={() => playLanguageAudio(turn.text, language.code, voiceName)}
                          className="inline-flex items-center gap-1 text-blue-700 hover:underline cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Replay
                        </button>
                      )}
                    </div>
                    <p className="text-slate-950">{turn.text}</p>
                    {turn.translation && (
                      <p className="text-xs text-slate-500 mt-1">{turn.translation}</p>
                    )}
                    {turn.corrections && turn.corrections.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs space-y-1">
                        {turn.corrections.map((c, ci) => (
                          <div key={ci} className="text-amber-900">
                            <span className="line-through text-red-700">{c.original}</span> →{' '}
                            <span className="font-semibold text-emerald-800">{c.corrected}</span> ({c.explanation})
                          </div>
                        ))}
                      </div>
                    )}
                    {turn.rubricNote && (
                      <div className="mt-2 text-xs text-slate-500">
                        Rubric: {turn.rubricNote.grammarAccuracy} · {turn.rubricNote.comprehensibility}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              {tutorError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {tutorError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  aria-label={recording ? 'Stop voice recording' : 'Record spoken response'}
                  className={`p-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    recording
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {recording ? 'Stop' : 'Speak'}
                </button>
                <input
                  type="text"
                  aria-label="Conversation reply"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !tutorBusy) sendTutorTurn(studentInput);
                  }}
                  placeholder={`Reply in ${language.name}...`}
                  className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  disabled={tutorBusy || !studentInput.trim()}
                  onClick={() => sendTutorTurn(studentInput)}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {tutorBusy ? 'Thinking...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleEvaluateWriting} className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-950">Structured Writing Task</h3>
              <select
                aria-label="Writing CEFR level"
                value={writingCefr}
                onChange={(e) => setWritingCefr(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white"
              >
                {['A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                  <option key={lvl} value={lvl}>CEFR {lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="writing-prompt" className="block text-xs font-medium text-slate-700 mb-1">
                Writing Prompt
              </label>
              <input
                id="writing-prompt"
                type="text"
                value={writingPrompt}
                onChange={(e) => setWritingPrompt(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="writing-draft" className="block text-xs font-medium text-slate-700 mb-1">
                Your Composition ({language.name})
              </label>
              <textarea
                id="writing-draft"
                rows={7}
                required
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                placeholder={`Write your ${writingCefr} composition in ${language.name}...`}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            {writingError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">{writingError}</div>
            )}

            <button
              type="submit"
              disabled={writingBusy}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {writingBusy ? 'Analyzing Draft...' : 'Evaluate Grammar, Diacritics & Cohesion'}
            </button>
          </form>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-950">Line-by-Line Diagnostic Report</h3>
            {writingResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-semibold text-slate-900">1. Preserved Original Draft</div>
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">{writingResult.originalText}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">Grammar & Accents</div>
                    <div className="font-mono-num text-base font-bold text-slate-950 mt-0.5">
                      {writingResult.evaluation.criteriaScores?.grammarAndAccents ?? 0}%
                    </div>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">Vocabulary</div>
                    <div className="font-mono-num text-base font-bold text-slate-950 mt-0.5">
                      {writingResult.evaluation.criteriaScores?.vocabularyAndNaturalness ?? 0}%
                    </div>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">Coherence</div>
                    <div className="font-mono-num text-base font-bold text-slate-950 mt-0.5">
                      {writingResult.evaluation.criteriaScores?.coherenceAndTask ?? 0}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-900 mb-2">2. Identified Mistakes & Explanations</div>
                  {writingResult.evaluation.mistakes?.length > 0 ? (
                    <div className="space-y-2">
                      {writingResult.evaluation.mistakes.map((m, i) => (
                        <div key={i} className="p-3 border border-amber-200 bg-amber-50/40 rounded-lg">
                          <div>
                            <span className="font-semibold text-slate-900">{m.category}:</span>{' '}
                            <span className="line-through text-red-700">{m.originalFragment}</span> →{' '}
                            <span className="font-semibold text-emerald-800">{m.suggestedCorrection}</span>
                          </div>
                          <div className="text-slate-600 mt-1">{m.explanation}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-emerald-700">No structural errors detected at this CEFR level.</p>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="font-semibold text-emerald-900">3. Improved Version</div>
                  <p className="text-slate-800 mt-1">{writingResult.evaluation.improvedVersion}</p>
                </div>

                <p className="text-slate-700 leading-relaxed">
                  <span className="font-semibold">Overall Assessment:</span> {writingResult.evaluation.overallAssessment}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Submit your draft on the left to see preserved original text, itemized mistake explanations, and an improved natural version.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
