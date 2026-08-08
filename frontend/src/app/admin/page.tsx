'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  PackageX,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import { fetchDashboard, fetchLowStock } from '@/services/admin.service';
import { queryKeys } from '@/constants';
import { formatCompact, formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { StatCard } from '@/components/admin/StatCard';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function OrderCustomer({ order }: { order: Order }) {
  const name = typeof order.user === 'object' ? order.user.name : order.user;
  const email = typeof order.user === 'object' ? order.user.email : undefined;
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{name}</p>
      {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: fetchDashboard,
  });
  const lowStock = useQuery({
    queryKey: queryKeys.admin.lowStock,
    queryFn: () => fetchLowStock(),
  });

  const recentOrders = data?.recentOrders ?? [];

  const stats = data
    ? [
        { icon: DollarSign, label: 'Total revenue', value: formatCurrency(data.revenue) },
        { icon: ShoppingCart, label: 'Orders', value: formatCompact(data.ordersCount), hint: `${data.ordersToday} today` },
        { icon: Users, label: 'Customers', value: formatCompact(data.customersCount), hint: `${data.customersToday} today` },
        { icon: Wallet, label: 'Avg order value', value: formatCurrency(data.avgOrderValue) },
      ]
    : [];

  return (
    <div className="space-y-6">
      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      <RevenueChart days={30} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageX className="h-4 w-4 text-amber-500" /> Low stock alerts
            </CardTitle>
            <CardDescription>Products running low or out of stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !lowStock.data || lowStock.data.length === 0 ? (
              <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                All stock levels are healthy.
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {lowStock.data.slice(0, 6).map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {p.stock <= 0 ? (
                          <PackageX className="h-4 w-4 shrink-0 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                        <span className="truncate text-sm font-medium">{p.name}</span>
                      </div>
                      <span
                        className={
                          p.stock <= 0
                            ? 'text-xs font-semibold text-destructive'
                            : 'text-xs font-semibold text-amber-600 dark:text-amber-400'
                        }
                      >
                        {p.stock} left
                      </span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="soft" className="w-full">
                  <Link href="/admin/inventory">
                    Manage inventory <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent orders</CardTitle>
              <CardDescription>Latest orders across the store</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<Order>
              isLoading={isLoading}
              data={recentOrders}
              rowKey={(o) => o._id}
              columns={[
                {
                  key: 'orderNumber',
                  header: 'Order',
                  cell: (o) => <span className="font-medium text-primary">{o.orderNumber}</span>,
                },
                { key: 'customer', header: 'Customer', cell: (o) => <OrderCustomer order={o} /> },
                {
                  key: 'date',
                  header: 'Date',
                  cell: (o) => <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>,
                },
                {
                  key: 'total',
                  header: 'Total',
                  cell: (o) => <span className="font-semibold">{formatCurrency(o.total, o.currency)}</span>,
                },
                { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
              ]}
              emptyTitle="No orders yet"
              emptyDescription="Orders will appear here as customers check out."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}