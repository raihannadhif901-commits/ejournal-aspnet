using Microsoft.EntityFrameworkCore;
using FirstMediaVoucher.Models;

namespace FirstMediaVoucher.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Voucher> Vouchers => Set<Voucher>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
