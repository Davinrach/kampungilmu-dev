"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import {
  orderService,
  Order,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/services/orderService";
import {
  formatPrice,
  getPrimaryPhoto,
  PLACEHOLDER_IMAGE,
} from "@/services/catalogService";
import ShippingTrackingModal from "@/components/orders/ShippingTrackingModal";

const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending_payment", label: "Belum Dibayar" },
  { value: "paid", label: "Dibayar" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "shipped", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function OrdersListPage() {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "all">("all");
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    orderService
      .getOrders()
      .then((data) => {
        // Filter by status if needed (backend may not support status query yet)
        const filtered =
          activeStatus === "all"
            ? data
            : data.filter((o) => o.status === activeStatus);
        setOrders(filtered);
      })
      .catch((err) => {
        console.error("[Orders] Error:", err.response?.data);
        setError(err.response?.data?.message || "Gagal memuat pesanan");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [hasHydrated, isAuthenticated, activeStatus, router]);

  const handleCopyResi = (e: React.MouseEvent, trackingNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Nomor resi disalin!");
  };

  const handleOpenTracking = (e: React.MouseEvent, order: Order) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackingOrder(order);
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Pesanan Saya
          </h1>
          <p className="text-gray-500">Kelola dan pantau pesanan Anda</p>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  activeStatus === tab.value
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 p-12 text-center">
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-teal-100"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 sm:p-16 text-center">
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
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {activeStatus === "all"
                ? "Belum ada pesanan"
                : `Tidak ada pesanan ${getOrderStatusLabel(
                    activeStatus as OrderStatus
                  ).toLowerCase()}`}
            </h2>
            <p className="text-gray-500 mb-6">
              Mulai jelajahi koleksi buku kami
            </p>
            <Link
              href="/books"
              className="inline-block bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200"
            >
              Mulai Belanja
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCopyResi={handleCopyResi}
                onOpenTracking={handleOpenTracking}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingOrder && trackingOrder.shipping?.biteship_order_id && (
        <ShippingTrackingModal
          biteshipOrderId={trackingOrder.shipping.biteship_order_id}
          trackingNumber={trackingOrder.shipping.tracking_number}
          courierName={trackingOrder.shipping.courier_name}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  onCopyResi,
  onOpenTracking,
}: {
  order: Order;
  onCopyResi: (e: React.MouseEvent, trackingNumber: string) => void;
  onOpenTracking: (e: React.MouseEvent, order: Order) => void;
}) {
  const itemCount = order.items?.length ?? 0;
  const firstItem = order.items?.[0];
  const photo =
    firstItem?.cover_photo ||
    (firstItem?.book ? getPrimaryPhoto(firstItem.book) : PLACEHOLDER_IMAGE);
  const itemPrice = firstItem?.price ?? 0;
  const orderTotal = order.total_amount ?? 0;

  const isShipped = order.status === "shipped" || order.status === "delivered";
  const hasTracking = order.shipping?.biteship_order_id;
  const trackingNumber = order.shipping?.tracking_number;

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition overflow-hidden"
    >
      {/* Shipping Banner for shipped orders */}
      {isShipped && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/80">
                {order.status === "shipped" ? "Sedang dalam pengiriman" : "Paket sudah sampai"}
              </p>
              {trackingNumber && (
                <p className="text-sm font-semibold font-mono">{trackingNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trackingNumber && (
              <button
                onClick={(e) => onCopyResi(e, trackingNumber)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                title="Salin resi"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            {hasTracking && (
              <button
                onClick={(e) => onOpenTracking(e, order)}
                className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition"
              >
                Lacak
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {new Date(order.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="font-bold text-gray-900 text-sm">
              {order.order_number || `#${order.id.slice(0, 8)}`}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(
              order.status
            )}`}
          >
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {/* First item preview */}
        {firstItem && (
          <div className="flex gap-3 pb-3 mb-3 border-b border-gray-100">
            <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={photo}
                alt={firstItem.title || ""}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== PLACEHOLDER_IMAGE) img.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                {firstItem.title || "Buku"}
              </p>
              {firstItem.author && (
                <p className="text-xs text-gray-500 line-clamp-1">
                  oleh {firstItem.author}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {firstItem.quantity} × {formatPrice(itemPrice)}
              </p>
              {itemCount > 1 && (
                <p className="text-xs text-teal-600 font-semibold mt-1">
                  +{itemCount - 1} item lainnya
                </p>
              )}
            </div>
          </div>
        )}

        {/* Shipping Info */}
        {order.fulfillment_method === "delivery" && order.shipping?.courier_name && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>
              {order.shipping.courier_name}
              {order.shipping.courier_service && ` - ${order.shipping.courier_service}`}
            </span>
          </div>
        )}

        {order.fulfillment_method === "local_pickup" && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Pickup di Tempat</span>
            {order.pickup_code && (
              <span className="font-mono font-semibold text-teal-600">
                Kode: {order.pickup_code}
              </span>
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Total {itemCount} item
          </span>
          <p className="font-bold text-gray-900">{formatPrice(orderTotal)}</p>
        </div>
      </div>
    </Link>
  );
}
