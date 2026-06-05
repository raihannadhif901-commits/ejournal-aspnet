using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace NetworkMonitor.Hubs
{
    public class MonitorHub : Hub
    {
        // Hub ini digunakan oleh backend untuk memicu push data ke semua client yang terkoneksi.
        // Client tidak perlu memanggil metode apa pun secara langsung, cukup mendengarkan event "ReceiveMetrics" dan "ReceiveIssueLog".
        public async Task JoinDashboard()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "DashboardGroup");
        }
    }
}
