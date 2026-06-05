using Microsoft.EntityFrameworkCore;
using NetworkMonitor.Models;

namespace NetworkMonitor.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Router> Routers { get; set; } = null!;
        public DbSet<PingMetric> PingMetrics { get; set; } = null!;
        public DbSet<NetworkIssueLog> NetworkIssueLogs { get; set; } = null!;
        public DbSet<OntProfile> OntProfiles { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexing for performance on time-series queries
            modelBuilder.Entity<PingMetric>()
                .HasIndex(p => new { p.RouterId, p.Timestamp });

            modelBuilder.Entity<NetworkIssueLog>()
                .HasIndex(l => new { l.RouterId, l.Timestamp });
        }
    }
}
