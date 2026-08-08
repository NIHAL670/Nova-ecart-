'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * 6-box OTP input backed by a single visually-hidden numeric input.
 * Supports auto-advance, click-to-position, and paste (window handles paste →
 * full value, firing onComplete).
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  autoFocus,
  className,
}: OtpInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const caretIndex = activeIndex > length ? length : activeIndex;

  const moveCaretTo = (index: number) => {
    setActiveIndex(index);
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(index, index);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    const caret = clean.length;
    setActiveIndex(caret);
    if (clean.length === length) {
      e.target.blur();
      onComplete?.(clean);
    } else {
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(caret, caret);
        }
      });
    }
  };

  return (
    <div
      className={cn('relative flex items-center justify-center', disabled && 'pointer-events-none opacity-60', className)}
      onClick={() => moveCaretTo(caretIndex)}
    >
      <div className="flex items-center justify-center gap-2">
        {digits.map((d, i) => {
          const active = focused && i === caretIndex;
          return (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                moveCaretTo(i === length ? length : i);
              }}
              className={cn(
                'flex h-14 w-11 cursor-text items-center justify-center rounded-xl border text-xl font-bold tabular-nums transition-colors',
                d ? 'border-primary bg-primary/5 text-foreground' : 'border-input bg-background',
                active && 'border-primary ring-2 ring-primary/60',
              )}
            >
              {d}
            </div>
          );
        })}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        className="absolute inset-0 inline-block h-full w-full cursor-text text-primary opacity-0"
        aria-label="One-time passcode"
      />
    </div>
  );
}