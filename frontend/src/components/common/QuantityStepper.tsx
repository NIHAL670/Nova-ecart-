'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md';
}

/** Rounded +/− stepper for cart quantities. */
export function QuantityStepper({ value, onChange, min = 1, max = 99, className, size = 'md' }: QuantityStepperProps) {
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border bg-background p-0.5', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(btnSize)}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className={cn('min-w-8 text-center text-sm font-semibold tabular-nums', size === 'sm' ? 'text-xs' : '')}>{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(btnSize)}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}