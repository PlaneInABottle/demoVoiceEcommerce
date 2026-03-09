import './globals.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LiveKit Ecommerce Voice Demo',
  description: 'Local MVP for a LiveKit-powered ecommerce voice and chat assistant.',
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: 'oklch(0.14 0.03 258)',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
