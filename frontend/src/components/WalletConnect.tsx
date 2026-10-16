import type { Wallet } from "../hooks/useWallet";
import { shortAddress, eth } from "../utils/format";
import { chainName, TARGET_CHAIN_ID } from "../contracts/contractConfig";

export default function WalletConnect({ w }: { w: Wallet }) {
  if (!w.account) return <button onClick={w.connect}>Connect Wallet</button>;
  return (
    <div className="wallet">
      <span className="pill" title={w.account}>{shortAddress(w.account)}</span>
      <span className="pill">{eth(w.balance)}</span>
      {w.wrongNetwork
        ? <button className="warn" onClick={w.switchNetwork}>Switch to {chainName(TARGET_CHAIN_ID)}</button>
        : <span className="pill ok">{chainName(w.chainId!)}</span>}
      <button className="ghost" onClick={w.disconnect}>Disconnect</button>
    </div>
  );
}
