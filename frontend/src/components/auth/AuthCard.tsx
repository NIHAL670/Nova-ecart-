'use client';

import * as React from 'react';
import { Logo } from '@/components/common/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

/** Centered frosted-glass auth wrapper (logo + title + subtitle + children). */
export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className={cn('flex min-h-[70vh] items-center justify-center px-4 py-12', className)}>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="glass-strong shadow-raised">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl font-bold tracking-tight">{title}</CardTitle>
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
