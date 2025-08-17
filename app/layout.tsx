import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.om2chat.com'),
  title: 'om2chat',
  description:
    'Upload OMs, rent rolls, and T-12s. Share a client chat link with cited answers and get buyer insights. Faster qualification, happier clients.',
  icons: {
    icon: '/images/om2chat-favicon (64 x 64 px).svg',
    shortcut: '/images/om2chat-favicon (64 x 64 px).svg',
    apple: '/images/om2chat-favicon (64 x 64 px).svg',
  },
  openGraph: {
    title: 'om2chat',
    description:
      'Upload OMs, rent rolls, and T-12s. Share a client chat link with cited answers and get buyer insights.',
    url: 'https://www.om2chat.com',
    siteName: 'om2chat',
    type: 'website',
    images: [
      {
        url: '/images/demo-thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'om2chat – AI chat for CRE docs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'om2chat',
    description:
      'Upload OMs, rent rolls, and T-12s. Share a client chat link with cited answers and get buyer insights.',
    images: ['/images/demo-thumbnail.png'],
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Preconnects for faster font loading */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        {/* Preload logo used above-the-fold */}
        <link rel="preload" as="image" href="/images/om2chat-logo.svg" />
        {/* Hero image preload removed to simplify header visuals */}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        {/* Structured data */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'om2chat',
                  url: 'https://www.om2chat.com',
                  logo: 'https://www.om2chat.com/images/om2chat-logo.svg',
                },
                {
                  '@type': 'WebSite',
                  url: 'https://www.om2chat.com',
                  name: 'om2chat',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://www.om2chat.com/search?q={query}',
                    'query-input': 'required name=query',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'om2chat',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  description:
                    'AI chat for CRE docs (OMs, rent rolls, T-12). Share a client chat link with citations and see buyer insights.',
                  url: 'https://www.om2chat.com',
                  image: 'https://www.om2chat.com/images/demo-thumbnail.png',
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <Toaster position="top-center" />
            <SessionProvider>{children}</SessionProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
