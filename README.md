# First Media Privilege Vouchers Portal

[![.NET Core](https://img.shields.io/badge/.NET-8.0-blueviolet.svg)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-003b57.svg)](https://www.sqlite.org/)

Portal Katalog & Manajemen Voucher Privilege eksklusif untuk pelanggan setia **First Media (PT Link Net Tbk)**. Aplikasi ini dirancang dengan antarmuka yang modern, responsif (*mobile-first*), berkinerja tinggi, dan dilengkapi fitur telemetri pelacakan klik pengguna serta visualisasi analitik grafik di sisi admin.

Proyek ini dibangun menggunakan **ASP.NET Core (Razor Pages)** dan **Tailwind CSS v4** dengan database **SQLite** untuk mendukung kemudahan portabilitas demo lokal tanpa konfigurasi database eksternal yang rumit.

---

## Fitur Utama

### 1. Katalog Promo Dinamis (`/Promos`)
*   **Tampilan Klien Modern**: Desain bersih bertema oranye khas brand Linknet yang menyatu, menggunakan kombinasi tipografi atraktif (**Space Grotesk** untuk tajuk & **Plus Jakarta Sans** untuk teks isi).
*   **Filter Kategori Instan**: Menyaring promo (F&B, Entertainment, Shopping, Transport) secara dinamis menggunakan parameter query terintegrasi.
*   **Pagination Terintegrasi**: Membagi katalog voucher secara rapi (konfigurasi default: 6 voucher per halaman) untuk mengoptimalkan waktu muat halaman pada perangkat mobile.

### 2. Sensor Kode & Salin Otomatis (`/VoucherDetail`)
*   **Interactive Reveal Code**: Kode redeem disamarkan secara visual (*blurred*) saat halaman pertama kali dimuat untuk memberikan kesan interaktif.
*   **Smart Action Button**: Tombol unblur bertransisi secara dinamis menjadi tombol **"Salin Kode"** (*Copy to Clipboard*) dengan umpan balik visual "Tersalin!" berwarna hijau setelah disalin.

### 3. Dashboard Admin & Telemetri Analitik (`/Admin`)
*   **Click Telemetry**: Setiap klik penyingkapan kode voucher direkam secara asinkron (*background fetch API*) ke dalam database SQLite.
*   **Statistik Ringkasan (Stat Cards)**: Menampilkan metrik *real-time* mengenai Total Voucher, Total Klik akumulatif, dan nama Mitra Terpopuler (beserta jumlah tayangannya).
*   **Visualisasi Grafik (Chart.js)**:
    *   *Bar Chart* (Grafik Batang) menampilkan **Top 5 Voucher Terpopuler** berdasarkan jumlah klik terbanyak.
    *   *Doughnut Chart* (Grafik Donat) menampilkan **Porsi Distribusi Klik per Kategori Promo**.
*   **Manajemen CRUD Voucher**: Formulir pembuatan voucher baru yang divalidasi, lengkap dengan tombol **Demo Image Templates** untuk mengisi URL gambar Unsplash secara instan saat pengujian.

---

## Stack Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend Framework** | ASP.NET Core (Razor Pages) | Runtime .NET 8.0 (LTS) - Server-Side Rendered (SSR) |
| **Database** | SQLite | File-based local database (`firstmedia_vouchers.db`) |
| **ORM / Data Access** | Entity Framework Core 8.0.12 | Pemetaan objek data secara aman & proteksi SQL Injection |
| **Frontend Styling** | Tailwind CSS v4 | Utility-first CSS dengan kompilasi NPM CLI tercepat |
| **Typography** | Space Grotesk & Plus Jakarta Sans | Google Fonts kombinasi modern untuk keterbacaan tinggi |
| **Analitik & Ikon** | Chart.js & Lucide Icons | Visualisasi grafik interaktif & ikon vektor SVG |

---

## Struktur Proyek Utama

```text
├── Data/
│   ├── AppDbContext.cs       # Konfigurasi tabel EF Core
│   └── DbInitializer.cs      # Seeding otomatis 12 voucher dummy awal
├── Models/
│   └── Voucher.cs            # Model data Voucher & Telemetri
├── Pages/
│   ├── Admin/
│   │   ├── Create.cshtml     # Form input voucher baru (admin)
│   │   └── Index.cshtml      # Dashboard visualisasi & tabel CRUD
│   ├── Promos.cshtml         # Katalog ber-paginasi & kategori filter
│   ├── VoucherDetail.cshtml  # Detail voucher, unblur code & copy utility
│   └── Shared/_Layout.cshtml # Master layout bertema oranye & Google Fonts
├── Styles/
│   └── input.css             # Berkas konfigurasi Tailwind v4 & keyframes
├── wwwroot/
│   ├── css/site.css          # Hasil kompilasi akhir CSS Tailwind
│   └── icon.png              # File logo resmi Linknet/First Media
└── Program.cs                # Entry-point bootstrap aplikasi & seeding
```

---

## Cara Menjalankan di Lokal

### Prasyarat
1.  **.NET 8.0 SDK** terpasang di komputer Anda.
2.  **Node.js & NPM** terpasang untuk me-build aset Tailwind CSS.

### Langkah 1: Klon & Masuk ke Direktori Proyek
```bash
git clone <url-repositori-anda>
cd firstmedia-voucher-privilege
```

### Langkah 2: Build Aset CSS Tailwind
Pasang dependensi CLI Tailwind dan lakukan kompilasi:
```bash
npm install
npm run build:css
```
*(Gunakan `npm run watch:css` di terminal terpisah jika ingin memodifikasi tampilan agar CSS terkompilasi secara otomatis saat file diubah).*

### Langkah 3: Jalankan Aplikasi
Jalankan perintah berikut untuk menjalankan server lokal:
```bash
dotnet watch
```
Setelah server menyala, buka browser Anda di alamat: **`http://localhost:5000`** (atau port lain yang tertera di terminal).

---

## Skenario Pengujian Demo Portofolio

1.  **Akses Katalog**: Buka halaman utama. Anda langsung melihat katalog berisi 6 voucher awal dengan tema oranye Linknet yang memukau. Klik tombol halaman **2** di bagian bawah untuk melihat sisa voucher.
2.  **Uji Penyingkapan Kode**: Pilih voucher *Starbucks Coffee*, klik **Tampilkan Kode**. Kode voucher akan ter-unblur secara halus dan tombol berubah menjadi **Salin Kode**. Klik sekali lagi untuk menyalin ke clipboard.
3.  **Verifikasi Telemetri Admin**: 
    *   Buka dashboard admin di menu **Dashboard Admin** (`/Admin`).
    *   Amati kartu statistik **Total Klik** dan kolom **Klik / Reveal** Starbucks Coffee yang bertambah menjadi `1x`.
    *   Perhatikan **Bar Chart** dan **Doughnut Chart** yang ikut memperbarui datanya secara grafis dan dinamis secara instan!
4.  **Tambah Voucher Baru**: Klik **Tambah Voucher Baru** di pojok kanan atas, isi formulir, klik template gambar demo **F&B (Kopi)**, lalu klik **Simpan & Publikasikan**. Kembali ke halaman katalog utama untuk memverifikasi voucher tersebut sudah tampil secara otomatis.
