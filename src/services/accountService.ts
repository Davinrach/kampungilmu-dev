import api from '@/lib/api';
import axios from 'axios';

// ============== INTERFACES ==============

export interface UpdateProfileData {
  name?: string;
  profile_photo?: string; // URL string, NOT File
}

// Address structure - matches backend exactly
export interface Address {
  id: string;
  label: string;              // e.g., "Rumah", "Kantor"
  recipient_name: string;
  phone: string;              // backend uses "phone", not "phone_number"
  full_address: string;       // backend uses "full_address"
  kelurahan: string;
  kecamatan: string;
  city: string;
  postal_code: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressData {
  label: string;
  recipient_name: string;
  phone: string;
  full_address: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  postal_code: string;
  is_default?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    [key: string]: any;
  };
}


export interface SellerProfile {
  id: string;
  shop_name: string;
  shop_description?: string;
  shop_location_desc: string;
  ktp_photo?: string;
  shop_photo?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  average_rating: number;
  total_sold: number;
  created_at?: string;
}

export interface SellerUpgradeData {
  shop_name: string;
  shop_description?: string;
  shop_location_desc: string;
  ktp_photo: string;
  shop_photo?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateSellerProfileData {
  shop_name?: string;
  shop_description?: string;
  shop_location_desc?: string;
  shop_photo?: string;
  latitude?: number;
  longitude?: number;
}

// ============== SERVICE ==============
//
// Backend Endpoints (confirmed by backend developer):
//
//   PROFILE:
//     GET    /api/v1/auth/profile           - Get current user profile
//     PATCH  /api/v1/account/profile        - Update profile (name, profile_photo URL)
//
//   ADDRESS:
//     GET    /api/v1/account/addresses              - List all addresses
//     POST   /api/v1/account/addresses              - Create new address
//     PATCH  /api/v1/account/addresses/:id          - Update address
//     DELETE /api/v1/account/addresses/:id          - Delete address
//     PATCH  /api/v1/account/addresses/:id/set-default - Set as default
//
//   UPLOAD:
//     POST   /api/v1/upload                 - Upload file, returns URL
//
// Note: Profile photo upload is 2-step:
//   1. POST /upload with file → get URL
//   2. PATCH /account/profile with { profile_photo: url }

export const accountService = {
  // ===== UPLOAD =====

  /**
   * Upload a file (image, etc) to the server.
   * Returns the URL that can be used in other endpoints.
   *
   * Endpoint: POST /api/v1/upload?folder=xxx
   * Folders available: books, ktp, reviews, disputes, avatars
   * Max size: 5MB, formats: JPG, PNG, WebP
   */
  uploadFile: async (file: File, folder: 'books' | 'ktp' | 'reviews' | 'disputes' | 'avatars' = 'avatars'): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://kampungilmu-be-production.up.railway.app";
    
    // Debug: Cek URL yang digunakan
    console.log('🔗 Upload URL:', `${BACKEND_URL}/api/v1/upload?folder=${folder}`);
    console.log('📦 Environment:', process.env.NEXT_PUBLIC_BACKEND_URL);
    
    const token = localStorage.getItem('access_token');
    
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/upload?folder=${folder}`, 
      formData, 
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : '',
          'ngrok-skip-browser-warning': 'true'
        },
      }
    );
    
    return response.data;
  },

  // ===== PROFILE =====

  /**
   * Get current authenticated user's profile.
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Update profile.
   * Both fields are optional - only send what you want to change.
   *
   * @param data.name - New name
   * @param data.profile_photo - URL of profile photo (upload first via uploadFile)
   */
  updateProfile: async (data: UpdateProfileData) => {
    const body: Record<string, any> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.profile_photo !== undefined) body.profile_photo = data.profile_photo;

    const response = await api.patch('/account/profile', body);
    return response.data;
  },

  /**
   * Convenience method: Upload photo file + Update profile in one call.
   * This is a 2-step process:
   *   1. Upload file → get URL
   *   2. PATCH profile with the URL
   */
  updateProfileWithPhoto: async (data: {
    name?: string;
    photo_file?: File;
  }) => {
    let photoUrl: string | undefined;

    // Step 1: Upload photo if provided
    if (data.photo_file) {
      const uploadRes = await accountService.uploadFile(data.photo_file);
      photoUrl = uploadRes.data?.url;
    }

    // Step 2: Update profile
    return accountService.updateProfile({
      name: data.name,
      profile_photo: photoUrl,
    });
  },

  // ===== ADDRESS =====

  /**
   * Get all addresses of the authenticated user.
   */
  getAddresses: async () => {
    const response = await api.get('/account/addresses');
    return response.data;
  },

  /**
   * Get single address by ID.
   */
  getAddress: async (id: string) => {
    const response = await api.get(`/account/addresses/${id}`);
    return response.data;
  },

  /**
   * Create a new address.
   *
   * Body format (all fields required except is_default):
   *   {
   *     label: "Rumah",
   *     recipient_name: "John Doe",
   *     phone: "6281234567890",
   *     full_address: "Jl. Merdeka No. 10 RT 01/RW 02",
   *     kelurahan: "Sukamaju",
   *     kecamatan: "Cibeunying",
   *     city: "Bandung",
   *     postal_code: "40123",
   *     is_default: true
   *   }
   */
  createAddress: async (data: CreateAddressData) => {
    const response = await api.post('/account/addresses', data);
    return response.data;
  },

  /**
   * Update existing address (PATCH - partial update).
   */
  updateAddress: async (id: string, data: UpdateAddressData) => {
    const response = await api.patch(`/account/addresses/${id}`, data);
    return response.data;
  },

  /**
   * Delete an address.
   */
  deleteAddress: async (id: string) => {
    const response = await api.delete(`/account/addresses/${id}`);
    return response.data;
  },

  /**
   * Set an address as the default shipping address.
   */
  setDefaultAddress: async (id: string) => {
    const response = await api.patch(`/account/addresses/${id}/set-default`);
    return response.data;
  },



  // ===== BANK ACCOUNTS =====

  /**
   * Get all bank accounts of the authenticated user.
   */
  getBankAccounts: async () => {
    const response = await api.get('/account/bank-accounts');
    return response.data.data || [];
  },

  /**
   * Add a new bank account.
   */
  addBankAccount: async (data: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    is_default?: boolean;
  }) => {
    const response = await api.post('/account/bank-accounts', data);
    return response.data;
  },

  /**
   * Delete a bank account.
   */
  deleteBankAccount: async (id: string) => {
    const response = await api.delete(`/account/bank-accounts/${id}`);
    return response.data;
  },

  // ===== SELLER APPLICATION =====

  /**
   * Request upgrade to seller status.
   * Endpoint: POST /api/v1/account/upgrade-seller
   */
  requestSellerUpgrade: async (data: SellerUpgradeData) => {
    const response = await api.post('/account/upgrade-seller', data);
    return response.data;
  },

  /**
   * Check status of seller application.
   * Endpoint: GET /api/v1/account/seller-profile
   */
  getSellerProfile: async (): Promise<SellerProfile> => {
    const response = await api.get('/account/seller-profile');
    return response.data.data;
  },

  /**
   * Update seller profile
   * Endpoint: PATCH /api/v1/account/seller-profile
   */
  updateSellerProfile: async (data: UpdateSellerProfileData): Promise<SellerProfile> => {
    const response = await api.patch('/account/seller-profile', data);
    return response.data.data;
  },

  // ===== LINK EMAIL/PHONE =====

  /**
   * Link email to account (for users who logged in via phone/OTP)
   * POST /api/v1/account/link-email
   */
  linkEmail: async (email: string) => {
    const response = await api.post('/account/link-email', { email });
    return response.data;
  },

  /**
   * Link phone number to account (for users who logged in via Google)
   * POST /api/v1/account/link-phone
   */
  linkPhone: async (phone: string) => {
    const response = await api.post('/account/link-phone', { phone });
    return response.data;
  },
};
