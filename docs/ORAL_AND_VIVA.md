# Oral Presentation (no slides, ~4 minutes) and Viva

## Spoken explanation
**1. What it does.** CampusPass sells college event tickets on Ethereum. An organizer creates an event with a price and capacity; students buy tickets with test ETH; at the door the organizer redeems the ticket once.

**2. Why blockchain.** Ticket ownership and "already used" status sit in a smart contract that nobody can quietly edit. Anyone can verify a ticket independently, and a forged screenshot is worthless because the contract is the source of truth.

**3. MetaMask.** MetaMask holds the user's keys. Our app never sees a private key or seed phrase; it only asks MetaMask to sign a transaction, and the user approves each one.

**4. Purchase.** `purchaseTicket(eventId)` checks the event is active and not past its date, tickets remain, and the payment equals the price exactly. It updates sold count and revenue first, then mints an ERC-721 ticket to the buyer and emits `TicketPurchased`.

**5. Redemption.** `redeemTicket` checks the ticket exists, that the caller is that event's organizer, and that its redeemed flag is false; then it sets the flag permanently. A second attempt reverts. We keep the NFT so history stays on-chain.

**6. Revenue.** Money stays in the contract per event. The organizer calls `withdrawRevenue`; the contract sets the balance to zero before sending (checks-effects-interactions) and uses a reentrancy guard, so it can't be withdrawn twice.

**7. Testnet.** Sepolia uses worthless test ETH, so we can show real wallet and gas behavior without risking money.

**8. Tested.** 21 automated Hardhat tests: creation, purchase, overselling, wrong payment, redemption, duplicates, unauthorized calls, withdrawal, cancellation and refund, plus a full journey. The frontend builds; a scripted local journey passed.

**9. Limitations.** One organizer (the deployer) in v1, no built-in QR scanner, not audited, and the browser and Sepolia run must be shown live (state honestly what you have run).

## Viva questions
1. **What is a smart contract?** Code stored on the blockchain that runs exactly as written when called and holds its own state and ETH.
2. **Why Solidity?** It is the main language for Ethereum smart contracts; compiles to EVM bytecode.
3. **What is gas?** The fee for computation and storage on Ethereum, paid in ETH; failed transactions still cost gas.
4. **What does MetaMask do?** Stores keys, shows the user each transaction, signs it, and sends it to the network through an RPC.
5. **What is ERC-721?** A standard for unique tokens, each with its own ID and one owner. Each ticket is one token.
6. **Why ERC-721 and not ERC-20?** Tickets are unique and non-interchangeable; ERC-20 tokens are identical.
7. **What are smart-contract events?** Logs emitted by the contract (e.g. `TicketPurchased`); cheap, indexed, and read by the frontend or explorers.
8. **How is access control done?** `Ownable` for event creation, plus a check that `msg.sender` equals the event's organizer for redeem, cancel, and withdraw. The contract enforces it, not the UI.
9. **What is a transaction hash?** A unique ID of a transaction; paste it in Etherscan to see status, gas, and logs.
10. **What is a testnet?** A network that mimics Ethereum with valueless ETH for development.
11. **How is duplicate redemption stopped?** A `redeemed` flag per ticket is checked and set in the contract; the second call reverts with `AlreadyRedeemed`.
12. **What is reentrancy?** A malicious contract calling back into yours before state updates finish. We update state first and use `ReentrancyGuard`.
13. **What is checks-effects-interactions?** Validate, then update state, then send ETH or call others.
14. **Why pull payments?** The organizer withdraws on demand, so a failing recipient cannot block ticket sales.
15. **Why can the QR be public?** It holds only a verification URL with the ticket ID. Authority comes from the contract, and only the organizer can redeem.
16. **Does owning the NFT mean entry is valid?** No; the redeemed flag, cancellation, and refund status also matter.
17. **What happens when an event is cancelled?** Sales stop, the organizer can't withdraw, and each ticket owner claims a refund once.
18. **What is an ABI?** The contract's interface description that ethers.js uses to encode calls.
19. **Provider vs signer in ethers?** A provider reads the chain; a signer can also sign and send transactions.
20. **Why wait for the receipt?** A submitted transaction can still revert; only the receipt (status 1) proves success.
