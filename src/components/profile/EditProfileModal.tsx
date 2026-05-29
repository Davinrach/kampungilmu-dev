"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { accountService } from "@/services/accountService";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";

const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
}

const inputClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400";

export default function EditProfileModal({
  user,
  onClose,
}: EditProfileModalProps) {
  const { updateUser } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user.profile_photo || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name || "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB");
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      toast.error("File harus berupa gambar");
      return;
    }

    setPhotoFile(file);
    setError("");

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (data: EditProfileForm) => {
    setLoading(true);
    setError("");

    try {
      let profilePhotoUrl: string | undefined;

      // Step 1: Upload photo if changed
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const uploadRes = await accountService.uploadFile(photoFile);
          profilePhotoUrl = uploadRes.data?.url;
          if (!profilePhotoUrl) {
            throw new Error("Upload berhasil tapi URL tidak ditemukan");
          }
        } catch (uploadErr: any) {
          const errMsg =
            uploadErr.response?.data?.message ||
            "Gagal upload foto. Pastikan file valid.";
          setError(errMsg);
          toast.error(errMsg);
          setLoading(false);
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      }

      // Step 2: Update profile (only send changed fields)
      const updateData: { name?: string; profile_photo?: string } = {};
      if (data.name !== user.name) updateData.name = data.name;
      if (profilePhotoUrl) updateData.profile_photo = profilePhotoUrl;

      // If nothing changed, just close
      if (Object.keys(updateData).length === 0) {
        toast.info("Tidak ada perubahan");
        onClose();
        return;
      }

      const response = await accountService.updateProfile(updateData);

      if (response.success !== false) {
        // Backend may return data, or we manually update
        const updatedUser = response.data
          ? { ...user, ...response.data }
          : {
              ...user,
              ...(updateData.name && { name: updateData.name }),
              ...(updateData.profile_photo && {
                profile_photo: updateData.profile_photo,
              }),
            };

        updateUser(updatedUser);
        toast.success("Profil berhasil diperbarui");
        onClose();
      } else {
        throw new Error(response.message || "Gagal memperbarui profil");
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Gagal memperbarui profil";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-900">Edit Profil</h2>
          <button
            onClick={onClose}
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

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="p-6 space-y-5"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {uploadingPhoto && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <svg
                    className="animate-spin w-8 h-8 text-white"
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
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute bottom-0 right-0 w-9 h-9 bg-teal-500 rounded-full shadow-lg flex items-center justify-center hover:bg-teal-600 transition border-2 border-white disabled:opacity-50"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500">
              Klik kamera untuk ganti foto (max 5MB)
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register("name")}
              type="text"
              placeholder="Masukkan nama lengkap"
              className={inputClass}
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600 ml-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Email
            </label>
            <input
              type="email"
              value={user.email || "-"}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 ml-1">
              Email tidak dapat diubah dari sini
            </p>
          </div>

          {/* Phone (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={user.phone_number || "-"}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 ml-1">
              Nomor WhatsApp tidak dapat diubah
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200 disabled:opacity-50 flex items-center justify-center gap-2"
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
                  {uploadingPhoto ? "Upload Foto..." : "Menyimpan..."}
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
