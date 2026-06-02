"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { accountService } from "@/services/accountService";

interface StoreProfile {
  id: string;
  shop_name: string;
  shop_description?: string;
  shop_location_desc: string;
  shop_photo?: string;
  latitude?: number;
  longitude?: number;
  average_rating: number;
  total_sold: number;
  status: string;
}

export default function StoreSettingsPage() {
  const toast = useToast();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [shopPhoto, setShopPhoto] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const data = await accountService.getSellerProfile();
        setStore(data);
        setShopName(data.shop_name || "");
        setShopDescription(data.shop_description || "");
        setShopLocation(data.shop_location_desc || "");
        setShopPhoto(data.shop_photo || "");
      } catch (err: any) {
        // Store might not exist yet
        console.error("Failed to fetch store:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);
    try {
      const result = await accountService.uploadFile(file, "avatars");
      if (result.data?.url) {
        setShopPhoto(result.data.url);
        toast.success("Foto berhasil diupload");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal upload foto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }

    setSaving(true);
    try {
      await accountService.updateSellerProfile({
        shop_name: shopName,
        shop_description: shopDescription,
        shop_location_desc: shopLocation,
        shop_photo: shopPhoto || undefined,
      });
      toast.success("Profil toko berhasil disimpan");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan profil toko");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Toko</h1>
        <p className="text-gray-500">Kelola informasi toko Anda</p>
      </div>

      {/* Store Stats */}
      {store && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Rating</p>
            <div className="flex items-center gap-1 mt-1">
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">
                {store.average_rating?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Terjual</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {store.total_sold || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-bold ${
                store.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : store.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {store.status === "approved"
                ? "Terverifikasi"
                : store.status === "pending"
                ? "Menunggu Verifikasi"
                : "Ditolak"}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Shop Photo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Foto Toko
          </label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {shopPhoto ? (
                <img
                  src={shopPhoto}
                  alt="Foto Toko"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? "Mengupload..." : "Ganti Foto"}
              </label>
              <p className="text-xs text-gray-500 mt-2">JPG, PNG maks 5MB</p>
            </div>
          </div>
        </div>

        {/* Shop Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nama Toko <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Nama toko Anda"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition"
          />
        </div>

        {/* Shop Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Deskripsi Toko
          </label>
          <textarea
            value={shopDescription}
            onChange={(e) => setShopDescription(e.target.value)}
            rows={4}
            placeholder="Ceritakan tentang toko Anda..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition resize-none"
          />
        </div>

        {/* Shop Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Lokasi Toko
          </label>
          <input
            type="text"
            value={shopLocation}
            onChange={(e) => setShopLocation(e.target.value)}
            placeholder="Contoh: Pasar Kampung Ilmu Blok A No. 5"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition"
          />
          <p className="text-xs text-gray-500 mt-1">
            Alamat atau lokasi lapak di Kampung Ilmu
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
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
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
