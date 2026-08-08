'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/AuthCard';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { resetPassword } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const resetSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type ResetValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetValues) => {
    if (otp.length < 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setPending(true);
    try {
      await resetPassword(values.email, otp, values.newPassword);
      toast.success('Password reset!');
      setDone(true);
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="font-medium">Password updated successfully.</p>
        <Button asChild className="w-full" size="lg">
          <a href="/login">Back to login</a>
        </Button>
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
        <FormItem>
          <FormLabel>Verification code</FormLabel>
          <OtpInput value={otp} onChange={setOtp} disabled={pending} autoFocus={false} />
        </FormItem>
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" disabled={pending} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" disabled={pending} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}
        </Button>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" subtitle="Enter your email, the code we sent, and a new password">
      <ResetPasswordForm />
    </AuthCard>
  );
}