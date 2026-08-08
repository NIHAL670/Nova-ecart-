'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { createAddress, type AddressInput } from '@/services/address.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Address } from '@/types';

interface AddressFormProps {
  onCreated?: (address: Address) => void;
  className?: string;
}

const emptyForm: AddressInput = {
  label: 'home',
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
};

/** Inline "add a new address" form used during checkout step 1. */
export function AddressForm({ onCreated, className }: AddressFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const created = await createAddress(form);
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      toast.success('Address added');
      setForm(emptyForm);
      onCreated?.(created);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="addr-name">Full name</Label>
          <Input id="addr-name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Receiver name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-phone">Phone</Label>
          <Input id="addr-phone" required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="addr-line1">Address line 1</Label>
          <Input id="addr-line1" required value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="Flat / house no, building, street" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
          <Input id="addr-line2" value={form.addressLine2 ?? ''} onChange={(e) => set('addressLine2', e.target.value)} placeholder="Area, landmark" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-city">City</Label>
          <Input id="addr-city" required value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-state">State</Label>
          <Input id="addr-state" required value={form.state} onChange={(e) => set('state', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-postal">Postal code</Label>
          <Input id="addr-postal" required value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Label</Label>
          <Select value={form.label} onValueChange={(v) => set('label', v as AddressInput['label'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="addr-country">Country</Label>
          <Input id="addr-country" required value={form.country} onChange={(e) => set('country', e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save address
        </Button>
      </div>
    </form>
  );
}