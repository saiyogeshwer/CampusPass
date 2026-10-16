import { useCallback, useEffect, useState } from "react";
import { loadEvents, type EventData } from "../utils/chain";
import EventCard from "../components/EventCard";
import EventForm, { type NewEvent } from "../components/EventForm";
import { eth, shortAddress } from "../utils/format";
import type { CP } from "../hooks/useCampusPass";
import type { Wallet } from "../hooks/useWallet";

export default function OrganizerDashboard({ cp, w }: { cp: CP; w: Wallet }) {
  const [owner, setOwner] = useState<string>("");
  const [events, setEvents] = useState<EventData[] | null>(null);
  const [revenue, setRevenue] = useState<Record<number, bigint>>({});

  const refresh = useCallback(async () => {
    if (!cp.read) return;
    setOwner(await cp.read.owner());
    const list = await loadEvents(cp.read);
    setEvents(list);
    setRevenue(Object.fromEntries(await Promise.all(list.map(async (e) => [e.id, (await cp.read!.getEventRevenue(e.id)) as bigint]))));
  }, [cp.read]);
  useEffect(() => { refresh().catch(() => setEvents([])); }, [refresh]);

  const isOrganizer = !!w.account && owner.toLowerCase() === w.account.toLowerCase();
  const create = (n: NewEvent) => cp.run("Create event", (c) => c.createEvent(n.name, n.description, n.date, n.venue, n.price, n.qty), refresh);

  return (
    <>
      <h2>Organizer dashboard</h2>
      <p className="small">Organizer address: <span className="mono">{owner || "…"}</span> {owner && <>({shortAddress(owner)})</>}</p>
      {!isOrganizer && <p className="warnbox">Your wallet is not the organizer. You can view events, but create / withdraw / cancel are disabled (and the contract would reject them).</p>}
      <div className="two">
        <div><h3>Create event</h3>{isOrganizer ? <EventForm busy={cp.pending} onSubmit={create} /> : <p>Connect the organizer wallet to create events.</p>}</div>
        <div><h3>Published events</h3>
          {!events ? <p>Loading…</p> : !events.length ? <div className="empty"><p>No events published yet.</p></div> :
            events.map((e) => (
              <EventCard key={e.id} e={e} action={<>
                <p className="small">Sold <strong>{e.sold}</strong> · Remaining <strong>{e.maxTickets - e.sold}</strong> · Withdrawable <strong>{eth(revenue[e.id] ?? 0n)}</strong></p>
                {isOrganizer && <div className="row">
                  <button disabled={cp.pending || e.cancelled || !(revenue[e.id] > 0n)} onClick={() => cp.run("Withdraw proceeds", (c) => c.withdrawRevenue(e.id), refresh)}>Withdraw proceeds</button>
                  <button className="ghost" disabled={cp.pending || e.cancelled} onClick={() => cp.run("Cancel event", (c) => c.cancelEvent(e.id), refresh)}>Cancel event</button>
                </div>}</>} />))}
        </div>
      </div>
      <p className="small">Ticket verification and redemption: <a href="#/verify">Verify page</a>.</p>
    </>
  );
}
