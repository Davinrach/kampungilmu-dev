"use client";

import { useState } from "react";
import {
  disputeService,
  Dispute,
  RespondDisputePayload,
  getDisputeTypeLabel,
  parseEvidencePhotos,
  formatDisputeDate,
} from "@/services/disputeService";
import { accountService } from "@/services/accountService";
import { useToast } from "@/components/ui/Toast";

interface DisputeResponseModalProps {
  dispute: Dispute;
  onClose: (updated?: boolean) => void;
}

export default function DisputeResponseModal({
  dispute,
  onClose,
}: DisputeResponseModalProps) {
  const toast = useToast();
  const [response, setResponse] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const customerPhotos = parseEvidencePhotos(dispute.evidence_photos);

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

    if (!response.trim()) {
      setError("Tulis tanggapan Anda");
      return;
    }

    if (response.trim().length < 20) {
      setError("Tanggapan minimal 20 karakter");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: RespondDisputePayload = {
        response: response.trim(),
      };

      if (photoUrls.length > 0) {
        payload.evidence = JSON.stringify(photoUrls);
      }

      await disputeService.respondToDispute(dispute.id, payload);
      toast.success("Tanggapan berhasil dikirim!");
      onClose(true);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || "Gagal mengirim tanggapan. Coba lagi.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tanggapi Komplain</h2>
              <p className="text-sm text-gray-500">
                Pesanan #{dispute.order_number || dispute.order_id.slice(0, 8)}
              </p>
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

          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Customer Complaint Summary */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
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
                  <span className="text-xs text-gray-500">
                    {formatDisputeDate(dispute.created_at)}
                  </span>
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
                    <p className="text-xs text-gray-500 mb-2">Bukti dari Pembeli:</p>
                    <div className="flex flex-wrap gap-2">
                      {customerPhotos.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhoto(url)}
                          className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-500 transition"
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

            {/* Response Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Response Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggapan Anda <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Jelaskan tanggapan Anda terhadap komplain ini..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {response.length}/1000
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
                    <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-500 transition cursor-pointer">
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
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Informasi:</p>
                    <p className="text-xs">
                      Setelah Anda merespon, admin akan meninjau komplain ini dan
                      memberikan keputusan. Pastikan tanggapan Anda jelas dan
                      sertakan bukti jika diperlukan.
                    </p>
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
                  disabled={loading || !response.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    "Kirim Tanggapan"
                  )}
                </button>
              </div>
            </form>
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
