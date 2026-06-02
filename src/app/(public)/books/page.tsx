"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  catalogService,
  Book,
  BookCategory,
  BookFilters,
  getCategoryIcon,
} from "@/services/catalogService";
import BookCard, { BookCardSkeleton } from "@/components/catalog/BookCard";

type ViewMode = "grid" | "list";
type SortOption = "newest" | "popular" | "cheapest" | "expensive" | "rating";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Terlaris" },
  { value: "cheapest", label: "Termurah" },
  { value: "expensive", label: "Termahal" },
  { value: "rating", label: "Rating Tertinggi" },
];

function BooksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<ViewMode>("grid");

  // Filter states (from URL)
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const bookType = searchParams.get("book_type") || "";
  const sort = (searchParams.get("sort") as SortOption) || "newest";
  const page = parseInt(searchParams.get("page") || "1");

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`/books?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("/books");
  };

  const hasActiveFilters = !!(category || bookType || search);

  // Fetch categories once
  useEffect(() => {
    catalogService
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Fetch books when filters change
  useEffect(() => {
    setLoading(true);
    setError("");

    const filters: BookFilters = {
      search: search || undefined,
      category: category || undefined,
      book_type: (bookType as any) || undefined,
      sort,
      page,
      limit: 12,
    };

    catalogService
      .getBooks(filters)
      .then((res) => {
        setBooks(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      })
      .catch((err) => {
        console.error("Failed to fetch books:", err);
        setError(
          err.response?.data?.message ||
            "Gagal memuat daftar buku. Silakan coba lagi."
        );
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, [search, category, bookType, sort, page]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {search ? `Hasil "${search}"` : "Jelajahi Buku"}
              </h1>
              <p className="text-gray-500">
                {loading
                  ? "Memuat..."
                  : `${total.toLocaleString("id-ID")} buku ditemukan`}
              </p>
            </div>

            {/* Search Bar */}
            <SearchBar
              defaultValue={search}
              onSearch={(v) => updateFilter("search", v)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Filter</h2>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Kategori
                </h3>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => updateFilter("category", null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      !category
                        ? "bg-teal-50 text-teal-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-2">
                      Tidak ada kategori
                    </p>
                  )}
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter("category", cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        category === cat.slug
                          ? "bg-teal-50 text-teal-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base">{getCategoryIcon(cat)}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Type */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Tipe Buku
                </h3>
                <div className="space-y-2">
                  <FilterRadio
                    name="book_type"
                    value=""
                    label="Semua"
                    checked={!bookType}
                    onChange={() => updateFilter("book_type", null)}
                  />
                  <FilterRadio
                    name="book_type"
                    value="new"
                    label="Buku Baru"
                    checked={bookType === "new"}
                    onChange={() => updateFilter("book_type", "new")}
                  />
                  <FilterRadio
                    name="book_type"
                    value="used"
                    label="Buku Bekas"
                    checked={bookType === "used"}
                    onChange={() => updateFilter("book_type", "used")}
                  />
                </div>
              </div>

              {/* Coming Soon */}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">
                  Filter harga, kondisi, dan rating
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Segera hadir</p>
              </div>
            </div>
          </aside>

          {/* Books Grid/List */}
          <div className="lg:col-span-9">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4 flex items-center justify-between gap-3">
              {/* Sort */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-gray-500 hidden sm:block flex-shrink-0">
                  Urutkan:
                </span>
                <select
                  value={sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded transition ${
                    view === "grid"
                      ? "bg-white shadow-sm text-teal-600"
                      : "text-gray-500"
                  }`}
                  title="Grid View"
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
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded transition ${
                    view === "list"
                      ? "bg-white shadow-sm text-teal-600"
                      : "text-gray-500"
                  }`}
                  title="List View"
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-4"
                }
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <BookCardSkeleton key={i} view={view} />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-white rounded-2xl border border-red-100 p-12 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-teal-50 text-teal-700 px-6 py-2 rounded-xl font-semibold hover:bg-teal-100 transition mt-2"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && books.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Tidak ada buku ditemukan
                </h3>
                <p className="text-gray-500 mb-6">
                  Coba ubah filter atau kata kunci pencarian
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="bg-teal-50 text-teal-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-100 transition"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}

            {/* Books */}
            {!loading && !error && books.length > 0 && (
              <>
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "flex flex-col gap-4"
                  }
                >
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} view={view} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => updateFilter("page", String(p))}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterRadio({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function SearchBar({
  defaultValue,
  onSearch,
}: {
  defaultValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim() || "");
      }}
      className="relative w-full sm:w-80"
    >
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari judul, penulis, atau ISBN..."
        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            onSearch("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
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
      )}
    </form>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        ← Sebelumnya
      </button>
      {pages.map((p, i) =>
        typeof p === "number" ? (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            className={`min-w-[40px] h-10 rounded-lg text-sm font-semibold transition ${
              p === currentPage
                ? "bg-teal-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ) : (
          <span key={i} className="px-2 text-gray-400">
            {p}
          </span>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Selanjutnya →
      </button>
    </div>
  );
}

// Loading fallback for Suspense
function BooksPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

// Export with Suspense wrapper
export default function BooksPage() {
  return (
    <Suspense fallback={<BooksPageLoading />}>
      <BooksPageContent />
    </Suspense>
  );
}
