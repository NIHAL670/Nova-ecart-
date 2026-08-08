'use client';

import { useEffect, useState } from 'react';

export interface CountdownState {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calc(target: number): CountdownState {
  const total = Math.max(0, target - Date.now());
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1_000),
    expired: total <= 0,
  };
}

/** Live countdown to a fixed target date, ticking every second. */
export function useCountdown(target: Date): CountdownState {
  const ts = target.getTime();
  const [state, setState] = useState<CountdownState>(() => calc(ts));

  useEffect(() => {
    setState(calc(ts));
    const id = window.setInterval(() => setState(calc(ts)), 1000);
    return () => window.clearInterval(id);
  }, [ts]);

  return state;
}

/** 11:59:59 pm today — the daily flash-sale reset used across the home page. */
export function endOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
