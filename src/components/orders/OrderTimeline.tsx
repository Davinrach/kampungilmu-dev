"use client";

import { OrderStatus, FulfillmentMethod } from "@/services/orderService";

interface TimelineStep {
  key: OrderStatus;
  label: string;
  description: string;
  icon: string;
}

const COURIER_FLOW: TimelineStep[] = [
  {
    key: "pending_payment",
    label: "Menunggu Pembayaran",
    description: "Selesaikan pembayaran",
    icon: "wallet",
  },
  {
    key: "paid",
    label: "Pembayaran Diterima",
    description: "Menunggu konfirmasi seller",
    icon: "check-circle",
  },
  {
    key: "confirmed",
    label: "Dikonfirmasi",
    description: "Seller menyiapkan paket",
    icon: "package",
  },
  {
    key: "shipped",
    label: "Dikirim",
    description: "Paket dalam perjalanan",
    icon: "truck",
  },
  {
    key: "delivered",
    label: "Sampai Tujuan",
    description: "Paket telah sampai",
    icon: "home",
  },
  {
    key: "completed",
    label: "Selesai",
    description: "Pesanan selesai",
    icon: "star",
  },
];

const PICKUP_FLOW: TimelineStep[] = [
  {
    key: "pending_payment",
    label: "Menunggu Pembayaran",
    description: "Selesaikan pembayaran",
    icon: "wallet",
  },
  {
    key: "paid",
    label: "Pembayaran Diterima",
    description: "Menunggu konfirmasi seller",
    icon: "check-circle",
  },
  {
    key: "confirmed",
    label: "Siap Diambil",
    description: "Datang ke lokasi seller",
    icon: "store",
  },
  {
    key: "completed",
    label: "Selesai Diambil",
    description: "Pesanan selesai",
    icon: "star",
  },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending_payment: 0,
  paid: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
  verified_pickup: 3, // for pickup flow, equivalent to "Siap Diambil/Diambil"
  completed: 5,
  cancelled: -1,
};

export default function OrderTimeline({
  status,
  fulfillmentMethod,
}: {
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
}) {
  // Cancelled orders show special state
  if (status === "cancelled") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-gray-500"
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
        </div>
        <p className="font-semibold text-gray-700">Pesanan Dibatalkan</p>
        <p className="text-xs text-gray-500 mt-1">
          Pesanan ini telah dibatalkan
        </p>
      </div>
    );
  }

  const flow = fulfillmentMethod === "local_pickup" ? PICKUP_FLOW : COURIER_FLOW;
  const currentIndex = STATUS_INDEX[status] ?? 0;
  // For pickup, adjust index since "shipped"/"delivered" don't apply
  const flowIndex =
    fulfillmentMethod === "local_pickup"
      ? Math.min(
          currentIndex >= 5 ? 3 : currentIndex >= 3 ? 2 : currentIndex,
          flow.length - 1
        )
      : currentIndex;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 mb-5">Status Pesanan</h3>

      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {/* Progress line background */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
          {/* Progress line filled */}
          <div
            className="absolute top-5 left-5 h-0.5 bg-teal-500 transition-all duration-500"
            style={{
              width: `calc(${(flowIndex / (flow.length - 1)) * 100}% - ${
                (flowIndex / (flow.length - 1)) * 40
              }px)`,
              maxWidth: "calc(100% - 40px)",
            }}
          />

          {flow.map((step, idx) => (
            <TimelineStepDesktop
              key={step.key}
              step={step}
              completed={idx < flowIndex}
              active={idx === flowIndex}
            />
          ))}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-1">
        {flow.map((step, idx) => (
          <TimelineStepMobile
            key={step.key}
            step={step}
            completed={idx < flowIndex}
            active={idx === flowIndex}
            isLast={idx === flow.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineStepDesktop({
  step,
  completed,
  active,
}: {
  step: TimelineStep;
  completed: boolean;
  active: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center w-32 z-10">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          completed
            ? "bg-teal-500 text-white"
            : active
            ? "bg-teal-500 text-white ring-4 ring-teal-100 animate-pulse"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {completed ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <StepIcon type={step.icon} />
        )}
      </div>
      <p
        className={`text-xs font-semibold mt-2 ${
          completed || active ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {step.label}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
        {step.description}
      </p>
    </div>
  );
}

function TimelineStepMobile({
  step,
  completed,
  active,
  isLast,
}: {
  step: TimelineStep;
  completed: boolean;
  active: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            completed
              ? "bg-teal-500 text-white"
              : active
              ? "bg-teal-500 text-white ring-4 ring-teal-100"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {completed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <StepIcon type={step.icon} small />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 my-1 ${
              completed ? "bg-teal-500" : "bg-gray-200"
            }`}
            style={{ minHeight: 24 }}
          />
        )}
      </div>
      <div className="pb-4 flex-1">
        <p
          className={`text-sm font-semibold ${
            completed || active ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {step.label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
      </div>
    </div>
  );
}

function StepIcon({ type, small }: { type: string; small?: boolean }) {
  const className = small ? "w-4 h-4" : "w-5 h-5";
  const icons: Record<string, JSX.Element> = {
    wallet: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m3 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H10a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    "check-circle": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    package: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    truck: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
    home: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    star: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
    store: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M19 21a2 2 0 11-4 0 2 2 0 014 0zM9 21a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  };
  return icons[type] || <span>?</span>;
}
