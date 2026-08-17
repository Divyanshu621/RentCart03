import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const SECRET_KEY = 'rentloop-secret-key-2024';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// In-memory session store
const sessionStore = new Map<string, { userId: string; expiresAt: number }>();

function base64urlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64urlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

export async function createSession(userId: string): Promise<string> {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + SESSION_DURATION,
  });

  const encodedPayload = base64urlEncode(payload);
  const signature = createHmac('sha256', SECRET_KEY).update(encodedPayload).digest('base64url');

  const token = `${encodedPayload}.${signature}`;

  sessionStore.set(token, {
    userId,
    expiresAt: Date.now() + SESSION_DURATION,
  });

  // Clean up expired sessions periodically
  if (sessionStore.size > 1000) {
    const now = Date.now();
    for (const [key, value] of sessionStore.entries()) {
      if (value.expiresAt < now) sessionStore.delete(key);
    }
  }

  return token;
}

export async function verifySession(token: string): Promise<{ userId: string } | null> {
  // Check in-memory store first
  const stored = sessionStore.get(token);
  if (stored) {
    if (stored.expiresAt < Date.now()) {
      sessionStore.delete(token);
      return null;
    }
    return { userId: stored.userId };
  }

  // Fallback: verify token signature
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = createHmac('sha256', SECRET_KEY)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function destroySession(token: string): void {
  sessionStore.delete(token);
}

export async function getSession(request: NextRequest): Promise<{ userId: string } | null> {
  // Check cookie first
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    const session = await verifySession(cookieToken);
    if (session) return session;
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await verifySession(token);
    if (session) return session;
  }

  return null;
}
