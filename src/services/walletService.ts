import api from '@/lib/api';

// ============== TYPES ==============

export interface WalletBalance {
  available_balance: number;
  held_balance: number;
  total_earnings: number;
}

export type MutationType = 'credit' | 'debit' | 'hold' | 'release';

export interface WalletMutation {
  id: string;
  type: MutationType;
  amount: number;
  description: string;
  order_id?: string;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface Withdrawal {
  id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  status: WithdrawalStatus;
  reason?: string;
  created_at: string;
  processed_at?: string;
}

export interface WithdrawPayload {
  amount: number;
  bank_name: string;
  bank_account: string;
  account_holder: string;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== CONSTANTS ==============

export const MUTATION_TYPE_CONFIG: Record<
  MutationType,
  { label: string; color: string; sign: string }
> = {
  credit: {
    label: 'Pemasukan',
    color: 'text-green-600',
    sign: '+',
  },
  debit: {
    label: 'Pengeluaran',
    color: 'text-red-600',
    sign: '-',
  },
  hold: {
    label: 'Ditahan',
    color: 'text-yellow-600',
    sign: '~',
  },
  release: {
    label: 'Dilepas',
    color: 'text-blue-600',
    sign: '+',
  },
};

export const WITHDRAWAL_STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'Menunggu',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  approved: {
    label: 'Disetujui',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  rejected: {
    label: 'Ditolak',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

// ============== SERVICE ==============

export const walletService = {
  /**
   * Get wallet balance
   * GET /api/v1/wallet
   */
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get<BackendResponse<WalletBalance>>('/wallet');
    return response.data.data;
  },

  /**
   * Get wallet mutations history
   * GET /api/v1/wallet/mutations
   */
  getMutations: async (): Promise<WalletMutation[]> => {
    const response = await api.get<BackendResponse<WalletMutation[]>>('/wallet/mutations');
    return response.data.data || [];
  },

  /**
   * Request withdrawal
   * POST /api/v1/wallet/withdraw
   */
  requestWithdrawal: async (payload: WithdrawPayload): Promise<Withdrawal> => {
    const response = await api.post<BackendResponse<Withdrawal>>('/wallet/withdraw', payload);
    return response.data.data;
  },

  /**
   * Get withdrawal history
   * GET /api/v1/wallet/withdrawals
   */
  getWithdrawals: async (): Promise<Withdrawal[]> => {
    const response = await api.get<BackendResponse<Withdrawal[]>>('/wallet/withdrawals');
    return response.data.data || [];
  },
};

// ============== HELPERS ==============

export const getMutationTypeConfig = (type: MutationType) => {
  return MUTATION_TYPE_CONFIG[type] || MUTATION_TYPE_CONFIG.credit;
};

export const getWithdrawalStatusConfig = (status: WithdrawalStatus) => {
  return WITHDRAWAL_STATUS_CONFIG[status] || WITHDRAWAL_STATUS_CONFIG.pending;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatWalletDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
