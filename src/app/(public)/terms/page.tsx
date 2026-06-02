export const metadata = {
  title: "Syarat & Ketentuan - Kampung Ilmu",
  description: "Syarat dan ketentuan penggunaan platform Kampung Ilmu.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Syarat & Ketentuan
          </h1>
          <p className="text-gray-500">
            Terakhir diperbarui: 3 Juni 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8 sm:p-12">
          <div className="prose prose-teal max-w-none text-gray-600 leading-relaxed">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Pengenalan
            </h2>
            <p className="mb-6">
              Selamat datang di Kampung Ilmu. Syarat & Ketentuan ini mengatur
              penggunaan platform kami. Dengan mengakses atau menggunakan platform
              ini, Anda menyetujui untuk terikat dengan ketentuan yang tertulis
              di sini. Jika Anda tidak setuju dengan seluruh bagian dari syarat &
              ketentuan ini, Anda tidak diperkenankan menggunakan platform kami.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              2. Akun Pengguna
            </h2>
            <p className="mb-4">
              Ketika Anda membuat akun di Kampung Ilmu, Anda harus memberikan
              informasi yang akurat, lengkap, dan terbaru setiap saat.
              Kegagalan untuk melakukannya merupakan pelanggaran terhadap
              Ketentuan ini, yang dapat mengakibatkan penghentian segera akun
              Anda di layanan kami.
            </p>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li>
                Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi
                (OTP atau autentikasi Google) yang Anda gunakan.
              </li>
              <li>
                Anda setuju untuk tidak mengungkapkan kata sandi/OTP Anda kepada
                pihak ketiga mana pun.
              </li>
              <li>
                Anda harus segera memberi tahu kami jika menyadari adanya
                pelanggaran keamanan atau penggunaan akun Anda secara tidak sah.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              3. Pembelian dan Pembayaran (Escrow)
            </h2>
            <p className="mb-6">
              Sistem pembayaran kami menggunakan fasilitas Escrow (Rekening Bersama). 
              Dana yang Anda transfer tidak akan langsung diberikan kepada penjual, 
              melainkan ditahan oleh sistem kami hingga Anda mengonfirmasi 
              penerimaan buku dengan baik, atau waktu komplain otomatis telah habis.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              4. Kewajiban Penjual (Seller)
            </h2>
            <p className="mb-6">
              Penjual diwajibkan memberikan informasi yang sejujur-jujurnya mengenai
              kondisi fisik buku. Buku bekas harus disertai dengan grade kondisi
              (Seperti Baru, Sangat Baik, Baik, atau Layak Baca) sesuai dengan
              standar yang ditetapkan oleh Kampung Ilmu.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              5. Layanan O2O (Online-to-Offline)
            </h2>
            <p className="mb-6">
              Bagi pembeli yang memilih untuk mengambil buku secara langsung ke
              lapak di Kampung Ilmu Surabaya, pembeli wajib menyelesaikan
              transaksi pembayaran di dalam platform terlebih dahulu. Pengambilan
              hanya dapat dilakukan setelah penjual mengonfirmasi ketersediaan
              barang dan mengabari melalui fitur chat.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
              6. Perubahan Ketentuan
            </h2>
            <p className="mb-6">
              Kami berhak, atas kebijakan kami sendiri, untuk mengubah atau
              mengganti Ketentuan ini kapan saja. Jika revisi tersebut bersifat
              material, kami akan mencoba memberikan pemberitahuan setidaknya
              30 hari sebelum ketentuan baru berlaku.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
