import { QRCodeSVG } from "qrcode.react";
import type { EventData, TicketData } from "../utils/chain";
import { fmtDate, shortAddress } from "../utils/format";
import { txUrl } from "../contracts/contractConfig";

export default function TicketCard({ t, e, txHash, chainId }: { t: TicketData; e?: EventData; txHash?: string; chainId: number }) {
  // QR only carries a public verification URL containing the ticket ID. No keys, no secrets.
  const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify/${t.id}`;
  const url = txHash ? txUrl(txHash, chainId) : null;
  return (
    <article className="card ticket">
      <div>
        <div className="card-top"><h3>Ticket #{t.id}</h3>
          <span className={`badge ${t.refunded ? "bad" : t.redeemed ? "" : "good"}`}>{t.refunded ? "Refunded" : t.redeemed ? "Redeemed" : "Valid"}</span></div>
        {e && <><p><strong>{e.name}</strong></p><p className="small">{fmtDate(e.date)} · {e.venue}</p></>}
        <p className="small mono">Owner {shortAddress(t.owner)}</p>
        {txHash && <p className="small mono">Purchase tx {shortAddress(txHash)} {url && <a href={url} target="_blank" rel="noreferrer">Explorer</a>}</p>}
      </div>
      <div className="qr"><QRCodeSVG value={verifyUrl} size={110} /><span className="small">Ticket #{t.id}</span></div>
    </article>
  );
}
