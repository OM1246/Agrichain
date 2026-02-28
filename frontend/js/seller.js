// ─────────────────────────────────────────────
//  Seller Portal Logic  (₹ INR · localStorage)
// ─────────────────────────────────────────────

const STORAGE_KEY = 'agrichain_listings';
let currentFilter = 'all';

function getListings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

function saveListings(listings) {
    const trySet = (data) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
        catch { return false; }
    };
    if (!trySet(listings)) {
        const stripped = listings.map(l => ({ ...l }));
        for (let i = 0; i < stripped.length; i++) {
            stripped[i].image = '';
            if (trySet(stripped)) return;
        }
    }
}

// ── Toast ─────────────────────────────────────
function toast(msg, isError = false) {
    const c = document.getElementById('toast');
    if (!c) { alert(msg); return; }
    const el = document.createElement('div');
    el.className = 'toast-item' + (isError ? ' error' : '');
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3300);
}

// ── Listing Type toggle ───────────────────────
function handleListingType(val) {
    const buyGroup  = document.getElementById('buyPriceGroup');
    const rentGroup = document.getElementById('rentPriceGroup');
    const buyInput  = document.getElementById('prodBuyPrice');
    const rentInput = document.getElementById('prodRentPrice');
    if (!buyGroup || !rentGroup) return;
    buyGroup.style.display  = (val === 'buy'  || val === 'both') ? 'block' : 'none';
    rentGroup.style.display = (val === 'rent' || val === 'both') ? 'block' : 'none';
    if (buyInput)  buyInput.required  = (val === 'buy'  || val === 'both');
    if (rentInput) rentInput.required = (val === 'rent' || val === 'both');
}
window.handleListingType = handleListingType;

// ── Init Form ──
document.addEventListener('DOMContentLoaded', () => {
    const form      = document.getElementById('listingForm');
    const submitBtn = document.getElementById('submitBtn');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const val = (id) => (document.getElementById(id)?.value ?? '').trim();
        const name        = val('prodName');
        const desc        = val('prodDesc');
        const age         = val('prodAge');
        const listingType = val('listingType');
        const imageFile   = document.getElementById('prodImage')?.files?.[0];

        if (!name || !desc || !age || !listingType || !imageFile) {
            toast('⚠️ Please fill all required fields.', true);
            return;
        }

        let buyPrice  = null;
        let rentPrice = null;

        if (listingType === 'buy' || listingType === 'both') {
            buyPrice = parseFloat(document.getElementById('prodBuyPrice')?.value);
            if (isNaN(buyPrice) || buyPrice < 0) { toast('⚠️ Enter buy price.', true); return; }
        }
        if (listingType === 'rent' || listingType === 'both') {
            rentPrice = parseFloat(document.getElementById('prodRentPrice')?.value);
            if (isNaN(rentPrice) || rentPrice < 0) { toast('⚠️ Enter rent price.', true); return; }
        }

        if (submitBtn) { submitBtn.textContent = '⏳ Saving…'; submitBtn.disabled = true; }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const MAX_W = 200, MAX_H = 150;
                let w = img.width, h = img.height;
                if (w > MAX_W || h > MAX_H) {
                    const r = Math.min(MAX_W / w, MAX_H / h);
                    w = Math.round(w * r); h = Math.round(h * r);
                }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

                const listing = {
                    id: Date.now(),
                    name, desc, age, listingType,
                    buyPrice, rentPrice,
                    image: dataUrl,
                    status: 'listed',
                    revenue: 0,
                    listedAt: new Date().toISOString(),
                    deleted: false // Soft delete flag
                };

                const all = getListings();
                all.push(listing);
                saveListings(all);

                window.dispatchEvent(new Event('agrichain:newListing'));
                renderAnalytics();
                renderCharts();
                renderManagementList();

                form.reset();
                handleListingType('');
                document.getElementById('imagePreview').style.display = 'none';

                if (submitBtn) { submitBtn.textContent = '📝 Confirm Listing'; submitBtn.disabled = false; }
                toast(`✅ "${name}" listed!`);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(imageFile);
    });
});

// ── Management Actions ────────────────────────
window.deleteListing = (id) => {
    if (!confirm('Are you sure you want to delete this listing from the marketplace?')) return;
    const all = getListings();
    const idx = all.findIndex(l => String(l.id) === String(id));
    if (idx > -1) {
        all[idx].deleted = true;
        saveListings(all);
        renderManagementList();
        renderAnalytics();
        window.dispatchEvent(new Event('agrichain:newListing'));
        toast('🗑️ Listing deleted.');
    }
};

window.restoreListing = (id) => {
    const all = getListings();
    const idx = all.findIndex(l => String(l.id) === String(id));
    if (idx > -1) {
        all[idx].deleted = false;
        saveListings(all);
        renderManagementList();
        renderAnalytics();
        window.dispatchEvent(new Event('agrichain:newListing'));
        toast('♻️ Listing restored!');
    }
};

window.addEventListener('seller:filterManage', (e) => {
    currentFilter = e.detail;
    renderManagementList();
});

window.addEventListener('seller:refreshAnalytics', () => {
    renderAnalytics();
    renderCharts();
});

// ── Rendering ─────────────────────────────────
function renderManagementList() {
    const listings = getListings();
    const container = document.getElementById('productList');
    if (!container) return;

    let filtered = listings;
    if (currentFilter === 'active') filtered = listings.filter(l => !l.deleted);
    if (currentFilter === 'deleted') filtered = listings.filter(l => l.deleted);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color:var(--gray-dim);text-align:center;padding:3rem;">No products found for this filter.</p>`;
        return;
    }

    container.innerHTML = filtered.slice().reverse().map(l => `
        <div class="product-row" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--border); background: ${l.deleted ? 'rgba(255,0,0,0.02)' : 'transparent'}">
            <div style="display:flex;align-items:center;gap:12px;">
                ${l.image
                    ? `<img src="${l.image}" alt="${l.name}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid var(--border); opacity: ${l.deleted ? 0.5 : 1}">`
                    : `<div style="width:44px;height:44px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;">📦</div>`
                }
                <div>
                    <p style="color:#fff;font-weight:600;font-size:0.9rem;margin:0; opacity: ${l.deleted ? 0.6 : 1}">${l.name}</p>
                    <p style="color:var(--gray-dim);font-size:0.78rem;margin:0;">${l.deleted ? '❌ DELETED' : '✅ LIVE'} &nbsp;|&nbsp; ${buildPriceInfo(l)}</p>
                </div>
            </div>
            <div>
                ${l.deleted 
                    ? `<button class="btn-outline" style="padding:4px 12px; font-size: 0.75rem; border-color: var(--violet);" onclick="restoreListing('${l.id}')">Restore</button>`
                    : `<button class="btn-outline" style="padding:4px 12px; font-size: 0.75rem; border-color: #ff4d4d; color: #ff4d4d;" onclick="deleteListing('${l.id}')">Delete</button>`
                }
            </div>
        </div>`).join('');
}

function renderAnalytics() {
    const listings = getListings().filter(l => !l.deleted);
    const total  = listings.length;
    const sold   = listings.filter(l => l.status === 'sold').length;
    const rented = listings.filter(l => l.status === 'rented').length;

    const now   = Date.now();
    const DAY   = 86_400_000;
    const WEEK  = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR  = 365 * DAY;

    const rev = (ms) => listings
        .filter(l => (now - new Date(l.listedAt).getTime()) <= ms)
        .reduce((s, l) => s + (l.revenue || 0), 0)
        .toFixed(2);

    setText('anTotal',  total);
    setText('anSold',   sold);
    setText('anRented', rented);
    setText('revDay',   '₹' + rev(DAY));
    setText('revWeek',  '₹' + rev(WEEK));
    setText('revMonth', '₹' + rev(MONTH));
    setText('revYear',  '₹' + rev(YEAR));
}

function renderCharts() {
    if (typeof Chart === 'undefined') return;
    const listings = getListings().filter(l => !l.deleted);
    const now   = Date.now();
    const DAY   = 86_400_000;
    const WEEK  = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR  = 365 * DAY;

    // Helper for Revenue
    const rev = (ms) => listings
        .filter(l => (now - new Date(l.listedAt).getTime()) <= ms)
        .reduce((s, l) => s + (l.revenue || 0), 0);

    // 1. Revenue Chart
    const ctxR = document.getElementById('chartRevenue');
    if (ctxR) {
        if (window.chartRevenue) window.chartRevenue.destroy();
        window.chartRevenue = new Chart(ctxR, {
            type: 'bar',
            data: {
                labels: ['Today', 'Week', 'Month', 'Year'],
                datasets: [{ 
                    data: [rev(DAY), rev(WEEK), rev(MONTH), rev(YEAR)],
                    backgroundColor: [
                        'rgba(0,230,118,0.2)', 
                        'rgba(0,230,118,0.4)', 
                        'rgba(0,230,118,0.6)',
                        'rgba(0,230,118,0.8)'
                    ],
                    borderColor: 'rgba(0,230,118,0.9)',
                    borderWidth: 2, borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#8a9bb0', font: { size: 10 } }, grid: { display:false } },
                    y: { 
                        beginAtZero: true,
                        ticks: { color: '#8a9bb0', font: { size: 10 }, callback: v => '₹' + v }, 
                        grid: { color: 'rgba(255,255,255,0.05)' } 
                    }
                }
            }
        });
    }
}

// ── Helpers ──
function buildPriceInfo(l) {
    const p = [];
    if (l.listingType === 'buy'  || l.listingType === 'both') p.push(`₹${l.buyPrice}`);
    if (l.listingType === 'rent' || l.listingType === 'both') p.push(`₹${l.rentPrice}/d`);
    return p.join(' | ');
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Auth & Identity ──
window.handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerData');
    window.location.href = 'seller-auth.html';
};

window.switchTab = (tab) => {
    const tabs = ['list', 'analytics', 'renting', 'selling'];
    tabs.forEach(t => {
        let btnId = 'tab' + t.charAt(0).toUpperCase() + t.slice(1) + 'Btn';
        if (t === 'analytics') btnId = 'tabAnalyticsBtn';
        if (t === 'list') btnId = 'tabListBtn';
        
        const btn = document.getElementById(btnId);
        const panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));
        
        if (btn) btn.classList.toggle('active', t === tab);
        if (panel) panel.classList.toggle('active', t === tab);
    });

    if (tab === 'analytics') {
        renderAnalytics();
        renderCharts();
    }
    if (tab === 'renting') renderRentingList();
    if (tab === 'selling') renderSellingList();
};

function renderSellingList() {
    const purchases = JSON.parse(localStorage.getItem('agrichain_purchases') || '[]');
    const body = document.getElementById('sellingListBody');
    const noData = document.getElementById('noSellingData');
    if (!body) return;

    // Filter only buys
    const sales = purchases.filter(p => p.action === 'buy');

    if (sales.length === 0) {
        body.innerHTML = '';
        if (noData) noData.classList.remove('hidden');
        return;
    }

    if (noData) noData.classList.add('hidden');
    
    body.innerHTML = sales.slice().reverse().map(s => {
        const qty = s.quantity || 1;
        const perQty = (s.price / qty).toFixed(2);
        const dateStr = s.at ? new Date(s.at).toLocaleDateString() : 'N/A';
        
        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px; color:#fff;">${s.farmerName}</td>
                <td style="padding: 12px; color:#fff;">${s.name}</td>
                <td style="padding: 12px; font-family: monospace; color:var(--violet);">${s.orderId}</td>
                <td style="padding: 12px; color:var(--gray-dim); font-size: 0.85rem;">${dateStr}</td>
                <td style="padding: 12px; color:var(--gray-dim); font-size: 0.85rem;">${dateStr}</td>
                <td style="padding: 12px; color:#fff;">₹${perQty}</td>
                <td style="padding: 12px; color:#fff;">${qty}</td>
                <td style="padding: 12px; color:var(--emerald); font-weight:700;">₹${s.price.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}function renderRentingList() {
    const purchases = JSON.parse(localStorage.getItem('agrichain_purchases') || '[]');
    const body = document.getElementById('rentingListBody');
    const noData = document.getElementById('noRentingData');
    if (!body) return;

    // Filter only rentals
    const rentals = purchases.filter(p => p.action === 'rent');

    if (rentals.length === 0) {
        body.innerHTML = '';
        if (noData) noData.classList.remove('hidden');
        return;
    }

    if (noData) noData.classList.add('hidden');
    
    const now = new Date();

    body.innerHTML = rentals.slice().reverse().map(r => {
        const endDate = new Date(r.rentEnd);
        const isUsing = now < endDate;
        const statusText = isUsing ? '<span style="color:var(--emerald);">✅ Using</span>' : '<span style="color:var(--gray-dim);">⌛ Ended</span>';
        const perDay = (r.price / r.rentDays).toFixed(2);
        
        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px; color:#fff;">${r.farmerName}</td>
                <td style="padding: 12px; color:#fff;">${r.name}</td>
                <td style="padding: 12px; color:#fff;">${r.rentDays} days</td>
                <td style="padding: 12px; color:var(--gray-dim); font-size: 0.85rem;">${new Date(r.rentStart).toLocaleDateString()}</td>
                <td style="padding: 12px; color:var(--gray-dim); font-size: 0.85rem;">${new Date(r.rentEnd).toLocaleDateString()}</td>
                <td style="padding: 12px; color:#fff;">₹${perDay}</td>
                <td style="padding: 12px; color:var(--emerald); font-weight:700;">₹${r.price}</td>
                <td style="padding: 12px; font-weight:600;">${statusText}</td>
                <td style="padding: 12px; font-family: monospace; color:var(--violet);">${r.orderId}</td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // Show Seller Identity
    const sellerData = JSON.parse(localStorage.getItem('sellerData') || 'null');
    if (sellerData) {
        setText('sellerBusinessName', sellerData.businessName);
        const identityEl = document.getElementById('sellerIdentity');
        if (identityEl) identityEl.style.display = 'flex';
    }

    renderAnalytics();
    renderManagementList();
    setTimeout(renderCharts, 200);
});
