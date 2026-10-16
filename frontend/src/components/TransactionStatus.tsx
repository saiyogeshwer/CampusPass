import { txUrl } from "../contracts/contractConfig";
import type { TxState } from "../hooks/useCampusPass";

const TEXT: Record<string, string> = {
  wallet: "Waiting for wallet approval…", submitted: "Transaction submitted", confirming: "Transaction submitted · waiting for confirmation…",
  confirmed: "Confirmed on-chain", failed: "Failed",
};
export default function TransactionStatus({ tx, onClose }: { tx: TxState; onClose: () => void }) {
  if (tx.phase === "idle") return null;
  const url = tx.hash ? txUrl(tx.hash) : null;
  return (
    <div className={`tx tx-${tx.phase}`} role="status" aria-live="polite">
      <div><strong>{TEXT[tx.phase]}</strong>{tx.message && tx.phase !== "failed" ? ` · ${tx.message}` : ""}
        {tx.phase === "failed" && <div>{tx.message}</div>}
        {tx.hash && <div className="mono small">tx: {tx.hash}{url && <> · <a href={url} target="_blank" rel="noreferrer">View on Etherscan</a></>}</div>}
      </div>
      {["confirmed", "failed"].includes(tx.phase) && <button className="ghost" onClick={onClose} aria-label="Dismiss">✕</button>}
    </div>
  );
}
