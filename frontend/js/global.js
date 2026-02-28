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

// ── Chatbot Integration ──────────────────────────────────────────
function initChatbot() {
    // 1. Inject API trigger and Translate button in the navbar
    const navRight = document.querySelector(".glass-nav > div[style*='display:flex']");
    
    // Add Translate Snippet to Head
    const gtScript = document.createElement("script");
    gtScript.type = "text/javascript";
    gtScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(gtScript);

    // Add Widget Container (Hidden)
    const gtContainer = document.createElement("div");
    gtContainer.id = "google_translate_element";
    gtContainer.style.display = "none";
    document.body.appendChild(gtContainer);

    // Setup global callback for Google Translate
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'hi', autoDisplay: false}, 'google_translate_element');
    };

    // Custom Translate Trigger Function
    window.triggerHindiTranslation = function() {
        const html = document.documentElement;
        if (html.classList.contains('translated-ltr') || html.classList.contains('translated-rtl')) {
            // If already translated, clear the cookie and reload to restore English
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=127.0.0.1; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=localhost; path=/;";
            window.location.reload();
        } else {
            // Not translated, switch to Hindi
            const selectEl = document.querySelector('.goog-te-combo');
            if (selectEl) {
                selectEl.value = 'hi';
                selectEl.dispatchEvent(new Event('change'));
            } else {
                console.warn("Translate widget not ready yet. Please try again in a moment.");
            }
        }
    };

    if (navRight) {
        // Translate Button
        const transBtn = document.createElement("button");
        transBtn.className = "btn-outline";
        transBtn.style.padding = "10px 15px";
        transBtn.innerHTML = "अ/A Translate";
        transBtn.onclick = triggerHindiTranslation;
        navRight.prepend(transBtn);

        // Chatbot Button
        const chatBtn = document.createElement("button");
        chatBtn.className = "btn-outline";
        chatBtn.style.padding = "10px 15px";
        chatBtn.innerHTML = "🤖 AI Help";
        chatBtn.onclick = toggleChatbot;
        navRight.prepend(chatBtn);
    } else {
        const navLinks = document.querySelector(".nav-links");
        if(navLinks) {
            const transLink = document.createElement("a");
            transLink.href = "javascript:void(0)";
            transLink.innerHTML = "अ/A Translate";
            transLink.onclick = triggerHindiTranslation;
            navLinks.appendChild(transLink);

            const chatLink = document.createElement("a");
            chatLink.href = "javascript:void(0)";
            chatLink.innerHTML = "🤖 AI Help";
            chatLink.onclick = toggleChatbot;
            navLinks.appendChild(chatLink);
        }
    }

    // 2. Inject Chatbot UI into body
    const chatContainer = document.createElement("div");
    chatContainer.id = "chatbot-container";
    chatContainer.className = "chatbot-container";
    chatContainer.innerHTML = `
        <div class="chatbot-header">
            <span>Agrichain AI Assistant</span>
            <button onclick="toggleChatbot()" class="close-chat">&times;</button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages">
            <div class="chat-msg bot-msg">Hello! I'm your Agrichain AI assistant. How can I help you today?</div>
        </div>
        <div class="chatbot-input">
            <button id="chatbot-voice-btn" class="chatbot-voice-btn" onclick="toggleVoiceRecording()" title="Start Voice Input">🎤</button>
            <input type="text" id="chatbot-input-field" placeholder="Ask a question..." onkeypress="if(event.key === 'Enter') sendChatMessage()">
            <button onclick="sendChatMessage()">Send</button>
        </div>
    `;
    document.body.appendChild(chatContainer);
}

// Global variable for speech recognition
window.recognition = null;
window.isRecording = false;

window.toggleVoiceRecording = function() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Sorry, your browser doesn't support speech recognition. Please type your message.");
        return;
    }

    const btn = document.getElementById("chatbot-voice-btn");
    const input = document.getElementById("chatbot-input-field");

    if (window.isRecording) {
        if (window.recognition) {
            window.recognition.stop();
        }
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    window.recognition = new SpeechRecognition();
    window.recognition.continuous = false;
    window.recognition.interimResults = false;
    window.recognition.lang = 'en-US';

    window.recognition.onstart = function() {
        window.isRecording = true;
        btn.classList.add("recording");
        input.placeholder = "Listening...";
    };

    window.recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        
        // Auto-send after a short delay
        setTimeout(() => {
            sendChatMessage();
        }, 500);
    };

    window.recognition.onerror = function(event) {
        console.error("Speech Recognition Error:", event.error);
        if(event.error === 'not-allowed') {
            alert("Microphone access was denied. Please allow microphone access to use voice commands.");
        }
        window.isRecording = false;
        btn.classList.remove("recording");
        input.placeholder = "Ask a question...";
    };

    window.recognition.onend = function() {
        window.isRecording = false;
        btn.classList.remove("recording");
        input.placeholder = "Ask a question...";
    };

    window.recognition.start();
};

// Profile Dropdown Functionality
window.toggleDropdown = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Auto-close logic on outside click
    if (el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'block';
        
        // Setup listener to close it
        const closeDropdown = (e) => {
            // Check if the click is outside the dropdown and its trigger
            const dropdownTrigger = document.getElementById(id.replace('Dropdown', 'Identity'));
            if (!el.contains(e.target) && (!dropdownTrigger || !dropdownTrigger.contains(e.target))) {
                el.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        };
        // Use setTimeout to allow the current click event to propagate before adding the listener
        setTimeout(() => document.addEventListener('click', closeDropdown), 0);
    } else {
        el.style.display = 'none';
    }
};

window.toggleChatbot = function() {
    const container = document.getElementById("chatbot-container");
    if(container) container.classList.toggle("active");
};

window.sendChatMessage = async function() {
    const input = document.getElementById("chatbot-input-field");
    const text = input.value.trim();
    if(!text) return;
    
    input.value = "";
    addChatMessage(text, "user-msg");
    
    const loadingId = "load-" + Date.now();
    addChatMessage("...", "bot-msg", loadingId);

    try {
        const API_KEY = "Use_your_key";
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "You are an AI assistant for Agrichain, a blockchain agricultural supply chain platform. The sections include Marketplace, Farmer Portal, Seller Portal, and Admin. Please keep answers concise and helpful. User says: " + text
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API response error (${response.status}): ${errText}`);
        }
        
        const data = JSON.parse(await response.text());
        const reply = data.candidates[0].content.parts[0].text;
        
        document.getElementById(loadingId).innerText = reply;
    } catch(err) {
        console.error("Chatbot API Error:", err);
        const el = document.getElementById(loadingId);
        if(el) {
            el.innerText = "Error connecting to AI. Check console for details.";
            el.style.color = "var(--rose)";
        }
    }
}

function addChatMessage(text, type, id="") {
    const msgs = document.getElementById("chatbot-messages");
    if(!msgs) return;
    const div = document.createElement("div");
    div.className = "chat-msg " + type;
    if(id) div.id = id;
    div.innerText = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

window.addEventListener("load", initChatbot);
