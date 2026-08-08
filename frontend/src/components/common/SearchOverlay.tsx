'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { useUiStore } from '@/store/uiStore';
import { fetchSuggestions } from '@/services/catalog.service';

/** Full-screen command-palette search with live suggestions. */
export function SearchOverlay() {
  const open = useUiStore((s) => s.isSearchOpen);
  const openSearch = useUiStore((s) => s.openSearch);
  const close = useUiStore((s) => s.closeSearch);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) close();
        else openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, open, openSearch]);

  useEffect(() => {
    if (!debounced.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetchSuggestions(debounced)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 150);
    return () => clearTimeout(timer);
  }, [debounced]);

  const go = (q: string) => {
    close();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  const hot = ['Headphones', 'Smartphones', 'Laptops', 'Sneakers'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-background/80 p-4 pt-[12vh] backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && go(query)}
                placeholder="Search products, brands and more…"
                className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {!query.trim() && (
                <div className="p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> Popular
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hot.map((h) => (
                      <button key={h} onClick={() => go(h)} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <ul>
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        onClick={() => go(s)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!loading && query.trim() && suggestions.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No suggestions. Press Enter to search “{query}”.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}