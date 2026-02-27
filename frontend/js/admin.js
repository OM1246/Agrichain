window.addEventListener('app:ready', () => {
    console.log("Admin Portal Ready");
    
    // --- Logistics Section ---
    const stageForm = document.getElementById('stageForm');
    if(stageForm) {
        stageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!window.App.contract) return alert("Connect Wallet!");

            const id = document.getElementById('stageId').value;
            const stage = document.getElementById('newStageSelect').value;
            const loc = document.getElementById('stageLoc').value;

            try {
                const tx = await window.App.contract.updateStage(id, stage, loc);
                const btn = stageForm.querySelector('button');
                btn.innerText = "Updating...";
                btn.disabled = true;

                await tx.wait();
                alert("✅ Stage updated successfully!");
                stageForm.reset();
            } catch (err) {
                console.error(err);
                alert("Update failed: " + (err.reason || err.message));
            } finally {
                const btn = stageForm.querySelector('button');
                btn.innerText = "Update Stage";
                btn.disabled = false;
            }
        });
    }

    // --- Verification Section ---
    const verifyBtn = document.getElementById('verifyBtn');
    const verifyResult = document.getElementById('verifyResult');
    const productInfo = document.getElementById('productInfo');
    const historyTimeline = document.getElementById('historyTimeline');

    if(verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const id = document.getElementById('verifyIdInput').value;
            if(!id) return alert("Enter a Product ID");
            if(!window.App.contract) return alert("Connect Wallet!");

            try {
                verifyResult.classList.add('hidden');
                verifyBtn.innerText = "Searching...";
                
                const p = await window.App.contract.products(id);
                if(p.name === "") throw new Error("Product not found");

                const history = await window.App.contract.getProductHistory(id);

                // Populate Info
                productInfo.innerHTML = `
                    <h3 style="color: var(--primary-color)">${p.name}</h3>
                    <p style="margin: 0.5rem 0;">${p.description}</p>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                        <span class="btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; pointer-events: none;">
                            Stage: ${getStageName(p.stage)}
                        </span>
                        <span style="color: var(--text-muted); font-size: 0.9rem;">📍 Origin: ${p.origin}</span>
                    </div>
                `;

                // Populate History
                historyTimeline.innerHTML = "";
                history.forEach(h => {
                    const item = document.createElement('div');
                    item.style.marginBottom = "1.5rem";
                    item.style.position = "relative";
                    item.innerHTML = `
                        <div style="font-size: 0.95rem;">${h}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Verified on Ledger</div>
                    `;
                    historyTimeline.appendChild(item);
                });

                verifyResult.classList.remove('hidden');
            } catch (err) {
                console.error(err);
                alert("Verification failed: " + (err.reason || err.message));
            } finally {
                verifyBtn.innerText = "Search History";
            }
        });
    }

    // Helper
    function getStageName(stage) {
        const stages = ["Harvested", "In Transit", "Stored", "At Retail", "Sold"];
        return stages[stage] || "Unknown";
    }

    // Handle incoming ID from URL (e.g. from QR)
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if(idParam) {
        document.getElementById('verifyIdInput').value = idParam;
        verifyBtn.click();
    }
});
