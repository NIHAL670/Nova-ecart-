'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { forgotPassword } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotValues = z.infer<typeof forgotSchema>;

function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotValues) => {
    setPending(true);
    try {
      await forgotPassword(values.email);
      setSentTo(values.email);
      toast.success('Password reset link sent');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3 text-sm">
          <MailCheck className="h-9 w-9 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Check your inbox</p>
            <p className="text-muted-foreground">
              We emailed a reset code to <span className="font-medium text-foreground">{sentTo}</span>
            </p>
          </div>
        </div>

        <Button asChild className="w-full" size="lg">
          <Link href="/reset-password">Continue to reset password</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => setSentTo(null)}>
            Use a different email
          </button>
        </p>
      </div>
    );
  }

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
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset code'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </Form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We&apos;ll email you a code to set a new password">
      <ForgotPasswordForm />
    </AuthCard>
  );
}