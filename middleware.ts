import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isDevelopmentEnvironment } from './lib/constants';
import { createClient } from '@supabase/supabase-js';
// Note: Avoid importing Node-only modules in middleware (Edge runtime)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if user's trial has expired
async function checkTrialStatus(brokerId: string) {
  try {
    const { data, error } = await supabase
      .from('brokers')
      .select('subscription_status, trial_ends_at, subscription_tier')
      .eq('id', brokerId)
      .single();

    if (error || !data) return { isValid: false, reason: 'User not found' };

    // If user has a paid subscription, they're always valid
    if (data.subscription_status === 'active' && !data.trial_ends_at) {
      return { isValid: true, reason: 'Paid subscription' };
    }

    // Users with pending subscriptions cannot access the app
    // They must complete payment first
    if (data.subscription_status === 'pending') {
      return { isValid: false, reason: 'Payment required' };
    }

    // Check if trial has expired
    if (data.trial_ends_at && new Date() > new Date(data.trial_ends_at)) {
      return { isValid: false, reason: 'Trial expired' };
    }

    return { isValid: true, reason: 'Trial active' };
  } catch (error) {
    console.error('Error checking trial status:', error);
    return { isValid: false, reason: 'Error checking trial' };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Auth rate limiting removed in middleware to ensure Edge compatibility.

  // Always allow API routes to pass through
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // CRITICAL: Public links should always be accessible without authentication
  // and should never redirect to login
  if (pathname.startsWith('/public/')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    // Allow access to register, login, forgot password, reset password, setup account, pre-checkout, welcome, public pages, trial expired page, legal pages, contact sales, and landing page without authentication
    if (
      pathname === '/' ||
      pathname === '/register' ||
      pathname === '/login' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/setup-account' ||
      pathname === '/pre-checkout' ||
      pathname === '/welcome' ||
      pathname === '/trial-expired' ||
      pathname === '/payment-required' ||
      pathname === '/contact-sales' ||
      pathname === '/team/accept' ||
      pathname.startsWith('/team/accept') ||
      pathname.startsWith('/legal/')
    ) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to login page for protected routes
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login page to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For authenticated users on landing page, allow access if trial expired or coming from sign out
  if (token?.id && pathname === '/') {
    const trialStatus = await checkTrialStatus(token.id as string);
    const referer = request.headers.get('referer');
    const isFromSignOut =
      referer?.includes('/trial-expired') ||
      referer?.includes('/api/auth/signout');

    // Allow access if trial expired or coming from sign out
    if (!trialStatus.isValid && trialStatus.reason === 'Trial expired') {
      return NextResponse.next();
    }

    if (isFromSignOut) {
      return NextResponse.next();
    }

    // Otherwise redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For authenticated users, check trial status before allowing access to protected pages
  // Only check on dashboard and other protected routes, not on landing page, trial-expired, or public pages
  if (
    token?.id &&
    pathname !== '/trial-expired' &&
    pathname !== '/' &&
    pathname !== '/payment-required' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/auth/') &&
    !pathname.startsWith('/public/')
  ) {
    const trialStatus = await checkTrialStatus(token.id as string);

    // If trial has expired, redirect to trial expired page
    if (!trialStatus.isValid && trialStatus.reason === 'Trial expired') {
      return NextResponse.redirect(new URL('/trial-expired', request.url));
    }

    // If payment is required, redirect to payment required page
    if (!trialStatus.isValid && trialStatus.reason === 'Payment required') {
      return NextResponse.redirect(new URL('/payment-required', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',
    '/public/:path*', // <-- Ensure public links are always matched
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images/ (static images)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|images/|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
