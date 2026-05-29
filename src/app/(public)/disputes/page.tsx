"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import {
  disputeService,
  Dispute,
  getDisputeTypeLabel,
  getDisputeStatusConfig,
  formatDisputeDate,
} from "@/services/disputeService";
import DisputeDetailModal from "@/components/disputes/DisputeDetailModal";

export default function DisputesPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setLoading(true);
    disputeService
      .getMyDisputes()
      .then(setDisputes)
      .catch((err) => {
        setError(err.response?.data?.message || "Gagal memuat daftar komplain");
      })
      .finally(() => setLoading(false));
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Komplain Saya
          </h1>
          <p className="text-gray-500">
            Daftar komplain yang pernah Anda ajukan
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {disputes.length === 0 ? (
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Belum Ada Komplain
            </h2>
            <p className="text-gray-500 mb-6">
              Anda belum pernah mengajukan komplain. Semoga pengalaman belanja
              Anda selalu menyenangkan!
            </p>
            <Link
              href="/orders"
              className="inline-block bg-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-600 transition"
            >
              Lihat Pesanan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const statusConfig = getDisputeStatusConfig(dispute.status);
              return (
                <div
                  key={dispute.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedDisputeId(dispute.id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDisputeDate(dispute.created_at)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded mr-2">
                      {getDisputeTypeLabel(dispute.type)}
                    </span>
                    <Link
                      href={`/orders/${dispute.order_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Pesanan #{dispute.order_number || dispute.order_id.slice(0, 8)}
                    </Link>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                    {dispute.reason}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Seller: <span className="font-medium">{dispute.seller_name}</span>
                    </p>
                    <button className="text-teal-600 text-sm font-semibold hover:text-teal-700">
                      Lihat Detail →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDisputeId && (
        <DisputeDetailModal
          disputeId={selectedDisputeId}
          onClose={() => setSelectedDisputeId(null)}
        />
      )}
    </div>
  );
}
