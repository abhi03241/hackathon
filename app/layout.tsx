import type {Metadata} from 'next';
import {JetBrains_Mono} from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'NG Yoga Studio Indore — Clinical Somatic Routing & Membership Platform',
  description:
    'Clinical health-first programme routing, capacity-locked batch booking, and client membership platform for NG Yoga Studio, Ashok Nagar, Indore.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body
        suppressHydrationWarning
        className="bg-[#eff1f5] text-[#4c4f69] font-mono antialiased min-h-screen selection:bg-[#1e66f5] selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
