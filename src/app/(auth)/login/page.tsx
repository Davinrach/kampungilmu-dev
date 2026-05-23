"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form Section - Mobile First */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white order-1">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-800">Kampung Ilmu</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-6 sm:mb-8">
            <p className="text-teal-600 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wide">Welcome Back</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang di Kampung Ilmu
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Silakan masuk untuk menjelajahi koleksi buku kami.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="nama@email.com"
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Lupa Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-200 shadow-sm text-sm sm:text-base"
            >
              Masuk
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 sm:mt-8 mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm sm:text-base text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="text-teal-600 hover:text-teal-700 font-semibold">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Image Section - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-400 via-teal-300 to-cyan-200 items-center justify-center p-12 relative overflow-hidden order-2">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-40 h-40 bg-teal-200 rounded-full opacity-40 blur-2xl"></div>
        <div className="absolute bottom-32 left-16 w-32 h-32 bg-cyan-300 rounded-full opacity-40 blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-teal-400 rounded-full opacity-30 blur-xl"></div>
        
        <div className="relative w-full max-w-lg z-10">
          {/* Main Card */}
          <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 overflow-hidden">
            {/* Image Container */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl overflow-hidden relative">
              {/* Simulated classroom/library image */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full h-full bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl flex items-center justify-center relative">
                  {/* Windows illustration */}
                  <div className="absolute top-4 left-4 right-4 flex gap-4">
                    <div className="flex-1 h-32 bg-gradient-to-b from-cyan-100 to-cyan-50 rounded-lg opacity-60"></div>
                    <div className="flex-1 h-32 bg-gradient-to-b from-cyan-100 to-cyan-50 rounded-lg opacity-60"></div>
                  </div>
                  
                  {/* Tables/desks illustration */}
                  <div className="absolute bottom-8 left-8 right-8 flex gap-4">
                    <div className="flex-1 h-16 bg-gradient-to-b from-gray-200 to-gray-100 rounded-lg"></div>
                    <div className="flex-1 h-16 bg-gradient-to-b from-gray-200 to-gray-100 rounded-lg"></div>
                  </div>
                  
                  {/* People silhouettes */}
                  <div className="absolute bottom-20 left-12 w-8 h-12 bg-teal-300 rounded-full opacity-70"></div>
                  <div className="absolute bottom-20 right-16 w-8 h-12 bg-cyan-300 rounded-full opacity-70"></div>
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-teal-400 rounded-full opacity-70"></div>
                  
                  {/* Plant decoration */}
                  <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-green-400 rounded-t-full opacity-50"></div>
                </div>
              </div>
            </div>
            
            {/* Info Badge */}
            <div className="absolute bottom-6 right-6 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-sm">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-sm">Ribuan Buku</div>
                <div className="text-xs opacity-90">Akses tak terbatas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
