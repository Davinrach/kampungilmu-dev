"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import {
  orderService,
  Order,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/services/orderService";
import { formatPrice, PLACEHOLDER_IMAGE } from "@/services/catalogService";

type TabType = "all" | "pending" | "processing" | "shipped" | "completed";

function SellerOrdersContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialStatus = (searchParams.get("status") as TabType) || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(initialStatus);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      // This would ideally be a seller-specific endpoint
      // For now, we'll use the general orders endpoint
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => {
          if (activeTab === "pending") return o.status === "paid";
          if (activeTab === "processing") return o.status === "confirmed";
          if (activeTab === "shipped")
            return o.status === "shipped" || o.status === "delivered";
          if (activeTab === "completed")
            return o.status === "completed" || o.status === "cancelled";
          return true;
        });

  const handleConfirmOrder = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      await orderService.sellerConfirmOrder(orderId);
      toast.success("Pesanan dikonfirmasi");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengkonfirmasi pesanan");
    } finally {
      setProcessingOrder(null);
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: orders.length },
    {
      key: "pending",
      label: "Perlu Dikonfirmasi",
      count: orders.filter((o) => o.status === "paid").length,
    },
    {
      key: "processing",
      label: "Diproses",
      count: orders.filter((o) => o.status === "confirmed").length,
    },
    {
      key: "shipped",
      label: "Dikirim",
      count: orders.filter(
        (o) => o.status === "shipped" || o.status === "delivered"
      ).length,
    },
    {
      key: "completed",
      label: "Selesai",
      count: orders.filter(
        (o) => o.status === "completed" || o.status === "cancelled"
      ).length,
    },
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-gray-500">Kelola pesanan dari pelanggan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
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
            Tidak Ada Pesanan
          </h2>
          <p className="text-gray-500">
            {activeTab === "all"
              ? "Belum ada pesanan masuk"
              : `Tidak ada pesanan dengan status ini`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              {/* Order Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.order_number || `#${order.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${getOrderStatusColor(
                    order.status
                  )}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              {/* Order Items */}
              <div className="px-5 py-4">
                <div className="space-y-3">
                  {order.items?.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-18 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.cover_photo || PLACEHOLDER_IMAGE}
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
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {item.title || "Buku"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{order.items.length - 2} item lainnya
                    </p>
                  )}
                </div>
              </div>

              {/* Order Footer */}
              <div className="px-5 py-4 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm text-gray-500">Total Pesanan</p>
                  <p className="font-bold text-gray-900">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                  >
                    Detail
                  </Link>
                  {order.status === "paid" && (
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={processingOrder === order.id}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50"
                    >
                      {processingOrder === order.id ? "Memproses..." : "Konfirmasi"}
                    </button>
                  )}
                  {order.status === "confirmed" && (
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition">
                      Input Resi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <SellerOrdersContent />
    </Suspense>
  );
}
