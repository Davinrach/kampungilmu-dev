export const metadata = {
  title: "Kebijakan Privasi - Kampung Ilmu",
  description: "Kebijakan privasi dan perlindungan data pengguna Kampung Ilmu.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Kebijakan Privasi
          </h1>
          <p className="text-gray-500">
            Terakhir diperbarui: 3 Juni 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8 sm:p-12">
          <div className="prose prose-teal max-w-none text-gray-600 leading-relaxed">
            <p className="mb-8 text-lg">
              Privasi Anda sangat penting bagi kami. Kebijakan ini menjelaskan bagaimana
              Kampung Ilmu mengumpulkan, menggunakan, dan melindungi informasi pribadi
              Anda saat menggunakan platform kami.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p className="mb-4">
              Kami mengumpulkan beberapa jenis informasi untuk menyediakan dan
              meningkatkan layanan kami kepada Anda:
            </p>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li>
                <strong>Data Pribadi:</strong> Termasuk nama, alamat email, nomor telepon, 
                dan alamat pengiriman saat Anda mendaftar atau melakukan transaksi.
              </li>
              <li>
                <strong>Data Transaksi:</strong> Rincian pembelian Anda, namun kami tidak 
                menyimpan detail kartu kredit/debit secara langsung (ditangani oleh Midtrans).
              </li>
              <li>
                <strong>Data Penggunaan:</strong> Informasi tentang bagaimana Anda 
                mengakses dan menggunakan platform (alamat IP, jenis browser, halaman yang dikunjungi).
              </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              2. Bagaimana Kami Menggunakan Informasi Anda
            </h2>
            <p className="mb-4">
              Informasi yang dikumpulkan digunakan untuk berbagai tujuan:
            </p>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li>Untuk memproses pesanan dan pembayaran Anda.</li>
              <li>Untuk menyediakan dukungan pelanggan (customer support).</li>
              <li>Untuk mendeteksi, mencegah, dan mengatasi masalah teknis atau penipuan.</li>
              <li>Untuk memberikan rekomendasi buku yang relevan (jika diaktifkan).</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              3. Berbagi Informasi
            </h2>
            <p className="mb-6">
              Kami <strong>tidak pernah</strong> menjual data pribadi Anda kepada pihak 
              ketiga. Kami hanya membagikan informasi Anda kepada penjual (seller) sebatas 
              yang diperlukan untuk menyelesaikan pesanan Anda (contoh: alamat pengiriman).
              Kami juga berbagi data secara aman dengan mitra layanan kami, seperti penyedia 
              logistik (kurir) dan gerbang pembayaran (Midtrans).
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              4. Keamanan Data
            </h2>
            <p className="mb-6">
              Keamanan data Anda penting bagi kami. Kami menggunakan standar industri 
              seperti enkripsi (SSL/TLS) saat transit data dan penyimpanan yang aman 
              untuk melindungi informasi pribadi Anda dari akses yang tidak sah.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              5. Hak Anda
            </h2>
            <p className="mb-6">
              Anda berhak untuk meminta salinan dari data pribadi Anda yang kami simpan, 
              serta berhak untuk meminta penghapusan akun beserta seluruh data yang 
              terkait dengannya melalui pengaturan profil Anda atau dengan menghubungi 
              dukungan pelanggan kami.
            </p>

            <div className="bg-teal-50 p-6 rounded-xl border border-teal-100 mt-10">
              <h3 className="font-bold text-teal-900 mb-2">Hubungi Kami</h3>
              <p className="text-teal-800 text-sm">
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi 
                kami di <strong>privacy@kampungilmu.com</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
