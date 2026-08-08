'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, LogIn, PencilLine, Star } from 'lucide-react';
import { createReview, fetchReviews } from '@/services/review.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuthStore } from '@/store/authStore';

interface ReviewFormProps {
  productId: string;
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Please choose a rating').max(5),
  title: z.string().max(80, 'Title is too long').optional().or(z.literal('')),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(1000, 'Comment is too long'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewForm({ productId }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  // Hide the form when the current user has already reviewed this product.
  const existingQuery = useQuery({
    queryKey: queryKeys.reviews(productId, 1),
    queryFn: () => fetchReviews(productId, 1, 'newest'),
    staleTime: 60_000,
  });
  const hasReviewed = existingQuery.data?.items.some((r) => r.user._id === user?._id) ?? false;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, title: '', comment: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      createReview({
        product: productId,
        rating: values.rating,
        title: values.title || undefined,
        comment: values.comment,
      }),
    onSuccess: () => {
      toast.success('Thank you! Your review was submitted.');
      form.reset();
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews(productId) });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/40 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold">Share your experience</p>
          <p className="mt-1 text-sm text-muted-foreground">Log in to write a review for this product.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Log in to review</Link>
        </Button>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm font-medium">You have already reviewed this product.</p>
        <p className="mt-1 text-xs text-muted-foreground">Thanks for sharing your feedback!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <PencilLine className="h-4 w-4 text-primary" />
        <h4 className="font-semibold">Write a review</h4>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your rating</FormLabel>
                <RadioGroup
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                  className="flex items-center gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex items-center">
                      <RadioGroupItem value={String(value)} id={`rating-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`rating-${value}`}
                        className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-accent"
                      >
                        <Star
                          className={cn(
                            'h-7 w-7',
                            value <= field.value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                          )}
                        />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="review-title">Title <span className="text-muted-foreground">(optional)</span></FormLabel>
                <Input id="review-title" placeholder="Sum it up in one line" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="review-comment">Comment</FormLabel>
                <Textarea id="review-comment" rows={4} placeholder="What did you like or dislike?" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit review
          </Button>
        </form>
      </Form>
    </div>
  );
}
