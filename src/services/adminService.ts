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

  // ===== SELLER MANAGEMENT =====

  /**
   * Get list of pending seller applications
   * GET /api/v1/admin/sellers/pending
   */
  getPendingSellers: async (): Promise<PendingSeller[]> => {
    const response = await api.get('/admin/sellers/pending');
    return response.data.data || [];
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
