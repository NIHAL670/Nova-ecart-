import Link from 'next/link';
import { Twitter, Instagram, Facebook, Youtube } from 'lucide-react';
import { Logo } from './Logo';

const COLUMNS = [
  { title: 'Shop', links: [['All Products', '/products'], ['Featured', '/products?sort=-rating'], ['Deals', '/products?sort=-discountPercent'], ['New Arrivals', '/products?sort=-createdAt']] },
  { title: 'Account', links: [['My Orders', '/orders'], ['Wishlist', '/wishlist'], ['Cart', '/cart'], ['Profile', '/profile']] },
  { title: 'Support', links: [['Help Center', '/help'], ['Shipping & Returns', '/shipping-returns'], ['Contact Us', '/contact'], ['FAQs', '/faqs']] },
  { title: 'Company', links: [['About', '/about'], ['Careers', '/careers'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
] as const;

const SOCIALS = [Twitter, Instagram, Facebook, Youtube];

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Premium products, thoughtfully curated. Fast shipping and easy returns on everything we sell.
          </p>
          <div className="flex gap-2">
            {SOCIALS.map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-accent">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Nova Cart. Built for the Adaption hackathon.</p>
          <p>Secure payments · Stripe · Razorpay · COD</p>
        </div>
      </div>
    </footer>
  );
}