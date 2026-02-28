// ─────────────────────────────────────────────
//  Farmer Portal Logic
// ─────────────────────────────────────────────

const SELLER_KEY   = 'agrichain_listings';
const PURCHASE_KEY = 'agrichain_purchases';

function getListings()    { try { return JSON.parse(localStorage.getItem(SELLER_KEY))   || []; } catch { return []; } }
function getPurchases()   { try { return JSON.parse(localStorage.getItem(PURCHASE_KEY)) || []; } catch { return []; } }
function savePurchases(p) { try { localStorage.setItem(PURCHASE_KEY, JSON.stringify(p)); } catch { console.warn('Purchase storage full'); } }

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

// ── Marketplace ───────────────────────────────
let currentMarketFilter = 'all';

window.setMarketFilter = (filter) => {
    currentMarketFilter = filter;
    
    // Update tabs UI
    document.getElementById('filterAll').classList.remove('active');
    document.getElementById('filterBuy').classList.remove('active');
    document.getElementById('filterRent').classList.remove('active');
    
    if (filter === 'all') document.getElementById('filterAll').classList.add('active');
    else if (filter === 'buy') document.getElementById('filterBuy').classList.add('active');
    else if (filter === 'rent') document.getElementById('filterRent').classList.add('active');
    
    filterMarketplace();
};

window.filterMarketplace = () => {
    loadMarketplace();
};

function loadMarketplace() {
    const marketGrid   = document.getElementById('marketGrid');
    const marketLoader = document.getElementById('marketLoader');
    const noProducts   = document.getElementById('noProducts');
    const searchInput  = document.getElementById('marketSearchInput');
    const sortSelect   = document.getElementById('marketSortSelect');

    if (!marketGrid) return;

    if (marketLoader) marketLoader.style.display = 'none';
    marketGrid.innerHTML = '';
    if (noProducts) noProducts.classList.add('hidden');
    marketGrid.classList.remove('hidden');

    let listings = getListings().filter(l => l.status === 'listed' && !l.deleted && l.adminStatus === 'accepted');

    // Apply Filter
    if (currentMarketFilter === 'buy') {
        listings = listings.filter(l => l.listingType === 'buy' || l.listingType === 'both');
    } else if (currentMarketFilter === 'rent') {
        listings = listings.filter(l => l.listingType === 'rent' || l.listingType === 'both');
    }

    // Apply Search
    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase();
        listings = listings.filter(l => l.name.toLowerCase().includes(query) || (l.desc && l.desc.toLowerCase().includes(query)));
    }

    // Apply Sorting
    if (sortSelect) {
        const sortVal = sortSelect.value;
        if (sortVal === 'low-high') {
            listings.sort((a, b) => {
                const priceA = (a.listingType === 'rent' && currentMarketFilter === 'rent') ? a.rentPrice : a.buyPrice || a.rentPrice;
                const priceB = (b.listingType === 'rent' && currentMarketFilter === 'rent') ? b.rentPrice : b.buyPrice || b.rentPrice;
                return priceA - priceB;
            });
        } else if (sortVal === 'high-low') {
            listings.sort((a, b) => {
                const priceA = (a.listingType === 'rent' && currentMarketFilter === 'rent') ? a.rentPrice : a.buyPrice || a.rentPrice;
                const priceB = (b.listingType === 'rent' && currentMarketFilter === 'rent') ? b.rentPrice : b.buyPrice || b.rentPrice;
                return priceB - priceA;
            });
        }
    }

    if (listings.length === 0) {
        marketGrid.classList.add('hidden');
        if (noProducts) noProducts.classList.remove('hidden');
        return;
    }

    listings.forEach(l => {
        const card = document.createElement('div');
        card.className = 'product-card-v2 animate-up';

        let priceBadges = '';
        if (l.listingType === 'buy' || l.listingType === 'both') {
            priceBadges += `<span class="badge-v2 badge-buy">🛒 Buy ₹${l.buyPrice}</span>`;
        }
        if (l.listingType === 'rent' || l.listingType === 'both') {
            priceBadges += `<span class="badge-v2 badge-rent">📅 Rent ₹${l.rentPrice}/day</span>`;
        }

        let actionBtns = '';
        if (l.listingType === 'buy' || l.listingType === 'both') {
            actionBtns += `<button class="btn-primary" style="flex:1;padding:8px;font-size:0.8rem;" onclick="purchaseListing('${l.id}','buy')">Purchase</button>`;
        }
        if (l.listingType === 'rent' || l.listingType === 'both') {
            actionBtns += `<button class="btn-outline" style="flex:1;padding:8px;font-size:0.8rem;" onclick="purchaseListing('${l.id}','rent')">Rent Now</button>`;
        }

        const imgHtml = l.image
            ? `<img src="${l.image}" alt="${l.name}" class="product-card-image">`
            : `<div style="width:100%;height:180px;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:3rem;border-bottom:1px solid var(--border);">📦</div>`;

        card.innerHTML = `
            ${imgHtml}
            <div class="product-card-content">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h3 class="product-card-title">${l.name}</h3>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:end;">${priceBadges}</div>
                </div>
                <p class="product-card-desc">${l.desc}</p>
                <div style="display:flex;align-items:center;gap:6px;color:var(--gray-dim);font-size:0.75rem;font-weight:600;">
                    <span>🕒 Age: ${l.age}</span>
                    <span>•</span>
                    <span>📍 Verified Origin</span>
                </div>
            </div>
            <div class="product-card-footer">
                <div style="display:flex;gap:10px;width:100%;">
                    ${actionBtns}
                </div>
            </div>`;
        marketGrid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Show Farmer Identity
    const farmerData = JSON.parse(localStorage.getItem('farmerData') || 'null');
    if (farmerData) {
        const nameEl = document.getElementById('farmerNameDisplay');
        const identityEl = document.getElementById('farmerIdentity');
        if (nameEl) nameEl.textContent = farmerData.farmerName;
        if (identityEl) identityEl.style.display = 'flex';
    }

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('farmerToken');
            localStorage.removeItem('farmerData');
            window.location.href = 'farmer-auth.html';
        };
    }

    loadMarketplace();
    renderAnalytics();
});

// ── Tab Switching ─────────────────────────────
window.switchTab = (tab) => {
    const tabs = ['market', 'analytics', 'track', 'rental', 'buying'];
    tabs.forEach(t => {
        const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        let panelId = 'panelAnalytics';
        if (t === 'market') panelId = 'panelProducts';
        else if (t === 'track') panelId = 'panelTrack';
        else if (t === 'rental') panelId = 'panelRental';
        else if (t === 'buying') panelId = 'panelBuying';
        
        const panel = document.getElementById(panelId);
        
        if (t === tab) {
            if (btn) btn.classList.add('active');
            if (panel) panel.classList.remove('hidden');
        } else {
            if (btn) btn.classList.remove('active');
            if (panel) panel.classList.add('hidden');
        }
    });
    
    if (tab === 'analytics') renderAnalytics();
    if (tab === 'rental') renderRentalOrders();
    if (tab === 'buying') renderBuyingOrders();
};

// ── Tracking ─────────────────────────────────
window.trackOrder = () => {
    const code = document.getElementById('trackInput').value.trim();
    const resultDiv = document.getElementById('trackResult');
    const content = document.getElementById('trackContent');

    if (!code) { toast('Please enter a tracking code.'); return; }

    resultDiv.classList.remove('hidden');
    content.innerHTML = `
        <div style="margin-bottom: 1rem;"><strong>Order ID:</strong> ${code}</div>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
            <div style="display: flex; gap: 15px; align-items: start;">
                <div style="width: 12px; height: 12px; background: var(--emerald); border-radius: 50%; margin-top: 4px; box-shadow: 0 0 10px var(--emerald);"></div>
                <div>
                    <div style="color: #fff; font-weight: 700;">Harvest Registered</div>
                    <div style="font-size: 0.8rem; color: var(--gray-dim);">Dec 12, 2026 - Origin Verified</div>
                </div>
            </div>
            <div style="display: flex; gap: 15px; align-items: start;">
                <div style="width: 12px; height: 12px; background: var(--emerald); border-radius: 50%; margin-top: 4px; box-shadow: 0 0 10px var(--emerald);"></div>
                <div>
                    <div style="color: #fff; font-weight: 700;">Logistics Handover</div>
                    <div style="font-size: 0.8rem; color: var(--gray-dim);">Dec 14, 2026 - Transit Started</div>
                </div>
            </div>
            <div style="display: flex; gap: 15px; align-items: start;">
                <div style="width: 12px; height: 12px; background: rgba(255,255,255,0.1); border-radius: 50%; margin-top: 4px;"></div>
                <div>
                    <div style="color: var(--gray-dim); font-weight: 700;">Marketplace Arrival</div>
                    <div style="font-size: 0.8rem; color: var(--gray-dim);">In Transit...</div>
                </div>
            </div>
        </div>
    `;
    toast('Searching blockchain records...');
};

// ── Analytics ─────────────────────────────────
let marketChart, spendingChart;

function renderBuyingOrders() {
    const purchases = getPurchases();
    const body = document.getElementById('buyingOrdersBody');
    const noData = document.getElementById('noBuyingData');
    if (!body) return;

    // Filter only buys
    const buys = purchases.filter(p => p.action === 'buy');

    if (buys.length === 0) {
        body.innerHTML = '';
        if (noData) noData.classList.remove('hidden');
        return;
    }

    if (noData) noData.classList.add('hidden');
    
    body.innerHTML = buys.slice().reverse().map(b => {
        const qty = b.quantity || 1;
        const amtPerProd = (b.price / qty).toFixed(2);
        const dateStr = b.at ? new Date(b.at).toLocaleDateString() : 'N/A';
        const receivedStr = b.at ? new Date(b.at).toLocaleDateString() : 'N/A'; // Mocking received date as same right now

        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px; color:#fff;">${b.name}</td>
                <td style="padding: 12px; color:#fff;">${qty}</td>
                <td style="padding: 12px; color:#fff;">₹${amtPerProd}</td>
                <td style="padding: 12px; color:var(--emerald); font-weight:700;">₹${b.price.toFixed(2)}</td>
                <td style="padding: 12px; color:var(--gray-dim); font-size: 0.85rem;">${dateStr}</td>
                <td style="padding: 12px; color:var(--gray-dim); font-size: 0.85rem;">${receivedStr}</td>
                <td style="padding: 12px; font-family: monospace; color:var(--violet);">${b.orderId}</td>
            </tr>
        `;
    }).join('');
}

function renderRentalOrders() {
    const purchases = getPurchases();
    const body = document.getElementById('rentalOrdersBody');
    const noData = document.getElementById('noRentalData');
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

function renderAnalytics() {
    const purchases = getPurchases();
    
    // Stats
    const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);
    const itemsBought = purchases.filter(p => p.action === 'buy').length;
    const itemsRented = purchases.filter(p => p.action === 'rent').length;

    document.getElementById('statTotalSpent').textContent = `₹${totalSpent}`;
    document.getElementById('statItemsBought').textContent = itemsBought;
    document.getElementById('statItemsRented').textContent = itemsRented;

    // Data for Charts
    const ctxActivity = document.getElementById('marketActivityChart');
    const ctxSpending = document.getElementById('spendingChart');

    if (!ctxActivity || !ctxSpending) return;

    if (marketChart) marketChart.destroy();
    if (spendingChart) spendingChart.destroy();

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'rgba(255,255,255,0.5)' }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'rgba(255,255,255,0.5)' }
            }
        }
    };

    marketChart = new Chart(ctxActivity, {
        type: 'bar',
        data: {
            labels: ['Purchases', 'Rentals'],
            datasets: [{
                label: 'Count',
                data: [itemsBought, itemsRented],
                backgroundColor: ['#00E5A0', '#007AFF'],
                borderRadius: 8
            }]
        },
        options: commonOptions
    });

    spendingChart = new Chart(ctxSpending, {
        type: 'bar',
        data: {
            labels: ['Total Spent'],
            datasets: [{
                label: 'Rupees',
                data: [totalSpent],
                backgroundColor: ['#34C759'],
                borderRadius: 8
            }]
        },
        options: commonOptions
    });
}

window.addEventListener('storage', (e) => {
    if (e.key === SELLER_KEY) loadMarketplace();
});

window.addEventListener('agrichain:newListing', loadMarketplace);
window.addEventListener('app:ready', loadMarketplace);

// ── Purchase handlers ─────────────────────────
// ── Purchase handlers ─────────────────────────
window.purchaseListing = (id, action) => {
    const listings = getListings();
    const idx = listings.findIndex(l => String(l.id) === String(id));
    if (idx === -1) { toast('❌ Listing not found.'); return; }

    const l     = listings[idx];
    const farmerData = JSON.parse(localStorage.getItem('farmerData') || '{}');
    const farmerName = farmerData.farmerName || 'Anonymous Farmer';
    
    let price = action === 'buy' ? l.buyPrice : l.rentPrice;
    let rentDays = 0;
    let quantity = 1;
    let rentEndDate = null;
    const orderId = '#AG-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    if (action === 'rent') {
        // Redirect to payment page — days input will happen there
        sessionStorage.setItem('pendingRental', JSON.stringify({
            listingId: l.id,
            productName: l.name,
            image: l.image,
            perDay: l.rentPrice,
            orderId,
            farmerName
        }));
        window.location.href = 'payment.html';
        return;
    } else if (action === 'buy') {
        const qtyInput = prompt(`Enter Total Quantity for "${l.name}":`, "1");
        quantity = parseFloat(qtyInput);
        if (isNaN(quantity) || quantity <= 0) { toast('⚠️ Invalid quantity.', true); return; }
        price = l.buyPrice * quantity;
    }

    if (!confirm(`Confirm Purchase of "${l.name}" for ₹${price.toFixed(2)} (Qty: ${quantity})?`)) return;

    listings[idx].status  = action === 'buy' ? 'sold' : 'rented';
    listings[idx].revenue = (listings[idx].revenue || 0) + price;
    try { localStorage.setItem(SELLER_KEY, JSON.stringify(listings)); } catch {}

    const purchases = getPurchases();
    purchases.push({ 
        orderId,
        farmerName,
        name: l.name, 
        image: l.image, 
        action, 
        price, 
        rentDays,
        quantity,
        rentStart: new Date().toISOString(),
        rentEnd: rentEndDate,
        at: new Date().toISOString() 
    });
    savePurchases(purchases);

    toast(`✅ "${l.name}" ${action === 'buy' ? 'purchased' : 'rented'} for ₹${price}! Order ID: ${orderId}`);
    loadMarketplace();
    renderAnalytics();
    renderRentalOrders();
};

window.buyProduct = async (id, price) => {
    if (!window.App?.contract) { toast('Connect Wallet!'); return; }
    try {
        const tx = await window.App.contract.buyProduct(id, { value: price });
        toast('Transaction sent…');
        await tx.wait();
        toast('✅ Purchase successful!');
        loadMarketplace();
    } catch (e) { toast('❌ ' + (e.reason || e.message)); }
};
