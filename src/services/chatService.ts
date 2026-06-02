import api from '@/lib/api';

// ============== TYPES ==============

export interface ChatRoom {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_photo?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  photo_url?: string;
  created_at: string;
  is_me: boolean;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendListResponse<T> {
  success: boolean;
  message: string;
  data: {
    messages?: T[];
    [key: string]: any;
  } | T[];
}

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
  };
}

// ============== SERVICE ==============

export const chatService = {
  /**
   * Get or create a chat room with a seller.
   * POST /api/v1/chat/rooms
   */
  getOrCreateRoom: async (sellerId: string): Promise<ChatRoom> => {
    const response = await api.post<BackendResponse<ChatRoom>>('/chat/rooms', {
      seller_id: sellerId,
    });
    return response.data.data;
  },

  /**
   * Get all chat rooms for the current user.
   * GET /api/v1/chat/rooms
   */
  getRooms: async (): Promise<ChatRoom[]> => {
    const response = await api.get<BackendListResponse<ChatRoom>>('/chat/rooms');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const arrayValues = Object.values(data).filter(Array.isArray);
      if (arrayValues.length > 0) return arrayValues[0];
    }
    return [];
  },

  /**
   * Get messages in a chat room.
   * GET /api/v1/chat/rooms/:roomId/messages
   */
  getMessages: async (roomId: string): Promise<ChatMessage[]> => {
    const response = await api.get<BackendListResponse<ChatMessage>>(
      `/chat/rooms/${roomId}/messages`
    );
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.messages)) return data.messages;
      const arrayValues = Object.values(data).filter(Array.isArray);
      if (arrayValues.length > 0) return arrayValues[0];
    }
    return [];
  },

  /**
   * Send a message in a chat room.
   * POST /api/v1/chat/rooms/:roomId/messages
   */
  sendMessage: async (
    roomId: string,
    data: { content?: string; photo_url?: string }
  ): Promise<ChatMessage> => {
    const response = await api.post<BackendResponse<ChatMessage>>(
      `/chat/rooms/${roomId}/messages`,
      data
    );
    return response.data.data;
  },

  /**
   * Upload a photo for chat message.
   * POST /api/v1/upload
   */
  uploadPhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload?folder=avatars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.url;
  },

  /**
   * Get total unread message count across all rooms.
   */
  getTotalUnreadCount: async (): Promise<number> => {
    const rooms = await chatService.getRooms();
    return rooms.reduce((total, room) => total + room.unread_count, 0);
  },
};

// ============== HELPERS ==============

export const formatMessageTime = (dateString: string): string => {
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

export const formatChatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
