import { ethers } from "./ethers.umd.min.js";

window.addEventListener('app:ready', () => {
    const btn = document.getElementById("verifyBtn");
    // Parse URL param for ID logic
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
    const idParam = urlParams.get("id");
    if(idParam) {
        document.getElementById("verifyInput").value = idParam;
        verifyProduct(idParam);
    }
    
    if(btn) {
        btn.addEventListener("click", () => {
            const id = document.getElementById("verifyInput").value;
            if(id) verifyProduct(id);
        });
    }
});

async function verifyProduct(id) {
    if(!window.App.contract) return alert("Initializing... Try again in a second.");
    
    try {
        const p = await window.App.contract.getProduct(id);
        if(!p.name) return alert("Product Not Found");

        document.getElementById("verifyResult").classList.remove("hidden");
        document.getElementById("vName").innerText = p.name;
        document.getElementById("vDesc").innerText = p.description;
        document.getElementById("vOrigin").innerText = p.origin;
        document.getElementById("vOwner").innerText = p.currentOwner;
        document.getElementById("vStatus").innerText = getStageName(Number(p.stage));
        document.getElementById("vHarvest").innerText = "Harvested: " + (p.harvestDate || "Unknown");

        // --- TRUST SCORE LOGIC ---
        const hist = await window.App.contract.getProductHistory(id);
        
        let score = 100;
        if (hist.length > 5) score -= (hist.length - 5) * 5;
        const stops = hist.length;
        score -= (stops * 2);
        
        if(score < 60) score = 60;
        if(score > 100) score = 100;

        const scoreBox = document.getElementById("vScoreBox");
        const scoreVal = document.getElementById("vScore");
        scoreVal.innerText = score + "/100";

        if(score >= 90) {
            scoreVal.style.color = "#39FF14"; // Green
            scoreBox.style.borderColor = "#39FF14";
        } else if (score >= 70) {
            scoreVal.style.color = "orange";
            scoreBox.style.borderColor = "orange";
        } else {
            scoreVal.style.color = "red";
            scoreBox.style.borderColor = "red";
        }

        const list = document.getElementById("vTimeline");
        list.innerHTML = "";
        hist.forEach(h => {
             const li = document.createElement("li");
             li.className = "timeline-item";
             li.innerHTML = `<p>${h}</p>`;
             list.appendChild(li);
        });

    } catch (e) {
        console.error(e);
        alert("Verification Error");
    }
}

function getStageName(s) {
    return ["Harvested", "In Transit", "Stored", "At Retail", "Sold"][s] || "Unknown";
}
