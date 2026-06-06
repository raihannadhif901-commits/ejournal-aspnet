using System;

namespace EJournal.Models
{
    public class ReviewAssignment
    {
        public int Id { get; set; }
        public int ArticleId { get; set; }
        public Article? Article { get; set; }

        public int ReviewerId { get; set; }
        public User? Reviewer { get; set; }

        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
        public Recommendation Recommendation { get; set; } = Recommendation.None;

        public string CommentsForEditor { get; set; } = string.Empty;
        public string CommentsForAuthor { get; set; } = string.Empty; // Shared with author anonymously

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}
