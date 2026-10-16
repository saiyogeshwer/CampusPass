// Turns wallet / RPC / contract errors into short, safe messages.
import { Interface } from "ethers";
const FRIENDLY: Record<string, string> = {
  EmptyName: "Event name cannot be empty.", InvalidDate: "Event date must be in the future.",
  InvalidQuantity: "Ticket quantity must be at least 1.", InvalidPrice: "Price must be greater than zero.",
  EventNotFound: "That event does not exist.", EventNotActive: "This event has been cancelled.",
  SalesClosed: "Ticket sales have closed for this event.", SoldOut: "This event is sold out.",
  IncorrectPayment: "Payment must equal the exact ticket price.", TicketNotFound: "That ticket does not exist.",
  NotEventOrganizer: "Only the event organizer can do this.", AlreadyRedeemed: "This ticket was already redeemed (or refunded).",
  NothingToWithdraw: "There are no proceeds to withdraw.", EventIsCancelled: "This event is cancelled.",
  EventNotCancelled: "Refunds are only available for cancelled events.", NotTicketOwner: "You do not own this ticket.",
  AlreadyRefunded: "This ticket was already refunded.", TransferFailed: "ETH transfer failed.",
  OwnableUnauthorizedAccount: "Only the contract owner can do this.",
};
export function friendlyError(e: any, iface?: Interface): string {
  if (e?.code === "ACTION_REJECTED" || e?.info?.error?.code === 4001) return "You rejected the transaction in MetaMask.";
  const data = e?.data ?? e?.error?.data ?? e?.info?.error?.data;
  if (iface && typeof data === "string") {
    try { const p = iface.parseError(data); if (p) return FRIENDLY[p.name] ?? p.name; } catch { /* ignore */ }
  }
  if (e?.code === "INSUFFICIENT_FUNDS") return "Not enough ETH to pay for the ticket plus gas.";
  return (e?.shortMessage ?? e?.reason ?? "Something went wrong. Check the console for details.").toString().slice(0, 160);
}
