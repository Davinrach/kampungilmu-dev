import api from '@/lib/api';
import type { Book } from './catalogService';
import type { Address } from './accountService';

// ============== TYPES (Match Backend Docs Exactly) ==============

// Backend: 'delivery' (kirim via kurir) | 'local_pickup' (ambil di tempat)
export type FulfillmentMethod = 'delivery' | 'local_pickup';

// ============== Courier Option (for UI) ==============

export interface CourierOption {
  id: string; // unique identifier for UI (courier_code + service_code)
  name: string; // courier name (e.g. "JNE")
  service: string; // service name (e.g. "Reguler")
  courier_code: string; // code for checkout (e.g. "jne")
  service_code: string; // service code for checkout (e.g. "reg")
  cost: number; // price in Rupiah
  estimated_days: string; // e.g. "1-2 days"
  description?: string;
}

// Order status from backend docs
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'verified_pickup'
  | 'completed'
  | 'cancelled';

// Payment method (Midtrans)
export type PaymentMethod =
  | 'bank_transfer'
  | 'gopay'
  | 'shopeepay'
  | 'qris'
  | 'credit_card'
  | string;

// Payment channel (specific bank/wallet inside method)
export type PaymentChannel =
  | 'bca'
  | 'bni'
  | 'bri'
  | 'mandiri'
  | 'permata'
  | string;

// ============== Item ==============

export interface OrderItem {
  id: string;
  book_id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  subtotal: number;
  cover_photo: string;
  // Optional - from book enrichment
  book?: Book;
}

// ============== Sub-objects ==============

export interface OrderPayment {
  method: string;
  channel?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  payment_url?: string;
  expired_at?: string;
  paid_at?: string;
}

export interface OrderShipping {
  courier_name?: string;
  courier_service?: string;
  tracking_number?: string;
  biteship_order_id?: string;
  status?: string;
}

export interface OrderAddress {
  recipient_name: string;
  phone: string;
  full_address: string;
  city: string;
  postal_code: string;
}

export interface OrderUser {
  id: string;
  name: string;
}

export interface OrderSeller {
  id: string;
  shop_name: string;
}

// ============== Main Order ==============

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  fulfillment_method: FulfillmentMethod;
  pickup_code?: string;
  subtotal_amount: number;
  shipping_cost: number;
  total_amount: number;
  note?: string;
  items: OrderItem[];
  seller_name?: string;
  created_at: string;

  // Detail-only fields (returned by GET /orders/:id)
  payment?: OrderPayment;
  shipping?: OrderShipping;
  address?: OrderAddress;
  buyer?: OrderUser;
  seller?: OrderSeller;
}

// ============== Checkout Payload (Match Backend Exactly) ==============

export interface CheckoutPayload {
  cart_item_ids: string[];
  address_id?: string; // required if delivery
  fulfillment_method: FulfillmentMethod;
  courier_name?: string; // required if delivery (e.g. 'jne')
  courier_service?: string; // required if delivery (e.g. 'reg')
  shipping_cost?: number; // required if delivery
  payment_method: string; // 'bank_transfer', 'gopay', etc.
  payment_channel?: string; // 'bca', 'bni', etc. (for bank_transfer)
  note?: string;
}

// ============== Checkout Response ==============

export interface CheckoutResponse {
  order: Order;
  payment: OrderPayment;
  snap_token?: string; // Midtrans Snap token
  payment_url?: string; // Fallback payment URL
}

// ============== Shipping Rates ==============

export interface ShippingRateRequest {
  origin_postal_code: string;
  destination_postal_code: string;
  weight: number; // in grams
  item_value: number; // in Rupiah
}

export interface ShippingRate {
  courier_name: string;
  courier_service_name: string;
  courier_code: string; // use this in checkout courier_name
  courier_service_code: string; // use this in checkout courier_service
  price: number;
  duration: string;
}

// ============== Backend Response ==============

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}

// ============== Payment Method Options (UI) ==============

export interface PaymentMethodOption {
  method: string; // value for payment_method
  channel?: string; // value for payment_channel
  name: string;
  category: 'va' | 'ewallet' | 'qris' | 'card';
  description?: string;
  icon?: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  // Virtual Account (bank_transfer + channel)
  {
    method: 'bank_transfer',
    channel: 'bca',
    name: 'BCA Virtual Account',
    category: 'va',
    description: 'Transfer dari ATM/m-Banking BCA',
    icon: '🏦',
  },
  {
    method: 'bank_transfer',
    channel: 'mandiri',
    name: 'Mandiri Virtual Account',
    category: 'va',
    description: 'Transfer dari ATM/m-Banking Mandiri',
    icon: '🏦',
  },
  {
    method: 'bank_transfer',
    channel: 'bni',
    name: 'BNI Virtual Account',
    category: 'va',
    description: 'Transfer dari ATM/m-Banking BNI',
    icon: '🏦',
  },
  {
    method: 'bank_transfer',
    channel: 'bri',
    name: 'BRI Virtual Account',
    category: 'va',
    description: 'Transfer dari ATM/m-Banking BRI',
    icon: '🏦',
  },
  {
    method: 'bank_transfer',
    channel: 'permata',
    name: 'Permata Virtual Account',
    category: 'va',
    description: 'Transfer dari ATM/m-Banking Permata',
    icon: '🏦',
  },
  // E-Wallet
  {
    method: 'gopay',
    name: 'GoPay',
    category: 'ewallet',
    description: 'Bayar dengan saldo GoPay',
    icon: '💚',
  },
  {
    method: 'shopeepay',
    name: 'ShopeePay',
    category: 'ewallet',
    description: 'Bayar dengan saldo ShopeePay',
    icon: '🧡',
  },
  // QRIS
  {
    method: 'qris',
    name: 'QRIS',
    category: 'qris',
    description: 'Scan QR dari aplikasi pembayaran apapun',
    icon: '🔍',
  },
  // Credit Card
  {
    method: 'credit_card',
    name: 'Kartu Kredit/Debit',
    category: 'card',
    description: 'Visa, Mastercard, JCB',
    icon: '💳',
  },
];

// ============== Midtrans Payment Methods (Simplified for UI) ==============

export interface MidtransPaymentOption {
  code: string; // payment_method value
  channel?: string; // payment_channel value (for bank_transfer)
  name: string;
  description: string;
  icon: string;
}

export const MIDTRANS_PAYMENT_METHODS: MidtransPaymentOption[] = [
  {
    code: 'bank_transfer',
    channel: 'bca',
    name: 'BCA Virtual Account',
    description: 'Transfer via ATM/m-Banking BCA',
    icon: '🏦',
  },
  {
    code: 'bank_transfer',
    channel: 'bni',
    name: 'BNI Virtual Account',
    description: 'Transfer via ATM/m-Banking BNI',
    icon: '🏦',
  },
  {
    code: 'bank_transfer',
    channel: 'bri',
    name: 'BRI Virtual Account',
    description: 'Transfer via ATM/m-Banking BRI',
    icon: '🏦',
  },
  {
    code: 'bank_transfer',
    channel: 'mandiri',
    name: 'Mandiri Virtual Account',
    description: 'Transfer via ATM/m-Banking Mandiri',
    icon: '🏦',
  },
  {
    code: 'gopay',
    name: 'GoPay',
    description: 'Bayar dengan saldo GoPay',
    icon: '💚',
  },
  {
    code: 'shopeepay',
    name: 'ShopeePay',
    description: 'Bayar dengan saldo ShopeePay',
    icon: '🧡',
  },
  {
    code: 'qris',
    name: 'QRIS',
    description: 'Scan QR dari aplikasi apapun',
    icon: '📱',
  },
];

// ============== SERVICE ==============
//
// All endpoints match backend docs exactly.
// See: API_DOCUMENTATION.md
//

export const orderService = {
  /**
   * POST /api/v1/checkout
   * Create order from cart items, returns order + payment details.
   */
  checkout: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    const response = await api.post<BackendResponse<CheckoutResponse>>('/checkout', payload);
    return response.data.data;
  },

  /**
   * Get courier options for shipping.
   * Uses POST /api/v1/shipping/rates internally.
   * 
   * @param destinationPostalCode - Buyer's postal code (must be 5 digits)
   * @param originPostalCode - Seller's postal code (must be 5 digits)
   * @param totalWeight - Total weight in grams
   * @param totalValue - Total value in Rupiah
   */
  getCourierOptions: async (
    destinationPostalCode: string,
    originPostalCode: string,
    totalWeight: number,
    totalValue: number
  ): Promise<CourierOption[]> => {
    // Validate postal codes before making request
    const cleanDestination = (destinationPostalCode || '').trim();
    const cleanOrigin = (originPostalCode || '').trim();

    console.log('[OrderService] Getting courier options:', {
      destinationPostalCode: cleanDestination,
      originPostalCode: cleanOrigin,
      totalWeight,
      totalValue,
    });

    // Validate postal codes (must be 5 digits)
    const postalCodeRegex = /^\d{5}$/;
    
    if (!postalCodeRegex.test(cleanDestination)) {
      console.error('[OrderService] Invalid destination postal code:', cleanDestination);
      throw new Error(`Kode pos tujuan tidak valid: "${cleanDestination}". Harus 5 digit angka.`);
    }

    if (!postalCodeRegex.test(cleanOrigin)) {
      console.error('[OrderService] Invalid origin postal code:', cleanOrigin);
      throw new Error(`Kode pos asal tidak valid: "${cleanOrigin}". Harus 5 digit angka.`);
    }

    // Validate weight and value
    if (!totalWeight || totalWeight <= 0) {
      console.error('[OrderService] Invalid weight:', totalWeight);
      throw new Error('Berat barang tidak valid');
    }

    if (!totalValue || totalValue <= 0) {
      console.error('[OrderService] Invalid item value:', totalValue);
      throw new Error('Nilai barang tidak valid');
    }

    try {
      const rates = await orderService.getShippingRates({
        origin_postal_code: cleanOrigin,
        destination_postal_code: cleanDestination,
        weight: totalWeight,
        item_value: totalValue,
      });

      console.log('[OrderService] Shipping rates response:', rates);

      if (!rates || rates.length === 0) {
        console.warn('[OrderService] No shipping rates returned from backend');
        return [];
      }

      return rates.map((rate) => ({
        id: `${rate.courier_code}-${rate.courier_service_code}`,
        name: rate.courier_name,
        service: rate.courier_service_name,
        courier_code: rate.courier_code,
        service_code: rate.courier_service_code,
        cost: rate.price,
        estimated_days: rate.duration,
        description: `${rate.courier_name} ${rate.courier_service_name}`,
      }));
    } catch (err: any) {
      console.error('[OrderService] Failed to get courier options:', err);
      console.error('[OrderService] Error response:', err.response?.data);
      console.error('[OrderService] Error status:', err.response?.status);
      throw err;
    }
  },

  /**
   * GET /api/v1/orders
   * List user's orders.
   */
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<BackendListResponse<Order>>('/orders');
    return response.data.data || [];
  },

  /**
   * GET /api/v1/orders/:id
   * Get order detail with full info (payment, shipping, address, etc).
   */
  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<BackendResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  /**
   * POST /api/v1/orders/:id/cancel
   * Customer cancels order (only allowed before payment).
   */
  cancelOrder: async (id: string): Promise<Order> => {
    const response = await api.post<BackendResponse<Order>>(
      `/orders/${id}/cancel`,
      {}
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/orders/:id/received
   * Customer confirms receipt of package (releases funds to seller).
   */
  confirmReceipt: async (id: string): Promise<Order> => {
    const response = await api.post<BackendResponse<Order>>(
      `/orders/${id}/received`,
      {}
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/orders/:id/confirm
   * Seller confirms order is ready to process.
   */
  sellerConfirmOrder: async (id: string): Promise<Order> => {
    const response = await api.post<BackendResponse<Order>>(
      `/orders/${id}/confirm`,
      {}
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/orders/:id/verify-pickup
   * Seller verifies pickup code from customer (O2O).
   */
  verifyPickupCode: async (orderId: string, code: string): Promise<Order> => {
    const response = await api.post<BackendResponse<Order>>(
      `/orders/${orderId}/verify-pickup`,
      { code }
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/shipping/rates
   * Get available courier rates between origin and destination.
   * 
   * IMPORTANT: Both postal codes must be valid 5-digit Indonesian postal codes.
   */
  getShippingRates: async (
    payload: ShippingRateRequest
  ): Promise<ShippingRate[]> => {
    console.log('[OrderService] Calling shipping/rates with payload:', JSON.stringify(payload, null, 2));
    
    // Final validation before API call
    const { origin_postal_code, destination_postal_code, weight, item_value } = payload;
    
    if (!origin_postal_code || origin_postal_code.trim() === '') {
      throw new Error('origin_postal_code is required and cannot be empty');
    }
    
    if (!destination_postal_code || destination_postal_code.trim() === '') {
      throw new Error('destination_postal_code is required and cannot be empty');
    }

    // Clean the payload
    const cleanPayload: ShippingRateRequest = {
      origin_postal_code: origin_postal_code.trim(),
      destination_postal_code: destination_postal_code.trim(),
      weight: Math.max(1, Math.round(weight)), // Ensure positive integer
      item_value: Math.max(1, Math.round(item_value)), // Ensure positive integer
    };

    console.log('[OrderService] Clean payload:', JSON.stringify(cleanPayload, null, 2));
    
    try {
      const response = await api.post<BackendListResponse<ShippingRate>>(
        '/shipping/rates',
        cleanPayload
      );
      
      console.log('[OrderService] Shipping rates raw response:', response.data);
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      
      if (Array.isArray(data)) {
        return data;
      }
      
      // If data is wrapped in another object
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Check common wrapper keys
        const possibleArrays = ['rates', 'couriers', 'options', 'results'];
        for (const key of possibleArrays) {
          if (Array.isArray((data as any)[key])) {
            return (data as any)[key];
          }
        }
      }
      
      console.warn('[OrderService] Unexpected shipping rates response structure:', response.data);
      return [];
    } catch (err: any) {
      console.error('[OrderService] Shipping rates API error:', err.response?.data || err.message);
      console.error('[OrderService] Request payload was:', JSON.stringify(cleanPayload, null, 2));
      throw err;
    }
  },

  /**
   * GET /api/v1/shipping/track/:biteshipOrderId
   * Track shipment progress.
   */
  trackShipment: async (biteshipOrderId: string): Promise<any> => {
    const response = await api.get<BackendResponse<any>>(
      `/shipping/track/${biteshipOrderId}`
    );
    return response.data.data;
  },
};

// ============== UI HELPERS ==============

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending_payment: 'Menunggu Pembayaran',
    paid: 'Sudah Dibayar',
    confirmed: 'Dikonfirmasi Seller',
    shipped: 'Sedang Dikirim',
    delivered: 'Sampai Tujuan',
    verified_pickup: 'Pickup Terverifikasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return labels[status] || status;
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-teal-100 text-teal-700',
    verified_pickup: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const formatPaymentMethodLabel = (
  method?: string,
  channel?: string
): string => {
  if (!method) return '-';
  if (method === 'bank_transfer' && channel) {
    return `${channel.toUpperCase()} Virtual Account`;
  }
  const labels: Record<string, string> = {
    bank_transfer: 'Virtual Account',
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    qris: 'QRIS',
    credit_card: 'Kartu Kredit/Debit',
  };
  return labels[method] || method.replace(/_/g, ' ');
};
