window.addEventListener('app:ready', () => {
    const updateBtn = document.getElementById("updateBtn");
    
    if(updateBtn) {
        updateBtn.addEventListener("click", async () => {
             if(!window.App.contract || !window.App.account) return alert("Connect Wallet!");
            
            const id = document.getElementById("updateId").value;
            const stage = document.getElementById("updateStage").value;
            const loc = document.getElementById("updateLoc").value;

            try {
                const tx = await window.App.contract.updateStage(id, stage, loc);
                await tx.wait();
                alert("✅ Journey Updated!");
            } catch (e) {
                console.error(e);
                alert("Update Failed: " + (e.reason || e.message));
            }
        });
    }
});
