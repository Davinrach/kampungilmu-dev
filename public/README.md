# Public Assets Folder

Folder ini untuk menyimpan file static seperti:
- Logo (logo.png, logo.svg)
- Images (gambar produk, banner, dll)
- Icons (favicon.ico, dll)
- Fonts (jika ada custom fonts)

## Logo Kampung Ilmu

**PENTING**: Saat ini logo menggunakan SVG icon sementara yang sudah terintegrasi di kode.

Jika Anda memiliki file logo Kampung Ilmu (yang berbentuk lingkaran teal dengan simbol rumah/buku):
1. Simpan file logo sebagai `logo.png` atau `logo.svg` di folder `public/` ini
2. Update komponen di `src/app/(public)/layout.tsx` untuk menggunakan logo file:

```tsx
// Ganti bagian logo di navbar dengan:
<Link href="/" className="flex items-center gap-2 sm:gap-3">
  <Image 
    src="/logo.png" 
    alt="Kampung Ilmu Logo" 
    width={40} 
    height={40}
    className="w-8 h-8 sm:w-10 sm:h-10"
  />
  <span className="text-lg sm:text-2xl font-bold text-teal-600">
    Kampung Ilmu
  </span>
</Link>
```

## Cara Menggunakan

File di folder `public` bisa diakses langsung dari root URL:

```tsx
// Contoh penggunaan di Next.js
<Image src="/logo.png" alt="Logo" width={200} height={50} />

// Atau dengan tag img biasa
<img src="/logo.png" alt="Logo" />
```

## Struktur yang Disarankan

```
public/
├── logo.png              # Logo utama Kampung Ilmu
├── logo-white.png        # Logo versi putih (untuk background gelap)
├── favicon.ico           # Favicon
├── images/
│   ├── banners/         # Banner promo
│   ├── books/           # Cover buku
│   └── categories/      # Icon kategori
└── icons/               # Icon-icon lainnya
```

## Instruksi

1. Simpan logo Kampung Ilmu sebagai `logo.png` atau `logo.svg` di folder ini
2. Untuk favicon, simpan sebagai `favicon.ico` di root folder `public/`
3. Untuk gambar lain, buat subfolder sesuai kebutuhan (misalnya `images/books/` untuk cover buku)
