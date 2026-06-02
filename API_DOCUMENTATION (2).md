# 📚 Dokumentasi API — Kampung Ilmu Backend

> Dokumentasi lengkap seluruh endpoint REST API untuk platform marketplace buku **Kampung Ilmu**.  
> Ditujukan untuk developer frontend agar dapat melakukan integrasi dengan mudah.

---

## 📋 Daftar Isi

1. [Informasi Umum](#informasi-umum)
2. [Autentikasi & Format Response](#autentikasi--format-response)
3. [Auth Domain](#1-auth-domain)
4. [Account Domain](#2-account-domain)
5. [Admin - Account](#3-admin---account)
6. [Catalog Domain](#4-catalog-domain)
7. [Seller Books](#5-seller-books)
8. [Admin Categories](#6-admin-categories)
9. [Cart](#7-cart)
10. [Checkout](#8-checkout)
11. [Orders](#9-orders)
12. [Wallet (Seller)](#10-wallet-seller)
13. [Admin Withdrawals](#11-admin-withdrawals)
14. [Shipping / Fulfillment](#12-shipping--fulfillment)
15. [Review & Rating](#13-review--rating)
16. [Admin Review Reports](#14-admin-review-reports)
17. [Chat](#15-chat)
18. [Dispute](#16-dispute)
19. [Admin Disputes](#17-admin-disputes)
20. [Notifications](#18-notifications)
21. [Dashboard - Seller](#19-dashboard---seller)
22. [Dashboard - Admin](#20-dashboard---admin)
23. [Upload](#21-upload)
24. [Webhooks](#22-webhooks)

---

## Informasi Umum

| Item | Nilai |
|------|-------|
| **Base URL** | `/api/v1` |
| **Protocol** | HTTPS |
| **Content-Type** | `application/json` (kecuali upload: `multipart/form-data`) |
| **Encoding** | UTF-8 |

---

## Autentikasi & Format Response

### 🔐 Cara Mengirim Token JWT

Untuk endpoint yang membutuhkan autentikasi, sertakan header berikut pada setiap request:

```
Authorization: Bearer <access_token>
```

Token didapat dari response login (`access_token`).

### ✅ Format Response Sukses (Standard Wrapper)

```json
{
  "success": true,
  "message": "Deskripsi singkat operasi",
  "data": { ... }
}
```

### ❌ Format Response Error

```json
{
  "success": false,
  "message": "Pesan error yang dapat ditampilkan ke user",
  "errors": [
    {
      "field": "email",
      "message": "Email tidak valid"
    }
  ]
}
```

### 📊 HTTP Status Codes yang Digunakan

| Code | Keterangan |
|------|-----------|
| `200` | OK — Request berhasil |
| `201` | Created — Resource berhasil dibuat |
| `400` | Bad Request — Input tidak valid |
| `401` | Unauthorized — Token tidak ada atau expired |
| `403` | Forbidden — Tidak punya akses ke resource ini |
| `404` | Not Found — Resource tidak ditemukan |
| `409` | Conflict — Data duplikat atau konflik state |
| `422` | Unprocessable Entity — Validasi gagal |
| `429` | Too Many Requests — Rate limit tercapai |
| `500` | Internal Server Error — Kesalahan server |

---

## 1. Auth Domain

Endpoint untuk autentikasi pengguna (login, register, OTP, Google OAuth).

---

### `POST /api/v1/auth/request-otp`

**Deskripsi:** Mengirim kode OTP ke nomor WhatsApp pengguna.

**Autentikasi:** 🔓 Public

**Request Body:**

```json
{
  "phone": "6281234567890"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "OTP berhasil dikirim",
  "data": {
    "phone": "6281234567890",
    "expires_in": 300,
    "message": "Kode OTP telah dikirim ke WhatsApp Anda"
  }
}
```

---

### `POST /api/v1/auth/verify-otp`

**Deskripsi:** Verifikasi kode OTP. Jika user belum terdaftar, otomatis register.

**Autentikasi:** 🔓 Public

**Request Body:**

```json
{
  "phone": "6281234567890",
  "code": "123456"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phone_number": "6281234567890",
      "name": "John Doe",
      "role": "customer",
      "status": "active",
      "is_verified": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "is_new_user": false
  }
}
```

> **Catatan:** Jika `is_new_user: true`, arahkan user ke halaman complete-profile.

---

### `POST /api/v1/auth/google`

**Deskripsi:** Login menggunakan Google OAuth. Kirim `id_token` yang didapat dari Google Sign-In di frontend.

**Autentikasi:** 🔓 Public

**Request Body:**

```json
{
  "id_token": "google_id_token_from_frontend"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phone_number": null,
      "email": "user@gmail.com",
      "name": "John Doe",
      "role": "customer",
      "status": "active",
      "is_verified": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "is_new_user": false
  }
}
```

---

### `POST /api/v1/auth/admin/login`

**Deskripsi:** Login khusus admin menggunakan email dan password.

**Autentikasi:** 🔓 Public

**Request Body:**

```json
{
  "email": "admin@kampungilmu.com",
  "password": "securepassword123"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@kampungilmu.com",
      "name": "Admin",
      "role": "admin",
      "status": "active",
      "is_verified": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### `POST /api/v1/auth/complete-profile`

**Deskripsi:** Melengkapi profil user baru setelah registrasi pertama kali.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "name": "John Doe"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Profil berhasil dilengkapi",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "phone_number": "6281234567890",
    "email": null,
    "role": "customer",
    "status": "active"
  }
}
```

---

### `GET /api/v1/auth/profile`

**Deskripsi:** Melihat profil user yang sedang login.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Profil berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone_number": "6281234567890",
    "email": "user@email.com",
    "name": "John Doe",
    "role": "customer",
    "status": "active",
    "profile_photo": "https://storage.example.com/avatars/photo.jpg",
    "is_verified": true
  }
}
```

---

## 2. Account Domain

Endpoint untuk manajemen akun, alamat, profil toko (seller), dan rekening bank.

---

### `PATCH /api/v1/account/profile`

**Deskripsi:** Mengupdate profil pengguna.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "name": "New Name",
  "profile_photo": "https://storage.example.com/avatars/new-photo.jpg"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Profil berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "New Name",
    "profile_photo": "https://storage.example.com/avatars/new-photo.jpg"
  }
}
```

---

### `POST /api/v1/account/link-email`

**Deskripsi:** Menambahkan/menghubungkan email ke akun yang login via OTP.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "email": "user@email.com"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Email berhasil ditambahkan",
  "data": {
    "email": "user@email.com"
  }
}
```

---

### `POST /api/v1/account/link-phone`

**Deskripsi:** Menambahkan/menghubungkan nomor HP ke akun yang login via Google.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "phone": "6281234567890"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Nomor HP berhasil ditambahkan",
  "data": {
    "phone_number": "6281234567890"
  }
}
```

---

### `POST /api/v1/account/addresses`

**Deskripsi:** Menambahkan alamat pengiriman baru.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "label": "Rumah",
  "recipient_name": "John Doe",
  "phone": "081234567890",
  "full_address": "Jl. Merdeka No. 10, RT 05/RW 03",
  "kelurahan": "Airlangga",
  "kecamatan": "Gubeng",
  "city": "Surabaya",
  "postal_code": "60235",
  "is_default": true
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Alamat berhasil ditambahkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "label": "Rumah",
    "recipient_name": "John Doe",
    "phone": "081234567890",
    "full_address": "Jl. Merdeka No. 10, RT 05/RW 03",
    "kelurahan": "Airlangga",
    "kecamatan": "Gubeng",
    "city": "Surabaya",
    "postal_code": "60235",
    "is_default": true
  }
}
```

---

### `GET /api/v1/account/addresses`

**Deskripsi:** Melihat semua alamat milik user yang login.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar alamat berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "label": "Rumah",
      "recipient_name": "John Doe",
      "phone": "081234567890",
      "full_address": "Jl. Merdeka No. 10, RT 05/RW 03",
      "kelurahan": "Airlangga",
      "kecamatan": "Gubeng",
      "city": "Surabaya",
      "postal_code": "60235",
      "is_default": true
    }
  ]
}
```

---

### `PATCH /api/v1/account/addresses/:id`

**Deskripsi:** Mengedit alamat yang sudah ada. Kirim field yang ingin diubah saja.

**Autentikasi:** 🔒 JWT Required

**Request Body (partial):**

```json
{
  "full_address": "Jl. Baru No. 20",
  "postal_code": "60236"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Alamat berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "label": "Rumah",
    "recipient_name": "John Doe",
    "phone": "081234567890",
    "full_address": "Jl. Baru No. 20",
    "kelurahan": "Airlangga",
    "kecamatan": "Gubeng",
    "city": "Surabaya",
    "postal_code": "60236",
    "is_default": true
  }
}
```

---

### `DELETE /api/v1/account/addresses/:id`

**Deskripsi:** Menghapus alamat.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Alamat berhasil dihapus",
  "data": null
}
```

---

### `PATCH /api/v1/account/addresses/:id/set-default`

**Deskripsi:** Menjadikan alamat tertentu sebagai alamat default.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Alamat default berhasil diubah",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "is_default": true
  }
}
```

---

### `POST /api/v1/account/upgrade-seller`

**Deskripsi:** Mengajukan permohonan upgrade akun menjadi seller. Perlu disetujui admin.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "shop_name": "Toko Buku ABC",
  "shop_description": "Menjual buku bekas berkualitas",
  "shop_location_desc": "Blok A No 5, Kampung Ilmu Surabaya",
  "ktp_photo": "https://storage.example.com/ktp/ktp-john.jpg",
  "shop_photo": "https://storage.example.com/shops/toko-abc.jpg",
  "latitude": -7.123456,
  "longitude": 112.456789
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Pengajuan seller berhasil dikirim, menunggu persetujuan admin",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "shop_name": "Toko Buku ABC",
    "status": "pending"
  }
}
```

---

### `GET /api/v1/account/seller-profile`

**Deskripsi:** Melihat profil toko milik seller yang login.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Profil toko berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "shop_name": "Toko Buku ABC",
    "shop_description": "Menjual buku bekas berkualitas",
    "shop_location_desc": "Blok A No 5, Kampung Ilmu Surabaya",
    "shop_photo": "https://storage.example.com/shops/toko-abc.jpg",
    "latitude": -7.123456,
    "longitude": 112.456789,
    "status": "approved",
    "rating_avg": 4.8,
    "total_sold": 150
  }
}
```

---

### `PATCH /api/v1/account/seller-profile`

**Deskripsi:** Mengupdate profil toko. Hanya seller yang sudah terverifikasi.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller (terverifikasi)

**Request Body (partial):**

```json
{
  "shop_name": "Toko Buku ABC Updated",
  "shop_description": "Deskripsi baru toko",
  "shop_location_desc": "Blok B No 10",
  "shop_photo": "https://storage.example.com/shops/toko-abc-new.jpg",
  "latitude": -7.123456,
  "longitude": 112.456789
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Profil toko berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "shop_name": "Toko Buku ABC Updated",
    "shop_description": "Deskripsi baru toko",
    "shop_location_desc": "Blok B No 10",
    "shop_photo": "https://storage.example.com/shops/toko-abc-new.jpg",
    "latitude": -7.123456,
    "longitude": 112.456789
  }
}
```

---

### `POST /api/v1/account/bank-accounts`

**Deskripsi:** Menambahkan rekening bank untuk pencairan dana.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "bank_name": "BCA",
  "account_number": "1234567890",
  "account_holder": "John Doe",
  "is_default": true
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Rekening bank berhasil ditambahkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "bank_name": "BCA",
    "account_number": "1234567890",
    "account_holder": "John Doe",
    "is_default": true
  }
}
```

---

### `GET /api/v1/account/bank-accounts`

**Deskripsi:** Melihat daftar rekening bank milik user.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar rekening berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "bank_name": "BCA",
      "account_number": "1234567890",
      "account_holder": "John Doe",
      "is_default": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "bank_name": "Mandiri",
      "account_number": "0987654321",
      "account_holder": "John Doe",
      "is_default": false
    }
  ]
}
```

---

### `DELETE /api/v1/account/bank-accounts/:id`

**Deskripsi:** Menghapus rekening bank.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Rekening bank berhasil dihapus",
  "data": null
}
```

---

## 3. Admin - Account

Endpoint khusus admin untuk mengelola akun seller dan user.

---

### `POST /api/v1/admin/sellers/:userId/approve`

**Deskripsi:** Menyetujui pengajuan seller.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Seller berhasil disetujui",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved"
  }
}
```

---

### `POST /api/v1/admin/sellers/:userId/reject`

**Deskripsi:** Menolak pengajuan seller.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pengajuan seller ditolak",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "rejected"
  }
}
```

---

### `POST /api/v1/admin/users/:userId/suspend`

**Deskripsi:** Menangguhkan (suspend) akun user.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Akun berhasil di-suspend",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "suspended"
  }
}
```

---

### `POST /api/v1/admin/users/:userId/unsuspend`

**Deskripsi:** Mengaktifkan kembali akun yang di-suspend.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Akun berhasil diaktifkan kembali",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active"
  }
}
```

---

## 4. Catalog Domain

Endpoint untuk pencarian, filter, dan detail buku. Sebagian besar bersifat public.

---

### `GET /api/v1/books`

**Deskripsi:** Mencari dan memfilter daftar buku.

**Autentikasi:** 🔓 Public

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `keyword` | string | Kata kunci pencarian |
| `category_id` | uuid | Filter berdasarkan kategori |
| `book_type` | string | `new` atau `used` |
| `condition_grade` | string | Grade kondisi buku (untuk buku bekas) |
| `min_price` | number | Harga minimum |
| `max_price` | number | Harga maksimum |
| `seller_id` | uuid | Filter berdasarkan seller |
| `sort_by` | string | `cheapest`, `expensive`, `newest`, `best_seller`, `highest_rating` |
| `page` | number | Halaman (default: 1) |
| `per_page` | number | Jumlah per halaman (default: 20) |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar buku berhasil diambil",
  "data": {
    "books": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "title": "Laskar Pelangi",
        "author": "Andrea Hirata",
        "price": 45000,
        "book_type": "used",
        "condition_grade": "mulus",
        "photo_url": "https://storage.example.com/books/laskar.jpg",
        "seller_name": "Toko Buku ABC",
        "rating_avg": 4.5,
        "total_sold": 25
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 150,
      "total_pages": 8
    }
  }
}
```

---

### `GET /api/v1/books/:id`

**Deskripsi:** Melihat detail lengkap sebuah buku.

**Autentikasi:** 🔓 Public

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Detail buku berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "publisher": "Bentang Pustaka",
    "year_published": 2005,
    "isbn": "9789793062792",
    "description": "Novel inspiratif tentang pendidikan di Belitung",
    "price": 45000,
    "stock": 5,
    "book_type": "used",
    "condition_grade": "mulus",
    "photo_urls": [
      "https://storage.example.com/books/laskar-1.jpg",
      "https://storage.example.com/books/laskar-2.jpg"
    ],
    "category": {
      "id": "uuid",
      "name": "Novel"
    },
    "seller": {
      "id": "uuid",
      "shop_name": "Toko Buku ABC",
      "shop_photo": "https://storage.example.com/shops/toko-abc.jpg",
      "rating_avg": 4.8
    },
    "rating_avg": 4.5,
    "total_reviews": 12,
    "total_sold": 25,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### `GET /api/v1/books/suggest?q=las`

**Deskripsi:** Auto-suggest judul buku berdasarkan input pencarian.

**Autentikasi:** 🔓 Public

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `q` | string | Kata kunci (minimal 2 karakter) |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Saran pencarian berhasil diambil",
  "data": [
    "Laskar Pelangi",
    "Laskar Pelangi 2: Sang Pemimpi",
    "Last Breath"
  ]
}
```

---

### `GET /api/v1/books/popular-searches`

**Deskripsi:** Mendapatkan daftar pencarian populer.

**Autentikasi:** 🔓 Public

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pencarian populer berhasil diambil",
  "data": [
    "Novel Tere Liye",
    "Buku Fisika SMA",
    "Komik One Piece",
    "Kamus Bahasa Inggris",
    "Buku Resep Masakan"
  ]
}
```

---

### `GET /api/v1/books/search-history`

**Deskripsi:** Melihat riwayat pencarian user yang login.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Riwayat pencarian berhasil diambil",
  "data": [
    {
      "id": "uuid",
      "keyword": "Novel Tere Liye",
      "searched_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "keyword": "Buku Fisika",
      "searched_at": "2024-01-14T08:00:00Z"
    }
  ]
}
```

---

### `DELETE /api/v1/books/search-history`

**Deskripsi:** Menghapus seluruh riwayat pencarian user.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Riwayat pencarian berhasil dihapus",
  "data": null
}
```

---

### `GET /api/v1/categories`

**Deskripsi:** Melihat semua kategori buku yang tersedia.

**Autentikasi:** 🔓 Public

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar kategori berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "name": "Novel",
      "description": "Buku fiksi cerita panjang"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "name": "Komik",
      "description": "Buku bergambar/manga"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440022",
      "name": "Pelajaran",
      "description": "Buku pelajaran sekolah dan kuliah"
    }
  ]
}
```

---

## 5. Seller Books

Endpoint untuk seller mengelola listing buku mereka.

---

### `POST /api/v1/seller/books`

**Deskripsi:** Menambahkan buku baru ke listing toko.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body:**

```json
{
  "category_id": "550e8400-e29b-41d4-a716-446655440020",
  "title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "publisher": "Bentang Pustaka",
  "year_published": 2005,
  "isbn": "9789793062792",
  "description": "Novel inspiratif, kondisi masih sangat bagus",
  "price": 45000,
  "stock": 10,
  "book_type": "used",
  "condition_grade": "mulus",
  "photo_urls": [
    "https://storage.example.com/books/laskar-1.jpg",
    "https://storage.example.com/books/laskar-2.jpg"
  ]
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Buku berhasil ditambahkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "price": 45000,
    "stock": 10,
    "book_type": "used",
    "condition_grade": "mulus",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### `GET /api/v1/seller/books`

**Deskripsi:** Melihat daftar buku milik seller yang login.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar buku berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "title": "Laskar Pelangi",
      "author": "Andrea Hirata",
      "price": 45000,
      "stock": 10,
      "book_type": "used",
      "condition_grade": "mulus",
      "photo_url": "https://storage.example.com/books/laskar-1.jpg",
      "is_active": true,
      "total_sold": 25,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### `PATCH /api/v1/seller/books/:id`

**Deskripsi:** Mengedit informasi buku. Kirim field yang ingin diubah saja.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body (partial):**

```json
{
  "title": "Laskar Pelangi (Edisi Revisi)",
  "price": 50000,
  "description": "Deskripsi baru"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Buku berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "title": "Laskar Pelangi (Edisi Revisi)",
    "price": 50000,
    "description": "Deskripsi baru"
  }
}
```

---

### `PATCH /api/v1/seller/books/:id/stock`

**Deskripsi:** Mengupdate stok buku.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body:**

```json
{
  "stock": 15
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Stok berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "stock": 15
  }
}
```

---

### `PATCH /api/v1/seller/books/:id/toggle`

**Deskripsi:** Mengaktifkan atau menonaktifkan listing buku.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Status listing berhasil diubah",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "is_active": false
  }
}
```

---

### `PATCH /api/v1/seller/books/:id/photos`

**Deskripsi:** Mengupdate foto-foto buku (replace semua foto).

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body:**

```json
{
  "photo_urls": [
    "https://storage.example.com/books/laskar-new-1.jpg",
    "https://storage.example.com/books/laskar-new-2.jpg",
    "https://storage.example.com/books/laskar-new-3.jpg"
  ]
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Foto buku berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "photo_urls": [
      "https://storage.example.com/books/laskar-new-1.jpg",
      "https://storage.example.com/books/laskar-new-2.jpg",
      "https://storage.example.com/books/laskar-new-3.jpg"
    ]
  }
}
```

---

### `DELETE /api/v1/seller/books/:id`

**Deskripsi:** Menghapus buku dari listing.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Buku berhasil dihapus",
  "data": null
}
```

---

## 6. Admin Categories

Endpoint admin untuk mengelola kategori buku.

---

### `POST /api/v1/admin/categories`

**Deskripsi:** Menambahkan kategori buku baru.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Request Body:**

```json
{
  "name": "Novel",
  "description": "Buku fiksi cerita panjang"
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Kategori berhasil ditambahkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Novel",
    "description": "Buku fiksi cerita panjang"
  }
}
```

---

### `PATCH /api/v1/admin/categories/:id`

**Deskripsi:** Mengedit kategori buku.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Request Body:**

```json
{
  "name": "Novel & Fiksi",
  "description": "Buku fiksi dan novel"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Kategori berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Novel & Fiksi",
    "description": "Buku fiksi dan novel"
  }
}
```

---

### `DELETE /api/v1/admin/categories/:id`

**Deskripsi:** Menghapus kategori buku.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Kategori berhasil dihapus",
  "data": null
}
```

---

## 7. Cart

Endpoint untuk mengelola keranjang belanja.

---

### `POST /api/v1/cart`

**Deskripsi:** Menambahkan buku ke keranjang belanja.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "book_id": "550e8400-e29b-41d4-a716-446655440010",
  "quantity": 2
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Buku berhasil ditambahkan ke keranjang",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "book_id": "550e8400-e29b-41d4-a716-446655440010",
    "quantity": 2
  }
}
```

---

### `GET /api/v1/cart`

**Deskripsi:** Melihat isi keranjang belanja.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Keranjang berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "book_id": "550e8400-e29b-41d4-a716-446655440010",
      "title": "Laskar Pelangi",
      "author": "Andrea Hirata",
      "price": 45000,
      "photo_url": "https://storage.example.com/books/laskar-1.jpg",
      "stock": 10,
      "quantity": 2,
      "subtotal": 90000
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440031",
      "book_id": "550e8400-e29b-41d4-a716-446655440011",
      "title": "Filosofi Teras",
      "author": "Henry Manampiring",
      "price": 75000,
      "photo_url": "https://storage.example.com/books/filosofi.jpg",
      "stock": 3,
      "quantity": 1,
      "subtotal": 75000
    }
  ]
}
```

---

### `PATCH /api/v1/cart/:id`

**Deskripsi:** Mengupdate jumlah item di keranjang.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Keranjang berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "quantity": 3,
    "subtotal": 135000
  }
}
```

---

### `DELETE /api/v1/cart/:id`

**Deskripsi:** Menghapus item dari keranjang.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Item berhasil dihapus dari keranjang",
  "data": null
}
```

---

## 8. Checkout

Endpoint untuk membuat pesanan dari keranjang.

---

### `POST /api/v1/checkout`

**Deskripsi:** Membuat pesanan baru dari item keranjang yang dipilih. Menghasilkan link pembayaran.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "cart_item_ids": [
    "550e8400-e29b-41d4-a716-446655440030",
    "550e8400-e29b-41d4-a716-446655440031"
  ],
  "address_id": "550e8400-e29b-41d4-a716-446655440001",
  "fulfillment_method": "delivery",
  "courier_name": "jne",
  "courier_service": "reg",
  "shipping_cost": 15000,
  "payment_method": "VA",
  "payment_channel": "BCA",
  "note": "Tolong packing rapi ya"
}
```

> **Catatan:**
> - `fulfillment_method`: `delivery` (kirim via kurir) atau `pickup` (ambil di tempat / O2O)
> - `payment_method`: `VA` (Virtual Account), `EWALLET`, `QRIS`
> - `payment_channel`: Tergantung method — `BCA`, `BNI`, `Mandiri`, `GOPAY`, `SHOPEEPAY`, dll.

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat",
  "data": {
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "order_number": "ORD-20240115-001",
      "status": "pending_payment",
      "total_price": 165000,
      "shipping_cost": 15000,
      "grand_total": 180000,
      "fulfillment_method": "delivery",
      "note": "Tolong packing rapi ya",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "payment": {
      "id": "550e8400-e29b-41d4-a716-446655440050",
      "payment_method": "VA",
      "payment_channel": "BCA",
      "payment_url": "https://app.midtrans.com/snap/v2/vtweb/...",
      "va_number": "12345678901234",
      "amount": 180000,
      "expires_at": "2024-01-16T10:30:00Z"
    }
  }
}
```

---

## 9. Orders

Endpoint untuk mengelola pesanan (customer dan seller).

---

### `GET /api/v1/orders`

**Deskripsi:** Melihat daftar pesanan. Customer melihat pesanan mereka, seller melihat pesanan yang masuk ke toko mereka.

**Autentikasi:** 🔒 JWT Required

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `status` | string | Filter status: `pending_payment`, `paid`, `processing`, `shipped`, `completed`, `cancelled` |
| `page` | number | Halaman |
| `per_page` | number | Jumlah per halaman |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar pesanan berhasil diambil",
  "data": {
    "orders": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440040",
        "order_number": "ORD-20240115-001",
        "status": "processing",
        "total_price": 165000,
        "shipping_cost": 15000,
        "grand_total": 180000,
        "fulfillment_method": "delivery",
        "items_count": 2,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 5,
      "total_pages": 1
    }
  }
}
```

---

### `GET /api/v1/orders/:id`

**Deskripsi:** Melihat detail lengkap pesanan.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Detail pesanan berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "order_number": "ORD-20240115-001",
    "status": "processing",
    "total_price": 165000,
    "shipping_cost": 15000,
    "grand_total": 180000,
    "fulfillment_method": "delivery",
    "courier_name": "jne",
    "courier_service": "reg",
    "tracking_number": "JNE1234567890",
    "note": "Tolong packing rapi ya",
    "items": [
      {
        "id": "uuid",
        "book_id": "uuid",
        "title": "Laskar Pelangi",
        "author": "Andrea Hirata",
        "price": 45000,
        "quantity": 2,
        "subtotal": 90000,
        "photo_url": "https://storage.example.com/books/laskar-1.jpg"
      }
    ],
    "address": {
      "recipient_name": "John Doe",
      "phone": "081234567890",
      "full_address": "Jl. Merdeka No. 10",
      "city": "Surabaya",
      "postal_code": "60235"
    },
    "seller": {
      "id": "uuid",
      "shop_name": "Toko Buku ABC"
    },
    "payment": {
      "method": "VA",
      "channel": "BCA",
      "status": "paid",
      "paid_at": "2024-01-15T11:00:00Z"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}
```

---

### `POST /api/v1/orders/:id/confirm`

**Deskripsi:** Seller mengkonfirmasi pesanan dan mulai memproses.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pesanan berhasil dikonfirmasi",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "status": "processing"
  }
}
```

---

### `POST /api/v1/orders/:id/cancel`

**Deskripsi:** Customer membatalkan pesanan. Hanya bisa dilakukan saat status `pending_payment`.

**Autentikasi:** 🔒 JWT Required | **Role:** Customer

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pesanan berhasil dibatalkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "status": "cancelled"
  }
}
```

---

### `POST /api/v1/orders/:id/received`

**Deskripsi:** Customer mengkonfirmasi bahwa pesanan telah diterima.

**Autentikasi:** 🔒 JWT Required | **Role:** Customer

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pesanan dikonfirmasi telah diterima",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "status": "completed"
  }
}
```

---

### `POST /api/v1/orders/:id/verify-pickup`

**Deskripsi:** Seller memverifikasi kode pickup untuk pesanan O2O (ambil di tempat).

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body:**

```json
{
  "code": "123456"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Kode pickup valid, pesanan selesai",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "status": "completed"
  }
}
```

---

## 10. Wallet (Seller)

Endpoint untuk seller mengelola dompet/saldo mereka.

---

### `GET /api/v1/wallet`

**Deskripsi:** Melihat saldo wallet seller.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Saldo berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440060",
    "balance_held": 500000,
    "balance_available": 1200000
  }
}
```

> **Catatan:**
> - `balance_held`: Saldo yang masih ditahan (pesanan belum selesai)
> - `balance_available`: Saldo yang bisa dicairkan

---

### `GET /api/v1/wallet/mutations`

**Deskripsi:** Melihat riwayat mutasi saldo.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Riwayat mutasi berhasil diambil",
  "data": [
    {
      "id": "uuid",
      "type": "credit",
      "amount": 90000,
      "description": "Pembayaran pesanan ORD-20240115-001",
      "balance_after": 1200000,
      "created_at": "2024-01-15T12:00:00Z"
    },
    {
      "id": "uuid",
      "type": "debit",
      "amount": 100000,
      "description": "Pencairan dana ke BCA ****7890",
      "balance_after": 1100000,
      "created_at": "2024-01-14T09:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/wallet/withdraw`

**Deskripsi:** Mengajukan pencairan dana ke rekening bank.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body (Opsi A — menggunakan rekening tersimpan):**

```json
{
  "amount": 100000,
  "bank_account_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Request Body (Opsi B — input manual):**

```json
{
  "amount": 100000,
  "bank_name": "BCA",
  "bank_account": "1234567890",
  "account_holder": "John Doe"
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Pengajuan pencairan berhasil dikirim",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440070",
    "amount": 100000,
    "bank_name": "BCA",
    "account_number": "1234567890",
    "account_holder": "John Doe",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### `GET /api/v1/wallet/withdrawals`

**Deskripsi:** Melihat riwayat pencairan dana.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Riwayat pencairan berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440070",
      "amount": 100000,
      "bank_name": "BCA",
      "account_number": "1234567890",
      "account_holder": "John Doe",
      "status": "approved",
      "created_at": "2024-01-15T10:30:00Z",
      "processed_at": "2024-01-15T14:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440071",
      "amount": 200000,
      "bank_name": "Mandiri",
      "account_number": "0987654321",
      "account_holder": "John Doe",
      "status": "pending",
      "created_at": "2024-01-16T08:00:00Z",
      "processed_at": null
    }
  ]
}
```

---

## 11. Admin Withdrawals

Endpoint admin untuk mengelola pengajuan pencairan dana seller.

---

### `GET /api/v1/admin/withdrawals`

**Deskripsi:** Melihat daftar pengajuan pencairan yang pending.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar pencairan berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440070",
      "seller_id": "uuid",
      "seller_name": "Toko Buku ABC",
      "amount": 100000,
      "bank_name": "BCA",
      "account_number": "1234567890",
      "account_holder": "John Doe",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### `POST /api/v1/admin/withdrawals/:id/approve`

**Deskripsi:** Menyetujui pengajuan pencairan.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pencairan berhasil disetujui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440070",
    "status": "approved",
    "processed_at": "2024-01-15T14:00:00Z"
  }
}
```

---

### `POST /api/v1/admin/withdrawals/:id/reject`

**Deskripsi:** Menolak pengajuan pencairan.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Request Body:**

```json
{
  "reason": "Data rekening tidak valid"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pencairan ditolak",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440070",
    "status": "rejected",
    "reason": "Data rekening tidak valid",
    "processed_at": "2024-01-15T14:00:00Z"
  }
}
```

---

## 12. Shipping / Fulfillment

Endpoint untuk cek ongkir dan tracking pengiriman.

---

### `POST /api/v1/shipping/rates`

**Deskripsi:** Mengecek tarif ongkos kirim berdasarkan asal, tujuan, dan berat.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "origin_postal_code": "60235",
  "destination_postal_code": "10110",
  "weight": 500,
  "item_value": 100000
}
```

> **Catatan:** `weight` dalam gram, `item_value` dalam rupiah (untuk asuransi).

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Tarif ongkir berhasil diambil",
  "data": [
    {
      "courier_name": "jne",
      "courier_service": "reg",
      "service_name": "JNE Reguler",
      "cost": 15000,
      "etd": "2-3 hari",
      "description": "Layanan reguler"
    },
    {
      "courier_name": "jne",
      "courier_service": "yes",
      "service_name": "JNE YES",
      "cost": 25000,
      "etd": "1 hari",
      "description": "Yakin Esok Sampai"
    },
    {
      "courier_name": "sicepat",
      "courier_service": "reg",
      "service_name": "SiCepat Reguler",
      "cost": 12000,
      "etd": "2-3 hari",
      "description": "Layanan reguler"
    }
  ]
}
```

---

### `GET /api/v1/shipping/track/:id`

**Deskripsi:** Melihat status tracking pengiriman pesanan.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Tracking berhasil diambil",
  "data": {
    "order_id": "550e8400-e29b-41d4-a716-446655440040",
    "courier_name": "jne",
    "tracking_number": "JNE1234567890",
    "status": "in_transit",
    "history": [
      {
        "status": "picked_up",
        "description": "Paket telah diambil kurir",
        "timestamp": "2024-01-16T08:00:00Z"
      },
      {
        "status": "in_transit",
        "description": "Paket dalam perjalanan - Hub Surabaya",
        "timestamp": "2024-01-16T14:00:00Z"
      }
    ]
  }
}
```

---

## 13. Review & Rating

Endpoint untuk review dan rating buku.

---

### `GET /api/v1/reviews/book/:bookId`

**Deskripsi:** Melihat semua review untuk buku tertentu.

**Autentikasi:** 🔓 Public

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Review berhasil diambil",
  "data": {
    "rating_avg": 4.5,
    "total_reviews": 12,
    "reviews": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440080",
        "user_name": "John Doe",
        "user_photo": "https://storage.example.com/avatars/john.jpg",
        "rating": 5,
        "comment": "Buku masih sangat bagus, packing rapi!",
        "photo_url": "https://storage.example.com/reviews/review-1.jpg",
        "seller_reply": "Terima kasih atas reviewnya!",
        "created_at": "2024-01-16T10:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440081",
        "user_name": "Jane Smith",
        "user_photo": null,
        "rating": 4,
        "comment": "Bagus, tapi ada sedikit lipatan di halaman",
        "photo_url": null,
        "seller_reply": null,
        "created_at": "2024-01-15T08:00:00Z"
      }
    ]
  }
}
```

---

### `POST /api/v1/reviews`

**Deskripsi:** Memberikan review untuk buku yang sudah dibeli (pesanan completed).

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440040",
  "book_id": "550e8400-e29b-41d4-a716-446655440010",
  "rating": 5,
  "comment": "Buku masih sangat bagus, packing rapi!",
  "photo_url": "https://storage.example.com/reviews/review-1.jpg"
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Review berhasil ditambahkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440080",
    "rating": 5,
    "comment": "Buku masih sangat bagus, packing rapi!",
    "photo_url": "https://storage.example.com/reviews/review-1.jpg",
    "created_at": "2024-01-16T10:00:00Z"
  }
}
```

---

### `PATCH /api/v1/reviews/:id`

**Deskripsi:** Mengedit review. Hanya bisa dilakukan dalam 4 hari setelah review dibuat.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Update: setelah dibaca lebih lanjut, ada beberapa halaman yang pudar",
  "photo_url": "https://storage.example.com/reviews/review-1-updated.jpg"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Review berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440080",
    "rating": 4,
    "comment": "Update: setelah dibaca lebih lanjut, ada beberapa halaman yang pudar",
    "photo_url": "https://storage.example.com/reviews/review-1-updated.jpg",
    "updated_at": "2024-01-17T08:00:00Z"
  }
}
```

---

### `POST /api/v1/reviews/:id/reply`

**Deskripsi:** Seller membalas review dari customer.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body:**

```json
{
  "reply": "Terima kasih atas feedbacknya! Kami akan lebih teliti lagi."
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Balasan berhasil ditambahkan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440080",
    "seller_reply": "Terima kasih atas feedbacknya! Kami akan lebih teliti lagi."
  }
}
```

---

### `POST /api/v1/reviews/:id/report`

**Deskripsi:** Melaporkan review yang melanggar ketentuan.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "reason": "Review mengandung kata-kata kasar dan tidak relevan"
}
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Laporan berhasil dikirim",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440090",
    "review_id": "550e8400-e29b-41d4-a716-446655440080",
    "reason": "Review mengandung kata-kata kasar dan tidak relevan",
    "status": "pending",
    "created_at": "2024-01-16T12:00:00Z"
  }
}
```

---

## 14. Admin Review Reports

Endpoint admin untuk mengelola laporan review.

---

### `GET /api/v1/admin/review-reports`

**Deskripsi:** Melihat daftar laporan review yang pending.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar laporan berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440090",
      "review_id": "550e8400-e29b-41d4-a716-446655440080",
      "review_comment": "Review yang dilaporkan...",
      "reporter_name": "Jane Smith",
      "reason": "Review mengandung kata-kata kasar",
      "status": "pending",
      "created_at": "2024-01-16T12:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/admin/review-reports/:id/resolve`

**Deskripsi:** Meninjau dan memutuskan laporan review.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Request Body:**

```json
{
  "status": "reviewed",
  "admin_note": "Review dihapus karena melanggar ketentuan komunitas"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Laporan berhasil ditinjau",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440090",
    "status": "reviewed",
    "admin_note": "Review dihapus karena melanggar ketentuan komunitas",
    "resolved_at": "2024-01-16T15:00:00Z"
  }
}
```

---

## 15. Chat

Endpoint untuk fitur chat antara customer dan seller.

---

### `POST /api/v1/chat/rooms`

**Deskripsi:** Membuat atau mengambil chat room yang sudah ada antara customer dan seller.

**Autentikasi:** 🔒 JWT Required

**Request Body (dari customer):**

```json
{
  "seller_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Body (dari seller):**

```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440005"
}
```

**Response Sukses (200/201):**

```json
{
  "success": true,
  "message": "Chat room berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "seller_id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "550e8400-e29b-41d4-a716-446655440005",
    "seller_name": "Toko Buku ABC",
    "customer_name": "John Doe",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### `GET /api/v1/chat/rooms`

**Deskripsi:** Melihat daftar semua chat room milik user.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar chat berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "partner_name": "Toko Buku ABC",
      "partner_photo": "https://storage.example.com/shops/toko-abc.jpg",
      "last_message": "Halo, buku masih ada?",
      "last_message_at": "2024-01-15T10:30:00Z",
      "unread_count": 2
    }
  ]
}
```

---

### `POST /api/v1/chat/rooms/:roomId/messages`

**Deskripsi:** Mengirim pesan dalam chat room.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "content": "Halo, buku Laskar Pelangi masih ada stoknya?",
  "photo_url": null
}
```

> **Catatan:** `photo_url` opsional, diisi jika mengirim gambar.

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Pesan berhasil dikirim",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440110",
    "room_id": "550e8400-e29b-41d4-a716-446655440100",
    "sender_id": "550e8400-e29b-41d4-a716-446655440005",
    "content": "Halo, buku Laskar Pelangi masih ada stoknya?",
    "photo_url": null,
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### `GET /api/v1/chat/rooms/:roomId/messages`

**Deskripsi:** Melihat pesan dalam chat room. Otomatis menandai pesan sebagai sudah dibaca.

**Autentikasi:** 🔒 JWT Required

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `page` | number | Halaman (default: 1) |
| `per_page` | number | Jumlah per halaman (default: 50) |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Pesan berhasil diambil",
  "data": {
    "messages": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440110",
        "sender_id": "550e8400-e29b-41d4-a716-446655440005",
        "sender_name": "John Doe",
        "content": "Halo, buku Laskar Pelangi masih ada stoknya?",
        "photo_url": null,
        "is_read": true,
        "created_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440111",
        "sender_id": "550e8400-e29b-41d4-a716-446655440000",
        "sender_name": "Toko Buku ABC",
        "content": "Masih ada kak, stok tinggal 3",
        "photo_url": null,
        "is_read": true,
        "created_at": "2024-01-15T10:32:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total_items": 2,
      "total_pages": 1
    }
  }
}
```

---

## 16. Dispute

Endpoint untuk mengajukan dan mengelola sengketa pesanan.

---

### `POST /api/v1/disputes`

**Deskripsi:** Mengajukan sengketa/komplain terhadap pesanan.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440040",
  "seller_id": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "Buku yang diterima dalam kondisi rusak, halaman sobek",
  "type": "damaged",
  "evidence_photos": "[\"https://storage.example.com/disputes/evidence-1.jpg\",\"https://storage.example.com/disputes/evidence-2.jpg\"]"
}
```

> **Catatan:** `type` bisa berupa: `damaged`, `not_received`, `wrong_item`, `other`

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "Sengketa berhasil diajukan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440120",
    "order_id": "550e8400-e29b-41d4-a716-446655440040",
    "reason": "Buku yang diterima dalam kondisi rusak, halaman sobek",
    "type": "damaged",
    "status": "open",
    "created_at": "2024-01-17T10:00:00Z"
  }
}
```

---

### `POST /api/v1/disputes/:id/respond`

**Deskripsi:** Seller memberikan respon terhadap sengketa.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Request Body:**

```json
{
  "response": "Buku dikirim dalam kondisi baik, kemungkinan rusak saat pengiriman",
  "evidence": "[\"https://storage.example.com/disputes/seller-evidence-1.jpg\"]"
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Respon berhasil dikirim",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440120",
    "seller_response": "Buku dikirim dalam kondisi baik, kemungkinan rusak saat pengiriman",
    "status": "responded"
  }
}
```

---

### `GET /api/v1/disputes/:id`

**Deskripsi:** Melihat detail sengketa.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Detail sengketa berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440120",
    "order_id": "550e8400-e29b-41d4-a716-446655440040",
    "order_number": "ORD-20240115-001",
    "customer_name": "John Doe",
    "seller_name": "Toko Buku ABC",
    "reason": "Buku yang diterima dalam kondisi rusak",
    "type": "damaged",
    "evidence_photos": [
      "https://storage.example.com/disputes/evidence-1.jpg"
    ],
    "seller_response": "Buku dikirim dalam kondisi baik",
    "seller_evidence": [
      "https://storage.example.com/disputes/seller-evidence-1.jpg"
    ],
    "status": "responded",
    "decision": null,
    "created_at": "2024-01-17T10:00:00Z"
  }
}
```

---

## 17. Admin Disputes

Endpoint admin untuk mengelola sengketa.

---

### `GET /api/v1/admin/disputes`

**Deskripsi:** Melihat daftar sengketa yang terbuka/perlu ditinjau.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar sengketa berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440120",
      "order_number": "ORD-20240115-001",
      "customer_name": "John Doe",
      "seller_name": "Toko Buku ABC",
      "type": "damaged",
      "status": "responded",
      "created_at": "2024-01-17T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/admin/disputes/:id/resolve`

**Deskripsi:** Admin memutuskan hasil sengketa.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Request Body:**

```json
{
  "decision": "refund_full"
}
```

> **Catatan:** Nilai `decision`:
> - `refund_full` — Refund penuh ke customer
> - `refund_partial` — Refund sebagian
> - `rejected` — Sengketa ditolak, dana tetap ke seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Sengketa berhasil diputuskan",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440120",
    "decision": "refund_full",
    "status": "resolved",
    "resolved_at": "2024-01-18T10:00:00Z"
  }
}
```

---

## 18. Notifications

Endpoint untuk mengelola notifikasi pengguna.

---

### `GET /api/v1/notifications`

**Deskripsi:** Melihat daftar notifikasi.

**Autentikasi:** 🔒 JWT Required

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `page` | number | Halaman (default: 1) |
| `per_page` | number | Jumlah per halaman (default: 20) |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Notifikasi berhasil diambil",
  "data": {
    "notifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440130",
        "type": "transaction",
        "title": "Pesanan Dikonfirmasi",
        "body": "Pesanan ORD-20240115-001 sedang diproses seller",
        "is_read": false,
        "data": {
          "order_id": "550e8400-e29b-41d4-a716-446655440040"
        },
        "created_at": "2024-01-15T12:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440131",
        "type": "chat",
        "title": "Pesan Baru",
        "body": "Toko Buku ABC mengirim pesan",
        "is_read": true,
        "data": {
          "room_id": "550e8400-e29b-41d4-a716-446655440100"
        },
        "created_at": "2024-01-15T10:32:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 15,
      "total_pages": 1
    }
  }
}
```

---

### `GET /api/v1/notifications/unread-count`

**Deskripsi:** Mendapatkan jumlah notifikasi yang belum dibaca.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Jumlah notifikasi belum dibaca",
  "data": {
    "unread_count": 5
  }
}
```

---

### `PATCH /api/v1/notifications/:id/read`

**Deskripsi:** Menandai satu notifikasi sebagai sudah dibaca.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Notifikasi ditandai sudah dibaca",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440130",
    "is_read": true
  }
}
```

---

### `PATCH /api/v1/notifications/read-all`

**Deskripsi:** Menandai semua notifikasi sebagai sudah dibaca.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Semua notifikasi ditandai sudah dibaca",
  "data": null
}
```

---

### `GET /api/v1/notifications/preferences`

**Deskripsi:** Melihat preferensi notifikasi user.

**Autentikasi:** 🔒 JWT Required

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Preferensi notifikasi berhasil diambil",
  "data": {
    "push_enabled": true,
    "in_app_enabled": true,
    "whatsapp_enabled": true,
    "transaction_notif": true,
    "chat_notif": true,
    "promo_notif": false
  }
}
```

---

### `PATCH /api/v1/notifications/preferences`

**Deskripsi:** Mengupdate preferensi notifikasi.

**Autentikasi:** 🔒 JWT Required

**Request Body:**

```json
{
  "push_enabled": true,
  "in_app_enabled": true,
  "whatsapp_enabled": false,
  "transaction_notif": true,
  "chat_notif": true,
  "promo_notif": false
}
```

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Preferensi notifikasi berhasil diperbarui",
  "data": {
    "push_enabled": true,
    "in_app_enabled": true,
    "whatsapp_enabled": false,
    "transaction_notif": true,
    "chat_notif": true,
    "promo_notif": false
  }
}
```

---

## 19. Dashboard - Seller

Endpoint untuk dashboard statistik seller.

---

### `GET /api/v1/seller/dashboard`

**Deskripsi:** Mendapatkan statistik ringkasan toko seller.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Dashboard berhasil diambil",
  "data": {
    "total_revenue": 5000000,
    "total_orders": 85,
    "total_products": 42,
    "pending_orders": 3,
    "balance_available": 1200000,
    "balance_held": 500000,
    "today_orders": 2,
    "today_revenue": 150000
  }
}
```

---

### `GET /api/v1/seller/dashboard/sales-chart`

**Deskripsi:** Mendapatkan data grafik penjualan.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `period` | string | `daily`, `weekly`, atau `monthly` |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Data grafik berhasil diambil",
  "data": {
    "period": "daily",
    "chart": [
      { "date": "2024-01-10", "revenue": 200000, "orders": 3 },
      { "date": "2024-01-11", "revenue": 150000, "orders": 2 },
      { "date": "2024-01-12", "revenue": 350000, "orders": 5 },
      { "date": "2024-01-13", "revenue": 0, "orders": 0 },
      { "date": "2024-01-14", "revenue": 100000, "orders": 1 },
      { "date": "2024-01-15", "revenue": 450000, "orders": 6 },
      { "date": "2024-01-16", "revenue": 200000, "orders": 3 }
    ]
  }
}
```

---

### `GET /api/v1/seller/dashboard/performance`

**Deskripsi:** Mendapatkan data performa toko.

**Autentikasi:** 🔒 JWT Required | **Role:** Seller

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Performa toko berhasil diambil",
  "data": {
    "rating_avg": 4.8,
    "total_reviews": 120,
    "response_rate": 95.5,
    "avg_response_time_minutes": 15,
    "order_completion_rate": 98.2,
    "total_sold": 350,
    "repeat_customer_rate": 25.0
  }
}
```

---

## 20. Dashboard - Admin

Endpoint untuk dashboard statistik platform (admin).

---

### `GET /api/v1/admin/dashboard`

**Deskripsi:** Mendapatkan statistik ringkasan platform.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Dashboard admin berhasil diambil",
  "data": {
    "total_users": 5000,
    "total_sellers": 150,
    "total_books": 3200,
    "total_orders": 8500,
    "total_revenue": 250000000,
    "pending_seller_approvals": 5,
    "pending_withdrawals": 3,
    "open_disputes": 2,
    "today_orders": 45,
    "today_revenue": 3500000
  }
}
```

---

### `GET /api/v1/admin/transactions`

**Deskripsi:** Monitoring semua transaksi platform.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `status` | string | Filter status pesanan |
| `page` | number | Halaman |
| `per_page` | number | Jumlah per halaman |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Daftar transaksi berhasil diambil",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "order_number": "ORD-20240115-001",
        "customer_name": "John Doe",
        "seller_name": "Toko Buku ABC",
        "grand_total": 180000,
        "status": "completed",
        "payment_method": "VA - BCA",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 8500,
      "total_pages": 425
    }
  }
}
```

---

### `GET /api/v1/admin/reports`

**Deskripsi:** Mendapatkan laporan sistem berdasarkan periode.

**Autentikasi:** 🔒 JWT Required | **Role:** Admin

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `period` | string | `daily`, `weekly`, atau `monthly` |

**Response Sukses (200):**

```json
{
  "success": true,
  "message": "Laporan berhasil diambil",
  "data": {
    "period": "monthly",
    "total_revenue": 25000000,
    "total_orders": 850,
    "total_new_users": 200,
    "total_new_sellers": 10,
    "top_categories": [
      { "name": "Novel", "total_sold": 250 },
      { "name": "Komik", "total_sold": 180 },
      { "name": "Pelajaran", "total_sold": 150 }
    ],
    "top_sellers": [
      { "shop_name": "Toko Buku ABC", "total_revenue": 5000000 },
      { "shop_name": "Buku Murah", "total_revenue": 3500000 }
    ]
  }
}
```

---

## 21. Upload

Endpoint untuk upload file (gambar).

---

### `POST /api/v1/upload?folder=books`

**Deskripsi:** Upload file gambar ke storage. Digunakan untuk upload foto buku, KTP, review, dispute, avatar, dll.

**Autentikasi:** 🔒 JWT Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `file` | File | File gambar (max 5MB) |

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `folder` | string | Folder tujuan: `books`, `ktp`, `reviews`, `disputes`, `avatars`, `general` |

**Format yang didukung:** JPG, PNG, WebP

**Contoh Request (cURL):**

```bash
curl -X POST "https://api.kampungilmu.com/api/v1/upload?folder=books" \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/image.jpg"
```

**Response Sukses (201):**

```json
{
  "success": true,
  "message": "File berhasil diupload",
  "data": {
    "url": "https://storage.example.com/books/550e8400-e29b-41d4-a716-446655440010.jpg",
    "filename": "550e8400-e29b-41d4-a716-446655440010.jpg",
    "size": 245000,
    "content_type": "image/jpeg"
  }
}
```

> **Catatan:** URL yang dikembalikan digunakan sebagai value untuk field `photo_url`, `photo_urls`, `ktp_photo`, dll di endpoint lain.

---

## 22. Webhooks

Endpoint webhook untuk menerima notifikasi dari layanan pihak ketiga. **Tidak memerlukan autentikasi JWT**, tetapi divalidasi menggunakan signature dari masing-masing provider.

---

### `POST /api/v1/webhooks/midtrans`

**Deskripsi:** Menerima notifikasi pembayaran dari Midtrans. Dipanggil otomatis oleh Midtrans saat status pembayaran berubah.

**Autentikasi:** 🔓 No Auth (divalidasi via Midtrans signature)

**Request Body (dari Midtrans):**

```json
{
  "transaction_time": "2024-01-15 11:00:00",
  "transaction_status": "settlement",
  "transaction_id": "midtrans-txn-id",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "signature_hash...",
  "payment_type": "bank_transfer",
  "order_id": "ORD-20240115-001",
  "merchant_id": "M001234",
  "gross_amount": "180000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Notification processed"
}
```

> **Catatan:** Endpoint ini mengubah status pesanan secara otomatis:
> - `settlement` / `capture` → status pesanan menjadi `paid`
> - `expire` / `cancel` → status pesanan menjadi `cancelled`
> - `deny` → status pesanan tetap `pending_payment`

---

### `POST /api/v1/webhooks/biteship`

**Deskripsi:** Menerima update status pengiriman dari Biteship. Dipanggil otomatis oleh Biteship saat status tracking berubah.

**Autentikasi:** 🔓 No Auth (divalidasi via Biteship signature)

**Request Body (dari Biteship):**

```json
{
  "event": "order.status",
  "order_id": "biteship-order-id",
  "status": "delivered",
  "courier_tracking_id": "JNE1234567890",
  "courier_company": "jne",
  "updated_at": "2024-01-17T14:00:00Z"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Notification processed"
}
```

> **Catatan:** Status dari Biteship:
> - `picking_up` → Kurir sedang mengambil paket
> - `picked` → Paket sudah diambil
> - `dropping_off` → Paket dalam pengiriman
> - `delivered` → Paket sudah diterima

---

## 📝 Catatan Tambahan

### Pagination

Semua endpoint yang mengembalikan list/daftar mendukung pagination dengan format:

```json
{
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 100,
    "total_pages": 5
  }
}
```

### Rate Limiting

API menerapkan rate limiting untuk mencegah penyalahgunaan:
- **OTP Request:** Maksimal 3 request per nomor per 5 menit
- **General API:** 100 request per menit per user
- **Upload:** 20 request per menit per user

### Konvensi Waktu

- Semua waktu menggunakan format **ISO 8601** dengan timezone **UTC**
- Contoh: `2024-01-15T10:30:00Z`

### UUID

- Semua ID menggunakan format **UUID v4**
- Contoh: `550e8400-e29b-41d4-a716-446655440000`

### Mata Uang

- Semua nilai uang dalam satuan **Rupiah (IDR)** tanpa desimal
- Contoh: `50000` (bukan `50000.00`)

---

## 🔄 Flow Umum

### Flow Pembelian (Customer)

```
1. POST /auth/verify-otp          → Login
2. GET /books?keyword=...         → Cari buku
3. POST /cart                     → Tambah ke keranjang
4. POST /shipping/rates           → Cek ongkir
5. POST /checkout                 → Buat pesanan + bayar
6. [Midtrans webhook]            → Status jadi "paid"
7. [Seller konfirmasi]           → Status jadi "processing"
8. [Biteship webhook]            → Tracking update
9. POST /orders/:id/received     → Konfirmasi terima
10. POST /reviews                 → Beri review
```

### Flow Penjualan (Seller)

```
1. POST /auth/verify-otp          → Login
2. POST /account/upgrade-seller   → Daftar jadi seller
3. [Admin approve]               → Status seller "approved"
4. POST /seller/books             → Tambah listing buku
5. GET /orders                    → Lihat pesanan masuk
6. POST /orders/:id/confirm       → Konfirmasi pesanan
7. GET /wallet                    → Cek saldo
8. POST /wallet/withdraw          → Cairkan dana
```

### Flow O2O (Ambil di Tempat)

```
1. POST /checkout (fulfillment_method: "pickup")  → Buat pesanan
2. [Pembayaran berhasil]                          → Status "paid"
3. POST /orders/:id/confirm                       → Seller konfirmasi
4. [Customer datang ke toko]
5. POST /orders/:id/verify-pickup (code: "...")   → Verifikasi kode
6. [Pesanan selesai]
```

---

> 📌 **Dokumen ini di-generate untuk keperluan integrasi frontend.**  
> Jika ada pertanyaan atau ketidaksesuaian, hubungi tim backend.
