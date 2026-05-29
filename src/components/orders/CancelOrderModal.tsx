"use client";

import { useState } from "react";
import { orderService } from "@/services/orderService";
import { useToast } from "@/components/ui/Toast";

interface CancelOrderModalProps {
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  "Berubah pikiran",
  "Salah pesan buku",
  "Harga lebih murah di tempat lain",
  "Pengiriman terlalu lama",
  "Lainnya",
];

export default function CancelOrderModal({
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: CancelOrderModalProps) {
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Backend doesn't accept reason field, but we still capture it for UX
      await orderService.cancelOrder(orderId);
      toast.success("Pesanan berhasil dibatalkan");
      onSuccess();
    } catch (err: any) {
      console.error("[CancelOrder] Error:", err.response?.data);
      toast.error(
        err.response?.data?.message || "Gagal membatalkan pesanan"
      );
      setSubmitting(false);
    }
  };

  const canSubmit =
    selectedReason !== "Lainnya" || customReason.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Batalkan Pesanan</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <span className="text-gray-500">Nomor Pesanan: </span>
              <span className="font-semibold text-gray-900">{orderNumber}</span>
            </div>
          )}

          <div className="mb-5 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-3">
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
              <p>
                Pembatalan tidak dapat dibatalkan. Jika sudah dibayar, dana akan
                dikembalikan dalam 1-3 hari kerja.
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-700 mb-3">
            Alasan pembatalan
          </p>

          <div className="space-y-2 mb-4">
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  selectedReason === reason
                    ? "border-teal-500 bg-teal-50/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === "Lainnya" && (
            <div className="mb-4">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tulis alasan pembatalan..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {customReason.length}/200
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Tidak Jadi
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
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
                  Membatalkan...
                </>
              ) : (
                "Batalkan Pesanan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
