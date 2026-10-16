# Test Report (actual results)

Environment: Node v22.22.2, Hardhat 2.22.17, Solidity 0.8.24 (solc-js), OpenZeppelin 5.0.2, local Hardhat network.

## Automated contract tests — `npx hardhat test`
**Result: 21 passing, 0 failing.**

| Area | Tests | Result |
|---|---|---|
| Event creation | create; invalid name/date/quantity/price rejected; non-owner create/cancel rejected; unknown id | Pass (4) |
| Purchasing | success + ownership + inventory + revenue; short/excess payment rejected; no overselling; expired and cancelled rejected; nonexistent event | Pass (5) |
| Redemption | organizer redeems (NFT kept); duplicate rejected; stranger and ticket owner rejected; nonexistent ticket | Pass (4) |
| Withdrawal | withdraw + balances; event emitted; unauthorized rejected; second withdrawal rejected; failed transfer reverts with accounting intact | Pass (5) |
| Cancellation | refund once, organizer blocked from cancelled funds; refund rejected on active event | Pass (2) |
| Integration | deploy → create → buy → read → redeem → duplicate → withdraw → final balances | Pass (1) |

## Local deployment and scripted journey (`scripts/deploy.js`, `scripts/demo.js`)
Local node chainId 31337. Deployed address `0x5FbDB2315678afecb367f032d93F642f64180aa3` (the standard first-deployment address on a fresh Hardhat node; local only). Journey executed: createEvent, purchaseTicket (ticket #1 owned by account #1), redeemTicket (status true), duplicate redeem rejected, unauthorized redeem rejected, withdrawRevenue (revenue 0 afterwards). See `docs/demo-output.txt`.

## Frontend
`npm run build` in `frontend/`: TypeScript type-check and Vite production build succeeded.

## NOT yet verified (pending)
- Browser/MetaMask run-through of the UI (wallet connect, network switch, purchase preview, QR link) — requires a browser with MetaMask.
- Sepolia deployment and explorer verification — requires RPC URL, test wallet and Sepolia ETH. No Sepolia address or transaction exists yet.
- Screenshots.
