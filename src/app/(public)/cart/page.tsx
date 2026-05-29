"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import {
  formatPrice,
  getPrimaryPhoto,
  PLACEHOLDER_IMAGE,
  Book,
} from "@/services/catalogService";
import { CartItem } from "@/services/cartService";

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const {
    items,
    subtotal,
    totalItems,
    loading,
    error,
    initialized,
    fetchCart,
    updateItem,
    removeItem,
    clearCart,
  } = useCartStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auth guard
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Fetch cart on mount
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      fetchCart();
    }
  }, [hasHydrated, isAuthenticated, fetchCart]);

  // Default: select all items
  useEffect(() => {
    if (items.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }, [items]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const selectedSubtotal = selectedItems.reduce((sum, item) => {
    const price = item.book?.price ?? item.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleUpdateQty = async (itemId: string, newQty: number, maxStock: number) => {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      toast.warning(`Maksimal ${maxStock} buku tersedia`);
      return;
    }
    try {
      await updateItem(itemId, newQty);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui jumlah");
    }
  };

  const handleRemove = async (itemId: string, title: string) => {
    if (!confirm(`Hapus "${title}" dari keranjang?`)) return;
    try {
      await removeItem(itemId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      toast.success("Item dihapus dari keranjang");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus item");
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Hapus ${selectedItems.length} item dari keranjang?`)) return;

    try {
      await Promise.all(selectedItems.map((item) => removeItem(item.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedItems.length} item dihapus`);
    } catch (err: any) {
      toast.error("Sebagian item gagal dihapus");
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.warning("Pilih minimal 1 item untuk checkout");
      return;
    }
    // Pass selected cart item IDs via query string
    const ids = selectedItems.map((item) => item.id).join(",");
    router.push(`/checkout?items=${ids}`);
  };

  // Loading state
  if (!hasHydrated || (loading && !initialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Keranjang Saya
          </h1>
          <p className="text-gray-500">
            {totalItems > 0
              ? `${totalItems} item di keranjang`
              : "Keranjang Anda kosong"}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl border border-red-100 p-6 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
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
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">
                Gagal memuat keranjang
              </p>
              <p className="text-sm text-gray-600 mb-3">{error}</p>
              <button
                onClick={fetchCart}
                className="text-sm bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-semibold hover:bg-teal-100"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 sm:p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Keranjang Anda kosong
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Belum ada buku di keranjang. Yuk mulai jelajahi koleksi buku kami.
            </p>
            <Link
              href="/books"
              className="inline-block bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200"
            >
              Mulai Belanja
            </Link>
          </div>
        )}

        {/* Cart Layout */}
        {!loading && !error && items.length > 0 && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Bulk Action Bar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between sticky top-20 z-10">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Pilih semua ({selectedIds.size}/{items.length})
                  </span>
                </label>

                {selectedIds.size > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Hapus ({selectedIds.size})
                  </button>
                )}
              </div>

              {/* Cart Items */}
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onUpdateQty={handleUpdateQty}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-20">
                <h2 className="font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Item dipilih</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCount} buku
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(selectedSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Ongkir</span>
                    <span className="text-gray-400">Hitung saat checkout</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-semibold text-gray-700">
                    Total
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(selectedSubtotal)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout ({selectedItems.length} item)
                </button>

                <Link
                  href="/books"
                  className="block w-full mt-3 text-center text-sm text-teal-600 hover:text-teal-700 font-semibold"
                >
                  + Lanjut Belanja
                </Link>

                {/* Info */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-3 text-xs text-gray-500">
                    <svg
                      className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p>
                      Pembayaran aman dengan sistem escrow. Dana hanya
                      diteruskan ke seller setelah barang diterima.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== CART ITEM CARD ==============

function CartItemCard({
  item,
  selected,
  onToggleSelect,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  selected: boolean;
  onToggleSelect: () => void;
  onUpdateQty: (id: string, qty: number, maxStock: number) => void;
  onRemove: (id: string, title: string) => void;
}) {
  const book = item.book;
  const price = book?.price ?? item.price ?? 0;
  const stock = book?.stock ?? 0;
  const photo = book ? getPrimaryPhoto(book) : PLACEHOLDER_IMAGE;
  const isOutOfStock = stock === 0;

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-4 transition ${
        selected
          ? "border-teal-500 shadow-sm"
          : "border-gray-100 hover:border-gray-200"
      } ${isOutOfStock ? "opacity-60" : ""}`}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={isOutOfStock}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
          />
        </div>

        {/* Photo */}
        <Link
          href={`/books/${item.book_id}`}
          className="w-20 h-28 sm:w-24 sm:h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0"
        >
          <img
            src={photo}
            alt={book?.title || "Buku"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== PLACEHOLDER_IMAGE) img.src = PLACEHOLDER_IMAGE;
            }}
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link
              href={`/books/${item.book_id}`}
              className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 hover:text-teal-600 transition"
            >
              {book?.title || "Buku tidak tersedia"}
            </Link>
            <button
              onClick={() => onRemove(item.id, book?.title || "Buku ini")}
              className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 transition"
              title="Hapus"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {book?.author && (
            <p className="text-xs text-gray-500 mb-1">oleh {book.author}</p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {book?.book_type && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  book.book_type === "new"
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {book.book_type === "new" ? "Baru" : "Bekas"}
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                Stok Habis
              </span>
            )}
            {!isOutOfStock && stock < 5 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                Stok terbatas: {stock}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 flex-wrap">
            <p className="text-base sm:text-lg font-bold text-gray-900">
              {formatPrice(price)}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl">
              <button
                onClick={() =>
                  onUpdateQty(item.id, item.quantity - 1, stock)
                }
                disabled={item.quantity <= 1 || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-xl disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <span className="w-10 text-center text-sm font-semibold text-gray-900">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  onUpdateQty(item.id, item.quantity + 1, stock)
                }
                disabled={item.quantity >= stock || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-xl disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
