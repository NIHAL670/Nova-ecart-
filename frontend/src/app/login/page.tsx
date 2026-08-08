'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore';
import { getErrorMessage } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [pending, setPending] = useState(false);
  const redirecting = useRef(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && !redirecting.current) {
      redirecting.current = true;
      const redirectUrl = next && next.trim() !== '' ? next : '/';
      router.replace(redirectUrl);
      router.refresh();
    }
  }, [isAuthenticated, next, router]);

  const onSubmit = async (values: LoginValues) => {
    setPending(true);
    try {
      await login(values.email, values.password);
      toast.success('Welcome back!');
      if (!redirecting.current) {
        redirecting.current = true;
        const redirectUrl = next && next.trim() !== '' ? next : '/';
        router.replace(redirectUrl);
        router.refresh();
      }
    } catch (err) {
      const message = getErrorMessage(err);
      // The account exists but the signup OTP was never completed — don't leave
      // the user stuck on a generic error. Send them to the verification page
      // (pre-filled with their email) so they can enter / resend the code.
      if (/verify your email|not verified|email.+verif/i.test(message)) {
        router.replace(`/verify-email?email=${encodeURIComponent(values.email)}&reason=unverified`);
        return;
      }
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input type="email" placeholder="you@example.com" autoComplete="email" disabled={pending} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <Input type="password" placeholder="••••••••" autoComplete="current-password" disabled={pending} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </Form>
  );
}

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your NovaCart account">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}