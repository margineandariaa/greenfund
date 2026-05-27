# 🌱 GreenFund — Decentralized Crowdfunding on MultiversX

> *"Plant 1000 trees together"* — A fully on-chain crowdfunding dApp built on the MultiversX blockchain, where smart contract logic enforces campaign rules without intermediaries.

[![MultiversX](https://img.shields.io/badge/MultiversX-Devnet-00a8ff?style=flat-square)](https://devnet-explorer.multiversx.com)
[![Rust](https://img.shields.io/badge/Rust-multiversx--sc-orange?style=flat-square)](https://docs.multiversx.com/developers/smart-contracts)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?style=flat-square)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📖 Overview

GreenFund is a decentralized application (dApp) that enables transparent, trustless crowdfunding for environmental causes. Contributors donate EGLD tokens toward a funding target. If the target is reached by the deadline, the campaign owner can withdraw the funds. If the target is not met, every contributor can reclaim their individual donation.

All business logic lives entirely on-chain in a Rust smart contract. There is no backend server, no database, and no central authority. The contract is the law.

**Why blockchain for crowdfunding?**

| Traditional Crowdfunding | GreenFund |
|--------------------------|-----------|
| Funds held by platform (e.g. Kickstarter) | Funds locked in smart contract |
| Platform can freeze or redirect funds | Contract rules are immutable |
| Requires trust in the organizer | Trustless — code enforces rules |
| Opaque fund management | Every transaction publicly verifiable |
| Refunds at organizer's discretion | Refunds guaranteed by contract logic |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Browser                      │
│                                                     │
│   React Frontend (Vite)                             │
│   ├── Campaign progress display                     │
│   ├── Web Wallet authentication                     │
│   └── Transaction dispatch                         │
└───────────────┬─────────────────────────────────────┘
                │ REST API calls
                ▼
┌─────────────────────────────────────────────────────┐
│         MultiversX Devnet API                       │
│         devnet-api.multiversx.com                   │
│   ├── /vm-values/query  (read contract state)       │
│   └── /transactions     (broadcast transactions)   │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│         MultiversX Blockchain (Devnet)               │
│                                                     │
│   Smart Contract (Rust / multiversx-sc)             │
│   erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z              │
│   6t9vs2p30mqu0h9z3vgsad2rce                        │
│                                                     │
│   ├── Storage: target, deadline, totalFunds         │
│   ├── Storage: donations mapping (addr → amount)    │
│   ├── Endpoint: fund()    — accept donations        │
│   ├── Endpoint: claim()   — owner withdraws         │
│   └── Endpoint: refund()  — contributor reclaims    │
└─────────────────────────────────────────────────────┘
```

**Key design decision:** The frontend communicates directly with the blockchain via the MultiversX REST API. No backend server is involved. This is architecturally correct because all application logic resides in the smart contract — a backend would only introduce an unnecessary centralization point.

---

## 📦 Project Structure

```
greenfund/
├── greenfund-contract/              # Smart contract (Rust)
│   ├── src/
│   │   └── greenfund_contract.rs   # Main contract logic
│   ├── wasm/                        # WebAssembly compilation output
│   │   └── src/lib.rs
│   ├── meta/                        # Build tooling (sc-meta)
│   │   └── src/main.rs
│   ├── output/
│   │   ├── greenfund-contract.wasm  # Compiled contract bytecode
│   │   └── greenfund-contract.abi.json
│   ├── scenarios/                   # Test scenarios
│   ├── Cargo.toml
│   └── multiversx.json
│
├── greenfund-frontend/              # React frontend
│   ├── src/
│   │   ├── App.jsx                 # Main application component
│   │   ├── index.css               # Global styles
│   │   └── main.jsx                # React entry point
│   ├── public/
│   ├── vite.config.js
│   └── package.json
│
├── wallet.pem                       # Deployment wallet (devnet only — never commit to production)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Rust](https://rustup.rs) (stable toolchain)
- [mxpy](https://docs.multiversx.com/sdk-and-tools/sdk-py/installing-mxpy) (MultiversX Python CLI)

### Run the Frontend Locally

```bash
# Navigate to frontend directory
cd greenfund-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at **http://localhost:5173**

### Build the Smart Contract

```bash
cd greenfund-contract

# Install sc-meta if not already installed
cargo install multiversx-sc-meta

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Build the contract
sc-meta all build
```

The compiled `.wasm` file will be placed in `output/greenfund-contract.wasm`.

---

## 📋 Contract Endpoints

### Mutable Endpoints (require transaction + gas)

| Endpoint | Arguments | Payment | Description |
|----------|-----------|---------|-------------|
| `init` | `target: BigUint`, `deadline: u64` | — | Constructor. Called once at deploy. Sets funding target and campaign deadline. |
| `fund` | — | EGLD (any amount > 0) | Donate EGLD to the campaign. Only callable before deadline. Records individual donation for potential refund. |
| `claim` | — | — | Owner withdraws all funds. Only callable after deadline if target was reached. |
| `refund` | — | — | Contributor reclaims their donation. Only callable after deadline if target was NOT reached. |
| `upgrade` | — | — | Contract upgrade hook. Currently empty. |

### View Endpoints (free, no transaction required)

| Endpoint | Returns | Description |
|----------|---------|-------------|
| `getTarget` | `BigUint` | Returns the funding target in EGLD denomination (1 EGLD = 10^18) |
| `getTotalFunds` | `BigUint` | Returns total funds raised so far |
| `getDeadline` | `u64` | Returns campaign deadline as Unix timestamp |
| `getDonation` | `BigUint` | Returns the amount donated by a specific address |

### Example: Query Contract State via API

```bash
# Get total funds raised
curl -X POST https://devnet-api.multiversx.com/vm-values/query \
  -H "Content-Type: application/json" \
  -d '{
    "scAddress": "erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce",
    "funcName": "getTotalFunds",
    "args": []
  }'
```

---

## 📝 Smart Contract Logic

### Storage Layout

```rust
// Campaign configuration (set at deploy, immutable)
#[storage_mapper("target")]
fn target(&self) -> SingleValueMapper<BigUint>;

#[storage_mapper("deadline")]
fn deadline(&self) -> SingleValueMapper<u64>;

// Dynamic state (updated on each donation)
#[storage_mapper("totalFunds")]
fn total_funds(&self) -> SingleValueMapper<BigUint>;

// Per-contributor donation tracking (enables precise refunds)
#[storage_mapper("donations")]
fn donations(&self, donor: &ManagedAddress) -> SingleValueMapper<BigUint>;
```

### Fund Flow Diagram

```
                    CAMPAIGN ACTIVE
                   (before deadline)
                         │
                   User calls fund()
                         │
              ┌──────────▼──────────┐
              │   require! checks   │
              │  • time < deadline  │
              │  • payment > 0      │
              └──────────┬──────────┘
                         │ passes
              ┌──────────▼──────────┐
              │  Update storage     │
              │  donations[caller]  │
              │  += payment         │
              │  totalFunds += payment│
              └──────────┬──────────┘
                         │
                  EGLD locked in contract
                         │
              ┌──────────▼──────────┐
         AFTER DEADLINE             │
              │                     │
    ┌─────────▼──────┐    ┌────────▼────────┐
    │ target reached │    │ target NOT reached│
    └─────────┬──────┘    └────────┬─────────┘
              │                    │
    ┌─────────▼──────┐    ┌────────▼─────────┐
    │  Owner calls   │    │ Contributors call │
    │   claim()      │    │    refund()       │
    └─────────┬──────┘    └────────┬──────────┘
              │                    │
    ┌─────────▼──────┐    ┌────────▼──────────┐
    │ All EGLD sent  │    │ Each contributor  │
    │ to owner       │    │ gets exact amount │
    └────────────────┘    │ back              │
                          └───────────────────┘
```

### Security Considerations

**Double-refund prevention:** The donation amount is zeroed *before* the transfer:
```rust
self.donations(&caller).set(BigUint::zero()); // zero first
self.send().direct_egld(&caller, &donated);   // then transfer
```
This prevents reentrancy-style attacks where a malicious contract could call `refund` repeatedly before the storage update.

**Access control on `claim`:** Only the contract deployer (owner) can withdraw funds:
```rust
require!(caller == owner, "Only the owner can claim");
```

**Denomination:** All EGLD amounts use 18 decimal places (denomination). 1 EGLD = 1,000,000,000,000,000,000. This avoids floating-point arithmetic errors in financial calculations.

---

## 🌐 Deployed Contract

| Property | Value |
|----------|-------|
| **Network** | MultiversX Devnet |
| **Contract Address** | `erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce` |
| **Owner Address** | `erd1553chpucppq9spcuqqdsxnvnjd3f4r7lwsr4az55tmy37heq3vgseu47zu` |
| **Funding Target** | 5 EGLD |
| **Deadline** | 15 January 2027 (Unix: 1800000000) |
| **Explorer** | [View on Devnet Explorer](https://devnet-explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce) |

### Interact via CLI

```bash
# Donate 0.5 EGLD to the campaign
mxpy contract call erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce \
  --pem ~/greenfund/wallet.pem \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D \
  --function fund \
  --value 500000000000000000 \
  --gas-limit 10000000 \
  --send

# Claim funds (owner only, after deadline if target reached)
mxpy contract call erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce \
  --pem ~/greenfund/wallet.pem \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D \
  --function claim \
  --gas-limit 10000000 \
  --send

# Refund (after deadline if target not reached)
mxpy contract call erd1qqqqqqqqqqqqqpgq0hlyms5qlcf5ly2z6t9vs2p30mqu0h9z3vgsad2rce \
  --pem ~/greenfund/wallet.pem \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D \
  --function refund \
  --gas-limit 10000000 \
  --send
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | Rust + multiversx-sc 0.54 | On-chain business logic |
| Compilation target | wasm32-unknown-unknown | WebAssembly bytecode for VM |
| Build tooling | sc-meta, mxpy | Contract compilation and deployment |
| Frontend framework | React 19 + Vite 8 | User interface |
| Styling | CSS custom properties + Google Fonts | Visual design |
| Blockchain integration | MultiversX REST API | Read contract state, broadcast transactions |
| Wallet | MultiversX Web Wallet (hook protocol) | User authentication and transaction signing |
| Package manager | npm | Frontend dependency management |

---

## 📚 Resources

- [MultiversX Developer Documentation](https://docs.multiversx.com)
- [multiversx-sc Framework](https://docs.multiversx.com/developers/smart-contracts)
- [MultiversX Devnet Explorer](https://devnet-explorer.multiversx.com)
- [Devnet Faucet](https://devnet-wallet.multiversx.com/faucet)
- [MultiversX Builders Tutorials](https://multiversx.com/builders/tutorials)

---

## 👩‍💻 Authors

Academic project developed for the **Blockchain, Money & FinTech** course.

- Smart contract development & deployment
- Frontend integration with blockchain
- UI/UX design & React components

---

*Built on MultiversX Devnet · 2026 · Academic Project*
