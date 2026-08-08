'use client';

import { useRef, useState, useEffect } from 'react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Horizontal scroll carousel for home sections (featured / hot / etc). */
export function ProductsCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const onResize = () => updateArrows();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [products]);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const w = card ? card.offsetWidth + 20 : 280;
    el.scrollBy({ left: dir * w, behavior: 'smooth' });
  };

  const handleScroll = () => updateArrows();

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-scroll px-1 pb-2"
      >
        {products.map((p, i) => (
          <div key={p._id} data-card className="w-[240px] shrink-0 snap-start sm:w-[260px]">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>

      {canNext && (
        <Button size="icon" variant="secondary" className="absolute -right-3 top-1/2 hidden -translate-y-1/2 sm:flex" onClick={() => scroll(1)} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      {canPrev && (
        <Button size="icon" variant="secondary" className="absolute -left-3 top-1/2 hidden -translate-y-1/2 sm:flex" onClick={() => scroll(-1)} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}