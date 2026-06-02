import api from '@/lib/api';

// ============== TYPES ==============

export type NotificationType = 'order' | 'chat' | 'review' | 'dispute' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: string; // JSON string with additional data
  is_read: boolean;
  created_at: string;
}

export interface NotificationData {
  order_id?: string;
  chat_room_id?: string;
  book_id?: string;
  dispute_id?: string;
  [key: string]: string | undefined;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  in_app_enabled: boolean;
  whatsapp_enabled: boolean;
  transaction_notif: boolean;
  chat_notif: boolean;
  promo_notif: boolean;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============== CONSTANTS ==============

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; color: string; bgColor: string }
> = {
  order: {
    icon: '📦',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  chat: {
    icon: '💬',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
  },
  review: {
    icon: '⭐',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  dispute: {
    icon: '⚠️',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  system: {
    icon: '🔔',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
};

// ============== SERVICE ==============

export const notificationService = {
  /**
   * Get all notifications for current user
   * GET /api/v1/notifications
   */
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<BackendResponse<any>>('/notifications');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.notifications)) return data.notifications;
      const arrayValues = Object.values(data).filter(Array.isArray);
      if (arrayValues.length > 0) return arrayValues[0];
    }
    return [];
  },

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<BackendResponse<{ unread_count: number }>>(
      '/notifications/unread-count'
    );
    return response.data.data?.unread_count || 0;
  },

  /**
   * Mark a single notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   */
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  /**
   * Get notification preferences
   * GET /api/v1/notifications/preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<BackendResponse<NotificationPreferences>>('/notifications/preferences');
    return response.data.data;
  },

  /**
   * Update notification preferences
   * PATCH /api/v1/notifications/preferences
   */
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.patch<BackendResponse<NotificationPreferences>>('/notifications/preferences', preferences);
    return response.data.data;
  },
};

// ============== HELPERS ==============

export const getNotificationTypeConfig = (type: NotificationType) => {
  return NOTIFICATION_TYPE_CONFIG[type] || NOTIFICATION_TYPE_CONFIG.system;
};

export const parseNotificationData = (dataJson?: string): NotificationData => {
  if (!dataJson) return {};
  try {
    return JSON.parse(dataJson);
  } catch {
    return {};
  }
};

export const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const getNotificationLink = (notification: Notification): string | null => {
  const data = parseNotificationData(notification.data);

  switch (notification.type) {
    case 'order':
      return data.order_id ? `/orders/${data.order_id}` : '/orders';
    case 'chat':
      return data.chat_room_id ? `/chat?room=${data.chat_room_id}` : '/chat';
    case 'review':
      return data.book_id ? `/books/${data.book_id}` : null;
    case 'dispute':
      return data.dispute_id ? `/disputes` : '/disputes';
    default:
      return null;
  }
};
