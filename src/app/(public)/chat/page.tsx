"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useToast } from "@/components/ui/Toast";
import { ChatRoom, ChatMessage, formatMessageTime, formatChatTime } from "@/services/chatService";

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const {
    rooms,
    currentRoom,
    messages,
    loadingRooms,
    loadingMessages,
    sendingMessage,
    uploadingPhoto,
    fetchRooms,
    openRoom,
    setCurrentRoom,
    fetchMessages,
    sendMessage,
    uploadAndSendPhoto,
    startPolling,
    stopPolling,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState("");
  const [isMobileListView, setIsMobileListView] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get seller_id from URL if provided (for starting new chat)
  const sellerIdParam = searchParams.get("seller_id");

  // Auth guard
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Fetch rooms on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated, fetchRooms]);

  // Open room if seller_id provided
  useEffect(() => {
    if (sellerIdParam && isAuthenticated) {
      openRoom(sellerIdParam)
        .then((room) => {
          setIsMobileListView(false);
          fetchMessages(room.id);
        })
        .catch(() => {
          toast.error("Gagal membuka chat dengan seller");
        });
    }
  }, [sellerIdParam, isAuthenticated]);

  // Fetch messages when room changes and start polling
  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom.id);
      startPolling(currentRoom.id);
    }
    
    // Cleanup polling on unmount or room change
    return () => {
      stopPolling();
    };
  }, [currentRoom?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleSelectRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
    setIsMobileListView(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Hanya file gambar yang diperbolehkan");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || (sendingMessage || uploadingPhoto)) return;
    if (!messageInput.trim() && !selectedImage) return;

    const content = messageInput.trim();
    setMessageInput("");

    try {
      if (selectedImage) {
        // Upload photo and send
        await uploadAndSendPhoto(currentRoom.id, selectedImage, content || undefined);
        handleRemoveImage();
      } else {
        // Send text only
        await sendMessage(currentRoom.id, content);
      }
    } catch {
      toast.error("Gagal mengirim pesan");
      setMessageInput(content); // Restore input on error
    }
  };

  const handleBackToList = () => {
    setIsMobileListView(true);
    setCurrentRoom(null);
    stopPolling();
  };

  // Loading state
  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-6">
        <div className="bg-white rounded-none sm:rounded-2xl border-0 sm:border border-gray-100 overflow-hidden shadow-sm">
          {/* Header - Desktop */}
          <div className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
              <p className="text-sm text-gray-500">Chat dengan seller</p>
            </div>
          </div>

          <div className="flex h-[calc(100vh-64px)] sm:h-[600px]">
            {/* Room List - Left Panel */}
            <div
              className={`w-full sm:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${
                !isMobileListView ? "hidden sm:flex" : "flex"
              }`}
            >
              {/* Mobile Header */}
              <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                <h1 className="text-lg font-bold text-gray-900">Pesan</h1>
              </div>

              {/* Room List */}
              <div className="flex-1 overflow-y-auto">
                {loadingRooms && rooms.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">Belum ada percakapan</p>
                    <p className="text-gray-400 text-xs">
                      Mulai chat dengan seller dari halaman detail buku
                    </p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <RoomItem
                      key={room.id}
                      room={room}
                      isActive={currentRoom?.id === room.id}
                      onClick={() => handleSelectRoom(room)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Chat Area - Right Panel */}
            <div
              className={`flex-1 flex flex-col ${
                isMobileListView ? "hidden sm:flex" : "flex"
              }`}
            >
              {currentRoom ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                    <button
                      onClick={handleBackToList}
                      className="sm:hidden w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {currentRoom.other_user_photo ? (
                        <img
                          src={currentRoom.other_user_photo}
                          alt={currentRoom.other_user_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {(currentRoom.other_user_name || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {currentRoom.other_user_name}
                      </p>
                      <p className="text-xs text-gray-500">Seller</p>
                    </div>
                    {/* Online indicator */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="hidden sm:inline">Online</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-gray-500 text-sm">Belum ada pesan</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Mulai percakapan dengan mengirim pesan
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-auto rounded-lg object-cover"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white"
                  >
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    {/* Photo button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                      title="Kirim foto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Ketik pesan..."
                      className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={(!messageInput.trim() && !selectedImage) || sendingMessage || uploadingPhoto}
                      className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full flex items-center justify-center hover:from-teal-600 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage || uploadingPhoto ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Pilih percakapan</p>
                  <p className="text-gray-400 text-sm">
                    Pilih chat dari daftar di sebelah kiri
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== SUB COMPONENTS ==============

function RoomItem({
  room,
  isActive,
  onClick,
}: {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${
        isActive ? "bg-teal-50" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
          {room.other_user_photo ? (
            <img
              src={room.other_user_photo}
              alt={room.other_user_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {(room.other_user_name || "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {room.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {room.unread_count > 9 ? "9+" : room.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900 truncate text-sm">
            {room.other_user_name}
          </p>
          {room.last_message_at && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {formatMessageTime(room.last_message_at)}
            </span>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${
          room.unread_count > 0 ? "text-gray-900 font-medium" : "text-gray-500"
        }`}>
          {room.last_message || "Belum ada pesan"}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMe = message.is_me;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  return (
    <>
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
            isMe
              ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-br-md"
              : "bg-white text-gray-900 rounded-bl-md shadow-sm"
          }`}
        >
          {message.photo_url && (
            <div className="relative mb-2">
              {!imageLoaded && (
                <div className="w-48 h-32 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <img
                src={message.photo_url}
                alt="Foto"
                className={`max-w-full rounded-lg cursor-pointer hover:opacity-90 transition ${!imageLoaded ? 'hidden' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onClick={() => setShowFullImage(true)}
              />
            </div>
          )}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          <p
            className={`text-[10px] mt-1 ${
              isMe ? "text-teal-100" : "text-gray-400"
            }`}
          >
            {formatChatTime(message.created_at)}
          </p>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && message.photo_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={message.photo_url}
            alt="Foto"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// Loading fallback for Suspense
function ChatPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

// Export with Suspense wrapper
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
