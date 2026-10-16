import type { Contract } from "ethers";
export type EventData = { id: number; organizer: string; name: string; description: string; date: bigint; venue: string;
  price: bigint; maxTickets: number; sold: number; cancelled: boolean };
export type TicketData = { id: number; eventId: number; owner: string; redeemed: boolean; refunded: boolean };

export const toEvent = (e: any): EventData => ({ id: Number(e.id), organizer: e.organizer, name: e.name, description: e.description,
  date: e.date, venue: e.venue, price: e.price, maxTickets: Number(e.maxTickets), sold: Number(e.sold), cancelled: e.cancelled });

export async function loadEvents(c: Contract): Promise<EventData[]> {
  const n = Number(await c.getTotalEvents());
  return (await Promise.all(Array.from({ length: n }, (_, i) => c.getEventDetails(i)))).map(toEvent).reverse();
}
export async function loadTicket(c: Contract, id: number): Promise<TicketData> {
  const [eventId, owner, redeemed, refunded] = await c.getTicketDetails(id);
  return { id, eventId: Number(eventId), owner, redeemed, refunded };
}
