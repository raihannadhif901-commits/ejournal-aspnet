using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EJournal.Data;
using EJournal.Models;
using EJournal.Services;

namespace EJournal.Controllers
{
    [Authorize(Roles = "Author")]
    public class AuthorController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly FileService _fileService;
        private readonly ArticleService _articleService;

        public AuthorController(ApplicationDbContext context, FileService fileService, ArticleService articleService)
        {
            _context = context;
            _fileService = fileService;
            _articleService = articleService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        // GET: /Author/Dashboard
        public async Task<IActionResult> Dashboard()
        {
            var userId = GetCurrentUserId();
            var articles = await _context.Articles
                .Where(a => a.AuthorId == userId)
                .OrderByDescending(a => a.LastUpdatedAt)
                .ToListAsync();

            return View(articles);
        }

        // GET: /Author/Submit
        [HttpGet]
        public IActionResult Submit()
        {
            return View();
        }

        // POST: /Author/Submit
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Submit(string title, string @abstract, IFormFile pdfFile)
        {
            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(@abstract) || pdfFile == null)
            {
                ModelState.AddModelError(string.Empty, "All fields and the PDF manuscript file are required.");
                return View();
            }

            if (pdfFile.ContentType != "application/pdf" && !pdfFile.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                ModelState.AddModelError(string.Empty, "Only PDF documents are allowed.");
                return View();
            }

            try
            {
                var userId = GetCurrentUserId();
                var fileName = await _fileService.SaveManuscriptAsync(pdfFile);

                var article = new Article
                {
                    Title = title,
                    Abstract = @abstract,
                    FilePath = fileName,
                    Status = ArticleStatus.Submitted,
                    AuthorId = userId,
                    SubmittedAt = DateTime.UtcNow,
                    LastUpdatedAt = DateTime.UtcNow
                };

                _context.Articles.Add(article);
                await _context.SaveChangesAsync();

                // Log audit trail
                await _articleService.AddHistoryEntryAsync(article.Id, userId, "Submission Created", "Initial manuscript PDF submitted.");

                TempData["SuccessMessage"] = "Your manuscript has been successfully submitted and is under editor review.";
                return RedirectToAction("Dashboard");
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to save manuscript: {ex.Message}");
                return View();
            }
        }

        // GET: /Author/Details/{id}
        public async Task<IActionResult> Details(int id)
        {
            var userId = GetCurrentUserId();
            var article = await _context.Articles
                .Include(a => a.History.OrderByDescending(h => h.CreatedAt))
                .Include(a => a.ReviewAssignments.Where(r => r.Status == ReviewStatus.Completed)) // Only completed reviews
                .FirstOrDefaultAsync(a => a.Id == id && a.AuthorId == userId);

            if (article == null)
            {
                return NotFound();
            }

            return View(article);
        }

        // POST: /Author/SubmitRevision
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SubmitRevision(int articleId, IFormFile pdfFile)
        {
            var userId = GetCurrentUserId();
            var article = await _context.Articles
                .FirstOrDefaultAsync(a => a.Id == articleId && a.AuthorId == userId);

            if (article == null)
            {
                return NotFound();
            }

            if (article.Status != ArticleStatus.UnderRevision)
            {
                TempData["ErrorMessage"] = "You can only upload revisions for articles marked as 'Under Revision'.";
                return RedirectToAction("Details", new { id = articleId });
            }

            if (pdfFile == null || pdfFile.Length == 0)
            {
                TempData["ErrorMessage"] = "Please select a valid PDF file.";
                return RedirectToAction("Details", new { id = articleId });
            }

            try
            {
                // Delete old PDF file
                _fileService.DeleteManuscript(article.FilePath);

                // Save new PDF file
                var fileName = await _fileService.SaveManuscriptAsync(pdfFile);
                article.FilePath = fileName;
                article.Status = ArticleStatus.Submitted; // Move status back to Submitted for Editor re-evaluation
                article.LastUpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _articleService.AddHistoryEntryAsync(article.Id, userId, "Revision Submitted", "Author uploaded revised manuscript PDF.");

                TempData["SuccessMessage"] = "Your revision has been submitted successfully.";
                return RedirectToAction("Details", new { id = articleId });
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Failed to upload revision: {ex.Message}";
                return RedirectToAction("Details", new { id = articleId });
            }
        }
    }
}
