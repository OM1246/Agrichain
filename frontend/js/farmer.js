// Wait for global app to be ready
window.addEventListener('app:ready', () => {
    const form = document.getElementById("registerForm");
    if(!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if(!window.App.contract || !window.App.account) {
            alert("Please Connect Wallet First!");
            return;
        }

        const name = document.getElementById("pName").value;
        const desc = document.getElementById("pDesc").value;
        const origin = document.getElementById("pOrigin").value;
        const date = document.getElementById("pHarvestDate").value;
        const ipfs = "QmHashMock"; // Placeholder for now

        const btn = form.querySelector("button");
        const originalText = btn.innerText;
        btn.innerText = "Minting on Blockchain...";
        btn.disabled = true;

        try {
            // Wait for event instead of tx receipt return value in some cases, 
            // but for simplicity we can just wait for tx and then get latest ID if we want,
            // OR we can trust the event log if we parse it.
            // For now, let's just get the latest ID by checking logs or productCount.
            
            const tx = await window.App.contract.registerProduct(name, desc, origin, ipfs, date);
            console.log("Tx sent:", tx.hash);
            const receipt = await tx.wait();
            
            // Getting the ID from the event logs is cleaner
            // Event: ProductRegistered(uint256 indexed id, string name, address indexed owner)
            // But Parsing logs in Ethers v6 requires interface. 
           
            // Quick workaround: fetch total count (since we just added one)
            const count = await window.App.contract.productCounter();
            const newId = count; // BigInt

            alert(`✅ Harvest Registered! Asset ID: ${newId}`);
            form.reset();

            // Generate QR
            const qrContainer = document.getElementById("qrResult");
            const box = document.getElementById("qrcode");
            qrContainer.classList.remove("hidden");
            box.innerHTML = "";
            
            const verifyLink = `${window.location.origin}/verify.html?id=${newId}`;
            new QRCode(box, {
                text: verifyLink,
                width: 128,
                height: 128
            });

            document.getElementById("productIdDisplay").innerText = `Asset ID: #${newId}`;

        } catch (err) {
            console.error(err);
            alert("Error: " + (err.reason || err.message));
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
});
