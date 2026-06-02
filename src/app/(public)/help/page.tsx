import Link from "next/link";

export const metadata = {
  title: "Pusat Bantuan - Kampung Ilmu",
  description: "Pusat bantuan dan FAQ untuk pengguna Kampung Ilmu.",
};

export default function HelpPage() {
  const faqs = [
    {
      question: "Bagaimana cara membeli buku di Kampung Ilmu?",
      answer:
        "Anda bisa mencari buku yang diinginkan melalui halaman 'Buku', lalu menambahkannya ke keranjang. Setelah itu, masuk ke halaman Keranjang, pilih buku yang ingin dibeli, dan lakukan checkout untuk mendapatkan detail pembayaran.",
    },
    {
      question: "Apakah buku yang dijual di sini asli?",
      answer:
        "Ya! Kami bekerja sama dengan puluhan pedagang legendaris di sentra Kampung Ilmu Surabaya. Setiap buku, baik baru maupun bekas, dijamin orisinalitasnya oleh para penjual tepercaya kami.",
    },
    {
      question: "Berapa lama waktu pengiriman?",
      answer:
        "Waktu pengiriman bervariasi tergantung dari jasa ekspedisi yang dipilih dan lokasi Anda. Biasanya membutuhkan waktu 2-5 hari kerja untuk pengiriman domestik.",
    },
    {
      question: "Apakah bisa mengambil buku langsung ke lapak?",
      answer:
        "Tentu saja! Kami memiliki layanan O2O (Online-to-Offline). Anda bisa mencari buku secara online dan mengambilnya langsung di lapak fisik Kampung Ilmu Surabaya untuk menghemat ongkos kirim.",
    },
    {
      question: "Bagaimana jika buku yang saya terima rusak atau tidak sesuai?",
      answer:
        "Kami memiliki sistem Garansi dan Rekening Bersama. Dana Anda hanya akan diteruskan ke penjual setelah Anda mengonfirmasi bahwa buku diterima dalam kondisi baik. Jika bermasalah, Anda bisa mengajukan komplain pengembalian dana melalui menu Pesanan.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pusat Bantuan</h1>
          <p className="text-lg text-gray-600">
            Ada pertanyaan atau kendala? Temukan jawabannya di bawah ini.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="p-6 sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-start gap-3">
                    <span className="text-teal-500 font-black">Q:</span>
                    {faq.question}
                  </h3>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 font-bold">A:</span>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-teal-600 rounded-2xl p-8 text-white flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Email Kami</h3>
            <p className="text-teal-100 mb-6">
              Kirimkan email kepada tim dukungan kami kapan saja.
            </p>
            <a
              href="mailto:support@kampungilmu.com"
              className="mt-auto bg-white text-teal-700 px-6 py-2.5 rounded-full font-bold hover:bg-teal-50 transition"
            >
              support@kampungilmu.com
            </a>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 text-teal-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-gray-500 mb-6">
              Ngobrol langsung dengan tim support kami (09:00 - 17:00).
            </p>
            <Link
              href="/chat"
              className="mt-auto bg-teal-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-teal-700 transition"
            >
              Mulai Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
