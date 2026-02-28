// ─────────────────────────────────────────────
//  Admin Portal Logic - Approvals & Analytics
// ─────────────────────────────────────────────

const SELLER_KEY = 'agrichain_listings';
const PURCHASE_KEY = 'agrichain_purchases';

function getListings() {
    try { return JSON.parse(localStorage.getItem(SELLER_KEY)) || []; } catch { return []; }
}

function saveListings(l) {
    try { localStorage.setItem(SELLER_KEY, JSON.stringify(l)); } catch { console.warn('Storage error'); }
}

function getPurchases() {
    try { return JSON.parse(localStorage.getItem(PURCHASE_KEY)) || []; } catch { return []; }
}

// ── Toast ─────────────────────────────────────
function toast(msg) {
    const c = document.getElementById('toast');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3300);
}

// ── Tab Navigation ────────────────────────────
window.switchAdminTab = (tab) => {
    ['pending', 'accepted', 'declined', 'analytics'].forEach(t => {
        const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        const panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));
        
        if (t === tab) {
            if (btn) btn.classList.add('active');
            if (panel) panel.classList.remove('hidden');
        } else {
            if (btn) btn.classList.remove('active');
            if (panel) panel.classList.add('hidden');
        }
    });

    if (tab === 'analytics') {
        loadAnalytics();
    } else {
        loadApprovals();
    }
};

// ── Load Approvals & Lists ────────────────────
function loadApprovals() {
    const allListings = getListings();
    
    // Grids
    const gridPending = document.getElementById('approvalsGrid');
    const gridAccepted = document.getElementById('acceptedGrid');
    const gridDeclined = document.getElementById('declinedGrid');
    
    // Empty states
    const noPending = document.getElementById('noApprovals');
    const noAccepted = document.getElementById('noAccepted');
    const noDeclined = document.getElementById('noDeclined');
    
    // Clear Grids
    if (gridPending) gridPending.innerHTML = '';
    if (gridAccepted) gridAccepted.innerHTML = '';
    if (gridDeclined) gridDeclined.innerHTML = '';

    // Filter Logic
    const pendingListings = allListings.filter(l => l.status === 'listed' && !l.deleted && l.adminStatus !== 'accepted');
    const acceptedListings = allListings.filter(l => l.adminStatus === 'accepted' && !l.deleted);
    const declinedListings = allListings.filter(l => l.deleted === true && l.adminStatus === 'declined'); // We mark declined specifically now

    // Render Pending
    if (gridPending) {
        if (pendingListings.length === 0) {
            gridPending.classList.add('hidden');
            if (noPending) noPending.classList.remove('hidden');
        } else {
            gridPending.classList.remove('hidden');
            if (noPending) noPending.classList.add('hidden');
            pendingListings.forEach(l => renderCard(l, gridPending, 'pending'));
        }
    }

    // Render Accepted
    if (gridAccepted) {
        if (acceptedListings.length === 0) {
            gridAccepted.classList.add('hidden');
            if (noAccepted) noAccepted.classList.remove('hidden');
        } else {
            gridAccepted.classList.remove('hidden');
            if (noAccepted) noAccepted.classList.add('hidden');
            acceptedListings.forEach(l => renderCard(l, gridAccepted, 'accepted'));
        }
    }

    // Render Declined
    if (gridDeclined) {
        if (declinedListings.length === 0) {
            gridDeclined.classList.add('hidden');
            if (noDeclined) noDeclined.classList.remove('hidden');
        } else {
            gridDeclined.classList.remove('hidden');
            if (noDeclined) noDeclined.classList.add('hidden');
            declinedListings.forEach(l => renderCard(l, gridDeclined, 'declined'));
        }
    }
}

function renderCard(l, container, type) {
    const card = document.createElement('div');
    card.className = 'product-card-v2 animate-up';
    
    let priceBadges = '';
    if (l.listingType === 'buy' || l.listingType === 'both') {
        priceBadges += `<span class="badge-v2 badge-buy">🛒 Buy ₹${l.buyPrice}</span>`;
    }
    if (l.listingType === 'rent' || l.listingType === 'both') {
        priceBadges += `<span class="badge-v2 badge-rent">📅 Rent ₹${l.rentPrice}/day</span>`;
    }
    
    const imgHtml = l.image 
        ? `<img src="${l.image}" alt="${l.name}" class="product-card-image">`
        : `<div style="width:100%;height:180px;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:3rem;border-bottom:1px solid var(--border);">📦</div>`;
        
    let actionHtml = '';
    if (type === 'pending') {
        actionHtml = `
            <div style="display:flex;gap:10px;width:100%;">
                <button class="btn-primary" style="flex:1;padding:8px;font-size:0.8rem;background:var(--emerald);color:#000;" onclick="handleApproval('${l.id}', 'accept')">✅ Accept</button>
                <button class="btn-outline" style="flex:1;padding:8px;font-size:0.8rem;border-color:var(--rose);color:var(--rose);" onclick="handleApproval('${l.id}', 'decline')">❌ Decline</button>
            </div>`;
    } else if (type === 'accepted') {
        actionHtml = `
            <div style="display:flex;gap:10px;width:100%;">
                <button class="btn-outline" style="flex:1;padding:8px;font-size:0.8rem;border-color:var(--rose);color:var(--rose);" onclick="handleApproval('${l.id}', 'decline')">❌ Revoke & Decline</button>
            </div>`;
    } else if (type === 'declined') {
        actionHtml = `
            <div style="display:flex;gap:10px;width:100%;">
                <div style="flex:1;text-align:center;padding:8px;font-size:0.8rem;color:var(--gray-dim);background:var(--bg-2);border-radius:var(--r-md);">❌ Declined</div>
            </div>`;
    }

    card.innerHTML = `
        ${imgHtml}
        <div class="product-card-content">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                <h3 class="product-card-title">${l.name}</h3>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:1rem;">${priceBadges}</div>
            <p class="product-card-desc">${l.desc}</p>
            <div style="display:flex;align-items:center;gap:6px;color:var(--gray-dim);font-size:0.75rem;font-weight:600;">
                <span>Seller ID: ${l.id}</span>
            </div>
        </div>
        <div class="product-card-footer">
            ${actionHtml}
        </div>
    `;
    container.appendChild(card);
}

window.handleApproval = (id, action) => {
    const listings = getListings();
    const idx = listings.findIndex(l => String(l.id) === String(id));
    
    if (idx === -1) {
        toast('❌ Listing not found.');
        return;
    }
    
    if (action === 'accept') {
        listings[idx].adminStatus = 'accepted';
        listings[idx].deleted = false;
        toast('✅ Product approved and visible on market.');
    } else if (action === 'decline') {
        listings[idx].adminStatus = 'declined';
        listings[idx].deleted = true; 
        toast('❌ Product declined.');
    }
    
    saveListings(listings);
    loadApprovals();
};

// ── Analytics Logic ───────────────────────────
let adminChartInstance;

function loadAnalytics() {
    const purchases = getPurchases();
    const now = new Date();
    const timeframeSelect = document.getElementById('analyticsTimeframe');
    const timeframe = timeframeSelect ? timeframeSelect.value : 'weekly';
    
    let dailyRentals = 0;
    let dailySold = 0;
    let weeklyTx = 0;
    let monthlyTx = 0;
    
    // Config based on timeframe
    let chartData = [];
    let chartLabels = [];
    let titleStr = '';
    
    if (timeframe === 'weekly') {
        titleStr = 'Transaction Volume (Last 7 Days)';
        chartData = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                label: d.toLocaleDateString('en-US', { weekday: 'short', month:'short', day:'numeric' }),
                rent: 0, buy: 0, date: d
            };
        });
    } else if (timeframe === 'monthly') {
        titleStr = 'Transaction Volume (Last 30 Days)';
        chartData = Array(4).fill(0).map((_, i) => {
            return {
                label: `Week ${i + 1}`,
                rent: 0, buy: 0,
                startOffset: (3 - i) * 7 + 6,
                endOffset: (3 - i) * 7
            };
        });
    } else if (timeframe === 'yearly') {
        titleStr = 'Transaction Volume (Last 12 Months)';
        chartData = Array(12).fill(0).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return {
                label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                rent: 0, buy: 0, month: d.getMonth(), year: d.getFullYear()
            };
        });
    }

    // Process Purchases
    purchases.forEach(p => {
        if (!p.at) return;
        const txDate = new Date(p.at);
        const timeDiff = now.getTime() - txDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        // General Stats
        if (daysDiff === 0) {
            if (p.action === 'rent') dailyRentals++;
            if (p.action === 'buy') dailySold++;
        }
        if (daysDiff < 7) weeklyTx++;
        if (daysDiff < 30) monthlyTx++;
        
        // Chart mapping
        if (timeframe === 'weekly') {
            if (daysDiff < 7) {
                const bucketIndex = 6 - daysDiff;
                if(bucketIndex >= 0 && bucketIndex <= 6) {
                    if(p.action === 'rent') chartData[bucketIndex].rent++;
                    if(p.action === 'buy') chartData[bucketIndex].buy++;
                }
            }
        } 
        else if (timeframe === 'monthly') {
            if (daysDiff < 28) { // 4 weeks
                const bucketIndex = 3 - Math.floor(daysDiff / 7);
                if (bucketIndex >= 0 && bucketIndex <= 3) {
                    if(p.action === 'rent') chartData[bucketIndex].rent++;
                    if(p.action === 'buy') chartData[bucketIndex].buy++;
                }
            }
        }
        else if (timeframe === 'yearly') {
            const m = txDate.getMonth();
            const y = txDate.getFullYear();
            // Find bucket
            const bucket = chartData.find(b => b.month === m && b.year === y);
            if (bucket) {
                if(p.action === 'rent') bucket.rent++;
                if(p.action === 'buy') bucket.buy++;
            }
        }
    });

    document.getElementById('statDailyRentals').textContent = dailyRentals;
    document.getElementById('statDailySold').textContent = dailySold;
    document.getElementById('statWeeklyTx').textContent = weeklyTx;
    document.getElementById('statMonthlyTx').textContent = monthlyTx;
    
    // Update Chart Title
    const chartTitleContainer = document.getElementById('adminAnalyticsChart').closest('.glass-card');
    if (chartTitleContainer) {
        const titleEl = chartTitleContainer.querySelector('h3');
        if (titleEl) titleEl.textContent = titleStr;
    }

    // Render Chart
    const ctx = document.getElementById('adminAnalyticsChart');
    if (!ctx) return;

    if (adminChartInstance) adminChartInstance.destroy();

    adminChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [
                {
                    label: 'Products Sold',
                    data: chartData.map(d => d.buy),
                    backgroundColor: '#00E5A0',
                    borderRadius: 4
                },
                {
                    label: 'Products Rented',
                    data: chartData.map(d => d.rent),
                    backgroundColor: '#3D9EFF',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.7)' } }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display:false },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1 }
                }
            }
        }
    });
}

// ── Download CSV ──────────────────────────────
window.downloadAnalyticsJSON = () => {
    // We will download a CSV instead for better spreadsheet readability
    const purchases = getPurchases();
    if (purchases.length === 0) {
        toast("No transaction data to download.");
        return;
    }
    
    const headers = ['Order ID', 'Product', 'Action', 'Price', 'Quantity', 'Rent Days', 'Date', 'Farmer Name'];
    const rows = purchases.map(p => {
        return [
            p.orderId || 'N/A',
            `"${p.name || ''}"`,
            p.action || 'N/A',
            p.price || 0,
            p.quantity || 1,
            p.rentDays || 0,
            p.at || 'N/A',
            `"${p.farmerName || 'Unknown'}"`
        ].join(',');
    });
    
    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agrichain_analytics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast("✅ Download started");
};

document.addEventListener('DOMContentLoaded', () => {
    loadApprovals();
});

window.addEventListener('storage', (e) => {
    if (e.key === SELLER_KEY) loadApprovals();
    if (e.key === PURCHASE_KEY && document.getElementById('panelAnalytics') && !document.getElementById('panelAnalytics').classList.contains('hidden')) {
        loadAnalytics();
    }
});

// ── Auth Handling ─────────────────────────────
window.handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-auth.html';
};
