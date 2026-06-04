using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using FirstMediaVoucher.Data;
using FirstMediaVoucher.Models;

namespace FirstMediaVoucher.Pages.Admin
{
    public class CreateModel : PageModel
    {
        private readonly AppDbContext _context;

        public CreateModel(AppDbContext context)
        {
            _context = context;
        }

        [BindProperty]
        public Voucher Voucher { get; set; } = new Voucher();

        [BindProperty]
        [Required(ErrorMessage = "Syarat & ketentuan wajib diisi")]
        public string RawTerms { get; set; } = string.Empty;

        public void OnGet()
        {
            // Preset dates to 1 month from now
            Voucher.ExpiryDate = DateTime.Today.AddMonths(1);
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            // Convert raw terms (separated by newlines) into semicolon-separated string
            if (!string.IsNullOrEmpty(RawTerms))
            {
                var lines = RawTerms.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                Voucher.TermsAndConditions = string.Join(";", lines);
            }

            // Map custom gradients based on category selected
            Voucher.GradientClass = Voucher.Category.ToUpper() switch
            {
                "F&B" => "from-emerald-600/10 via-emerald-600/5 to-transparent border-emerald-200 text-emerald-800",
                "ENTERTAINMENT" => "from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 text-amber-800",
                "SHOPPING" => "from-teal-600/10 via-teal-600/5 to-transparent border-teal-200 text-teal-800",
                "TRANSPORT" => "from-green-600/10 via-green-600/5 to-transparent border-green-200 text-green-800",
                _ => "from-slate-500/10 via-slate-500/5 to-transparent border-slate-200 text-slate-800"
            };

            _context.Vouchers.Add(Voucher);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = $"Voucher '{Voucher.PartnerName} - {Voucher.Title}' berhasil ditambahkan!";
            return RedirectToPage("/Admin/Index");
        }
    }
}
