'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/AuthCard';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyEmail, resendOtp } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/api';

const RESEND_SECONDS = 30;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeEmail = useAuthStore((s) => s.user?.email);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const qEmail = searchParams.get('email');

  useEffect(() => {
    if (!email && (qEmail ?? storeEmail)) setEmail(qEmail ?? storeEmail ?? '');
  }, [qEmail, storeEmail, email]);

  useEffect(() => {
    if (resendCount <= 0) return;
    const t = setInterval(() => setResendCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCount]);

  const handleVerify = async (targetEmail: string, code: string) => {
    if (code.length < 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setPending(true);
    try {
      await verifyEmail(targetEmail, code);
      toast.success('Email address verified! You can now sign in.');
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setOtp('');
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    try {
      await resendOtp(email);
      setResendCount(RESEND_SECONDS);
      toast.success('Verification code resent');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3 text-sm">
        <MailCheck className="h-9 w-9 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Verify your email address</p>
          <p className="text-muted-foreground">Enter the 6-digit code sent to your registered email address to activate your account.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="verify-email">Email</Label>
        <Input
          id="verify-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label>Verification code</Label>
        <OtpInput value={otp} onChange={setOtp} disabled={pending} autoFocus />
      </div>

      <Button type="button" className="w-full" size="lg" disabled={pending || otp.length < 6} onClick={() => void handleVerify(email, otp)}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify email'}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        {resendCount > 0 ? (
          <span>Resend code in {resendCount}s</span>
        ) : (
          <Button type="button" variant="link" className="h-auto p-0" onClick={handleResend}>
            Resend code
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Verify your email" subtitle="Activate your NovaCart account">
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}