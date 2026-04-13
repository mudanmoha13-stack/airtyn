import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'Airtyn | Advanced Project Management',
  description: 'A modern, high-end collaborative operating platform for projects and business operations.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
    shortcut: '/icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script defer src="https://shown.io/metrics/Nq92Yvg18W" type="text/javascript"></script>
      </head>
      <body
        suppressHydrationWarning
        className="font-body antialiased selection:bg-primary/30 selection:text-white min-h-screen overflow-x-hidden"
      >
        <AppProviders>
          {/* Shell lives here — mounts once and persists across all navigations.
              Each page file renders only its own content (no <Shell> wrapper needed). */}
          <Shell>{children}</Shell>
        </AppProviders>
      </body>
    </html>
  );
}
