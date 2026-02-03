import { ethers } from "./ethers.umd.min.js";

window.addEventListener('app:ready', () => {
    loadMarketplace();
    
    // Poller
    setInterval(loadMarketplace, 10000); // Auto refresh
});

// Expose buy for onclick HTML
window.buyProduct = async (id, priceWei) => {
    if(!window.App.contract) return alert("Connect Wallet First!");
    try {
        const tx = await window.App.contract.buyProduct(id, { value: priceWei });
        alert("Transaction Sent! Waiting for confirmation...");
        await tx.wait();
        alert("✅ Purchase Successful!");
        loadMarketplace();
    } catch (e) {
        console.error(e);
        alert("Purchase Failed: " + (e.reason || e.message));
    }
};

window.listForSale = async () => {
     if(!window.App.contract) return alert("Connect Wallet!");
    const id = document.getElementById("sellId").value;
    const priceEth = document.getElementById("sellPrice").value;
    
    try {
        const priceWei = ethers.parseEther(priceEth);
        const tx = await window.App.contract.listForSale(id, priceWei);
        await tx.wait();
        alert("✅ Listed for Sale!");
        loadMarketplace();
    } catch (e) {
        console.error(e);
        alert("Failed to List");
    }
};

async function loadMarketplace() {
    if (!window.App.contract) return;

    try {
        const count = await window.App.contract.productCounter();
        const marketGrid = document.getElementById("marketGrid");
        marketGrid.innerHTML = "";
        
        let hasItems = false;

        for(let i = 1; i <= count; i++) {
            const p = await window.App.contract.getProduct(i);
            
            if(p.isForSale) {
                hasItems = true;
                const card = document.createElement("div");
                card.className = "glass-card product-card";
                card.innerHTML = `
                    <div style="position:relative;">
                        <span class="product-badge">ID: #${p.id}</span>
                        <h3>${p.name}</h3>
                        <p style="color:var(--text-muted)">Harvested: ${p.harvestDate || 'N/A'}</p>
                    </div>
                    <div>
                        <p>${p.description}</p>
                        <div class="product-price">${ethers.formatEther(p.price)} ETH</div>
                        <p class="product-owner">Seller: ${p.currentOwner.substring(0,6)}...</p>
                        <button onclick="buyProduct(${p.id}, '${p.price}')" class="btn-primary" style="width:100%">Buy Now</button>
                    </div>
                `;
                marketGrid.appendChild(card);
            }
        }
        
        if(!hasItems) {
             marketGrid.innerHTML = '<div class="glass-card"><p>No items for sale currently.</p></div>';
        }

    } catch (e) {
        console.error("Market Load Failed", e);
    }
}

// Bind list button if exists (for test)
const listBtn = document.getElementById("listBtn");
if(listBtn) listBtn.addEventListener("click", window.listForSale);
