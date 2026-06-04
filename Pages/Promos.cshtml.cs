using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using FirstMediaVoucher.Data;
using FirstMediaVoucher.Models;

namespace FirstMediaVoucher.Pages
{
    public class PromosModel : PageModel
    {
        private readonly AppDbContext _context;

        public PromosModel(AppDbContext context)
        {
            _context = context;
        }

        public IList<Voucher> Vouchers { get; set; } = new List<Voucher>();
        public List<string> Categories { get; set; } = new List<string>();

        [BindProperty(SupportsGet = true)]
        public string? SelectedCategory { get; set; }

        [BindProperty(SupportsGet = true, Name = "p")]
        public int PageNumber { get; set; } = 1;

        public int TotalPages { get; set; }
        public int PageSize { get; } = 6; // Show 6 items per page for testing pagination in demo

        public async Task OnGetAsync()
        {
            // Get all unique categories for the filters
            Categories = await _context.Vouchers
                .Select(v => v.Category)
                .Distinct()
                .ToListAsync();

            var query = _context.Vouchers.AsQueryable();

            if (!string.IsNullOrEmpty(SelectedCategory) && SelectedCategory != "All")
            {
                query = query.Where(v => v.Category == SelectedCategory);
            }

            int totalCount = await query.CountAsync();
            TotalPages = (int)Math.Ceiling(totalCount / (double)PageSize);

            // Bounds checks
            if (PageNumber < 1) PageNumber = 1;
            if (TotalPages > 0 && PageNumber > TotalPages) PageNumber = TotalPages;

            Vouchers = await query
                .Skip((PageNumber - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
        }
    }
}
