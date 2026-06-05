using System;

namespace NetworkMonitor.Models
{
    public class Router
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public bool IsDefaultGateway { get; set; }
        public bool IsActive { get; set; } = true;
        public string OntProfileId { get; set; } = "GENERIC";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class OntProfile
    {
        public string Id { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string OidPortStatus { get; set; } = "1.3.6.1.2.1.2.2.1.8.1";
        public string OidPortSpeed { get; set; } = "1.3.6.1.2.1.2.2.1.5.1";
        public string OidCrcErrors { get; set; } = "1.3.6.1.2.1.2.2.1.14.1";
        public string OidOpticalPower { get; set; } = string.Empty;
    }

    public class PingMetric
    {
        public int Id { get; set; }
        public string RouterId { get; set; } = string.Empty;
        public double LatencyMs { get; set; }
        public double JitterMs { get; set; }
        public double PacketLossPercentage { get; set; }
        
        // Metrik Jaringan Tingkat Lanjut (SNMP & Fiber Diagnostics)
        public double OpticalPowerDbm { get; set; } // Kekuatan sinyal optik RX (dBm)
        public long CrcErrors { get; set; } // Jumlah kesalahan frame fisik
        public double InterfaceSpeedMbps { get; set; } // Kecepatan port aktif (10/100/1000 Mbps)
        public string SnmpStatus { get; set; } = "Offline"; // "Connected" atau "Offline"

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class NetworkIssueLog
    {
        public int Id { get; set; }
        public string RouterId { get; set; } = string.Empty;
        public string IssueType { get; set; } = string.Empty; // "High Jitter", "High Latency", "Packet Loss", "Offline", "Optical Signal Weak", "Port Speed Degradation"
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty; // "Warning", "Critical"
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsResolved { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
