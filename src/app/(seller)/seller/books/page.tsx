"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { sellerService, SellerBook } from "@/services/sellerService";
import { formatPrice, PLACEHOLDER_IMAGE } from "@/services/catalogService";

export default function SellerBooksPage() {
  const toast = useToast();
  const [books, setBooks] = useState<SellerBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<{ id: string; stock: number } | null>(null);

  const fetchBooks = async () => {
    try {
      const data = await sellerService.getMyBooks();
      setBooks(data);
    } catch (err: any) {
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && book.is_active) ||
      (filter === "inactive" && !book.is_active);
    const matchesSearch =
      search === "" ||
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleToggleStatus = async (bookId: string) => {
    setTogglingId(bookId);
    try {
      await sellerService.toggleBookStatus(bookId);
      toast.success("Status buku berhasil diubah");
      fetchBooks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;
    try {
      await sellerService.updateStock(editingStock.id, editingStock.stock);
      toast.success("Stok berhasil diperbarui");
      setEditingStock(null);
      fetchBooks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui stok");
    }
  };

  const handleDelete = async (bookId: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus "${title}"?`)) return;

    setDeletingId(bookId);
    try {
      await sellerService.deleteBook(bookId);
      toast.success("Buku berhasil dihapus");
      fetchBooks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus buku");
    } finally {
      setDeletingId(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Buku</h1>
          <p className="text-gray-500">Kelola buku yang Anda jual</p>
        </div>
        <Link
          href="/seller/books/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Buku
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau penulis..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              { key: "all", label: "Semua" },
              { key: "active", label: "Aktif" },
              { key: "inactive", label: "Nonaktif" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                  filter === tab.key
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Buku</p>
          <p className="text-2xl font-bold text-gray-900">{books.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Aktif</p>
          <p className="text-2xl font-bold text-green-600">
            {books.filter((b) => b.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Nonaktif</p>
          <p className="text-2xl font-bold text-gray-400">
            {books.filter((b) => !b.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Terjual</p>
          <p className="text-2xl font-bold text-purple-600">
            {books.reduce((sum, b) => sum + b.total_sold, 0)}
          </p>
        </div>
      </div>

      {/* Books List */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {search || filter !== "all" ? "Tidak Ada Hasil" : "Belum Ada Buku"}
          </h2>
          <p className="text-gray-500 mb-4">
            {search || filter !== "all"
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Mulai jual buku pertama Anda"}
          </p>
          {!search && filter === "all" && (
            <Link
              href="/seller/books/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Buku
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`bg-white rounded-2xl border overflow-hidden transition ${
                book.is_active ? "border-gray-100" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="p-4 sm:p-5 flex gap-4">
                {/* Cover */}
                <div className="w-16 h-20 sm:w-20 sm:h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={book.cover_photo || PLACEHOLDER_IMAGE}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src !== PLACEHOLDER_IMAGE) img.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate">{book.title}</h3>
                      <p className="text-sm text-gray-500">{book.author}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${
                        book.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {book.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-teal-600">{formatPrice(book.price)}</span>
                    <span className="text-gray-400">•</span>
                    <span
                      className={`${
                        book.book_type === "new" ? "text-blue-600" : "text-orange-600"
                      }`}
                    >
                      {book.book_type === "new" ? "Baru" : "Bekas"}
                      {book.condition_grade && ` (${book.condition_grade})`}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{book.total_sold} terjual</span>
                  </div>

                  {/* Stock */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Stok:</span>
                    {editingStock?.id === book.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={editingStock.stock}
                          onChange={(e) =>
                            setEditingStock({
                              ...editingStock,
                              stock: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleUpdateStock}
                          className="px-2 py-1 bg-teal-500 text-white text-xs font-semibold rounded-lg hover:bg-teal-600"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingStock(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-300"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingStock({ id: book.id, stock: book.stock })}
                        className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                          book.stock === 0
                            ? "bg-red-100 text-red-700"
                            : book.stock <= 5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        } hover:opacity-80`}
                      >
                        {book.stock} {book.stock === 0 && "(Habis)"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleToggleStatus(book.id)}
                  disabled={togglingId === book.id}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                    book.is_active
                      ? "text-gray-600 hover:bg-gray-200"
                      : "text-teal-600 hover:bg-teal-50"
                  } disabled:opacity-50`}
                >
                  {togglingId === book.id
                    ? "..."
                    : book.is_active
                    ? "Nonaktifkan"
                    : "Aktifkan"}
                </button>
                <Link
                  href={`/seller/books/${book.id}/edit`}
                  className="px-3 py-1.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 rounded-lg transition"
                >
                  Edit
                </Link>
                <Link
                  href={`/books/${book.id}`}
                  target="_blank"
                  className="px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
                >
                  Lihat
                </Link>
                <button
                  onClick={() => handleDelete(book.id, book.title)}
                  disabled={deletingId === book.id}
                  className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  {deletingId === book.id ? "..." : "Hapus"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
