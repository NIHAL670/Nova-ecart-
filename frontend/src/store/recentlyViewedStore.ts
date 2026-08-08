import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/types';
import { storageKeys } from '@/constants';

interface RecentlyViewedState {
  items: Product[];
  add: (product: Product) => void;
  clear: () => void;
}

const MAX = 12;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => ({
          items: [product, ...state.items.filter((p) => p._id !== product._id)].slice(0, MAX),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: storageKeys.recentlyViewed,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);