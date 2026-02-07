import { AuthProvider } from '@/providers/AuthProvider';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Gamified Planner',
  description: 'Level up your life.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, mono.variable, "bg-neutral-950 text-neutral-100 font-sans antialiased")}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
