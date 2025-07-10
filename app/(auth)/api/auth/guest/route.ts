import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Broker app doesn't support guest authentication
  // Redirect to login page instead
  return NextResponse.redirect(new URL('/login', request.url));
}
