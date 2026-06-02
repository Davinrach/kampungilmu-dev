"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  catalogService,
  Book,
  formatPrice,
  getConditionLabel,
  getConditionColor,
  getAllPhotoUrls,
  getCategoryIcon,
  PLACEHOLDER_IMAGE,
} from "@/services/catalogService";
import BookCard from "@/components/catalog/BookCard";
import BookReviews from "@/components/reviews/BookReviews";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [book, setBook] = useState<Book | null>(null);
  const [related, setRelated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    catalogService
      .getBook(id)
      .then((bookData) => {
        setBook(bookData);
        setActivePhoto(0);
        if (bookData?.category_id) {
          // Fetch related books from same category
          catalogService
            .getBooksByCategory(bookData.category_id, bookData.id, 4)
            .then(setRelated)
            .catch(() => setRelated([]));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch book:", err);
        setBook(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning("Silakan login untuk menambahkan ke keranjang");
      router.push("/login");
      return;
    }
    if (!book) return;

    setAddingToCart(true);
    try {
      await addItem(book.id, quantity);
      toast.success(`${book.title} ditambahkan ke keranjang (${quantity}x)`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Gagal menambahkan ke keranjang"
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.warning("Silakan login untuk melanjutkan pembelian");
      router.push("/login");
      return;
    }
    if (!book) return;

    // Add to cart first, then redirect to cart page
    setAddingToCart(true);
    try {
      await addItem(book.id, quantity);
      router.push("/cart");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Gagal melanjutkan pembelian"
      );
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <BookDetailSkeleton />;
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Buku tidak ditemukan
          </h1>
          <p className="text-gray-500 mb-6">
            Buku yang Anda cari mungkin sudah dihapus atau tidak tersedia.
          </p>
          <Link
            href="/books"
            className="inline-block bg-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-600 transition"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = book.stock === 0;
  const photoUrls = getAllPhotoUrls(book);
  const rating = book.rating ?? 0;
  const totalReviews = book.total_reviews ?? 0;
  const totalSold = book.total_sold ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-teal-600">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/books" className="hover:text-teal-600">
            Buku
          </Link>
          {book.category && (
            <>
              <span>/</span>
              <Link
                href={`/books?category=${book.category.slug}`}
                className="hover:text-teal-600"
              >
                {book.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-xs">
            {book.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 mb-8">
          {/* Photos */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-20">
              {/* Main Photo */}
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-3">
                <img
                  src={photoUrls[activePhoto]}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== PLACEHOLDER_IMAGE) {
                      img.src = PLACEHOLDER_IMAGE;
                    }
                  }}
                />
              </div>

              {/* Thumbnails */}
              {photoUrls.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {photoUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhoto(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                        idx === activePhoto
                          ? "border-teal-500 ring-2 ring-teal-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${book.title} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src !== PLACEHOLDER_IMAGE) {
                            img.src = PLACEHOLDER_IMAGE;
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {book.category && (
                  <Link
                    href={`/books?category=${book.category.slug}`}
                    className="text-xs font-bold text-teal-600 uppercase tracking-wider hover:underline"
                  >
                    {getCategoryIcon(book.category)} {book.category.name}
                  </Link>
                )}
                <span className="text-gray-300">•</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    book.book_type === "new"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {book.book_type === "new" ? "Baru" : "Bekas"}
                </span>
                {book.condition_grade && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getConditionColor(
                      book.condition_grade
                    )}`}
                  >
                    {getConditionLabel(book.condition_grade)}
                  </span>
                )}
              </div>

              {/* Title & Author */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {book.title}
              </h1>
              <p className="text-gray-500 mb-4">
                oleh{" "}
                <span className="font-semibold text-gray-700">{book.author}</span>
              </p>

              {/* Stats Row */}
              {(rating > 0 || totalSold > 0) && (
                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100 flex-wrap">
                  {rating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-5 h-5 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-gray-900">
                        {rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({totalReviews} review)
                      </span>
                    </div>
                  )}
                  {rating > 0 && totalSold > 0 && (
                    <span className="text-gray-300">|</span>
                  )}
                  {totalSold > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">
                        {totalSold}
                      </span>{" "}
                      terjual
                    </div>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="mb-5">
                <p className="text-xs text-gray-500 mb-1">Harga</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {formatPrice(book.price)}
                </p>
              </div>

              {/* Stock Info */}
              <div className="flex items-center gap-2 mb-5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOutOfStock
                      ? "bg-red-500"
                      : book.stock < 5
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                ></span>
                <span className="text-sm text-gray-700">
                  {isOutOfStock ? (
                    <span className="text-red-600 font-semibold">Stok habis</span>
                  ) : book.stock < 5 ? (
                    <span>
                      Tersisa{" "}
                      <span className="font-bold text-yellow-600">
                        {book.stock}
                      </span>{" "}
                      stok lagi
                    </span>
                  ) : (
                    <span>
                      Stok tersedia:{" "}
                      <span className="font-bold">{book.stock}</span>
                    </span>
                  )}
                </span>
              </div>

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Jumlah
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-xl disabled:opacity-30 disabled:cursor-not-allowed"
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
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(Math.max(1, Math.min(book.stock, val)));
                        }}
                        className="w-14 text-center bg-transparent text-gray-900 font-semibold focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          setQuantity(Math.min(book.stock, quantity + 1))
                        }
                        disabled={quantity >= book.stock}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-xl disabled:opacity-30 disabled:cursor-not-allowed"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      Maksimal {book.stock} buku
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingToCart}
                  className="flex items-center justify-center gap-2 border-2 border-teal-500 text-teal-600 py-3 rounded-xl font-semibold hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? (
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
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  )}
                  + Keranjang
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Beli Sekarang
                </button>
              </div>

              {/* Chat with Seller Button */}
              {book.seller_id && (
                <Link
                  href={`/chat?seller_id=${book.seller_id}`}
                  className="mt-3 flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Chat dengan Seller
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Deskripsi Buku
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.description || "Tidak ada deskripsi."}
              </p>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Spesifikasi
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {book.category && (
                  <SpecItem label="Kategori" value={book.category.name} />
                )}
                <SpecItem label="Penulis" value={book.author} />
                {book.publisher && (
                  <SpecItem label="Penerbit" value={book.publisher} />
                )}
                {book.year_published && (
                  <SpecItem
                    label="Tahun Terbit"
                    value={String(book.year_published)}
                  />
                )}
                <SpecItem
                  label="Tipe"
                  value={book.book_type === "new" ? "Baru" : "Bekas"}
                />
                {book.condition_grade && (
                  <SpecItem
                    label="Kondisi"
                    value={getConditionLabel(book.condition_grade)}
                  />
                )}
                {book.isbn && <SpecItem label="ISBN" value={book.isbn} />}
                <SpecItem label="Stok" value={String(book.stock)} />
              </div>
            </div>

            {/* Seller Info */}
            {book.seller && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                  Informasi Penjual
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {book.seller.store_photo ? (
                      <img
                        src={book.seller.store_photo}
                        alt={book.seller.store_name || "Seller"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {(book.seller.store_name || "S").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {book.seller.store_name || "Seller"}
                    </p>
                    {(book.seller.city || book.seller.province) && (
                      <p className="text-sm text-gray-500 truncate">
                        {[book.seller.city, book.seller.province]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {book.seller.rating !== undefined && book.seller.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          className="w-4 h-4 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {book.seller.rating.toFixed(1)}
                        </span>
                        {book.seller.total_reviews !== undefined && (
                          <span className="text-xs text-gray-500">
                            ({book.seller.total_reviews} review)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/chat?seller_id=${book.seller_id}`}
                    className="flex items-center gap-2 px-4 py-2 border border-teal-500 text-teal-600 rounded-xl text-sm font-semibold hover:bg-teal-50 transition"
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Chat
                  </Link>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <BookReviews bookId={id} />
          </div>
        </div>

        {/* Related Books */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Buku Serupa
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 truncate ml-2">
        {value}
      </span>
    </div>
  );
}

function BookDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-3"></div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-200 rounded-xl"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
