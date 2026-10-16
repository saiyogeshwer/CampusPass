import { useCallback, useEffect, useState } from "react";
import { loadEvents, type EventData } from "../utils/chain";
import EventCard from "../components/EventCard";
import { eth } from "../utils/format";
import type { CP } from "../hooks/useCampusPass";

export default function Events({ cp }: { cp: CP }) {
  const [events, setEvents] = useState<EventData[] | null>(null);
  const [preview, setPreview] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cp.read) return;
    try { setEvents(await loadEvents(cp.read)); setError(null); } catch { setError("Could not load events from the contract."); }
  }, [cp.read]);
  useEffect(() => { refresh(); }, [refresh]);

  const buy = async () => { if (!preview) return; const id = preview.id, price = preview.price;
    await cp.run(`Buy ticket for ${preview.name}`, (c) => c.purchaseTicket(id, { value: price }), () => { setPreview(null); refresh(); }); };

  if (error) return <p className="err">{error}</p>;
  if (!events) return <p>Loading events…</p>;
  if (!events.length) return <div className="empty"><h3>No events yet</h3><p>The organizer has not published any events.</p></div>;
  return (
    <>
      <h2>Upcoming events</h2>
      <div className="grid">{events.map((e) => {
        const closed = e.cancelled || Number(e.date) * 1000 <= Date.now() || e.sold >= e.maxTickets;
        return <EventCard key={e.id} e={e} action={<button disabled={closed || cp.pending} onClick={() => setPreview(e)}>Purchase Ticket</button>} />;
      })}</div>
      {preview && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Transaction preview">
          <div className="modal-box">
            <h3>Review purchase</h3>
            <dl><dt>Event</dt><dd>{preview.name}</dd><dt>Ticket price</dt><dd>{eth(preview.price)}</dd><dt>You will pay</dt><dd><strong>{eth(preview.price)}</strong> + network gas</dd></dl>
            <p className="small">MetaMask will ask you to confirm. Nothing is sent until you approve.</p>
            <div className="row"><button disabled={cp.pending} onClick={buy}>{cp.pending ? "Pending…" : "Confirm in MetaMask"}</button>
              <button className="ghost" disabled={cp.pending} onClick={() => setPreview(null)}>Cancel</button></div>
          </div>
        </div>)}
    </>
  );
}
