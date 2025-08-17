import { NextResponse } from 'next/server';

const base = 'https://www.om2chat.com';

const staticUrls = [
  '/',
  '/pricing',
  '/contact-sales',
  '/use-cases/offering-memorandum-chat',
  '/use-cases/rent-roll-t12-chat',
  '/use-cases/client-portal-alternative',
  '/residential',
  '/legal/privacy',
  '/legal/terms',
  '/legal/refund',
];

export function GET() {
  const urls = staticUrls
    .map((path) => `  <url><loc>${base}${path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`) 
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}


