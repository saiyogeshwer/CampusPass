import WalletConnect from "./WalletConnect";
import type { Wallet } from "../hooks/useWallet";
const LINKS = [["events", "Events"], ["tickets", "My Tickets"], ["organizer", "Organizer"], ["verify", "Verify"]];
export default function Navbar({ w, route }: { w: Wallet; route: string }) {
  return (
    <header className="nav">
      <a className="brand" href="#/">🎟️ CampusPass</a>
      <nav aria-label="Main">{LINKS.map(([k, l]) => <a key={k} href={`#/${k}`} className={route === k ? "active" : ""}>{l}</a>)}</nav>
      <WalletConnect w={w} />
    </header>
  );
}
