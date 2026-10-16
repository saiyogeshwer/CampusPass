// End-to-end smoke test against a running node: create -> buy -> redeem -> duplicate -> withdraw.
const hre = require("hardhat");
const fs = require("fs");
async function main() {
  const { ethers } = hre;
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const { address } = JSON.parse(fs.readFileSync(`frontend/src/contracts/deployment.${chainId}.json`));
  const [organizer, student] = await ethers.getSigners();
  const cp = await ethers.getContractAt("CampusPass", address);
  const price = ethers.parseEther("0.01");
  const date = (await ethers.provider.getBlock("latest")).timestamp + 7 * 86400;

  let tx = await cp.createEvent("HackFest 2026", "24-hour hackathon", date, "Main Auditorium", price, 100);
  console.log("createEvent tx:", tx.hash); await tx.wait();
  const id = Number(await cp.getTotalEvents()) - 1;
  tx = await cp.connect(student).purchaseTicket(id, { value: price });
  console.log("purchaseTicket tx:", tx.hash); await tx.wait();
  const t = Number(await cp.totalTickets());
  const [ev, owner, redeemed] = await cp.getTicketDetails(t);
  console.log(`ticket #${t}: event ${ev}, owner ${owner}, redeemed ${redeemed}`);
  tx = await cp.redeemTicket(t); await tx.wait(); console.log("redeemTicket tx:", tx.hash, "-> redeemed:", await cp.isTicketRedeemed(t));
  try { await cp.redeemTicket(t); console.log("ERROR: duplicate redeem succeeded"); } catch (e) { console.log("duplicate redeem rejected:", e.revert?.name ?? e.shortMessage); }
  try { await cp.connect(student).redeemTicket(t); } catch (e) { console.log("unauthorized redeem rejected:", e.revert?.name ?? e.shortMessage); }
  const before = await ethers.provider.getBalance(organizer.address);
  tx = await cp.withdrawRevenue(id); const r = await tx.wait();
  const after = await ethers.provider.getBalance(organizer.address);
  console.log("withdrawRevenue tx:", tx.hash, "net gain (wei):", (after - before).toString(), "gas cost (wei):", (r.gasUsed * r.gasPrice).toString());
  console.log("revenue now:", (await cp.getEventRevenue(id)).toString());
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
