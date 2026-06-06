using System;
using System.Collections.Generic;

namespace EJournal.Models
{
    public class Volume
    {
        public int Id { get; set; }
        public int VolumeNumber { get; set; }
        public int IssueNumber { get; set; }
        public int Year { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }

        // Navigation property
        public ICollection<Article> Articles { get; set; } = new List<Article>();
    }
}
