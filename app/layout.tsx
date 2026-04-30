import type { Metadata } from 'next';
import { Fredoka, Poppins } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jasno i Jasno — Learn Serbian through Stories',
  description:
    'A new way to fall in love with the Serbian language — through illustrated stories, warm lessons, and a sprinkle of magic.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${poppins.variable}`}>
      <body className="font-sans text-foreground antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
