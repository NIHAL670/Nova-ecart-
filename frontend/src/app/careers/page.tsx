'use client';

import { Briefcase, ArrowUpRight, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const JOBS = [
  { title: 'Frontend Software Engineer', dept: 'Engineering', loc: 'Remote (US/India)', type: 'Full-time' },
  { title: 'Backend Node.js Architect', dept: 'Engineering', loc: 'Remote', type: 'Full-time' },
  { title: 'Digital Marketing Lead', dept: 'Growth', loc: 'Hybrid (New York)', type: 'Full-time' },
  { title: 'Customer Experience Specialist', dept: 'Operations', loc: 'Remote', type: 'Full-time' },
];

export default function CareersPage() {
  return (
    <div className="container py-16 sm:py-20 max-w-4xl space-y-12">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Briefcase className="h-3 w-3" /> Careers at Nova Cart
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Build the Future of Commerce
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Join our distributed, fast-paced team and help us design and implement the next generation e-commerce platform.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 pt-6">
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Zap className="h-8 w-8 text-primary" />
          <h3 className="font-semibold text-lg">Fast-Paced growth</h3>
          <p className="text-sm text-muted-foreground">We value speed, quick feedback cycles, and shipping high-quality code continuously.</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Target className="h-8 w-8 text-primary" />
          <h3 className="font-semibold text-lg">Impact Driven</h3>
          <p className="text-sm text-muted-foreground">Every line of code you write directly impacts the shopping experience of thousands of users.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Open Positions</h2>
        <div className="divide-y rounded-2xl border bg-card overflow-hidden">
          {JOBS.map((job) => (
            <div key={job.title} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 hover:bg-muted/30 transition-colors">
              <div>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">{job.dept}</span>
                <h3 className="font-semibold text-lg mt-0.5">{job.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{job.loc} · {job.type}</p>
              </div>
              <Button variant="outline" size="sm" className="group">
                Apply now <ArrowUpRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
