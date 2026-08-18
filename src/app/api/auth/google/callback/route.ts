import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || '';

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return redirectToAppWithError(request, `Google auth failed: ${error}`);
    }

    if (!code) {
      return redirectToAppWithError(request, 'No authorization code received');
    }

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.length < 10) {
      return redirectToAppWithError(request, 'Google OAuth not configured');
    }

    // 1. Exchange code for tokens
    const redirectUri = `${APP_URL || new URL(request.url).origin}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Google token exchange failed:', errBody);
      return redirectToAppWithError(request, 'Failed to exchange authorization code');
    }

    const tokens = await tokenRes.json() as GoogleTokenResponse;

    // 2. Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return redirectToAppWithError(request, 'Failed to fetch Google profile');
    }

    const googleUser = await userRes.json() as GoogleUserInfo;

    if (!googleUser.verified_email) {
      return redirectToAppWithError(request, 'Google email is not verified');
    }

    // 3. Find or create user in our database
    const existing = await db.user.findUnique({ where: { email: googleUser.email } });

    let user;
    if (existing) {
      if (!existing.isActive) {
        return redirectToAppWithError(request, 'Account is suspended');
      }
      // Update avatar if needed
      if (googleUser.picture && !existing.avatarUrl) {
        user = await db.user.update({
          where: { id: existing.id },
          data: { avatarUrl: googleUser.picture },
          include: { state: true, city: true },
        });
      } else {
        user = existing;
      }
    } else {
      // Create new user (need a dummy password hash since field is required)
      const { hash } = await import('bcryptjs');
      const dummyPw = `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const passwordHash = await hash(dummyPw, 12);

      user = await db.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          passwordHash,
          role: 'CUSTOMER',
          isVerified: true,
          isActive: true,
          trustScore: 50,
          avatarUrl: googleUser.picture || null,
        },
        include: { state: true, city: true },
      });
    }

    // 4. Create our session
    const token = await createSession(user.id);

    // 5. Redirect to app with session cookie
    const { passwordHash: _, ...userWithoutPassword } = user;
    const redirectUrl = `${APP_URL || new URL(request.url).origin}/`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    // Store user data in a short-lived cookie so the frontend can pick it up
    response.cookies.set('google_auth_success', JSON.stringify(userWithoutPassword), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 10,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return redirectToAppWithError(request, 'Authentication failed');
  }
}

function redirectToAppWithError(request: NextRequest, message: string) {
  const origin = APP_URL || new URL(request.url).origin;
  const url = new URL(origin);
  url.searchParams.set('auth_error', message);
  return NextResponse.redirect(url.toString());
}
