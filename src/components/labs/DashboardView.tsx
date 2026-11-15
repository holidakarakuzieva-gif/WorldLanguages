import React from 'react';
import { ArrowRight, Award, BookOpen, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { LanguageEnvironment, RecommendationItem, UserLanguageProgress, UserProfile } from '../../types';

export interface DashboardPayload {
  activeLanguage: UserLanguageProgress;
  enrolledLanguages: UserLanguageProgress[];
  metrics: {
    completionPercentage: number;
    knowledgeMastery: number;
    totalVocabularyAvailable: number;
    vocabularyLearned: number;
    vocabularyDue: number;
    vocabularyOverdue: number;
    vocabularyMastered: number;
    completedTopics: number;
    totalTopics: number;
    grammarMastery: number;
    readingProgress: number;
    listeningProgress: number;
    speakingProgress: number;
    writingProgress: number;
  };
  recommendations: RecommendationItem[];
  achievements: Array<{ slug: string; title: string; description: string; xpReward: number; category: string }>;
  recentExams: Array<{ id: number; examType: string; targetLevel: string; score: number; passed: boolean }>;
}

interface DashboardViewProps {
  user: UserProfile;
  language: LanguageEnvironment;
  data: DashboardPayload | null;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  language,
  data,
  loading,
  onNavigateTab,
}) => {
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { activeLanguage, metrics, recommendations, achievements, recentExams } = data;
  const skillBars = [
    { label: 'Grammar Mastery', value: metrics.grammarMastery, tab: 'grammar' },
    { label: 'Reading Comprehension', value: metrics.readingProgress, tab: 'reading' },
    { label: 'Listening Comprehension', value: metrics.listeningProgress, tab: 'listening' },
    { label: 'Speaking Readiness', value: metrics.speakingProgress, tab: 'speaking' },
    { label: 'Writing Precision', value: metrics.writingProgress, tab: 'speaking' },
  ];

  const sortedSkills = [...skillBars].sort((a, b) => a.value - b.value);
  const weakArea = sortedSkills[0];
  const strongArea = sortedSkills[sortedSkills.length - 1];

  return (
    <div className="space-y-6 wl-fade-up" dir={language.direction}>
      {/* Placement Prompt if not yet taken */}
      {!activeLanguage.placementCompleted && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-800">Initial Diagnostic Recommended</p>
            <h3 className="font-display text-lg font-bold text-slate-950 mt-0.5">
              Calibrate Your {language.name} Proficiency ({activeLanguage.currentLevel})
            </h3>
            <p className="text-sm text-slate-700 mt-1">
              Complete the multi-skill placement evaluation or choose the Absolute Beginner Pathway to unlock your personalized roadmap.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('placement')}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Placement
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Current Level · {activeLanguage.dialectVariant}</div>
          <div className="font-mono-num text-2xl font-bold text-slate-950 mt-1">
            {activeLanguage.currentLevel}
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {metrics.completedTopics}/{metrics.totalTopics} curriculum topics mastered ({metrics.completionPercentage}%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Vocabulary & SRS Queue</div>
          <div className="font-mono-num text-2xl font-bold text-slate-950 mt-1">
            {metrics.vocabularyDue} due
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {metrics.vocabularyLearned} studied · {metrics.vocabularyMastered} mastered · {metrics.vocabularyOverdue} overdue
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Overall Knowledge Mastery</div>
          <div className="font-mono-num text-2xl font-bold text-emerald-700 mt-1">
            {metrics.knowledgeMastery}%
          </div>
          <div className="text-xs text-slate-600 mt-2">
            Strongest: {strongArea.label} ({strongArea.value}%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Streak & Study XP</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono-num text-2xl font-bold text-slate-950 mt-1">
            {user.streakDays}d · {user.xp} XP
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {activeLanguage.studyMinutes} min logged · Goal: {user.dailyGoalMinutes} min/day
          </div>
        </div>
      </div>

      {/* Skill Breakdown + Personal Learning Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950">Skill Mastery Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated from verified assessments, exercises, and laboratory submissions
              </p>
            </div>
            <span className="text-xs font-medium text-amber-700 whitespace-nowrap shrink-0">
              Focus area: {weakArea.label}
            </span>
          </div>

          <div className="space-y-4">
            {skillBars.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigateTab(s.tab)}
                    className="font-medium text-slate-800 hover:text-blue-700 cursor-pointer"
                  >
                    {s.label}
                  </button>
                  <span className="font-mono-num font-semibold text-slate-900">{s.value}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.value >= 75 ? 'bg-emerald-600' : s.value >= 40 ? 'bg-blue-700' : 'bg-amber-500'
                    }`}
                    style={{ width: `${s.value === 0 ? 0 : Math.min(100, Math.max(4, s.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('courses')}
              className="px-4 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Continue Course Topics
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('vocabulary')}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Review {metrics.vocabularyDue} Flashcards
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('exams')}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Check Level Progression
            </button>
          </div>
        </div>

        {/* Adaptive Recommendations */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Sparkles className="w-4 h-4" />
              <span>Personal Learning Engine</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-950 mt-1">
              Recommended Next Actions
            </h3>

            <div className="mt-4 space-y-3">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{rec.title}</span>
                      <span className="text-xs text-slate-500">{rec.category}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.reason}</p>
                    <button
                      type="button"
                      onClick={() => onNavigateTab(rec.targetRoute)}
                      className="mt-2 text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open {rec.targetRoute}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
                  Start with the Phonetics Academy or Topic 01 to generate performance-driven recommendations tailored to your actual answers.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-900 mb-2">Recent Assessments</h4>
            {recentExams.length > 0 ? (
              <div className="space-y-1.5 text-xs">
                {recentExams.slice(0, 3).map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between text-slate-700">
                    <span className="capitalize">{ex.examType} ({ex.targetLevel})</span>
                    <span className="font-mono-num font-semibold">
                      {ex.score}% · {ex.passed ? 'Passed' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No examinations recorded yet for {language.name}.</p>
            )}
          </div>
        </div>
      </div>

      {/* Achievements Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="font-display text-base font-bold text-slate-950">Earned Milestones</h3>
          </div>
          <span className="font-mono-num text-xs text-slate-500">{achievements.length} unlocked</span>
        </div>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div key={a.slug} className="p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{a.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Complete your first topic, 10 SRS flashcards, or a reading passage to earn verified learning badges.
          </p>
        )}
      </div>
    </div>
  );
};
