using Microsoft.EntityFrameworkCore;
using EJournal.Models;

namespace EJournal.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Volume> Volumes { get; set; } = null!;
        public DbSet<Article> Articles { get; set; } = null!;
        public DbSet<ReviewAssignment> ReviewAssignments { get; set; } = null!;
        public DbSet<ArticleHistory> ArticleHistories { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Article relations
            modelBuilder.Entity<Article>()
                .HasOne(a => a.Author)
                .WithMany()
                .HasForeignKey(a => a.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Article>()
                .HasOne(a => a.Volume)
                .WithMany(v => v.Articles)
                .HasForeignKey(a => a.VolumeId)
                .OnDelete(DeleteBehavior.SetNull);

            // ReviewAssignment relations
            modelBuilder.Entity<ReviewAssignment>()
                .HasOne(r => r.Article)
                .WithMany(a => a.ReviewAssignments)
                .HasForeignKey(r => r.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReviewAssignment>()
                .HasOne(r => r.Reviewer)
                .WithMany()
                .HasForeignKey(r => r.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            // ArticleHistory relations
            modelBuilder.Entity<ArticleHistory>()
                .HasOne(h => h.Article)
                .WithMany(a => a.History)
                .HasForeignKey(h => h.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArticleHistory>()
                .HasOne(h => h.Actor)
                .WithMany()
                .HasForeignKey(h => h.ActorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
