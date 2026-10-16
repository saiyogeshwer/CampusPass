import { useCallback, useEffect, useState } from "react";
import { loadEvents, loadTicket, type EventData, type TicketData } from "../utils/chain";
import TicketCard from "../components/TicketCard";
import type { CP } from "../hooks/useCampusPass";
import type { Wallet } from "../hooks/useWallet";

export default function MyTickets({ cp, w }: { cp: CP; w: Wallet }) {
  const [tickets, setTickets] = useState<TicketData[] | null>(null);
  const [events, setEvents] = useState<Record<number, EventData>>({});
  const [hashes, setHashes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cp.read || !w.account) return;
    try {
      const total = Number(await cp.read.totalTickets());
      const all = await Promise.all(Array.from({ length: total }, (_, i) => loadTicket(cp.read!, i + 1)));
      const mine = all.filter((t) => t.owner.toLowerCase() === w.account!.toLowerCase());
      setTickets(mine);
      setEvents(Object.fromEntries((await loadEvents(cp.read)).map((e) => [e.id, e])));
      // Purchase tx hashes come from TicketPurchased logs for this buyer.
      const logs = await cp.read.queryFilter(cp.read.filters.TicketPurchased(null, null, w.account), 0, "latest");
      setHashes(Object.fromEntries(logs.map((l: any) => [Number(l.args.ticketId), l.transactionHash])));
      setError(null);
    } catch { setError("Could not load your tickets."); }
  }, [cp.read, w.account]);
  useEffect(() => { refresh(); }, [refresh]);

  if (error) return <p className="err">{error}</p>;
  if (!tickets) return <p>Loading your tickets…</p>;
  if (!tickets.length) return <div className="empty"><h3>No tickets yet</h3><p>Buy a ticket from the <a href="#/events">Events</a> page.</p></div>;
  return (<><h2>My tickets</h2><div className="grid">{tickets.map((t) => <TicketCard key={t.id} t={t} e={events[t.eventId]} txHash={hashes[t.id]} chainId={w.chainId!} />)}</div></>);
}
