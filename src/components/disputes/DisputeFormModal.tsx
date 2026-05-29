"use client";

import { useState } from "react";
import {
  disputeService,
  CreateDisputePayload,
  DisputeType,
  DISPUTE_TYPES,
} from "@/services/disputeService";
import { accountService } from "@/services/accountService";
import { useToast } from "@/components/ui/Toast";

interface DisputeFormModalProps {
  orderId: string;
  orderNumber?: string;
  sellerId: string;
  sellerName?: string;
  onClose: (submitted?: boolean) => void;
}

export default function DisputeFormModal({
  orderId,
  orderNumber,
  sellerId,
  sellerName,
  onClose,
}: DisputeFormModalProps) {
  const toast = useToast();
  const [type, setType] = useState<DisputeType | "">("");
  const [reason, setReason] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddPhotoUrl = () => {
    const url = newPhotoUrl.trim();
    if (!url) return;
    if (photoUrls.length >= 5) {
      toast.warning("Maksimal 5 foto bukti");
      return;
    }
    if (!url.startsWith("http")) {
      toast.warning("URL harus dimulai dengan http:// atau https://");
      return;
    }
    setPhotoUrls([...photoUrls, url]);
    setNewPhotoUrl("");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoUrls.length >= 5) {
      toast.warning("Maksimal 5 foto bukti");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Ukuran file maksimal 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.warning("File harus berupa gambar");
      return;
    }

    setUploading(true);
    try {
      const result = await accountService.uploadFile(file, "disputes");
      if (result.data?.url) {
        setPhotoUrls([...photoUrls, result.data.url]);
        toast.success("Foto berhasil diupload");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal upload foto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type) {
      setError("Pilih jenis masalah");
      return;
    }

    if (!reason.trim()) {
      setError("Jelaskan masalah yang Anda alami");
      return;
    }

    if (reason.trim().length < 20) {
      setError("Penjelasan minimal 20 karakter");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: CreateDisputePayload = {
        order_id: orderId,
        seller_id: sellerId,
        type: type as DisputeType,
        reason: reason.trim(),
      };

      if (photoUrls.length > 0) {
        payload.evidence_photos = JSON.stringify(photoUrls);
      }

      await disputeService.createDispute(payload);
      toast.success("Komplain berhasil diajukan!");
      onClose(true);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || "Gagal mengajukan komplain. Coba lagi.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajukan Komplain</h2>
            {orderNumber && (
              <p className="text-sm text-gray-500">Pesanan #{orderNumber}</p>
            )}
          </div>
          <button
            onClick={() => onClose()}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Seller Info */}
          {sellerName && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Seller</p>
              <p className="font-semibold text-gray-900">{sellerName}</p>
            </div>
          )}

          {/* Dispute Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Jenis Masalah <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {DISPUTE_TYPES.map((dt) => (
                <label
                  key={dt.value}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition ${
                    type === dt.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="disputeType"
                    value={dt.value}
                    checked={type === dt.value}
                    onChange={() => setType(dt.value)}
                    className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{dt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jelaskan Masalah <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Jelaskan secara detail masalah yang Anda alami..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {reason.length}/1000
            </p>
          </div>

          {/* Evidence Photos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Foto Bukti (Opsional, maks 5)
            </label>

            {/* Photo Preview */}
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Bukti ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {photoUrls.length < 5 && (
              <div className="flex gap-2">
                <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-teal-500 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
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
                      Mengupload...
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg
                        className="w-8 h-8 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm">Klik untuk upload foto</p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG maks 5MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* Or add URL manually */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">
                Atau tambahkan URL foto:
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  disabled={!newPhotoUrl.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
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
                <p className="font-semibold mb-1">Proses Komplain:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Komplain Anda akan dikirim ke seller</li>
                  <li>Seller memiliki waktu 3 hari untuk merespon</li>
                  <li>Jika tidak ada kesepakatan, admin akan memutuskan</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose()}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !type || !reason.trim()}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
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
                  Mengirim...
                </>
              ) : (
                "Ajukan Komplain"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
