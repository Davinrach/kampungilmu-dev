import api from '@/lib/api';

export interface RequestOTPResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
    expires_in: number;
    message: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      phone_number: string;
      email?: string;
      name: string;
      role: 'customer' | 'seller' | 'admin';
      status: 'active' | 'inactive';
      profile_photo?: string;
      is_verified: boolean;
    };
    access_token: string;
    refresh_token: string;
    is_new_user: boolean;
  };
}

export interface CompleteProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    phone_number: string;
    email?: string;
    name: string;
    role: string;
    status: string;
    profile_photo?: string;
    is_verified: boolean;
  };
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      phone_number?: string;
      email: string;
      name: string;
      role: 'admin';
      status: 'active' | 'inactive';
      profile_photo?: string;
      is_verified: boolean;
    };
    access_token: string;
    refresh_token: string;
    is_new_user: boolean;
  };
}

export const authService = {
  // Request OTP
  requestOTP: async (phone: string): Promise<RequestOTPResponse> => {
    const response = await api.post('/auth/request-otp', { phone });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (phone: string, code: string): Promise<VerifyOTPResponse> => {
    const response = await api.post('/auth/verify-otp', { phone, code });
    return response.data;
  },

  // Google Login
  googleLogin: async (idToken: string): Promise<VerifyOTPResponse> => {
    const response = await api.post('/auth/google', { id_token: idToken });
    return response.data;
  },

  // Admin Login
  adminLogin: async (email: string, password: string): Promise<AdminLoginResponse> => {
    const response = await api.post('/auth/admin/login', { email, password });
    return response.data;
  },

  // Complete Profile
  completeProfile: async (name: string): Promise<CompleteProfileResponse> => {
    const response = await api.post('/auth/complete-profile', { name });
    return response.data;
  },

  // Get Profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Refresh Token
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  // Request Seller Upgrade
  // Endpoint: POST /api/v1/account/upgrade-seller
  // Body needs URLs (upload files first via /api/v1/upload?folder=ktp)
  requestSellerUpgrade: async (data: {
    shop_name: string;
    shop_description?: string;
    shop_location_desc: string;
    ktp_photo: string; // URL after upload
    shop_photo?: string; // URL after upload
    latitude?: number;
    longitude?: number;
  }) => {
    const response = await api.post('/account/upgrade-seller', data);
    return response.data;
  },
};
