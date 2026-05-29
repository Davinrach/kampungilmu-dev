import { create } from 'zustand';
import { cartService, CartItem, Cart, calculateCartTotal, calculateCartItemCount } from '@/services/cartService';

interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (bookId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  subtotal: 0,
  loading: false,
  error: null,
  initialized: false,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const cart: Cart = await cartService.getCart();
      let items = cart.items || [];
      console.log("[CartStore] Raw cart from backend:", cart);

      // Enrich items with book details if backend doesn't include nested book
      const itemsNeedingBook = items.filter(
        (item) => !item.book && item.book_id
      );

      if (itemsNeedingBook.length > 0) {
        console.log(
          `[CartStore] Enriching ${itemsNeedingBook.length} items with book details`
        );
        const { catalogService } = await import("@/services/catalogService");
        const bookCache: Record<string, any> = {};

        await Promise.all(
          itemsNeedingBook.map(async (item) => {
            try {
              const book = await catalogService.getBook(item.book_id);
              if (book) bookCache[item.book_id] = book;
            } catch (err) {
              console.warn(
                `[CartStore] Failed to fetch book ${item.book_id}:`,
                err
              );
            }
          })
        );

        items = items.map((item) => ({
          ...item,
          book: item.book || bookCache[item.book_id],
          // Use book price if item.price is missing or zero
          price:
            item.price && item.price > 0
              ? item.price
              : bookCache[item.book_id]?.price ?? item.price ?? 0,
        }));
      }

      set({
        items,
        totalItems: cart.total_items ?? calculateCartItemCount(items),
        subtotal: cart.subtotal ?? calculateCartTotal(items),
        loading: false,
        initialized: true,
      });
    } catch (err: any) {
      const isAuthError = err?.response?.status === 401;
      set({
        items: [],
        totalItems: 0,
        subtotal: 0,
        loading: false,
        error: isAuthError ? null : err.response?.data?.message || 'Gagal memuat keranjang',
        initialized: true,
      });
    }
  },

  addItem: async (bookId, quantity) => {
    try {
      await cartService.addToCart({ book_id: bookId, quantity });
      // Refetch to get updated cart with proper item ID
      await get().fetchCart();
    } catch (err: any) {
      throw err;
    }
  },

  updateItem: async (itemId, quantity) => {
    // Optimistic update
    const previousItems = get().items;
    const updatedItems = previousItems.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    set({
      items: updatedItems,
      totalItems: calculateCartItemCount(updatedItems),
      subtotal: calculateCartTotal(updatedItems),
    });

    try {
      await cartService.updateCartItem(itemId, { quantity });
    } catch (err: any) {
      // Revert on failure
      set({
        items: previousItems,
        totalItems: calculateCartItemCount(previousItems),
        subtotal: calculateCartTotal(previousItems),
      });
      throw err;
    }
  },

  removeItem: async (itemId) => {
    // Optimistic update
    const previousItems = get().items;
    const updatedItems = previousItems.filter((item) => item.id !== itemId);
    set({
      items: updatedItems,
      totalItems: calculateCartItemCount(updatedItems),
      subtotal: calculateCartTotal(updatedItems),
    });

    try {
      await cartService.removeCartItem(itemId);
    } catch (err: any) {
      // Revert on failure
      set({
        items: previousItems,
        totalItems: calculateCartItemCount(previousItems),
        subtotal: calculateCartTotal(previousItems),
      });
      throw err;
    }
  },

  clearCart: async () => {
    const items = get().items;
    if (items.length === 0) return;

    try {
      await cartService.clearCart(items);
      set({ items: [], totalItems: 0, subtotal: 0 });
    } catch (err: any) {
      // Refetch to sync state if some items deleted, some not
      await get().fetchCart();
      throw err;
    }
  },

  reset: () => {
    set({
      items: [],
      totalItems: 0,
      subtotal: 0,
      loading: false,
      error: null,
      initialized: false,
    });
  },
}));
