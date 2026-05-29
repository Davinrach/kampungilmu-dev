"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { accountService } from "@/services/accountService";
import { useAuthStore } from "@/store/authStore";

interface LinkPhoneModalProps {
  onClose: () => void;
}

export default function LinkPhoneModal({ onClose }: LinkPhoneModalProps) {
  const toast = useToast();
  const { refreshProfile } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, "");
    
    // If starts with 0, replace with 62
    if (digits.startsWith("0")) {
      digits = "62" + digits.slice(1);
    }
    
    // If doesn't start with 62, add it
    if (!digits.startsWith("62") && digits.length > 0) {
      digits = "62" + digits;
    }
    
    return digits;
  };

  const validatePhone = (phone: string): boolean => {
    // Indonesian phone number: 62 followed by 9-12 digits
    const phoneRegex = /^62[0-9]{9,12}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("Nomor HP wajib diisi");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Format nomor HP tidak valid (contoh: 6281234567890)");
      return;
    }

    setLoading(true);
    try {
      await accountService.linkPhone(phone);
      toast.success("Nomor HP berhasil ditambahkan!");
      
      // Refresh profile to get updated data
      await refreshProfile();
      
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || "Gagal menambahkan nomor HP";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Display formatted phone for user
  const displayPhone = phone ? phone : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tambah Nomor HP</h2>
            <p className="text-sm text-gray-500">
              Hubungkan nomor WhatsApp ke akun Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-center text-gray-600 text-sm">
              Dengan menambahkan nomor HP, Anda bisa login menggunakan OTP WhatsApp di kemudian hari.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                +
              </span>
              <input
                type="tel"
                value={displayPhone}
                onChange={handlePhoneChange}
                placeholder="6281234567890"
                className={`w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition ${
                  error ? "border-red-500" : "border-gray-200"
                }`}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: 62 diikuti nomor HP (tanpa 0 di depan)
            </p>
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
