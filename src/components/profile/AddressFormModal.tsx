"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { accountService, Address } from "@/services/accountService";
import { useToast } from "@/components/ui/Toast";

// Schema matches backend body format
const addressSchema = z.object({
  label: z.string().min(1, "Label wajib diisi").max(50, "Label maksimal 50 karakter"),
  recipient_name: z.string().min(2, "Nama penerima minimal 2 karakter"),
  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .regex(/^(62|0)\d{9,13}$/, "Format nomor tidak valid"),
  full_address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  kelurahan: z.string().min(2, "Kelurahan wajib diisi"),
  kecamatan: z.string().min(2, "Kecamatan wajib diisi"),
  city: z.string().min(2, "Kota wajib diisi"),
  postal_code: z.string().regex(/^\d{5}$/, "Kode pos harus 5 digit"),
  is_default: z.boolean().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

interface AddressFormModalProps {
  address: Address | null;
  onClose: (refresh?: boolean) => void;
}

const inputClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400";

const textareaClass = inputClass + " resize-none";

const LABEL_PRESETS = ["Rumah", "Kantor", "Kos", "Apartemen"];

export default function AddressFormModal({
  address,
  onClose,
}: AddressFormModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!address;

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: address?.label || "Rumah",
      recipient_name: address?.recipient_name || "",
      phone: address?.phone || "",
      full_address: address?.full_address || "",
      kelurahan: address?.kelurahan || "",
      kecamatan: address?.kecamatan || "",
      city: address?.city || "",
      postal_code: address?.postal_code || "",
      is_default: address?.is_default || false,
    },
  });

  const currentLabel = form.watch("label");

  const handleSubmit = async (data: AddressForm) => {
    setLoading(true);
    setError("");

    try {
      if (isEdit && address) {
        await accountService.updateAddress(address.id, data);
        toast.success("Alamat berhasil diperbarui");
      } else {
        await accountService.createAddress(data);
        toast.success("Alamat berhasil ditambahkan");
      }
      onClose(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Gagal menyimpan alamat";
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
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit Alamat" : "Tambah Alamat Baru"}
          </h2>
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

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="p-6 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Label Alamat <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {LABEL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => form.setValue("label", preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    currentLabel === preset
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              {...form.register("label")}
              type="text"
              placeholder="Contoh: Rumah, Kantor, Kos"
              className={inputClass}
            />
            {form.formState.errors.label && (
              <p className="mt-1 text-sm text-red-600 ml-1">
                {form.formState.errors.label.message}
              </p>
            )}
          </div>

          {/* Recipient Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Nama Penerima <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register("recipient_name")}
              type="text"
              placeholder="Nama lengkap penerima"
              className={inputClass}
            />
            {form.formState.errors.recipient_name && (
              <p className="mt-1 text-sm text-red-600 ml-1">
                {form.formState.errors.recipient_name.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register("phone")}
              type="tel"
              placeholder="6281234567890"
              className={inputClass}
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600 ml-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              {...form.register("full_address")}
              rows={3}
              placeholder="Contoh: Jl. Merdeka No. 10 RT 01/RW 02"
              className={textareaClass}
            />
            {form.formState.errors.full_address && (
              <p className="mt-1 text-sm text-red-600 ml-1">
                {form.formState.errors.full_address.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 ml-1">
              Termasuk nama jalan, nomor rumah, RT/RW
            </p>
          </div>

          {/* Kelurahan & Kecamatan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                Kelurahan <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register("kelurahan")}
                type="text"
                placeholder="Sukamaju"
                className={inputClass}
              />
              {form.formState.errors.kelurahan && (
                <p className="mt-1 text-sm text-red-600 ml-1">
                  {form.formState.errors.kelurahan.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register("kecamatan")}
                type="text"
                placeholder="Cibeunying"
                className={inputClass}
              />
              {form.formState.errors.kecamatan && (
                <p className="mt-1 text-sm text-red-600 ml-1">
                  {form.formState.errors.kecamatan.message}
                </p>
              )}
            </div>
          </div>

          {/* City & Postal Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register("city")}
                type="text"
                placeholder="Bandung"
                className={inputClass}
              />
              {form.formState.errors.city && (
                <p className="mt-1 text-sm text-red-600 ml-1">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                Kode Pos <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register("postal_code")}
                type="text"
                maxLength={5}
                placeholder="40123"
                className={inputClass}
              />
              {form.formState.errors.postal_code && (
                <p className="mt-1 text-sm text-red-600 ml-1">
                  {form.formState.errors.postal_code.message}
                </p>
              )}
            </div>
          </div>

          {/* Set as Default */}
          <label className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl cursor-pointer hover:bg-teal-100/50 transition">
            <input
              {...form.register("is_default")}
              type="checkbox"
              className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Jadikan alamat utama
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Alamat ini akan digunakan secara default saat checkout
              </p>
            </div>
          </label>

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
                  Menyimpan...
                </>
              ) : isEdit ? (
                "Update Alamat"
              ) : (
                "Simpan Alamat"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
