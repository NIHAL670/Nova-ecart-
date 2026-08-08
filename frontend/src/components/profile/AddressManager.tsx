'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { queryKeys } from '@/constants';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressInput,
} from '@/services/address.service';
import type { Address } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage as apiErrorMessage } from '@/lib/api';

const labelOptions = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
] as const;

const addressSchema = z.object({
  label: z.enum(['home', 'work', 'other']),
  name: z.string().min(1, 'Recipient name is required'),
  phone: z.string().min(1, 'Phone is required'),
  addressLine1: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().optional(),
});
type AddressFormValues = z.infer<typeof addressSchema>;

function toInput(values: AddressFormValues): AddressInput {
  return {
    label: values.label,
    name: values.name,
    phone: values.phone,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2 ?? '',
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    country: values.country,
    isDefault: values.isDefault ?? false,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

interface AddressFormProps {
  open: boolean;
  editing: Address | null;
  isFirst: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddressFormValues) => void;
}

function AddressForm({ open, editing, isFirst, pending, onOpenChange, onSubmit }: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'home',
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        label: editing.label,
        name: editing.name,
        phone: editing.phone,
        addressLine1: editing.addressLine1,
        addressLine2: editing.addressLine2 ?? '',
        city: editing.city,
        state: editing.state,
        postalCode: editing.postalCode,
        country: editing.country,
        isDefault: editing.isDefault,
      });
    } else {
      form.reset({
        label: 'home',
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: isFirst,
      });
    }
  }, [open, editing, isFirst, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit address' : 'Add a new address'}</DialogTitle>
          <DialogDescription>Fill in the shipping details for this address.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Controller
                control={form.control}
                name="label"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={pending}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {labelOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-name">Recipient name</Label>
              <Input id="addr-name" placeholder="Jane Doe" disabled={pending} {...form.register('name')} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addr-phone">Phone</Label>
            <Input id="addr-phone" type="tel" placeholder="+1 555 000 0000" disabled={pending} {...form.register('phone')} />
            <FieldError message={form.formState.errors.phone?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addr-line1">Address line 1</Label>
            <Input id="addr-line1" placeholder="123 Main Street" disabled={pending} {...form.register('addressLine1')} />
            <FieldError message={form.formState.errors.addressLine1?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
            <Input id="addr-line2" placeholder="Apt, suite, floor" disabled={pending} {...form.register('addressLine2')} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="addr-city">City</Label>
              <Input id="addr-city" placeholder="New York" disabled={pending} {...form.register('city')} />
              <FieldError message={form.formState.errors.city?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-state">State / Province</Label>
              <Input id="addr-state" placeholder="NY" disabled={pending} {...form.register('state')} />
              <FieldError message={form.formState.errors.state?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-zip">Postal code</Label>
              <Input id="addr-zip" placeholder="10001" disabled={pending} {...form.register('postalCode')} />
              <FieldError message={form.formState.errors.postalCode?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-country">Country</Label>
              <Input id="addr-country" placeholder="United States" disabled={pending} {...form.register('country')} />
              <FieldError message={form.formState.errors.country?.message} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium">Set as default</p>
              <p className="text-xs text-muted-foreground">Used by default at checkout</p>
            </div>
            <Controller
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={pending} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save changes' : 'Add address'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddressManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { data: addresses, isLoading, isError } = useQuery({
    queryKey: queryKeys.addresses,
    queryFn: fetchAddresses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses });

  const createMut = useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: () => {
      invalidate();
      toast.success('Address added');
      setOpen(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressInput }) => updateAddress(id, input),
    onSuccess: () => {
      invalidate();
      toast.success('Address updated');
      setOpen(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      invalidate();
      toast.success('Address removed');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const defaultMut = useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => {
      invalidate();
      toast.success('Default address updated');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditing(address);
    setOpen(true);
  };

  const handleSubmit = (values: AddressFormValues) => {
    const input = toInput(values);
    if (editing) {
      updateMut.mutate({ id: editing._id, input });
    } else {
      const isFirst = (addresses?.length ?? 0) === 0;
      createMut.mutate({ ...input, isDefault: isFirst || input.isDefault });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Saved addresses</h3>
          <p className="text-sm text-muted-foreground">Manage the shipping addresses used at checkout.</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load addresses. Please try again.</p>
      ) : !addresses || addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No saved addresses yet</p>
          <p className="text-sm text-muted-foreground">Add your first address to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <div key={address._id} className="rounded-xl border p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {address.label}
                  </Badge>
                  {address.isDefault && (
                    <Badge variant="success">
                      <Star className="h-3 w-3 fill-current" /> Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit address" onClick={() => handleOpenEdit(address)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this address?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the {address.label} address. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => deleteMut.mutate(address._id)}
                          disabled={deleteMut.isPending}
                        >
                          {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-sm font-medium">{address.name}</p>
              <p className="text-sm text-muted-foreground">{address.phone}</p>
              <p className="text-sm text-muted-foreground">
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.city}, {address.state} {address.postalCode}, {address.country}
              </p>
              {!address.isDefault && (
                <>
                  <Separator className="my-3" />
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('w-full')}
                    disabled={defaultMut.isPending}
                    onClick={() => defaultMut.mutate(address._id)}
                  >
                    {defaultMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    Set as default
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AddressForm
        open={open}
        editing={editing}
        isFirst={(addresses?.length ?? 0) === 0}
        pending={createMut.isPending || updateMut.isPending}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}