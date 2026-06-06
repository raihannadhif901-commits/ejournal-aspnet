using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using EJournal.Models;
using EJournal.Services;

namespace EJournal.Data
{
    public static class DbSeeder
    {
        public static void Seed(IServiceProvider serviceProvider)
        {
            using (var context = new ApplicationDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>()))
            {
                // Ensure database is created and migrated
                context.Database.Migrate();

                var authService = serviceProvider.GetRequiredService<AuthService>();

                // 1. Seed Users if not present
                if (!context.Users.Any())
                {
                    var users = new[]
                    {
                        new User
                        {
                            Name = "System Administrator",
                            Email = "admin@journal.com",
                            PasswordHash = authService.HashPassword("Admin123!"),
                            Role = UserRole.Admin
                        },
                        new User
                        {
                            Name = "Chief Editor",
                            Email = "editor@journal.com",
                            PasswordHash = authService.HashPassword("Editor123!"),
                            Role = UserRole.Editor
                        },
                        new User
                        {
                            Name = "Dr. Alice (Reviewer 1)",
                            Email = "reviewer1@journal.com",
                            PasswordHash = authService.HashPassword("Reviewer123!"),
                            Role = UserRole.Reviewer
                        },
                        new User
                        {
                            Name = "Prof. Bob (Reviewer 2)",
                            Email = "reviewer2@journal.com",
                            PasswordHash = authService.HashPassword("Reviewer123!"),
                            Role = UserRole.Reviewer
                        },
                        new User
                        {
                            Name = "Dr. John Doe (Author)",
                            Email = "author@journal.com",
                            PasswordHash = authService.HashPassword("Author123!"),
                            Role = UserRole.Author
                        }
                    };

                    context.Users.AddRange(users);
                    context.SaveChanges();
                }

                // 2. Seed Initial Volume if not present
                if (!context.Volumes.Any())
                {
                    var volume = new Volume
                    {
                        VolumeNumber = 1,
                        IssueNumber = 1,
                        Year = 2026,
                        IsPublished = true,
                        PublishedAt = DateTime.UtcNow.AddMonths(-1)
                    };

                    context.Volumes.Add(volume);
                    context.SaveChanges();

                    // Seed an already published article in Vol 1 No 1
                    var author = context.Users.First(u => u.Role == UserRole.Author);
                    var publishedArticle = new Article
                    {
                        Title = "A Comprehensive Study on Deep Learning Architectures for Edge Devices",
                        Abstract = "Deep learning on edge devices has gained significant traction in recent years. This paper explores the performance, memory usage, and latency trade-offs of various compact convolutional neural networks (CNNs) and transformer models deployed on low-power hardware. We present empirical results demonstrating that specialized architectures can achieve comparable accuracy with up to a 10x reduction in parameter size.",
                        Status = ArticleStatus.Published,
                        FilePath = "sample-article.pdf", // Mock file name
                        Doi = "10.5555/ejournal.2026.1.1.1",
                        SubmittedAt = DateTime.UtcNow.AddMonths(-2),
                        LastUpdatedAt = DateTime.UtcNow.AddMonths(-1),
                        AuthorId = author.Id,
                        VolumeId = volume.Id
                    };

                    context.Articles.Add(publishedArticle);
                    context.SaveChanges();
                }
            }
        }
    }
}
