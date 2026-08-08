'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Optional delta / trend hint rendered under the value. */
  trend?: { value: string; direction?: 'up' | 'down' | 'neutral' };
  hint?: string;
  className?: string;
}

/** Premium KPI tile — icon, label, big value and optional trend hint. */
export function StatCard({ icon: Icon, label, value, trend, hint, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-raised',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-colors group-hover:bg-primary/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                trend.direction === 'up' && 'text-emerald-600 dark:text-emerald-400',
                trend.direction === 'down' && 'text-rose-600 dark:text-rose-400',
                (!trend.direction || trend.direction === 'neutral') && 'text-muted-foreground',
              )}
            >
              {trend.direction === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
              {trend.direction === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend.value}
            </p>
          )}
          {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
