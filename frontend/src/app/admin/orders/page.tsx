'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetchOrders, adminUpdateOrderStatus } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { orderStatusStyles, paymentMethodLabels, queryKeys } from '@/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { DataTable } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

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

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const queryKey = useMemo(
    () => [...queryKeys.admin.orders, page, status, debouncedSearch],
    [page, status, debouncedSearch],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminFetchOrders({
        page,
        status: status === 'all' ? undefined : status,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => adminUpdateOrderStatus(id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      toast.success('Order status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const pendingOrderId = updateStatus.isPending ? updateStatus.variables?.id : undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Orders</CardTitle>
            <CardDescription>Search, filter and update order statuses</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order number…"
                className="w-52 pl-9 sm:w-60"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as 'all' | OrderStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {orderStatusStyles[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<Order>
            isLoading={isLoading}
            data={data?.items}
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
                cell: (o) => <span className="text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</span>,
              },
              {
                key: 'total',
                header: 'Total',
                cell: (o) => <span className="font-semibold">{formatCurrency(o.total, o.currency)}</span>,
              },
              {
                key: 'payment',
                header: 'Payment',
                cell: (o) => <span className="text-sm text-muted-foreground">{paymentMethodLabels[o.paymentMethod]}</span>,
              },
              { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
              {
                key: 'update',
                header: 'Update',
                cell: (o) => (
                  <Select
                    value={o.status}
                    disabled={pendingOrderId === o._id}
                    onValueChange={(v) => updateStatus.mutate({ id: o._id, next: v as OrderStatus })}
                  >
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      {pendingOrderId === o._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {orderStatusStyles[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ),
              },
            ]}
            emptyTitle="No orders found"
            emptyDescription="Try adjusting the filters, or check back later."
          />
          {data && <Pagination page={data.meta.page} pages={data.meta.pages} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  );
}