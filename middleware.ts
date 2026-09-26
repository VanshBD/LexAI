import { NextRequest, NextResponse } from 'next/server';
import { buildCspHeader, generateNonce } from '@/lib/security/cspConfig';
import { checkRateLimit } from '@/lib/security/rateLimiter';

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const result = checkRateLimit(ip);
    if (!result.allowed) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter ?? 60),
        },
      });
    }
  }

  // CSP headers on all routes
  const nonce = generateNonce();
  const csp = buildCspHeader(nonce);
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
