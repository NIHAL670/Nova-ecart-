'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CHECKOUT_STEPS = ['Address', 'Payment', 'Review'] as const;

interface CheckoutStepperProps {
  step: number;
  className?: string;
}

/** Three-step indicator used at the top of the checkout flow. */
export function CheckoutStepper({ step, className }: CheckoutStepperProps) {
  return (
    <ol className={cn('flex items-center gap-2', className)}>
      {CHECKOUT_STEPS.map((label, i) => {
        const idx = i + 1;
        const state = idx < step ? 'done' : idx === step ? 'current' : 'todo';
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                state === 'done' && 'border-primary bg-primary text-primary-foreground',
                state === 'current' && 'border-primary bg-background text-primary',
                state === 'todo' && 'border-border bg-background text-muted-foreground',
              )}
            >
              {state === 'done' ? <Check className="h-4 w-4" /> : idx}
            </span>
            <span
              className={cn(
                'text-sm font-medium capitalize hidden sm:inline',
                state === 'todo' && 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {idx < CHECKOUT_STEPS.length && <span className={cn('mx-1 h-px flex-1', idx < step ? 'bg-primary' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}