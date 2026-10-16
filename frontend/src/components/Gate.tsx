import type { Wallet } from "../hooks/useWallet";
import type { CP } from "../hooks/useCampusPass";
import { chainName, TARGET_CHAIN_ID } from "../contracts/contractConfig";

/** Shows a clear message until wallet + network + deployed contract are all ready. */
export default function Gate({ w, cp, children }: { w: Wallet; cp: CP; children: React.ReactNode }) {
  if (!w.account) return <div className="empty"><h3>Connect your wallet</h3><p>Use MetaMask to continue.</p><button onClick={w.connect}>Connect Wallet</button>{w.error && <p className="err">{w.error}</p>}</div>;
  if (w.wrongNetwork) return <div className="empty"><h3>Wrong network</h3><p>Please switch MetaMask to {chainName(TARGET_CHAIN_ID)}.</p><button className="warn" onClick={w.switchNetwork}>Switch to {chainName(TARGET_CHAIN_ID)}</button></div>;
  if (!cp.address) return <div className="empty"><h3>Contract not found</h3><p>No CampusPass deployment is configured for this network. Deploy it and restart the frontend.</p></div>;
  return <>{children}</>;
}
