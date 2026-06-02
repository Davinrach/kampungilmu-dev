"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  adminService,
  Withdrawal,
  formatCurrency,
  formatDateTime,
} from "@/services/adminService";

type TabType = "pending" | "approved" | "rejected";

export default function WithdrawalsPage() {
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchWithdrawals = async () => {
    try {
      const data = await adminService.getWithdrawals();
      setWithdrawals(data);
    } catch (err: any) {
      console.error("Failed to fetch withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const filteredWithdrawals = withdrawals.filter((w) => w.status === activeTab);

  const handleApprove = async (id: string) => {
    if (!confirm("Yakin ingin menyetujui pencairan ini?")) return;

    setProcessingId(id);
    try {
      await adminService.approveWithdrawal(id);
      toast.success("Pencairan berhasil disetujui");
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyetujui pencairan");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.warning("Silakan isi alasan penolakan");
      return;
    }

    setProcessingId(selectedWithdrawal.id);
    try {
      await adminService.rejectWithdrawal(selectedWithdrawal.id, rejectReason.trim());
      toast.success("Pencairan berhasil ditolak");
      setShowRejectModal(false);
      setSelectedWithdrawal(null);
      setRejectReason("");
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menolak pencairan");
    } finally {
      setProcessingId(null);
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: "pending",
      label: "Menunggu",
      count: withdrawals.filter((w) => w.status === "pending").length,
    },
    {
      key: "approved",
      label: "Disetujui",
      count: withdrawals.filter((w) => w.status === "approved").length,
    },
    {
      key: "rejected",
      label: "Ditolak",
      count: withdrawals.filter((w) => w.status === "rejected").length,
    },
  ];

  const totalPending = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pencairan Dana</h1>
        <p className="text-gray-500">Kelola permintaan pencairan dari seller</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {withdrawals.filter((w) => w.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Nominal Pending</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Disetujui</p>
          <p className="text-2xl font-bold text-green-600">
            {withdrawals.filter((w) => w.status === "approved").length}
          </p>
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
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-indigo-100 text-indigo-700"
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

      {/* Withdrawals List */}
      {filteredWithdrawals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {activeTab === "pending"
              ? "Tidak Ada Pencairan Pending"
              : activeTab === "approved"
              ? "Belum Ada Pencairan Disetujui"
              : "Tidak Ada Pencairan Ditolak"}
          </h2>
          <p className="text-gray-500">
            {activeTab === "pending"
              ? "Semua permintaan pencairan sudah diproses"
              : "Tidak ada data dalam kategori ini"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{withdrawal.seller_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(withdrawal.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      withdrawal.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : withdrawal.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {withdrawal.status === "pending"
                      ? "Menunggu"
                      : withdrawal.status === "approved"
                      ? "Disetujui"
                      : "Ditolak"}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Nominal Pencairan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Rekening Tujuan</p>
                    <p className="font-semibold text-gray-900">{withdrawal.bank_name}</p>
                    <p className="text-sm text-gray-600 font-mono">{withdrawal.bank_account}</p>
                    <p className="text-sm text-gray-500">{withdrawal.account_holder}</p>
                  </div>
                </div>

                {withdrawal.status === "rejected" && withdrawal.reason && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-xs text-red-600 font-semibold mb-1">Alasan Penolakan</p>
                    <p className="text-sm text-red-700">{withdrawal.reason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {withdrawal.status === "pending" && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleOpenReject(withdrawal)}
                    disabled={processingId === withdrawal.id}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(withdrawal.id)}
                    disabled={processingId === withdrawal.id}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === withdrawal.id ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Setujui
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Tolak Pencairan</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedWithdrawal.seller_name} - {formatCurrency(selectedWithdrawal.amount)}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Contoh: Data rekening tidak valid, saldo tidak mencukupi, dll."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition resize-none"
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedWithdrawal(null);
                  setRejectReason("");
                }}
                disabled={processingId === selectedWithdrawal.id}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedWithdrawal.id || !rejectReason.trim()}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === selectedWithdrawal.id ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Tolak Pencairan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
