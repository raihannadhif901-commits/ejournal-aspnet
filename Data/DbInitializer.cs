using System;
using System.Linq;
using FirstMediaVoucher.Models;

namespace FirstMediaVoucher.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Drop and recreate to ensure clean table matching the new schema
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            if (context.Vouchers.Any())
            {
                return; // Database has been seeded
            }

            var vouchers = new Voucher[]
            {
                new Voucher
                {
                    PartnerName = "Cinema XXI",
                    Title = "Beli 1 Gratis 1 Tiket Regular",
                    Description = "Nikmati promo Beli 1 Gratis 1 untuk pembelian tiket nonton bioskop XXI tipe studio Regular di seluruh Indonesia khusus hari Sabtu dan Minggu.",
                    DiscountAmount = "Buy 1 Get 1",
                    Category = "Entertainment",
                    RedeemCode = "XXIFMB1G1",
                    ExpiryDate = DateTime.Today.AddMonths(1),
                    TermsAndConditions = "Berlaku hanya untuk tiket studio Regular;Hanya berlaku pada hari Sabtu & Minggu;Maksimal 1 kali klaim per pelanggan per bulan;Harus ditukarkan langsung di kasir XXI sebelum pembayaran.",
                    GradientClass = "from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 text-amber-800",
                    ImageUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Starbucks Coffee",
                    Title = "Diskon 30% Minuman Favorit",
                    Description = "Dapatkan potongan langsung sebesar 30% untuk semua jenis minuman ukuran Grande di seluruh gerai Starbucks Indonesia.",
                    DiscountAmount = "30% OFF",
                    Category = "F&B",
                    RedeemCode = "SBUX30FM",
                    ExpiryDate = DateTime.Today.AddMonths(2),
                    TermsAndConditions = "Berlaku untuk semua jenis minuman ukuran Grande;Tidak berlaku untuk makanan dan merchandise;Dapat ditukarkan di seluruh outlet Starbucks Indonesia kecuali bandara;Tidak dapat digabungkan dengan promo lainnya.",
                    GradientClass = "from-emerald-600/10 via-emerald-600/5 to-transparent border-emerald-200 text-emerald-800",
                    ImageUrl = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Grab Indonesia",
                    Title = "Diskon Rp 25.000 Perjalanan GrabCar",
                    Description = "Hemat biaya perjalanan Anda dengan GrabCar menggunakan diskon khusus pelanggan setia First Media. Tanpa minimum transaksi.",
                    DiscountAmount = "Rp 25.000",
                    Category = "Transport",
                    RedeemCode = "GRAB25FM",
                    ExpiryDate = DateTime.Today.AddMonths(3),
                    TermsAndConditions = "Berlaku untuk layanan GrabCar dan GrabCar Protect;Tanpa minimum biaya perjalanan;Hanya berlaku untuk metode pembayaran nontunai (OVO/Kartu Kredit);Satu kode voucher hanya bisa digunakan sekali.",
                    GradientClass = "from-green-600/10 via-green-600/5 to-transparent border-green-200 text-green-800",
                    ImageUrl = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Spotify",
                    Title = "Gratis 2 Bulan Premium Individual",
                    Description = "Dengarkan musik tanpa iklan dengan akses gratis Spotify Premium Individual selama 2 bulan penuh khusus untuk pelanggan baru Spotify Premium.",
                    DiscountAmount = "2 Bulan FREE",
                    Category = "Entertainment",
                    RedeemCode = "SPOTIFY2MOFM",
                    ExpiryDate = DateTime.Today.AddDays(45),
                    TermsAndConditions = "Hanya berlaku untuk pengguna yang belum pernah mencoba Spotify Premium;Setelah 2 bulan, biaya langganan normal akan berlaku kecuali jika dibatalkan;Dibutuhkan kartu kredit/debit untuk registrasi awal;Kode unik wajib dimasukkan di halaman reedem Spotify.",
                    GradientClass = "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200 text-emerald-800",
                    ImageUrl = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Tokopedia",
                    Title = "Cashback Belanja Gadget Rp 100.000",
                    Description = "Dapatkan cashback senilai Rp 100.000 dalam bentuk GoPay Coins untuk pembelian produk kategori Handphone dan Tablet di Tokopedia Official Store.",
                    DiscountAmount = "Rp 100.000",
                    Category = "Shopping",
                    RedeemCode = "TOKO100KFM",
                    ExpiryDate = DateTime.Today.AddMonths(2),
                    TermsAndConditions = "Minimum transaksi senilai Rp 1.500.000;Hanya berlaku untuk pembelian dari Official Store Tokopedia;Cashback akan masuk sebagai GoPay Coins setelah transaksi selesai;Hanya berlaku untuk metode pembayaran tertentu.",
                    GradientClass = "from-teal-600/10 via-teal-600/5 to-transparent border-teal-200 text-teal-800",
                    ImageUrl = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Hanamasa",
                    Title = "Potongan Rp 75.000 All You Can Eat",
                    Description = "Nikmati hidangan shabu-shabu & yakiniku sepuasnya di Hanamasa dengan potongan harga spesial sebesar Rp 75.000.",
                    DiscountAmount = "Rp 75.000 OFF",
                    Category = "F&B",
                    RedeemCode = "HANAMASA75FM",
                    ExpiryDate = DateTime.Today.AddMonths(1),
                    TermsAndConditions = "Berlaku untuk paket All You Can Eat dewasa;Minimal transaksi untuk 2 pax dewasa;Berlaku di seluruh outlet Hanamasa Indonesia;Tidak dapat digabungkan dengan diskon member atau voucher lain.",
                    GradientClass = "from-orange-500/10 via-orange-500/5 to-transparent border-orange-200 text-orange-800",
                    ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Kopi Kenangan",
                    Title = "Beli 2 Gratis 1 Kopi Mantan",
                    Description = "Beli 2 cup Es Kopi Kenangan Mantan ukuran Large dan dapatkan 1 cup ukuran Regular secara gratis. Hanya berlaku dine-in dan take away.",
                    DiscountAmount = "Buy 2 Get 1",
                    Category = "F&B",
                    RedeemCode = "KENANGANB2G1",
                    ExpiryDate = DateTime.Today.AddMonths(2),
                    TermsAndConditions = "Berlaku untuk pembelian 2 cup Es Kopi Kenangan Mantan (Large);Free 1 cup Es Kopi Kenangan Mantan (Regular);Hanya berlaku untuk dine-in dan takeaway;Tidak berlaku kelipatan dalam 1 transaksi.",
                    GradientClass = "from-amber-600/10 via-amber-600/5 to-transparent border-amber-200 text-amber-800",
                    ImageUrl = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Bata",
                    Title = "Diskon Rp 50.000 Sepatu & Sandal",
                    Description = "Dapatkan potongan langsung Rp 50.000 untuk koleksi sepatu atau sandal pilihan Anda di seluruh gerai resmi Bata Indonesia.",
                    DiscountAmount = "Rp 50.000 OFF",
                    Category = "Shopping",
                    RedeemCode = "BATA50FM",
                    ExpiryDate = DateTime.Today.AddDays(45),
                    TermsAndConditions = "Minimum pembelanjaan senilai Rp 250.000;Hanya berlaku untuk item dengan harga normal;Tidak dapat digabungkan dengan promo diskon lainnya;Wajib menunjukkan kode redeem sebelum pembayaran kasir.",
                    GradientClass = "from-rose-600/10 via-rose-600/5 to-transparent border-rose-200 text-rose-800",
                    ImageUrl = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Traveloka",
                    Title = "Diskon Tiket Pesawat Rp 150.000",
                    Description = "Terbang lebih hemat ke seluruh destinasi domestik dengan diskon Rp 150.000 khusus pemesanan tiket pesawat via aplikasi Traveloka.",
                    DiscountAmount = "Rp 150.000",
                    Category = "Transport",
                    RedeemCode = "TRAVELOKAFM",
                    ExpiryDate = DateTime.Today.AddMonths(3),
                    TermsAndConditions = "Minimum transaksi Rp 1.500.000 untuk penerbangan domestik;Berlaku untuk semua maskapai penerbangan domestik;Hanya berlaku untuk pemesanan melalui aplikasi Traveloka;Kode dapat digunakan satu kali per akun.",
                    GradientClass = "from-sky-600/10 via-sky-600/5 to-transparent border-sky-200 text-sky-800",
                    ImageUrl = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Mobile Legends",
                    Title = "Bonus 50 Diamonds Top Up Coda",
                    Description = "Dapatkan bonus langsung 50 Diamonds untuk setiap top-up minimal 250 Diamonds Mobile Legends: Bang Bang melalui platform Codashop.",
                    DiscountAmount = "Bonus 50 DM",
                    Category = "Entertainment",
                    RedeemCode = "MLCODA50",
                    ExpiryDate = DateTime.Today.AddMonths(1),
                    TermsAndConditions = "Minimal top-up senilai 250 Diamonds MLBB;Pembayaran wajib menggunakan e-wallet atau pulsa melalui Codashop;Bonus Diamonds akan dikirimkan langsung ke ID game Anda setelah kode divalidasi;Berlaku satu kali per user ID.",
                    GradientClass = "from-blue-600/10 via-blue-600/5 to-transparent border-blue-200 text-blue-800",
                    ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Gojek",
                    Title = "Diskon GoFood Rp 20.000",
                    Description = "Nikmati makanan favorit Anda di rumah dengan potongan harga GoFood senilai Rp 20.000 untuk ribuan merchant pilihan.",
                    DiscountAmount = "Rp 20.000 OFF",
                    Category = "F&B",
                    RedeemCode = "GOFOOD20FM",
                    ExpiryDate = DateTime.Today.AddDays(30),
                    TermsAndConditions = "Minimum transaksi GoFood senilai Rp 80.000;Hanya berlaku untuk mitra merchant berlogo GoFood Partner;Potongan harga langsung memotong total tagihan makanan;Berlaku untuk pembayaran non-tunai (GoPay/GoPay Later).",
                    GradientClass = "from-green-600/10 via-green-600/5 to-transparent border-green-200 text-green-800",
                    ImageUrl = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80"
                },
                new Voucher
                {
                    PartnerName = "Uniqlo",
                    Title = "Potongan Rp 100.000 Belanja Fashion",
                    Description = "Perbarui lemari pakaian Anda dengan koleksi minimalis Uniqlo menggunakan potongan langsung Rp 100.000.",
                    DiscountAmount = "Rp 100.000",
                    Category = "Shopping",
                    RedeemCode = "UNIQLO100K",
                    ExpiryDate = DateTime.Today.AddMonths(2),
                    TermsAndConditions = "Minimum transaksi belanja senilai Rp 699.000 di seluruh store Uniqlo Indonesia;Wajib menunjukkan kode voucher sebelum memproses pembayaran di kasir;Satu kode redeem berlaku untuk satu kali transaksi;Tidak dapat digabungkan dengan voucher diskon lainnya.",
                    GradientClass = "from-slate-600/10 via-slate-600/5 to-transparent border-slate-200 text-slate-800",
                    ImageUrl = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80"
                }
            };

            context.Vouchers.AddRange(vouchers);
            context.SaveChanges();
        }
    }
}
