import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Subora — Subscription Tracker',
  description:
    'Track, manage, and optimize all your subscriptions in one place. Multi-device sync, real-time analytics, and smart spending insights.',
  keywords: 'subscription tracker, spending, analytics, Netflix, Spotify, budget',
  openGraph: {
    title: 'Subora — Subscription Tracker',
    description: 'Track all your subscriptions with real-time sync across all devices.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
