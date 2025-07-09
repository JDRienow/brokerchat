import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Allow access to register page even if already authenticated
  if (token && !redirectUrl.includes('/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access register page, redirect there directly
  if (redirectUrl.includes('/register')) {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  return signIn('guest', { redirect: true, redirectTo: redirectUrl });
}
