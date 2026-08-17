import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (session) {
      // Try to get the token from cookie or header to destroy it
      const cookieToken = request.cookies.get('token')?.value;
      const authHeader = request.headers.get('authorization');
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (cookieToken) destroySession(cookieToken);
      if (headerToken) destroySession(headerToken);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.set('token', '', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
