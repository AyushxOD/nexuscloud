import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NexusCloud | Cloud Intelligence Platform',
    template: '%s | NexusCloud',
  },
  description: 'AI-powered cloud resource optimization, cost analysis, and intelligent recommendations. Monitor, analyze, and optimize your AWS infrastructure in real-time.',
  keywords: ['cloud optimization', 'AWS', 'cost savings', 'resource management', 'infrastructure', 'DevOps', 'cloud intelligence'],
  authors: [{ name: 'NexusCloud' }],
  creator: 'NexusCloud',
  publisher: 'NexusCloud',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nexuscloud.io'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexuscloud.io',
    siteName: 'NexusCloud',
    title: 'NexusCloud | Cloud Intelligence Platform',
    description: 'AI-powered cloud resource optimization and cost analysis for AWS infrastructure.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NexusCloud - Cloud Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusCloud | Cloud Intelligence Platform',
    description: 'AI-powered cloud resource optimization and cost analysis for AWS infrastructure.',
    images: ['/og-image.png'],
    creator: '@nexuscloud',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#050507' },
    { media: '(prefers-color-scheme: dark)', color: '#050507' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-primary/30 selection:text-foreground">
        {/* Noise texture overlay for depth */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}