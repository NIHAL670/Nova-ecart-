import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/providers/app-providers';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { CartDrawer } from '@/components/common/CartDrawer';
import { SearchOverlay } from '@/components/common/SearchOverlay';
import { inter, sora } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Nova Cart — Premium Online Store', template: '%s · Nova Cart' },
  description: 'Premium products, thoughtfully curated. Fast shipping and easy returns.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Nova Cart',
    title: 'Nova Cart — Premium Online Store',
    description: 'Premium products, thoughtfully curated.',
  },
};

export const viewport: Viewport = {
  themeColor: 'hsl(262 83% 58%)',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} min-h-screen font-sans`}>
        <AppProviders>
          <Navbar />
          <main className="flex min-h-[70vh] flex-1 flex-col">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
        </AppProviders>
      </body>
    </html>
  );
}