using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FirstMediaVoucher.Pages
{
    public class IndexModel : PageModel
    {
        public IActionResult OnGet()
        {
            return RedirectToPage("/Promos");
        }
    }
}
