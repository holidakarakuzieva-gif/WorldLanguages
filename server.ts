import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { and, count, desc, eq, lte, sql } from 'drizzle-orm';
import { createServer as createViteServer } from 'vite';

import { db } from './src/db/index.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  achievements,
  aiUsageRecords,
  announcements,
  auditLogs,
  culturalEntries,
  events,
  examinationAttempts,
  grammarProgress,
  grammarTopics,
  languages,
  learningRecommendations,
  listeningResources,
  passwordResetTokens,
  readingMaterials,
  readingProgress,
  reviews,
  sessions,
  speakingSessions,
  topicProgress,
  topics,
  userAchievements,
  userLanguages,
  users,
  vocabulary,
  vocabularyReviews,
  writingSubmissions,
} from './src/db/schema.ts';
import {
  attachOptionalAuth,
  AuthRequest,
  createUserSession,
  FOUNDER_ALLOWLIST,
  hashPassword,
  hashToken,
  requireAuth,
  requireFounder,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  calculateNextReview,
  estimatePlacementProficiency,
  evaluateLevelProgression,
  RecallGrade,
} from './src/lib/srs.ts';
import {
  AiProviderName,
  checkAiRateLimit,
  evaluateWritingSubmission,
  generateOriginalStory,
  generateSpeechAudio,
  getProviderCapabilities,
  lookupWordInContext,
  runTutorConversation,
  transcribeSpokenAudio,
} from './src/services/aiService.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(attachOptionalAuth);

function sanitizeUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    role: u.role === 'founder' && FOUNDER_ALLOWLIST.has(u.email.toLowerCase()) ? 'founder' : 'student',
    nativeLanguage: u.nativeLanguage,
    interfaceLanguage: u.interfaceLanguage,
    country: u.country,
    dailyGoalMinutes: u.dailyGoalMinutes,
    emailVerified: u.emailVerified,
    xp: u.xp,
    streakDays: u.streakDays,
    createdAt: u.createdAt,
  };
}

async function awardXpAndStreak(userId: number, languageCode: string, xpDelta: number, minutesDelta = 5) {
  const today = new Date().toISOString().slice(0, 10);
  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRow) {
    let nextStreak = userRow.streakDays;
    if (userRow.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      nextStreak = userRow.lastStudyDate === yesterday ? userRow.streakDays + 1 : 1;
    }
    await db
      .update(users)
      .set({
        xp: userRow.xp + xpDelta,
        streakDays: nextStreak,
        lastStudyDate: today,
      })
      .where(eq(users.id, userId));
  }

  const [ulRow] = await db
    .select()
    .from(userLanguages)
    .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, languageCode)))
    .limit(1);
  if (ulRow) {
    await db
      .update(userLanguages)
      .set({
        xp: ulRow.xp + xpDelta,
        studyMinutes: ulRow.studyMinutes + minutesDelta,
        streakDays: Math.max(1, ulRow.streakDays),
        updatedAt: new Date(),
      })
      .where(eq(userLanguages.id, ulRow.id));
  }
}

async function unlockAchievement(userId: number, slug: string) {
  const [ach] = await db.select().from(achievements).where(eq(achievements.slug, slug)).limit(1);
  if (!ach) return;
  await db
    .insert(userAchievements)
    .values({ userId, achievementId: ach.id })
    .onConflictDoNothing();
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', platform: 'World Languages' });
});

// ========================
// AUTHENTICATION & PROFILE
// ========================

app.get('/api/auth/me', async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    if (!req.authUser) {
      res.json({ user: null, languages: [] });
      return;
    }
    const enrolled = await db
      .select()
      .from(userLanguages)
      .where(eq(userLanguages.userId, req.authUser.id));
    res.json({ user: req.authUser, enrolledLanguages: enrolled });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Unable to load account session.' });
  }
});

app.get('/api/auth/founder-status', async (_req, res) => {
  try {
    const [founder] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'aiworldlanguages@gmail.com'))
      .limit(1);
    res.json({
      initialized: Boolean(founder && founder.passwordHash),
      envConfigured: Boolean(process.env.FOUNDER_BOOTSTRAP_PASSWORD),
    });
  } catch (err) {
    console.error('Founder status error:', err);
    res.status(500).json({ error: 'Unable to check founder status.' });
  }
});

app.post('/api/auth/founder-bootstrap', async (req, res) => {
  try {
    await ensureSeeded();
    const { email, password } = req.body ?? {};
    const normalized = String(email ?? '').trim().toLowerCase();
    if (!FOUNDER_ALLOWLIST.has(normalized)) {
      res.status(403).json({ error: 'This email is not on the founder allowlist.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 10) {
      res.status(400).json({ error: 'Founder password must be at least 10 characters.' });
      return;
    }

    const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
    if (existing && existing.passwordHash) {
      res.status(409).json({ error: 'Founder account is already initialized. Please sign in.' });
      return;
    }

    const envSecret = process.env.FOUNDER_BOOTSTRAP_PASSWORD;
    if (envSecret && envSecret.length > 0) {
      const a = Buffer.from(password);
      const b = Buffer.from(envSecret);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        res.status(401).json({ error: 'Provided password does not match FOUNDER_BOOTSTRAP_PASSWORD.' });
        return;
      }
    }

    const pwHash = hashPassword(password);
    const [founder] = await db
      .insert(users)
      .values({
        uid: existing?.uid ?? `founder_${randomUUID()}`,
        email: normalized,
        passwordHash: pwHash,
        displayName: 'Begzad Kurbanbayev',
        role: 'founder',
        nativeLanguage: 'Uzbek',
        interfaceLanguage: 'en',
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { passwordHash: pwHash, role: 'founder', emailVerified: true },
      })
      .returning();

    await db.insert(auditLogs).values({
      actorEmail: normalized,
      action: 'FOUNDER_ACCOUNT_INITIALIZED',
      detailsJson: { method: envSecret ? 'env_bootstrap' : 'first_time_setup' },
    });

    await createUserSession(founder.id, res);
    res.json({ user: sanitizeUser(founder) });
  } catch (err) {
    console.error('Founder bootstrap error:', err);
    res.status(500).json({ error: 'Failed to initialize founder account.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    await ensureSeeded();
    const {
      email,
      password,
      displayName,
      nativeLanguage = 'English',
      interfaceLanguage = 'en',
      targetLanguageCode = 'es',
      country = null,
      dailyGoalMinutes = 20,
    } = req.body ?? {};

    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (FOUNDER_ALLOWLIST.has(normalizedEmail)) {
      res.status(403).json({ error: 'Founder email must use Founder Authentication.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    if (!displayName || String(displayName).trim().length < 2) {
      res.status(400).json({ error: 'Please enter your display name.' });
      return;
    }

    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const [created] = await db
      .insert(users)
      .values({
        uid: `student_${randomUUID()}`,
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        displayName: String(displayName).trim(),
        role: 'student',
        nativeLanguage: String(nativeLanguage),
        interfaceLanguage: String(interfaceLanguage),
        country: country ? String(country) : null,
        dailyGoalMinutes: Number(dailyGoalMinutes) || 20,
        emailVerified: true,
      })
      .returning();

    const [langExists] = await db
      .select()
      .from(languages)
      .where(eq(languages.code, String(targetLanguageCode)))
      .limit(1);
    const chosenCode = langExists ? langExists.code : 'es';

    await db.insert(userLanguages).values({
      userId: created.id,
      languageCode: chosenCode,
      dialectVariant: langExists?.variantsJson?.[0] ?? 'Standard',
      currentLevel: 'Pre-A1',
      isActive: true,
    });

    await createUserSession(created.id, res);
    res.status(201).json({ user: sanitizeUser(created) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await ensureSeeded();
    const { email, password } = req.body ?? {};
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!normalizedEmail || typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    // Optional bootstrap via FOUNDER_BOOTSTRAP_PASSWORD secret if founder has not signed in yet
    if (FOUNDER_ALLOWLIST.has(normalizedEmail) && (!existing || !existing.passwordHash)) {
      const envSecret = process.env.FOUNDER_BOOTSTRAP_PASSWORD;
      if (envSecret && envSecret.length > 0) {
        const a = Buffer.from(password);
        const b = Buffer.from(envSecret);
        if (a.length === b.length && timingSafeEqual(a, b)) {
          const [founder] = await db
            .insert(users)
            .values({
              uid: existing?.uid ?? `founder_${randomUUID()}`,
              email: normalizedEmail,
              passwordHash: hashPassword(password),
              displayName: 'Begzad Kurbanbayev',
              role: 'founder',
              nativeLanguage: 'Uzbek',
              interfaceLanguage: 'en',
              emailVerified: true,
            })
            .onConflictDoUpdate({
              target: users.email,
              set: { passwordHash: hashPassword(password), role: 'founder', emailVerified: true },
            })
            .returning();

          await db.insert(auditLogs).values({
            actorEmail: normalizedEmail,
            action: 'FOUNDER_ENV_BOOTSTRAP_LOGIN',
            detailsJson: {},
          });
          await createUserSession(founder.id, res);
          res.json({ user: sanitizeUser(founder) });
          return;
        }
      }
      res.status(401).json({
        error: 'Founder password not initialized yet. Use Founder Activation or Google Sign-In.',
        needsFounderBootstrap: true,
      });
      return;
    }

    if (!existing || !existing.passwordHash || !verifyPassword(password, existing.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (existing.role === 'founder' && FOUNDER_ALLOWLIST.has(existing.email.toLowerCase())) {
      await db.insert(auditLogs).values({
        actorEmail: existing.email,
        action: 'FOUNDER_LOGIN',
        detailsJson: {},
      });
    }

    await createUserSession(existing.id, res);
    res.json({ user: sanitizeUser(existing) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    await ensureSeeded();
    const { idToken, targetLanguageCode = 'es' } = req.body ?? {};
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'Missing Google sign-in token.' });
      return;
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = (decoded.email ?? '').toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Google account has no email address.' });
      return;
    }

    const role = FOUNDER_ALLOWLIST.has(email) ? 'founder' : 'student';
    const [upserted] = await db
      .insert(users)
      .values({
        uid: decoded.uid,
        email,
        displayName: decoded.name || (role === 'founder' ? 'Begzad Kurbanbayev' : email.split('@')[0]),
        role,
        emailVerified: Boolean(decoded.email_verified),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          uid: decoded.uid,
          role,
          emailVerified: Boolean(decoded.email_verified),
        },
      })
      .returning();

    const existingLangs = await db
      .select()
      .from(userLanguages)
      .where(eq(userLanguages.userId, upserted.id));
    if (existingLangs.length === 0) {
      await db.insert(userLanguages).values({
        userId: upserted.id,
        languageCode: String(targetLanguageCode || 'es'),
        dialectVariant: 'Standard',
        currentLevel: 'Pre-A1',
        isActive: true,
      });
    }

    if (role === 'founder') {
      await db.insert(auditLogs).values({
        actorEmail: email,
        action: 'FOUNDER_GOOGLE_LOGIN',
        detailsJson: {},
      });
    }

    await createUserSession(upserted.id, res);
    res.json({ user: sanitizeUser(upserted) });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google Sign-In verification failed.' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))).catch(() => {});
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.post('/api/auth/password-reset/request', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!u || FOUNDER_ALLOWLIST.has(email)) {
      res.json({
        message: 'If a student account exists for this email, a reset verification token has been prepared.',
      });
      return;
    }

    const rawCode = randomBytes(4).toString('hex').toUpperCase();
    await db.insert(passwordResetTokens).values({
      email,
      tokenHash: hashToken(rawCode),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    res.json({
      message: 'Password reset code generated. Enter it below to choose a new password.',
      verificationCodePreview: rawCode,
    });
  } catch (err) {
    console.error('Reset request error:', err);
    res.status(500).json({ error: 'Could not generate reset token.' });
  }
});

app.post('/api/auth/password-reset/confirm', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body ?? {};
    const normalized = String(email ?? '').trim().toLowerCase();
    if (!normalized || !code || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'Valid email, reset code, and 8+ character password are required.' });
      return;
    }
    const [tokenRow] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.email, normalized),
          eq(passwordResetTokens.tokenHash, hashToken(String(code).trim().toUpperCase())),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (!tokenRow || tokenRow.expiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.email, normalized));
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenRow.id));

    res.json({ ok: true, message: 'Password updated successfully. You may now sign in.' });
  } catch (err) {
    console.error('Reset confirm error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, nativeLanguage, interfaceLanguage, country, dailyGoalMinutes } = req.body ?? {};
    const [updated] = await db
      .update(users)
      .set({
        displayName: displayName ? String(displayName).trim() : req.authUser!.displayName,
        nativeLanguage: nativeLanguage ? String(nativeLanguage) : req.authUser!.nativeLanguage,
        interfaceLanguage: interfaceLanguage ? String(interfaceLanguage) : req.authUser!.interfaceLanguage,
        country: country !== undefined ? (country ? String(country) : null) : req.authUser!.country,
        dailyGoalMinutes: dailyGoalMinutes ? Number(dailyGoalMinutes) : req.authUser!.dailyGoalMinutes,
      })
      .where(eq(users.id, req.authUser!.id))
      .returning();

    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ========================
// LANGUAGES & ENROLLMENTS
// ========================

app.get('/api/languages', async (_req, res) => {
  try {
    await ensureSeeded();
    const list = await db.select().from(languages).where(eq(languages.isPublished, true)).orderBy(languages.id);
    res.json({ languages: list });
  } catch (err) {
    console.error('Languages fetch error:', err);
    res.status(500).json({ error: 'Failed to load languages.' });
  }
});

app.post('/api/user-languages', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const { languageCode, dialectVariant } = req.body ?? {};
    const [lang] = await db.select().from(languages).where(eq(languages.code, String(languageCode))).limit(1);
    if (!lang) {
      res.status(404).json({ error: 'Language not found.' });
      return;
    }

    const userId = req.authUser!.id;
    await db.update(userLanguages).set({ isActive: false }).where(eq(userLanguages.userId, userId));

    const [existing] = await db
      .select()
      .from(userLanguages)
      .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, lang.code)))
      .limit(1);

    let record;
    if (existing) {
      const [updated] = await db
        .update(userLanguages)
        .set({
          isActive: true,
          dialectVariant: dialectVariant ? String(dialectVariant) : existing.dialectVariant,
          updatedAt: new Date(),
        })
        .where(eq(userLanguages.id, existing.id))
        .returning();
      record = updated;
    } else {
      const [inserted] = await db
        .insert(userLanguages)
        .values({
          userId,
          languageCode: lang.code,
          dialectVariant: dialectVariant ? String(dialectVariant) : lang.variantsJson[0] ?? 'Standard',
          currentLevel: 'Pre-A1',
          isActive: true,
        })
        .returning();
      record = inserted;
    }

    const allEnrolled = await db.select().from(userLanguages).where(eq(userLanguages.userId, userId));
    if (allEnrolled.length >= 2) {
      await unlockAchievement(userId, 'polyglot_explorer');
    }

    res.json({ activeLanguage: record, enrolledLanguages: allEnrolled });
  } catch (err) {
    console.error('Enroll language error:', err);
    res.status(500).json({ error: 'Failed to switch or enroll language.' });
  }
});

// ========================
// STUDENT DASHBOARD & ENGINE
// ========================

app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const userId = req.authUser!.id;
    const requestedLang = typeof req.query.lang === 'string' ? req.query.lang : null;

    let enrolled = await db.select().from(userLanguages).where(eq(userLanguages.userId, userId));
    if (enrolled.length === 0) {
      const [inserted] = await db
        .insert(userLanguages)
        .values({
          userId,
          languageCode: requestedLang || 'es',
          dialectVariant: 'Standard',
          currentLevel: 'Pre-A1',
          isActive: true,
        })
        .returning();
      enrolled = [inserted];
    }

    const active =
      (requestedLang && enrolled.find((e) => e.languageCode === requestedLang)) ||
      enrolled.find((e) => e.isActive) ||
      enrolled[0];

    const langCode = active.languageCode;
    const allTopics = await db.select().from(topics).where(eq(topics.languageCode, langCode));
    const userTopics = await db
      .select()
      .from(topicProgress)
      .where(and(eq(topicProgress.userId, userId), eq(topicProgress.languageCode, langCode)));

    const totalVocab = await db.select().from(vocabulary).where(eq(vocabulary.languageCode, langCode));
    const userReviews = await db
      .select()
      .from(vocabularyReviews)
      .where(and(eq(vocabularyReviews.userId, userId), eq(vocabularyReviews.languageCode, langCode)));

    const now = new Date();
    const dueReviews = userReviews.filter((r) => r.nextReviewAt <= now).length;
    const overdueReviews = userReviews.filter(
      (r) => r.nextReviewAt < new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).length;
    const masteredVocab = userReviews.filter((r) => r.srsStatus === 'Mastered').length;

    const recs = await db
      .select()
      .from(learningRecommendations)
      .where(and(eq(learningRecommendations.userId, userId), eq(learningRecommendations.languageCode, langCode), eq(learningRecommendations.resolved, false)))
      .orderBy(learningRecommendations.priority);

    const earnedAch = await db
      .select({
        slug: achievements.slug,
        title: achievements.title,
        description: achievements.description,
        xpReward: achievements.xpReward,
        category: achievements.category,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    const exams = await db
      .select()
      .from(examinationAttempts)
      .where(and(eq(examinationAttempts.userId, userId), eq(examinationAttempts.languageCode, langCode)))
      .orderBy(desc(examinationAttempts.startedAt))
      .limit(5);

    const topicsMastered = userTopics.filter((t) => t.mastered).length;
    const completionPct = allTopics.length > 0 ? Math.round((topicsMastered / allTopics.length) * 100) : 0;

    res.json({
      activeLanguage: active,
      enrolledLanguages: enrolled,
      metrics: {
        completionPercentage: completionPct,
        knowledgeMastery: Math.round(
          (active.grammarMastery +
            active.readingMastery +
            active.listeningMastery +
            active.speakingMastery +
            active.writingMastery) /
            5
        ),
        totalVocabularyAvailable: totalVocab.length,
        vocabularyLearned: userReviews.length,
        vocabularyDue: dueReviews + Math.max(0, totalVocab.length - userReviews.length),
        vocabularyOverdue: overdueReviews,
        vocabularyMastered: masteredVocab,
        completedTopics: topicsMastered,
        totalTopics: allTopics.length,
        grammarMastery: active.grammarMastery,
        readingProgress: active.readingMastery,
        listeningProgress: active.listeningMastery,
        speakingProgress: active.speakingMastery,
        writingProgress: active.writingMastery,
      },
      recommendations: recs,
      achievements: earnedAch,
      recentExams: exams,
      aiProviders: getProviderCapabilities(),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load student dashboard.' });
  }
});

// ========================
// PLACEMENT ASSESSMENT
// ========================

app.post('/api/placement/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { languageCode, mode, evidence } = req.body ?? {};
    const code = String(languageCode || 'es');

    if (mode === 'beginner_zero') {
      await db
        .update(userLanguages)
        .set({
          currentLevel: 'Pre-A1',
          placementCompleted: true,
          placementSummaryJson: {
            estimatedLevel: 'Pre-A1',
            explanation: 'Selected Absolute Beginner Pathway to build phonetics, script, and foundational vocabulary from zero.',
            strengths: ['Fresh foundation'],
            weaknesses: ['Sound system & core lexicon'],
            recommendedFirstLesson: 'Phonetics & Script Academy + Lesson 01',
          },
          updatedAt: new Date(),
        })
        .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, code)));

      await db.insert(learningRecommendations).values({
        userId,
        languageCode: code,
        category: 'Phonetics',
        title: 'Start with Phonetics & Pronunciation Academy',
        reason: 'You chose the beginner zero-start pathway; mastering sounds and script first prevents fossilized pronunciation errors.',
        targetRoute: 'phonetics',
        priority: 1,
      });

      res.json({
        result: {
          estimatedLevel: 'Pre-A1',
          compositeScore: 0,
          strengths: ['Starting fresh with zero bad habits'],
          weaknesses: ['Script, phonetics & core vocabulary'],
          explanation: 'Absolute Beginner Pathway selected. Your curriculum starts from the Phonetics Academy and Topic 01.',
          recommendedFirstLesson: 'Phonetics & Script Academy + Topic 01',
        },
      });
      return;
    }

    const result = estimatePlacementProficiency(evidence);

    await db
      .update(userLanguages)
      .set({
        currentLevel: result.estimatedLevel,
        placementCompleted: true,
        placementSummaryJson: result as unknown as Record<string, unknown>,
        grammarMastery: result.skillBreakdown.Grammar,
        readingMastery: result.skillBreakdown.Reading,
        listeningMastery: result.skillBreakdown.Listening,
        speakingMastery: result.skillBreakdown.Speaking,
        writingMastery: result.skillBreakdown.Writing,
        updatedAt: new Date(),
      })
      .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, code)));

    await db.insert(examinationAttempts).values({
      userId,
      languageCode: code,
      examType: 'placement',
      targetLevel: result.estimatedLevel,
      sectionsJson: result.skillBreakdown,
      answersJson: evidence,
      score: result.compositeScore,
      passed: true,
      status: 'completed',
      completedAt: new Date(),
    });

    await db.insert(learningRecommendations).values({
      userId,
      languageCode: code,
      category: 'Adaptive Roadmap',
      title: `Strengthen ${result.weaknesses[0]?.split(' ')[0] ?? 'Core Skills'}`,
      reason: `Placement evidence shows ${result.weaknesses[0]} trailing behind ${result.strengths[0]}. Targeted drills will balance your CEFR ${result.estimatedLevel} profile.`,
      targetRoute: result.weaknesses[0]?.includes('Grammar')
        ? 'grammar'
        : result.weaknesses[0]?.includes('Reading')
        ? 'reading'
        : 'vocabulary',
      priority: 1,
    });

    await awardXpAndStreak(userId, code, 40, 10);
    res.json({ result });
  } catch (err) {
    console.error('Placement submit error:', err);
    res.status(500).json({ error: 'Failed to evaluate placement assessment.' });
  }
});

// ========================
// CURRICULUM & COURSES
// ========================

app.get('/api/curriculum/:code', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const code = String(req.params.code);
    const topicRows = await db
      .select()
      .from(topics)
      .where(and(eq(topics.languageCode, code), eq(topics.status, 'published')))
      .orderBy(topics.orderIndex);

    const progressRows = await db
      .select()
      .from(topicProgress)
      .where(and(eq(topicProgress.userId, req.authUser!.id), eq(topicProgress.languageCode, code)));

    const enriched = topicRows.map((t) => {
      const p = progressRows.find((pr) => pr.topicId === t.id);
      return {
        ...t,
        completedSteps: p?.completedStepsJson ?? [],
        assessmentScore: p?.assessmentScore ?? 0,
        mastered: p?.mastered ?? false,
      };
    });

    res.json({ topics: enriched });
  } catch (err) {
    console.error('Curriculum error:', err);
    res.status(500).json({ error: 'Failed to load curriculum.' });
  }
});

app.post('/api/curriculum/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { topicId, languageCode, completedSteps, assessmentScore = 0, mastered = false } = req.body ?? {};
    const tId = Number(topicId);
    const code = String(languageCode);

    await db
      .insert(topicProgress)
      .values({
        userId,
        topicId: tId,
        languageCode: code,
        completedStepsJson: Array.isArray(completedSteps) ? completedSteps : [],
        assessmentScore: Number(assessmentScore),
        mastered: Boolean(mastered),
        completedAt: mastered ? new Date() : null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [topicProgress.userId, topicProgress.topicId],
        set: {
          completedStepsJson: Array.isArray(completedSteps) ? completedSteps : [],
          assessmentScore: Number(assessmentScore),
          mastered: Boolean(mastered),
          completedAt: mastered ? new Date() : null,
          updatedAt: new Date(),
        },
      });

    if (mastered) {
      await awardXpAndStreak(userId, code, 50, 15);
      await unlockAchievement(userId, 'first_step');
    } else {
      await awardXpAndStreak(userId, code, 10, 5);
    }

    res.json({ ok: true, xpEarned: mastered ? 50 : 10 });
  } catch (err) {
    console.error('Curriculum progress error:', err);
    res.status(500).json({ error: 'Failed to save lesson progress.' });
  }
});

// ========================
// VOCABULARY & SPACED REPETITION
// ========================

app.get('/api/srs/:code', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const userId = req.authUser!.id;
    const code = String(req.params.code);

    const vocabRows = await db
      .select()
      .from(vocabulary)
      .where(and(eq(vocabulary.languageCode, code), eq(vocabulary.status, 'published')));

    const reviewRows = await db
      .select()
      .from(vocabularyReviews)
      .where(and(eq(vocabularyReviews.userId, userId), eq(vocabularyReviews.languageCode, code)));

    const cards = vocabRows.map((v) => {
      const r = reviewRows.find((rev) => rev.vocabId === v.id);
      return {
        ...v,
        reviewId: r?.id ?? null,
        srsStatus: (r?.srsStatus ?? 'New') as 'New' | 'Learning' | 'Reviewing' | 'Familiar' | 'Mastered',
        easeFactor: r?.easeFactor ?? 250,
        intervalDays: r?.intervalDays ?? 0,
        repetitions: r?.repetitions ?? 0,
        lapses: r?.lapses ?? 0,
        nextReviewAt: r?.nextReviewAt ? r.nextReviewAt.toISOString() : null,
      };
    });

    const now = Date.now();
    const summary = {
      dueToday: cards.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt).getTime() <= now).length,
      overdue: cards.filter((c) => c.nextReviewAt && new Date(c.nextReviewAt).getTime() < now - 86400000).length,
      newWords: cards.filter((c) => c.srsStatus === 'New').length,
      learning: cards.filter((c) => c.srsStatus === 'Learning' || c.srsStatus === 'Reviewing' || c.srsStatus === 'Familiar').length,
      mastered: cards.filter((c) => c.srsStatus === 'Mastered').length,
    };

    res.json({ cards, summary });
  } catch (err) {
    console.error('SRS fetch error:', err);
    res.status(500).json({ error: 'Failed to load vocabulary deck.' });
  }
});

app.post('/api/srs/review', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { vocabId, languageCode, grade } = req.body ?? {};
    const vId = Number(vocabId);
    const code = String(languageCode);
    const validGrades: RecallGrade[] = ['again', 'hard', 'good', 'easy'];
    if (!validGrades.includes(grade)) {
      res.status(400).json({ error: 'Invalid recall grade.' });
      return;
    }

    const [existing] = await db
      .select()
      .from(vocabularyReviews)
      .where(and(eq(vocabularyReviews.userId, userId), eq(vocabularyReviews.vocabId, vId)))
      .limit(1);

    const scheduled = calculateNextReview(
      {
        srsStatus: (existing?.srsStatus as 'New' | 'Learning' | 'Reviewing' | 'Familiar' | 'Mastered') ?? 'New',
        easeFactor: existing?.easeFactor ?? 250,
        intervalDays: existing?.intervalDays ?? 0,
        repetitions: existing?.repetitions ?? 0,
        lapses: existing?.lapses ?? 0,
      },
      grade
    );

    const [saved] = await db
      .insert(vocabularyReviews)
      .values({
        userId,
        vocabId: vId,
        languageCode: code,
        srsStatus: scheduled.srsStatus,
        easeFactor: scheduled.easeFactor,
        intervalDays: scheduled.intervalDays,
        repetitions: scheduled.repetitions,
        lapses: scheduled.lapses,
        nextReviewAt: scheduled.nextReviewAt,
        lastReviewedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [vocabularyReviews.userId, vocabularyReviews.vocabId],
        set: {
          srsStatus: scheduled.srsStatus,
          easeFactor: scheduled.easeFactor,
          intervalDays: scheduled.intervalDays,
          repetitions: scheduled.repetitions,
          lapses: scheduled.lapses,
          nextReviewAt: scheduled.nextReviewAt,
          lastReviewedAt: new Date(),
        },
      })
      .returning();

    if (grade === 'again') {
      await db.insert(learningRecommendations).values({
        userId,
        languageCode: code,
        category: 'Vocabulary Retention',
        title: 'Review Missed Flashcard in Context',
        reason: 'A word was marked for immediate re-study; spaced repetition reset its interval to 1 day.',
        targetRoute: 'vocabulary',
        priority: 2,
      });
    }

    const [{ value: reviewCount }] = await db
      .select({ value: count() })
      .from(vocabularyReviews)
      .where(eq(vocabularyReviews.userId, userId));
    if (Number(reviewCount) >= 10) {
      await unlockAchievement(userId, 'srs_steward');
    }

    await awardXpAndStreak(userId, code, grade === 'again' ? 3 : 8, 2);
    res.json({ review: saved });
  } catch (err) {
    console.error('SRS review error:', err);
    res.status(500).json({ error: 'Failed to save vocabulary review.' });
  }
});

app.post('/api/vocabulary/save', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const {
      languageCode,
      cefrLevel = 'A1',
      word,
      romanization = '',
      ipa = '',
      translationEn,
      definition = '',
      partOfSpeech = 'noun',
      exampleSentence = '',
      exampleTranslation = '',
    } = req.body ?? {};

    if (!languageCode || !word || !translationEn) {
      res.status(400).json({ error: 'Word, translation, and languageCode are required.' });
      return;
    }

    const existingWord = await db
      .select()
      .from(vocabulary)
      .where(and(eq(vocabulary.languageCode, String(languageCode)), eq(vocabulary.word, String(word))))
      .limit(1);

    let vocabRow = existingWord[0];
    if (!vocabRow) {
      const [inserted] = await db
        .insert(vocabulary)
        .values({
          languageCode: String(languageCode),
          cefrLevel: String(cefrLevel),
          topicSlug: 'saved-reading',
          word: String(word).trim(),
          romanization: romanization ? String(romanization) : null,
          ipa: ipa ? String(ipa) : null,
          translationEn: String(translationEn).trim(),
          definition: String(definition || translationEn),
          partOfSpeech: String(partOfSpeech),
          exampleSentence: String(exampleSentence || word),
          exampleTranslation: String(exampleTranslation || translationEn),
          status: 'published',
        })
        .returning();
      vocabRow = inserted;
    }

    await db
      .insert(vocabularyReviews)
      .values({
        userId,
        vocabId: vocabRow.id,
        languageCode: String(languageCode),
        srsStatus: 'Learning',
        nextReviewAt: new Date(),
      })
      .onConflictDoNothing();

    res.status(201).json({ vocabulary: vocabRow });
  } catch (err) {
    console.error('Save vocab error:', err);
    res.status(500).json({ error: 'Failed to save word to spaced repetition deck.' });
  }
});

// ========================
// GRAMMAR ACADEMY
// ========================

app.get('/api/grammar/:code', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const code = String(req.params.code);
    const items = await db
      .select()
      .from(grammarTopics)
      .where(and(eq(grammarTopics.languageCode, code), eq(grammarTopics.status, 'published')));
    const progress = await db
      .select()
      .from(grammarProgress)
      .where(and(eq(grammarProgress.userId, req.authUser!.id), eq(grammarProgress.languageCode, code)));

    const enriched = items.map((item) => {
      const p = progress.find((pr) => pr.grammarTopicId === item.id);
      return {
        ...item,
        userProgress: p
          ? { diagnosticSkipped: p.diagnosticSkipped, score: p.score, mastered: p.mastered }
          : undefined,
      };
    });

    res.json({ topics: enriched });
  } catch (err) {
    console.error('Grammar fetch error:', err);
    res.status(500).json({ error: 'Failed to load grammar topics.' });
  }
});

app.post('/api/grammar/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { grammarTopicId, languageCode, score, diagnosticSkipped = false } = req.body ?? {};
    const numScore = Number(score);
    const mastered = numScore >= 80 || Boolean(diagnosticSkipped);

    await db
      .insert(grammarProgress)
      .values({
        userId,
        grammarTopicId: Number(grammarTopicId),
        languageCode: String(languageCode),
        diagnosticSkipped: Boolean(diagnosticSkipped),
        score: numScore,
        mastered,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [grammarProgress.userId, grammarProgress.grammarTopicId],
        set: {
          diagnosticSkipped: Boolean(diagnosticSkipped),
          score: numScore,
          mastered,
          updatedAt: new Date(),
        },
      });

    const allGrammar = await db
      .select()
      .from(grammarProgress)
      .where(and(eq(grammarProgress.userId, userId), eq(grammarProgress.languageCode, String(languageCode))));
    const avgScore =
      allGrammar.length > 0
        ? Math.round(allGrammar.reduce((acc, row) => acc + row.score, 0) / allGrammar.length)
        : numScore;

    await db
      .update(userLanguages)
      .set({ grammarMastery: avgScore, updatedAt: new Date() })
      .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, String(languageCode))));

    if (numScore < 70) {
      await db.insert(learningRecommendations).values({
        userId,
        languageCode: String(languageCode),
        category: 'Grammar Accuracy',
        title: 'Revisit Core Grammar Drills',
        reason: `Recent grammar exercise accuracy was ${numScore}%. Reviewing structural patterns before advancing prevents recurring errors.`,
        targetRoute: 'grammar',
        priority: 1,
      });
    }

    await awardXpAndStreak(userId, String(languageCode), mastered ? 25 : 10, 8);
    res.json({ ok: true, mastered, grammarMastery: avgScore });
  } catch (err) {
    console.error('Grammar submit error:', err);
    res.status(500).json({ error: 'Failed to record grammar result.' });
  }
});

// ========================
// READING & LISTENING LABS
// ========================

app.get('/api/reading/:code', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const code = String(req.params.code);
    const materials = await db
      .select()
      .from(readingMaterials)
      .where(and(eq(readingMaterials.languageCode, code), eq(readingMaterials.isPublished, true)))
      .orderBy(desc(readingMaterials.createdAt));

    const progress = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, req.authUser!.id), eq(readingProgress.languageCode, code)));

    const enriched = materials.map((m) => {
      const p = progress.find((pr) => pr.materialId === m.id);
      return {
        ...m,
        completed: p?.completed ?? false,
        bookmarked: p?.bookmarked ?? false,
        comprehensionScore: p?.comprehensionScore ?? 0,
      };
    });

    res.json({ materials: enriched });
  } catch (err) {
    console.error('Reading fetch error:', err);
    res.status(500).json({ error: 'Failed to load reading library.' });
  }
});

app.post('/api/reading/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { materialId, languageCode, bookmarked = false, comprehensionScore = 0, completed = false } = req.body ?? {};

    await db
      .insert(readingProgress)
      .values({
        userId,
        materialId: Number(materialId),
        languageCode: String(languageCode),
        highlightsJson: [],
        bookmarked: Boolean(bookmarked),
        comprehensionScore: Number(comprehensionScore),
        completed: Boolean(completed),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.materialId],
        set: {
          bookmarked: Boolean(bookmarked),
          comprehensionScore: Number(comprehensionScore),
          completed: Boolean(completed),
          updatedAt: new Date(),
        },
      });

    if (completed) {
      const allProg = await db
        .select()
        .from(readingProgress)
        .where(and(eq(readingProgress.userId, userId), eq(readingProgress.languageCode, String(languageCode))));
      const avg = Math.round(allProg.reduce((a, b) => a + b.comprehensionScore, 0) / Math.max(1, allProg.length));
      await db
        .update(userLanguages)
        .set({ readingMastery: Math.max(avg, 70), updatedAt: new Date() })
        .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, String(languageCode))));

      await unlockAchievement(userId, 'literary_reader');
      await awardXpAndStreak(userId, String(languageCode), 30, 10);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Reading progress error:', err);
    res.status(500).json({ error: 'Failed to save reading progress.' });
  }
});

app.get('/api/listening/:code', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const code = String(req.params.code);
    const items = await db
      .select()
      .from(listeningResources)
      .where(and(eq(listeningResources.languageCode, code), eq(listeningResources.isPublished, true)));
    res.json({ resources: items });
  } catch (err) {
    console.error('Listening fetch error:', err);
    res.status(500).json({ error: 'Failed to load listening laboratory.' });
  }
});

app.post('/api/listening/complete', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { languageCode, score } = req.body ?? {};
    const code = String(languageCode);
    await db
      .update(userLanguages)
      .set({ listeningMastery: Math.max(Number(score) || 75, 60), updatedAt: new Date() })
      .where(and(eq(userLanguages.userId, req.authUser!.id), eq(userLanguages.languageCode, code)));
    await awardXpAndStreak(req.authUser!.id, code, 25, 10);
    res.json({ ok: true });
  } catch (err) {
    console.error('Listening complete error:', err);
    res.status(500).json({ error: 'Failed to record listening activity.' });
  }
});

// ========================
// EXAMINATIONS & PROGRESSION
// ========================

app.get('/api/exams/:code', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const code = String(req.params.code);

    const [ul] = await db
      .select()
      .from(userLanguages)
      .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, code)))
      .limit(1);

    const allTopics = await db.select().from(topics).where(eq(topics.languageCode, code));
    const userTopics = await db
      .select()
      .from(topicProgress)
      .where(and(eq(topicProgress.userId, userId), eq(topicProgress.languageCode, code)));
    const attempts = await db
      .select()
      .from(examinationAttempts)
      .where(and(eq(examinationAttempts.userId, userId), eq(examinationAttempts.languageCode, code)))
      .orderBy(desc(examinationAttempts.startedAt));

    const bestLevelExam = attempts.find((a) => a.examType === 'level' && a.passed);
    const progression = evaluateLevelProgression({
      mandatoryTopicsTotal: allTopics.filter((t) => t.isMandatory).length,
      mandatoryTopicsMastered: userTopics.filter((t) => t.mastered).length,
      finalExamPassed: Boolean(bestLevelExam),
      finalExamScore: bestLevelExam?.score ?? (attempts[0]?.score ?? 0),
      grammarMastery: ul?.grammarMastery ?? 0,
      readingMastery: ul?.readingMastery ?? 0,
    });

    res.json({ attempts, progression, currentLevel: ul?.currentLevel ?? 'Pre-A1' });
  } catch (err) {
    console.error('Exams fetch error:', err);
    res.status(500).json({ error: 'Failed to load examinations.' });
  }
});

app.post('/api/exams/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { languageCode, examType = 'level', targetLevel = 'A1', answers, score, status = 'completed' } = req.body ?? {};
    const code = String(languageCode);
    const numScore = Number(score) || 0;
    const passed = status === 'completed' && numScore >= 70;

    const [attempt] = await db
      .insert(examinationAttempts)
      .values({
        userId,
        languageCode: code,
        examType: String(examType),
        targetLevel: String(targetLevel),
        sectionsJson: { vocabulary: numScore, grammar: numScore, reading: numScore },
        answersJson: answers ?? {},
        score: numScore,
        passed,
        status: String(status),
        completedAt: status === 'completed' ? new Date() : null,
      })
      .returning();

    let promotedTo: string | null = null;
    if (passed && examType === 'level') {
      const [ul] = await db
        .select()
        .from(userLanguages)
        .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, code)))
        .limit(1);
      const allTopics = await db.select().from(topics).where(eq(topics.languageCode, code));
      const userTopics = await db
        .select()
        .from(topicProgress)
        .where(and(eq(topicProgress.userId, userId), eq(topicProgress.languageCode, code)));

      const check = evaluateLevelProgression({
        mandatoryTopicsTotal: allTopics.filter((t) => t.isMandatory).length,
        mandatoryTopicsMastered: userTopics.filter((t) => t.mastered).length,
        finalExamPassed: true,
        finalExamScore: numScore,
        grammarMastery: ul?.grammarMastery ?? 0,
        readingMastery: ul?.readingMastery ?? 0,
      });

      if (check.eligibleForNextLevel) {
        const order = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const idx = order.indexOf(ul?.currentLevel ?? 'Pre-A1');
        if (idx >= 0 && idx < order.length - 1) {
          promotedTo = order[idx + 1];
          await db
            .update(userLanguages)
            .set({ currentLevel: promotedTo, updatedAt: new Date() })
            .where(and(eq(userLanguages.userId, userId), eq(userLanguages.languageCode, code)));
        }
      }
    }

    if (status === 'completed') {
      await awardXpAndStreak(userId, code, passed ? 60 : 15, 20);
    }

    res.json({ attempt, promotedTo });
  } catch (err) {
    console.error('Exam submit error:', err);
    res.status(500).json({ error: 'Failed to submit examination.' });
  }
});

// ========================
// WORLD CULTURES & COMMUNITY
// ========================

app.get('/api/cultures', async (req, res) => {
  try {
    await ensureSeeded();
    const langCode = typeof req.query.lang === 'string' ? req.query.lang : null;
    const rows = langCode
      ? await db
          .select()
          .from(culturalEntries)
          .where(and(eq(culturalEntries.languageCode, langCode), eq(culturalEntries.isPublished, true)))
      : await db.select().from(culturalEntries).where(eq(culturalEntries.isPublished, true));
    res.json({ entries: rows });
  } catch (err) {
    console.error('Cultures error:', err);
    res.status(500).json({ error: 'Failed to load cultural encyclopedia.' });
  }
});

app.get('/api/community', async (_req, res) => {
  try {
    await ensureSeeded();
    const [activeEvents, activeAnnouncements, approvedReviews] = await Promise.all([
      db.select().from(events).where(eq(events.isPublished, true)).orderBy(desc(events.createdAt)),
      db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(desc(announcements.createdAt)),
      db.select().from(reviews).where(eq(reviews.status, 'approved')).orderBy(desc(reviews.createdAt)),
    ]);
    res.json({ events: activeEvents, announcements: activeAnnouncements, reviews: approvedReviews });
  } catch (err) {
    console.error('Community error:', err);
    res.status(500).json({ error: 'Failed to load community updates.' });
  }
});

app.post('/api/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { languageCode, rating, comment } = req.body ?? {};
    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
    if (!comment || String(comment).trim().length < 8) {
      res.status(400).json({ error: 'Please write at least 8 characters of feedback.' });
      return;
    }

    const [created] = await db
      .insert(reviews)
      .values({
        userId: req.authUser!.id,
        authorName: req.authUser!.displayName,
        languageCode: String(languageCode || 'es'),
        rating: numRating,
        comment: String(comment).trim(),
        status: 'pending',
      })
      .returning();

    res.status(201).json({
      review: created,
      message: 'Thank you! Your review has been submitted for founder moderation.',
    });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// ========================
// AI LABORATORIES (SERVER-SIDE)
// ========================

app.post('/api/ai/tutor', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!checkAiRateLimit(`ai:${req.authUser!.id}`)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }
    const {
      provider = 'gemini',
      languageCode,
      languageName,
      cefrLevel = 'A1',
      mode = 'free',
      topic = 'Everyday life',
      personality = 'Patient Academic Mentor',
      register = 'informal',
      correctionPreference = 'immediate',
      history = [],
      studentMessage,
    } = req.body ?? {};

    if (!studentMessage || !languageCode || !languageName) {
      res.status(400).json({ error: 'Message and language context are required.' });
      return;
    }

    const reply = await runTutorConversation({
      userId: req.authUser!.id,
      provider: provider as AiProviderName,
      languageName: String(languageName),
      languageCode: String(languageCode),
      cefrLevel: String(cefrLevel),
      mode,
      topic: String(topic),
      personality: String(personality),
      register,
      correctionPreference,
      interfaceLanguage: req.authUser!.interfaceLanguage,
      history,
      studentMessage: String(studentMessage),
    });

    await db.insert(speakingSessions).values({
      userId: req.authUser!.id,
      languageCode: String(languageCode),
      mode,
      cefrLevel: String(cefrLevel),
      topic: String(topic),
      transcriptJson: [
        ...history,
        { role: 'student', text: String(studentMessage) },
        { role: 'tutor', text: reply.tutorReply ?? '' },
      ],
      evaluationJson: reply.rubricNote ?? {},
    });

    await db
      .update(userLanguages)
      .set({ speakingMastery: sql`LEAST(100, ${userLanguages.speakingMastery} + 5)` })
      .where(and(eq(userLanguages.userId, req.authUser!.id), eq(userLanguages.languageCode, String(languageCode))));

    await unlockAchievement(req.authUser!.id, 'voice_scholar');
    await awardXpAndStreak(req.authUser!.id, String(languageCode), 20, 6);

    res.json(reply);
  } catch (err) {
    console.error('AI tutor error:', err);
    res.status(502).json({ error: 'AI tutor service could not process your turn. Check GEMINI_API_KEY in Secrets.' });
  }
});

app.post('/api/ai/writing', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!checkAiRateLimit(`ai:${req.authUser!.id}`)) {
      res.status(429).json({ error: 'Rate limit exceeded.' });
      return;
    }
    const { languageCode, languageName, cefrLevel = 'A2', prompt, studentText } = req.body ?? {};
    if (!studentText || String(studentText).trim().length < 10) {
      res.status(400).json({ error: 'Please write at least 10 characters for evaluation.' });
      return;
    }

    const evaluation = await evaluateWritingSubmission({
      userId: req.authUser!.id,
      languageName: String(languageName),
      languageCode: String(languageCode),
      cefrLevel: String(cefrLevel),
      prompt: String(prompt || 'Write a short paragraph in your target language.'),
      studentText: String(studentText),
      interfaceLanguage: req.authUser!.interfaceLanguage,
    });

    await db.insert(writingSubmissions).values({
      userId: req.authUser!.id,
      languageCode: String(languageCode),
      cefrLevel: String(cefrLevel),
      prompt: String(prompt || 'Free writing'),
      originalText: String(studentText),
      evaluationJson: evaluation,
    });

    const scores = evaluation.criteriaScores;
    const avg = scores
      ? Math.round(
          ((scores.grammarAndAccents || 70) +
            (scores.vocabularyAndNaturalness || 70) +
            (scores.coherenceAndTask || 70)) /
            3
        )
      : 72;

    await db
      .update(userLanguages)
      .set({ writingMastery: avg, updatedAt: new Date() })
      .where(and(eq(userLanguages.userId, req.authUser!.id), eq(userLanguages.languageCode, String(languageCode))));

    await unlockAchievement(req.authUser!.id, 'voice_scholar');
    await awardXpAndStreak(req.authUser!.id, String(languageCode), 25, 10);

    res.json({ originalText: studentText, evaluation });
  } catch (err) {
    console.error('AI writing error:', err);
    res.status(502).json({ error: 'Writing evaluator unavailable. Check GEMINI_API_KEY in Secrets.' });
  }
});

app.post('/api/ai/story', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!checkAiRateLimit(`ai:${req.authUser!.id}`)) {
      res.status(429).json({ error: 'Rate limit exceeded.' });
      return;
    }
    const {
      languageCode,
      languageName,
      cefrLevel = 'A1',
      genre = 'Mystery',
      theme = '',
      characters = '',
      setting = '',
      perspective = 'Third person',
      style = 'Clear literary prose',
      wordCount = 220,
      vocabularyFocus = '',
      grammarFocus = '',
      outlineContext = '',
    } = req.body ?? {};

    const story = await generateOriginalStory({
      userId: req.authUser!.id,
      languageName: String(languageName),
      languageCode: String(languageCode),
      cefrLevel: String(cefrLevel),
      genre: String(genre),
      theme: String(theme),
      characters: String(characters),
      setting: String(setting),
      perspective: String(perspective),
      style: String(style),
      wordCount: Math.min(800, Math.max(120, Number(wordCount) || 220)),
      vocabularyFocus: String(vocabularyFocus),
      grammarFocus: String(grammarFocus),
      outlineContext: outlineContext ? String(outlineContext) : undefined,
    });

    const glossaryMap: Record<string, { translation: string; pos: string; note: string }> = {};
    for (const entry of story.glossary ?? []) {
      if (entry?.word) {
        glossaryMap[entry.word] = {
          translation: entry.translation ?? '',
          pos: entry.pos ?? '',
          note: entry.note ?? '',
        };
      }
    }

    const [saved] = await db
      .insert(readingMaterials)
      .values({
        languageCode: String(languageCode),
        cefrLevel: String(cefrLevel),
        genre: String(genre),
        title: String(story.title || `AI ${genre} Story`),
        wordCount: String(story.content || '').split(/\s+/).length,
        content: String(story.content || ''),
        glossaryJson: glossaryMap,
        questionsJson: story.questions ?? [],
        sourceType: 'ai_generated',
        authorId: req.authUser!.id,
        isPublished: true,
      })
      .returning();

    res.json({ material: saved, continuityOutline: story.continuityOutline });
  } catch (err) {
    console.error('AI story error:', err);
    res.status(502).json({ error: 'Failed to generate AI story.' });
  }
});

app.post('/api/ai/word-lookup', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { word, sentence, languageCode, languageName } = req.body ?? {};
    if (!word || !languageCode || !languageName) {
      res.status(400).json({ error: 'Word and language are required.' });
      return;
    }
    const result = await lookupWordInContext({
      userId: req.authUser!.id,
      word: String(word),
      sentence: String(sentence || word),
      languageName: String(languageName),
      languageCode: String(languageCode),
      interfaceLanguage: req.authUser!.interfaceLanguage,
    });
    res.json(result);
  } catch (err) {
    console.error('Word lookup error:', err);
    res.status(502).json({ error: 'Dictionary lookup failed.' });
  }
});

app.post('/api/ai/tts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { text, voiceName = 'Kore', style, languageCode } = req.body ?? {};
    if (!text) {
      res.status(400).json({ error: 'Text is required for speech generation.' });
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      res.json({ audioBase64: null, mimeType: 'audio/wav', fallbackToBrowserSpeech: true });
      return;
    }
    const audioBase64 = await generateSpeechAudio({
      userId: req.authUser!.id,
      text: String(text),
      voiceName: String(voiceName),
      style: style ? String(style) : undefined,
      languageCode: languageCode ? String(languageCode) : undefined,
    });
    res.json({ audioBase64, mimeType: 'audio/wav', fallbackToBrowserSpeech: !audioBase64 });
  } catch (err) {
    console.warn('TTS falling back to Web Speech API:', err instanceof Error ? err.message : 'unavailable');
    res.json({ audioBase64: null, mimeType: 'audio/wav', fallbackToBrowserSpeech: true });
  }
});

app.post('/api/ai/transcribe', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', languageName, languageCode, targetPrompt } = req.body ?? {};
    if (!audioBase64 || !languageName) {
      res.status(400).json({ error: 'Audio payload and language are required.' });
      return;
    }
    const transcript = await transcribeSpokenAudio({
      userId: req.authUser!.id,
      base64Audio: String(audioBase64),
      mimeType: String(mimeType),
      languageName: String(languageName),
      languageCode: String(languageCode),
      targetPrompt: targetPrompt ? String(targetPrompt) : undefined,
    });
    res.json({ transcript });
  } catch (err) {
    console.error('Transcribe error:', err);
    res.status(502).json({ error: 'Speech transcription failed.' });
  }
});

// ========================
// FOUNDER EXCLUSIVE ADMIN CONSOLE
// ========================

app.get('/api/admin/overview', requireFounder, async (_req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const [{ value: totalStudents }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, 'student'));
    const [{ value: totalTopics }] = await db.select({ value: count() }).from(topics);
    const [{ value: totalVocab }] = await db.select({ value: count() }).from(vocabulary);
    const [{ value: totalAiCalls }] = await db.select({ value: count() }).from(aiUsageRecords);

    const langPopularity = await db
      .select({
        languageCode: userLanguages.languageCode,
        learners: count(),
      })
      .from(userLanguages)
      .groupBy(userLanguages.languageCode);

    const pendingReviews = await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(20);

    const draftTopics = await db
      .select()
      .from(topics)
      .orderBy(desc(topics.createdAt))
      .limit(25);

    const recentAuditLogs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(25);

    const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));
    const allAnnouncements = await db.select().from(announcements).orderBy(desc(announcements.createdAt));

    res.json({
      stats: {
        totalStudents: Number(totalStudents),
        totalTopics: Number(totalTopics),
        totalVocab: Number(totalVocab),
        totalAiCalls: Number(totalAiCalls),
      },
      langPopularity,
      pendingReviews,
      draftTopics,
      recentAuditLogs,
      events: allEvents,
      announcements: allAnnouncements,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to load founder analytics.' });
  }
});

app.post('/api/admin/announcements', requireFounder, async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body ?? {};
    if (!title || !body) {
      res.status(400).json({ error: 'Title and body are required.' });
      return;
    }
    const [created] = await db
      .insert(announcements)
      .values({ title: String(title), body: String(body), isPublished: true })
      .returning();
    await db.insert(auditLogs).values({
      actorEmail: req.authUser!.email,
      action: 'CREATE_ANNOUNCEMENT',
      detailsJson: { title },
    });
    res.status(201).json({ announcement: created });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

app.post('/api/admin/events', requireFounder, async (req: AuthRequest, res) => {
  try {
    const { title, category, languageCode = 'all', description, startsAt } = req.body ?? {};
    if (!title || !description) {
      res.status(400).json({ error: 'Event title and description are required.' });
      return;
    }
    const [created] = await db
      .insert(events)
      .values({
        title: String(title),
        category: String(category || 'Weekly Challenge'),
        languageCode: String(languageCode),
        description: String(description),
        startsAt: String(startsAt || new Date().toISOString().slice(0, 10)),
        isPublished: true,
      })
      .returning();
    await db.insert(auditLogs).values({
      actorEmail: req.authUser!.email,
      action: 'CREATE_EVENT',
      detailsJson: { title },
    });
    res.status(201).json({ event: created });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

app.post('/api/admin/topics', requireFounder, async (req: AuthRequest, res) => {
  try {
    const { languageCode, cefrLevel, title, subtitle, introduction, grammarSummary, status = 'review' } = req.body ?? {};
    if (!languageCode || !title) {
      res.status(400).json({ error: 'Language code and topic title are required.' });
      return;
    }
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(topics)
      .where(eq(topics.languageCode, String(languageCode)));

    const [created] = await db
      .insert(topics)
      .values({
        languageCode: String(languageCode),
        cefrLevel: String(cefrLevel || 'A1'),
        orderIndex: Number(existingCount) + 1,
        title: String(title),
        subtitle: String(subtitle || `${cefrLevel || 'A1'} Custom Module`),
        objectivesJson: [`Master ${title}`, 'Apply vocabulary and grammar in context'],
        lessonContentJson: {
          introduction: String(introduction || `Structured lesson on ${title}.`),
          grammarSummary: String(grammarSummary || 'Core usage patterns'),
          grammarRule: String(grammarSummary || 'Apply patterns in natural sentences.'),
          readingPassage: `Authentic reading practice for ${title}.`,
          readingQuestion: {
            prompt: `What is the central focus of ${title}?`,
            options: [String(title), 'Unrelated topic', 'None'],
            answerIndex: 0,
          },
          listeningScript: `Listening dialogue introducing ${title}.`,
          listeningQuestion: {
            prompt: 'Which topic did the dialogue introduce?',
            options: [String(title), 'Weather forecast', 'Sports scores'],
            answerIndex: 0,
          },
          speakingPrompt: `Discuss ${title} in your own words.`,
          writingPrompt: `Write 3 sentences practicing ${title}.`,
          culturalNote: 'Curated by Founder Curriculum Management.',
          finalQuiz: [
            {
              prompt: `Confirm mastery of ${title}:`,
              options: ['Completed and verified', 'Skipped'],
              answerIndex: 0,
              explanation: 'Verified curriculum objective.',
            },
          ],
        },
        status: status === 'published' ? 'published' : 'review',
      })
      .returning();

    await db.insert(auditLogs).values({
      actorEmail: req.authUser!.email,
      action: 'CREATE_CURRICULUM_TOPIC',
      detailsJson: { languageCode, title, status: created.status },
    });

    res.status(201).json({ topic: created });
  } catch (err) {
    console.error('Create topic error:', err);
    res.status(500).json({ error: 'Failed to create topic.' });
  }
});

app.patch('/api/admin/topics/:id/status', requireFounder, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status === 'published' ? 'published' : 'review';
    const [updated] = await db.update(topics).set({ status }).where(eq(topics.id, id)).returning();
    await db.insert(auditLogs).values({
      actorEmail: req.authUser!.email,
      action: 'UPDATE_TOPIC_STATUS',
      detailsJson: { topicId: id, status },
    });
    res.json({ topic: updated });
  } catch (err) {
    console.error('Update topic status error:', err);
    res.status(500).json({ error: 'Failed to update topic status.' });
  }
});

app.post('/api/admin/vocabulary', requireFounder, async (req: AuthRequest, res) => {
  try {
    const { languageCode, cefrLevel = 'A1', word, romanization = '', ipa = '', translationEn, partOfSpeech = 'noun', exampleSentence = '', exampleTranslation = '' } = req.body ?? {};
    if (!languageCode || !word || !translationEn) {
      res.status(400).json({ error: 'Language, word, and English translation are required.' });
      return;
    }
    const [created] = await db
      .insert(vocabulary)
      .values({
        languageCode: String(languageCode),
        cefrLevel: String(cefrLevel),
        topicSlug: 'founder-curated',
        word: String(word),
        romanization: romanization ? String(romanization) : null,
        ipa: ipa ? String(ipa) : null,
        translationEn: String(translationEn),
        definition: String(translationEn),
        partOfSpeech: String(partOfSpeech),
        exampleSentence: String(exampleSentence || word),
        exampleTranslation: String(exampleTranslation || translationEn),
        status: 'published',
      })
      .returning();

    await db.insert(auditLogs).values({
      actorEmail: req.authUser!.email,
      action: 'ADD_VOCABULARY',
      detailsJson: { languageCode, word },
    });

    res.status(201).json({ vocabulary: created });
  } catch (err) {
    console.error('Admin add vocab error:', err);
    res.status(500).json({ error: 'Failed to add vocabulary entry.' });
  }
});

app.patch('/api/admin/reviews/:id', requireFounder, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status === 'approved' ? 'approved' : 'rejected';
    const [updated] = await db.update(reviews).set({ status }).where(eq(reviews.id, id)).returning();
    await db.insert(auditLogs).values({
      actorEmail: req.authUser!.email,
      action: 'MODERATE_REVIEW',
      detailsJson: { reviewId: id, status },
    });
    res.json({ review: updated });
  } catch (err) {
    console.error('Moderate review error:', err);
    res.status(500).json({ error: 'Failed to moderate review.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`World Languages server running at http://localhost:${PORT}`);
  });
}

startServer();
