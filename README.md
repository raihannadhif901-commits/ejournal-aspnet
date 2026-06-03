# Yopi Hijab - Premium E-Commerce Store

[![Laravel Version](https://img.shields.io/badge/Laravel-11.x-red?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React Version](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Filament](https://img.shields.io/badge/Filament_v3-Admin_Panel-amber?style=for-the-badge&logo=laravel)](https://filamentphp.com)
[![Midtrans](https://img.shields.io/badge/Midtrans-Payment_Gateway-blueviolet?style=for-the-badge)](https://midtrans.com)
[![Pest Testing](https://img.shields.io/badge/Pest_PHP-Testing_Suite-green?style=for-the-badge)](https://pestphp.com)

A premium, modern E-Commerce web application built for **Yopi Hijab**. This application features an elegant storefront designed with smooth user interactions, a fully integrated **Midtrans Sandbox Payment Gateway** for secure instant checkout, a robust **Filament v3 Admin Panel** for management, and a complete automated test suite using **Pest PHP**.

---

## Fitur Utama (Key Features)

### Frontend (Storefront Pembeli)
* **Premium Glassmorphic UI**: Palet warna kurasi mewah (*Alabaster Silk, Dark Espresso, Sand Cream*) dengan tipografi modern (*Outfit & Playfair Display*).
* **Smooth Scrolling (Lenis)**: Pergerakan scroll halaman yang sangat halus untuk memberikan impresi premium kepada pembeli.
* **Framer Motion Animations**: Transisi mikro-animasi pada pemuatan elemen, tombol hover, dan modal detail produk (Quick View).
* **Dynamic Hero Showcase**: Menampilkan produk *featured* pilihan admin langsung di banner utama halaman beranda.
* **Interactive FAQ Page**: Halaman bantuan interaktif menggunakan efek transisi Accordion yang dinamis.
* **Cart Drawer**: Laci belanja melayang dengan penghitung kuantitas otomatis sebelum checkout.
* **In-App Checkout Snap**: Pembeli melakukan pembayaran langsung di halaman web melalui pop-up overlay Midtrans Snap (mendukung QRIS, GoPay, ShopeePay, Virtual Account Bank) tanpa diarahkan ke situs luar.

### Dashboard Admin (Filament v3)
* **Product Management (CRUD)**:
  * Pengaturan produk lengkap (Nama, Kategori, Deskripsi, Harga, Tag).
  * **Opsi Gambar Ganda**: Admin dapat menentukan foto produk melalui unggah file lokal (*Upload*) ATAU menempelkan tautan URL gambar eksternal (Google Drive / Cloud Storage).
  * **Featured Switcher**: Mengatur produk tertentu untuk tampil di hero banner utama.
* **Orders Dashboard (CRUD & Monitoring)**:
  * Pemantauan semua transaksi masuk dengan filter status pembayaran (`paid`, `pending`, `failed`).
  * **Tampilan Detail Pesanan**: Menyajikan informasi kontak dan alamat pengiriman pelanggan.
  * **Order Items Repeater**: Menampilkan daftar barang yang dibeli (nama produk, harga satuan, jumlah beli, subtotal) dalam format tabel terkunci (*read-only*) untuk keamanan data.
  * **Manual Status Update**: Admin dapat mengubah status pembayaran secara manual jika diperlukan (misal ada kendala teknis).
  * *Fitur Tambah & Hapus Pesanan dinonaktifkan untuk melindungi integritas riwayat transaksi bisnis.*

### Integrasi Payment Gateway (Midtrans Sandbox)
* **Secure Webhooks**: Endpoint webhook (`/checkout/webhook`) dilindungi dengan validasi **SHA-512 Signature Key** yang dicocokkan dengan Server Key.
* **Automated Status Update**: Sinkronisasi instan status transaksi dari Midtrans ke database lokal (`settlement`/`capture` -> `paid`, `expire`/`cancel`/`deny` -> `failed`).
* **CSRF Protection Bypass**: Pengecualian rute webhook dari verifikasi token CSRF Laravel agar dapat diakses oleh server luar Midtrans.

### Analitik & Keamanan (Analytics & Security)
* **Analitik Produk**: Pencatatan jumlah tayangan produk (*Product Views*) dan frekuensi produk dimasukkan ke keranjang (*Cart Additions*).
* **Super Admin Lock**: Panel admin Filament diamankan secara ketat menggunakan kontrak `FilamentUser` dan hanya mengizinkan akun dengan status `is_admin = true` yang dapat login.
* **API Rate Limiter**: Pembatasan request (*throttle*) pada rute penambahan keranjang dan analitik untuk mencegah eksploitasi.

---

## Tech Stack

* **Backend**: Laravel 11 (PHP 8.2+)
* **Frontend**: React 18, TypeScript, Inertia.js
* **CSS Framework**: Tailwind CSS
* **Database**: SQLite (Bebas setup, sangat ringan)
* **Admin Panel**: Filament v3 (Livewire)
* **Payment Gateway**: Midtrans PHP SDK & Snap JS
* **Testing Tool**: Pest PHP
* **Animation**: Framer Motion & Lenis Scroll

---

## Panduan Instalasi Lokal (Local Installation)

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di komputer lokal Anda:

### 1. Prasyarat (Prerequisites)
Pastikan komputer Anda sudah terinstal:
* PHP >= 8.2
* Composer
* Node.js & NPM
* Git

### 2. Kloning Repositori
```bash
git clone https://github.com/raihannadhif901-commits/hijab-premium-ecommerce.git
cd hijab-premium-ecommerce
```

### 3. Instalasi Dependency (PHP & Node)
```bash
composer install
npm install
```

### 4. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
copy .env.example .env
```
Buka file `.env` yang baru dibuat dan isi kredensial Midtrans Sandbox Anda:
```env
APP_URL=http://127.0.0.1:8000

MIDTRANS_MERCHANT_ID=your_merchant_id
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_IS_PRODUCTION=false
```

### 5. Setup Database & Seeders
Buat file database SQLite baru:
```bash
# Windows (PowerShell)
New-Item -ItemType File -Path database/database.sqlite

# Windows (CMD)
type null > database/database.sqlite
```
Jalankan migrasi database beserta pembuatan data awal produk & akun admin otomatis:
```bash
php artisan migrate:fresh --seed
```
*Catatan: Akun Super Admin default otomatis dibuat saat proses seeder:*
* **Email**: `admin@yopihijab.com`
* **Password**: `password`

### 6. Jalankan Server Lokal
Jalankan server backend Laravel (Terminal 1):
```bash
php artisan serve
```
Jalankan server kompilasi frontend Vite (Terminal 2):
```bash
npm run dev
```
Buka **[http://127.0.0.1:8000](http://127.0.0.1:8000)** di browser Anda!

---

## Menjalankan Automated Testing

Proyek ini dilengkapi dengan 40 skenario pengujian otomatis menggunakan Pest PHP untuk memvalidasi keamanan, otorisasi admin, alur keranjang, hingga webhook status pembayaran.

Untuk menjalankan seluruh tes:
```bash
php artisan test
```

---

## Panduan Deployment Produksi (Production Checklist)

1. **Ubah Konfigurasi `.env`**:
   * Set `APP_ENV=production` dan `APP_DEBUG=false`.
   * Ubah `MIDTRANS_IS_PRODUCTION=true`.
   * Ganti Kredensial Midtrans dengan Merchant ID, Client Key, dan Server Key **Live/Production** Anda.
2. **Kompilasi Frontend**:
   Jalankan `npm run build` sebelum mengunggah file ke hosting (jika menggunakan Shared Hosting), atau biarkan server CI/CD Anda (seperti Render/Fly.io) menjalankan build otomatis.
3. **Pengaturan URL Notifikasi**:
   Buka Dashboard Production Midtrans Anda, masuk ke **Settings > Configuration**, dan isi:
   * **Payment Notification URL**: `https://domain-anda.com/checkout/webhook`
   * **Finish Redirect URL**: `https://domain-anda.com/`
   * **Unfinish Redirect URL**: `https://domain-anda.com/`
   * **Error Redirect URL**: `https://domain-anda.com/`

---

## Lisensi

Proyek ini berlisensi **MIT License** - bebas digunakan untuk tujuan edukasi dan referensi portofolio.
