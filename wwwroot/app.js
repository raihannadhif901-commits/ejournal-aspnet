// Konfigurasi Chart & State Aplikasi
let metricsChart = null;
const maxChartPoints = 30;
let currentRouterId = ""; 
let activeAlerts = new Map();
let allTargets = [];
let allProfiles = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 0. Cek tema tersimpan di localStorage
    const savedTheme = localStorage.getItem("theme");
    const checkbox = document.getElementById("theme-checkbox");
    const isLight = savedTheme === "light";
    if (isLight) {
        document.body.classList.add("light-theme");
        if (checkbox) checkbox.checked = true;
    } else {
        document.body.classList.remove("light-theme");
        if (checkbox) checkbox.checked = false;
    }
    updateThemeIcons(isLight);

    // 1. Tampilkan jam sistem real-time di header
    startClock();

    // 2. Inisialisasi Chart.js
    try {
        initChart();
    } catch (err) {
        console.error("Gagal menginisialisasi grafik Chart.js:", err);
    }

    // 3. Muat Targets & Profiles dari server database
    try {
        await loadProfiles();
        await loadTargets();
    } catch (err) {
        console.error("Gagal memuat data target & profil:", err);
    }

    // 4. Ambil data status awal dari server
    try {
        await fetchInitialStatus();
    } catch (err) {
        console.error("Gagal memuat status awal:", err);
    }

    // 5. Ambil data histori untuk target terpilih pertama kali
    if (currentRouterId) {
        try {
            await fetchChartHistory(currentRouterId);
        } catch (err) {
            console.error("Gagal memuat histori grafik:", err);
        }
    }

    // 6. Hubungkan ke SignalR Hub
    try {
        setupSignalR();
    } catch (err) {
        console.error("Gagal menginisialisasi SignalR:", err);
    }
});

// Timer Jam di Header
function startClock() {
    const clockEl = document.getElementById("system-time");
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString("id-ID", { hour12: false });
    }, 1000);
}

// Mengambil status awal dari database
async function fetchInitialStatus() {
    try {
        const res = await fetch("/api/status");
        if (!res.ok) throw new Error("Gagal mengambil data status.");
        
        const data = await res.json();
        
        // Tampilkan info router gateway terpilih
        const gateway = data.routers.find(r => r.id === currentRouterId) || data.routers.find(r => r.isDefaultGateway);
        if (gateway) {
            if (!currentRouterId) {
                currentRouterId = gateway.id;
                const selectHeader = document.getElementById("active-target-select");
                if (selectHeader) selectHeader.value = currentRouterId;
            }

            document.getElementById("router-ip").textContent = gateway.ipAddress;
            document.getElementById("router-status").textContent = gateway.isActive ? "Online" : "Inactive";
            document.getElementById("router-status").className = gateway.isActive ? "status-dot online" : "status-dot offline";
            
            if (gateway.metrics) {
                updateMetricsUi(gateway.metrics);
                
                // Update Status SNMP di Header dari data awal DB
                const snmpBadge = document.getElementById("snmp-status-badge");
                if (gateway.metrics.snmpStatus === "Connected") {
                    snmpBadge.textContent = "SNMP: Connected";
                    snmpBadge.className = "badge status-success";
                } else {
                    snmpBadge.textContent = "SNMP: Offline";
                    snmpBadge.className = "badge status-danger";
                }
            } else {
                // Default jika metrik kosong pada startup pertama
                const snmpBadge = document.getElementById("snmp-status-badge");
                snmpBadge.textContent = "SNMP: Offline";
                snmpBadge.className = "badge status-danger";
                
                // Reset indicators
                document.getElementById("val-latency").innerHTML = `0<span class="unit">ms</span>`;
                document.getElementById("val-jitter").innerHTML = `0<span class="unit">ms</span>`;
                document.getElementById("val-loss").innerHTML = `0<span class="unit">%</span>`;
            }
        }

        // Tampilkan info port fisik
        updatePhysicalPortUi(data.physicalPort);

        // Ambil log isu lama
        const issuesRes = await fetch("/api/issues");
        if (issuesRes.ok) {
            const issues = await issuesRes.json();
            const logsList = document.getElementById("logs-list");
            logsList.innerHTML = "";
            
            // Saring isu hanya untuk target router yang sedang aktif dipantau
            const filteredIssues = issues.filter(i => i.routerId === currentRouterId);
            activeAlerts.clear();

            if (filteredIssues.length === 0) {
                logsList.innerHTML = `<div class="empty-logs">No alerts active. System running normally.</div>`;
            } else {
                filteredIssues.forEach(issue => {
                    addIssueToUi(issue, false);
                });
            }
            updateAlertCount();
        }
    } catch (err) {
        console.error("Gagal melakukan inisialisasi status:", err);
    }
}

// Inisialisasi Chart.js
function initChart() {
    const ctx = document.getElementById("metricsChart").getContext("2d");
    
    // Gradient untuk Latency
    const latencyGradient = ctx.createLinearGradient(0, 0, 0, 300);
    latencyGradient.addColorStop(0, "rgba(100, 110, 255, 0.3)");
    latencyGradient.addColorStop(1, "rgba(100, 110, 255, 0.0)");

    // Gradient untuk Jitter
    const jitterGradient = ctx.createLinearGradient(0, 0, 0, 300);
    jitterGradient.addColorStop(0, "rgba(245, 158, 11, 0.2)");
    jitterGradient.addColorStop(1, "rgba(245, 158, 11, 0.0)");

    metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: 'hsl(243, 75%, 65%)',
                    backgroundColor: latencyGradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Jitter (ms)',
                    data: [],
                    borderColor: 'hsl(38, 92%, 50%)',
                    backgroundColor: jitterGradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(100, 110, 255, 0.2)',
                    borderWidth: 1,
                    titleFont: { family: 'Plus Jakarta Sans', weight: '600' },
                    bodyFont: { family: 'JetBrains Mono' }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: document.body.classList.contains("light-theme") ? 'hsl(215, 20%, 35%)' : 'hsl(215, 15%, 45%)',
                        font: { family: 'JetBrains Mono', size: 10 },
                        maxTicksLimit: 6
                    }
                },
                y: {
                    grid: {
                        color: document.body.classList.contains("light-theme") ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: document.body.classList.contains("light-theme") ? 'hsl(215, 20%, 35%)' : 'hsl(215, 15%, 45%)',
                        font: { family: 'JetBrains Mono', size: 10 }
                    },
                    min: 0
                }
            }
        }
    });
}

// Fetch data histori untuk diplot di awal
async function fetchChartHistory(routerId) {
    try {
        const res = await fetch(`/api/history/${routerId}`);
        if (!res.ok) throw new Error("Gagal mengambil histori metrik.");
        
        const data = await res.json();
        
        const labels = [];
        const latencies = [];
        const jitters = [];

        data.forEach(item => {
            const timeStr = new Date(item.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            labels.push(timeStr);
            latencies.push(item.latencyMs);
            jitters.push(item.jitterMs);
        });

        metricsChart.data.labels = labels;
        metricsChart.data.datasets[0].data = latencies;
        metricsChart.data.datasets[1].data = jitters;
        metricsChart.update();
    } catch (err) {
        console.error("Gagal load history chart:", err);
    }
}

// Inisialisasi Koneksi Real-time SignalR
function setupSignalR() {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/hubs/monitor")
        .withAutomaticReconnect()
        .build();

    // Event 1: Terima data real-time ping & metrik fisik
    connection.on("ReceiveMetrics", (data) => {
        console.log("SignalR: ReceiveMetrics received:", data);
        if (data.routerId !== currentRouterId) {
            console.warn(`SignalR: Router ID mismatch. Expected: ${currentRouterId}, got: ${data.routerId}`);
            return;
        }

        // Update Box Nilai Metrik Utama
        updateMetricsUi(data);

        // Update Ilustrasi Port Fisik & Fiber
        updatePhysicalPortUi(data.physicalPort);

        // Update Status SNMP di Header
        const snmpBadge = document.getElementById("snmp-status-badge");
        if (data.snmpStatus === "Connected") {
            snmpBadge.textContent = "SNMP: Connected";
            snmpBadge.className = "badge status-success";
        } else {
            snmpBadge.textContent = "SNMP: Offline";
            snmpBadge.className = "badge status-danger";
        }

        // Tambahkan titik baru ke chart
        const timeStr = new Date(data.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        
        metricsChart.data.labels.push(timeStr);
        metricsChart.data.datasets[0].data.push(data.latencyMs);
        metricsChart.data.datasets[1].data.push(data.jitterMs);

        // Batasi jumlah titik agar chart terus bergeser
        if (metricsChart.data.labels.length > maxChartPoints) {
            metricsChart.data.labels.shift();
            metricsChart.data.datasets[0].data.shift();
            metricsChart.data.datasets[1].data.shift();
        }

        metricsChart.update('none');
    });

    // Event 2: Terima log issue baru secara real-time
    connection.on("ReceiveIssueLog", (issue) => {
        console.log("SignalR: ReceiveIssueLog received:", issue);
        if (issue.routerId === currentRouterId) {
            addIssueToUi(issue, true);
        }
    });

    // Event 3: Terima data traceroute otomatis
    connection.on("ReceiveTraceroute", (data) => {
        console.log("SignalR: ReceiveTraceroute received:", data);
        if (data.targetIp === document.getElementById("router-ip").textContent) {
            renderTraceroute(data.hops);
        }
    });

    // Event 4: Terima progres Speed Test
    connection.on("ReceiveSpeedTestProgress", (progress) => {
        console.log("SignalR: ReceiveSpeedTestProgress received:", progress);
        updateSpeedTestProgress(progress);
    });

    connection.start()
        .then(() => {
            console.log("Koneksi SignalR berhasil dibangun. Connection ID:", connection.connectionId);
            connection.invoke("JoinDashboard");
        })
        .catch(err => console.error("SignalR Connection Error: ", err));
}

// Update UI untuk metrik ping
function updateMetricsUi(data) {
    const latency = data.latencyMs !== undefined && data.latencyMs !== null ? data.latencyMs : 0;
    const jitter = data.jitterMs !== undefined && data.jitterMs !== null ? data.jitterMs : 0;
    const loss = data.packetLoss !== undefined && data.packetLoss !== null ? data.packetLoss : 
                 (data.packetLossPercentage !== undefined && data.packetLossPercentage !== null ? data.packetLossPercentage : 0);

    document.getElementById("val-latency").innerHTML = `${latency.toFixed(1)}<span class="unit">ms</span>`;
    document.getElementById("val-jitter").innerHTML = `${jitter.toFixed(1)}<span class="unit">ms</span>`;
    document.getElementById("val-loss").innerHTML = `${loss.toFixed(0)}<span class="unit">%</span>`;

    // Beri warna khusus jika metrik buruk
    const latencyBox = document.getElementById("val-latency").parentElement;
    const lossBox = document.getElementById("val-loss").parentElement;

    if (loss > 25) {
        lossBox.style.borderColor = "var(--color-danger)";
        lossBox.style.background = "var(--color-danger-glow)";
        document.getElementById("router-status").textContent = "Offline";
        document.getElementById("router-status").className = "status-dot offline";
    } else if (loss > 0) {
        lossBox.style.borderColor = "var(--color-warning)";
        lossBox.style.background = "var(--color-warning-glow)";
        document.getElementById("router-status").textContent = "Jittery";
        document.getElementById("router-status").className = "status-dot online";
    } else {
        lossBox.style.borderColor = "var(--border-color)";
        lossBox.style.background = "var(--bg-sub-box)";
        document.getElementById("router-status").textContent = "Online";
        document.getElementById("router-status").className = "status-dot online";
    }

    if (latency > 100) {
        latencyBox.style.borderColor = "var(--color-warning)";
        latencyBox.style.background = "var(--color-warning-glow)";
    } else {
        latencyBox.style.borderColor = "var(--border-color)";
        latencyBox.style.background = "var(--bg-sub-box)";
    }
}

// Update UI untuk Port Fisik & Gauge Fiber Optik
function updatePhysicalPortUi(port) {
    document.getElementById("val-port-name").textContent = port.portName;
    document.getElementById("val-port-speed").textContent = port.speedMbps;
    document.getElementById("val-port-state").textContent = port.status;
    document.getElementById("val-crc-errors").textContent = port.crcErrors;
    document.getElementById("val-cable-status").textContent = port.cableStatus;
    
    // Format nilai redaman fiber optik (dBm)
    const dbmVal = port.opticalPowerDbm;
    const optPowerText = document.getElementById("val-optical-power");
    optPowerText.textContent = `${dbmVal.toFixed(1)} dBm`;

    // Kalkulasi persentase bar: range -35 dBm (0%) s.d -8 dBm (100%)
    let percent = ((dbmVal + 35) / (27)) * 100;
    percent = Math.min(Math.max(percent, 0), 100);

    const progressBar = document.getElementById("optical-power-bar");
    progressBar.style.width = `${percent}%`;

    // Ubah warna text & gauge bar berdasarkan standard toleransi redaman ISP (-27 dBm)
    if (dbmVal >= -25) {
        optPowerText.className = "value val-mono text-success";
        progressBar.style.backgroundColor = "var(--color-success)";
    } else if (dbmVal < -25 && dbmVal >= -27) {
        optPowerText.className = "value val-mono text-warning";
        progressBar.style.backgroundColor = "var(--color-warning)";
    } else {
        optPowerText.className = "value val-mono text-danger";
        progressBar.style.backgroundColor = "var(--color-danger)";
    }

    // Ubah visual ilustrasi port rj45 berdasarkan status link
    const connector = document.getElementById("rj45-connector");
    const portCard = document.getElementById("physical-port-card");
    const statusBadge = document.getElementById("cable-status-badge");

    connector.className = "port-connector";
    portCard.style.borderColor = "var(--border-color)";
    statusBadge.textContent = port.cableStatus;
    statusBadge.className = "badge";

    if (port.status === "DOWN") {
        connector.classList.add("state-down");
        document.getElementById("val-port-state").className = "value text-danger";
    } else {
        document.getElementById("val-port-state").className = "value text-success";
    }

    // Ubah warna badge sesuai dengan profil status kabel
    if (port.cableStatus === "Konektor Longgar") {
        connector.classList.add("state-flapping");
        portCard.style.borderColor = "var(--color-warning)";
        statusBadge.className = "badge status-warning";
    } else if (port.cableStatus === "Kabel Shielding Rusak" || port.cableStatus === "Redaman Buruk (-29 dBm)") {
        portCard.style.borderColor = "var(--color-danger)";
        statusBadge.className = "badge status-danger";
    } else if (port.cableStatus === "Pin Tembaga Putus (100Mbps Limit)") {
        portCard.style.borderColor = "var(--color-warning)";
        statusBadge.className = "badge status-warning";
    } else if (port.cableStatus === "Normal" || port.cableStatus === "Normal Link" || port.cableStatus.includes("SNMP")) {
        statusBadge.className = "badge status-ok";
    } else {
        statusBadge.className = "badge";
    }
}

// Tambahkan Alert ke panel logs
function addIssueToUi(issue, isNew) {
    const logsList = document.getElementById("logs-list");
    
    const emptyEl = logsList.querySelector(".empty-logs");
    if (emptyEl) emptyEl.remove();

    const existingLogEl = document.getElementById(`log-${issue.id}`);
    if (existingLogEl) {
        if (issue.isResolved) {
            existingLogEl.className = "log-item";
            existingLogEl.style.borderLeftColor = "var(--color-success)";
            existingLogEl.style.background = "var(--color-success-glow)";
            
            if (!existingLogEl.querySelector(".log-resolved-badge")) {
                const resolvedBadge = document.createElement("span");
                resolvedBadge.className = "log-resolved-badge";
                resolvedBadge.textContent = `Resolved at ${new Date(issue.resolvedAt).toLocaleTimeString("en-US", { hour12: false })}`;
                existingLogEl.appendChild(resolvedBadge);
            }
            activeAlerts.delete(issue.id);
        }
        updateAlertCount();
        return;
    }

    const item = document.createElement("div");
    item.id = `log-${issue.id}`;
    item.className = `log-item severity-${issue.severity.toLowerCase()}`;
    
    const timeStr = new Date(issue.timestamp).toLocaleTimeString("id-ID");
    
    let resolvedHtml = "";
    if (issue.isResolved) {
        item.className = "log-item";
        item.style.borderLeftColor = "var(--color-success)";
        item.style.background = "var(--color-success-glow)";
        resolvedHtml = `<span class="log-resolved-badge">Resolved at ${new Date(issue.resolvedAt).toLocaleTimeString("en-US", { hour12: false })}</span>`;
    } else {
        activeAlerts.set(issue.id, issue);
    }

    item.innerHTML = `
        <div class="log-header">
            <span>${issue.issueType}</span>
            <span class="log-time">${timeStr}</span>
        </div>
        <div class="log-desc">${issue.description}</div>
        ${resolvedHtml}
    `;

    if (isNew) {
        logsList.insertBefore(item, logsList.firstChild);
    } else {
        logsList.appendChild(item);
    }

    updateAlertCount();
}

function updateAlertCount() {
    const badge = document.getElementById("active-alerts-count");
    const count = activeAlerts.size;
    badge.textContent = `${count} Active`;
    if (count > 0) {
        badge.className = "badge status-danger";
    } else {
        badge.className = "badge badge-outline";
    }
}

// Trigger Jalankan Traceroute Manual
async function triggerManualTraceroute() {
    const btn = document.getElementById("btn-manual-trace");
    btn.textContent = "Tracing...";
    btn.disabled = true;

    try {
        const res = await fetch(`/api/traceroute/${currentRouterId}`);
        if (res.ok) {
            const hops = await res.json();
            renderTraceroute(hops);
        }
    } catch (err) {
        console.error("Gagal melakukan traceroute:", err);
    } finally {
        btn.textContent = "Trace Route";
        btn.disabled = false;
    }
}

// Render visualisasi traceroute hops
function renderTraceroute(hops) {
    const container = document.getElementById("traceroute-flow");
    container.innerHTML = "";

    if (!hops || hops.length === 0) {
        container.innerHTML = `<div class="traceroute-idle">No anomalies detected. Network path is clear.</div>`;
        return;
    }

    hops.forEach((hop, index) => {
        let statusClass = "success";
        if (hop.ipAddress === "*" || hop.roundTripTimeMs === 0) {
            statusClass = "danger";
        } else if (hop.roundTripTimeMs > 60) {
            statusClass = "warning";
        }

        let nodeName = "Router Node";
        if (index === 0) nodeName = "Local Host";
        else if (index === 1) nodeName = "Gateway (ONT)";
        else if (index === hops.length - 1 && hop.isSuccessful) nodeName = "Target IP";
        else if (index === 2) nodeName = "ISP ODP Node";
        else if (index === 3) nodeName = "ISP OLT Metro";

        const node = document.createElement("div");
        node.className = "hop-node";
        node.innerHTML = `
            <div class="hop-circle ${statusClass}">${hop.hopNumber}</div>
            <div class="hop-details">
                <span class="hop-ip">${hop.ipAddress}</span>
                <span class="hop-rtt">${hop.ipAddress === "*" ? "RTO" : hop.roundTripTimeMs.toFixed(1) + " ms"}</span>
                <span class="hop-name">${nodeName}</span>
            </div>
        `;

        container.appendChild(node);

        if (index < hops.length - 1) {
            const connector = document.createElement("div");
            connector.className = "hop-connector";
            container.appendChild(connector);
        }
    });
}

// Theme Toggle Logic (Light / Dark Mode)
function toggleTheme() {
    const checkbox = document.getElementById("theme-checkbox");
    if (!checkbox) return;

    const isLight = checkbox.checked;
    if (isLight) {
        document.body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.remove("light-theme");
        localStorage.setItem("theme", "dark");
    }

    updateThemeIcons(isLight);
    updateChartTheme(isLight);
}

function updateThemeIcons(isLight) {
    const iconDark = document.getElementById("theme-icon-dark");
    const iconLight = document.getElementById("theme-icon-light");
    if (iconDark && iconLight) {
        if (isLight) {
            iconLight.classList.add("active");
            iconDark.classList.remove("active");
        } else {
            iconDark.classList.add("active");
            iconLight.classList.remove("active");
        }
    }
}

function updateChartTheme(isLight) {
    if (metricsChart) {
        metricsChart.options.scales.x.ticks.color = isLight ? 'hsl(215, 20%, 35%)' : 'hsl(215, 15%, 45%)';
        metricsChart.options.scales.y.ticks.color = isLight ? 'hsl(215, 20%, 35%)' : 'hsl(215, 15%, 45%)';
        metricsChart.options.scales.y.grid.color = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
        metricsChart.update();
    }
}

// --- PANEL SWITCH NAVIGATION ---
function switchPanel(panelId, btnEl) {
    document.querySelectorAll(".content-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    const targetPanel = document.getElementById(`panel-${panelId}`);
    if (targetPanel) {
        targetPanel.classList.add("active");
    }

    if (btnEl) {
        btnEl.classList.add("active");
    }

    const headerTitle = document.getElementById("current-panel-title");
    if (headerTitle) {
        if (panelId === "dashboard") headerTitle.textContent = "NOC Operations Dashboard";
        else if (panelId === "targets") headerTitle.textContent = "Monitoring Targets Configuration";
        else if (panelId === "profiles") headerTitle.textContent = "ONT SNMP Profiles Configuration";
        else if (panelId === "speedtest") headerTitle.textContent = "Network Speed Analysis";
    }
}

// --- ACTIVE MONITORING TARGET CHANGE ---
async function changeActiveTarget(id) {
    if (!id || id === currentRouterId) return;
    currentRouterId = id;

    // Reset chart data
    if (metricsChart) {
        metricsChart.data.labels = [];
        metricsChart.data.datasets[0].data = [];
        metricsChart.data.datasets[1].data = [];
        metricsChart.update();
    }

    // Refresh data & chart history
    await fetchInitialStatus();
    await fetchChartHistory(currentRouterId);
}

// --- TARGETS CRUD OPERATIONS ---
async function loadTargets() {
    try {
        const res = await fetch("/api/targets");
        if (!res.ok) throw new Error("Gagal mengambil data target.");
        allTargets = await res.json();
        
        // Populate target dropdown in header
        const selectHeader = document.getElementById("active-target-select");
        selectHeader.innerHTML = "";
        
        // Populate dropdown in form
        const selectForm = document.getElementById("target-profile");
        selectForm.innerHTML = "";
        allProfiles.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.brandName;
            selectForm.appendChild(opt);
        });

        if (allTargets.length === 0) {
            const opt = document.createElement("option");
            opt.textContent = "No active targets";
            selectHeader.appendChild(opt);
        } else {
            allTargets.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.id;
                opt.textContent = `${t.name} (${t.ipAddress})`;
                if (t.isDefaultGateway && !currentRouterId) {
                    currentRouterId = t.id;
                }
                selectHeader.appendChild(opt);
            });

            if (!currentRouterId && allTargets.length > 0) {
                currentRouterId = allTargets[0].id;
            }

            selectHeader.value = currentRouterId;
        }

        // Render Targets Table
        const tbody = document.getElementById("targets-table-body");
        tbody.innerHTML = "";
        allTargets.forEach(t => {
            const profile = allProfiles.find(p => p.id === t.ontProfileId);
            const profileName = profile ? profile.brandName : t.ontProfileId;
            const statusBadge = t.isActive 
                ? '<span class="badge-status-active">Active</span>' 
                : '<span class="badge-status-inactive">Inactive</span>';

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="font-weight: 600;">${t.name} ${t.isDefaultGateway ? '<span class="badge badge-noc" style="font-size: 0.6rem !important; padding: 2px 6px;">Gateway</span>' : ''}</td>
                <td class="val-mono">${t.ipAddress}</td>
                <td>${profileName}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-action-sm btn-edit" onclick="editTarget('${t.id}')">Edit</button>
                        <button class="btn btn-secondary btn-action-sm btn-delete" onclick="deleteTarget('${t.id}')" ${t.isDefaultGateway ? 'disabled title="Cannot delete default gateway"' : ''}>Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("loadTargets error:", err);
    }
}

async function saveTarget(e) {
    e.preventDefault();
    const id = document.getElementById("target-id").value;
    const name = document.getElementById("target-name").value;
    const ipAddress = document.getElementById("target-ip").value;
    const ontProfileId = document.getElementById("target-profile").value;
    const isActive = document.getElementById("target-active").checked;

    const targetData = { name, ipAddress, ontProfileId, isActive };

    try {
        let res;
        if (id) {
            res = await fetch(`/api/targets/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(targetData)
            });
        } else {
            res = await fetch("/api/targets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(targetData)
            });
        }

        if (res.ok) {
            resetTargetForm();
            await loadTargets();
            if (id === currentRouterId || !currentRouterId) {
                await fetchInitialStatus();
            }
        } else {
            const errData = await res.json();
            alert(`Error: ${errData.message || "Failed to save target"}`);
        }
    } catch (err) {
        console.error("saveTarget error:", err);
    }
}

function editTarget(id) {
    const target = allTargets.find(t => t.id === id);
    if (!target) return;

    document.getElementById("target-id").value = target.id;
    document.getElementById("target-name").value = target.name;
    document.getElementById("target-ip").value = target.ipAddress;
    document.getElementById("target-profile").value = target.ontProfileId;
    document.getElementById("target-active").checked = target.isActive;
    
    document.getElementById("target-form-title").textContent = "Edit Monitoring Target";
    switchPanel('targets', document.getElementById('nav-targets'));
}

function resetTargetForm() {
    document.getElementById("target-id").value = "";
    document.getElementById("target-form").reset();
    document.getElementById("target-active").checked = true;
    document.getElementById("target-form-title").textContent = "Add Monitoring Target";
}

async function deleteTarget(id) {
    if (!confirm("Are you sure you want to delete this target? All metric history will be lost.")) return;

    try {
        const res = await fetch(`/api/targets/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (id === currentRouterId) {
                currentRouterId = "";
            }
            await loadTargets();
            await fetchInitialStatus();
        } else {
            const errData = await res.json();
            alert(`Error: ${errData.message}`);
        }
    } catch (err) {
        console.error("deleteTarget error:", err);
    }
}

// --- ONT PROFILES CRUD OPERATIONS ---
async function loadProfiles() {
    try {
        const res = await fetch("/api/ont-profiles");
        if (!res.ok) throw new Error("Gagal mengambil data profil.");
        allProfiles = await res.json();

        // Render Profiles Table
        const tbody = document.getElementById("profiles-table-body");
        tbody.innerHTML = "";
        allProfiles.forEach(p => {
            const isGeneric = p.id === "GENERIC";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="val-mono" style="font-weight: 600;">${p.id}</td>
                <td style="font-weight: 600;">${p.brandName}</td>
                <td>
                    <div class="oid-pill-list">
                        <span class="oid-pill"><strong>Status:</strong> ${p.oidPortStatus}</span>
                        <span class="oid-pill"><strong>Speed:</strong> ${p.oidPortSpeed}</span>
                        <span class="oid-pill"><strong>Errors:</strong> ${p.oidCrcErrors}</span>
                        <span class="oid-pill"><strong>GPON Rx:</strong> ${p.oidOpticalPower || 'Generic Fallback'}</span>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-action-sm btn-edit" onclick="editProfile('${p.id}')">Edit</button>
                        <button class="btn btn-secondary btn-action-sm btn-delete" onclick="deleteProfile('${p.id}')" ${isGeneric ? 'disabled title="Cannot delete generic profile"' : ''}>Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("loadProfiles error:", err);
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const id = document.getElementById("profile-id").value;
    const brandName = document.getElementById("profile-name").value;
    const oidPortStatus = document.getElementById("oid-status").value;
    const oidPortSpeed = document.getElementById("oid-speed").value;
    const oidCrcErrors = document.getElementById("oid-crc").value;
    const oidOpticalPower = document.getElementById("oid-opt-power").value;

    const profileData = { brandName, oidPortStatus, oidPortSpeed, oidCrcErrors, oidOpticalPower };

    try {
        let res;
        if (id) {
            res = await fetch(`/api/ont-profiles/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData)
            });
        } else {
            res = await fetch("/api/ont-profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData)
            });
        }

        if (res.ok) {
            resetProfileForm();
            await loadProfiles();
            await loadTargets(); 
        } else {
            const errData = await res.json();
            alert(`Error: ${errData.message || "Failed to save ONT profile"}`);
        }
    } catch (err) {
        console.error("saveProfile error:", err);
    }
}

function editProfile(id) {
    const profile = allProfiles.find(p => p.id === id);
    if (!profile) return;

    document.getElementById("profile-id").value = profile.id;
    document.getElementById("profile-name").value = profile.brandName;
    document.getElementById("oid-status").value = profile.oidPortStatus;
    document.getElementById("oid-speed").value = profile.oidPortSpeed;
    document.getElementById("oid-crc").value = profile.oidCrcErrors;
    document.getElementById("oid-opt-power").value = profile.oidOpticalPower || "";

    document.getElementById("profile-form-title").textContent = "Edit ONT Profile";
    switchPanel('profiles', document.getElementById('nav-profiles'));

    if (id === "GENERIC") {
        document.getElementById("profile-name").readOnly = true;
    } else {
        document.getElementById("profile-name").readOnly = false;
    }
}

function resetProfileForm() {
    document.getElementById("profile-id").value = "";
    document.getElementById("profile-form").reset();
    document.getElementById("profile-name").readOnly = false;
    document.getElementById("profile-form-title").textContent = "Add ONT Profile";
}

async function deleteProfile(id) {
    if (!confirm("Are you sure you want to delete this ONT Profile? Any router targets using it will revert to Generic MIB-II.")) return;

    try {
        const res = await fetch(`/api/ont-profiles/${id}`, { method: "DELETE" });
        if (res.ok) {
            await loadProfiles();
            await loadTargets();
        } else {
            const errData = await res.json();
            alert(`Error: ${errData.message}`);
        }
    } catch (err) {
        console.error("deleteProfile error:", err);
    }
}

// --- SPEED TEST HUB FRONTEND CONTROLLER ---
async function startSpeedTest() {
    const btn = document.getElementById("btn-run-speedtest");
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-spin" style="margin-right: 8px; animation: spin 1s linear infinite;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Testing...`;

    // Clear previous results & logs
    document.getElementById("speedtest-ping").innerHTML = `0.0 <span class="unit">ms</span>`;
    document.getElementById("speedtest-download").innerHTML = `0.0 <span class="unit">Mbps</span>`;
    document.getElementById("speedtest-upload").innerHTML = `0.0 <span class="unit">Mbps</span>`;
    document.getElementById("speedometer-value").textContent = "0.0";
    
    const fill = document.getElementById("speedometer-fill");
    if (fill) {
        fill.style.strokeDashoffset = "534";
        fill.className.baseVal = "speed-fill";
    }

    const iconContainer = document.getElementById("speedometer-icon-container");
    if (iconContainer) {
        iconContainer.className = "speedometer-icon-wrapper";
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    }
    
    document.getElementById("speedometer-stage-label").textContent = "INIT";
    document.getElementById("speedometer-unit-label").textContent = "Mbps";
    
    const logsList = document.getElementById("speedtest-logs-list");
    if (logsList) {
        logsList.innerHTML = `<div class="log-item"><div class="log-header"><span>Initializing</span><span class="log-time">${new Date().toLocaleTimeString("id-ID")}</span></div><div class="log-desc">Contacting local diagnostics hub...</div></div>`;
    }
    
    document.getElementById("speedtest-status-badge").textContent = "Testing";
    document.getElementById("speedtest-status-badge").className = "badge status-warning";
    document.getElementById("speedtest-progress-percent").textContent = "0%";

    try {
        const res = await fetch("/api/speedtest/run", { method: "POST" });
        if (res.status === 409) {
            addSpeedTestLog("Warning", "Speed test is already running on the server.");
            btn.disabled = false;
            btn.innerHTML = `Start Speed Test`;
            return;
        }
        if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
        }
    } catch (err) {
        console.error("Gagal memulai speed test:", err);
        addSpeedTestLog("Critical", `Connection error: ${err.message}`);
        btn.disabled = false;
        btn.innerHTML = `Start Speed Test`;
        
        document.getElementById("speedtest-status-badge").textContent = "Failed";
        document.getElementById("speedtest-status-badge").className = "badge status-danger";
    }
}

function updateSpeedTestProgress(progress) {
    const stage = progress.stage; // latency, download, upload, completed, failed
    const percent = progress.percent;
    const downloadMbps = progress.downloadMbps;
    const uploadMbps = progress.uploadMbps;
    const pingMs = progress.pingMs;
    const statusText = progress.statusText;

    // Update progress percent
    const percentEl = document.getElementById("speedtest-progress-percent");
    if (percentEl) percentEl.textContent = `${percent}%`;

    // Update logs
    if (statusText) {
        let severity = "Info";
        if (stage === "failed") severity = "Critical";
        else if (stage === "completed") severity = "Success";
        addSpeedTestLog(severity, statusText);
    }

    // Update result cards
    if (pingMs > 0) {
        document.getElementById("speedtest-ping").innerHTML = `${pingMs.toFixed(1)} <span class="unit">ms</span>`;
    }
    if (downloadMbps > 0) {
        document.getElementById("speedtest-download").innerHTML = `${downloadMbps.toFixed(1)} <span class="unit">Mbps</span>`;
    }
    if (uploadMbps > 0) {
        document.getElementById("speedtest-upload").innerHTML = `${uploadMbps.toFixed(1)} <span class="unit">Mbps</span>`;
    }

    // Update speedometer dial
    let activeSpeed = 0;
    let unit = "Mbps";
    
    if (stage === "latency") {
        activeSpeed = pingMs;
        unit = "ms";
    } else if (stage === "download") {
        activeSpeed = downloadMbps;
        unit = "Mbps";
    } else if (stage === "upload") {
        activeSpeed = uploadMbps;
        unit = "Mbps";
    } else if (stage === "completed") {
        activeSpeed = downloadMbps;
        unit = "Mbps";
    }

    const valueEl = document.getElementById("speedometer-value");
    if (valueEl) {
        valueEl.textContent = activeSpeed.toFixed(1);
    }
    
    const unitEl = document.getElementById("speedometer-unit-label");
    if (unitEl) {
        unitEl.textContent = unit;
    }

    // Stage text label
    const stageLabel = document.getElementById("speedometer-stage-label");
    if (stageLabel) {
        stageLabel.textContent = stage === "completed" ? "FINISHED" : stage.toUpperCase();
    }

    // Dynamic icon selection
    const iconContainer = document.getElementById("speedometer-icon-container");
    if (iconContainer) {
        let iconHtml = "";
        let pulseClass = "speedometer-icon-wrapper";
        
        if (stage === "latency") {
            pulseClass = "speedometer-icon-wrapper pulse-glow";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
        } else if (stage === "download") {
            pulseClass = "speedometer-icon-wrapper pulse-glow";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;
        } else if (stage === "upload") {
            pulseClass = "speedometer-icon-wrapper pulse-glow";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
        } else if (stage === "completed") {
            pulseClass = "speedometer-icon-wrapper";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else if (stage === "failed") {
            pulseClass = "speedometer-icon-wrapper";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        }
        
        iconContainer.className = pulseClass;
        if (iconHtml) iconContainer.innerHTML = iconHtml;
    }

    // Scale calculation: up to 100 Mbps or dynamic range matching high speed plans
    let maxVal = 100;
    if (stage === "latency") maxVal = 200; // latency scale maxes at 200ms
    else if (activeSpeed > 100) maxVal = Math.ceil(activeSpeed / 100) * 100;
    
    // Update speedometer fill ring
    const fill = document.getElementById("speedometer-fill");
    if (fill) {
        let offset = 534 - Math.min(activeSpeed / maxVal, 1) * 534;
        fill.style.strokeDashoffset = offset;
        
        // Color transition
        if (stage === "latency") {
            fill.className.baseVal = "speed-fill speed-medium";
        } else {
            if (activeSpeed < 10) {
                fill.className.baseVal = "speed-fill speed-low";
            } else if (activeSpeed < 50) {
                fill.className.baseVal = "speed-fill speed-medium";
            } else {
                fill.className.baseVal = "speed-fill speed-high";
            }
        }
    }

    // Update overall status badge
    const badge = document.getElementById("speedtest-status-badge");
    if (badge) {
        if (stage === "completed") {
            badge.textContent = "Completed";
            badge.className = "badge status-success";
            
            const btn = document.getElementById("btn-run-speedtest");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `Start Speed Test`;
            }
        } else if (stage === "failed") {
            badge.textContent = "Failed";
            badge.className = "badge status-danger";
            
            const btn = document.getElementById("btn-run-speedtest");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `Start Speed Test`;
            }
        } else {
            badge.textContent = stage.toUpperCase();
            badge.className = "badge status-warning";
        }
    }
}

function addSpeedTestLog(severity, description) {
    const logsList = document.getElementById("speedtest-logs-list");
    if (!logsList) return;

    // Clear empty logs state
    const emptyEl = logsList.querySelector(".empty-logs");
    if (emptyEl) emptyEl.remove();

    // Avoid duplicate status logs
    const lastItem = logsList.lastElementChild;
    if (lastItem && lastItem.querySelector(".log-desc").textContent === description) {
        return;
    }

    const item = document.createElement("div");
    let sevClass = "";
    if (severity === "Warning") sevClass = "severity-warning";
    else if (severity === "Critical") sevClass = "severity-critical";
    else if (severity === "Success") sevClass = "severity-success";

    item.className = `log-item ${sevClass}`;
    
    if (severity === "Success") {
        item.style.borderLeftColor = "var(--color-success)";
        item.style.background = "var(--color-success-glow)";
    }

    const timeStr = new Date().toLocaleTimeString("id-ID");
    item.innerHTML = `
        <div class="log-header">
            <span>${severity}</span>
            <span class="log-time">${timeStr}</span>
        </div>
        <div class="log-desc">${description}</div>
    `;
    logsList.appendChild(item);
    
    // Auto-scroll logs container to bottom
    logsList.scrollTop = logsList.scrollHeight;
}
