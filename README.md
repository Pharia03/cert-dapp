# CertVerifier DApp

A blockchain-based Decentralised Application (DApp) for storing and verifying SHA-256 hashes of academic certificates on the **Ethereum Sepolia testnet**.

**Deployed Contract:** `0x50Bc6c87789eD25D08D311045d7dBFcDEB5b909A` (Sepolia)

---

## Features

- **Store** — Upload a certificate file; its SHA-256 hash is stored permanently on-chain with student name, course, and date
- **Verify** — Upload the original file to check authenticity; full details returned if found
- **Revoke** — Contract owner can permanently revoke a certificate
- **Live Events** — Real-time `CertificateStored` and `CertificateRevoked` blockchain events in the UI
- **Session History** — All actions tracked per session

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.19 |
| Blockchain | Ethereum Sepolia Testnet |
| Deployment | Hardhat + Alchemy |
| Wallet | MetaMask (ethers.js v5.7) |
| Back-end | Node.js + Express + Multer |
| Front-end | HTML5 / CSS3 / JavaScript |
| Testing | Mocha + Chai (19 unit tests) |
| Code Quality | ESLint |

---

## Installation

### Prerequisites
- Node.js v16+
- MetaMask browser extension
- Alchemy account (free tier)
- Sepolia test ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/Pharia03/cert-dapp.git
cd cert-dapp
npm install

# 2. Configure hardhat.config.js with your Alchemy URL and wallet key

# 3. Deploy contract
npx hardhat run scripts/deploy.js --network sepolia

# 4. Update CONTRACT_ADDRESS in index.html with the printed address

# 5. Start backend
node server.js

# 6. Launch frontend
npx serve
```

---

## Running Tests

```bash
npx hardhat test
```

19 tests covering: deployment, store, verify, revoke, and ownership functions.

---

## Project Structure

```
cert-dapp/
├── contracts/CertVerifier.sol    # Solidity smart contract
├── scripts/deploy.js             # Deployment script
├── test/CertVerifier.test.js     # Unit tests
├── index.html                    # Front-end DApp
├── server.js                     # Node.js hashing backend
├── hardhat.config.js             # Network config
└── eslint.config.mjs             # Code quality config
```

---

## Smart Contract — Key Functions

| Function | Description |
|----------|-------------|
| `storeCertificate(name, course, date, hash)` | Stores certificate on-chain |
| `verifyCertificate(hash)` | Returns `(exists, isRevoked, certId)` |
| `getCertificate(certId)` | Returns full certificate details |
| `getCertificateCount()` | Returns total stored count |
| `revokeCertificate(certId)` | Owner-only: revokes a certificate |

---

## Backend API

```
POST /hash
Body: multipart/form-data — certificate (file)
Response: { "hash": "0x282ff3..." }
```

Computes SHA-256 of the uploaded file using Node.js `crypto` module.