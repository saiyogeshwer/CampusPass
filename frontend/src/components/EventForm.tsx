import { useState } from "react";
import { parseEther } from "ethers";

export type NewEvent = { name: string; description: string; date: number; venue: string; price: bigint; qty: number };

export default function EventForm({ busy, onSubmit }: { busy: boolean; onSubmit: (e: NewEvent) => Promise<boolean> }) {
  const [f, setF] = useState({ name: "", description: "", date: "", venue: "", price: "", qty: "" });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setErr(null);
    if (!f.name.trim()) return setErr("Event name is required.");
    const ts = Math.floor(new Date(f.date).getTime() / 1000);
    if (!f.date || Number.isNaN(ts) || ts * 1000 <= Date.now()) return setErr("Choose a valid future date and time.");
    if (!f.venue.trim()) return setErr("Venue is required.");
    let price: bigint;
    try { price = parseEther(f.price || "0"); } catch { return setErr("Price is not a valid number."); }
    if (price <= 0n) return setErr("Price must be greater than 0.");
    const qty = Number(f.qty);
    if (!Number.isInteger(qty) || qty < 1) return setErr("Quantity must be a whole number of at least 1.");
    if (await onSubmit({ name: f.name.trim(), description: f.description.trim(), date: ts, venue: f.venue.trim(), price, qty }))
      setF({ name: "", description: "", date: "", venue: "", price: "", qty: "" });
  };
  return (
    <form className="form" onSubmit={submit} noValidate>
      <label>Event name<input value={f.name} onChange={set("name")} /></label>
      <label>Description<textarea value={f.description} onChange={set("description")} rows={3} /></label>
      <label>Date &amp; time<input type="datetime-local" value={f.date} onChange={set("date")} /></label>
      <label>Venue<input value={f.venue} onChange={set("venue")} /></label>
      <div className="row">
        <label>Ticket price (ETH)<input inputMode="decimal" value={f.price} onChange={set("price")} placeholder="0.01" /></label>
        <label>Max tickets<input inputMode="numeric" value={f.qty} onChange={set("qty")} placeholder="100" /></label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <button disabled={busy}>{busy ? "Transaction pending…" : "Create event"}</button>
    </form>
  );
}
