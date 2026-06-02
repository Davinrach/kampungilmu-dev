"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import {
  walletService,
  WalletBalance,
  WalletMutation,
  Withdrawal,
  WithdrawPayload,
  getMutationTypeConfig,
  getWithdrawalStatusConfig,
  formatCurrency,
  formatWalletDate,
} from "@/services/walletService";
import { accountService } from "@/services/accountService";

type TabType = "overview" | "mutations" | "withdrawals";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

export default function SellerWalletPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [mutations, setMutations] = useState<WalletMutation[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Withdrawal form
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = async () => {
    try {
      const [balanceData, mutationsData, withdrawalsData, bankData] = await Promise.all([
        walletService.getBalance(),
        walletService.getMutations(),
        walletService.getWithdrawals(),
        accountService.getAddresses().catch(() => []), // Bank accounts might use different endpoint
      ]);
      setBalance(balanceData);
      setMutations(mutationsData);
      setWithdrawals(withdrawalsData);
      
      // Try to get bank accounts
      try {
        const banks = await accountService.getBankAccounts();
        setBankAccounts(banks);
      } catch {
        // Bank accounts endpoint might not exist
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat data wallet");
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "seller") {
      router.push("/");
      return;
    }

    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [hasHydrated, isAuthenticated, user, router]);

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount.replace(/\D/g, ""));
    
    if (!amount || amount < 50000) {
      toast.error("Minimal pencairan Rp 50.000");
      return;
    }

    if (balance && amount > balance.available_balance) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    if (!selectedBank) {
      toast.error("Pilih rekening tujuan");
      return;
    }

    setWithdrawing(true);
    try {
      const payload: WithdrawPayload = {
        amount,
        bank_name: selectedBank.bank_name,
        bank_account: selectedBank.account_number,
        account_holder: selectedBank.account_holder,
      };

      await walletService.requestWithdrawal(payload);
      toast.success("Permintaan pencairan berhasil diajukan");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setSelectedBank(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengajukan pencairan");
    } finally {
      setWithdrawing(false);
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "overview", label: "Ringkasan" },
    { key: "mutations", label: "Riwayat Mutasi" },
    { key: "withdrawals", label: "Riwayat Pencairan" },
  ];

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              fetchData().finally(() => setLoading(false));
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500">Kelola saldo dan pencairan dana Anda</p>
      </div>

      {/* Balance Cards */}
      {balance && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
            <p className="text-green-100 text-sm mb-1">Saldo Tersedia</p>
            <p className="text-2xl font-bold">
              {formatCurrency(balance.available_balance)}
            </p>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={balance.available_balance < 50000}
              className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cairkan Dana
            </button>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-5 text-white">
            <p className="text-yellow-100 text-sm mb-1">Saldo Ditahan</p>
            <p className="text-2xl font-bold">
              {formatCurrency(balance.held_balance)}
            </p>
            <p className="text-yellow-100 text-xs mt-2">
              Akan dilepas setelah pesanan selesai
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
            <p className="text-purple-100 text-sm mb-1">Total Pendapatan</p>
            <p className="text-2xl font-bold">
              {formatCurrency(balance.total_earnings)}
            </p>
            <p className="text-purple-100 text-xs mt-2">Sepanjang waktu</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Mutasi Terbaru</h3>
              {mutations.length === 0 ? (
                <p className="text-gray-500 text-sm">Belum ada mutasi</p>
              ) : (
                <div className="space-y-3">
                  {mutations.slice(0, 5).map((mutation) => {
                    const config = getMutationTypeConfig(mutation.type);
                    return (
                      <div
                        key={mutation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {mutation.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatWalletDate(mutation.created_at)}
                          </p>
                        </div>
                        <p className={`font-bold ${config.color}`}>
                          {config.sign}
                          {formatCurrency(mutation.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mutations Tab */}
          {activeTab === "mutations" && (
            <div className="space-y-3">
              {mutations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada riwayat mutasi</p>
                </div>
              ) : (
                mutations.map((mutation) => {
                  const config = getMutationTypeConfig(mutation.type);
                  return (
                    <div
                      key={mutation.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            mutation.type === "credit" || mutation.type === "release"
                              ? "bg-green-100"
                              : mutation.type === "debit"
                              ? "bg-red-100"
                              : "bg-yellow-100"
                          }`}
                        >
                          <span className={`text-lg font-bold ${config.color}`}>
                            {config.sign}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {mutation.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatWalletDate(mutation.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${config.color}`}>
                        {config.sign}
                        {formatCurrency(mutation.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === "withdrawals" && (
            <div className="space-y-3">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada riwayat pencairan</p>
                </div>
              ) : (
                withdrawals.map((withdrawal) => {
                  const statusConfig = getWithdrawalStatusConfig(withdrawal.status);
                  return (
                    <div
                      key={withdrawal.id}
                      className="p-4 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {formatCurrency(withdrawal.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {withdrawal.bank_name} - {withdrawal.bank_account}
                          </p>
                          <p className="text-xs text-gray-400">
                            a.n. {withdrawal.account_holder}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Diajukan: {formatWalletDate(withdrawal.created_at)}</span>
                        {withdrawal.processed_at && (
                          <span>
                            Diproses: {formatWalletDate(withdrawal.processed_at)}
                          </span>
                        )}
                      </div>
                      {withdrawal.reason && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                          Alasan: {withdrawal.reason}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Cairkan Dana</h2>
              <p className="text-sm text-gray-500 mt-1">
                Saldo tersedia: {balance && formatCurrency(balance.available_balance)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Pencairan
                </label>
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setWithdrawAmount(
                      value ? parseInt(value).toLocaleString("id-ID") : ""
                    );
                  }}
                  placeholder="Minimal Rp 50.000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rekening Tujuan
                </label>
                {bankAccounts.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      Anda belum memiliki rekening bank. Silakan tambahkan di
                      halaman profil.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bankAccounts.map((bank) => (
                      <label
                        key={bank.id}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                          selectedBank?.id === bank.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bank"
                          checked={selectedBank?.id === bank.id}
                          onChange={() => setSelectedBank(bank)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {bank.bank_name} - {bank.account_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            a.n. {bank.account_holder}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  Pencairan akan diproses dalam 1-3 hari kerja setelah disetujui
                  admin.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                  setSelectedBank(null);
                }}
                disabled={withdrawing}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || !selectedBank}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawing ? (
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
                  "Ajukan Pencairan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
