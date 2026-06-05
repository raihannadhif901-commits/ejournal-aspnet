using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace NetworkMonitor.Services
{
    public class TracerouteHop
    {
        public int HopNumber { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string Hostname { get; set; } = "Unknown";
        public double RoundTripTimeMs { get; set; }
        public bool IsSuccessful { get; set; }
    }

    public static class TracerouteService
    {
        public static async Task<List<TracerouteHop>> RunTracerouteAsync(string ipAddress, int maxHops = 12, int timeoutMs = 600)
        {
            var hops = new List<TracerouteHop>();
            using var ping = new Ping();

            for (int ttl = 1; ttl <= maxHops; ttl++)
            {
                var options = new PingOptions(ttl, true);
                var stopwatch = Stopwatch.StartNew();
                
                try
                {
                    // Kirim payload kecil 32 byte ke target IP
                    var reply = await ping.SendPingAsync(
                        ipAddress, 
                        timeoutMs, 
                        new byte[32], 
                        options
                    );
                    
                    stopwatch.Stop();
                    double rtt = stopwatch.Elapsed.TotalMilliseconds;

                    var hop = new TracerouteHop
                    {
                        HopNumber = ttl,
                        RoundTripTimeMs = Math.Round(rtt, 1)
                    };

                    if (reply.Status == IPStatus.Success)
                    {
                        hop.IpAddress = reply.Address?.ToString() ?? ipAddress;
                        hop.IsSuccessful = true;
                        hop.Hostname = "Target Destination";
                        hops.Add(hop);
                        break; // Sampai di tujuan akhir, stop traceroute
                    }
                    else if (reply.Status == IPStatus.TtlExpired)
                    {
                        hop.IpAddress = reply.Address?.ToString() ?? "Unknown IP";
                        hop.IsSuccessful = true;
                        hop.Hostname = "Hop Router Node";
                        hops.Add(hop);
                    }
                    else
                    {
                        // Request Timed Out (RTO)
                        hop.IpAddress = "*";
                        hop.IsSuccessful = false;
                        hop.Hostname = "Request Timed Out";
                        hop.RoundTripTimeMs = 0;
                        hops.Add(hop);
                    }
                }
                catch
                {
                    hops.Add(new TracerouteHop
                    {
                        HopNumber = ttl,
                        IpAddress = "*",
                        Hostname = "Failed to Ping",
                        RoundTripTimeMs = 0,
                        IsSuccessful = false
                    });
                }
            }

            return hops;
        }
    }
}
