'use client';

import Link from 'next/link';
import { HelpCircle, FileText, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HelpCenterPage() {
  return (
    <div className="container py-16 sm:py-20 max-w-4xl space-y-12">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3 w-3" /> Help Center
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Find guides, tutorials, and support articles, or contact our team directly for customized assistance.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 pt-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" /> Browse Articles
            </CardTitle>
            <CardDescription>Read step-by-step guides on accounts, ordering, and refunds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/faqs" className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground group">
              <span>View Frequently Asked Questions</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/shipping-returns" className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground group">
              <span>Read Shipping & Returns policy</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" /> Contact Support
            </CardTitle>
            <CardDescription>Get custom support from our dedicated customer success agents.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild className="w-full">
              <Link href="/contact">Send a Support Ticket</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
