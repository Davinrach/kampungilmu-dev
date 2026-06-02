"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import {
  disputeService,
  Dispute,
  getDisputeTypeLabel,
  getDisputeStatusConfig,
  parseEvidencePhotos,
  formatDisputeDate,
} from "@/services/disputeService";

type TabType = "open" | "responded" | "resolved";
type DecisionType = "refund_full" | "refund_partial" | "rejected";

const DECISION_OPTIONS: { value: DecisionType; label: string; description: string }[] = [
  {
    value: "refund_full",
    label: "Refund Penuh",
    description: "Pembeli mendapat refund 100% dari nilai pesanan",
  },
  {
    value: "refund_partial",
    label: "Refund Sebagian",
    description: "Pembeli mendapat refund sebagian dari nilai pesanan",
  },
  {
    value: "rejected",
    label: "Ditolak",
    description: "Komplain ditolak, seller tidak bersalah",
  },
];

export default function AdminDisputesPage() {
  const toast = useToast();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("responded");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [decision, setDecision] = useState<DecisionType | "">("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      const data = await disputeService.getAdminDisputes();
      setDisputes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat daftar komplain");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter((d) => d.status === activeTab);

  const handleOpenResolve = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDecision("");
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !decision) return;

    setResolving(true);
    try {
      await disputeService.resolveDispute(selectedDispute.id, decision);
      toast.success("Komplain berhasil diselesaikan");
      setShowResolveModal(false);
      setSelectedDispute(null);
      setDecision("");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyelesaikan komplain");
    } finally {
      setResolving(false);
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: "open",
      label: "Menunggu Seller",
      count: disputes.filter((d) => d.status === "open").length,
    },
    {
      key: "responded",
      label: "Perlu Keputusan",
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
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Komplain</h1>
        <p className="text-gray-500">Kelola dan putuskan komplain dari pelanggan</p>
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
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-indigo-100 text-indigo-700"
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
                ? "Tidak Ada Komplain Menunggu Seller"
                : activeTab === "responded"
                ? "Tidak Ada Komplain Perlu Keputusan"
                : "Tidak Ada Komplain Selesai"}
            </h2>
            <p className="text-gray-500">
              {activeTab === "responded"
                ? "Semua komplain sudah diputuskan. Bagus!"
                : "Tidak ada komplain dalam kategori ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const statusConfig = getDisputeStatusConfig(dispute.status);
              const customerPhotos = parseEvidencePhotos(dispute.evidence_photos);
              const sellerPhotos = parseEvidencePhotos(dispute.seller_evidence);

              return (
                <div
                  key={dispute.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
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

                    <div className="flex items-center gap-4 text-sm">
                      <Link
                        href={`/orders/${dispute.order_id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Pesanan #{dispute.order_number || dispute.order_id.slice(0, 8)}
                      </Link>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 grid md:grid-cols-2 gap-4">
                    {/* Customer Complaint */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-teal-600"
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
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {dispute.customer_name}
                          </p>
                          <p className="text-xs text-gray-500">Pembeli</p>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {dispute.reason}
                      </p>
                      {customerPhotos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {customerPhotos.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedPhoto(url)}
                              className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-500 transition"
                            >
                              <img
                                src={url}
                                alt={`Bukti ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Seller Response */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {dispute.seller_name}
                          </p>
                          <p className="text-xs text-gray-500">Seller</p>
                        </div>
                      </div>
                      {dispute.seller_response ? (
                        <>
                          <p className="text-gray-700 text-sm line-clamp-3">
                            {dispute.seller_response}
                          </p>
                          {sellerPhotos.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sellerPhotos.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedPhoto(url)}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition"
                                >
                                  <img
                                    src={url}
                                    alt={`Bukti seller ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm italic">
                          Belum ada tanggapan dari seller
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Decision (if resolved) */}
                  {dispute.status === "resolved" && dispute.decision && (
                    <div className="px-5 pb-5">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs text-green-600 font-semibold mb-1">
                          Keputusan Admin
                        </p>
                        <p className="text-green-800 font-semibold">
                          {dispute.decision === "refund_full"
                            ? "Refund Penuh"
                            : dispute.decision === "refund_partial"
                            ? "Refund Sebagian"
                            : "Ditolak"}
                        </p>
                        {dispute.admin_notes && (
                          <p className="text-green-700 text-sm mt-1">
                            {dispute.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {dispute.status === "responded" && (
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => handleOpenResolve(dispute)}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition shadow-lg"
                      >
                        Buat Keputusan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Putuskan Komplain
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pesanan #{selectedDispute.order_number || selectedDispute.order_id.slice(0, 8)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pilih Keputusan
                </label>
                <div className="space-y-2">
                  {DECISION_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        decision === opt.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        value={opt.value}
                        checked={decision === opt.value}
                        onChange={() => setDecision(opt.value)}
                        className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Perhatian</p>
                    <p className="text-xs">
                      Keputusan ini bersifat final dan tidak dapat diubah.
                      Pastikan Anda sudah meninjau semua bukti dari kedua belah
                      pihak.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedDispute(null);
                  setDecision("");
                }}
                disabled={resolving}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving || !decision}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resolving ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Keputusan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <img
            src={selectedPhoto}
            alt="Bukti"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
