using System;

namespace EJournal.Models
{
    public class ArticleHistory
    {
        public int Id { get; set; }
        public int ArticleId { get; set; }
        public Article? Article { get; set; }

        public string Action { get; set; } = string.Empty; // e.g. "Submitted", "Assigned Reviewer", "Revisions Requested"
        public string Remarks { get; set; } = string.Empty; // e.g. "Draft finalized", "Assigned to Reviewer B"
        
        public int ActorId { get; set; }
        public User? Actor { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
