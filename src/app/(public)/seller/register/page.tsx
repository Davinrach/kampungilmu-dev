"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { accountService } from "@/services/accountService";

// Validation schema
const sellerRegistrationSchema = z.object({
  // Store Info
  store_name: z.string().min(3, "Nama toko minimal 3 karakter").max(100, "Nama toko maksimal 100 karakter"),
  store_description: z.string().min(10, "Deskripsi minimal 10 karakter").max(500, "Deskripsi maksimal 500 karakter"),
  store_address: z.string().min(10, "Alamat minimal 10 karakter"),
  
  // Bank Info
  bank_name: z.string().min(1, "Pilih bank"),
  account_number: z.string().min(5, "Nomor rekening tidak valid"),
  account_holder_name: z.string().min(2, "Nama pemilik rekening minimal 2 karakter"),
  
  // Documents
  id_card_number: z.string().length(16, "NIK harus 16 digit"),
  
  // Agreement
  agree_terms: z.boolean().refine((val) => val === true, "Anda harus menyetujui syarat dan ketentuan"),
});

type SellerRegistrationForm = z.infer<typeof sellerRegistrationSchema>;

export default function SellerRegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [storePhotoFile, setStorePhotoFile] = useState<File | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState<any>(null);

  const form = useForm<SellerRegistrationForm>({
    resolver: zodResolver(sellerRegistrationSchema),
    defaultValues: {
      store_name: "",
      store_description: "",
      store_address: "",
      bank_name: "",
      account_number: "",
      account_holder_name: "",
      id_card_number: "",
      agree_terms: false,
    },
  });

  // Redirect if not authenticated or already a seller, and check application status
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    } else if (user?.role === "seller") {
      router.push("/seller");
      return;
    }

    const checkSellerStatus = async () => {
      try {
        const response = await accountService.getSellerProfile();
        // If user already applied and is pending or rejected
        if (response && (response.status === "pending" || response.status === "rejected")) {
          setPendingRegistration(response);
        }
      } catch (err) {
        console.log("No pending seller profile found (new application or not applied yet)");
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSellerStatus();
  }, [hasHydrated, isAuthenticated, user, router]);

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file KTP maksimal 5MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File KTP harus berupa gambar");
        return;
      }
      setIdCardFile(file);
      setError("");
    }
  };

  const handleStorePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran foto lapak maksimal 5MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Foto lapak harus berupa gambar");
        return;
      }
      setStorePhotoFile(file);
      setError("");
    }
  };

  const handleSubmit = async (data: SellerRegistrationForm) => {
    if (!idCardFile) {
      setError("Upload foto KTP wajib diisi");
      return;
    }

    if (!storePhotoFile) {
      setError("Upload foto lapak wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Upload KTP photo
      const ktpUploadRes = await accountService.uploadFile(idCardFile, 'ktp');
      const ktpPhotoUrl = ktpUploadRes.data?.url;
      if (!ktpPhotoUrl) {
        throw new Error("Gagal upload foto KTP");
      }

      // Step 2: Upload store photo
      const storeUploadRes = await accountService.uploadFile(storePhotoFile, 'avatars');
      const storePhotoUrl = storeUploadRes.data?.url;
      if (!storePhotoUrl) {
        throw new Error("Gagal upload foto lapak");
      }

      // Step 3: Submit seller upgrade request
      const response = await accountService.requestSellerUpgrade({
        shop_name: data.store_name,
        shop_description: data.store_description,
        shop_location_desc: data.store_address,
        ktp_photo: ktpPhotoUrl,
        shop_photo: storePhotoUrl,
      });

      if (response.success) {
        // Update user in store if needed
        if (response.data?.user) {
          updateUser(response.data.user);
        }

        // Show success and redirect
        alert("Pendaftaran seller berhasil dikirim! Tim kami akan memverifikasi data Anda dalam 1-3 hari kerja.");
        router.push("/profile");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Gagal mengirim pendaftaran. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger(["store_name", "store_description", "store_address"]);
      if (!isValid) {
        alert("Mohon lengkapi semua kolom Informasi Toko dengan benar (periksa peringatan berwarna merah).");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!storePhotoFile) {
        alert("Silakan upload foto lapak Anda terlebih dahulu.");
        return;
      }
    }
    
    if (step === 2) {
      const isValid = await form.trigger(["bank_name", "account_number", "account_holder_name", "id_card_number"]);
      if (!isValid) {
        alert("Mohon lengkapi semua kolom Bank & Dokumen dengan benar. Pastikan Anda sudah memilih Nama Bank di bagian atas.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!idCardFile) {
        alert("Silakan upload foto KTP Anda terlebih dahulu.");
        return;
      }
    }

    setError("");
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!hasHydrated || !user || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (pendingRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 py-6 sm:py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {pendingRegistration.status === "pending" ? "Pendaftaran Diproses" : "Pendaftaran Ditolak"}
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {pendingRegistration.status === "pending"
              ? `Pengajuan toko "${pendingRegistration.shop_name}" Anda sedang ditinjau oleh tim kami. Harap tunggu 1-3 hari kerja.`
              : `Pengajuan toko "${pendingRegistration.shop_name}" Anda ditolak. Alasan: "${pendingRegistration.rejection_reason || "Data tidak sesuai persyaratan"}". Silakan ajukan ulang dengan data yang benar.`}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="inline-block w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition text-center shadow-lg shadow-teal-100"
            >
              Kembali ke Profil
            </Link>
            {pendingRegistration.status === "rejected" && (
              <button
                type="button"
                onClick={() => setPendingRegistration(null)}
                className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Daftar Ulang
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 py-6 sm:py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Profil
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Daftar Sebagai Seller
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Lengkapi formulir di bawah untuk mulai berjualan di Kampung Ilmu
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition ${
                      step >= num
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {num}
                  </div>
                  <span className="text-xs sm:text-sm mt-2 text-center hidden sm:block">
                    {num === 1 && "Info Toko"}
                    {num === 2 && "Bank & Dokumen"}
                    {num === 3 && "Review"}
                  </span>
                </div>
                {num < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition ${
                      step > num ? "bg-teal-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Step 1: Store Information */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Informasi Toko
                  </h2>
                  <p className="text-sm text-gray-600">
                    Informasi ini akan ditampilkan di halaman toko Anda
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Toko <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.register("store_name")}
                      type="text"
                      placeholder="Contoh: Toko Buku Sejahtera"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                    {form.formState.errors.store_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.store_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi Toko <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...form.register("store_description")}
                      rows={4}
                      placeholder="Ceritakan tentang toko Anda..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                    {form.formState.errors.store_description && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.store_description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Toko/Lapak <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...form.register("store_address")}
                      rows={3}
                      placeholder="Alamat lengkap toko/lapak Anda"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                    {form.formState.errors.store_address && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.store_address.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Alamat ini akan digunakan untuk pickup O2O
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Foto Lapak <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStorePhotoChange}
                        className="hidden"
                        id="storePhoto"
                      />
                      <label htmlFor="storePhoto" className="cursor-pointer">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {storePhotoFile ? storePhotoFile.name : "Klik untuk upload foto lapak"}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG hingga 5MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Bank & Documents */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Informasi Bank & Dokumen
                  </h2>
                  <p className="text-sm text-gray-600">
                    Untuk pencairan dana dan verifikasi identitas
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Bank Info */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Informasi Bank</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Bank <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...form.register("bank_name")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                        >
                          <option value="">Pilih Bank</option>
                          <option value="BCA">BCA</option>
                          <option value="Mandiri">Mandiri</option>
                          <option value="BNI">BNI</option>
                          <option value="BRI">BRI</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Permata">Permata</option>
                          <option value="Danamon">Danamon</option>
                          <option value="BTN">BTN</option>
                        </select>
                        {form.formState.errors.bank_name && (
                          <p className="mt-1 text-sm text-red-600">
                            {form.formState.errors.bank_name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nomor Rekening <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("account_number")}
                          type="text"
                          placeholder="1234567890"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                        />
                        {form.formState.errors.account_number && (
                          <p className="mt-1 text-sm text-red-600">
                            {form.formState.errors.account_number.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Pemilik Rekening <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("account_holder_name")}
                          type="text"
                          placeholder="Sesuai dengan nama di buku rekening"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                        />
                        {form.formState.errors.account_holder_name && (
                          <p className="mt-1 text-sm text-red-600">
                            {form.formState.errors.account_holder_name.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Dokumen Verifikasi</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nomor KTP <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("id_card_number")}
                          type="text"
                          placeholder="16 digit nomor KTP"
                          maxLength={16}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                        />
                        {form.formState.errors.id_card_number && (
                          <p className="mt-1 text-sm text-red-600">
                            {form.formState.errors.id_card_number.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Foto KTP <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIdCardChange}
                            className="hidden"
                            id="idCard"
                          />
                          <label htmlFor="idCard" className="cursor-pointer">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {idCardFile ? idCardFile.name : "Klik untuk upload KTP"}
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG hingga 5MB
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-1">
                          Penting!
                        </p>
                        <p className="text-sm text-yellow-800">
                          Pastikan nama pemilik rekening sama dengan nama di KTP. Data akan diverifikasi oleh tim kami.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Agreement */}
            {step === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Review & Persetujuan
                  </h2>
                  <p className="text-sm text-gray-600">
                    Periksa kembali data Anda sebelum mengirim
                  </p>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Informasi Toko</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Nama Toko:</span>
                        <span className="font-medium text-right">{form.watch("store_name") || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Deskripsi:</span>
                        <span className="font-medium text-right line-clamp-2">{form.watch("store_description") || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Alamat:</span>
                        <span className="font-medium text-right line-clamp-2">{form.watch("store_address") || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Foto Lapak:</span>
                        <span className="font-medium text-right">{storePhotoFile ? "✓ Uploaded" : "Belum upload"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Informasi Bank</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-medium">{form.watch("bank_name") || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">No. Rekening:</span>
                        <span className="font-medium">{form.watch("account_number") || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Atas Nama:</span>
                        <span className="font-medium">{form.watch("account_holder_name") || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Dokumen</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">NIK:</span>
                        <span className="font-medium">{form.watch("id_card_number") || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Foto KTP:</span>
                        <span className="font-medium">{idCardFile ? "✓ Uploaded" : "Belum upload"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      {...form.register("agree_terms")}
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">
                      Saya menyetujui{" "}
                      <Link href="/terms" className="text-teal-600 hover:text-teal-700 font-medium">
                        Syarat & Ketentuan
                      </Link>{" "}
                      serta{" "}
                      <Link href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium">
                        Kebijakan Privasi
                      </Link>{" "}
                      Kampung Ilmu. Saya memahami bahwa data yang saya berikan akan diverifikasi oleh tim Kampung Ilmu.
                    </span>
                  </label>
                  {form.formState.errors.agree_terms && (
                    <p className="mt-2 text-sm text-red-600">
                      {form.formState.errors.agree_terms.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Proses Verifikasi
                      </p>
                      <p className="text-sm text-blue-800">
                        Setelah mengirim formulir, tim kami akan memverifikasi data Anda dalam 1-3 hari kerja. Anda akan menerima notifikasi via WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Kembali
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition flex items-center justify-center gap-2"
                >
                  Lanjut
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !form.watch("agree_terms")}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kirim Pendaftaran
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Butuh bantuan?{" "}
            <Link href="/help" className="text-teal-600 hover:text-teal-700 font-medium">
              Hubungi Customer Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
