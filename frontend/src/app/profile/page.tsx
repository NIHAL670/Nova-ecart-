'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2, LogOut, Package, ShieldCheck, Trash2 } from 'lucide-react';
import { RequireAuth } from '@/components/common/RequireAuth';
import { AddressManager } from '@/components/profile/AddressManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/authStore';
import { updateProfile, changePassword, uploadAvatar, removeAvatar } from '@/services/user.service';
import { avatarUrl, resolveMediaUrl } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof updateProfileSchema>;

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type SecurityValues = z.infer<typeof changePasswordSchema>;

function ProfileShell() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', phone: '' },
  });

  const securityForm = useForm<SecurityValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, phone: user.phone ?? '' });
  }, [user, profileForm]);

  if (!user) return null;

  const saveProfile = async (values: ProfileValues) => {
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name: values.name, phone: values.phone || undefined });
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const updated = await removeAvatar();
      setUser(updated);
      toast.success('Avatar removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submitSecurity = async (values: SecurityValues) => {
    setSavingSecurity(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success('Password changed. Please sign in again.');
      await logout();
      router.push('/login');
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">My account</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile, addresses, and security settings.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left — profile card */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={resolveMediaUrl(user.avatar) ?? avatarUrl(user.name)} alt={user.name} />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-primary disabled:opacity-60"
                  aria-label="Upload avatar"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                {user.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="absolute -bottom-1 -left-1 flex h-9 w-9 items-center justify-center rounded-full border bg-background text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:opacity-60"
                    aria-label="Remove avatar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <CardTitle className="mt-2">{user.name}</CardTitle>
                <CardDescription className="mt-0.5">{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <Input placeholder="Your name" disabled={savingProfile} {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <Input type="tel" placeholder="+1 555 000 0000" disabled={savingProfile} {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={savingProfile}>
                    {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/orders">
                  <Package className="mr-2 h-4 w-4" /> My orders
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={async () => { await logout(); router.push('/'); router.refresh(); }}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right — tabs */}
        <div className="min-w-0">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>Track and review your past purchases.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Head over to your order history</p>
                    <p className="text-sm text-muted-foreground">View order status, tracking, and invoices for all your NovaCart purchases.</p>
                    <Button asChild>
                      <Link href="/orders">View all orders</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardContent className="pt-6">
                  <AddressManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Change password
                  </CardTitle>
                  <CardDescription>Use a strong password with at least 8 characters, a letter, and a number.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(submitSecurity)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current password</FormLabel>
                            <Input type="password" autoComplete="current-password" disabled={savingSecurity} {...field} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New password</FormLabel>
                            <Input type="password" autoComplete="new-password" disabled={savingSecurity} {...field} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm new password</FormLabel>
                            <Input type="password" autoComplete="new-password" disabled={savingSecurity} {...field} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Separator />
                      <Button type="submit" disabled={savingSecurity}>
                        {savingSecurity && <Loader2 className="h-4 w-4 animate-spin" />}
                        Update password
                      </Button>
                      <p className="text-xs text-muted-foreground">You will be signed out after changing your password.</p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Appearance and notification preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      Use the sun/moon toggle in the top navigation to switch between light and dark mode. Your choice is remembered on this device.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Order updates and account alerts are sent to your email on file.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileShell />
    </RequireAuth>
  );
}