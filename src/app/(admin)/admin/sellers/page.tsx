"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Seller {
  id: string;
  user_id: string;
  user_name: string;
  shop_name: string;
  shop_description?: string;
  shop_location_desc?: string;
  shop_photo?: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  average_rating: number;
  total_sold: number;
  total_books: number;
  created_at: string;
}

// Mock data - replace with actual API call when available
const mockSellers: Seller[] = [
  {
    id: "1",
    user_id: "u1",
    user_name: "Budi Santoso",
    shop_name: "Toko Buku Jaya",
    shop_description: "Menjual buku bekas berkualitas",
    shop_location_desc: "Pasar Kampung Ilmu Blok A No 5",
    phone: "6281234567890",
    status: "approved",
    average_rating: 4.8,
    total_sold: 156,
    total_books: 45,
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    user_id: "u2",
    user_name: "Siti Rahayu",
    shop_name: "Pustaka Ilmu",
    shop_description: "Buku pelajaran dan referensi",
    shop_location_desc: "Pasar Kampung Ilmu Blok B No 12",
    phone: "6289876543210",
    status: "approved",
    average_rating: 4.5,
    total_sold: 89,
    total_books: 32,
    created_at: "2026-02-20T14:30:00Z",
  },
];

export default function AdminSellersPage() {
  const toast = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSellers(mockSellers);
      setLoading(false);
    }, 500);
  }, []);

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      search === "" ||
      seller.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      seller.user_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || seller.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Seller</h1>
          <p className="text-gray-500">Kelola semua seller di platform</p>
        </div>
        <Link
          href="/admin/sellers/pending"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-100 text-yellow-700 font-semibold rounded-xl hover:bg-yellow-200 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lihat Pending
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Seller</p>
          <p className="text-2xl font-bold text-gray-900">{sellers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Aktif</p>
          <p className="text-2xl font-bold text-green-600">
            {sellers.filter((s) => s.status === "approved").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Buku</p>
          <p className="text-2xl font-bold text-blue-600">
            {sellers.reduce((sum, s) => sum + s.total_books, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Terjual</p>
          <p className="text-2xl font-bold text-purple-600">
            {sellers.reduce((sum, s) => sum + s.total_sold, 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama toko atau pemilik..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="approved">Aktif</option>
            <option value="pending">Pending</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Sellers List */}
      {filteredSellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Seller</h2>
          <p className="text-gray-500">Tidak ada seller yang sesuai dengan filter</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    {seller.shop_photo ? (
                      <img
                        src={seller.shop_photo}
                        alt={seller.shop_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      seller.shop_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{seller.shop_name}</h3>
                    <p className="text-sm text-gray-500">{seller.user_name}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        seller.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : seller.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {seller.status === "approved"
                        ? "Aktif"
                        : seller.status === "pending"
                        ? "Pending"
                        : "Ditolak"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-gray-900">{seller.average_rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-bold text-gray-900">{seller.total_books}</p>
                    <p className="text-xs text-gray-500">Buku</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-bold text-gray-900">{seller.total_sold}</p>
                    <p className="text-xs text-gray-500">Terjual</p>
                  </div>
                </div>

                {seller.shop_location_desc && (
                  <p className="mt-3 text-xs text-gray-500 flex items-start gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{seller.shop_location_desc}</span>
                  </p>
                )}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => toast.info("Fitur detail seller akan segera hadir")}
                  className="w-full text-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Catatan</p>
            <p>
              Data seller saat ini menggunakan data contoh. Integrasi dengan API backend akan
              dilakukan setelah endpoint tersedia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
