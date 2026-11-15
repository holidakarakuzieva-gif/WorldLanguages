import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { auditLogs, sessions, users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export const FOUNDER_ALLOWLIST = new Set(['aiworldlanguages@gmail.com']);
export const SESSION_COOKIE_NAME = 'wl_session';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'founder';
  nativeLanguage: string;
  interfaceLanguage: string;
  country: string | null;
  dailyGoalMinutes: number;
  emailVerified: boolean;
  xp: number;
  streakDays: number;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derived = scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function createUserSession(userId: number, res: Response): Promise<void> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt,
  });

  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function resolveUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken && typeof cookieToken === 'string') {
    const tokenHash = hashToken(cookieToken);
    const rows = await db
      .select({
        user: users,
        session: sessions,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (rows.length > 0) {
      const u = rows[0].user;
      const role: 'student' | 'founder' =
        u.role === 'founder' && FOUNDER_ALLOWLIST.has(u.email.toLowerCase())
          ? 'founder'
          : 'student';
      return {
        id: u.id,
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role,
        nativeLanguage: u.nativeLanguage,
        interfaceLanguage: u.interfaceLanguage,
        country: u.country,
        dailyGoalMinutes: u.dailyGoalMinutes,
        emailVerified: u.emailVerified,
        xp: u.xp,
        streakDays: u.streakDays,
      };
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      const email = (decoded.email ?? '').toLowerCase();
      if (!email) return null;
      const role: 'student' | 'founder' = FOUNDER_ALLOWLIST.has(email) ? 'founder' : 'student';
      const [upserted] = await db
        .insert(users)
        .values({
          uid: decoded.uid,
          email,
          displayName: decoded.name || email.split('@')[0],
          role,
          emailVerified: Boolean(decoded.email_verified),
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            uid: decoded.uid,
            emailVerified: Boolean(decoded.email_verified),
          },
        })
        .returning();

      return {
        id: upserted.id,
        uid: upserted.uid,
        email: upserted.email,
        displayName: upserted.displayName,
        role: upserted.role === 'founder' && FOUNDER_ALLOWLIST.has(upserted.email.toLowerCase()) ? 'founder' : 'student',
        nativeLanguage: upserted.nativeLanguage,
        interfaceLanguage: upserted.interfaceLanguage,
        country: upserted.country,
        dailyGoalMinutes: upserted.dailyGoalMinutes,
        emailVerified: upserted.emailVerified,
        xp: upserted.xp,
        streakDays: upserted.streakDays,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function attachOptionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await resolveUserFromRequest(req);
    if (user) req.authUser = user;
  } catch {
    // Non-blocking for public endpoints
  }
  next();
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    req.authUser = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

export async function requireFounder(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = req.authUser;
    if (!user || user.role !== 'founder' || !FOUNDER_ALLOWLIST.has(user.email.toLowerCase())) {
      await db
        .insert(auditLogs)
        .values({
          actorEmail: user?.email ?? 'anonymous',
          action: 'UNAUTHORIZED_ADMIN_ATTEMPT',
          detailsJson: { path: req.path },
        })
        .catch(() => {});
      res.status(403).json({ error: 'Forbidden: Founder administrator access required.' });
      return;
    }
    next();
  });
}
