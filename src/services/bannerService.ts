import api from '@/lib/api';

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  order_index?: number;
  created_at: string;
  updated_at?: string;
}

export const bannerService = {
  /**
   * Get active banners for public homepage/books page
   * GET /api/v1/banners
   */
  getPublicBanners: async (): Promise<Banner[]> => {
    const response = await api.get('/banners');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.banners)) return data.banners;
    return [];
  },

  /**
   * Get all banners for admin (including inactive)
   * GET /api/v1/admin/banners
   */
  getAdminBanners: async (): Promise<Banner[]> => {
    const response = await api.get('/admin/banners');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.banners)) return data.banners;
    return [];
  },

  /**
   * Get detail banner
   * GET /api/v1/admin/banners/:id
   */
  getBanner: async (id: string): Promise<Banner> => {
    const response = await api.get(`/admin/banners/${id}`);
    return response.data.data;
  },

  /**
   * Create new banner
   * POST /api/v1/admin/banners
   */
  createBanner: async (data: Partial<Banner>): Promise<Banner> => {
    const response = await api.post('/admin/banners', data);
    return response.data.data;
  },

  /**
   * Update banner
   * PATCH /api/v1/admin/banners/:id
   */
  updateBanner: async (id: string, data: Partial<Banner>): Promise<Banner> => {
    const response = await api.patch(`/admin/banners/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete banner
   * DELETE /api/v1/admin/banners/:id
   */
  deleteBanner: async (id: string): Promise<void> => {
    await api.delete(`/admin/banners/${id}`);
  },
};
