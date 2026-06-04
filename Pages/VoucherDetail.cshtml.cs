using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using FirstMediaVoucher.Data;
using FirstMediaVoucher.Models;

namespace FirstMediaVoucher.Pages
{
    public class VoucherDetailModel : PageModel
    {
        private readonly AppDbContext _context;

        public VoucherDetailModel(AppDbContext context)
        {
            _context = context;
        }

        public Voucher? Voucher { get; set; }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            Voucher = await _context.Vouchers.FirstOrDefaultAsync(m => m.Id == id);

            if (Voucher == null)
            {
                return NotFound();
            }

            return Page();
        }

        // Click Telemetry Handler API
        public async Task<IActionResult> OnGetTrackClickAsync(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher != null)
            {
                voucher.ClickCount += 1;
                await _context.SaveChangesAsync();
                return new JsonResult(new { success = true, clicks = voucher.ClickCount });
            }
            return new JsonResult(new { success = false });
        }
    }
}
