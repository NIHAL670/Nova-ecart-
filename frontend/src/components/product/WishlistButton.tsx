'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toggleWishlist } from '@/services/wishlist.service';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

/** Heart toggle — requires auth; redirects to login when signed out. */
export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const router = useRouter();
  const isAuthed = useAuthStore((s) => Boolean(s.user));
  const ids = useWishlistStore((s) => s.ids);
  const toggleLocal = useWishlistStore((s) => s.toggle);
  const active = ids.includes(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      toast.info('Please log in to use your wishlist');
      router.push('/login');
      return;
    }
    toggleLocal(productId); // optimistic
    try {
      await toggleWishlist(productId);
    } catch {
      toggleLocal(productId); // revert on failure
      toast.error('Could not update wishlist');
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClick}
            className={cn(active ? 'text-rose-500' : '', className)}
            aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-5 w-5', active && 'fill-current')} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{active ? 'Remove from wishlist' : 'Add to wishlist'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}