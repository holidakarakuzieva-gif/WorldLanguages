export type CefrLevel = 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type UserRole = 'student' | 'founder';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  nativeLanguage: string;
  interfaceLanguage: string;
  country: string | null;
  dailyGoalMinutes: number;
  emailVerified: boolean;
  xp: number;
  streakDays: number;
  createdAt: string;
}

export interface LanguageEnvironment {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  script: string;
  direction: 'ltr' | 'rtl';
  family: string;
  region: string;
  variantsJson: string[];
  phoneticsFocusJson: string[];
  grammarPillarsJson: string[];
  progressionFramework: string;
  description: string;
  isPublished: boolean;
}

export interface UserLanguageProgress {
  id: number;
  userId: number;
  languageCode: string;
  dialectVariant: string;
  currentLevel: CefrLevel;
  placementCompleted: boolean;
  placementSummaryJson: Record<string, unknown> | null;
  xp: number;
  studyMinutes: number;
  streakDays: number;
  grammarMastery: number;
  readingMastery: number;
  listeningMastery: number;
  speakingMastery: number;
  writingMastery: number;
  isActive: boolean;
}

export interface VocabularyItem {
  id: number;
  languageCode: string;
  cefrLevel: string;
  topicSlug: string;
  word: string;
  romanization: string | null;
  ipa: string | null;
  translationEn: string;
  translationsJson: Record<string, string> | null;
  definition: string;
  partOfSpeech: string;
  grammaticalInfoJson: Record<string, unknown> | null;
  exampleSentence: string;
  exampleTranslation: string;
  synonymsJson: string[] | null;
  antonymsJson: string[] | null;
}

export interface SrsCard extends VocabularyItem {
  reviewId: number | null;
  srsStatus: 'New' | 'Learning' | 'Reviewing' | 'Familiar' | 'Mastered';
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextReviewAt: string | null;
}

export interface TopicItem {
  id: number;
  languageCode: string;
  cefrLevel: string;
  orderIndex: number;
  title: string;
  subtitle: string;
  objectivesJson: string[];
  lessonContentJson: {
    introduction: string;
    grammarSummary: string;
    grammarRule: string;
    readingPassage: string;
    readingQuestion: { prompt: string; options: string[]; answerIndex: number };
    listeningScript: string;
    listeningQuestion: { prompt: string; options: string[]; answerIndex: number };
    speakingPrompt: string;
    writingPrompt: string;
    culturalNote: string;
    finalQuiz: Array<{ prompt: string; options: string[]; answerIndex: number; explanation: string }>;
  };
  isMandatory: boolean;
  completedSteps?: string[];
  assessmentScore?: number;
  mastered?: boolean;
}

export interface GrammarTopicItem {
  id: number;
  languageCode: string;
  cefrLevel: string;
  title: string;
  difficulty: string;
  explanation: string;
  patternsJson: string[];
  examplesJson: Array<{ target: string; gloss: string; translation: string }>;
  commonMistakesJson: Array<{ wrong: string; right: string; note: string }>;
  comparisonsJson: string[] | null;
  exercisesJson: Array<{
    id: string;
    prompt: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
  userProgress?: {
    diagnosticSkipped: boolean;
    score: number;
    mastered: boolean;
  };
}

export interface ReadingMaterialItem {
  id: number;
  languageCode: string;
  cefrLevel: string;
  genre: string;
  title: string;
  wordCount: number;
  content: string;
  glossaryJson: Record<string, { translation: string; pos: string; note: string }>;
  questionsJson: Array<{
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
  sourceType: 'verified_curriculum' | 'ai_generated' | 'public_domain';
  completed?: boolean;
  bookmarked?: boolean;
  comprehensionScore?: number;
}

export interface ListeningResourceItem {
  id: number;
  languageCode: string;
  cefrLevel: string;
  accent: string;
  topic: string;
  mediaType: string;
  title: string;
  sourceName: string;
  licenseStatus: string;
  externalUrl: string;
  embedUrl: string | null;
  subtitlesJson: Array<{
    startSec: number;
    endSec: number;
    text: string;
    translation: string;
  }>;
  questionsJson: Array<{
    question: string;
    options: string[];
    answerIndex: number;
  }>;
  lastVerifiedAt: string;
}

export interface CulturalEntryItem {
  id: number;
  languageCode: string;
  region: string;
  category: string;
  title: string;
  historicalContext: string;
  modernPractice: string;
  summary: string;
  referencesJson: string[];
}

export interface RecommendationItem {
  id: number;
  category: string;
  title: string;
  reason: string;
  targetRoute: string;
  priority: number;
  resolved: boolean;
}
