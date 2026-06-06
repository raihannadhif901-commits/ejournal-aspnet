using System;
using System.Collections.Generic;

namespace EJournal.Models
{
    public class Article
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Abstract { get; set; } = string.Empty;
        public ArticleStatus Status { get; set; } = ArticleStatus.Draft;
        public string FilePath { get; set; } = string.Empty; // Path to PDF file
        public string? Doi { get; set; } // Optional Digital Object Identifier
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign keys and Navigation properties
        public int AuthorId { get; set; }
        public User? Author { get; set; }

        public int? VolumeId { get; set; }
        public Volume? Volume { get; set; }

        public ICollection<ReviewAssignment> ReviewAssignments { get; set; } = new List<ReviewAssignment>();
        public ICollection<ArticleHistory> History { get; set; } = new List<ArticleHistory>();
    }
}
