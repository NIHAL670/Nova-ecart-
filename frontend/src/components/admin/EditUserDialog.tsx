'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { adminToggleUser } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { avatarUrl } from '@/lib/utils';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

/**
 * Admin view of a user. Mirrors the backend user payload, which additionally
 * exposes the active flag and the created date.
 */
export interface AdminUser extends User {
  isActive?: boolean;
  createdAt?: string;
}

interface EditUserDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Simple dialog to flip a user's active status with a confirm action. */
export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (user) setActive(user.isActive !== false);
  }, [user, open]);

  const mutation = useMutation({
    mutationFn: () =>
      user ? adminToggleUser(user._id, active) : Promise.reject(new Error('No user selected')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success(`User ${active ? 'activated' : 'deactivated'}`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage account</DialogTitle>
          <DialogDescription>Change whether this user can sign in and place orders.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
          <Avatar>
            <AvatarImage src={user.avatar ?? avatarUrl(user.name)} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Account {active ? 'active' : 'deactivated'}</p>
              <p className="text-xs text-muted-foreground">
                {active ? 'User can sign in normally.' : 'User will be blocked from signing in.'}
              </p>
            </div>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}