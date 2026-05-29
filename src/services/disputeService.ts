import api from '@/lib/api';

// ============== TYPES ==============

export type DisputeType = 'damaged' | 'not_as_described' | 'not_received' | 'other';
export type DisputeStatus = 'open' | 'responded' | 'resolved';

export interface Dispute {
  id: string;
  order_id: string;
  order_number?: string;
  customer_id: string;
  customer_name: string;
  seller_id: string;
  seller_name: string;
  type: DisputeType;
  reason: string;
  evidence_photos?: string; // JSON array string
  seller_response?: string;
  seller_evidence?: string; // JSON array string
  status: DisputeStatus;
  decision?: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

export interface CreateDisputePayload {
  order_id: string;
  seller_id: string;
  reason: string;
  type: DisputeType;
  evidence_photos?: string; // JSON array string: "[\"url1\",\"url2\"]"
}

export interface RespondDisputePayload {
  response: string;
  evidence?: string; // JSON array string
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== CONSTANTS ==============

export const DISPUTE_TYPES: { value: DisputeType; label: string; description: string }[] = [
  {
    value: 'damaged',
    label: 'Buku Rusak',
    description: 'Buku yang diterima dalam kondisi rusak (robek, basah, dll)',
  },
  {
    value: 'not_as_described',
    label: 'Tidak Sesuai Deskripsi',
    description: 'Buku tidak sesuai dengan deskripsi atau foto di listing',
  },
  {
    value: 'not_received',
    label: 'Tidak Diterima',
    description: 'Buku tidak sampai atau hilang dalam pengiriman',
  },
  {
    value: 'other',
    label: 'Lainnya',
    description: 'Masalah lain yang tidak termasuk kategori di atas',
  },
];

export const DISPUTE_STATUS_CONFIG: Record<
  DisputeStatus,
  { label: string; color: string; bgColor: string }
> = {
  open: {
    label: 'Menunggu Respon Seller',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  responded: {
    label: 'Menunggu Keputusan Admin',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  resolved: {
    label: 'Selesai',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
};

// ============== SERVICE ==============

export const disputeService = {
  /**
   * Create a new dispute (Customer)
   * POST /api/v1/disputes
   */
  createDispute: async (payload: CreateDisputePayload): Promise<Dispute> => {
    const response = await api.post<BackendResponse<Dispute>>('/disputes', payload);
    return response.data.data;
  },

  /**
   * Get dispute detail
   * GET /api/v1/disputes/:id
   */
  getDispute: async (disputeId: string): Promise<Dispute> => {
    const response = await api.get<BackendResponse<Dispute>>(`/disputes/${disputeId}`);
    return response.data.data;
  },

  /**
   * Get all disputes for current user (Customer)
   * GET /api/v1/disputes
   */
  getMyDisputes: async (): Promise<Dispute[]> => {
    const response = await api.get<BackendResponse<Dispute[]>>('/disputes');
    return response.data.data || [];
  },

  /**
   * Get all disputes for seller
   * GET /api/v1/seller/disputes (or /disputes with seller role)
   */
  getSellerDisputes: async (): Promise<Dispute[]> => {
    const response = await api.get<BackendResponse<Dispute[]>>('/seller/disputes');
    return response.data.data || [];
  },

  /**
   * Respond to a dispute (Seller)
   * POST /api/v1/disputes/:id/respond
   */
  respondToDispute: async (
    disputeId: string,
    payload: RespondDisputePayload
  ): Promise<Dispute> => {
    const response = await api.post<BackendResponse<Dispute>>(
      `/disputes/${disputeId}/respond`,
      payload
    );
    return response.data.data;
  },

  /**
   * Get all disputes (Admin)
   * GET /api/v1/admin/disputes
   */
  getAdminDisputes: async (): Promise<Dispute[]> => {
    const response = await api.get<BackendResponse<Dispute[]>>('/admin/disputes');
    return response.data.data || [];
  },

  /**
   * Resolve a dispute (Admin)
   * POST /api/v1/admin/disputes/:id/resolve
   */
  resolveDispute: async (
    disputeId: string,
    decision: 'refund_full' | 'refund_partial' | 'rejected'
  ): Promise<Dispute> => {
    const response = await api.post<BackendResponse<Dispute>>(
      `/admin/disputes/${disputeId}/resolve`,
      { decision }
    );
    return response.data.data;
  },
};

// ============== HELPERS ==============

export const getDisputeTypeLabel = (type: DisputeType): string => {
  return DISPUTE_TYPES.find((t) => t.value === type)?.label || type;
};

export const getDisputeStatusConfig = (status: DisputeStatus) => {
  return DISPUTE_STATUS_CONFIG[status] || DISPUTE_STATUS_CONFIG.open;
};

export const parseEvidencePhotos = (photosJson?: string): string[] => {
  if (!photosJson) return [];
  try {
    const parsed = JSON.parse(photosJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const formatDisputeDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
