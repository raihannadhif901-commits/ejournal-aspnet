using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EJournal.Models;

namespace EJournal.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        public IActionResult Index()
        {
            var role = User.FindFirstValue(ClaimTypes.Role);

            if (role == UserRole.Admin.ToString() || role == UserRole.Editor.ToString())
            {
                return RedirectToAction("Dashboard", "Editor");
            }
            else if (role == UserRole.Reviewer.ToString())
            {
                return RedirectToAction("Dashboard", "Reviewer");
            }
            else if (role == UserRole.Author.ToString())
            {
                return RedirectToAction("Dashboard", "Author");
            }

            return RedirectToAction("Index", "Home");
        }
    }
}
