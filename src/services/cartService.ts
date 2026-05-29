import api from '@/lib/api';
import type { Book, BookCategory, BookPhoto } from './catalogService';

// ============== TYPES ==============

export interface CartItem {
  id: string;
  cart_id?: string;
  book_id: string;
  book?: Book;
  quantity: number;
  price: number; // snapshot price at time of add
  subtotal?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cart {
  id?: string;
  user_id?: string;
  items: CartItem[];
  total_items?: number;
  subtotal?: number;
  total?: number;
}

export interface AddToCartData {
  book_id: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== SERVICE ==============
//
// Backend Endpoints (verified via API probe):
//   GET    /api/v1/cart        - Get user's cart (auth required)
//   POST   /api/v1/cart        - Add book to cart (auth required)
//   PATCH  /api/v1/cart/:id    - Update cart item quantity (auth required)
//   DELETE /api/v1/cart/:id    - Remove item from cart (auth required)
//

export const cartService = {
  /**
   * Get current user's cart with all items.
   */
  getCart: async (): Promise<Cart> => {
    const response = await api.get<BackendResponse<any>>('/cart');
    const data = response.data?.data ?? response.data;

    console.log("[CartService] Raw GET /cart response:", response.data);

    // Possible response shapes:
    //   { data: { items: [...], total_items, subtotal } }
    //   { data: [...] }  (array of items directly)
    //   { data: { cart_items: [...] } }
    //   { data: { id, user_id, items: [...] } }

    if (Array.isArray(data)) {
      return { items: data };
    }

    const items =
      data?.items ||
      data?.cart_items ||
      data?.cartItems ||
      [];

    return {
      ...data,
      items,
    };
  },

  /**
   * Add book to cart.
   * If book already exists, backend should increment quantity.
   */
  addToCart: async (data: AddToCartData): Promise<CartItem> => {
    const response = await api.post<BackendResponse<CartItem>>('/cart', data);
    return response.data.data;
  },

  /**
   * Update cart item quantity.
   */
  updateCartItem: async (
    itemId: string,
    data: UpdateCartItemData
  ): Promise<CartItem> => {
    const response = await api.patch<BackendResponse<CartItem>>(
      `/cart/${itemId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove item from cart.
   */
  removeCartItem: async (itemId: string): Promise<void> => {
    await api.delete(`/cart/${itemId}`);
  },

  /**
   * Clear all items from cart by removing them one by one.
   * (Backend doesn't have a "clear all" endpoint).
   */
  clearCart: async (items: CartItem[]): Promise<void> => {
    await Promise.all(items.map((item) => cartService.removeCartItem(item.id)));
  },
};

// ============== UI HELPERS ==============

export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const price = item.book?.price ?? item.price ?? 0;
    return total + price * item.quantity;
  }, 0);
};

export const calculateCartItemCount = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};
