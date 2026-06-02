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

export interface SellerDashboardStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  pending_orders: number;
  balance_available: number;
  balance_held: number;
  today_orders: number;
  today_revenue: number;
}

export interface SalesChartData {
  period: 'daily' | 'weekly' | 'monthly';
  chart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface SellerPerformance {
  rating_avg: number;
  total_reviews: number;
  response_rate: number;
  avg_response_time_minutes: number;
  order_completion_rate: number;
  total_sold: number;
  repeat_customer_rate: number;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== SERVICE ==============

export const sellerService = {
  // ===== DASHBOARD =====

  /**
   * Get seller dashboard stats
   * GET /api/v1/seller/dashboard
   */
  getDashboardStats: async (): Promise<SellerDashboardStats> => {
    const response = await api.get<BackendResponse<SellerDashboardStats>>('/seller/dashboard');
    return response.data.data;
  },

  /**
   * Get sales chart data
   * GET /api/v1/seller/dashboard/sales-chart
   */
  getSalesChart: async (period: 'daily' | 'weekly' | 'monthly'): Promise<SalesChartData> => {
    const response = await api.get<BackendResponse<SalesChartData>>('/seller/dashboard/sales-chart', {
      params: { period },
    });
    return response.data.data;
  },

  /**
   * Get seller performance data
   * GET /api/v1/seller/dashboard/performance
   */
  getPerformance: async (): Promise<SellerPerformance> => {
    const response = await api.get<BackendResponse<SellerPerformance>>('/seller/dashboard/performance');
    return response.data.data;
  },

  // ===== BOOKS =====

  /**
   * Get all books owned by the seller
   * GET /api/v1/seller/books
   */
  getMyBooks: async (): Promise<SellerBook[]> => {
    const response = await api.get('/seller/books', {
      params: { limit: 100, per_page: 100 }
    });
    // Jika backend mengembalikan pagination (data.data.data), ambil array-nya
    // Jika tidak, ambil data.data langsung
    const responseData = response.data.data;
    if (responseData && !Array.isArray(responseData) && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    return responseData || [];
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
