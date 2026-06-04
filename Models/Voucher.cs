using System;
using System.ComponentModel.DataAnnotations;

namespace FirstMediaVoucher.Models
{
    public class Voucher
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Nama mitra rekanan wajib diisi")]
        [StringLength(100)]
        public string PartnerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Judul promo wajib diisi")]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Deskripsi promo wajib diisi")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nilai diskon wajib diisi (misal: 30% OFF, Potongan Rp 50.000)")]
        [StringLength(50)]
        public string DiscountAmount { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kategori wajib diisi")]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kode redeem wajib diisi")]
        [StringLength(50)]
        public string RedeemCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tanggal kedaluwarsa wajib diisi")]
        [DataType(DataType.Date)]
        public DateTime ExpiryDate { get; set; } = DateTime.Today.AddMonths(1);

        // Semicolon-separated terms and conditions
        public string TermsAndConditions { get; set; } = string.Empty;

        // Custom style gradient
        public string GradientClass { get; set; } = "from-red-500/10 via-red-500/5 to-transparent border-red-200 text-red-800";

        [Required(ErrorMessage = "URL Gambar voucher wajib diisi")]
        public string ImageUrl { get; set; } = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&auto=format&fit=crop&q=60";

        // Click telemetry counter
        public int ClickCount { get; set; } = 0;
    }
}
