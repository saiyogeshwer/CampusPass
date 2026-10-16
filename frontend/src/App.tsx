import { useEffect, useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useCampusPass } from "./hooks/useCampusPass";
import Navbar from "./components/Navbar";
import Gate from "./components/Gate";
import TransactionStatus from "./components/TransactionStatus";
import Home from "./pages/Home";
import Events from "./pages/Events";
import MyTickets from "./pages/MyTickets";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import VerifyTicket from "./pages/VerifyTicket";

const parse = () => { const [, page = "", arg] = window.location.hash.replace(/^#/, "").split("/"); return { page, arg }; };

export default function App() {
  const w = useWallet();
  const cp = useCampusPass(w);
  const [r, setR] = useState(parse());
  useEffect(() => { const f = () => setR(parse()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);

  const page = r.page === "events" ? <Events cp={cp} />
    : r.page === "tickets" ? <MyTickets cp={cp} w={w} />
    : r.page === "organizer" ? <OrganizerDashboard cp={cp} w={w} />
    : r.page === "verify" ? <VerifyTicket cp={cp} w={w} initialId={r.arg} />
    : null;

  return (
    <>
      <Navbar w={w} route={r.page} />
      <main>
        <TransactionStatus tx={cp.tx} onClose={cp.resetTx} />
        {page ? <Gate w={w} cp={cp}>{page}</Gate> : <Home />}
      </main>
      <footer>Testnet only · never share your seed phrase · CampusPass</footer>
    </>
  );
}
