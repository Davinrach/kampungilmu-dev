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
  isGoogleConfigured,
  renderGoogleButton,
} from "@/lib/google";

// Validation schemas
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .regex(/^62\d{9,13}$/, "Format: 62xxx (contoh: 6281234567890)"),
});

const otpSchema = z.object({
  code: z.string().length(6, "Kode OTP harus 6 digit"),
});

type RegisterForm = z.infer<typeof registerSchema>;
type OTPForm = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<"register" | "otp">("register");
  const [registerData, setRegisterData] = useState<RegisterForm>({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleConfigured = isGoogleConfigured();

  // Handle Google ID token credential
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
      setError(err.response?.data?.message || "Gagal daftar dengan Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Render Google button on mount
  useEffect(() => {
    if (!googleConfigured || !googleButtonRef.current || step !== "register") return;
    renderGoogleButton(googleButtonRef.current, handleGoogleCredential, {
      text: "signup_with",
      width: 380,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleConfigured, step]);

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "" },
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

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true);
    setError("");

    try {
      // Send OTP to the phone number
      const response = await authService.requestOTP(data.phone);
      if (response.success) {
        setRegisterData(data);
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
      // Verify OTP first
      const verifyResponse = await authService.verifyOTP(
        registerData.phone,
        data.code
      );

      if (verifyResponse.success) {
        const { user, access_token, refresh_token, is_new_user } =
          verifyResponse.data;

        // Save auth tokens
        setAuth(user, access_token, refresh_token);

        // If new user, complete profile with the name
        if (is_new_user || !user.is_verified) {
          try {
            const profileResponse = await authService.completeProfile(
              registerData.name
            );
            if (profileResponse.success) {
              router.push("/");
            }
          } catch (profileErr: any) {
            // If profile completion fails, redirect to complete-profile page
            router.push("/complete-profile");
          }
        } else {
          // User already exists, redirect based on role
          if (user.role === "admin") {
            router.push("/admin");
          } else if (user.role === "seller") {
            router.push("/seller");
          } else {
            router.push("/");
          }
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
      await authService.requestOTP(registerData.phone);
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
              {step === "register" ? "GET STARTED" : "VERIFY OTP"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {step === "register" ? (
                <>Buat Akun Baru</>
              ) : (
                <>Verifikasi Nomor Anda</>
              )}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              {step === "register"
                ? "Bergabung dengan ribuan pembaca dan mulai jelajahi koleksi buku."
                : `Kode OTP telah dikirim ke ${registerData.phone}`}
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

          {/* Register Step */}
          {step === "register" && (
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-5"
            >
              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    {...registerForm.register("name")}
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="mt-2 text-sm text-red-600 ml-1">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
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
                    {...registerForm.register("phone")}
                    type="tel"
                    placeholder="6281234567890"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
                {registerForm.formState.errors.phone && (
                  <p className="mt-2 text-sm text-red-600 ml-1">
                    {registerForm.formState.errors.phone.message}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 ml-1">
                  Format: 62xxx (contoh: 6281234567890)
                </p>
              </div>

              {/* Terms */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                <p className="text-xs text-teal-800 leading-relaxed">
                  Dengan mendaftar, Anda menyetujui{" "}
                  <Link
                    href="/terms"
                    className="font-semibold underline hover:text-teal-900"
                  >
                    Syarat & Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold underline hover:text-teal-900"
                  >
                    Kebijakan Privasi
                  </Link>{" "}
                  Kampung Ilmu.
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
                  <>Daftar Sekarang</>
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
                  <>Verifikasi & Daftar</>
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep("register")}
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
                  Ubah Data
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
          {step === "register" && (
            <>
              <div className="my-7 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-xs text-gray-400 font-medium">
                  ATAU
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Google Login */}
              {googleConfigured ? (
                <>
                  <div ref={googleButtonRef} className="w-full flex justify-center">
                    {/* Google button rendered here */}
                  </div>
                  {googleLoading && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Memproses Google Sign-In...
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
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
                  Daftar dengan Google
                  <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                    Belum tersedia
                  </span>
                </button>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Masuk di sini
              </Link>
            </p>
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
            <div className="relative w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="200" cy="200" r="160" fill="white" opacity="0.9" />

                {/* Books with hands */}
                <g transform="translate(140, 130)">
                  {/* Book stack */}
                  <rect
                    x="0"
                    y="60"
                    width="120"
                    height="18"
                    rx="2"
                    fill="#0d9488"
                  />
                  <rect
                    x="10"
                    y="40"
                    width="100"
                    height="20"
                    rx="2"
                    fill="#06b6d4"
                  />
                  <rect
                    x="5"
                    y="20"
                    width="110"
                    height="20"
                    rx="2"
                    fill="#0891b2"
                  />
                  <rect
                    x="15"
                    y="0"
                    width="90"
                    height="20"
                    rx="2"
                    fill="#14b8a6"
                  />
                </g>

                {/* Person */}
                <g transform="translate(170, 240)">
                  <circle cx="30" cy="20" r="20" fill="#0f766e" />
                  <path
                    d="M 0 80 Q 0 50, 30 50 Q 60 50, 60 80 L 60 100 L 0 100 Z"
                    fill="#0f766e"
                  />
                </g>

                {/* Sparkles */}
                <g fill="#06b6d4">
                  <path d="M 80 100 L 84 108 L 92 112 L 84 116 L 80 124 L 76 116 L 68 112 L 76 108 Z" />
                  <path d="M 320 140 L 323 146 L 329 149 L 323 152 L 320 158 L 317 152 L 311 149 L 317 146 Z" />
                  <path d="M 100 320 L 103 326 L 109 329 L 103 332 L 100 338 L 97 332 L 91 329 L 97 326 Z" />
                </g>
              </svg>
            </div>

            {/* Floating Card - Top Right */}
            <div className="absolute top-6 right-6 bg-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
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
                <p className="text-xs text-gray-500 font-medium">Mudah</p>
                <p className="text-sm font-bold text-gray-900">& Cepat</p>
              </div>
            </div>
          </div>

          {/* Floating Card - Bottom */}
          <div className="absolute -bottom-4 right-8 bg-white rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3 z-20">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Komunitas</p>
              <p className="text-xs text-gray-500">Pembaca Aktif</p>
            </div>
          </div>

          {/* Caption */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mulai Perjalanan Membaca Anda
            </h2>
            <p className="text-gray-600">
              Daftar gratis dan akses ribuan buku berkualitas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
