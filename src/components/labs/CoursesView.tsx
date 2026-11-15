import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, ChevronRight, Volume2 } from 'lucide-react';
import { LanguageEnvironment, TopicItem } from '../../types';
import { playLanguageAudio } from '../../utils/audio';

interface CoursesViewProps {
  language: LanguageEnvironment;
  onProgressUpdated: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

const LESSON_STAGES = [
  '1. Objectives & Intro',
  '2. Grammar Core',
  '3. Listening & Reading',
  '4. Production & Culture',
  '5. Topic Assessment',
];

export const CoursesView: React.FC<CoursesViewProps> = ({
  language,
  onProgressUpdated,
  onNavigateTab,
}) => {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/curriculum/${language.code}`, { credentials: 'include' });
      const data = await res.json();
      setTopics(data.topics ?? []);
      if (data.topics?.length > 0) {
        setSelectedTopic((prev) =>
          prev ? data.topics.find((t: TopicItem) => t.id === prev.id) ?? data.topics[0] : data.topics[0]
        );
      } else {
        setSelectedTopic(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
    setStageIdx(0);
    setQuizAnswers({});
    setCelebrationMsg(null);
  }, [language.code]);

  const handleCompleteStage = async (isFinal = false) => {
    if (!selectedTopic) return;
    let score = 85;
    let mastered = selectedTopic.mastered ?? false;

    if (isFinal) {
      const quiz = selectedTopic.lessonContentJson.finalQuiz ?? [];
      let correct = 0;
      quiz.forEach((q, idx) => {
        if (quizAnswers[idx] === q.answerIndex) correct += 1;
      });
      score = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 100;
      mastered = score >= 70;
    }

    const completedSteps = Array.from(
      new Set([...(selectedTopic.completedSteps ?? []), LESSON_STAGES[stageIdx]])
    );

    const res = await fetch('/api/curriculum/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        topicId: selectedTopic.id,
        languageCode: language.code,
        completedSteps,
        assessmentScore: score,
        mastered,
      }),
    });
    const data = await res.json();

    if (isFinal && mastered) {
      setCelebrationMsg(
        `Topic Mastered (${score}%)! Earned +${data.xpEarned ?? 50} XP toward your ${language.name} level progression.`
      );
    } else if (stageIdx < LESSON_STAGES.length - 1) {
      setStageIdx(stageIdx + 1);
    }

    await loadTopics();
    await onProgressUpdated();
  };

  if (loading) {
    return <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 wl-fade-up" dir={language.direction}>
      {/* Left Topic List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-display text-base font-bold text-slate-950">
            {language.name} Curriculum
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{language.progressionFramework}</p>
        </div>

        {topics.map((topic) => {
          const isSelected = selectedTopic?.id === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => {
                setSelectedTopic(topic);
                setStageIdx(0);
                setQuizAnswers({});
                setCelebrationMsg(null);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-600'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Topic 0{topic.orderIndex} · {topic.cefrLevel}
                </span>
                {topic.mastered && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mastered
                  </span>
                )}
              </div>
              <div className="font-display text-sm font-bold text-slate-950 mt-1">{topic.title}</div>
              <div className="text-xs text-slate-600 mt-0.5">{topic.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Right Lesson Player */}
      <div className="lg:col-span-8">
        {selectedTopic ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div>
              <div className="text-xs font-semibold text-blue-700">
                {selectedTopic.cefrLevel} · {selectedTopic.isMandatory ? 'Mandatory Curriculum Topic' : 'Elective Topic'}
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-950 mt-1">
                {selectedTopic.title}
              </h3>

              {/* Stage Selector */}
              <div className="mt-4 flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
                {LESSON_STAGES.map((st, idx) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStageIdx(idx)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      stageIdx === idx ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {celebrationMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
                <Award className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-display text-sm font-bold">Lesson Completed!</div>
                  <div className="text-xs mt-0.5">{celebrationMsg}</div>
                </div>
              </div>
            )}

            {stageIdx === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedTopic.lessonContentJson.introduction}
                </p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-xs font-semibold text-slate-900">Learning Objectives</h4>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {selectedTopic.objectivesJson.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('vocabulary')}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Practice Topic Vocabulary in SRS →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteStage(false)}
                    className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    Continue to Grammar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {stageIdx === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-blue-700">Grammar Focus</div>
                  <h4 className="font-display text-base font-bold text-slate-900 mt-1">
                    {selectedTopic.lessonContentJson.grammarSummary}
                  </h4>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    {selectedTopic.lessonContentJson.grammarRule}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('grammar')}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Open Full Grammar Lab Drills →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteStage(false)}
                    className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    Continue to Reading & Listening
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {stageIdx === 2 && (
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700">Connected Reading & Audio Passage</span>
                    <button
                      type="button"
                      onClick={() =>
                        playLanguageAudio(selectedTopic.lessonContentJson.readingPassage, language.code)
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Listen
                    </button>
                  </div>
                  <p className="text-base text-slate-900 leading-relaxed">
                    {selectedTopic.lessonContentJson.readingPassage}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCompleteStage(false)}
                    className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    Continue to Production & Culture
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {stageIdx === 3 && (
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-emerald-700">Speaking Activity</div>
                  <p className="text-sm text-slate-800 mt-1">{selectedTopic.lessonContentJson.speakingPrompt}</p>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('speaking')}
                    className="mt-2 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Practice in AI Speaking & Writing Lab →
                  </button>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-amber-700">Cultural Context</div>
                  <p className="text-sm text-slate-700 mt-1">{selectedTopic.lessonContentJson.culturalNote}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCompleteStage(false)}
                    className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    Proceed to Topic Assessment
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {stageIdx === 4 && (
              <div className="space-y-4">
                <h4 className="font-display text-base font-bold text-slate-900">
                  Final Topic Mastery Check (70% required)
                </h4>
                {selectedTopic.lessonContentJson.finalQuiz.map((q, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-slate-900">{q.prompt}</p>
                    <div className="space-y-1.5 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`topic-q-${idx}`}
                            checked={quizAnswers[idx] === oIdx}
                            onChange={() => setQuizAnswers((p) => ({ ...p, [idx]: oIdx }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCompleteStage(true)}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Submit Topic Assessment & Claim XP
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
            No topics found for {language.name}.
          </div>
        )}
      </div>
    </div>
  );
};
