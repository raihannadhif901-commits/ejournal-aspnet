using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EJournal.Data;
using EJournal.Models;

namespace EJournal.Services
{
    public class ArticleService
    {
        private readonly ApplicationDbContext _context;

        public ArticleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddHistoryEntryAsync(int articleId, int actorId, string action, string remarks)
        {
            var history = new ArticleHistory
            {
                ArticleId = articleId,
                ActorId = actorId,
                Action = action,
                Remarks = remarks,
                CreatedAt = DateTime.UtcNow
            };

            _context.ArticleHistories.Add(history);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateArticleStatusAsync(int articleId, int actorId, ArticleStatus newStatus, string remarks)
        {
            var article = await _context.Articles
                .FirstOrDefaultAsync(a => a.Id == articleId);

            if (article == null) return;

            var oldStatus = article.Status;
            article.Status = newStatus;
            article.LastUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log the status transition
            await AddHistoryEntryAsync(articleId, actorId, "Status Change", $"Status changed from {oldStatus} to {newStatus}. Remarks: {remarks}");
        }

        public async Task AssignReviewerAsync(int articleId, int actorId, int reviewerId)
        {
            // Verify reviewer role
            var reviewer = await _context.Users.FindAsync(reviewerId);
            if (reviewer == null || reviewer.Role != UserRole.Reviewer)
            {
                throw new InvalidOperationException("Assigned user must be a Reviewer.");
            }

            // Check if already assigned
            var existingAssignment = await _context.ReviewAssignments
                .AnyAsync(r => r.ArticleId == articleId && r.ReviewerId == reviewerId);

            if (existingAssignment) return;

            var assignment = new ReviewAssignment
            {
                ArticleId = articleId,
                ReviewerId = reviewerId,
                Status = ReviewStatus.Pending,
                Recommendation = Recommendation.None,
                AssignedAt = DateTime.UtcNow
            };

            _context.ReviewAssignments.Add(assignment);
            
            // Move article status to UnderReview if it was Submitted
            var article = await _context.Articles.FindAsync(articleId);
            if (article != null && article.Status == ArticleStatus.Submitted)
            {
                article.Status = ArticleStatus.UnderReview;
            }

            await _context.SaveChangesAsync();

            await AddHistoryEntryAsync(articleId, actorId, "Reviewer Assigned", $"Assigned reviewer {reviewer.Name} to article.");
        }

        public async Task SubmitReviewAsync(int assignmentId, int reviewerId, Recommendation recommendation, string commentsForEditor, string commentsForAuthor)
        {
            var assignment = await _context.ReviewAssignments
                .Include(r => r.Article)
                .Include(r => r.Reviewer)
                .FirstOrDefaultAsync(r => r.Id == assignmentId);

            if (assignment == null)
            {
                throw new InvalidOperationException("Review assignment not found.");
            }

            if (assignment.ReviewerId != reviewerId)
            {
                throw new UnauthorizedAccessException("You are not authorized to complete this review.");
            }

            assignment.Status = ReviewStatus.Completed;
            assignment.Recommendation = recommendation;
            assignment.CommentsForEditor = commentsForEditor;
            assignment.CommentsForAuthor = commentsForAuthor;
            assignment.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await AddHistoryEntryAsync(assignment.ArticleId, reviewerId, "Review Submitted", $"Review completed by reviewer with recommendation: {recommendation}");
        }
    }
}
