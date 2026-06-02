"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  adminService,
  PendingSeller,
  formatDateTime,
} from "@/services/adminService";

export default function PendingSellersPage() {
  const toast = useToast();
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<PendingSeller | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchSellers = async () => {
    try {
      const data = await adminService.getPendingSellers();
      setSellers(data);
    } catch (err: any) {
      console.error("Failed to fetch pending sellers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleApprove = async (userId: string) => {
    if (!confirm("Yakin ingin menyetujui seller ini?")) return;

    setProcessingId(userId);
    try {
      await adminService.approveSeller(userId);
      toast.success("Seller berhasil disetujui");
      fetchSellers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyetujui seller");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (seller: PendingSeller) => {
    setSelectedSeller(seller);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedSeller || !rejectReason.trim()) {
      toast.warning("Silakan isi alasan penolakan");
      return;
    }

    setProcessingId(selectedSeller.user_id);
    try {
      await adminService.rejectSeller(selectedSeller.user_id, rejectReason.trim());
      toast.success("Seller berhasil ditolak");
      setShowRejectModal(false);
      setSelectedSeller(null);
      setRejectReason("");
      fetchSellers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menolak seller");
    } finally {
      setProcessingId(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Seller</h1>
        <p className="text-gray-500">Tinjau dan verifikasi pengajuan seller baru</p>
      </div>

      {/* Stats */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-yellow-800">{sellers.length} Pengajuan Menunggu</p>
            <p className="text-sm text-yellow-600">Perlu ditinjau dan diverifikasi</p>
          </div>
        </div>
      </div>

      {/* Sellers List */}
      {sellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Pengajuan</h2>
          <p className="text-gray-500">Semua pengajuan seller sudah diproses</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller) => (
            <div
              key={seller.user_id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {seller.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{seller.user_name}</h3>
                      <p className="text-sm text-gray-500">{seller.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Diajukan: {formatDateTime(seller.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                    Pending
                  </span>
                </div>
              </div>

              {/* Store Info */}
              <div className="p-5 grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Informasi Toko</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Nama Toko</p>
                      <p className="font-medium text-gray-900">{seller.shop_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deskripsi</p>
                      <p className="text-sm text-gray-700">{seller.shop_description || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lokasi</p>
                      <p className="text-sm text-gray-700">{seller.shop_location_desc || "-"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Dokumen</h4>
                  <div className="flex gap-3">
                    {seller.ktp_photo && (
                      <button
                        onClick={() => setSelectedPhoto(seller.ktp_photo)}
                        className="relative group"
                      >
                        <img
                          src={seller.ktp_photo}
                          alt="KTP"
                          className="w-24 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">KTP</p>
                      </button>
                    )}
                    {seller.shop_photo && (
                      <button
                        onClick={() => setSelectedPhoto(seller.shop_photo!)}
                        className="relative group"
                      >
                        <img
                          src={seller.shop_photo}
                          alt="Toko"
                          className="w-24 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">Foto Toko</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleOpenReject(seller)}
                  disabled={processingId === seller.user_id}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(seller.user_id)}
                  disabled={processingId === seller.user_id}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId === seller.user_id ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Tolak Pengajuan</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSeller.shop_name} - {selectedSeller.user_name}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Contoh: Foto KTP tidak jelas, data tidak lengkap, dll."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Alasan ini akan dikirimkan ke calon seller
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedSeller(null);
                  setRejectReason("");
                }}
                disabled={processingId === selectedSeller.user_id}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedSeller.user_id || !rejectReason.trim()}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === selectedSeller.user_id ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Tolak Pengajuan"
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
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedPhoto}
            alt="Dokumen"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
