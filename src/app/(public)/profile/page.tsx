"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import EditProfileModal from "@/components/profile/EditProfileModal";
import AddressList from "@/components/profile/AddressList";
import UpgradeSellerModal from "@/components/profile/UpgradeSellerModal";
import LinkEmailModal from "@/components/profile/LinkEmailModal";
import LinkPhoneModal from "@/components/profile/LinkPhoneModal";

type TabType = "info" | "addresses" | "orders" | "security";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const [showLinkPhoneModal, setShowLinkPhoneModal] = useState(false);

  useEffect(() => {
    // Wait for hydration before redirecting
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      logout();
      router.push("/login");
    }
  };

  // Show loading while hydrating
  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-teal-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "info" as TabType, label: "Informasi", icon: "user" },
    { id: "addresses" as TabType, label: "Alamat", icon: "location" },
    { id: "orders" as TabType, label: "Pesanan", icon: "package" },
    { id: "security" as TabType, label: "Keamanan", icon: "shield" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 py-6 sm:py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Profil Saya
          </h1>
          <p className="text-gray-500">
            Kelola informasi akun, alamat, dan preferensi Anda
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar - Profile Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              {/* Cover */}
              <div className="h-24 bg-gradient-to-r from-teal-400 to-cyan-500 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')] opacity-50"></div>
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6 -mt-12 relative">
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      {user.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Name & Role */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.email || user.phone_number}
                  </p>
                  <div className="mt-3 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "seller"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {user.role === "admin"
                        ? "Administrator"
                        : user.role === "seller"
                        ? "Seller"
                        : "Customer"}
                    </span>
                    {user.is_verified && (
                      <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs Navigation */}
                <nav className="space-y-1 mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-teal-50 text-teal-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <TabIcon type={tab.icon} active={activeTab === tab.id} />
                      <span>{tab.label}</span>
                      {activeTab === tab.id && (
                        <svg
                          className="w-4 h-4 ml-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  {user.role === "customer" && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition shadow-md flex items-center justify-center gap-2 text-sm"
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Upgrade ke Seller
                    </button>
                  )}

                  {user.role === "seller" && (
                    <Link
                      href="/seller"
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-2.5 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-md flex items-center justify-center gap-2 text-sm"
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
                          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                        />
                      </svg>
                      Lanjut Berjualan
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Keluar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              {activeTab === "info" && (
                <InfoTab 
                  user={user} 
                  onEdit={() => setShowEditModal(true)}
                  onLinkEmail={() => setShowLinkEmailModal(true)}
                  onLinkPhone={() => setShowLinkPhoneModal(true)}
                />
              )}
              {activeTab === "addresses" && <AddressList />}
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "security" && <SecurityTab user={user} />}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeSellerModal onClose={() => setShowUpgradeModal(false)} />
      )}

      {showLinkEmailModal && (
        <LinkEmailModal onClose={() => setShowLinkEmailModal(false)} />
      )}

      {showLinkPhoneModal && (
        <LinkPhoneModal onClose={() => setShowLinkPhoneModal(false)} />
      )}
    </div>
  );
}

// ============== TAB ICONS ==============

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const iconClass = `w-5 h-5 ${active ? "text-teal-600" : "text-gray-400"}`;

  switch (type) {
    case "user":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "location":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "package":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "shield":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return null;
  }
}

// ============== INFO TAB ==============

function InfoTab({ 
  user, 
  onEdit,
  onLinkEmail,
  onLinkPhone 
}: { 
  user: any; 
  onEdit: () => void;
  onLinkEmail: () => void;
  onLinkPhone: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informasi Pribadi</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola informasi profil Anda</p>
        </div>
        <button
          onClick={onEdit}
          className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-teal-100 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <InfoField label="Nama Lengkap" value={user.name} icon="user" />
        
        {/* Email Field with Link Button */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-teal-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Email</p>
            <p className="font-semibold text-gray-900 truncate">{user.email || "-"}</p>
          </div>
          {!user.email && (
            <button
              onClick={onLinkEmail}
              className="px-3 py-1.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-200 transition flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>

        {/* Phone Field with Link Button */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-teal-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Nomor WhatsApp</p>
            <p className="font-semibold text-gray-900 truncate">{user.phone_number || "-"}</p>
          </div>
          {!user.phone_number && (
            <button
              onClick={onLinkPhone}
              className="px-3 py-1.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-200 transition flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>

        <InfoField label="Status Akun" value={user.status === "active" ? "Aktif" : "Nonaktif"} icon="check" badge={user.status === "active"} />
      </div>

      {/* Info about linking accounts */}
      {(!user.email || !user.phone_number) && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Lengkapi Data Akun</p>
              <p className="text-sm text-blue-700">
                {!user.email && !user.phone_number
                  ? "Tambahkan email dan nomor HP untuk keamanan akun dan kemudahan login."
                  : !user.email
                  ? "Tambahkan email agar bisa login dengan Google."
                  : "Tambahkan nomor HP agar bisa login dengan OTP WhatsApp."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value, icon, badge }: { label: string; value: string; icon: string; badge?: boolean }) {
  const icons: Record<string, JSX.Element> = {
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    email: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    phone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    check: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-teal-600 flex-shrink-0">
        {icons[icon]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="font-semibold text-gray-900 truncate">{value}</p>
      </div>
      {badge && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Aktif
        </span>
      )}
    </div>
  );
}

// ============== ORDERS TAB ==============

function OrdersTab() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat Pesanan</h2>
          <p className="text-gray-500 text-sm mt-1">Lihat semua pesanan Anda</p>
        </div>
        <Link
          href="/orders"
          className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-teal-100 transition flex items-center gap-2"
        >
          Lihat Semua
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-8 text-center border border-teal-100">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <svg
            className="w-8 h-8 text-teal-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <p className="font-semibold text-gray-900 mb-2">
          Halaman Pesanan Lengkap
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Lihat detail, status, dan tracking pesanan Anda di halaman terpisah
        </p>
        <Link
          href="/orders"
          className="inline-block bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-md"
        >
          Buka Pesanan Saya →
        </Link>
      </div>
    </div>
  );
}

// ============== SECURITY TAB ==============

function SecurityTab({ user }: { user: any }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Keamanan Akun</h2>
        <p className="text-gray-500 text-sm mt-1">
          Kelola pengaturan keamanan akun Anda
        </p>
      </div>

      <div className="space-y-4">
        {/* Login Method */}
        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Login Method</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Anda login menggunakan WhatsApp OTP
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Nomor: {user.phone_number || "-"}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Active
            </span>
          </div>
        </div>

        {/* Account Verification */}
        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Verifikasi Akun</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {user.is_verified
                    ? "Akun Anda sudah terverifikasi"
                    : "Akun Anda belum terverifikasi"}
                </p>
              </div>
            </div>
            {user.is_verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Sesi Aktif</h3>
              <p className="text-sm text-gray-500 mt-1">
                Anda sedang login di perangkat ini
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Browser • {new Date().toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-800">
              Login Anda diamankan dengan WhatsApp OTP. Setiap kali login, kode verifikasi akan dikirim ke nomor WhatsApp Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
