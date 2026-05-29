"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import {
  orderService,
  Order,
  getOrderStatusLabel,
  getOrderStatusColor,
  formatPaymentMethodLabel,
} from "@/services/orderService";
import {
  formatPrice,
  PLACEHOLDER_IMAGE,
} from "@/services/catalogService";
import { openSnapPayment } from "@/lib/midtrans";
import OrderTimeline from "@/components/orders/OrderTimeline";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import ConfirmReceiptModal from "@/components/orders/ConfirmReceiptModal";
import ShippingTrackingModal from "@/components/orders/ShippingTrackingModal";
import { ShippingProgress, EstimatedDelivery } from "@/components/orders/ShippingStatusBadge";
import ReviewFormModal from "@/components/reviews/ReviewFormModal";
import DisputeFormModal from "@/components/disputes/DisputeFormModal";
import DisputeDetailModal from "@/components/disputes/DisputeDetailModal";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDisputeDetailModal, setShowDisputeDetailModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<{
    bookId: string;
    bookTitle: string;
    bookCover?: string;
  } | null>(null);

  const id = params.id as string;

  // Fetch order
  const fetchOrder = useCallback(async () => {
    try {
      const orderData = await orderService.getOrder(id);
      setOrder(orderData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat pesanan");
    }
  }, [id]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [hasHydrated, isAuthenticated, fetchOrder, router]);

  // Auto-refresh for pending payment orders (poll every 10s)
  useEffect(() => {
    if (!order || order.status !== "pending_payment") return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);
    return () => clearInterval(interval);
  }, [order?.status, fetchOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
    toast.success("Status diperbarui");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin");
  };

  const handlePayNow = async () => {
    if (!order) return;
    const snapToken = order.payment?.payment_url
      ? extractSnapToken(order.payment.payment_url)
      : undefined;

    setPaying(true);

    if (snapToken) {
      try {
        await openSnapPayment(snapToken, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil!");
            fetchOrder();
            setPaying(false);
          },
          onPending: () => {
            toast.info("Pembayaran sedang diproses...");
            fetchOrder();
            setPaying(false);
          },
          onError: () => {
            toast.error("Pembayaran gagal");
            setPaying(false);
          },
          onClose: () => {
            toast.info("Pembayaran ditunda");
            setPaying(false);
          },
        });
      } catch (err) {
        if (order.payment?.payment_url) {
          window.location.href = order.payment.payment_url;
        } else {
          toast.error("Gagal membuka pembayaran");
          setPaying(false);
        }
      }
    } else if (order.payment?.payment_url) {
      window.location.href = order.payment.payment_url;
    } else {
      toast.error("Link pembayaran tidak tersedia");
      setPaying(false);
    }
  };

  // Extract Midtrans snap token from URL pattern:
  // https://app.sandbox.midtrans.com/snap/v3/redirect/<TOKEN>
  function extractSnapToken(url: string): string | undefined {
    const match = url.match(/\/snap\/v[34]\/redirect\/([^/?#]+)/);
    return match?.[1];
  }

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-500"
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Pesanan Tidak Ditemukan
          </h1>
          <p className="text-gray-500 mb-6">
            {error || "Pesanan yang Anda cari tidak ditemukan"}
          </p>
          <Link
            href="/orders"
            className="inline-block bg-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-600"
          >
            Lihat Semua Pesanan
          </Link>
        </div>
      </div>
    );
  }

  const fulfillmentMethod = order.fulfillment_method;
  const canCancel = order.status === "pending_payment";
  const canConfirmReceipt =
    fulfillmentMethod === "delivery" &&
    (order.status === "shipped" || order.status === "delivered");
  const canReview = order.status === "completed";
  // Can file dispute for delivered/shipped/completed orders (within reasonable time)
  const canDispute = ["shipped", "delivered", "completed"].includes(order.status);

  const handleOpenReview = (item: {
    book_id: string;
    title?: string;
    cover_photo?: string;
  }) => {
    setReviewingItem({
      bookId: item.book_id,
      bookTitle: item.title || "Buku",
      bookCover: item.cover_photo,
    });
    setShowReviewModal(true);
  };

  const handleCloseReview = (submitted?: boolean) => {
    setShowReviewModal(false);
    setReviewingItem(null);
    if (submitted) {
      // Optionally refresh order to update review status
      fetchOrder();
    }
  };

  const handleOpenDispute = () => {
    setShowDisputeModal(true);
  };

  const handleCloseDispute = (submitted?: boolean) => {
    setShowDisputeModal(false);
    if (submitted) {
      toast.success("Komplain berhasil diajukan");
      fetchOrder();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Breadcrumb */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mb-3"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali ke Pesanan
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Nomor Pesanan</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {order.order_number || `#${order.id.slice(0, 8)}`}
              </h1>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition disabled:opacity-50"
                title="Refresh status"
              >
                <svg
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${getOrderStatusColor(
                  order.status
                )}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Pending Payment */}
          {order.status === "pending_payment" && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">
                    Menunggu Pembayaran
                  </p>
                  <p className="text-sm text-yellow-800 mb-3">
                    Selesaikan pembayaran dalam 24 jam atau pesanan akan
                    dibatalkan otomatis.
                  </p>
                  {order.payment?.payment_url && (
                    <button
                      onClick={handlePayNow}
                      disabled={paying}
                      className="inline-flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                      {paying ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4"
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
                          Membuka...
                        </>
                      ) : (
                        <>Bayar Sekarang →</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pickup Code (for local_pickup orders) */}
          {fulfillmentMethod === "local_pickup" && order.pickup_code && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 mt-4">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
                Kode Pickup O2O
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-3xl font-bold text-teal-700 tracking-[0.3em] font-mono">
                  {order.pickup_code}
                </p>
                <button
                  onClick={() => handleCopyCode(order.pickup_code!)}
                  className="px-3 py-2 bg-white text-teal-700 rounded-lg text-sm font-semibold hover:bg-teal-50 border border-teal-200"
                >
                  Salin
                </button>
              </div>
              <p className="text-xs text-teal-700 mt-2">
                Tunjukkan kode ini saat ambil pesanan di lokasi seller
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="mb-4">
          <OrderTimeline
            status={order.status}
            fulfillmentMethod={fulfillmentMethod}
          />
        </div>

        {/* Action Buttons */}
        {(canCancel || canConfirmReceipt || canDispute) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Aksi</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {canConfirmReceipt && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-md"
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Konfirmasi Terima
                </button>
              )}
              {canDispute && (
                <button
                  onClick={handleOpenDispute}
                  className="flex items-center justify-center gap-2 border-2 border-orange-200 text-orange-600 py-3 rounded-xl font-semibold hover:bg-orange-50 transition"
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Ajukan Komplain
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Batalkan Pesanan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">
            Item Pesanan ({order.items?.length || 0})
          </h2>
          <div className="space-y-3">
            {order.items?.map((item) => {
              const photo = item.cover_photo || PLACEHOLDER_IMAGE;
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={photo}
                      alt={item.title || ""}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src !== PLACEHOLDER_IMAGE)
                          img.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/books/${item.book_id}`}
                      className="font-semibold text-gray-900 text-sm hover:text-teal-600"
                    >
                      {item.title || "Buku"}
                    </Link>
                    {item.author && (
                      <p className="text-xs text-gray-500">oleh {item.author}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                    {/* Review Button for completed orders */}
                    {canReview && (
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-semibold rounded-lg hover:from-yellow-500 hover:to-amber-600 transition shadow-sm"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.187l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.566 7.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Beri Ulasan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Delivery Info */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">Informasi Pengiriman</h2>
          
          {/* Shipping Progress for shipped/delivered orders */}
          {fulfillmentMethod === "delivery" && 
           (order.status === "shipped" || order.status === "delivered") && 
           order.shipping?.status && (
            <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <ShippingProgress status={order.shipping.status} />
            </div>
          )}

          <div className="space-y-3 text-sm">
            <InfoRow
              label="Metode"
              value={fulfillmentMethod === "local_pickup" ? "Pickup di Tempat" : "Kurir"}
            />
            {fulfillmentMethod === "delivery" && order.shipping?.courier_name && (
              <>
                <InfoRow
                  label="Kurir"
                  value={`${order.shipping.courier_name} - ${order.shipping.courier_service || ""}`}
                />
                {order.shipping.tracking_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Resi</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900">
                        {order.shipping.tracking_number}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.shipping!.tracking_number!);
                          toast.success("Nomor resi disalin");
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        title="Salin resi"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Shipping Status */}
                {order.shipping.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status Pengiriman</span>
                    <span className="font-semibold text-blue-600">{order.shipping.status}</span>
                  </div>
                )}

                {/* Track Shipment Button */}
                {order.shipping.biteship_order_id && (
                  <div className="pt-3">
                    <button
                      onClick={() => setShowTrackingModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Lacak Pengiriman Real-time
                    </button>
                  </div>
                )}
              </>
            )}
            {order.address && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Alamat Pengiriman</p>
                <p className="font-semibold text-gray-900">
                  {order.address.recipient_name} • {order.address.phone}
                </p>
                <p className="text-gray-600 mt-1">{order.address.full_address}</p>
                <p className="text-gray-600">
                  {order.address.city} {order.address.postal_code}
                </p>
              </div>
            )}
            {order.note && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Catatan</p>
                <p className="text-gray-700 italic">{order.note}</p>
              </div>
            )}
          </div>
        </section>

        {/* Payment Info */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">Detail Pembayaran</h2>
          <div className="space-y-2.5 text-sm">
            <InfoRow label="Subtotal" value={formatPrice(order.subtotal_amount)} />
            <InfoRow
              label="Ongkir"
              value={
                order.shipping_cost > 0
                  ? formatPrice(order.shipping_cost)
                  : "Gratis"
              }
            />
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(order.total_amount)}
              </span>
            </div>
            {order.payment?.method && (
              <InfoRow
                label="Metode Pembayaran"
                value={formatPaymentMethodLabel(
                  order.payment.method,
                  order.payment.channel
                )}
              />
            )}
            {order.payment?.paid_at && (
              <InfoRow
                label="Dibayar pada"
                value={new Date(order.payment.paid_at).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              />
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showCancelModal && (
        <CancelOrderModal
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            fetchOrder();
          }}
        />
      )}

      {showConfirmModal && (
        <ConfirmReceiptModal
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setShowConfirmModal(false)}
          onSuccess={() => {
            setShowConfirmModal(false);
            fetchOrder();
          }}
        />
      )}

      {showReviewModal && reviewingItem && (
        <ReviewFormModal
          orderId={order.id}
          bookId={reviewingItem.bookId}
          bookTitle={reviewingItem.bookTitle}
          bookCover={reviewingItem.bookCover}
          onClose={handleCloseReview}
        />
      )}

      {showDisputeModal && order.seller && (
        <DisputeFormModal
          orderId={order.id}
          orderNumber={order.order_number}
          sellerId={order.seller.id}
          sellerName={order.seller.shop_name}
          onClose={handleCloseDispute}
        />
      )}

      {showTrackingModal && order.shipping?.biteship_order_id && (
        <ShippingTrackingModal
          biteshipOrderId={order.shipping.biteship_order_id}
          trackingNumber={order.shipping.tracking_number}
          courierName={order.shipping.courier_name}
          onClose={() => setShowTrackingModal(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}
