/**
 * Next.js Middleware - Security Layer
 *
 * Applies security headers, CSP, CSRF protection,
 * request size protection, and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/rentals',
  '/api/reviews',
  '/api/conversations',
  '/api/notifications',
  '/api/kyc',
  '/api/disputes',
];

const ADMIN_ROUTES = ['/api/admin'];

const AUTH_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
];

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -----------------------------------------
  // Generate a unique CSP nonce
  // -----------------------------------------
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Pass nonce to Next.js
  response.request.headers.set('x-nonce', nonce);

  // -----------------------------------------
  // Security headers
  // -----------------------------------------
  applySecurityHeaders(response, nonce);

  // -----------------------------------------
  // Request size protection
  // -----------------------------------------
  const contentLength = request.headers.get('content-length');

  if (
    contentLength &&
    parseInt(contentLength, 10) > 10 * 1024 * 1024
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'Request too large',
      },
      { status: 413 }
    );
  }

  // -----------------------------------------
  // CSRF protection
  // -----------------------------------------
  const method = request.method;
  const isProduction = process.env.NODE_ENV === 'production';

  if (
    !SAFE_METHODS.includes(method) &&
    pathname.startsWith('/api/')
  ) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Require Origin or Referer in production
    if (isProduction && !origin && !referer) {
      console.error(
        '[SECURITY] CSRF: Missing Origin/Referer',
        {
          path: pathname,
          method,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request origin',
        },
        { status: 403 }
      );
    }

    // Validate Origin
    if (isProduction && origin) {
      const allowedOrigins = getAllowedOrigins();

      try {
        const originUrl = new URL(origin);

        const isAllowed = allowedOrigins.some((allowed) => {
          try {
            return (
              originUrl.origin ===
              new URL(allowed).origin
            );
          } catch {
            return origin === allowed;
          }
        });

        if (!isAllowed) {
          console.error(
            '[SECURITY] CSRF: Origin not allowed',
            {
              origin,
              path: pathname,
            }
          );

          return NextResponse.json(
            {
              success: false,
              error: 'Invalid request origin',
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid origin',
          },
          { status: 403 }
        );
      }
    }
  }

  // -----------------------------------------
  // Path traversal protection
  // -----------------------------------------
  if (
    pathname.includes('..') ||
    pathname.includes('//')
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid path',
      },
      { status: 400 }
    );
  }

  return response;
}

/**
 * Apply security headers
 */
function applySecurityHeaders(
  response: NextResponse,
  nonce: string
) {
  const isDev =
    process.env.NODE_ENV !== 'production';

  // HTTPS
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // MIME sniffing
  response.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  );

  // Clickjacking protection
  response.headers.set(
    'X-Frame-Options',
    isDev ? 'SAMEORIGIN' : 'DENY'
  );

  // Referrer policy
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), payment=(self)'
  );

  // -----------------------------------------
  // Content Security Policy
  // -----------------------------------------
  const csp = buildCSP(nonce);

  response.headers.set(
    'Content-Security-Policy',
    csp
  );

  // Legacy XSS protection
  response.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  );

  // API cache protection
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );

  response.headers.set(
    'Pragma',
    'no-cache'
  );

  // Hide server information
  response.headers.delete('x-powered-by');
}

/**
 * Build Content Security Policy
 */
function buildCSP(nonce: string): string {
  const isDev =
    process.env.NODE_ENV === 'development';

  const directives = [
    // Default
    "default-src 'self'",

    // Next.js + Razorpay + Google authentication
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https://checkout.razorpay.com",
      "https://accounts.google.com",
      isDev ? "'unsafe-eval'" : '',
    ]
      .filter(Boolean)
      .join(' '),

    // Tailwind / Next.js styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Images
    "img-src 'self' data: blob: https: http:",

    // Fonts
    "font-src 'self' data: https://fonts.gstatic.com",

    // API / WebSocket / Razorpay / Google
    [
      "connect-src",
      "'self'",
      "wss:",
      "https://checkout.razorpay.com",
      "https://api.razorpay.com",
      "https://accounts.google.com",
      "https://oauth2.googleapis.com",
      "https://www.googleapis.com",
    ].join(' '),

    // Razorpay checkout iframe
    [
      "frame-src",
      "'self'",
      "https://checkout.razorpay.com",
      "https://api.razorpay.com",
      "https://accounts.google.com",
    ].join(' '),

    // Forms
    "form-action 'self' https://accounts.google.com",

    // Frames
    `frame-ancestors 'self'${isDev ? ' https://*.space-z.ai' : ''}`,

    // Security
    "base-uri 'self'",
    "object-src 'none'",

    // Media
    "media-src 'self' blob:",

    // Workers
    "worker-src 'self' blob:",

    // Prevent mixed content
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

/**
 * Get allowed origins for CSRF
 */
function getAllowedOrigins(): string[] {
  const envOrigins =
    process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';

  return [appUrl];
}

/**
 * Middleware routes
 */
export const config = {
  matcher: [
    '/api/:path*',

    '/((?!_next/static|_next/image|favicon.ico|uploads|public).*)',
  ],
};