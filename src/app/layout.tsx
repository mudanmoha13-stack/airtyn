import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'Pinkplan | Advanced Project Management',
  description: 'A modern, high-end collaborative project management SaaS platform.',
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-white min-h-screen overflow-x-hidden">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}