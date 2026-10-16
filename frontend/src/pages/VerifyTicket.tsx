import { useCallback, useEffect, useState } from "react";
import { loadEvents, loadTicket, toEvent, type EventData, type TicketData } from "../utils/chain";
import EventCard from "../components/EventCard";
import { shortAddress } from "../utils/format";
import type { CP } from "../hooks/useCampusPass";
import type { Wallet } from "../hooks/useWallet";

type Result = { kind: "none" } | { kind: "ok"; t: TicketData; e: EventData };

export default function VerifyTicket({ cp, w, initialId }: { cp: CP; w: Wallet; initialId?: string }) {
  const [input, setInput] = useState(initialId ?? "");
  const [expectedEvent, setExpectedEvent] = useState<string>(""); // optional: event the gate is checking for
  const [events, setEvents] = useState<EventData[]>([]);
  const [res, setRes] = useState<Result | null>(null);
  const [owner, setOwner] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (cp.read) { loadEvents(cp.read).then(setEvents).catch(() => {}); cp.read.owner().then(setOwner).catch(() => {}); } }, [cp.read]);

  const lookup = useCallback(async (raw = input) => {
    if (!cp.read) return; setMsg(null); setRes(null);
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) return setMsg("Enter a valid ticket ID (whole number, 1 or more).");
    try {
      const t = await loadTicket(cp.read, id);
      const e = toEvent(await cp.read.getEventDetails(t.eventId));
      setRes({ kind: "ok", t, e });
    } catch { setRes({ kind: "none" }); }
  }, [cp.read, input]);
  useEffect(() => { if (initialId && cp.read) lookup(initialId); /* deep link from QR */ }, [initialId, cp.read]); // eslint-disable-line

  const isOrganizer = !!w.account && owner.toLowerCase() === w.account.toLowerCase();
  let status = ""; let cls = "";
  if (res?.kind === "none") { status = "Ticket does not exist"; cls = "bad"; }
  else if (res?.kind === "ok") {
    if (expectedEvent !== "" && Number(expectedEvent) !== res.t.eventId) { status = `Wrong event — this ticket is for "${res.e.name}"`; cls = "bad"; }
    else if (res.t.refunded) { status = "Refunded — not valid"; cls = "bad"; }
    else if (res.t.redeemed) { status = "Already redeemed"; cls = "bad"; }
    else if (res.e.cancelled) { status = "Event cancelled"; cls = "bad"; }
    else { status = "Valid ticket"; cls = "good"; }
  }
  const redeem = async () => { if (res?.kind !== "ok") return; const id = res.t.id;
    await cp.run(`Redeem ticket #${id}`, (c) => c.redeemTicket(id), () => lookup(String(id))); };

  return (
    <>
      <h2>Verify ticket</h2>
      <p className="small">Data below is read live from the smart contract, not from the QR image.</p>
      <div className="form">
        <label>Ticket ID<input inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} /></label>
        <label>Expected event (optional)
          <select value={expectedEvent} onChange={(e) => setExpectedEvent(e.target.value)}>
            <option value="">Any event</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
        <button onClick={() => lookup()}>Check ticket</button>
        {msg && <p className="err" role="alert">{msg}</p>}
      </div>
      {res && <div className="result"><div className={`status ${cls}`}>{status}</div>
        {res.kind === "ok" && <>
          <p className="small mono">Ticket #{res.t.id} · owner {shortAddress(res.t.owner)}</p>
          <EventCard e={res.e} />
          {isOrganizer
            ? <button disabled={cp.pending || res.t.redeemed || res.t.refunded || res.e.cancelled} onClick={redeem}>{cp.pending ? "Pending…" : "Redeem ticket"}</button>
            : <p className="warnbox">Only the organizer wallet can redeem tickets.</p>}
        </>}</div>}
    </>
  );
}
