'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminDeleteUser, adminListUsers, adminToggleUser } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { avatarUrl, formatDate } from '@/lib/utils';
import { DataTable } from '@/components/admin/DataTable';
import { EditUserDialog, type AdminUser } from '@/components/admin/EditUserDialog';
import { Pagination } from '@/components/admin/Pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.admin.users, page, debouncedSearch],
    queryFn: () =>
      adminListUsers({
        page,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleUser(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success('User status updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success('User removed');
      setDeleting(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const items: AdminUser[] = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Customers</CardTitle>
            <CardDescription>Manage registered users and their access</CardDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email…"
              className="w-60 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<AdminUser>
            isLoading={isLoading}
            data={items}
            rowKey={(u) => u._id}
            columns={[
              {
                key: 'user',
                header: 'User',
                cell: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatar ?? avatarUrl(u.name)} alt={u.name} />
                      <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Role',
                cell: (u) => <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>,
              },
              {
                key: 'joined',
                header: 'Joined',
                cell: (u) => (
                  <span className="text-sm text-muted-foreground">
                    {u.createdAt ? formatDate(u.createdAt) : '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (u) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={u.isActive !== false}
                      disabled={toggle.isPending && toggle.variables?.id === u._id}
                      onCheckedChange={(checked) => toggle.mutate({ id: u._id, isActive: checked })}
                    />
                    <span className="w-14 text-xs text-muted-foreground">
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: (u) => (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${u.name}`}
                      onClick={() => setEditUser(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${u.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            emptyTitle="No users found"
            emptyDescription="Users will appear here once they register."
          />
          {data && <Pagination page={data.meta.page} pages={data.meta.pages} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <EditUserDialog
        user={editUser}
        open={Boolean(editUser)}
        onOpenChange={(o) => {
          if (!o) setEditUser(null);
        }}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; ({deleting?.email}) will lose access to their account. This
              action cannot be undone.
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