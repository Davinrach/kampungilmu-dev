import api from '@/lib/api';

// ============== TYPES ==============

export interface SellerBook {
  id: string;
  title: string;
  author: string;
  price: number;
  stock: number;
  book_type: 'new' | 'used';
  condition_grade?: string;
  cover_photo?: string;
  is_active: boolean;
  total_sold: number;
}

export interface SellerBookDetail {
  id: string;
  category_id: string;
  title: string;
  author: string;
  publisher?: string;
  year_published?: number;
  isbn?: string;
  description?: string;
  price: number;
  stock: number;
  book_type: 'new' | 'used';
  condition_grade?: string;
  is_active: boolean;
  total_sold: number;
  photos: {
    id: string;
    photo_url: string;
    position: number;
  }[];
}

export interface CreateBookPayload {
  category_id: string;
  title: string;
  author: string;
  publisher?: string;
  year_published?: number;
  isbn?: string;
  description?: string;
  price: number;
  stock: number;
  book_type: 'new' | 'used';
  condition_grade?: string;
  photo_urls: string[];
}

export interface UpdateBookPayload {
  category_id?: string;
  title?: string;
  author?: string;
  publisher?: string;
  year_published?: number;
  isbn?: string;
  description?: string;
  price?: number;
  stock?: number;
  book_type?: 'new' | 'used';
  condition_grade?: string;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== SERVICE ==============

export const sellerService = {
  /**
   * Get all books owned by the seller
   * GET /api/v1/seller/books
   */
  getMyBooks: async (): Promise<SellerBook[]> => {
    const response = await api.get<BackendResponse<SellerBook[]>>('/seller/books');
    return response.data.data;
  },

  /**
   * Get single book detail for editing
   * GET /api/v1/books/:id (public endpoint, but we use it for edit)
   */
  getBookDetail: async (bookId: string): Promise<SellerBookDetail | null> => {
    try {
      const response = await api.get<BackendResponse<SellerBookDetail>>(`/books/${bookId}`);
      return response.data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  /**
   * Create a new book
   * POST /api/v1/seller/books
   */
  createBook: async (payload: CreateBookPayload): Promise<SellerBookDetail> => {
    const response = await api.post<BackendResponse<SellerBookDetail>>('/seller/books', payload);
    return response.data.data;
  },

  /**
   * Update book details
   * PATCH /api/v1/seller/books/:id
   */
  updateBook: async (bookId: string, payload: UpdateBookPayload): Promise<SellerBookDetail> => {
    const response = await api.patch<BackendResponse<SellerBookDetail>>(`/seller/books/${bookId}`, payload);
    return response.data.data;
  },

  /**
   * Update book photos
   * PATCH /api/v1/seller/books/:id/photos
   */
  updateBookPhotos: async (bookId: string, photoUrls: string[]): Promise<void> => {
    await api.patch(`/seller/books/${bookId}/photos`, { photo_urls: photoUrls });
  },

  /**
   * Toggle book active status
   * PATCH /api/v1/seller/books/:id/toggle
   */
  toggleBookStatus: async (bookId: string): Promise<void> => {
    await api.patch(`/seller/books/${bookId}/toggle`);
  },

  /**
   * Update book stock
   * PATCH /api/v1/seller/books/:id/stock
   */
  updateStock: async (bookId: string, stock: number): Promise<void> => {
    await api.patch(`/seller/books/${bookId}/stock`, { stock });
  },

  /**
   * Delete a book
   * DELETE /api/v1/seller/books/:id
   */
  deleteBook: async (bookId: string): Promise<void> => {
    await api.delete(`/seller/books/${bookId}`);
  },
};
