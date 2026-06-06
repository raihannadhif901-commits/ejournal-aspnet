using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EJournal.Data;
using EJournal.Models;
using EJournal.Services;

namespace EJournal.Controllers
{
    public class ArchiveController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly FileService _fileService;

        public ArchiveController(ApplicationDbContext context, FileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        // GET: /Archive
        public async Task<IActionResult> Index()
        {
            var volumes = await _context.Volumes
                .Where(v => v.IsPublished)
                .OrderByDescending(v => v.Year)
                .ThenByDescending(v => v.VolumeNumber)
                .ThenByDescending(v => v.IssueNumber)
                .ToListAsync();

            return View(volumes);
        }

        // GET: /Archive/Issue/{id}
        public async Task<IActionResult> Issue(int id)
        {
            var volume = await _context.Volumes
                .Include(v => v.Articles.Where(a => a.Status == ArticleStatus.Published))
                .FirstOrDefaultAsync(v => v.Id == id);

            if (volume == null || !volume.IsPublished)
            {
                return NotFound();
            }

            return View(volume);
        }

        // GET: /Archive/Article/{id}
        public async Task<IActionResult> Article(int id)
        {
            var article = await _context.Articles
                .Include(a => a.Author)
                .Include(a => a.Volume)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null)
            {
                return NotFound();
            }

            // If it is not published, check if the current user has permission to view details
            if (article.Status != ArticleStatus.Published)
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                {
                    return Challenge();
                }

                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var role = User.FindFirstValue(ClaimTypes.Role);

                bool hasAccess = role == UserRole.Admin.ToString() ||
                                 role == UserRole.Editor.ToString() ||
                                 article.AuthorId == userId ||
                                 await _context.ReviewAssignments.AnyAsync(r => r.ArticleId == id && r.ReviewerId == userId);

                if (!hasAccess)
                {
                    return Forbid();
                }
            }

            return View(article);
        }

        // GET: /Archive/Download?filename={filename}
        public async Task<IActionResult> Download(string filename)
        {
            if (string.IsNullOrEmpty(filename))
            {
                return BadRequest("Filename is required.");
            }

            var article = await _context.Articles
                .FirstOrDefaultAsync(a => a.FilePath == filename);

            if (article == null)
            {
                return NotFound("File association not found.");
            }

            // Check permissions if not published
            if (article.Status != ArticleStatus.Published)
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                {
                    return Challenge();
                }

                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var role = User.FindFirstValue(ClaimTypes.Role);

                bool hasAccess = role == UserRole.Admin.ToString() ||
                                 role == UserRole.Editor.ToString() ||
                                 article.AuthorId == userId ||
                                 await _context.ReviewAssignments.AnyAsync(r => r.ArticleId == article.Id && r.ReviewerId == userId);

                if (!hasAccess)
                {
                    return Forbid();
                }
            }

            var filePath = _fileService.GetManuscriptPath(filename);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Physical file not found on the server.");
            }

            var contentType = "application/pdf";
            // Set friendly file download name
            var downloadName = $"{article.Title.Replace(" ", "_").Substring(0, Math.Min(30, article.Title.Length))}.pdf";

            return PhysicalFile(filePath, contentType, downloadName);
        }
    }
}
