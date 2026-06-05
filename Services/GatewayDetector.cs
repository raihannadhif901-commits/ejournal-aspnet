using System;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace NetworkMonitor.Services
{
    public static class GatewayDetector
    {
        public static string DetectDefaultGateway()
        {
            try
            {
                // Ambil semua interface jaringan yang aktif dan bukan loopback
                var activeInterfaces = NetworkInterface.GetAllNetworkInterfaces()
                    .Where(n => n.OperationalStatus == OperationalStatus.Up && 
                                n.NetworkInterfaceType != NetworkInterfaceType.Loopback &&
                                n.NetworkInterfaceType != NetworkInterfaceType.Tunnel);

                foreach (var netInterface in activeInterfaces)
                {
                    var ipProps = netInterface.GetIPProperties();
                    var gateways = ipProps.GatewayAddresses;

                    foreach (var gateway in gateways)
                    {
                        // Pastikan alamat IPv4 valid dan bukan 0.0.0.0
                        if (gateway.Address.AddressFamily == AddressFamily.InterNetwork)
                        {
                            string ipStr = gateway.Address.ToString();
                            if (!string.IsNullOrEmpty(ipStr) && ipStr != "0.0.0.0")
                            {
                                return ipStr;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saat deteksi gateway: {ex.Message}");
            }

            // Fallback umum ke IP router standar
            return "192.168.1.1";
        }
    }
}
