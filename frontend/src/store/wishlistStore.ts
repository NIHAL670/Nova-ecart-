import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageKeys } from '@/constants';

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => void;
  setIds: (ids: string[]) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),
      setIds: (ids) => set({ ids }),
      remove: (productId) => set((state) => ({ ids: state.ids.filter((id) => id !== productId) })),
      clear: () => set({ ids: [] }),
      has: (productId) => get().ids.includes(productId),
    }),
    {
      name: storageKeys.wishlist,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);