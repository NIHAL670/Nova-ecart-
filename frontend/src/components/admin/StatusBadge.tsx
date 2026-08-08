'use client';

import { cn } from '@/lib/utils';
import { orderStatusStyles } from '@/constants';
import type { OrderStatus } from '@/types';

/** Pill for an order status, colour-coded via the shared status map. */
export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const style = orderStatusStyles[status] ?? orderStatusStyles.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}