using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using EJournal.Models;

namespace EJournal.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult FocusScope()
        {
            return View();
        }

        public IActionResult EditorialTeam()
        {
            return View();
        }

        public IActionResult Guidelines()
        {
            return View();
        }

        public IActionResult Ethics()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            // Make sure to reference the correct ErrorViewModel in wokwos namespace or EJournal
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
namespace EJournal.Models
{
    // Make sure ErrorViewModel is defined or mapped correctly if we reference it
    public class ErrorViewModel
    {
        public string? RequestId { get; set; }
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}
