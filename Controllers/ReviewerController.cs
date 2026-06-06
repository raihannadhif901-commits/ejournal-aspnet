using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EJournal.Data;
using EJournal.Models;
using EJournal.Services;

namespace EJournal.Controllers
{
    [Authorize(Roles = "Reviewer")]
    public class ReviewerController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ArticleService _articleService;

        public ReviewerController(ApplicationDbContext context, ArticleService articleService)
        {
            _context = context;
            _articleService = articleService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        // GET: /Reviewer/Dashboard
        public async Task<IActionResult> Dashboard()
        {
            var reviewerId = GetCurrentUserId();
            var assignments = await _context.ReviewAssignments
                .Include(r => r.Article)
                .Where(r => r.ReviewerId == reviewerId)
                .OrderByDescending(r => r.AssignedAt)
                .ToListAsync();

            return View(assignments);
        }

        // GET: /Reviewer/Review/{assignmentId}
        [HttpGet]
        public async Task<IActionResult> Review(int id)
        {
            var reviewerId = GetCurrentUserId();
            var assignment = await _context.ReviewAssignments
                .Include(r => r.Article)
                .FirstOrDefaultAsync(r => r.Id == id && r.ReviewerId == reviewerId);

            if (assignment == null)
            {
                return NotFound();
            }

            if (assignment.Status == ReviewStatus.Completed)
            {
                TempData["ErrorMessage"] = "You have already completed this review.";
                return RedirectToAction("Dashboard");
            }

            // Note: In double-blind peer review, the Reviewer view does NOT include the Author's details.
            return View(assignment);
        }

        // POST: /Reviewer/Review/{assignmentId}
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Review(int id, Recommendation recommendation, string commentsForEditor, string commentsForAuthor)
        {
            var reviewerId = GetCurrentUserId();
            var assignment = await _context.ReviewAssignments
                .FirstOrDefaultAsync(r => r.Id == id && r.ReviewerId == reviewerId);

            if (assignment == null)
            {
                return NotFound();
            }

            if (recommendation == Recommendation.None)
            {
                ModelState.AddModelError("recommendation", "Please choose a recommendation.");
                return View(assignment);
            }

            if (string.IsNullOrWhiteSpace(commentsForAuthor))
            {
                ModelState.AddModelError("commentsForAuthor", "Comments for the author are required.");
                return View(assignment);
            }

            try
            {
                await _articleService.SubmitReviewAsync(id, reviewerId, recommendation, commentsForEditor ?? string.Empty, commentsForAuthor);
                TempData["SuccessMessage"] = "Thank you! Your peer review recommendation has been submitted.";
                return RedirectToAction("Dashboard");
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, $"Failed to submit review: {ex.Message}");
                return View(assignment);
            }
        }
    }
}
