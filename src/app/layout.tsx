import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'InsulinAI - Smart Carb Counting',
  description: 'AI-powered diabetic carb counting and insulin calculator. Scan your meals, get accurate carb counts and insulin dosing suggestions.',
  keywords: ['insulin', 'diabetes', 'carb counting', 'AI', 'health', 'glucose'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1222' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans antialiased">
          <div className="app-container">
            {children}
          </div>
          <div id="portal-root"></div>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
