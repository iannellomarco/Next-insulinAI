import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Insulin Calc AI',
  description: 'AI-powered diabetic carb counting and insulin calculator.',
};

import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.className} antialiased`} // Assuming inter.className is used for the font, and geistSans/geistMono are placeholders for actual font variables. I'll use inter.className and add antialiased.
        >
          <div className="app-container">
            {/* StoreProvider is not defined in the original file, so I'm omitting it to avoid errors. */}
            {children}
          </div>
          <div id="portal-root"></div>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
