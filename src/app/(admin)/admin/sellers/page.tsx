"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminService, formatDateTime } from "@/services/adminService";

interface Seller {
  id?: string;
  user_id?: string;
  user_name?: string;
  shop_name: string;
  phone?: string;
  status?: string;
  created_at?: string;
  is_active?: boolean;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllSellers();
      setSellers(data);
    } catch (err: any) {
      console.error("Failed to fetch sellers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Semua Seller</h1>
          <p className="text-gray-500">Kelola semua seller yang terdaftar di platform</p>
        </div>
        <Link
          href="/admin/sellers/pending"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-100 text-yellow-700 font-semibold rounded-xl hover:bg-yellow-200 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending Approval
        </Link>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Toko
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pemilik
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Terdaftar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    Tidak ada seller ditemukan
                  </td>
                </tr>
              ) : (
                sellers.map((seller, idx) => (
                  <tr key={seller.id || seller.user_id || idx} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{seller.shop_name || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-900">{seller.user_name || "-"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {seller.phone || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        seller.status === "active" || seller.is_active
                          ? "bg-green-100 text-green-700"
                          : seller.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {seller.status || (seller.is_active ? "active" : "inactive")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {seller.created_at ? formatDateTime(seller.created_at) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
