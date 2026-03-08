import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'LiveKit Ecommerce Voice Demo',
  description: 'Local MVP for a LiveKit-powered ecommerce voice and chat assistant.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
