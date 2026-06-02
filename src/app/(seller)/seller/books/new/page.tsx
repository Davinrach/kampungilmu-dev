"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { sellerService, CreateBookPayload } from "@/services/sellerService";
import { catalogService, BookCategory, PLACEHOLDER_IMAGE } from "@/services/catalogService";
import { accountService } from "@/services/accountService";

const CONDITION_OPTIONS = [
  { value: "mulus", label: "Mulus", desc: "Seperti baru, tidak ada cacat" },
  { value: "layak_baca", label: "Layak Baca", desc: "Kondisi baik, sedikit bekas pakai" },
  { value: "ada_coretan", label: "Ada Coretan", desc: "Ada coretan/highlight tapi masih bisa dibaca" },
  { value: "rusak_ringan", label: "Rusak Ringan", desc: "Ada kerusakan kecil seperti lipatan" },
];

export default function NewBookPage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category_id: "",
    title: "",
    author: "",
    publisher: "",
    year_published: "",
    isbn: "",
    description: "",
    price: "",
    stock: "",
    book_type: "used" as "new" | "used",
    condition_grade: "layak_baca",
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await catalogService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      toast.warning("Maksimal 5 foto");
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.warning(`File ${file.name} terlalu besar (max 5MB)`);
          continue;
        }

        const response = await accountService.uploadFile(file, "books");
        if (response.data?.url) {
          setPhotos((prev) => [...prev, response.data.url]);
        }
      }
      toast.success("Foto berhasil diupload");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal upload foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category_id) newErrors.category_id = "Pilih kategori";
    if (!formData.title.trim()) newErrors.title = "Judul wajib diisi";
    if (!formData.author.trim()) newErrors.author = "Penulis wajib diisi";
    if (!formData.price || parseInt(formData.price) < 1000) {
      newErrors.price = "Harga minimal Rp 1.000";
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = "Stok tidak valid";
    }
    if (formData.book_type === "used" && !formData.condition_grade) {
      newErrors.condition_grade = "Pilih kondisi buku";
    }
    if (photos.length === 0) {
      newErrors.photos = "Upload minimal 1 foto";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.warning("Lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateBookPayload = {
        category_id: formData.category_id,
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim() || undefined,
        year_published: formData.year_published ? parseInt(formData.year_published) : undefined,
        isbn: formData.isbn.trim() || undefined,
        description: formData.description.trim() || undefined,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        book_type: formData.book_type,
        condition_grade: formData.book_type === "used" ? formData.condition_grade : undefined,
        photo_urls: photos,
      };

      await sellerService.createBook(payload);
      toast.success("Buku berhasil ditambahkan!");
      router.push("/seller/books");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menambahkan buku");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/seller/books"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Buku Baru</h1>
        <p className="text-gray-500">Lengkapi informasi buku yang ingin Anda jual</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Foto Buku</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload 1-5 foto buku. Foto pertama akan menjadi cover utama.
          </p>

          <div className="flex flex-wrap gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="w-24 h-32 bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {index === 0 && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-500 transition disabled:opacity-50"
              >
                {uploading ? (
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs">Tambah</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {errors.photos && (
            <p className="text-red-500 text-sm mt-2">{errors.photos}</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Dasar</h2>

          <div className="grid gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition ${
                  errors.category_id ? "border-red-500" : "border-gray-200"
                }`}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Judul Buku <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Laskar Pelangi"
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition ${
                  errors.title ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Penulis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Contoh: Andrea Hirata"
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition ${
                  errors.author ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.author && (
                <p className="text-red-500 text-sm mt-1">{errors.author}</p>
              )}
            </div>

            {/* Publisher & Year */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Penerbit
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  placeholder="Contoh: Bentang Pustaka"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tahun Terbit
                </label>
                <input
                  type="number"
                  name="year_published"
                  value={formData.year_published}
                  onChange={handleChange}
                  placeholder="Contoh: 2005"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                ISBN
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="Contoh: 978-979-1227-00-2"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Jelaskan tentang buku ini..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Condition & Price */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kondisi & Harga</h2>

          <div className="grid gap-4">
            {/* Book Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipe Buku <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex-1">
                  <input
                    type="radio"
                    name="book_type"
                    value="new"
                    checked={formData.book_type === "new"}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 rounded-xl cursor-pointer transition peer-checked:border-teal-500 peer-checked:bg-teal-50 border-gray-200 hover:border-gray-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">✨</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Baru</p>
                        <p className="text-xs text-gray-500">Buku baru, belum pernah dipakai</p>
                      </div>
                    </div>
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    name="book_type"
                    value="used"
                    checked={formData.book_type === "used"}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 rounded-xl cursor-pointer transition peer-checked:border-teal-500 peer-checked:bg-teal-50 border-gray-200 hover:border-gray-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📚</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Bekas</p>
                        <p className="text-xs text-gray-500">Buku second/preloved</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Condition Grade (only for used books) */}
            {formData.book_type === "used" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kondisi Buku <span className="text-red-500">*</span>
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CONDITION_OPTIONS.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="condition_grade"
                        value={option.value}
                        checked={formData.condition_grade === option.value}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="p-3 border-2 rounded-xl cursor-pointer transition peer-checked:border-teal-500 peer-checked:bg-teal-50 border-gray-200 hover:border-gray-300">
                        <p className="font-semibold text-gray-900 text-sm">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.condition_grade && (
                  <p className="text-red-500 text-sm mt-1">{errors.condition_grade}</p>
                )}
              </div>
            )}

            {/* Price & Stock */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Contoh: 45000"
                  min="1000"
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition ${
                    errors.price ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Stok <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Contoh: 10"
                  min="0"
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition ${
                    errors.stock ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/seller/books"
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-semibold transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
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
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Simpan Buku
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
