import { create } from 'zustand';
import { chatService, ChatRoom, ChatMessage } from '@/services/chatService';

interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  loadingRooms: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  uploadingPhoto: boolean;
  error: string | null;
  totalUnreadCount: number;
  pollingInterval: NodeJS.Timeout | null;

  // Actions
  fetchRooms: () => Promise<void>;
  openRoom: (sellerId: string) => Promise<ChatRoom>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string, photoUrl?: string) => Promise<void>;
  uploadAndSendPhoto: (roomId: string, file: File, content?: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  fetchTotalUnreadCount: () => Promise<void>;
  startPolling: (roomId: string) => void;
  stopPolling: () => void;
  markRoomAsRead: (roomId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  loadingRooms: false,
  loadingMessages: false,
  sendingMessage: false,
  uploadingPhoto: false,
  error: null,
  totalUnreadCount: 0,
  pollingInterval: null,

  fetchRooms: async () => {
    set({ loadingRooms: true, error: null });
    try {
      const rooms = await chatService.getRooms();
      const totalUnread = rooms.reduce((total, room) => total + room.unread_count, 0);
      set({ rooms, totalUnreadCount: totalUnread, loadingRooms: false });
    } catch (err: any) {
      set({
        loadingRooms: false,
        error: err.response?.data?.message || 'Gagal memuat chat',
      });
    }
  },

  openRoom: async (sellerId: string) => {
    set({ loadingRooms: true, error: null });
    try {
      const room = await chatService.getOrCreateRoom(sellerId);
      set((state) => {
        // Add room to list if not exists
        const exists = state.rooms.find((r) => r.id === room.id);
        if (!exists) {
          return {
            rooms: [room, ...state.rooms],
            currentRoom: room,
            loadingRooms: false,
          };
        }
        return { currentRoom: room, loadingRooms: false };
      });
      return room;
    } catch (err: any) {
      set({
        loadingRooms: false,
        error: err.response?.data?.message || 'Gagal membuka chat',
      });
      throw err;
    }
  },

  setCurrentRoom: (room) => {
    set({ currentRoom: room, messages: [] });
  },

  fetchMessages: async (roomId: string) => {
    set({ loadingMessages: true, error: null });
    try {
      const messages = await chatService.getMessages(roomId);
      set({ messages, loadingMessages: false });
      
      // Mark room as read when messages are fetched
      get().markRoomAsRead(roomId);
    } catch (err: any) {
      set({
        loadingMessages: false,
        error: err.response?.data?.message || 'Gagal memuat pesan',
      });
    }
  },

  sendMessage: async (roomId: string, content: string, photoUrl?: string) => {
    set({ sendingMessage: true, error: null });
    try {
      const message = await chatService.sendMessage(roomId, {
        content: content || undefined,
        photo_url: photoUrl || undefined,
      });

      set((state) => ({
        messages: [...state.messages, message],
        sendingMessage: false,
        // Update last message in room list
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? { ...r, last_message: content || '[Foto]', last_message_at: message.created_at }
            : r
        ),
      }));
    } catch (err: any) {
      set({
        sendingMessage: false,
        error: err.response?.data?.message || 'Gagal mengirim pesan',
      });
      throw err;
    }
  },

  uploadAndSendPhoto: async (roomId: string, file: File, content?: string) => {
    set({ uploadingPhoto: true, error: null });
    try {
      // Upload photo first
      const photoUrl = await chatService.uploadPhoto(file);
      
      // Then send message with photo
      const message = await chatService.sendMessage(roomId, {
        content: content || undefined,
        photo_url: photoUrl,
      });

      set((state) => ({
        messages: [...state.messages, message],
        uploadingPhoto: false,
        // Update last message in room list
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? { ...r, last_message: content || '[Foto]', last_message_at: message.created_at }
            : r
        ),
      }));
    } catch (err: any) {
      set({
        uploadingPhoto: false,
        error: err.response?.data?.message || 'Gagal mengirim foto',
      });
      throw err;
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  fetchTotalUnreadCount: async () => {
    try {
      const count = await chatService.getTotalUnreadCount();
      set({ totalUnreadCount: count });
    } catch {
      // Silently fail - not critical
    }
  },

  startPolling: (roomId: string) => {
    // Stop any existing polling
    get().stopPolling();

    // Start new polling interval (every 5 seconds)
    const interval = setInterval(async () => {
      try {
        const messages = await chatService.getMessages(roomId);
        const currentMessages = get().messages;
        
        // Only update if there are new messages
        if (messages.length > currentMessages.length) {
          set({ messages });
        }
        
        // Also refresh rooms to update unread counts
        const rooms = await chatService.getRooms();
        const totalUnread = rooms.reduce((total, room) => total + room.unread_count, 0);
        set({ rooms, totalUnreadCount: totalUnread });
      } catch {
        // Silently fail - will retry on next interval
      }
    }, 5000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  markRoomAsRead: (roomId: string) => {
    set((state) => {
      const room = state.rooms.find((r) => r.id === roomId);
      if (!room || room.unread_count === 0) return state;

      const updatedRooms = state.rooms.map((r) =>
        r.id === roomId ? { ...r, unread_count: 0 } : r
      );
      const totalUnread = updatedRooms.reduce((total, r) => total + r.unread_count, 0);

      return {
        rooms: updatedRooms,
        totalUnreadCount: totalUnread,
      };
    });
  },

  reset: () => {
    get().stopPolling();
    set({
      rooms: [],
      currentRoom: null,
      messages: [],
      loadingRooms: false,
      loadingMessages: false,
      sendingMessage: false,
      uploadingPhoto: false,
      error: null,
      totalUnreadCount: 0,
      pollingInterval: null,
    });
  },
}));
