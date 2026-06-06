using System;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

namespace EJournal.Services
{
    public class FileService
    {
        private readonly string _uploadDirectory;

        public FileService(IWebHostEnvironment env)
        {
            // Create a private Uploads folder outside of wwwroot
            _uploadDirectory = Path.Combine(env.ContentRootPath, "Uploads");
            if (!Directory.Exists(_uploadDirectory))
            {
                Directory.CreateDirectory(_uploadDirectory);
            }
        }

        public async Task<string> SaveManuscriptAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("Invalid file");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".pdf")
            {
                throw new InvalidOperationException("Only PDF files are allowed.");
            }

            // Generate a secure, unique filename to prevent overwrites or path traversals
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadDirectory, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return uniqueFileName; // Store just the filename in DB, resolve path on runtime
        }

        public string GetManuscriptPath(string filename)
        {
            return Path.Combine(_uploadDirectory, filename);
        }

        public void DeleteManuscript(string filename)
        {
            if (string.IsNullOrEmpty(filename)) return;

            var filePath = Path.Combine(_uploadDirectory, filename);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
    }
}
