"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import {
  triggerGoogleSignIn,
  isGoogleConfigured,
  renderGoogleButton,
} from "@/lib/google";

// Validation schemas
const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .regex(/^62\d{9,13}$/, "Format: 62xxx (contoh: 6281234567890)"),
});

const otpSchema = z.object({
  code: z.string().length(6, "Kode OTP harus 6 digit"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OTPForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleConfigured = isGoogleConfigured();

  // Handle Google ID token credential from Google Sign-In
  const handleGoogleCredential = async (idToken: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      const response = await authService.googleLogin(idToken);
      if (response.success) {
        const { user, access_token, refresh_token, is_new_user } = response.data;
        setAuth(user, access_token, refresh_token);

        if (is_new_user || !user.is_verified) {
          router.push("/complete-profile");
        } else if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "seller") {
          router.push("/seller");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal login dengan Google";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Render Google's official button
  useEffect(() => {
    if (!googleConfigured || !googleButtonRef.current) return;
    renderGoogleButton(googleButtonRef.current, handleGoogleCredential, {
      text: "continue_with",
      width: 380,
    }).catch((err) => {
      console.error("[Google] Failed to render button:", err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleConfigured]);

  // Manual trigger fallback
  const handleManualGoogleClick = () => {
    if (!googleConfigured) {
      setError(
        "Google Sign-In belum dikonfigurasi. Hubungi admin untuk setup Google Client ID."
      );
      return;
    }
    triggerGoogleSignIn(handleGoogleCredential).catch((err) => {
      setError(err.message || "Gagal membuka Google Sign-In");
    });
  };

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const startCountdown = () => {
    setCountdown(300);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOTP = async (data: PhoneForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await authService.requestOTP(data.phone);
      if (response.success) {
        setPhone(data.phone);
        setStep("otp");
        startCountdown();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengirim OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (data: OTPForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await authService.verifyOTP(phone, data.code);
      if (response.success) {
        const { user, access_token, refresh_token, is_new_user } = response.data;
        setAuth(user, access_token, refresh_token);

        if (is_new_user || !user.is_verified) {
          router.push("/complete-profile");
        } else if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "seller") {
          router.push("/seller");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Kode OTP salah");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");

    try {
      await authService.requestOTP(phone);
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengirim ulang OTP");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Kampung Ilmu</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <span className="inline-block text-xs font-bold text-teal-600 tracking-widest mb-3">
              {step === "phone" ? "WELCOME BACK" : "VERIFY OTP"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {step === "phone" ? (
                <>Selamat Datang di Kampung Ilmu</>
              ) : (
                <>Verifikasi Nomor Anda</>
              )}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              {step === "phone"
                ? "Silakan masuk untuk menjelajahi koleksi buku kami."
                : `Kode OTP telah dikirim ke ${phone}`}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Phone Step */}
          {step === "phone" && (
            <form
              onSubmit={phoneForm.handleSubmit(handleRequestOTP)}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <input
                    {...phoneForm.register("phone")}
                    type="tel"
                    placeholder="6281234567890"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="mt-2 text-sm text-red-600 ml-1">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 ml-1">
                  Format: 62xxx (contoh: 6281234567890)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3.5 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  <>Kirim Kode OTP</>
                )}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <form
              onSubmit={otpForm.handleSubmit(handleVerifyOTP)}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                  Kode OTP
                </label>
                <input
                  {...otpForm.register("code")}
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-center text-3xl font-bold tracking-[0.5em] text-gray-900"
                />
                {otpForm.formState.errors.code && (
                  <p className="mt-2 text-sm text-red-600 ml-1">
                    {otpForm.formState.errors.code.message}
                  </p>
                )}
                {countdown > 0 && (
                  <p className="mt-3 text-sm text-gray-500 ml-1 flex items-center gap-2">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Kode berlaku selama:{" "}
                    <strong className="text-teal-600">
                      {formatTime(countdown)}
                    </strong>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3.5 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Memverifikasi...
                  </>
                ) : (
                  <>Verifikasi</>
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
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
                  Ubah Nomor
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `Kirim ulang (${formatTime(countdown)})`
                    : "Kirim Ulang OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="my-7 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-xs text-gray-400 font-medium">ATAU</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Google Login */}
          {googleConfigured ? (
            <>
              {/* Render Google's official button */}
              <div ref={googleButtonRef} className="w-full flex justify-center">
                {/* Google button will be rendered here */}
              </div>
              {googleLoading && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  Memproses login Google...
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleManualGoogleClick}
              disabled
              title="Google Client ID belum dikonfigurasi"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 rounded-xl font-semibold text-gray-400 cursor-not-allowed"
            >
              <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Masuk dengan Google
              <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                Belum tersedia
              </span>
            </button>
          )}

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Daftar sekarang
              </Link>
            </p>
            <div className="mt-4 text-center">
              <Link
                href="/admin-login"
                className="text-xs text-gray-400 hover:text-teal-600 transition"
              >
                Login sebagai Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-50 to-teal-50"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

        {/* Content */}
        <div className="relative z-10 max-w-lg w-full">
          {/* Main Image Card */}
          <div className="relative bg-gradient-to-br from-teal-200 to-cyan-300 rounded-3xl p-8 shadow-2xl aspect-square flex items-center justify-center overflow-hidden">
            {/* Books Illustration */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background circle */}
                <circle cx="200" cy="200" r="160" fill="white" opacity="0.9" />

                {/* Books stack */}
                <g transform="translate(120, 150)">
                  {/* Book 1 */}
                  <rect
                    x="0"
                    y="80"
                    width="160"
                    height="20"
                    rx="2"
                    fill="#0d9488"
                  />
                  <rect
                    x="5"
                    y="85"
                    width="150"
                    height="2"
                    fill="white"
                    opacity="0.5"
                  />

                  {/* Book 2 */}
                  <rect
                    x="10"
                    y="55"
                    width="140"
                    height="25"
                    rx="2"
                    fill="#06b6d4"
                  />
                  <rect
                    x="15"
                    y="62"
                    width="130"
                    height="2"
                    fill="white"
                    opacity="0.5"
                  />

                  {/* Book 3 */}
                  <rect
                    x="5"
                    y="25"
                    width="150"
                    height="30"
                    rx="2"
                    fill="#0891b2"
                  />
                  <rect
                    x="10"
                    y="35"
                    width="140"
                    height="2"
                    fill="white"
                    opacity="0.5"
                  />

                  {/* Book 4 (top) */}
                  <rect
                    x="20"
                    y="0"
                    width="120"
                    height="25"
                    rx="2"
                    fill="#14b8a6"
                  />
                  <rect
                    x="25"
                    y="8"
                    width="110"
                    height="2"
                    fill="white"
                    opacity="0.5"
                  />
                </g>

                {/* Reading person silhouette */}
                <g transform="translate(160, 240)">
                  <circle cx="40" cy="20" r="18" fill="#0f766e" />
                  <path
                    d="M 10 60 Q 10 40, 40 40 Q 70 40, 70 60 L 70 80 L 10 80 Z"
                    fill="#0f766e"
                  />
                </g>

                {/* Decorative dots */}
                <circle cx="80" cy="100" r="4" fill="#14b8a6" />
                <circle cx="320" cy="120" r="6" fill="#06b6d4" />
                <circle cx="100" cy="320" r="5" fill="#0891b2" />
                <circle cx="310" cy="290" r="4" fill="#14b8a6" />
              </svg>
            </div>

            {/* Floating Card 1 - Top Right */}
            <div className="absolute top-6 right-6 bg-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-teal-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Ribuan</p>
                <p className="text-sm font-bold text-gray-900">Buku</p>
              </div>
            </div>
          </div>

          {/* Floating Card 2 - Bottom */}
          <div className="absolute -bottom-4 right-8 bg-white rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3 z-20">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Akses tak terbatas</p>
              <p className="text-xs text-gray-500">Untuk semua user</p>
            </div>
          </div>

          {/* Caption */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Marketplace Buku Terlengkap
            </h2>
            <p className="text-gray-600">
              Jelajahi ribuan koleksi buku berkualitas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
