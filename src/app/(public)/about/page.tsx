export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Tentang Kampung Ilmu</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8 text-center">
            Platform marketplace modern yang menghubungkan pencinta literasi dengan puluhan pedagang buku legendaris di sentra Kampung Ilmu Surabaya secara aman dan tepercaya.
          </p>

          <div className="grid md:grid-cols-3 gap-8 my-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">2000+</div>
              <div className="text-gray-600">Koleksi Buku<br/>(Baru & Bekas)</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">70+</div>
              <div className="text-gray-600">Lapak<br/>(Pedagang Pasar Kampung Ilmu)</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">1000+</div>
              <div className="text-gray-600">User<br/>(Diakses oleh banyak pengguna aktif)</div>
            </div>
          </div>

          <div className="bg-teal-50 p-8 rounded-xl my-8 border border-teal-100">
            <h2 className="text-2xl font-bold mb-4 text-teal-900">Misi Kami</h2>
            <p className="text-teal-800 leading-relaxed">
              Mendorong digitalisasi pedagang buku tradisional di Surabaya melalui penyediaan platform web yang transparan dan efisien. Kami berkomitmen menjembatani transaksi jarak jauh yang aman sekaligus mempertahankan eksistensi fisik sentra buku Kampung Ilmu melalui inovasi teknologi yang inklusif.
            </p>
          </div>

          <div className="my-8">
            <h2 className="text-2xl font-bold mb-6">Mengapa Memilih Kami?</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Sistem Transaksi Escrow (Rekening Bersama)</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Belanja online tanpa ragu. Dana Anda baru akan diteruskan ke penjual setelah Anda mengonfirmasi bahwa buku telah diterima dengan baik.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Fitur Penilaian Kondisi (Grading) Buku</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Transparansi adalah prioritas kami. Setiap buku fisik—baik baru maupun bekas—memiliki kejelasan status kondisi agar sesuai dengan ekspektasi Anda.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Kemudahan Layanan O2O (Online-to-Offline)</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Cari dan pesan buku favorit Anda secara online, lalu ambil langsung di lapak pasar Kampung Ilmu Surabaya untuk menghemat ongkos kirim sekaligus mengecek fisik buku secara langsung.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
