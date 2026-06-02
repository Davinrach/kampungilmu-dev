"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  disputeService,
  Dispute,
  getDisputeTypeLabel,
  getDisputeStatusConfig,
  formatDisputeDate,
} from "@/services/disputeService";
import DisputeDetailModal from "@/components/disputes/DisputeDetailModal";
import DisputeResponseModal from "@/components/disputes/DisputeResponseModal";

type TabType = "open" | "responded" | "resolved";

export default function SellerDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const fetchDisputes = async () => {
    try {
      const data = await disputeService.getSellerDisputes();
      setDisputes(data);
    } catch (err: any) {
      // If seller disputes endpoint doesn't exist, try the general one
      // The backend might filter by role automatically
      try {
        const data = await disputeService.getMyDisputes();
        setDisputes(data);
      } catch (innerErr: any) {
        setError(innerErr.response?.data?.message || "Gagal memuat daftar komplain");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter((d) => d.status === activeTab);

  const handleOpenDetail = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDetailModal(true);
  };

  const handleOpenResponse = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowResponseModal(true);
  };

  const handleCloseResponse = (updated?: boolean) => {
    setShowResponseModal(false);
    setSelectedDispute(null);
    if (updated) {
      fetchDisputes();
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: "open",
      label: "Perlu Ditanggapi",
      count: disputes.filter((d) => d.status === "open").length,
    },
    {
      key: "responded",
      label: "Menunggu Admin",
      count: disputes.filter((d) => d.status === "responded").length,
    },
    {
      key: "resolved",
      label: "Selesai",
      count: disputes.filter((d) => d.status === "resolved").length,
    },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Komplain Pelanggan</h1>
        <p className="text-gray-500">Kelola komplain dari pelanggan toko Anda</p>
      </div>

        {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
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
              {activeTab === "open"
                ? "Tidak Ada Komplain Baru"
                : activeTab === "responded"
                ? "Tidak Ada Komplain Menunggu"
                : "Tidak Ada Komplain Selesai"}
            </h2>
            <p className="text-gray-500">
              {activeTab === "open"
                ? "Semua komplain sudah ditanggapi. Bagus!"
                : activeTab === "responded"
                ? "Tidak ada komplain yang menunggu keputusan admin."
                : "Belum ada komplain yang diselesaikan."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const statusConfig = getDisputeStatusConfig(dispute.status);
              return (
                <div
                  key={dispute.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        {getDisputeTypeLabel(dispute.type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDisputeDate(dispute.created_at)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <Link
                      href={`/orders/${dispute.order_id}`}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Pesanan #{dispute.order_number || dispute.order_id.slice(0, 8)}
                    </Link>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-sm text-gray-600">
                      {dispute.customer_name}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                    {dispute.reason}
                  </p>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleOpenDetail(dispute)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                    >
                      Lihat Detail
                    </button>
                    {dispute.status === "open" && (
                      <button
                        onClick={() => handleOpenResponse(dispute)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition shadow-md"
                      >
                        Tanggapi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Modals */}
      {showDetailModal && selectedDispute && (
        <DisputeDetailModal
          disputeId={selectedDispute.id}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDispute(null);
          }}
        />
      )}

      {showResponseModal && selectedDispute && (
        <DisputeResponseModal
          dispute={selectedDispute}
          onClose={handleCloseResponse}
        />
      )}
    </div>
  );
}
