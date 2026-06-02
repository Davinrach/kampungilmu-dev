"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useChatStore } from "@/store/chatStore";
import GlobalSearchBar from "@/components/catalog/GlobalSearchBar";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated, logout, refreshProfile } = useAuthStore();
  const { totalItems: cartCount, fetchCart, reset: resetCart } = useCartStore();
  const { fetchUnreadCount, reset: resetNotifications } = useNotificationStore();
  const { totalUnreadCount: chatUnreadCount, fetchTotalUnreadCount, reset: resetChat } = useChatStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch cart, notifications, and chat unread count when user logs in, reset when logs out
  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      refreshProfile(); // Sync profile data (like role changes after approval) with backend
      fetchCart();
      fetchUnreadCount();
      fetchTotalUnreadCount();
      
      // Set up interval to refresh chat unread count every 30 seconds
      const chatInterval = setInterval(() => {
        fetchTotalUnreadCount();
      }, 30000);
      
      return () => clearInterval(chatInterval);
    } else {
      resetCart();
      resetNotifications();
      resetChat();
    }
  }, [hasHydrated, isAuthenticated, fetchCart, resetCart, fetchUnreadCount, resetNotifications, fetchTotalUnreadCount, resetChat, refreshProfile]);

  const handleLogout = () => {
    logout();
    resetCart();
    resetNotifications();
    resetChat();
    setProfileDropdownOpen(false);
    router.push("/login");
  };

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/books", label: "Buku" },
    { href: "/about", label: "Tentang" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/Logo_Kampung_Ilmu_White-removebg-preview.png"
              alt="Kampung Ilmu Logo"
              className="h-12 w-auto object-contain rounded-xl shadow-sm"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar (desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-6">
            <GlobalSearchBar />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search Icon (mobile only) */}
            <Link
              href="/books"
              className="md:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
              title="Cari Buku"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>

            {/* Chat */}
            {isAuthenticated && (
              <Link
                href="/chat"
                className="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
                title="Pesan"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Cart */}
            {isAuthenticated && (
              <Link
                href="/cart"
                className="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
                title="Keranjang"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth State */}
            {!hasHydrated ? (
              // Skeleton during hydration
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              // Profile Dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-1 pr-3 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {user.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email || user.phone_number}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "seller"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current"></span>
                        {user.role === "admin"
                          ? "Administrator"
                          : user.role === "seller"
                          ? "Seller"
                          : "Customer"}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profil Saya
                      </Link>

                      <Link
                        href="/profile?tab=addresses"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Alamat
                      </Link>

                      <Link
                        href="/cart"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Keranjang
                        {cartCount > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                            {cartCount > 99 ? "99+" : cartCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        Pesanan Saya
                      </Link>

                      <Link
                        href="/disputes"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Komplain Saya
                      </Link>

                      <Link
                        href="/chat"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Pesan
                        {chatUnreadCount > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                            {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                          </span>
                        )}
                      </Link>

                      {user.role === "seller" && (
                        <Link
                          href="/seller"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                            />
                          </svg>
                          Dashboard Seller
                        </Link>
                      )}

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          Dashboard Admin
                        </Link>
                      )}

                      {user.role === "customer" && (
                        <Link
                          href="/seller/register"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Upgrade ke Seller
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Login/Register Buttons
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:block px-4 py-2 text-sm font-semibold text-gray-700 hover:text-teal-600 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-md shadow-teal-200"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && hasHydrated && (
              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive("/chat")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Pesan
              </Link>
            )}
            {!isAuthenticated && hasHydrated && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Masuk
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
