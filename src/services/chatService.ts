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

// ============== MOCK SYSTEM ==============
const getMockRooms = (): ChatRoom[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('mock_chat_rooms');
  return stored ? JSON.parse(stored) : [];
};

const saveMockRooms = (rooms: ChatRoom[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_chat_rooms', JSON.stringify(rooms));
  }
};

const getMockMessages = (roomId: string): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(`mock_chat_messages_${roomId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockMessages = (roomId: string, messages: ChatMessage[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mock_chat_messages_${roomId}`, JSON.stringify(messages));
  }
};

// ============== SERVICE ==============

export const chatService = {
  getOrCreateRoom: async (sellerId: string): Promise<ChatRoom> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let rooms = getMockRooms();
        let room = rooms.find(r => r.other_user_id === sellerId);
        
        if (!room) {
          room = {
            id: `room-${sellerId}-${Date.now()}`,
            other_user_id: sellerId,
            other_user_name: "Toko Buku Penjual", // Fallback mock name
            other_user_photo: "https://ui-avatars.com/api/?name=Toko+Buku&background=0D8ABC&color=fff",
            last_message: "Halo! Ada yang bisa kami bantu?",
            last_message_at: new Date().toISOString(),
            unread_count: 1
          };
          rooms.unshift(room);
          saveMockRooms(rooms);
          
          // Seed initial bot message
          const welcomeMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender_id: sellerId,
            content: "Halo Kak! Buku yang di etalase ready stock semua ya. Silakan langsung diorder!",
            created_at: new Date().toISOString(),
            is_me: false
          };
          saveMockMessages(room.id, [welcomeMessage]);
        }
        
        resolve(room);
      }, 500);
    });
  },

  getRooms: async (): Promise<ChatRoom[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getMockRooms());
      }, 500);
    });
  },

  getMessages: async (roomId: string): Promise<ChatMessage[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mark room as read
        const rooms = getMockRooms();
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex !== -1) {
          rooms[roomIndex].unread_count = 0;
          saveMockRooms(rooms);
        }
        resolve(getMockMessages(roomId));
      }, 300);
    });
  },

  sendMessage: async (
    roomId: string,
    data: { content?: string; photo_url?: string }
  ): Promise<ChatMessage> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const messages = getMockMessages(roomId);
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender_id: "me", // Assuming current user
          content: data.content || "",
          photo_url: data.photo_url,
          created_at: new Date().toISOString(),
          is_me: true
        };
        messages.push(newMessage);
        saveMockMessages(roomId, messages);
        
        // Update room last message
        const rooms = getMockRooms();
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex !== -1) {
          rooms[roomIndex].last_message = data.content || "Mengirim foto";
          rooms[roomIndex].last_message_at = newMessage.created_at;
          saveMockRooms(rooms);
        }
        
        resolve(newMessage);
      }, 500);
    });
  },

  uploadPhoto: async (file: File): Promise<string> => {
    // Mock upload by creating object URL (temporary)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1500);
    });
  },

  getTotalUnreadCount: async (): Promise<number> => {
    const rooms = await chatService.getRooms();
    return rooms.reduce((total, room) => total + (room.unread_count || 0), 0);
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
