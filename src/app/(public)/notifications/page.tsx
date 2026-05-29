"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import {
  Notification,
  NotificationType,
  getNotificationTypeConfig,
  formatNotificationDate,
  getNotificationLink,
} from "@/services/notificationService";

type FilterType = "all" | NotificationType;

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [hasHydrated, isAuthenticated, fetchNotifications, router]);

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
    }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "order", label: "Pesanan" },
    { key: "chat", label: "Pesan" },
    { key: "review", label: "Ulasan" },
    { key: "dispute", label: "Komplain" },
    { key: "system", label: "Sistem" },
  ];

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                {unreadCount} notifikasi belum dibaca
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-x-auto">
          <div className="flex p-1 min-w-max">
            {filters.map((f) => {
              const count =
                f.key === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.type === f.key).length;

              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                    filter === f.key
                      ? "bg-teal-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                        filter === f.key
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Tidak Ada Notifikasi
            </h2>
            <p className="text-gray-500">
              {filter === "all"
                ? "Anda belum memiliki notifikasi"
                : `Tidak ada notifikasi ${filters.find((f) => f.key === filter)?.label.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filteredNotifications.map((notification, index) => {
              const typeConfig = getNotificationTypeConfig(notification.type);
              const link = getNotificationLink(notification);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition ${
                    index !== filteredNotifications.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  } ${!notification.is_read ? "bg-teal-50/50" : ""}`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}
                    >
                      <span className="text-xl">{typeConfig.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold ${
                              !notification.is_read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                        {link && (
                          <span className="text-xs text-teal-600 font-medium">
                            Lihat Detail →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
