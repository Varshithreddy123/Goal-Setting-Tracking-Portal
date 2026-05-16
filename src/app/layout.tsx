import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoalTrack Portal',
  description: 'Goal Setting & Tracking Portal for employee performance management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
