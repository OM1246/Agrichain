# 🌾 **AgriChain**

### _Trust from Soil to Shelf_

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)
![Ethereum](https://img.shields.io/badge/blockchain-Ethereum-3C3C3D.svg?style=for-the-badge&logo=ethereum)

---

## 📖 **The Story**

In a world of opaque supply chains, **AgriChain** brings radical transparency to your food.
We empower **Farmers** to tell their story, **Logistics** to prove their care, and **Consumers** to verify the truth.

Every apple, every grain, every harvest has a digital passport that lives forever on the blockchain.

---

## ✨ **Key Features**

### 👨🌾 **For Farmers: Digital Harvest**

- **Mint Assets**: Instantly turn physical produce into digital NFTs.
- **Immutable Records**: Lock in the _Harvest Date_ and _Origin_ forever.
- **QR Identity**: Auto-generated QR codes acting as the product's "Story Button".

### 🚚 **For Logistics: The Journey**

- **Real-Time Updates**: Record status changes (Picked Up, Stored, In Transit).
- **Location Tracking**: Verify stops along the route.
- **Chain of Custody**: Clear ownership transfer at every step.

### 🏪 **For Retail: Verified Stock**

- **Confirm Receipt**: Retailers sign off on goods before selling.
- **Premium Marketplace**: List verified products for sale in ETH.

### 🌟 **For Consumers: Absolute Trust**

- **Trust Score**: An algorithmic score (0-100) based on freshness (time) and handling (stops).
- **Full History**: See every hand that touched your food.

---

## 🛠️ **Tech Stack**

| Component      | Technology                                   |
| :------------- | :------------------------------------------- |
| **Blockchain** | Solidity, Ethereum, Hardhat                  |
| **Frontend**   | HTML5, CSS3 (Modern Minimalist), Vanilla JS  |
| **Web3**       | Ethers.js v6                                 |
| **Styling**    | Custom CSS Variables, Glassmorphism Elements |

---

## 🚀 **Getting Started**

### **1. Prerequisites**

- **Node.js** (v16+)
- **MetaMask** Browser Extension

### **2. Installation**

Cloning the repository and installing dependencies:

```bash
git clone https://github.com/yourusername/agri-supply-chain.git
cd agri-supply-chain
npm install
```

### **3. Launch Local Blockchain**

Start the Hardhat node to simulate Ethereum locally:

```bash
npx hardhat node
```

### **4. Deploy Contracts**

Deploy the smart contract (auto-updates frontend config):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### **5. Run the App**

Launch the customized lightweight server:

```bash
npx http-server ./frontend
```

_Open `http://127.0.0.1:8080/index.html` in your browser._

---

## 📸 **Story Flow**

1.  **Farmer Registration**: Mint "Golden Apples" -> obtain Asset #1.
2.  **Logistics Update**: Driver sets status to "Picked Up".
3.  **Shop Confirmation**: Retailer sets status to "At Retail".
4.  **Consumer Check**: Scan QR code -> See **Trust Score: 95/100**.

---

## 🔮 **Future Roadmap**

- [ ] **IoT Integration**: Auto-update temperature data from sensors.
- [ ] **Token Rewards**: Incentivize farmers with AGRI tokens.
- [ ] **Mobile App**: React Native mobile version for drivers.

---

<p align="center">
  <i>Built with ❤️ for the Future of Agriculture.</i>
</p>
