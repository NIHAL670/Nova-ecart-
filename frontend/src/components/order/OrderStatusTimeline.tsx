'use client';

import { Check, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_FLOW } from '@/constants';
import type { OrderStatus } from '@/types';

interface OrderStatusTimelineProps {
  current: OrderStatus;
  className?: string;
}

const specialStates: OrderStatus[] = ['cancelled', 'refunded'];

/** Horizontal stepper over the standard order-status flow. */
export function OrderStatusTimeline({ current, className }: OrderStatusTimelineProps) {
  const cancelled = current === 'cancelled';

  if (specialStates.includes(current)) {
    const terminal = cancelled ? 'Cancelled' : 'Refunded';
    return (
      <div className={cn('rounded-2xl border', cancelled ? 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5' : 'border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/5', className)}>
        <div className="flex items-center gap-3 p-4">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white', cancelled ? 'bg-rose-500' : 'bg-slate-500')}>
            {cancelled ? <X className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{terminal}</p>
            <p className="text-xs text-muted-foreground">This order is no longer progressing through fulfilment.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(current);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className={cn('flex w-full items-start', className)}>
      {ORDER_STATUS_FLOW.map((step, i) => {
        const isDone = i < safeIndex;
        const isCurrent = i === safeIndex;
        const isLast = i === ORDER_STATUS_FLOW.length - 1;

        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={cn('flex-1 border-t-2', i === 0 ? 'border-transparent' : isDone || isCurrent ? 'border-primary' : 'border-border')} />
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isDone
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground',
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
              </div>
              <div className={cn('flex-1 h-0.5', isLast ? 'border-transparent' : isDone ? 'bg-primary' : 'bg-border')} />
            </div>
            <span
              className={cn(
                'mt-2 px-1 text-center text-[11px] font-medium uppercase tracking-wide',
                isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}