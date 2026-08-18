import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || '';

// ─── GET: Start real Google OAuth flow ───────────────────────
export async function GET(request: NextRequest) {
  // If Google OAuth is not configured, return error so frontend falls back to demo
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.length < 10) {
    return NextResponse.json(
      { error: 'Google OAuth not configured. Use demo mode.', demoMode: true },
      { status: 200 }
    );
  }

  // Build Google OAuth consent URL
  const redirectUri = `${APP_URL || new URL(request.url).origin}/api/auth/google/callback`;
  const scope = encodeURIComponent('openid email profile');
  const state = Buffer.from(JSON.stringify({
    ts: Date.now(),
    nonce: Math.random().toString(36).slice(2),
  })).toString('base64url');

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=select_account` +
    `&state=${state}`;

  return NextResponse.redirect(googleAuthUrl);
}

// ─── POST: Demo mode (manual Gmail sign-in) ──────────────────
const demoAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  googleId: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = demoAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, name, avatarUrl } = parsed.data;

    const user = await findOrCreateGoogleUser({
      email,
      name,
      googleId: parsed.data.googleId || null,
      avatarUrl: avatarUrl || null,
    });

    const token = await createSession(user.id);

    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { user: userWithoutPassword, message: 'Signed in via Google' },
      { status: 200 },
    );
    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Shared: Find or create a Google user ────────────────────
interface GoogleUserData {
  email: string;
  name: string;
  googleId: string | null;
  avatarUrl: string | null;
}

async function findOrCreateGoogleUser(data: GoogleUserData) {
  const existing = await db.user.findUnique({ where: { email: data.email } });

  if (existing) {
    if (!existing.isActive) {
      throw new Error('Account is suspended');
    }
    // Update avatar if provided and user doesn't have one
    if (data.avatarUrl && !existing.avatarUrl) {
      await db.user.update({
        where: { id: existing.id },
        data: { avatarUrl: data.avatarUrl },
      });
      return { ...existing, avatarUrl: data.avatarUrl };
    }
    return existing;
  }

  // Create new user
  const randomPassword = `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const passwordHash = await hash(randomPassword, 12);

  return db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'CUSTOMER',
      isVerified: true,
      isActive: true,
      trustScore: 50,
      avatarUrl: data.avatarUrl,
    },
  });
}

// Export for use in callback route
export { findOrCreateGoogleUser };
