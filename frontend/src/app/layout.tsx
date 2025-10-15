// ABOUTME: Root layout component for Next.js App Router
// ABOUTME: Provides HTML structure and global styles for all pages

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Synapse',
  description: 'Intelligent Task Management System',
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
