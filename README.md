
# CampusPass — Decentralized Campus Event Ticketing

Organizers publish events; students buy ERC-721 tickets with Sepolia test ETH; the organizer verifies and redeems tickets once. Ownership and redemption live on-chain.

**Stack:** Solidity 0.8.24 · OpenZeppelin 5 (ERC721, Ownable, ReentrancyGuard) · Hardhat 2 · React 18 + Vite + TypeScript · ethers v6 · MetaMask · Sepolia.

## 1. Prerequisites
- Node.js 18+ (built and tested on Node 22), npm, Git
- MetaMask browser extension
- For Sepolia: an RPC URL (Alchemy/Infura) and a **dedicated test wallet** funded with Sepolia ETH from a faucet

## 2. Install
```bash
npm install --legacy-peer-deps          # Hardhat + toolbox
npm install --prefix frontend --legacy-peer-deps
```

## 3. Compile and test (no network needed)
```bash
npx hardhat compile
npx hardhat test
```
If your network blocks `binaries.soliditylang.org`, prefix commands with `USE_SOLCJS=1` (uses the npm `solc` package).

## 4. Run locally
```bash
npx hardhat node                                       # terminal 1: local chain (chainId 31337)
npx hardhat run scripts/deploy.js --network localhost  # terminal 2: deploy, writes ABI + address to frontend
npm run frontend:dev                                   # terminal 2: open the printed URL
```
In `frontend/.env` (copy from `.env.example`) set `VITE_CHAIN_ID=31337` for local use.
MetaMask: Add network → RPC `http://127.0.0.1:8545`, chain ID `31337`, symbol ETH. Import one of the printed Hardhat test private keys (**local test keys only**). Account #0 is the deployer/organizer.

Optional scripted journey: `npx hardhat run scripts/demo.js --network localhost`.

## 5. Sepolia deployment
```bash
cp .env.example .env     # fill SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY (test wallet only)
npx hardhat run scripts/deploy.js --network sepolia
```
The script refuses mainnet and checks chain ID 11155111. It writes `frontend/src/contracts/deployment.11155111.json`. Then set `VITE_CHAIN_ID=11155111` (default) and run the frontend. Verify transactions at `https://sepolia.etherscan.io/tx/<hash>`.
Optional source verification: `npx hardhat verify --network sepolia <address>` (needs `ETHERSCAN_API_KEY`).

## 6. Using the app
1. **Organizer wallet** (deployer): Organizer page → create event.
2. **Student wallet**: Events → Purchase Ticket → review preview → confirm in MetaMask.
3. My Tickets shows the NFT ticket, QR (a verification URL with the ticket ID), tx hash, explorer link.
4. Organizer: Verify page → ticket ID → Redeem. A second attempt is rejected by the contract.
5. Organizer: Withdraw proceeds.

## Design rules (contract)
- Only the deployer (`Ownable`) creates events; only that event's organizer redeems, cancels, withdraws.
- Exact payment required; sales close at the event time; no overselling.
- Pull payments: `withdrawRevenue` zeroes the balance *before* sending; failed sends revert.
- Cancelled events: organizer cannot withdraw; each ticket owner calls `claimRefund` once.
- Redemption never burns the NFT.

## Troubleshooting
| Problem | Fix |
|---|---|
| `HH801 requires dependencies` | Install with `--legacy-peer-deps` as above |
| Compiler download fails | `USE_SOLCJS=1` |
| "Contract not found" in UI | Deploy for the network MetaMask is on; restart `npm run dev` |
| Wrong network banner | Click the Switch button; check `VITE_CHAIN_ID` |
| MetaMask nonce errors after restarting local node | Settings → Advanced → Clear activity tab data |
| Insufficient funds on Sepolia | Use a Sepolia faucet for the test wallet |

## Limitations
Single organizer (deployer) in v1; no in-browser QR scanner (phone camera opens the verify URL); not audited — passing tests do not make it production-safe.
=======
