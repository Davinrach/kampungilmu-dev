export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Tentang Kampung Ilmu</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8 text-center">
            Platform pembelajaran online yang menghubungkan instruktur berkualitas dengan siswa yang ingin meningkatkan skill mereka.
          </p>

          <div className="grid md:grid-cols-3 gap-8 my-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">5,000+</div>
              <div className="text-gray-600">Siswa Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">200+</div>
              <div className="text-gray-600">Instruktur</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">1,500+</div>
              <div className="text-gray-600">Kursus</div>
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl my-8">
            <h2 className="text-2xl font-bold mb-4">Misi Kami</h2>
            <p className="text-gray-700">
              Membuat pendidikan berkualitas dapat diakses oleh semua orang, di mana saja, kapan saja. 
              Kami percaya bahwa setiap orang memiliki potensi untuk belajar dan berkembang, 
              dan kami berkomitmen untuk menyediakan platform yang mendukung perjalanan pembelajaran mereka.
            </p>
          </div>

          <div className="my-8">
            <h2 className="text-2xl font-bold mb-4">Mengapa Memilih Kami?</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Instruktur Berpengalaman:</strong> Belajar dari praktisi dan ahli di bidangnya
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Fleksibel:</strong> Belajar sesuai dengan kecepatan dan jadwal Anda sendiri
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Sertifikat:</strong> Dapatkan sertifikat yang diakui setelah menyelesaikan kursus
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Komunitas:</strong> Bergabung dengan komunitas pembelajar yang aktif dan saling mendukung
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
