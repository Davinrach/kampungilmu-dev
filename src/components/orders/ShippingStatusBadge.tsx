"use client";

interface ShippingStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function getShippingStatusInfo(status: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
} {
  const lower = status.toLowerCase();

  if (lower.includes("delivered") || lower.includes("terkirim") || lower.includes("diterima")) {
    return {
      label: "Terkirim",
      color: "text-green-700",
      bgColor: "bg-green-100",
      icon: "✓",
      description: "Paket sudah diterima",
    };
  }

  if (lower.includes("out for delivery") || lower.includes("antar") || lower.includes("on delivery")) {
    return {
      label: "Sedang Diantar",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
      icon: "🛵",
      description: "Kurir sedang mengantar ke alamat tujuan",
    };
  }

  if (lower.includes("transit") || lower.includes("proses") || lower.includes("perjalanan")) {
    return {
      label: "Dalam Perjalanan",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      icon: "🚚",
      description: "Paket sedang dalam perjalanan",
    };
  }

  if (lower.includes("pickup") || lower.includes("diambil") || lower.includes("picked")) {
    return {
      label: "Diambil Kurir",
      color: "text-teal-700",
      bgColor: "bg-teal-100",
      icon: "📤",
      description: "Paket sudah diambil kurir dari seller",
    };
  }

  if (lower.includes("hub") || lower.includes("sorting") || lower.includes("warehouse") || lower.includes("gudang")) {
    return {
      label: "Di Gudang",
      color: "text-indigo-700",
      bgColor: "bg-indigo-100",
      icon: "🏢",
      description: "Paket sedang diproses di gudang",
    };
  }

  if (lower.includes("manifested") || lower.includes("created") || lower.includes("booked")) {
    return {
      label: "Pesanan Dibuat",
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      icon: "📋",
      description: "Pesanan pengiriman sudah dibuat",
    };
  }

  if (lower.includes("failed") || lower.includes("gagal")) {
    return {
      label: "Gagal Kirim",
      color: "text-red-700",
      bgColor: "bg-red-100",
      icon: "✗",
      description: "Pengiriman gagal, akan dicoba ulang",
    };
  }

  if (lower.includes("return") || lower.includes("kembali")) {
    return {
      label: "Dikembalikan",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      icon: "↩",
      description: "Paket dikembalikan ke pengirim",
    };
  }

  if (lower.includes("hold") || lower.includes("pending") || lower.includes("tahan")) {
    return {
      label: "Ditahan",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      icon: "⏸",
      description: "Paket sedang ditahan sementara",
    };
  }

  return {
    label: status,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: "•",
    description: status,
  };
}

export default function ShippingStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: ShippingStatusBadgeProps) {
  const info = getShippingStatusInfo(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${info.bgColor} ${info.color} ${sizeClasses[size]}`}
      title={info.description}
    >
      {showIcon && <span>{info.icon}</span>}
      {info.label}
    </span>
  );
}

// Shipping progress component
export function ShippingProgress({ status }: { status: string }) {
  const steps = [
    { key: "pickup", label: "Diambil", icon: "📤" },
    { key: "transit", label: "Transit", icon: "🚚" },
    { key: "delivery", label: "Diantar", icon: "🛵" },
    { key: "delivered", label: "Terkirim", icon: "✓" },
  ];

  const getActiveStep = () => {
    const lower = status.toLowerCase();
    if (lower.includes("delivered") || lower.includes("terkirim")) return 4;
    if (lower.includes("out for delivery") || lower.includes("antar")) return 3;
    if (lower.includes("transit") || lower.includes("hub") || lower.includes("warehouse")) return 2;
    if (lower.includes("pickup") || lower.includes("picked")) return 1;
    return 0;
  };

  const activeStep = getActiveStep();

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = index < activeStep;
        const isCurrent = index === activeStep - 1;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  isActive
                    ? isCurrent
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-200 scale-110"
                      : "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isActive && !isCurrent ? "✓" : step.icon}
              </div>
              <p
                className={`text-[10px] mt-1.5 font-medium ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                  index < activeStep - 1 ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Estimated delivery component
export function EstimatedDelivery({
  duration,
  shippedAt,
}: {
  duration?: string;
  shippedAt?: string;
}) {
  if (!duration) return null;

  // Parse duration like "1-2 days" or "2-4 hari"
  const match = duration.match(/(\d+)[-–]?(\d+)?/);
  if (!match) return null;

  const minDays = parseInt(match[1]);
  const maxDays = match[2] ? parseInt(match[2]) : minDays;

  // Calculate estimated dates
  const baseDate = shippedAt ? new Date(shippedAt) : new Date();
  const minDate = new Date(baseDate);
  minDate.setDate(minDate.getDate() + minDays);
  const maxDate = new Date(baseDate);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-gray-600">
        Estimasi tiba:{" "}
        <span className="font-semibold text-gray-900">
          {minDays === maxDays
            ? formatDate(minDate)
            : `${formatDate(minDate)} - ${formatDate(maxDate)}`}
        </span>
      </span>
    </div>
  );
}
