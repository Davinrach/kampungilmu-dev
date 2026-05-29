"use client";

import { useState } from "react";
import { orderService } from "@/services/orderService";
import { useToast } from "@/components/ui/Toast";

interface ConfirmReceiptModalProps {
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmReceiptModal({
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: ConfirmReceiptModalProps) {
  const toast = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.warning("Centang konfirmasi terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      await orderService.confirmReceipt(orderId);
      toast.success("Terima kasih! Pesanan telah dikonfirmasi");
      onSuccess();
    } catch (err: any) {
      console.error("[ConfirmReceipt] Error:", err.response?.data);
      toast.error(
        err.response?.data?.message || "Gagal konfirmasi penerimaan"
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-6 py-8 rounded-t-2xl text-center text-white relative">
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">Konfirmasi Penerimaan</h2>
          <p className="text-white/90 text-sm">
            Apakah pesanan sudah Anda terima dengan baik?
          </p>
        </div>

        <div className="p-6">
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <span className="text-gray-500">Nomor Pesanan: </span>
              <span className="font-semibold text-gray-900">{orderNumber}</span>
            </div>
          )}

          <div className="space-y-3 mb-5">
            <InfoItem
              icon="✓"
              text="Buku sudah saya terima dengan baik"
            />
            <InfoItem icon="✓" text="Kondisi sesuai dengan deskripsi" />
            <InfoItem
              icon="✓"
              text="Tidak ada kerusakan / kecacatan"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Setelah dikonfirmasi, dana akan diteruskan ke seller. Pastikan
                pesanan benar-benar sesuai sebelum konfirmasi.
              </span>
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl cursor-pointer hover:bg-teal-100/50 transition mb-5">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">
              Saya telah memeriksa pesanan dan setuju untuk mengkonfirmasi
              penerimaan. Saya memahami bahwa fitur sengketa hanya dapat
              diajukan dalam <strong>3 hari</strong> setelah konfirmasi.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Nanti
            </button>
            <button
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200 disabled:opacity-50 flex items-center justify-center gap-2"
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
                  Memproses...
                </>
              ) : (
                "Konfirmasi Terima"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
