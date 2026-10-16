# CampusPass: A Decentralized Campus Event Ticketing System
*Synopsis Report — Blockchain Project (target: 5 pages)*

---
## 1. Abstract and Problem Statement
**Abstract.** CampusPass is a decentralized application (dApp) for selling and verifying college event tickets on the Ethereum Sepolia testnet. Tickets are ERC-721 tokens minted by a Solidity smart contract; students use MetaMask to pay in test ETH, and the organizer redeems tickets at the venue. Ownership, payment rules and one-time redemption are enforced on-chain.

**Problem.** Campus events usually rely on spreadsheets, screenshots, or third-party platforms. Tickets can be copied, resold twice, or accepted twice at the gate, and the organizer must trust a central database or intermediary.

**Objectives.**
- Let organizers create events with price and capacity.
- Let students buy tickets with their own wallets.
- Make ownership and redemption verifiable on a public ledger.
- Prevent overselling, wrong payments, and duplicate redemption.
- Give organizers pull-based, single-use withdrawal of proceeds.

---
## 2. Proposed System and Architecture
**Existing limitations.** Central databases can be edited or lost; QR codes can be duplicated; platforms charge fees; there is no independent proof of who owns a ticket.

**Proposed solution.** A smart contract is the single source of truth. The React frontend only reads and submits transactions; MetaMask signs them.

**Architecture.**
```
 Student / Organizer  ->  React + Vite UI (ethers.js)  ->  MetaMask (signing)
                                                      |
                                                      v
                                   CampusPass.sol on Sepolia (ERC-721 + events)
                                                      |
                                       Etherscan (transaction verification)
```
**Technology stack.** Solidity 0.8.24, OpenZeppelin 5, Hardhat 2, React 18 + Vite + TypeScript, ethers v6, MetaMask, Ethereum Sepolia, Git.

---
## 3. Implementation
**Smart contract.** `CampusPass` extends `ERC721`, `Ownable` and `ReentrancyGuard`. It stores events (organizer, name, description, date, venue, price, capacity, sold, cancelled) and tickets (event ID, redeemed, refunded).
- `createEvent` — owner only; rejects empty names, past dates, zero quantity or price.
- `purchaseTicket` — requires active event, open sales, remaining stock, exact payment; updates state, then safe-mints.
- `redeemTicket` — event organizer only; sets a permanent flag; no burn.
- `withdrawRevenue` — organizer only; zeroes balance before transferring; reverts on failed transfer.
- `cancelEvent` / `claimRefund` — buyers pull refunds once each; organizer cannot withdraw cancelled-event funds.
- Events: `EventCreated`, `TicketPurchased`, `TicketRedeemed`, `EventCancelled`, `RevenueWithdrawn`, `TicketRefunded`.

**Wallet integration.** `useWallet` connects MetaMask, shows a shortened address and ETH balance, reacts to account and network changes, offers a switch-to-Sepolia button, and supports an app-level disconnect. No keys are requested or stored.

**Frontend integration.** One config file holds ABI, chain ID, address and explorer links. Reads use the provider; writes use the signer. Every write moves through: waiting for wallet → submitted → confirming → confirmed/failed, shows the hash and explorer link, and blocks duplicate submits. Pages: Events (with purchase preview), My Tickets (QR of a verification URL), Organizer Dashboard, Verify Ticket.

**Deployment process.** `scripts/deploy.js` checks the network and chain ID, refuses mainnet, deploys, and writes the ABI and address for the frontend. Sepolia credentials live only in a local `.env`.

---
## 4. Testing and Results
**Automated tests (executed):** 21 Hardhat tests, all passing, covering event creation, purchasing (ownership, inventory, short/excess payment, overselling, expired/cancelled), redemption (duplicate, unauthorized, nonexistent), withdrawal (unauthorized, double, failed transfer), cancellation/refund, and a full user journey.

**Local run (executed):** a scripted journey on a local Hardhat node created an event, bought ticket #1 from a second account, redeemed it, saw duplicate and unauthorized redemption rejected, and withdrew revenue to zero balance.

**Frontend build (executed):** TypeScript type-check and production build succeeded.

**Screenshots:** *[PLACEHOLDER — wallet connected]* *[PLACEHOLDER — event marketplace]* *[PLACEHOLDER — My Tickets with QR]* *[PLACEHOLDER — verification and redemption]* *[PLACEHOLDER — Etherscan transaction]*

**Transaction verification (PENDING):** Sepolia deployment address and transaction hashes will be inserted here after deployment. Contract address: *[pending]*. Purchase tx: *[pending]*. Redeem tx: *[pending]*.

---
## 5. Conclusion and Future Scope
**Results.** The contract enforces payment, stock, ownership, organizer permissions and single redemption, and the tests pass locally. Sepolia deployment and browser demonstration are pending at the time of writing.

**Limitations.** Single organizer (deployer) in v1; no built-in QR scanner; tickets are transferable NFTs, so resale rules are not restricted; refunds are manual per ticket; the contract has not been professionally audited.

**Future enhancements.** Multiple organizers with roles, in-browser QR scanning, resale price caps, metadata/images for tickets, indexing with The Graph, batch purchase.

**References.**
1. Ethereum.org developer documentation.
2. OpenZeppelin Contracts 5.x documentation (ERC721, Ownable, ReentrancyGuard).
3. Hardhat documentation, hardhat.org.
4. ethers.js v6 documentation.
5. EIP-721: Non-Fungible Token Standard.
6. MetaMask developer documentation.
