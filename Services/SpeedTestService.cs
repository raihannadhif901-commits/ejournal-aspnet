using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NetworkMonitor.Hubs;

namespace NetworkMonitor.Services
{
    public class SpeedTestService
    {
        private readonly IHubContext<MonitorHub> _hubContext;
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        private static bool _isTestRunning = false;

        public SpeedTestService(IHubContext<MonitorHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public bool IsTestRunning => _isTestRunning;

        public async Task StartTestAsync()
        {
            if (_isTestRunning) return;
            _isTestRunning = true;

            _ = Task.Run(async () =>
            {
                try
                {
                    _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 NetPulse.io SpeedTest Engine");

                    // Phase 1: Latency Test
                    await BroadcastProgressAsync("latency", 0, 0, 0, 0, "Measuring Latency...");
                    double pingMs = await MeasureLatencyAsync();
                    await BroadcastProgressAsync("latency", 100, 0, 0, pingMs, $"Latency: {pingMs:F0} ms");
                    await Task.Delay(500);

                    // Phase 2: Download Test (10 MB File)
                    await BroadcastProgressAsync("download", 0, 0, 0, pingMs, "Testing Download Speed...");
                    double downloadSpeed = await RunDownloadTestAsync(pingMs);
                    await BroadcastProgressAsync("download", 100, downloadSpeed, 0, pingMs, $"Download: {downloadSpeed:F1} Mbps");
                    await Task.Delay(500);

                    // Phase 3: Upload Test (5 MB File)
                    await BroadcastProgressAsync("upload", 0, downloadSpeed, 0, pingMs, "Testing Upload Speed...");
                    double uploadSpeed = await RunUploadTestAsync(downloadSpeed, pingMs);

                    // Completed
                    await BroadcastProgressAsync("completed", 100, downloadSpeed, uploadSpeed, pingMs, "Speed Test Completed");
                }
                catch (Exception ex)
                {
                    await BroadcastProgressAsync("failed", 0, 0, 0, 0, $"Speed Test Failed: {ex.Message}");
                }
                finally
                {
                    _isTestRunning = false;
                }
            });

            await Task.CompletedTask;
        }

        private async Task<double> MeasureLatencyAsync()
        {
            double totalMs = 0;
            int count = 3;
            for (int i = 0; i < count; i++)
            {
                var sw = Stopwatch.StartNew();
                using var response = await _httpClient.SendAsync(new HttpRequestMessage(HttpMethod.Head, "https://speed.cloudflare.com/"));
                sw.Stop();
                totalMs += sw.Elapsed.TotalMilliseconds;
                await Task.Delay(100);
            }
            return totalMs / count;
        }

        private async Task<double> RunDownloadTestAsync(double pingMs)
        {
            string url = "https://speed.cloudflare.com/__down?bytes=10000000"; // 10 MB
            using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();

            long totalBytes = response.Content.Headers.ContentLength ?? 10000000;
            using var stream = await response.Content.ReadAsStreamAsync();

            byte[] buffer = new byte[8192];
            long bytesRead = 0;
            int read;
            var sw = Stopwatch.StartNew();
            
            var lastUpdateSw = Stopwatch.StartNew();

            while ((read = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                bytesRead += read;
                
                // Broadcast progress every 150ms to prevent SignalR flooding
                if (lastUpdateSw.ElapsedMilliseconds > 150)
                {
                    double elapsedSec = sw.Elapsed.TotalSeconds;
                    double currentSpeed = elapsedSec > 0 ? (bytesRead * 8.0) / (elapsedSec * 1000000.0) : 0;
                    int percent = (int)((bytesRead * 100) / totalBytes);

                    await BroadcastProgressAsync("download", percent, currentSpeed, 0, pingMs, $"Downloading... {percent}%");
                    lastUpdateSw.Restart();
                }
            }

            sw.Stop();
            return (bytesRead * 8.0) / (sw.Elapsed.TotalSeconds * 1000000.0);
        }

        private async Task<double> RunUploadTestAsync(double downloadSpeed, double pingMs)
        {
            string url = "https://speed.cloudflare.com/__up";
            long uploadSize = 5000000; // 5 MB
            byte[] dummyData = new byte[uploadSize];
            new Random().NextBytes(dummyData);

            using var memoryStream = new MemoryStream(dummyData);
            var sw = Stopwatch.StartNew();
            var lastUpdateSw = Stopwatch.StartNew();

            // Progress-reporting StreamContent
            var progressStream = new ProgressReportingStream(memoryStream, uploadSize, async (bytesWritten, total) =>
            {
                if (lastUpdateSw.ElapsedMilliseconds > 150 || bytesWritten == total)
                {
                    double elapsedSec = sw.Elapsed.TotalSeconds;
                    double currentSpeed = elapsedSec > 0 ? (bytesWritten * 8.0) / (elapsedSec * 1000000.0) : 0;
                    int percent = (int)((bytesWritten * 100) / total);

                    await BroadcastProgressAsync("upload", percent, downloadSpeed, currentSpeed, pingMs, $"Uploading... {percent}%");
                    lastUpdateSw.Restart();
                }
            });

            using var content = new StreamContent(progressStream);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");

            using var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
            sw.Stop();

            return (uploadSize * 8.0) / (sw.Elapsed.TotalSeconds * 1000000.0);
        }

        private async Task BroadcastProgressAsync(string stage, int percent, double downloadMbps, double uploadMbps, double pingMs, string statusText)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveSpeedTestProgress", new
            {
                stage = stage,
                percent = percent,
                downloadMbps = Math.Round(downloadMbps, 1),
                uploadMbps = Math.Round(uploadMbps, 1),
                pingMs = Math.Round(pingMs, 1),
                statusText = statusText
            });
        }
    }

    // Helper stream to intercept Read calls and report upload progress
    public class ProgressReportingStream : Stream
    {
        private readonly Stream _innerStream;
        private readonly long _totalBytes;
        private long _bytesRead = 0;
        private readonly Action<long, long> _onProgress;

        public ProgressReportingStream(Stream innerStream, long totalBytes, Action<long, long> onProgress)
        {
            _innerStream = innerStream;
            _totalBytes = totalBytes;
            _onProgress = onProgress;
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            int read = _innerStream.Read(buffer, offset, count);
            _bytesRead += read;
            _onProgress(_bytesRead, _totalBytes);
            return read;
        }

        public override bool CanRead => _innerStream.CanRead;
        public override bool CanSeek => _innerStream.CanSeek;
        public override bool CanWrite => _innerStream.CanWrite;
        public override long Length => _innerStream.Length;
        public override long Position
        {
            get => _innerStream.Position;
            set => _innerStream.Position = value;
        }

        public override void Flush() => _innerStream.Flush();
        public override long Seek(long offset, SeekOrigin origin) => _innerStream.Seek(offset, origin);
        public override void SetLength(long value) => _innerStream.SetLength(value);
        public override void Write(byte[] buffer, int offset, int count) => _innerStream.Write(buffer, offset, count);
    }
}
