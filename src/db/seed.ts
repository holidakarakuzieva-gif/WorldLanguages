import { count } from 'drizzle-orm';
import { db } from './index.ts';
import {
  achievements,
  announcements,
  culturalEntries,
  events,
  grammarTopics,
  languages,
  listeningResources,
  readingMaterials,
  topics,
  vocabulary,
} from './schema.ts';
import { SUPPORTED_LANGUAGES } from '../data/languagesSeed.ts';
import {
  SEED_ACHIEVEMENTS,
  SEED_CULTURES,
  SEED_GRAMMAR,
  SEED_LISTENING,
  SEED_READINGS,
  SEED_TOPICS,
  SEED_VOCABULARY,
} from '../data/curriculumSeed.ts';

let seedPromise: Promise<void> | null = null;

/**
 * Lazily ensures baseline curriculum & 21 language environments exist in PostgreSQL.
 * Triggered safely on demand inside API requests (never as an eager startup probe).
 */
export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const [{ value: langCount }] = await db.select({ value: count() }).from(languages);
      if (Number(langCount) > 0) return;

      await db.insert(languages).values(SUPPORTED_LANGUAGES).onConflictDoNothing();
      await db.insert(topics).values(SEED_TOPICS).onConflictDoNothing();
      await db.insert(vocabulary).values(SEED_VOCABULARY).onConflictDoNothing();
      await db.insert(grammarTopics).values(SEED_GRAMMAR).onConflictDoNothing();
      await db.insert(readingMaterials).values(SEED_READINGS).onConflictDoNothing();
      await db.insert(listeningResources).values(SEED_LISTENING).onConflictDoNothing();
      await db.insert(culturalEntries).values(SEED_CULTURES).onConflictDoNothing();
      await db.insert(achievements).values(SEED_ACHIEVEMENTS).onConflictDoNothing();

      await db.insert(announcements).values([
        {
          title: 'Welcome to World Languages — 100% Free Global Access',
          body: 'Founded by Begzad Kurbanbayev to make serious, multi-skill language mastery accessible to every learner worldwide without paywalls.',
          isPublished: true,
        },
      ]);

      await db.insert(events).values([
        {
          title: 'Global Polyglot Reading Week',
          category: 'Reading Competition',
          languageCode: 'all',
          description: 'Read 3 level-matched short narratives across any of our 21 supported languages and save 15 new words to your SRS deck.',
          startsAt: '2026-11-20',
          isPublished: true,
        },
        {
          title: 'Phonetics & Script Accuracy Sprint',
          category: 'Weekly Challenge',
          languageCode: 'ja',
          description: 'Master Japanese moraic timing, Hangul batchim rules, or Egyptian Arabic script connections in the Phonetics Academy.',
          startsAt: '2026-11-24',
          isPublished: true,
        },
      ]);
    } catch (err) {
      seedPromise = null;
      throw err;
    }
  })();
  return seedPromise;
}
