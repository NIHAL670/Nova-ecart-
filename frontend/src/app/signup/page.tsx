'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/AuthCard';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { register as registerUser, verifyEmail, resendOtp } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    countryCode: z.string().min(1, 'Required'),
    phone: z.string().regex(/^\d{10}$/, 'number not correct'),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type SignupValues = z.infer<typeof signupSchema>;

const RESEND_SECONDS = 30;

function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [pending, setPending] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', countryCode: '+91', phone: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (resendCount <= 0) return;
    const t = setInterval(() => setResendCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCount]);

  const onSubmit = async (values: SignupValues) => {
    setPending(true);
    try {
      const res = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        countryCode: values.countryCode,
      });
      if (res.requiresOtp) {
        setOtpEmail(values.email);
        setStep('otp');
        setResendCount(RESEND_SECONDS);
        toast.info('We sent a verification code to your email address');
      } else {
        toast.success('Account created! You can now sign in.');
        router.push('/login');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const handleVerify = async (code: string) => {
    setVerifying(true);
    try {
      await verifyEmail(otpEmail, code);
      toast.success('Email verified!');
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(otpEmail);
      setResendCount(RESEND_SECONDS);
      toast.success('Verification code resent');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (step === 'otp') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3 text-sm">
          <MailCheck className="h-9 w-9 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Verify your email address</p>
            <p className="text-muted-foreground">
              We sent a 6-digit code to your registered email address
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <OtpInput value={otp} onChange={setOtp} onComplete={handleVerify} disabled={verifying} autoFocus />
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            {resendCount > 0 ? (
              <span>Resend code in {resendCount}s</span>
            ) : (
              <Button type="button" variant="link" className="h-auto p-0" onClick={handleResend}>
                Resend code
              </Button>
            )}
          </div>
          <Button type="button" className="w-full" size="lg" disabled={verifying || otp.length < 6} onClick={() => void handleVerify(otp)}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify code'}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => setStep('form')}>
            Back to sign up
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <Input placeholder="Jane Doe" autoComplete="name" disabled={pending} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div className="space-y-2">
          <FormLabel>Phone number</FormLabel>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem className="w-28">
                  <select
                    {...field}
                    disabled={pending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="+91">India (+91)</option>
                    <option value="+1">US/CA (+1)</option>
                    <option value="+44">UK (+44)</option>
                    <option value="+61">AU (+61)</option>
                    <option value="+971">UAE (+971)</option>
                    <option value="+966">KSA (+966)</option>
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Input
                    type="tel"
                    placeholder="10-digit number"
                    maxLength={10}
                    disabled={pending}
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
              <FormLabel>Confirm password</FormLabel>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" disabled={pending} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}

export default function SignupPage() {
  return (
    <AuthCard title="Create your account" subtitle="Join NovaCart — it only takes a minute">
      <SignupForm />
    </AuthCard>
  );
}