'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. Free shipping is automatically applied to orders over $100.' },
  { q: 'What is your return policy?', a: 'We offer a 30-day return policy for all unused and unopened items. Simply initiate a return from your profile or contact our support team.' },
  { q: 'Do you offer international shipping?', a: 'Currently, we support shipping across the United States, India, and select European Union countries. You can check shipping availability during checkout.' },
  { q: 'How can I track my order?', a: 'Once your order is shipped, we will send you an email with tracking details. You can also view the live order timeline under "My Orders" in your account.' },
  { q: 'Which payment methods do you accept?', a: 'We support secure card payments processed by Stripe, Razorpay payments (cards, UPI, net banking), and Cash on Delivery (COD).' },
];

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="container py-16 sm:py-20 max-w-3xl space-y-8">
      <div className="space-y-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3 w-3" /> FAQs
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground">
          Quick answers to the most common questions about ordering, shipping, and returns.
        </p>
      </div>

      <div className="space-y-4 pt-6">
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={i} className="rounded-2xl border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between p-5 text-left font-medium hover:bg-muted/30 transition-colors"
              >
                <span>{faq.q}</span>
                {open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {open && (
                <div className="p-5 pt-0 border-t bg-muted/10 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
