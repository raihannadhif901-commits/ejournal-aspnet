using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NetworkMonitor.Data;
using NetworkMonitor.Hubs;
using NetworkMonitor.Models;
using Lextm.SharpSnmpLib;
using Lextm.SharpSnmpLib.Messaging;

namespace NetworkMonitor.Services
{
    public class NetworkMonitoringService : BackgroundService
    {
        private readonly ILogger<NetworkMonitoringService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<MonitorHub> _hubContext;

        // Simulasi status fisik port router (Fallback jika SNMP mati)
        public static string SimPortName = "GPON WAN (Fiber Interface)";
        public static string SimPortStatus = "UP";
        public static double SimPortSpeedMbps = 1000;
        public static long SimCrcErrors = 0;
        public static double SimOpticalPowerDbm = -18.5; // Rentang aman -8 s.d -25 dBm
        public static string SimCableStatus = "Normal"; // "Normal", "Konektor Longgar", "Kabel Shielding Rusak", "Pin Tembaga Putus (100Mbps Limit)", "Redaman Buruk (-29 dBm)"

        // State global untuk Traceroute terakhir
        public static List<TracerouteHop> LastTracerouteHops = new();
        private bool _isTracerouteRunning = false;
        
        // State ping
        private readonly Dictionary<string, double> _lastLatencies = new();
        private readonly Dictionary<string, double> _currentJitters = new();

        public NetworkMonitoringService(
            ILogger<NetworkMonitoringService> logger,
            IServiceScopeFactory scopeFactory,
            IHubContext<MonitorHub> hubContext)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Background Monitoring Service dimulai.");

            await EnsureDefaultGatewayRegisteredAsync();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var routers = await dbContext.Routers.Where(r => r.IsActive).ToListAsync(stoppingToken);

                    var tasks = routers.Select(async router =>
                    {
                        try
                        {
                            // Setiap router berjalan pada thread-safe scope DbContext terpisah
                            using var routerScope = _scopeFactory.CreateScope();
                            var routerDbContext = routerScope.ServiceProvider.GetRequiredService<AppDbContext>();

                            var trackedRouter = await routerDbContext.Routers.FindAsync(router.Id);
                            if (trackedRouter == null || !trackedRouter.IsActive) return;

                            // 1. Ukur Metrik Ping (Latency & Jitter)
                            var metrics = await MeasureMetricsAsync(trackedRouter);

                            // Dapatkan profil ONT asosiasi
                            var profile = await routerDbContext.OntProfiles.FindAsync(trackedRouter.OntProfileId)
                                          ?? await routerDbContext.OntProfiles.FindAsync("GENERIC");

                            // 2. Coba Polling SNMP ke Router Asli dengan profil OIDs
                            var snmpResult = await PollSnmpAsync(trackedRouter.IpAddress, profile!);

                            string currentPortStatus = SimPortStatus;
                            double currentPortSpeed = SimPortSpeedMbps;
                            long currentCrcErrors = SimCrcErrors;
                            double currentOpticalPower = SimOpticalPowerDbm;
                            string currentCableStatus = SimCableStatus;

                            if (snmpResult.success)
                            {
                                metrics.SnmpStatus = "Connected";
                                metrics.InterfaceSpeedMbps = snmpResult.speedMbps;
                                metrics.CrcErrors = snmpResult.crcErrors;
                                metrics.OpticalPowerDbm = snmpResult.optPower;

                                currentPortStatus = snmpResult.portStatus;
                                currentPortSpeed = snmpResult.speedMbps;
                                currentCrcErrors = snmpResult.crcErrors;
                                currentOpticalPower = snmpResult.optPower;
                                currentCableStatus = "SNMP Active (Real Router)";
                            }
                            else
                            {
                                metrics.SnmpStatus = "Offline";
                                metrics.InterfaceSpeedMbps = SimPortSpeedMbps;
                                metrics.CrcErrors = SimCrcErrors;
                                metrics.OpticalPowerDbm = SimOpticalPowerDbm;
                            }

                            // 3. Simpan ke database SQLite
                            routerDbContext.PingMetrics.Add(metrics);
                            await routerDbContext.SaveChangesAsync(stoppingToken);

                            // 4. Analisis Peringatan Logis & Fisik
                            await AnalyzeAndLogIssuesAsync(routerDbContext, trackedRouter, metrics);

                            // 5. Pemicu Auto-Traceroute jika performa memburuk
                            if ((metrics.PacketLossPercentage > 25 || metrics.LatencyMs > 100) && !_isTracerouteRunning)
                            {
                                _ = Task.Run(() => TriggerAutoTracerouteAsync(trackedRouter.IpAddress), stoppingToken);
                            }

                            // 6. Kirim data ke SignalR Hub
                            await _hubContext.Clients.All.SendAsync("ReceiveMetrics", new
                            {
                                routerId = trackedRouter.Id,
                                routerName = trackedRouter.Name,
                                ipAddress = trackedRouter.IpAddress,
                                latencyMs = Math.Round(metrics.LatencyMs, 2),
                                jitterMs = Math.Round(metrics.JitterMs, 2),
                                packetLoss = metrics.PacketLossPercentage,
                                snmpStatus = metrics.SnmpStatus,
                                opticalPowerDbm = Math.Round(metrics.OpticalPowerDbm, 1),
                                crcErrors = metrics.CrcErrors,
                                interfaceSpeedMbps = metrics.InterfaceSpeedMbps,
                                timestamp = metrics.Timestamp,
                                physicalPort = new
                                {
                                    portName = SimPortName,
                                    status = currentPortStatus,
                                    speedMbps = currentPortSpeed,
                                    crcErrors = currentCrcErrors,
                                    cableStatus = currentCableStatus
                                }
                            }, stoppingToken);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error saat monitoring router {router.Id} ({router.IpAddress})");
                        }
                    });

                    await Task.WhenAll(tasks);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error pada siklus monitoring utama.");
                }

                await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
            }
        }

        private async Task EnsureDefaultGatewayRegisteredAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            try
            {
                // Test a query to verify schema matching. If not initialized/mismatch, drop and recreate.
                var test = await dbContext.OntProfiles.AnyAsync();
            }
            catch
            {
                _logger.LogWarning("Database schema mismatch or empty. Re-creating SQLite database...");
                await dbContext.Database.EnsureDeletedAsync();
            }

            await dbContext.Database.EnsureCreatedAsync();

            // Seed default ONT Profiles
            if (!await dbContext.OntProfiles.AnyAsync())
            {
                var profiles = new List<OntProfile>
                {
                    new OntProfile 
                    { 
                        Id = "GENERIC", 
                        BrandName = "Generic MIB-II", 
                        OidPortStatus = "1.3.6.1.2.1.2.2.1.8.1", 
                        OidPortSpeed = "1.3.6.1.2.1.2.2.1.5.1", 
                        OidCrcErrors = "1.3.6.1.2.1.2.2.1.14.1", 
                        OidOpticalPower = "" 
                    },
                    new OntProfile 
                    { 
                        Id = "HUAWEI", 
                        BrandName = "Huawei GPON ONT", 
                        OidPortStatus = "1.3.6.1.2.1.2.2.1.8.1", 
                        OidPortSpeed = "1.3.6.1.2.1.2.2.1.5.1", 
                        OidCrcErrors = "1.3.6.1.2.1.2.2.1.14.1", 
                        OidOpticalPower = "1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9.1" 
                    },
                    new OntProfile 
                    { 
                        Id = "ZTE", 
                        BrandName = "ZTE GPON ONT", 
                        OidPortStatus = "1.3.6.1.2.1.2.2.1.8.1", 
                        OidPortSpeed = "1.3.6.1.2.1.2.2.1.5.1", 
                        OidCrcErrors = "1.3.6.1.2.1.2.2.1.14.1", 
                        OidOpticalPower = "1.3.6.1.4.1.3902.1082.500.1.2.3.1.2.1" 
                    }
                };
                dbContext.OntProfiles.AddRange(profiles);
                await dbContext.SaveChangesAsync();
                _logger.LogInformation("Seeded default ONT profiles (Generic, Huawei, ZTE).");
            }

            string gatewayIp = GatewayDetector.DetectDefaultGateway();

            var existingGateway = await dbContext.Routers
                .FirstOrDefaultAsync(r => r.IsDefaultGateway || r.IpAddress == gatewayIp);

            if (existingGateway == null)
            {
                var newGateway = new Router
                {
                    Id = "GATEWAY-01",
                    Name = $"Default Gateway ({gatewayIp})",
                    IpAddress = gatewayIp,
                    IsDefaultGateway = true,
                    IsActive = true,
                    OntProfileId = "GENERIC",
                    CreatedAt = DateTime.UtcNow
                };

                dbContext.Routers.Add(newGateway);
                await dbContext.SaveChangesAsync();
                _logger.LogInformation($"Registrasi default gateway baru: {gatewayIp}");
            }
        }

        private async Task<PingMetric> MeasureMetricsAsync(Router router)
        {
            using var ping = new Ping();
            int pingsCount = 4;
            int successfulPings = 0;
            double totalLatency = 0;
            double currentJitter = _currentJitters.GetValueOrDefault(router.Id, 0);
            double lastLatency = _lastLatencies.GetValueOrDefault(router.Id, -1);

            for (int i = 0; i < pingsCount; i++)
            {
                try
                {
                    var reply = await ping.SendPingAsync(router.IpAddress, 700);
                    if (reply.Status == IPStatus.Success)
                    {
                        successfulPings++;
                        double latency = reply.RoundtripTime;
                        totalLatency += latency;

                        if (lastLatency != -1)
                        {
                            double diff = Math.Abs(latency - lastLatency);
                            currentJitter = currentJitter + ((diff - currentJitter) / 16.0);
                        }
                        lastLatency = latency;
                    }
                }
                catch
                {
                    // Gagal ping
                }

                await Task.Delay(50);
            }

            _lastLatencies[router.Id] = lastLatency;
            _currentJitters[router.Id] = currentJitter;

            double avgLatency = successfulPings > 0 ? totalLatency / successfulPings : 0;
            double lossPercentage = ((pingsCount - successfulPings) / (double)pingsCount) * 100;

            if (lossPercentage == 100)
            {
                avgLatency = 0;
                currentJitter = 0;
            }

            return new PingMetric
            {
                RouterId = router.Id,
                LatencyMs = avgLatency,
                JitterMs = currentJitter,
                PacketLossPercentage = lossPercentage,
                Timestamp = DateTime.UtcNow
            };
        }

        // Fungsi Query SNMP menggunakan SharpSnmpLib
        private async Task<(bool success, string portStatus, double speedMbps, long crcErrors, double optPower)> PollSnmpAsync(string routerIp, OntProfile profile)
        {
            try
            {
                if (!IPAddress.TryParse(routerIp, out IPAddress? ip))
                    return (false, "DOWN", 0, 0, 0);

                var target = new IPEndPoint(ip, 161);
                var community = new OctetString("public");
                
                var oids = new List<Variable>
                {
                    new Variable(new ObjectIdentifier(profile.OidPortStatus)),
                    new Variable(new ObjectIdentifier(profile.OidPortSpeed)),
                    new Variable(new ObjectIdentifier(profile.OidCrcErrors))
                };

                bool hasOptPowerOid = !string.IsNullOrEmpty(profile.OidOpticalPower);
                if (hasOptPowerOid)
                {
                    oids.Add(new Variable(new ObjectIdentifier(profile.OidOpticalPower)));
                }

                var result = await Task.Run(() => 
                    Messenger.Get(VersionCode.V2, target, community, oids, 500)
                );

                if (result != null && result.Count >= 3)
                {
                    int statusInt = int.Parse(result[0].Data.ToString());
                    string portStatus = statusInt == 1 ? "UP" : "DOWN";

                    double speedBytes = double.Parse(result[1].Data.ToString());
                    double speedMbps = speedBytes / 1_000_000.0;

                    long crcErrors = long.Parse(result[2].Data.ToString());

                    double optPower = -18.7;
                    if (hasOptPowerOid && result.Count >= 4)
                    {
                        double rawVal = double.Parse(result[3].Data.ToString());
                        if (rawVal > 1000) rawVal = (rawVal - 65536);
                        
                        if (rawVal > 0 || rawVal < -100)
                        {
                            optPower = rawVal / 10.0;
                        }
                        else
                        {
                            optPower = rawVal;
                        }
                    }

                    return (true, portStatus, speedMbps, crcErrors, optPower);
                }
            }
            catch
            {
                // SNMP Down
            }

            return (false, "DOWN", 0, 0, 0);
        }

        private async Task TriggerAutoTracerouteAsync(string ipAddress)
        {
            _isTracerouteRunning = true;
            _logger.LogWarning($"Menjalankan Auto-Traceroute ke {ipAddress} akibat degradasi performa...");
            
            try
            {
                var hops = await TracerouteService.RunTracerouteAsync(ipAddress);
                LastTracerouteHops = hops;

                // Pancarkan hasil traceroute secara real-time ke web dashboard
                await _hubContext.Clients.All.SendAsync("ReceiveTraceroute", new
                {
                    targetIp = ipAddress,
                    hops = hops
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gagal menjalankan auto-traceroute.");
            }
            finally
            {
                _isTracerouteRunning = false;
            }
        }

        private async Task AnalyzeAndLogIssuesAsync(AppDbContext dbContext, Router router, PingMetric metric)
        {
            var issues = new List<(string type, string desc, string severity)>();

            // 1. Diagnosa Logis Jaringan (Ping/Loss/Offline)
            if (metric.PacketLossPercentage == 100)
            {
                issues.Add(("Offline", $"Router {router.Name} ({router.IpAddress}) is not responding (Total Offline).", "Critical"));
            }
            else
            {
                if (metric.PacketLossPercentage > 20)
                    issues.Add(("High Packet Loss", $"High packet loss detected: {metric.PacketLossPercentage}% on {router.Name}.", "Critical"));
                
                if (metric.LatencyMs > 100)
                    issues.Add(("High Latency", $"High latency detected: {metric.LatencyMs:F1}ms (Standard < 50ms).", "Warning"));
                
                if (metric.JitterMs > 15)
                    issues.Add(("High Jitter", $"High jitter detected: {metric.JitterMs:F1}ms (Signal unstable).", "Warning"));
            }

            // 2. Diagnosa Fisik Jaringan (Optik & UTP Link)
            if (metric.OpticalPowerDbm < -27.0)
            {
                issues.Add(("Optical Signal Weak", $"Optical signal is too weak: {metric.OpticalPowerDbm:F1} dBm (Limit: -27 dBm). Cable dirty or bent.", "Critical"));
            }

            if (metric.InterfaceSpeedMbps > 0 && metric.InterfaceSpeedMbps < 1000 && SimCableStatus.Contains("100Mbps Limit"))
            {
                issues.Add(("Port Speed Degradation", $"Link speed degraded to {metric.InterfaceSpeedMbps} Mbps (Expected 1 Gbps). Check UTP copper pins.", "Warning"));
            }

            if (SimPortStatus == "DOWN" && SimCableStatus == "Konektor Longgar")
            {
                issues.Add(("Port Flapping", $"WAN port flapping detected. RJ45 or Fiber connector might be loose.", "Critical"));
            }

            // Dapatkan isu aktif terakhir yang belum selesai
            var activeIssues = await dbContext.NetworkIssueLogs
                .Where(l => l.RouterId == router.Id && !l.IsResolved)
                .ToListAsync();

            // Selesaikan isu lama yang sudah tidak aktif
            foreach (var activeIssue in activeIssues)
            {
                if (!issues.Any(i => i.type == activeIssue.IssueType))
                {
                    activeIssue.IsResolved = true;
                    activeIssue.ResolvedAt = DateTime.UtcNow;
                    await _hubContext.Clients.All.SendAsync("ReceiveIssueLog", activeIssue);
                }
            }

            // Tambahkan isu baru yang belum tercatat
            foreach (var issue in issues)
            {
                if (!activeIssues.Any(i => i.IssueType == issue.type))
                {
                    var newLog = new NetworkIssueLog
                    {
                        RouterId = router.Id,
                        IssueType = issue.type,
                        Description = issue.desc,
                        Severity = issue.severity,
                        Timestamp = DateTime.UtcNow
                    };
                    dbContext.NetworkIssueLogs.Add(newLog);
                    await dbContext.SaveChangesAsync();
                    await _hubContext.Clients.All.SendAsync("ReceiveIssueLog", newLog);
                }
            }

            await dbContext.SaveChangesAsync();
        }
    }
}
