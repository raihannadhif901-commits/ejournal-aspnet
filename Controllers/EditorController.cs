using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using EJournal.Data;
using EJournal.Models;
using EJournal.Services;

namespace EJournal.Controllers
{
    [Authorize(Roles = "Editor,Admin")]
    public class EditorController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ArticleService _articleService;

        public EditorController(ApplicationDbContext context, ArticleService articleService)
        {
            _context = context;
            _articleService = articleService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        // GET: /Editor/Dashboard
        public async Task<IActionResult> Dashboard()
        {
            var articles = await _context.Articles
                .Include(a => a.Author)
                .OrderByDescending(a => a.LastUpdatedAt)
                .ToListAsync();

            return View(articles);
        }

        // GET: /Editor/Details/{id}
        public async Task<IActionResult> Details(int id)
        {
            var article = await _context.Articles
                .Include(a => a.Author)
                .Include(a => a.Volume)
                .Include(a => a.History.OrderByDescending(h => h.CreatedAt))
                .Include(a => a.ReviewAssignments).ThenInclude(r => r.Reviewer)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null)
            {
                return NotFound();
            }

            // Get all reviewers to populate the assignment dropdown
            var reviewers = await _context.Users
                .Where(u => u.Role == UserRole.Reviewer)
                .ToListAsync();

            // Filter out reviewers already assigned to this article
            var assignedReviewerIds = article.ReviewAssignments.Select(r => r.ReviewerId).ToList();
            var availableReviewers = reviewers.Where(u => !assignedReviewerIds.Contains(u.Id)).ToList();

            ViewBag.ReviewerId = new SelectList(availableReviewers, "Id", "Name");

            // Populate volumes dropdown
            var volumes = await _context.Volumes.OrderByDescending(v => v.Year).ThenByDescending(v => v.VolumeNumber).ToListAsync();
            ViewBag.VolumeId = new SelectList(volumes, "Id", "Year", article.VolumeId);
            
            // Format volume display name: Vol X No Y (Year)
            ViewBag.VolumeList = volumes.Select(v => new SelectListItem
            {
                Value = v.Id.ToString(),
                Text = $"Vol {v.VolumeNumber} No {v.IssueNumber} ({v.Year})"
            }).ToList();

            return View(article);
        }

        // POST: /Editor/AssignReviewer
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AssignReviewer(int articleId, int reviewerId)
        {
            if (reviewerId <= 0)
            {
                TempData["ErrorMessage"] = "Please select a valid reviewer.";
                return RedirectToAction("Details", new { id = articleId });
            }

            try
            {
                var editorId = GetCurrentUserId();
                await _articleService.AssignReviewerAsync(articleId, editorId, reviewerId);
                TempData["SuccessMessage"] = "Reviewer assigned successfully.";
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Failed to assign reviewer: {ex.Message}";
            }

            return RedirectToAction("Details", new { id = articleId });
        }

        // POST: /Editor/MakeDecision
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MakeDecision(int articleId, ArticleStatus decision, string remarks)
        {
            if (decision != ArticleStatus.Accepted && decision != ArticleStatus.Rejected && decision != ArticleStatus.UnderRevision)
            {
                TempData["ErrorMessage"] = "Invalid editorial decision.";
                return RedirectToAction("Details", new { id = articleId });
            }

            if (string.IsNullOrWhiteSpace(remarks))
            {
                TempData["ErrorMessage"] = "Editorial remarks/feedback are required.";
                return RedirectToAction("Details", new { id = articleId });
            }

            try
            {
                var editorId = GetCurrentUserId();
                await _articleService.UpdateArticleStatusAsync(articleId, editorId, decision, remarks);
                TempData["SuccessMessage"] = $"Editorial decision '{decision}' recorded successfully.";
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Failed to record decision: {ex.Message}";
            }

            return RedirectToAction("Details", new { id = articleId });
        }

        // POST: /Editor/Publish
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Publish(int articleId, int volumeId, string doi)
        {
            var article = await _context.Articles.FindAsync(articleId);
            var volume = await _context.Volumes.FindAsync(volumeId);

            if (article == null || volume == null)
            {
                return NotFound();
            }

            if (article.Status != ArticleStatus.Accepted)
            {
                TempData["ErrorMessage"] = "Only accepted articles can be published.";
                return RedirectToAction("Details", new { id = articleId });
            }

            if (string.IsNullOrWhiteSpace(doi))
            {
                doi = $"10.5555/ejournal.{volume.Year}.{volume.VolumeNumber}.{volume.IssueNumber}.{articleId}";
            }

            try
            {
                var editorId = GetCurrentUserId();
                article.VolumeId = volumeId;
                article.Status = ArticleStatus.Published;
                article.Doi = doi;
                article.LastUpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _articleService.AddHistoryEntryAsync(articleId, editorId, "Article Published", $"Published in Vol {volume.VolumeNumber} No {volume.IssueNumber} ({volume.Year}) with DOI: {doi}");

                TempData["SuccessMessage"] = "Article has been published in the archive.";
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Failed to publish article: {ex.Message}";
            }

            return RedirectToAction("Details", new { id = articleId });
        }

        // GET: /Editor/ManageVolumes
        [HttpGet]
        public async Task<IActionResult> ManageVolumes()
        {
            var volumes = await _context.Volumes
                .OrderByDescending(v => v.Year)
                .ThenByDescending(v => v.VolumeNumber)
                .ThenByDescending(v => v.IssueNumber)
                .ToListAsync();

            return View(volumes);
        }

        // POST: /Editor/CreateVolume
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateVolume(int volumeNumber, int issueNumber, int year)
        {
            if (volumeNumber <= 0 || issueNumber <= 0 || year < 1900)
            {
                TempData["ErrorMessage"] = "Please fill in valid Volume, Issue, and Year values.";
                return RedirectToAction("ManageVolumes");
            }

            var exists = await _context.Volumes
                .AnyAsync(v => v.VolumeNumber == volumeNumber && v.IssueNumber == issueNumber && v.Year == year);

            if (exists)
            {
                TempData["ErrorMessage"] = "This Volume and Issue combination already exists.";
                return RedirectToAction("ManageVolumes");
            }

            var volume = new Volume
            {
                VolumeNumber = volumeNumber,
                IssueNumber = issueNumber,
                Year = year,
                IsPublished = true, // Default to published for archive visibility
                PublishedAt = DateTime.UtcNow
            };

            _context.Volumes.Add(volume);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = $"Volume {volumeNumber} Issue {issueNumber} ({year}) created successfully.";
            return RedirectToAction("ManageVolumes");
        }
    }
}
