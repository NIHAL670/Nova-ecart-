'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminDeleteCoupon, adminFetchCoupons } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { formatCurrency } from '@/lib/utils';
import type { Coupon } from '@/types';
import { CouponFormDialog } from '@/components/admin/CouponFormDialog';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: queryKeys.admin.coupons,
    queryFn: () => adminFetchCoupons(),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons });
      toast.success('Coupon deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Coupons</CardTitle>
            <CardDescription>Discount codes customers can redeem at checkout</CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable<Coupon>
            isLoading={isLoading}
            data={coupons}
            rowKey={(c) => c._id}
            columns={[
              {
                key: 'code',
                header: 'Code',
                cell: (c) => <span className="font-mono text-sm font-semibold text-primary">{c.code}</span>,
              },
              {
                key: 'type',
                header: 'Type',
                cell: (c) => <span className="text-sm capitalize text-muted-foreground">{c.type}</span>,
              },
              {
                key: 'value',
                header: 'Value',
                cell: (c) => (
                  <span className="text-sm font-semibold">
                    {c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}
                  </span>
                ),
              },
              {
                key: 'minOrder',
                header: 'Min order',
                cell: (c) => (
                  <span className="text-sm text-muted-foreground">
                    {c.minOrderAmount != null ? formatCurrency(c.minOrderAmount) : '—'}
                  </span>
                ),
              },
              {
                key: 'uses',
                header: 'Uses left',
                cell: (c) => (
                  <span className="text-sm text-muted-foreground">
                    {c.maxUses != null ? Math.max(0, c.maxUses - c.usedCount) : '∞'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (c) => (
                  <Badge variant={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: (c) => (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${c.code}`}
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${c.code}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            emptyTitle="No coupons yet"
            emptyDescription="Create your first discount code to start promoting."
          />
        </CardContent>
      </Card>

      <CouponFormDialog coupon={editing} open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Coupon code &ldquo;{deleting?.code}&rdquo; will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) del.mutate(deleting._id);
              }}
            >
              {del.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}