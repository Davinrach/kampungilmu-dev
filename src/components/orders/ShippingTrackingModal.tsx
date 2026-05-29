"use client";

import { useState, useEffect } from "react";
import { orderService } from "@/services/orderService";

interface TrackingEvent {
  status: string;
  description: string;
  timestamp: string;
  location?: string;
  note?: string;
}

interface TrackingData {
  courier_name?: string;
  courier_service?: string;
  tracking_number?: string;
  waybill_id?: string;
  status?: string;
  shipper?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  destination?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  history?: TrackingEvent[];
  // Biteship specific fields
  courier?: {
    company?: string;
    name?: string;
    phone?: string;
  };
  origin?: {
    address?: string;
  };
}

interface ShippingTrackingModalProps {
  biteshipOrderId: string;
  trackingNumber?: string;
  courierName?: string;
  onClose: () => void;
}

// Courier logo mapping
const COURIER_LOGOS: Record<string, string> = {
  jne: "🟠",
  jnt: "🔴",
  sicepat: "🟡",
  anteraja: "🟢",
  ninja: "⚫",
  pos: "🔵",
  tiki: "🟣",
  wahana: "🟤",
  lion: "🦁",
  default: "📦",
};

export default function ShippingTrackingModal({
  biteshipOrderId,
  trackingNumber,
  courierName,
  onClose,
}: ShippingTrackingModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await orderService.trackShipment(biteshipOrderId);
        setTrackingData(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Gagal memuat informasi tracking. Silakan coba lagi nanti."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [biteshipOrderId]);

  const handleCopyResi = () => {
    const resi = trackingData?.tracking_number || trackingData?.waybill_id || trackingNumber;
    if (resi) {
      navigator.clipboard.writeText(resi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (status: string): { color: string; bgColor: string; icon: string; label: string } => {
    const lower = status.toLowerCase();
    
    if (lower.includes("delivered") || lower.includes("terkirim") || lower.includes("diterima")) {
      return { color: "text-green-600", bgColor: "bg-green-500", icon: "✓", label: "Terkirim" };
    }
    if (lower.includes("transit") || lower.includes("proses") || lower.includes("perjalanan")) {
      return { color: "text-blue-600", bgColor: "bg-blue-500", icon: "🚚", label: "Dalam Perjalanan" };
    }
    if (lower.includes("pickup") || lower.includes("diambil") || lower.includes("picked")) {
      return { color: "text-teal-600", bgColor: "bg-teal-500", icon: "📤", label: "Diambil Kurir" };
    }
    if (lower.includes("hub") || lower.includes("sorting") || lower.includes("warehouse")) {
      return { color: "text-indigo-600", bgColor: "bg-indigo-500", icon: "🏢", label: "Di Gudang" };
    }
    if (lower.includes("out for delivery") || lower.includes("antar")) {
      return { color: "text-purple-600", bgColor: "bg-purple-500", icon: "🛵", label: "Sedang Diantar" };
    }
    if (lower.includes("failed") || lower.includes("gagal")) {
      return { color: "text-red-600", bgColor: "bg-red-500", icon: "✗", label: "Gagal" };
    }
    if (lower.includes("return") || lower.includes("kembali")) {
      return { color: "text-orange-600", bgColor: "bg-orange-500", icon: "↩", label: "Dikembalikan" };
    }
    
    return { color: "text-gray-600", bgColor: "bg-gray-400", icon: "•", label: status };
  };

  const getCourierLogo = (name?: string): string => {
    if (!name) return COURIER_LOGOS.default;
    const lower = name.toLowerCase();
    for (const [key, logo] of Object.entries(COURIER_LOGOS)) {
      if (lower.includes(key)) return logo;
    }
    return COURIER_LOGOS.default;
  };

  // Group history by date
  const groupHistoryByDate = (history: TrackingEvent[]) => {
    const groups: Record<string, TrackingEvent[]> = {};
    history.forEach((event) => {
      const date = new Date(event.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return groups;
  };

  const displayResi = trackingData?.tracking_number || trackingData?.waybill_id || trackingNumber;
  const displayCourier = trackingData?.courier_name || trackingData?.courier?.company || courierName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                {getCourierLogo(displayCourier)}
              </div>
              <div>
                <h2 className="font-bold">Lacak Pengiriman</h2>
                <p className="text-sm text-white/80">{displayCourier || "Kurir"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tracking Number */}
          {displayResi && (
            <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70">Nomor Resi</p>
                <p className="font-mono font-bold text-lg">{displayResi}</p>
              </div>
              <button
                onClick={handleCopyResi}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                {copied ? "Disalin!" : "Salin"}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 text-sm mt-4">Memuat informasi tracking...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-5">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold mb-2">Tidak Dapat Memuat Tracking</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : trackingData ? (
            <div className="p-5 space-y-5">
              {/* Current Status */}
              {trackingData.status && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Status Saat Ini</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getStatusInfo(trackingData.status).bgColor}`}>
                      <span className="text-lg">{getStatusInfo(trackingData.status).icon}</span>
                    </div>
                    <div>
                      <p className={`font-bold ${getStatusInfo(trackingData.status).color}`}>
                        {getStatusInfo(trackingData.status).label}
                      </p>
                      <p className="text-xs text-gray-500">{trackingData.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Destination Info */}
              {trackingData.destination && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold mb-1">Tujuan Pengiriman</p>
                      <p className="font-semibold text-gray-900">{trackingData.destination.name}</p>
                      {trackingData.destination.phone && (
                        <p className="text-sm text-gray-600">{trackingData.destination.phone}</p>
                      )}
                      {trackingData.destination.address && (
                        <p className="text-sm text-gray-500 mt-1">{trackingData.destination.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking History */}
              {trackingData.history && trackingData.history.length > 0 ? (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Riwayat Pengiriman
                  </h3>
                  
                  {Object.entries(groupHistoryByDate(trackingData.history)).map(([date, events], groupIndex) => (
                    <div key={date} className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-3 sticky top-0 bg-white py-1">
                        {formatDateOnly(events[0].timestamp)}
                      </p>
                      <div className="relative pl-6">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200"></div>
                        
                        <div className="space-y-4">
                          {events.map((event, index) => {
                            const statusInfo = getStatusInfo(event.status || event.description);
                            const isFirst = groupIndex === 0 && index === 0;
                            
                            return (
                              <div key={index} className="relative flex gap-4">
                                {/* Timeline dot */}
                                <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isFirst ? statusInfo.bgColor : "bg-gray-200"
                                }`}>
                                  {isFirst ? (
                                    <span className="text-white text-xs">{statusInfo.icon}</span>
                                  ) : (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                
                                {/* Event content */}
                                <div className={`flex-1 ${isFirst ? "" : "opacity-75"}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`font-medium text-sm ${isFirst ? "text-gray-900" : "text-gray-600"}`}>
                                      {event.description || event.status}
                                    </p>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                      {formatTime(event.timestamp)}
                                    </span>
                                  </div>
                                  {event.location && (
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      {event.location}
                                    </p>
                                  )}
                                  {event.note && (
                                    <p className="text-xs text-gray-400 mt-1 italic">{event.note}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Belum Ada Riwayat</p>
                  <p className="text-gray-400 text-sm">
                    Informasi tracking akan muncul setelah paket diproses kurir
                  </p>
                </div>
              )}

              {/* Courier Contact */}
              {trackingData.courier?.phone && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Hubungi Kurir</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{trackingData.courier.name || "Kurir"}</p>
                      <p className="text-sm text-gray-600">{trackingData.courier.phone}</p>
                    </div>
                    <a
                      href={`tel:${trackingData.courier.phone}`}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition"
                    >
                      Telepon
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">Tidak ada data tracking</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
