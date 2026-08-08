'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminCreateCoupon, adminUpdateCoupon } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import type { Coupon } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CouponFormDialogProps {
  coupon?: Coupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CouponType = Coupon['type'];

function toDateValue(value: string | undefined): string {
  if (!value) return '';
  // Backend may return a full ISO timestamp — keep only the date part.
  return value.slice(0, 10);
}

/** Create/edit coupon dialog. Sends a plain JSON payload via the admin services. */
export function CouponFormDialog({ coupon, open, onOpenChange }: CouponFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(coupon);

  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setType(coupon.type);
      setValue(String(coupon.value));
      setMaxDiscount(coupon.maxDiscount != null ? String(coupon.maxDiscount) : '');
      setMinOrderAmount(coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : '');
      setMaxUses(coupon.maxUses != null ? String(coupon.maxUses) : '');
      setDescription(coupon.description ?? '');
      setValidFrom(toDateValue(coupon.validFrom));
      setValidUntil(toDateValue(coupon.validUntil));
      setIsActive(coupon.isActive);
    } else {
      setCode('');
      setType('percentage');
      setValue('');
      setMaxDiscount('');
      setMinOrderAmount('');
      setMaxUses('');
      setDescription('');
      setValidFrom('');
      setValidUntil('');
      setIsActive(true);
    }
  }, [coupon, open]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      coupon ? adminUpdateCoupon(coupon._id, payload) : adminCreateCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons });
      toast.success(isEdit ? 'Coupon updated' : 'Coupon created');
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const numValue = Number(value);
    if (!trimmedCode) {
      toast.error('Coupon code is required');
      return;
    }
    if (!value || Number.isNaN(numValue) || numValue <= 0) {
      toast.error('Enter a valid value');
      return;
    }

    const payload: Record<string, unknown> = {
      code: trimmedCode,
      type,
      value: numValue,
      isActive,
    };
    if (maxDiscount !== '') payload.maxDiscount = Number(maxDiscount);
    if (minOrderAmount !== '') payload.minOrderAmount = Number(minOrderAmount);
    if (maxUses !== '') payload.maxUses = Number(maxUses);
    if (description.trim()) payload.description = description.trim();
    if (validFrom) payload.validFrom = validFrom;
    if (validUntil) payload.validUntil = validUntil;

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit coupon' : 'New coupon'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the coupon details below.' : 'Create a discount code for your customers.'}
          </DialogDescription>
        </DialogHeader>
        <form id="coupon-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cf-code">Code</Label>
            <Input
              id="cf-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SAVE10"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="flat">Flat amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-value">Value {type === 'percentage' ? '(%)' : '(currency)'}</Label>
            <Input
              id="cf-value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percentage' ? '10' : '5.00'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-max">Max discount</Label>
            <Input
              id="cf-max"
              type="number"
              step="0.01"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-min">Min order amount</Label>
            <Input
              id="cf-min"
              type="number"
              step="0.01"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-uses">Max uses</Label>
            <Input
              id="cf-uses"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-from">Valid from</Label>
            <Input
              id="cf-from"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-until">Valid until</Label>
            <Input
              id="cf-until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cf-desc">Description</Label>
            <Input
              id="cf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown at checkout"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Allow customers to redeem this code</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}