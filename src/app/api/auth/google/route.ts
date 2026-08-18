import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

const googleAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  googleId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = googleAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, name, googleId } = parsed.data;

    // Check if user exists
    const existing = await db.user.findUnique({ where: { email } });

    let user;
    let isNew = false;

    if (existing) {
      // Log in existing user
      if (!existing.isActive) {
        return NextResponse.json({ error: 'Account is suspended' }, { status: 403 });
      }
      user = existing;
    } else {
      // Create new user with random password (they'll never use it)
      const randomPassword = `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const passwordHash = await hash(randomPassword, 12);

      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'CUSTOMER',
          isVerified: true,
          isActive: true,
          trustScore: 50,
        },
      });
      isNew = true;
    }

    // Create session
    const token = await createSession(user.id);

    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { user: userWithoutPassword, message: isNew ? 'Account created via Google' : 'Logged in via Google' },
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
