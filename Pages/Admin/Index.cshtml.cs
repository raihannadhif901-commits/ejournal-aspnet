using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using FirstMediaVoucher.Data;
using FirstMediaVoucher.Models;

namespace FirstMediaVoucher.Pages.Admin
{
    public class IndexModel : PageModel
    {
        private readonly AppDbContext _context;

        public IndexModel(AppDbContext context)
        {
            _context = context;
        }

        public IList<Voucher> Vouchers { get; set; } = new List<Voucher>();

        // Summary Stats
        public int TotalVouchers { get; set; }
        public int TotalClicks { get; set; }
        public string MostPopularPartner { get; set; } = "Belum Ada";

        // Chart 1: Top 5 Vouchers
        public List<string> TopVoucherLabels { get; set; } = new();
        public List<int> TopVoucherClicks { get; set; } = new();

        // Chart 2: Clicks by Category
        public List<string> CategoryLabels { get; set; } = new();
        public List<int> CategoryClicks { get; set; } = new();

        public async Task OnGetAsync()
        {
            // Load all vouchers for the grid list
            Vouchers = await _context.Vouchers.ToListAsync();

            // 1. Calculate General Metrics
            TotalVouchers = Vouchers.Count;
            TotalClicks = Vouchers.Sum(v => v.ClickCount);
            
            var popularVoucher = Vouchers
                .OrderByDescending(v => v.ClickCount)
                .FirstOrDefault();
            
            if (popularVoucher != null && popularVoucher.ClickCount > 0)
            {
                MostPopularPartner = $"{popularVoucher.PartnerName} ({popularVoucher.ClickCount}x)";
            }

            // 2. Aggregate Top 5 Vouchers (by clicks)
            var topVouchers = Vouchers
                .OrderByDescending(v => v.ClickCount)
                .Take(5)
                .ToList();

            TopVoucherLabels = topVouchers.Select(v => v.PartnerName).ToList();
            TopVoucherClicks = topVouchers.Select(v => v.ClickCount).ToList();

            // 3. Aggregate Clicks by Category
            var categoryStats = Vouchers
                .GroupBy(v => v.Category)
                .Select(g => new { 
                    Category = g.Key, 
                    Clicks = g.Sum(v => v.ClickCount) 
                })
                .OrderByDescending(c => c.Clicks)
                .ToList();

            CategoryLabels = categoryStats.Select(c => c.Category).ToList();
            CategoryClicks = categoryStats.Select(c => c.Clicks).ToList();
        }

        public async Task<IActionResult> OnPostDeleteAsync(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);

            if (voucher != null)
            {
                _context.Vouchers.Remove(voucher);
                await _context.SaveChangesAsync();
                TempData["SuccessMessage"] = $"Voucher '{voucher.Title}' berhasil dihapus.";
            }

            return RedirectToPage();
        }
    }
}
