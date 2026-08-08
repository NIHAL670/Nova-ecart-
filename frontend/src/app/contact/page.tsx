'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Your message has been sent successfully. We will get back to you soon!');
      (e.target as HTMLFormElement).reset();
    }, 1200);
  };

  return (
    <div className="container py-16 sm:py-20 max-w-5xl space-y-12">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Mail className="h-3 w-3" /> Contact Us
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Get in Touch
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Have a question about an order, shipment, or product details? Drop us a message, and our support team will help you.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-[1fr_1.5fr] pt-6">
        {/* Left — contact cards */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 flex gap-4">
            <Mail className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-base">Email Support</h3>
              <p className="text-sm text-muted-foreground mt-0.5">support@novacart.com</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 flex gap-4">
            <Phone className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-base">Phone Line</h3>
              <p className="text-sm text-muted-foreground mt-0.5">+1 (555) 019-2834</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 flex gap-4">
            <MapPin className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-base">Headquarters</h3>
              <p className="text-sm text-muted-foreground mt-0.5">100 E-Commerce Way, Ste 500<br />San Francisco, CA 94107</p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required placeholder="name@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required placeholder="Order inquiry, partnership, etc." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required rows={5} placeholder="Type your message details here..." className="resize-none" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
