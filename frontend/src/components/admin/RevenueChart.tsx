'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchRevenueTrend } from '@/services/admin.service';
import { queryKeys } from '@/constants';
import { cn, formatCompact, formatDate } from '@/lib/utils';
import type { TrendPoint } from '@/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RANGES = [7, 30, 90] as const;

interface RevenueChartProps {
  /** Days of trend to fetch when `data` is not provided (self-fetching mode). */
  days?: number;
  /** Pass pre-fetched points (e.g. from a sales report) to skip the internal query. */
  data?: TrendPoint[];
  /** Show the 7/30/90 range selector (only in self-fetching mode). */
  showRange?: boolean;
  className?: string;
}

const GRADIENT_ID = 'revenueChartGradient';

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string; payload?: TrendPoint }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (!point) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-foreground">
        {formatDate(point.date, { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      <p className="mt-1 text-muted-foreground">
        Revenue: <span className="font-semibold text-primary">${formatCompact(point.revenue)}</span>
      </p>
      <p className="text-muted-foreground">
        {point.orders} order{point.orders === 1 ? '' : 's'}
      </p>
      {typeof label === 'string' && label !== point.date && (
        <p className="text-muted-foreground/70">{label}</p>
      )}
    </div>
  );
}

/** Admin revenue area chart with a gradient fill and an optional 7/30/90 range selector. */
export function RevenueChart({ days = 30, data, showRange = true, className }: RevenueChartProps) {
  const [range, setRange] = useState<number>(days);

  const query = useQuery({
    queryKey: queryKeys.admin.trend(range),
    queryFn: () => fetchRevenueTrend(range),
    enabled: !data,
  });

  const points = data ?? query.data ?? [];
  const isLoading = !data && query.isLoading;

  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">Revenue trend</h3>
          <p className="text-xs text-muted-foreground">Daily revenue across the selected window</p>
        </div>
        {showRange && !data && (
          <div className="flex items-center gap-1 rounded-full border bg-muted/40 p-1">
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRange(d)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  range === d
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-xl" />
      ) : points.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No revenue data for this window.</p>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDate(d, { month: 'short', day: 'numeric' })}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill={`url(#${GRADIENT_ID})`}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
