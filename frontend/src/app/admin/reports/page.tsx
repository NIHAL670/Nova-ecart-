'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, Wallet } from 'lucide-react';
import { fetchSalesReport, fetchTopProducts } from '@/services/admin.service';
import { formatCompact, formatCurrency } from '@/lib/utils';
import type { TrendPoint } from '@/types';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesSummary {
  orders: number;
  revenue: number;
  itemsSold: number;
}

function toNum(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
}

/** Defensive normaliser for the sales report payload (rows + summary shape). */
function normalizeReport(raw: unknown): { rows: TrendPoint[]; summary: SalesSummary } {
  if (!raw || typeof raw !== 'object') {
    return { rows: [], summary: { orders: 0, revenue: 0, itemsSold: 0 } };
  }
  const r = raw as Record<string, unknown>;
  const summary = (r.summary ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(r.rows) ? (r.rows as TrendPoint[]) : Array.isArray(r.data) ? (r.data as TrendPoint[]) : [];
  return {
    rows,
    summary: {
      orders: toNum(summary.orders ?? r.totalOrders ?? r.orders),
      revenue: toNum(summary.revenue ?? r.totalRevenue ?? r.revenue),
      itemsSold: toNum(summary.itemsSold ?? summary.items ?? r.itemsSold),
    },
  };
}

export default function AdminReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Initialise defaults client-side to avoid SSR/hydration mismatch on date bounds.
  useEffect(() => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 30);
    setFrom(fromDate.toISOString().slice(0, 10));
    setTo(today.toISOString().slice(0, 10));
  }, []);

  const reportQuery = useQuery({
    queryKey: ['admin', 'reports', from, to],
    queryFn: () => fetchSalesReport(from || undefined, to || undefined),
    enabled: Boolean(from && to),
  });

  const { rows, summary } = normalizeReport(reportQuery.data);

  const topQuery = useQuery({
    queryKey: ['admin', 'top-products', 5],
    queryFn: () => fetchTopProducts(5),
  });

  const isLoading = reportQuery.isLoading;

  const stats = [
    { icon: ShoppingCart, label: 'Orders', value: formatCompact(summary.orders) },
    { icon: Wallet, label: 'Revenue', value: formatCurrency(summary.revenue) },
    { icon: Package, label: 'Items sold', value: formatCompact(summary.itemsSold) },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales report</CardTitle>
          <CardDescription>Summarised performance for the selected date range</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rep-from">From</Label>
            <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep-to">To</Label>
            <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <RevenueChart data={rows} showRange={false} className="xl:col-span-2" />

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Top products</CardTitle>
            <CardDescription>Best sellers in the selected window</CardDescription>
          </CardHeader>
          <CardContent>
            {topQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !topQuery.data || topQuery.data.length === 0 ? (
              <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No sales yet in this period.
              </p>
            ) : (
              <ul className="space-y-3">
                {topQuery.data.map((p, i) => (
                  <li key={p._id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.sold} sold · {formatCurrency(p.revenue)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatCurrency(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}