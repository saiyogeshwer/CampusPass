import type { EventData } from "../utils/chain";
import { eth, fmtDate, shortAddress } from "../utils/format";

export default function EventCard({ e, action }: { e: EventData; action?: React.ReactNode }) {
  const left = e.maxTickets - e.sold;
  const closed = e.cancelled || Number(e.date) * 1000 <= Date.now();
  return (
    <article className="card">
      <div className="card-top"><h3>{e.name}</h3>
        {e.cancelled ? <span className="badge bad">Cancelled</span> : closed ? <span className="badge">Closed</span> : left === 0 ? <span className="badge bad">Sold out</span> : <span className="badge good">On sale</span>}
      </div>
      <p>{e.description}</p>
      <dl>
        <dt>When</dt><dd>{fmtDate(e.date)}</dd>
        <dt>Venue</dt><dd>{e.venue}</dd>
        <dt>Price</dt><dd>{eth(e.price)}</dd>
        <dt>Tickets left</dt><dd>{left} / {e.maxTickets}</dd>
        <dt>Organizer</dt><dd className="mono">{shortAddress(e.organizer)}</dd>
      </dl>
      {action}
    </article>
  );
}
