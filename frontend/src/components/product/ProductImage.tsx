import Image from 'next/image';
import { cn, resolveMediaUrl } from '@/lib/utils';

interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/** Consistent product thumbnail with graceful fallback. */
export function ProductImage({ src, alt, priority, className, sizes = '(max-width: 768px) 100vw, 25vw' }: ProductImageProps) {
  const resolvedSrc = resolveMediaUrl(src);
  return (
    <div className={cn('relative aspect-square overflow-hidden bg-muted', className)}>
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
      )}
    </div>
  );
}