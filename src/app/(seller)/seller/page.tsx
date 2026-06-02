"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { walletService, formatCurrency } from "@/services/walletService";
import { sellerService, SellerBook } from "@/services/sellerService";

interface DashboardStats {
  total_books: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  balance_held: number;
  balance_available: number;
}

interface TopBook {
  book_id: string;
  title: string;
  total_sold: number;
}

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [recentBooks, setRecentBooks] = useState<SellerBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wallet balance for stats
        const balance = await walletService.getBalance();
        
        // Fetch seller books
        const books = await sellerService.getMyBooks();
        
        // Calculate stats from available data
        const totalSold = books.reduce((sum, b) => sum + b.total_sold, 0);
        
        setStats({
          total_books: books.length,
          total_orders: totalSold,
          pending_orders: 0, // Would need orders endpoint
          completed_orders: totalSold,
          total_revenue: balance.total_earnings,
          balance_held: balance.held_balance,
          balance_available: balance.available_balance,
        });

        // Sort books by total_sold for top books
        const sorted = [...books].sort((a, b) => b.total_sold - a.total_sold);
        setTopBooks(
          sorted.slice(0, 5).map((b) => ({
            book_id: b.id,
            title: b.title,
            total_sold: b.total_sold,
          }))
        );

        // Recent books (last 5)
        setRecentBooks(books.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        // Set default values on error
        setStats({
          total_books: 0,
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          total_revenue: 0,
          balance_held: 0,
          balance_available: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Selamat datang, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-slate-300">
              Berikut ringkasan performa toko Anda hari ini
            </p>
          </div>
          <Link
            href="/seller/books/new"
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2.5 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Buku
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
              Aktif
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_books || 0}</p>
          <p className="text-sm text-gray-500">Total Buku</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
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
            </div>
            {stats?.pending_orders ? (
              <span className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-1 rounded-full">
                {stats.pending_orders} pending
              </span>
            ) : null}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_orders || 0}</p>
          <p className="text-sm text-gray-500">Total Terjual</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <Link
              href="/seller/wallet"
              className="text-xs text-teal-600 font-semibold hover:text-teal-700"
            >
              Lihat →
            </Link>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.balance_available || 0)}
          </p>
          <p className="text-sm text-gray-500">Saldo Tersedia</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.total_revenue || 0)}
          </p>
          <p className="text-sm text-gray-500">Total Pendapatan</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/seller/orders?status=pending"
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Pesanan Baru</p>
              <p className="text-sm text-gray-500">Perlu dikonfirmasi</p>
            </div>
          </div>
        </Link>

        <Link
          href="/seller/disputes"
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition">
              <svg
                className="w-6 h-6 text-red-600"
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
            </div>
            <div>
              <p className="font-semibold text-gray-900">Komplain</p>
              <p className="text-sm text-gray-500">Perlu ditanggapi</p>
            </div>
          </div>
        </Link>

        <Link
          href="/seller/reviews"
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ulasan</p>
              <p className="text-sm text-gray-500">Lihat ulasan terbaru</p>
            </div>
          </div>
        </Link>

        <Link
          href="/seller/wallet"
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Cairkan Dana</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(stats?.balance_available || 0)}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Selling Books */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Buku Terlaris</h2>
            <Link
              href="/seller/books"
              className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topBooks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Belum ada data penjualan</p>
              </div>
            ) : (
              topBooks.map((book, index) => (
                <div
                  key={book.book_id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : index === 1
                        ? "bg-gray-100 text-gray-600"
                        : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{book.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{book.total_sold}</p>
                    <p className="text-xs text-gray-500">terjual</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Books */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Buku Terbaru</h2>
            <Link
              href="/seller/books/new"
              className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
            >
              + Tambah
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBooks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-3">Belum ada buku</p>
                <Link
                  href="/seller/books/new"
                  className="inline-block px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600"
                >
                  Tambah Buku Pertama
                </Link>
              </div>
            ) : (
              recentBooks.map((book) => (
                <div
                  key={book.id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition"
                >
                  <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {book.cover_photo ? (
                      <img
                        src={book.cover_photo}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{book.title}</p>
                    <p className="text-sm text-gray-500">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          book.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {book.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stok: {book.stock}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(book.price)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
