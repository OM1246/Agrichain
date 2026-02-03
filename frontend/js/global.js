import { CONTRACT_ADDRESS } from "./config.js";

// Expose global state
window.App = {
    contract: null,
    signer: null,
    provider: null,
    account: null,
    init: async function() {
        console.log("Global Init Triggered");
        // Ethers v6 UMD safety check
        if (!window.ethers && window.ethers?.ethers) {
            window.ethers = window.ethers.ethers;
        }

        if (!window.ethers) {
            console.error("Ethers.js not loaded");
            alert("Critical Error: Ethers.js not loaded. Check console.");
            return;
        }

        const LOCAL_PROVIDER_URL = "http://127.0.0.1:8545";
        
        // 1. Setup Provider
        if (window.ethereum) {
            window.App.provider = new ethers.BrowserProvider(window.ethereum);
            console.log("MetaMask Detected");
        } else {
            console.log("No MetaMask - Using Local Provider");
            window.App.provider = new ethers.JsonRpcProvider(LOCAL_PROVIDER_URL);
        }

        // Setup Connect Button (Do this EARLY)
        const btn = document.getElementById("connectWalletBtn");
        if(btn) {
            console.log("Connect Button Found, attaching listener");
            // Remove old listeners to be safe (by cloning) - though not strictly necessary here
            btn.addEventListener("click", () => {
                console.log("Connect Clicked");
                window.App.connectWallet();
            });
        } else {
            console.error("Connect Button NOT Found");
        }

        // 2. Load Contract ABI
        try {
            const response = await fetch('../artifacts/contracts/AgriChain.sol/AgriChain.json');
            const data = await response.json();
            
            // 3. Connect Wallet Listener
            if (window.ethereum) {
                const accounts = await window.App.provider.send("eth_accounts", []);
                if(accounts.length > 0) {
                    console.log("Already connnected", accounts[0]);
                    window.App.account = accounts[0];
                    window.App.updateNav();
                    await window.App.initContract(data.abi);
                }
                
                window.ethereum.on('accountsChanged', (accs) => {
                    window.location.reload();
                });
            } else {
                // Read-only init
                await window.App.initContract(data.abi);
            }

        } catch (e) {
            console.error("Init Error:", e);
        }
    },

    connectWallet: async function() {
        console.log("Attempting to connect wallet...");
        if (!window.ethereum) return alert("Please install MetaMask!");
        try {
            const accounts = await window.App.provider.send("eth_requestAccounts", []);
            // Force update UI immediately
            if(accounts.length > 0) {
                window.App.account = accounts[0];
                window.App.updateNav();
                // window.location.reload(); // Optional, but usually safer to reload for chain/state sync
            }
        } catch (e) {
            console.error(e);
            alert("Connection Failed: " + e.message);
        }
    },

    initContract: async function(abi) {
        try {
            if (window.App.account) {
                window.App.signer = await window.App.provider.getSigner();
                window.App.contract = new ethers.Contract(CONTRACT_ADDRESS, abi, window.App.signer);
            } else {
                const readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); 
                window.App.contract = new ethers.Contract(CONTRACT_ADDRESS, abi, readProvider);
            }
            console.log("Contract Initialized:", CONTRACT_ADDRESS);
            
            // Dispatch Ready Event for page-specific scripts
            window.dispatchEvent(new Event('app:ready'));
        } catch (e) {
            console.error("Contract Init Failed:", e);
        }
    },

    updateNav: function() {
        const btn = document.getElementById("connectWalletBtn");
        if(btn && window.App.account) {
            btn.innerText = window.App.account.substring(0, 6) + "...";
            btn.style.background = "var(--secondary-color)";
            btn.style.color = "white";
        }
    }
};

// Start
window.addEventListener("load", window.App.init);
