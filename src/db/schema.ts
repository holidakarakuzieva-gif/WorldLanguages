import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name').notNull(),
  role: text('role').notNull().default('student'),
  nativeLanguage: text('native_language').notNull().default('English'),
  interfaceLanguage: text('interface_language').notNull().default('en'),
  country: text('country'),
  dailyGoalMinutes: integer('daily_goal_minutes').notNull().default(20),
  emailVerified: boolean('email_verified').notNull().default(false),
  xp: integer('xp').notNull().default(0),
  streakDays: integer('streak_days').notNull().default(0),
  lastStudyDate: text('last_study_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)]
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const languages = pgTable('languages', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  nativeName: text('native_name').notNull(),
  script: text('script').notNull(),
  direction: text('direction').notNull().default('ltr'),
  family: text('family').notNull(),
  region: text('region').notNull(),
  variantsJson: jsonb('variants_json').$type<string[]>().notNull(),
  phoneticsFocusJson: jsonb('phonetics_focus_json').$type<string[]>().notNull(),
  grammarPillarsJson: jsonb('grammar_pillars_json').$type<string[]>().notNull(),
  progressionFramework: text('progression_framework').notNull(),
  description: text('description').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userLanguages = pgTable(
  'user_languages',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    languageCode: text('language_code').notNull(),
    dialectVariant: text('dialect_variant').notNull().default('Standard'),
    currentLevel: text('current_level').notNull().default('Pre-A1'),
    placementCompleted: boolean('placement_completed').notNull().default(false),
    placementSummaryJson: jsonb('placement_summary_json').$type<Record<string, unknown>>(),
    xp: integer('xp').notNull().default(0),
    studyMinutes: integer('study_minutes').notNull().default(0),
    streakDays: integer('streak_days').notNull().default(0),
    grammarMastery: integer('grammar_mastery').notNull().default(0),
    readingMastery: integer('reading_mastery').notNull().default(0),
    listeningMastery: integer('listening_mastery').notNull().default(0),
    speakingMastery: integer('speaking_mastery').notNull().default(0),
    writingMastery: integer('writing_mastery').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('user_languages_unique_idx').on(t.userId, t.languageCode)]
);

export const topics = pgTable(
  'topics',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code').notNull(),
    cefrLevel: text('cefr_level').notNull(),
    orderIndex: integer('order_index').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    objectivesJson: jsonb('objectives_json').$type<string[]>().notNull(),
    lessonContentJson: jsonb('lesson_content_json').$type<Record<string, unknown>>().notNull(),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    status: text('status').notNull().default('published'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('topics_lang_level_idx').on(t.languageCode, t.cefrLevel)]
);

export const topicProgress = pgTable(
  'topic_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    topicId: integer('topic_id')
      .references(() => topics.id, { onDelete: 'cascade' })
      .notNull(),
    languageCode: text('language_code').notNull(),
    completedStepsJson: jsonb('completed_steps_json').$type<string[]>().notNull(),
    assessmentScore: integer('assessment_score').notNull().default(0),
    mastered: boolean('mastered').notNull().default(false),
    completedAt: timestamp('completed_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('topic_progress_unique_idx').on(t.userId, t.topicId)]
);

export const vocabulary = pgTable(
  'vocabulary',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code').notNull(),
    cefrLevel: text('cefr_level').notNull(),
    topicSlug: text('topic_slug').notNull(),
    word: text('word').notNull(),
    romanization: text('romanization'),
    ipa: text('ipa'),
    translationEn: text('translation_en').notNull(),
    translationsJson: jsonb('translations_json').$type<Record<string, string>>(),
    definition: text('definition').notNull(),
    partOfSpeech: text('part_of_speech').notNull(),
    grammaticalInfoJson: jsonb('grammatical_info_json').$type<Record<string, unknown>>(),
    exampleSentence: text('example_sentence').notNull(),
    exampleTranslation: text('example_translation').notNull(),
    synonymsJson: jsonb('synonyms_json').$type<string[]>(),
    antonymsJson: jsonb('antonyms_json').$type<string[]>(),
    status: text('status').notNull().default('published'),
  },
  (t) => [index('vocab_lang_level_idx').on(t.languageCode, t.cefrLevel)]
);

export const vocabularyReviews = pgTable(
  'vocabulary_reviews',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    vocabId: integer('vocab_id')
      .references(() => vocabulary.id, { onDelete: 'cascade' })
      .notNull(),
    languageCode: text('language_code').notNull(),
    srsStatus: text('srs_status').notNull().default('New'),
    easeFactor: integer('ease_factor').notNull().default(250),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    nextReviewAt: timestamp('next_review_at').defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at'),
  },
  (t) => [uniqueIndex('vocab_review_unique_idx').on(t.userId, t.vocabId)]
);

export const grammarTopics = pgTable(
  'grammar_topics',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code').notNull(),
    cefrLevel: text('cefr_level').notNull(),
    title: text('title').notNull(),
    difficulty: text('difficulty').notNull().default('Core'),
    explanation: text('explanation').notNull(),
    patternsJson: jsonb('patterns_json').$type<string[]>().notNull(),
    examplesJson: jsonb('examples_json').$type<Array<{ target: string; gloss: string; translation: string }>>().notNull(),
    commonMistakesJson: jsonb('common_mistakes_json').$type<Array<{ wrong: string; right: string; note: string }>>().notNull(),
    comparisonsJson: jsonb('comparisons_json').$type<string[]>(),
    exercisesJson: jsonb('exercises_json').$type<Array<{ id: string; prompt: string; options: string[]; answerIndex: number; explanation: string }>>().notNull(),
    status: text('status').notNull().default('published'),
  },
  (t) => [index('grammar_lang_idx').on(t.languageCode, t.cefrLevel)]
);

export const grammarProgress = pgTable(
  'grammar_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    grammarTopicId: integer('grammar_topic_id')
      .references(() => grammarTopics.id, { onDelete: 'cascade' })
      .notNull(),
    languageCode: text('language_code').notNull(),
    diagnosticSkipped: boolean('diagnostic_skipped').notNull().default(false),
    score: integer('score').notNull().default(0),
    mastered: boolean('mastered').notNull().default(false),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('grammar_progress_unique_idx').on(t.userId, t.grammarTopicId)]
);

export const readingMaterials = pgTable(
  'reading_materials',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code').notNull(),
    cefrLevel: text('cefr_level').notNull(),
    genre: text('genre').notNull(),
    title: text('title').notNull(),
    wordCount: integer('word_count').notNull(),
    content: text('content').notNull(),
    glossaryJson: jsonb('glossary_json').$type<Record<string, { translation: string; pos: string; note: string }>>().notNull(),
    questionsJson: jsonb('questions_json').$type<Array<{ question: string; options: string[]; answerIndex: number; explanation: string }>>().notNull(),
    sourceType: text('source_type').notNull().default('verified_curriculum'),
    authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('reading_lang_idx').on(t.languageCode, t.cefrLevel)]
);

export const readingProgress = pgTable(
  'reading_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    materialId: integer('material_id')
      .references(() => readingMaterials.id, { onDelete: 'cascade' })
      .notNull(),
    languageCode: text('language_code').notNull(),
    highlightsJson: jsonb('highlights_json').$type<string[]>().notNull(),
    bookmarked: boolean('bookmarked').notNull().default(false),
    comprehensionScore: integer('comprehension_score').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('reading_progress_unique_idx').on(t.userId, t.materialId)]
);

export const listeningResources = pgTable(
  'listening_resources',
  {
    id: serial('id').primaryKey(),
    languageCode: text('language_code').notNull(),
    cefrLevel: text('cefr_level').notNull(),
    accent: text('accent').notNull(),
    topic: text('topic').notNull(),
    mediaType: text('media_type').notNull(),
    title: text('title').notNull(),
    sourceName: text('source_name').notNull(),
    licenseStatus: text('license_status').notNull(),
    externalUrl: text('external_url').notNull(),
    embedUrl: text('embed_url'),
    subtitlesJson: jsonb('subtitles_json').$type<Array<{ startSec: number; endSec: number; text: string; translation: string }>>().notNull(),
    questionsJson: jsonb('questions_json').$type<Array<{ question: string; options: string[]; answerIndex: number }>>().notNull(),
    lastVerifiedAt: text('last_verified_at').notNull(),
    isPublished: boolean('is_published').notNull().default(true),
  },
  (t) => [index('listening_lang_idx').on(t.languageCode, t.cefrLevel)]
);

export const speakingSessions = pgTable('speaking_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  languageCode: text('language_code').notNull(),
  mode: text('mode').notNull(),
  cefrLevel: text('cefr_level').notNull(),
  topic: text('topic').notNull(),
  transcriptJson: jsonb('transcript_json').$type<Array<{ role: 'tutor' | 'student'; text: string }>>().notNull(),
  evaluationJson: jsonb('evaluation_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const writingSubmissions = pgTable('writing_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  languageCode: text('language_code').notNull(),
  cefrLevel: text('cefr_level').notNull(),
  prompt: text('prompt').notNull(),
  originalText: text('original_text').notNull(),
  evaluationJson: jsonb('evaluation_json').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const examinationAttempts = pgTable('examination_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  languageCode: text('language_code').notNull(),
  examType: text('exam_type').notNull(),
  targetLevel: text('target_level').notNull(),
  sectionsJson: jsonb('sections_json').$type<Record<string, unknown>>().notNull(),
  answersJson: jsonb('answers_json').$type<Record<string, unknown>>().notNull(),
  score: integer('score').notNull().default(0),
  passed: boolean('passed').notNull().default(false),
  status: text('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const learningRecommendations = pgTable('learning_recommendations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  languageCode: text('language_code').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  reason: text('reason').notNull(),
  targetRoute: text('target_route').notNull(),
  priority: integer('priority').notNull().default(1),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const culturalEntries = pgTable('cultural_entries', {
  id: serial('id').primaryKey(),
  languageCode: text('language_code').notNull(),
  region: text('region').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  historicalContext: text('historical_context').notNull(),
  modernPractice: text('modern_practice').notNull(),
  summary: text('summary').notNull(),
  referencesJson: jsonb('references_json').$type<string[]>().notNull(),
  isPublished: boolean('is_published').notNull().default(true),
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  xpReward: integer('xp_reward').notNull().default(50),
  category: text('category').notNull(),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    achievementId: integer('achievement_id')
      .references(() => achievements.id, { onDelete: 'cascade' })
      .notNull(),
    earnedAt: timestamp('earned_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('user_achievements_unique_idx').on(t.userId, t.achievementId)]
);

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  languageCode: text('language_code'),
  description: text('description').notNull(),
  startsAt: text('starts_at').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  authorName: text('author_name').notNull(),
  languageCode: text('language_code').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  detailsJson: jsonb('details_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiUsageRecords = pgTable('ai_usage_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  feature: text('feature').notNull(),
  languageCode: text('language_code'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
