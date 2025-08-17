import { NextResponse } from 'next/server';

export function GET() {
  const body = `User-agent: *
Disallow: /api/
Allow: /
Sitemap: https://www.om2chat.com/sitemap.xml\n`;
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
