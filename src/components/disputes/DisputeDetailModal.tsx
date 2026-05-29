"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  disputeService,
  Dispute,
  getDisputeTypeLabel,
  getDisputeStatusConfig,
  parseEvidencePhotos,
  formatDisputeDate,
} from "@/services/disputeService";

interface DisputeDetailModalProps {
  disputeId: string;
  onClose: () => void;
}

export default function DisputeDetailModal({
  disputeId,
  onClose,
}: DisputeDetailModalProps) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!disputeId) return;

    setLoading(true);
    setError("");

    disputeService
      .getDispute(disputeId)
      .then(setDispute)
      .catch((err) => {
        setError(err.response?.data?.message || "Gagal memuat detail komplain");
      })
      .finally(() => setLoading(false));
  }, [disputeId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
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
          <p className="text-gray-700 mb-4">{error || "Data tidak ditemukan"}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getDisputeStatusConfig(dispute.status);
  const customerPhotos = parseEvidencePhotos(dispute.evidence_photos);
  const sellerPhotos = parseEvidencePhotos(dispute.seller_evidence);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detail Komplain</h2>
              <p className="text-sm text-gray-500">
                {formatDisputeDate(dispute.created_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-bold ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
              <span className="text-sm text-gray-500">
                ID: {dispute.id.slice(0, 8)}
              </span>
            </div>

            {/* Order & Seller Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Pesanan</p>
                <Link
                  href={`/orders/${dispute.order_id}`}
                  className="font-semibold text-teal-600 hover:text-teal-700"
                >
                  #{dispute.order_number || dispute.order_id.slice(0, 8)}
                </Link>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Seller</p>
                <p className="font-semibold text-gray-900">{dispute.seller_name}</p>
              </div>
            </div>

            {/* Customer Complaint */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
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
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                    {getDisputeTypeLabel(dispute.type)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {dispute.reason}
                </p>
                {customerPhotos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Bukti Foto:</p>
                    <div className="flex flex-wrap gap-2">
                      {customerPhotos.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPhoto(url)}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-500 transition"
                        >
                          <img
                            src={url}
                            alt={`Bukti ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Response */}
            {dispute.seller_response && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-purple-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
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
                </div>
                <div className="p-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {dispute.seller_response}
                  </p>
                  {sellerPhotos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Bukti dari Seller:</p>
                      <div className="flex flex-wrap gap-2">
                        {sellerPhotos.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedPhoto(url)}
                            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition"
                          >
                            <img
                              src={url}
                              alt={`Bukti seller ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Decision */}
            {dispute.status === "resolved" && dispute.decision && (
              <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Keputusan Admin
                      </p>
                      <p className="text-xs text-gray-500">Final</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {dispute.decision}
                  </p>
                  {dispute.admin_notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Catatan: {dispute.admin_notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Waiting for response */}
            {dispute.status === "open" && !dispute.seller_response && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-yellow-900 text-sm">
                      Menunggu Respon Seller
                    </p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Seller memiliki waktu 3 hari untuk merespon komplain Anda.
                      Jika tidak ada respon, admin akan meninjau kasus ini.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting for admin */}
            {dispute.status === "responded" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">
                      Menunggu Keputusan Admin
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                      Seller sudah memberikan respon. Admin akan meninjau dan
                      memberikan keputusan dalam 1-3 hari kerja.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
}
