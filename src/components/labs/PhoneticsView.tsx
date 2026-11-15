import React, { useRef, useState } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';
import { getPhoneticsAcademy } from '../../data/phoneticsData';
import { LanguageEnvironment } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface PhoneticsViewProps {
  language: LanguageEnvironment;
}

export const PhoneticsView: React.FC<PhoneticsViewProps> = ({ language }) => {
  const academy = getPhoneticsAcademy(language.code, language.name, language.phoneticsFocusJson);
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);
  const [transcriptByIdx, setTranscriptByIdx] = useState<Record<number, string>>({});
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async (idx: number, targetWord: string) => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setBusyIdx(idx);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const res = String(reader.result || '');
              resolve(res.split(',')[1] || '');
            };
            reader.readAsDataURL(blob);
          });
          const resp = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
              languageName: language.name,
              languageCode: language.code,
              targetPrompt: targetWord,
            }),
          });
          const data = await resp.json();
          if (resp.ok) {
            setTranscriptByIdx((prev) => ({
              ...prev,
              [idx]: data.transcript || 'Audio captured — try speaking clearly near your microphone.',
            }));
          } else {
            setErrorMsg(data.error || 'Could not analyze pronunciation recording.');
          }
        } finally {
          setBusyIdx(null);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingIdx(idx);
    } catch {
      setErrorMsg('Microphone permission is required for live pronunciation recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingIdx(null);
  };

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="text-xs font-semibold text-blue-700">
          Phonetics & Pronunciation Academy · {language.script}
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-950 mt-1">
          Sound System & Articulation in {language.name}
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{academy.overview}</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-semibold text-slate-900">Writing System Mechanics</div>
            <p className="text-slate-600 mt-1 leading-relaxed">{academy.writingSystemNotes}</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-semibold text-slate-900">Stress, Rhythm & Intonation</div>
            <p className="text-slate-600 mt-1 leading-relaxed">{academy.stressAndRhythm}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {academy.drills.map((drill, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-xl font-bold text-blue-800">{drill.symbol}</span>
                <span className="font-mono text-xs text-slate-500">{drill.ipa}</span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-1">{drill.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{drill.articulation}</p>

              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="font-semibold text-slate-900">Example: {drill.exampleWord}</div>
                <div className="text-slate-600 mt-0.5">{drill.exampleGloss}</div>
              </div>

              {drill.minimalPair && (
                <div className="mt-3 text-xs text-slate-700">
                  <span className="font-semibold">Minimal Pair:</span> {drill.minimalPair.a} vs {drill.minimalPair.b}{' '}
                  <span className="text-slate-500">({drill.minimalPair.contrast})</span>
                </div>
              )}

              {transcriptByIdx[idx] && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  Recognized speech: <span className="font-semibold">{transcriptByIdx[idx]}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => playLanguageAudio(drill.exampleWord, language.code)}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen Native Model
              </button>

              {recordingIdx === idx ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyIdx === idx}
                  onClick={() => startRecording(idx, drill.exampleWord)}
                  className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  {busyIdx === idx ? 'Checking...' : 'Record'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
