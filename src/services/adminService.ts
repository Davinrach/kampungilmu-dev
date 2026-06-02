import api from '@/lib/api';

// ============== TYPES ==============

export interface AdminDashboardStats {
  total_users: number;
  total_sellers: number;
  total_books: number;
  total_orders: number;
  total_revenue: number;
  pending_sellers: number;
  open_disputes: number;
  pending_withdrawals: number;
}

export interface PendingSeller {
  user_id: string;
  user_name: string;
  phone: string;
  shop_name: string;
  shop_description: string;
  shop_location_desc: string;
  ktp_photo: string;
  shop_photo?: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  seller_name: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  reason?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface AdminTransaction {
  id: string;
  order_number: string;
  customer_name: string;
  seller_name: string;
  grand_total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface AdminReport {
  period: 'daily' | 'weekly' | 'monthly';
  total_revenue: number;
  total_orders: number;
  total_new_users: number;
  total_new_sellers: number;
  top_categories: { name: string; total_sold: number }[];
  top_sellers: { shop_name: string; total_revenue: number }[];
}

// ============== SERVICE ==============

export const adminService = {
  /**
   * Get admin dashboard statistics
   * GET /api/v1/admin/dashboard
   */
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  /**
   * Get all transactions for monitoring
   * GET /api/v1/admin/transactions
   */
  getTransactions: async (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<AdminTransactionsResponse> => {
    const response = await api.get('/admin/transactions', { params });
    return response.data.data;
  },

  /**
   * Get system report based on period
   * GET /api/v1/admin/reports
   */
  getReports: async (period: 'daily' | 'weekly' | 'monthly'): Promise<AdminReport> => {
    const response = await api.get('/admin/reports', { params: { period } });
    return response.data.data;
  },

  /**
   * Get all users
   * GET /api/v1/admin/users
   */
  getUsers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/admin/users');
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.users)) return data.users;
        const arrayValues = Object.values(data).filter(Array.isArray);
        if (arrayValues.length > 0) return arrayValues[0] as any[];
      }
      return [];
    } catch (error) {
      console.error('[AdminService] Error fetching all users:', error);
      throw error;
    }
  },

  // ===== SELLER MANAGEMENT =====

  /**
   * Get all sellers
   * GET /api/v1/admin/sellers
   */
  getAllSellers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/admin/sellers');
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.sellers)) return data.sellers;
        const arrayValues = Object.values(data).filter(Array.isArray);
        if (arrayValues.length > 0) return arrayValues[0] as any[];
      }
      return [];
    } catch (error) {
      console.error('[AdminService] Error fetching all sellers:', error);
      throw error;
    }
  },

  /**
   * Get list of pending seller applications
   * GET /api/v1/admin/sellers/pending
   */
  getPendingSellers: async (): Promise<PendingSeller[]> => {
    try {
      const response = await api.get('/admin/sellers/pending');
      console.log("[DEBUG] API Response for pending sellers:", response.data);
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.sellers)) return data.sellers;
        const arrayValues = Object.values(data).filter(Array.isArray);
        if (arrayValues.length > 0) return arrayValues[0];
      }
      return [];
    } catch (error) {
      console.error("[DEBUG] API Error for pending sellers:", error);
      throw error;
    }
  },

  /**
   * Approve a seller application
   * POST /api/v1/admin/sellers/:userId/approve
   */
  approveSeller: async (userId: string): Promise<void> => {
    await api.post(`/admin/sellers/${userId}/approve`);
  },

  /**
   * Reject a seller application
   * POST /api/v1/admin/sellers/:userId/reject
   */
  rejectSeller: async (userId: string, reason: string): Promise<void> => {
    await api.post(`/admin/sellers/${userId}/reject`, { reason });
  },

  // ===== WITHDRAWAL MANAGEMENT =====

  /**
   * Get list of pending withdrawals
   * GET /api/v1/admin/withdrawals
   */
  getWithdrawals: async (): Promise<Withdrawal[]> => {
    const response = await api.get('/admin/withdrawals');
    return response.data.data || [];
  },

  /**
   * Approve a withdrawal request
   * POST /api/v1/admin/withdrawals/:id/approve
   */
  approveWithdrawal: async (id: string): Promise<void> => {
    await api.post(`/admin/withdrawals/${id}/approve`);
  },

  /**
   * Reject a withdrawal request
   * POST /api/v1/admin/withdrawals/:id/reject
   */
  rejectWithdrawal: async (id: string, reason: string): Promise<void> => {
    await api.post(`/admin/withdrawals/${id}/reject`, { reason });
  },

  // ===== CATEGORY MANAGEMENT =====

  /**
   * Create a new category
   * POST /api/v1/admin/categories
   */
  createCategory: async (data: {
    name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Category> => {
    const response = await api.post('/admin/categories', data);
    return response.data.data;
  },

  /**
   * Update a category
   * PATCH /api/v1/admin/categories/:id
   */
  updateCategory: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<Category> => {
    const response = await api.patch(`/admin/categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a category
   * DELETE /api/v1/admin/categories/:id
   */
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/admin/categories/${id}`);
  },
};

// ============== HELPERS ==============

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
