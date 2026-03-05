import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sequential Multi-GPT Prompt Chain',
  description: '5-stage AI expert chain: Strategist, Analyst, Copywriter, Skeptic, Operator',
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
