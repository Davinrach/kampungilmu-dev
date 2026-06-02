"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/components/ui/Toast";
import { accountService, Address } from "@/services/accountService";
import {
  orderService,
  CourierOption,
  FulfillmentMethod,
  CheckoutPayload,
  MIDTRANS_PAYMENT_METHODS,
  MidtransPaymentOption,
} from "@/services/orderService";
import {
  formatPrice,
  getPrimaryPhoto,
  PLACEHOLDER_IMAGE,
} from "@/services/catalogService";
import { CartItem } from "@/services/cartService";
import { openSnapPayment } from "@/lib/midtrans";

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { items: cartItems, fetchCart, initialized: cartInitialized } = useCartStore();

  // Selected cart item IDs from URL
  const itemIdsParam = searchParams.get("items") || "";
  const selectedItemIds = useMemo(
    () => itemIdsParam.split(",").filter(Boolean),
    [itemIdsParam]
  );

  // Selected items from cart
  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedItemIds.includes(item.id)),
    [cartItems, selectedItemIds]
  );

  // Form state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("delivery");
  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>(
    MIDTRANS_PAYMENT_METHODS[0].code
  );
  const [paymentChannel, setPaymentChannel] = useState<string | undefined>(
    MIDTRANS_PAYMENT_METHODS[0].channel
  );
  const [notes, setNotes] = useState("");

  // Loading & error states
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [courierError, setCourierError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth & cart guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!cartInitialized) fetchCart();
  }, [hasHydrated, isAuthenticated, cartInitialized, fetchCart, router]);

  // No items selected
  useEffect(() => {
    if (cartInitialized && selectedItemIds.length === 0) {
      toast.warning("Tidak ada item untuk checkout");
      router.push("/cart");
    }
  }, [cartInitialized, selectedItemIds.length, router, toast]);

  // Fetch addresses
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingAddresses(true);
    accountService
      .getAddresses()
      .then((res) => {
        const addrs = res.data || [];
        setAddresses(addrs);
        const defaultAddr = addrs.find((a: Address) => a.is_default);
        setSelectedAddressId(defaultAddr?.id || addrs[0]?.id || "");
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, [isAuthenticated]);

  // Helper: Validate postal code (must be 5 digits)
  const isValidPostalCode = (code: string | undefined | null): boolean => {
    if (!code) return false;
    const cleaned = code.trim();
    return /^\d{5}$/.test(cleaned);
  };

  // Fetch courier options when address selected and fulfillment=delivery
  useEffect(() => {
    if (
      fulfillmentMethod !== "delivery" ||
      !selectedAddressId ||
      selectedItems.length === 0
    ) {
      setCourierOptions([]);
      setSelectedCourierId("");
      setCourierError(null);
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    
    // Validate destination postal code
    if (!selectedAddress?.postal_code) {
      setCourierOptions([]);
      setCourierError("Alamat tidak memiliki kode pos. Silakan update alamat Anda.");
      return;
    }

    const destinationPostalCode = selectedAddress.postal_code.trim();
    
    if (!isValidPostalCode(destinationPostalCode)) {
      setCourierOptions([]);
      setCourierError(`Kode pos "${destinationPostalCode}" tidak valid. Kode pos harus 5 digit angka.`);
      return;
    }

    // Calculate total weight (assume 300g per book as default)
    const totalWeight = selectedItems.reduce(
      (sum, item) => sum + (item.quantity * 300),
      0
    );
    const totalValue = selectedItems.reduce(
      (sum, item) => sum + ((item.book?.price ?? item.price ?? 0) * item.quantity),
      0
    );

    // Get seller's postal code from book data if available
    // Fallback to default Surabaya Kampung Ilmu area postal code
    let sellerPostalCode = "60293"; // Default: Surabaya area
    
    // Try to get seller postal code from first item's book data
    const firstItem = selectedItems[0];
    const sellerAddress = (firstItem?.book as any)?.seller?.postal_code;
    if (isValidPostalCode(sellerAddress)) {
      sellerPostalCode = sellerAddress.trim();
    }

    // Validate origin postal code
    if (!isValidPostalCode(sellerPostalCode)) {
      console.error("[Checkout] Invalid seller postal code:", sellerPostalCode);
      setCourierOptions([]);
      setCourierError("Kode pos seller tidak valid. Silakan hubungi seller.");
      return;
    }

    console.log("[Checkout] Fetching courier options:", {
      destination_postal_code: destinationPostalCode,
      origin_postal_code: sellerPostalCode,
      weight: totalWeight,
      item_value: totalValue,
    });

    setLoadingCouriers(true);
    setCourierError(null);
    
    orderService
      .getCourierOptions(
        destinationPostalCode,
        sellerPostalCode,
        totalWeight,
        totalValue
      )
      .then((options) => {
        console.log("[Checkout] Courier options received:", options);
        setCourierOptions(options);
        if (options.length > 0) {
          setSelectedCourierId(options[0].id);
          setCourierError(null);
        } else {
          setCourierError("Tidak ada kurir tersedia untuk rute ini. Coba gunakan metode Pickup.");
        }
      })
      .catch((err) => {
        console.error("[Checkout] Error fetching couriers:", err);
        const errMsg = err.response?.data?.message || err.response?.data?.error;
        if (errMsg && errMsg.toLowerCase().includes("postal")) {
          setCourierError(`Error kode pos: ${errMsg}`);
        } else {
          setCourierError("Gagal memuat opsi kurir. Silakan coba lagi atau gunakan metode Pickup.");
        }
        setCourierOptions([]);
      })
      .finally(() => setLoadingCouriers(false));
  }, [fulfillmentMethod, selectedAddressId, selectedItems, addresses]);

  // Calculations
  const subtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const price = item.book?.price ?? item.price ?? 0;
        return sum + price * item.quantity;
      }, 0),
    [selectedItems]
  );

  const selectedCourier = courierOptions.find((c) => c.id === selectedCourierId);
  const shippingCost =
    fulfillmentMethod === "delivery" ? selectedCourier?.cost ?? 0 : 0;

  const total = subtotal + shippingCost;

  // Validation
  const canSubmit =
    selectedItems.length > 0 &&
    !!paymentMethod &&
    (fulfillmentMethod === "local_pickup" ||
      (fulfillmentMethod === "delivery" && selectedAddressId && selectedCourierId));

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload: CheckoutPayload = {
        cart_item_ids: selectedItemIds,
        fulfillment_method: fulfillmentMethod,
        payment_method: paymentMethod,
        payment_channel: paymentChannel,
        note: notes.trim() || undefined,
      };

      if (fulfillmentMethod === "delivery" && selectedCourier) {
        payload.address_id = selectedAddressId;
        payload.courier_name = selectedCourier.courier_code;
        payload.courier_service = selectedCourier.service_code;
        payload.shipping_cost = selectedCourier.cost;
      }

      console.log("[Checkout] Sending payload:", payload);
      const result = await orderService.checkout(payload);
      console.log("[Checkout] Backend response:", JSON.stringify(result, null, 2));

      // Refresh cart (items consumed)
      await fetchCart();

      // Get order ID - check multiple possible locations
      const orderId =
        (result.order as any)?.id ||
        (result.order as any)?.order_id ||
        (result.order as any)?.ID ||
        (result as any)?.id ||
        (result as any)?.order_id;

      console.log("[Checkout] Order ID:", orderId);

      if (orderId) {
        localStorage.setItem("last_order_id", orderId);
      }

      // ====== PAYMENT FLOW ======
      // Check for snap_token in multiple possible locations
      const snapToken = 
        result.snap_token || 
        (result as any).snapToken ||
        (result.payment as any)?.snap_token ||
        (result.payment as any)?.snapToken ||
        (result as any).token;

      // Check for payment_url in multiple possible locations  
      const paymentUrl = 
        result.payment_url ||
        (result as any).paymentUrl ||
        result.payment?.payment_url ||
        (result.payment as any)?.paymentUrl ||
        (result.payment as any)?.redirect_url;

      console.log("[Checkout] Snap token:", snapToken ? snapToken.substring(0, 30) + '...' : 'NOT FOUND');
      console.log("[Checkout] Payment URL:", paymentUrl || 'NOT FOUND');

      // Preferred: Use Midtrans Snap popup
      if (snapToken) {
        toast.success("Pesanan dibuat! Membuka pembayaran...");

        try {
          await openSnapPayment(snapToken, {
            onSuccess: (snapResult) => {
              console.log("[Snap] Payment success:", snapResult);
              toast.success("Pembayaran berhasil!");
              if (orderId) router.push(`/orders/${orderId}`);
              else router.push("/orders");
            },
            onPending: (snapResult) => {
              console.log("[Snap] Payment pending:", snapResult);
              toast.info("Pembayaran sedang diproses...");
              if (orderId) router.push(`/orders/${orderId}`);
              else router.push("/orders");
            },
            onError: (snapResult) => {
              console.error("[Snap] Payment error:", snapResult);
              toast.error("Pembayaran gagal. Coba lagi nanti.");
              if (orderId) router.push(`/orders/${orderId}`);
            },
            onClose: () => {
              console.log("[Snap] Popup closed by user");
              toast.info("Pembayaran ditunda. Anda bisa bayar nanti.");
              if (orderId) router.push(`/orders/${orderId}`);
              else router.push("/orders");
            },
          });
        } catch (snapErr: any) {
          console.error("[Snap] Failed to open popup:", snapErr);
          // Fallback to redirect if Snap fails
          if (paymentUrl) {
            console.log("[Checkout] Falling back to payment URL redirect");
            window.location.href = paymentUrl;
            return;
          }
          toast.error("Gagal membuka popup pembayaran: " + snapErr.message);
          if (orderId) router.push(`/orders/${orderId}`);
        }
        return;
      }

      // Fallback: redirect to payment URL if no snap_token
      if (paymentUrl) {
        toast.success("Pesanan dibuat! Mengarahkan ke pembayaran...");
        console.log("[Checkout] Redirecting to payment URL:", paymentUrl);
        setTimeout(() => {
          window.location.href = paymentUrl;
        }, 800);
        return;
      }

      // No payment data - just go to order detail
      console.warn("[Checkout] No snap_token or payment_url found in response");
      toast.success("Pesanan berhasil dibuat!");
      if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        console.warn("[Checkout] No order ID & no payment data, redirecting to /orders");
        router.push("/orders");
      }
    } catch (err: any) {
      console.error("[Checkout] Error response:", err.response?.data);
      console.error("[Checkout] Status:", err.response?.status);

      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal membuat pesanan";

      const errors = err.response?.data?.errors;
      if (errors && typeof errors === "object") {
        const errorList = Object.entries(errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
        toast.error(`${errMsg} - ${errorList}`);
      } else {
        toast.error(errMsg);
      }

      setSubmitting(false);
    }
  };

  // Loading screens
  if (!hasHydrated || !isAuthenticated || !cartInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cart"
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
            Kembali ke Keranjang
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-500 mt-1">
            Periksa detail pesanan Anda sebelum melanjutkan ke pembayaran
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Selected Items */}
            <SectionCard
              title="Item Pesanan"
              subtitle={`${selectedItems.length} item`}
              icon="cart"
            >
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <CheckoutItem key={item.id} item={item} />
                ))}
              </div>
            </SectionCard>

            {/* 2. Fulfillment Method */}
            <SectionCard title="Metode Pengantaran" icon="truck">
              <div className="grid sm:grid-cols-2 gap-3">
                <FulfillmentOption
                  selected={fulfillmentMethod === "delivery"}
                  onClick={() => setFulfillmentMethod("delivery")}
                  icon="truck"
                  title="Kurir"
                  description="Dikirim via kurir ke alamat Anda"
                />
                <FulfillmentOption
                  selected={fulfillmentMethod === "local_pickup"}
                  onClick={() => setFulfillmentMethod("local_pickup")}
                  icon="store"
                  title="Pickup O2O"
                  description="Ambil sendiri di lokasi seller"
                />
              </div>

              {fulfillmentMethod === "local_pickup" && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Setelah pesanan dikonfirmasi seller, Anda akan menerima{" "}
                      <strong>kode pickup 6 digit</strong> via WhatsApp.
                      Tunjukkan kode tersebut saat ambil pesanan.
                    </span>
                  </p>
                </div>
              )}
            </SectionCard>

            {/* 3. Shipping Address (only for delivery) */}
            {fulfillmentMethod === "delivery" && (
              <SectionCard title="Alamat Pengiriman" icon="location">
                {loadingAddresses ? (
                  <div className="text-center py-6">
                    <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-3">
                      Anda belum memiliki alamat pengiriman
                    </p>
                    <Link
                      href="/profile?tab=addresses"
                      className="inline-block bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-teal-100"
                    >
                      Tambah Alamat
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <AddressOption
                        key={addr.id}
                        address={addr}
                        selected={selectedAddressId === addr.id}
                        onSelect={() => setSelectedAddressId(addr.id)}
                      />
                    ))}
                    <Link
                      href="/profile?tab=addresses"
                      className="block text-center py-2 text-sm text-teal-600 hover:text-teal-700 font-semibold border border-dashed border-gray-200 rounded-xl mt-3"
                    >
                      + Tambah Alamat Baru
                    </Link>
                  </div>
                )}
              </SectionCard>
            )}

            {/* 4. Courier Options (only for delivery) */}
            {fulfillmentMethod === "delivery" && selectedAddressId && (
              <SectionCard title="Pilih Kurir" icon="package">
                {loadingCouriers ? (
                  <div className="text-center py-6">
                    <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">
                      Menghitung ongkir...
                    </p>
                  </div>
                ) : courierError ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      {courierError}
                    </p>
                    <p className="text-xs text-gray-500">
                      Pastikan kode pos alamat Anda sudah benar
                    </p>
                  </div>
                ) : courierOptions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">
                      Tidak ada kurir tersedia untuk rute ini
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Coba gunakan metode Pickup O2O
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {courierOptions.map((courier) => (
                      <CourierOptionCard
                        key={courier.id}
                        courier={courier}
                        selected={selectedCourierId === courier.id}
                        onSelect={() => setSelectedCourierId(courier.id)}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* 5. Notes */}
            <SectionCard
              title="Catatan untuk Seller"
              subtitle="Opsional"
              icon="note"
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Contoh: Tolong dibungkus rapi, bubble wrap, dll"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-sm text-gray-900 placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {notes.length}/200
              </p>
            </SectionCard>

            {/* 6. Payment Method (Midtrans) */}
            <SectionCard title="Metode Pembayaran" icon="card">
              {/* <div className="space-y-2">
                {MIDTRANS_PAYMENT_METHODS.map((method) => (
                  <PaymentMethodCard
                    key={method.channel ? `${method.code}-${method.channel}` : method.code}
                    method={method}
                    selected={paymentMethod === method.code && paymentChannel === method.channel}
                    onSelect={() => {
                      setPaymentMethod(method.code);
                      setPaymentChannel(method.channel);
                    }}
                  />
                ))}
              </div> */}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Pembayaran diproses secara aman oleh{" "}
                    <strong>Midtrans</strong>. Setelah klik &quot;Buat Pesanan&quot;,
                    Anda akan diarahkan ke halaman pembayaran.
                  </span>
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>

              <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100 text-sm">
                <SummaryRow
                  label={`Subtotal (${selectedItems.length} item)`}
                  value={formatPrice(subtotal)}
                />
                <SummaryRow
                  label="Ongkir"
                  value={
                    fulfillmentMethod === "local_pickup"
                      ? "Gratis"
                      : selectedCourier
                      ? formatPrice(shippingCost)
                      : "—"
                  }
                />
              </div>

              {/* Estimated Delivery */}
              {fulfillmentMethod === "delivery" && selectedCourier?.estimated_days && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-700">
                      Estimasi tiba:{" "}
                      <span className="font-bold">
                        {(() => {
                          const match = selectedCourier.estimated_days.match(/(\d+)[-–]?(\d+)?/);
                          if (!match) return selectedCourier.estimated_days;
                          const minDays = parseInt(match[1]);
                          const maxDays = match[2] ? parseInt(match[2]) : minDays;
                          const minDate = new Date();
                          minDate.setDate(minDate.getDate() + minDays);
                          const maxDate = new Date();
                          maxDate.setDate(maxDate.getDate() + maxDays);
                          const formatDate = (date: Date) => date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
                          if (minDays === maxDays) return formatDate(minDate);
                          return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
                        })()}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-5">
                * Biaya admin pembayaran ditampilkan di Midtrans
              </p>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
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
                    Memproses...
                  </>
                ) : (
                  <>
                    Buat Pesanan & Bayar
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
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Validation hints */}
              {!canSubmit && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
                  {fulfillmentMethod === "delivery" && !selectedAddressId && (
                    <p>• Pilih alamat pengiriman</p>
                  )}
                  {fulfillmentMethod === "delivery" && !selectedCourierId && (
                    <p>• Pilih kurir</p>
                  )}
                  {!paymentMethod && <p>• Pilih metode pembayaran</p>}
                </div>
              )}

              {/* Info */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <div className="flex items-start gap-2">
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
                  <p>Pembayaran aman dengan sistem escrow</p>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                  </svg>
                  <p>Bayar dalam 24 jam atau pesanan otomatis dibatalkan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== SUB COMPONENTS ==============

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        {icon && <SectionIcon type={icon} />}
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function SectionIcon({ type }: { type: string }) {
  const className = "w-5 h-5";
  const icons: Record<string, JSX.Element> = {
    cart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    truck: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
    location: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    package: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    note: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    card: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    store: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M19 21a2 2 0 11-4 0 2 2 0 014 0zM9 21a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  };

  return (
    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 flex-shrink-0">
      {icons[type]}
    </div>
  );
}

function CheckoutItem({ item }: { item: CartItem }) {
  const book = item.book;
  const price = book?.price ?? item.price ?? 0;
  const photo = book ? getPrimaryPhoto(book) : PLACEHOLDER_IMAGE;

  return (
    <div className="flex gap-3 items-center">
      <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={photo}
          alt={book?.title || ""}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== PLACEHOLDER_IMAGE) img.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm line-clamp-1">
          {book?.title}
        </p>
        <p className="text-xs text-gray-500 line-clamp-1">oleh {book?.author}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {item.quantity} × {formatPrice(price)}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FulfillmentOption({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition ${
        selected
          ? "border-teal-500 bg-teal-50/30"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            selected ? "border-teal-500" : "border-gray-300"
          }`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-teal-500"></div>}
        </div>
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
      </div>
      <p className="text-xs text-gray-500 ml-6">{description}</p>
    </button>
  );
}

function AddressOption({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  // Check if postal code is valid (5 digits)
  const isPostalCodeValid = /^\d{5}$/.test(address.postal_code || '');

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition ${
        selected
          ? "border-teal-500 bg-teal-50/30"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-4 h-4 mt-1 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selected ? "border-teal-500" : "border-gray-300"
          }`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-teal-500"></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {address.label}
            </span>
            {address.is_default && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">
                Default
              </span>
            )}
            {!isPostalCodeValid && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                Kode Pos Invalid
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 text-sm">
            {address.recipient_name} • {address.phone}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{address.full_address}</p>
          <p className="text-xs text-gray-500">
            {address.kelurahan}, {address.kecamatan}, {address.city}{" "}
            <span className={!isPostalCodeValid ? "text-red-600 font-semibold" : ""}>
              {address.postal_code || "(tidak ada kode pos)"}
            </span>
          </p>
          {!isPostalCodeValid && (
            <p className="text-[10px] text-red-600 mt-1">
              ⚠️ Kode pos harus 5 digit. Update alamat untuk menggunakan kurir.
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function CourierOptionCard({
  courier,
  selected,
  onSelect,
}: {
  courier: CourierOption;
  selected: boolean;
  onSelect: () => void;
}) {
  // Parse duration to show estimated arrival date
  const getEstimatedArrival = () => {
    if (!courier.estimated_days) return null;
    const match = courier.estimated_days.match(/(\d+)[-–]?(\d+)?/);
    if (!match) return courier.estimated_days;
    
    const minDays = parseInt(match[1]);
    const maxDays = match[2] ? parseInt(match[2]) : minDays;
    
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + minDays);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDays);
    
    const formatDate = (date: Date) => date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    
    if (minDays === maxDays) {
      return `Tiba ${formatDate(minDate)}`;
    }
    return `Tiba ${formatDate(minDate)} - ${formatDate(maxDate)}`;
  };

  const estimatedArrival = getEstimatedArrival();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition ${
        selected
          ? "border-teal-500 bg-teal-50/50 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
            selected ? "border-teal-500 bg-teal-500" : "border-gray-300"
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm">
                {courier.name}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {courier.service}
                {courier.description && ` • ${courier.description}`}
              </p>
            </div>
            <p className="font-bold text-teal-600 text-sm flex-shrink-0">
              {formatPrice(courier.cost)}
            </p>
          </div>
          {estimatedArrival && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-700">{estimatedArrival}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function PaymentMethodCard({
  method,
  selected,
  onSelect,
}: {
  method: MidtransPaymentOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 ${
        selected
          ? "border-teal-500 bg-teal-50/30"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "border-teal-500" : "border-gray-300"
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-teal-500"></div>}
      </div>
      <div className="text-2xl flex-shrink-0">{method.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{method.name}</p>
        {method.description && (
          <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
        )}
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// Loading fallback for Suspense
function CheckoutPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

// Export with Suspense wrapper
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageLoading />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
