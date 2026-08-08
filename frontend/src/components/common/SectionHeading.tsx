import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  align?: 'left' | 'center';
  className?: string;
}

/** Section header used across landing sections. */
export function SectionHeading({ eyebrow, title, description, link, align = 'center', className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-8', align === 'center' ? 'text-center' : '', className)}>
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
      <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      {link && (
        <Link href={link.href} className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {link.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}