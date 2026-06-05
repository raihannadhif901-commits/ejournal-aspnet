using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NetworkMonitor.Data;
using NetworkMonitor.Hubs;
using NetworkMonitor.Models;
using NetworkMonitor.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// 1. Registrasi Database SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=network_monitor.db"));

// 2. Registrasi SignalR untuk real-time update
builder.Services.AddSignalR();

// 3. Registrasi Background Service untuk Monitoring Jaringan
builder.Services.AddHostedService<NetworkMonitoringService>();

// 4. Registrasi SpeedTestService
builder.Services.AddSingleton<SpeedTestService>();

var app = builder.Build();

// 4. Konfigurasi agar melayani file statis dari wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// 5. Routing Endpoint Hub SignalR
app.MapHub<MonitorHub>("/hubs/monitor");

// 6. Endpoint REST API

// Ambil Status Terkini Router & Info Port Fisik
app.MapGet("/api/status", async (AppDbContext db) =>
{
    var routers = await db.Routers.ToListAsync();
    var latestMetrics = db.PingMetrics
        .GroupBy(p => p.RouterId)
        .Select(g => g.OrderByDescending(x => x.Timestamp).FirstOrDefault())
        .ToList();

    var issues = await db.NetworkIssueLogs.Where(l => !l.IsResolved).ToListAsync();

    return Results.Ok(new
    {
        routers = routers.Select(r => new
        {
            r.Id,
            r.Name,
            r.IpAddress,
            r.IsDefaultGateway,
            metrics = latestMetrics.FirstOrDefault(m => m != null && m.RouterId == r.Id)
        }),
        activeIssues = issues,
        physicalPort = new
        {
            portName = NetworkMonitoringService.SimPortName,
            status = NetworkMonitoringService.SimPortStatus,
            speedMbps = NetworkMonitoringService.SimPortSpeedMbps,
            crcErrors = NetworkMonitoringService.SimCrcErrors,
            cableStatus = NetworkMonitoringService.SimCableStatus,
            opticalPowerDbm = NetworkMonitoringService.SimOpticalPowerDbm
        }
    });
});

// Ambil Data Historis untuk Chart (50 data terakhir)
app.MapGet("/api/history/{routerId}", async (AppDbContext db, string routerId) =>
{
    var history = await db.PingMetrics
        .Where(p => p.RouterId == routerId)
        .OrderByDescending(p => p.Timestamp)
        .Take(50)
        .OrderBy(p => p.Timestamp)
        .ToListAsync();

    return Results.Ok(history);
});

// Ambil Log Masalah Jaringan (20 data terakhir)
app.MapGet("/api/issues", async (AppDbContext db) =>
{
    var logs = await db.NetworkIssueLogs
        .OrderByDescending(l => l.Timestamp)
        .Take(20)
        .ToListAsync();

    return Results.Ok(logs);
});

// Jalankan Traceroute On-demand ke IP Router
app.MapGet("/api/traceroute/{routerId}", async (AppDbContext db, string routerId) =>
{
    var router = await db.Routers.FindAsync(routerId);
    if (router == null)
    {
        return Results.NotFound(new { message = "Router not found." });
    }

    // Jika sedang berjalan atau belum ada cache, jalankan traceroute baru
    if (NetworkMonitoringService.LastTracerouteHops.Count == 0)
    {
        var hops = await TracerouteService.RunTracerouteAsync(router.IpAddress);
        NetworkMonitoringService.LastTracerouteHops = hops;
    }

    return Results.Ok(NetworkMonitoringService.LastTracerouteHops);
});
// --- TARGETS (ROUTERS) CRUD ENDPOINTS ---
app.MapGet("/api/targets", async (AppDbContext db) =>
{
    var targets = await db.Routers.ToListAsync();
    return Results.Ok(targets);
});

app.MapPost("/api/targets", async (AppDbContext db, Router newTarget) =>
{
    if (string.IsNullOrEmpty(newTarget.Id))
    {
        newTarget.Id = "TRG-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
    }
    newTarget.CreatedAt = DateTime.UtcNow;
    db.Routers.Add(newTarget);
    await db.SaveChangesAsync();
    return Results.Created($"/api/targets/{newTarget.Id}", newTarget);
});

app.MapPut("/api/targets/{id}", async (AppDbContext db, string id, Router updatedTarget) =>
{
    var target = await db.Routers.FindAsync(id);
    if (target == null) return Results.NotFound(new { message = "Target not found." });

    target.Name = updatedTarget.Name;
    target.IpAddress = updatedTarget.IpAddress;
    target.IsActive = updatedTarget.IsActive;
    target.OntProfileId = updatedTarget.OntProfileId;
    
    await db.SaveChangesAsync();
    return Results.Ok(target);
});

app.MapDelete("/api/targets/{id}", async (AppDbContext db, string id) =>
{
    var target = await db.Routers.FindAsync(id);
    if (target == null) return Results.NotFound(new { message = "Target not found." });
    
    var metrics = db.PingMetrics.Where(m => m.RouterId == id);
    db.PingMetrics.RemoveRange(metrics);

    var issues = db.NetworkIssueLogs.Where(i => i.RouterId == id);
    db.NetworkIssueLogs.RemoveRange(issues);

    db.Routers.Remove(target);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Target deleted successfully." });
});

// --- ONT PROFILES CRUD ENDPOINTS ---
app.MapGet("/api/ont-profiles", async (AppDbContext db) =>
{
    var profiles = await db.OntProfiles.ToListAsync();
    return Results.Ok(profiles);
});

app.MapPost("/api/ont-profiles", async (AppDbContext db, OntProfile newProfile) =>
{
    if (string.IsNullOrEmpty(newProfile.Id))
    {
        newProfile.Id = newProfile.BrandName.Replace(" ", "-").ToUpper();
    }
    db.OntProfiles.Add(newProfile);
    await db.SaveChangesAsync();
    return Results.Created($"/api/ont-profiles/{newProfile.Id}", newProfile);
});

app.MapPut("/api/ont-profiles/{id}", async (AppDbContext db, string id, OntProfile updatedProfile) =>
{
    var profile = await db.OntProfiles.FindAsync(id);
    if (profile == null) return Results.NotFound(new { message = "ONT Profile not found." });

    profile.BrandName = updatedProfile.BrandName;
    profile.OidPortStatus = updatedProfile.OidPortStatus;
    profile.OidPortSpeed = updatedProfile.OidPortSpeed;
    profile.OidCrcErrors = updatedProfile.OidCrcErrors;
    profile.OidOpticalPower = updatedProfile.OidOpticalPower;

    await db.SaveChangesAsync();
    return Results.Ok(profile);
});

app.MapDelete("/api/ont-profiles/{id}", async (AppDbContext db, string id) =>
{
    if (id == "GENERIC") return Results.BadRequest(new { message = "Cannot delete generic profile." });

    var profile = await db.OntProfiles.FindAsync(id);
    if (profile == null) return Results.NotFound(new { message = "ONT Profile not found." });

    var routers = await db.Routers.Where(r => r.OntProfileId == id).ToListAsync();
    foreach (var r in routers)
    {
        r.OntProfileId = "GENERIC";
    }

    db.OntProfiles.Remove(profile);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "ONT Profile deleted successfully." });
});

// --- SPEED TEST ENDPOINT ---
app.MapPost("/api/speedtest/run", async (SpeedTestService speedTest) =>
{
    if (speedTest.IsTestRunning)
    {
        return Results.Conflict(new { message = "Speed test is already running." });
    }

    await speedTest.StartTestAsync();
    return Results.Accepted("/api/speedtest/status", new { message = "Speed test started." });
});

app.MapGet("/api/speedtest/status", (SpeedTestService speedTest) =>
{
    return Results.Ok(new { isRunning = speedTest.IsTestRunning });
});

app.Run();
