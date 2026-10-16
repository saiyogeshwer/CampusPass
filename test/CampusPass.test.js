const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const PRICE = ethers.parseEther("0.01");

async function deployFixture() {
  const [organizer, student, student2, stranger] = await ethers.getSigners();
  const cp = await (await ethers.getContractFactory("CampusPass")).deploy();
  const date = (await time.latest()) + 7 * 24 * 3600;
  return { cp, organizer, student, student2, stranger, date };
}
async function withEventFixture() {
  const f = await deployFixture();
  await f.cp.createEvent("HackFest", "24h hackathon", f.date, "Main Hall", PRICE, 2);
  return f;
}

describe("CampusPass", () => {
  describe("Event creation", () => {
    it("organizer creates an event", async () => {
      const { cp, organizer, date } = await loadFixture(deployFixture);
      await expect(cp.createEvent("HackFest", "d", date, "Hall", PRICE, 100))
        .to.emit(cp, "EventCreated").withArgs(0, organizer.address, "HackFest", date, PRICE, 100);
      expect(await cp.getTotalEvents()).to.equal(1);
      const e = await cp.getEventDetails(0);
      expect(e.name).to.equal("HackFest");
      expect(e.organizer).to.equal(organizer.address);
      expect(e.sold).to.equal(0);
    });
    it("rejects invalid data", async () => {
      const { cp, date } = await loadFixture(deployFixture);
      await expect(cp.createEvent("", "d", date, "v", PRICE, 1)).to.be.revertedWithCustomError(cp, "EmptyName");
      await expect(cp.createEvent("n", "d", 1, "v", PRICE, 1)).to.be.revertedWithCustomError(cp, "InvalidDate");
      await expect(cp.createEvent("n", "d", date, "v", PRICE, 0)).to.be.revertedWithCustomError(cp, "InvalidQuantity");
      await expect(cp.createEvent("n", "d", date, "v", 0, 1)).to.be.revertedWithCustomError(cp, "InvalidPrice");
    });
    it("non-owner cannot create or cancel events", async () => {
      const { cp, stranger, date } = await loadFixture(withEventFixture);
      await expect(cp.connect(stranger).createEvent("x", "d", date, "v", PRICE, 1))
        .to.be.revertedWithCustomError(cp, "OwnableUnauthorizedAccount");
      await expect(cp.connect(stranger).cancelEvent(0)).to.be.revertedWithCustomError(cp, "NotEventOrganizer");
    });
    it("unknown event id reverts", async () => {
      const { cp } = await loadFixture(deployFixture);
      await expect(cp.getEventDetails(5)).to.be.revertedWithCustomError(cp, "EventNotFound");
    });
  });

  describe("Ticket purchasing", () => {
    it("student buys a ticket; ownership and inventory update", async () => {
      const { cp, student } = await loadFixture(withEventFixture);
      await expect(cp.connect(student).purchaseTicket(0, { value: PRICE }))
        .to.emit(cp, "TicketPurchased").withArgs(0, 1, student.address, PRICE);
      expect(await cp.ownerOf(1)).to.equal(student.address);
      const [eventId, owner, redeemed] = await cp.getTicketDetails(1);
      expect(eventId).to.equal(0); expect(owner).to.equal(student.address); expect(redeemed).to.equal(false);
      expect((await cp.getEventDetails(0)).sold).to.equal(1);
      expect(await cp.getEventRevenue(0)).to.equal(PRICE);
    });
    it("rejects insufficient and excess payment (exact-payment policy)", async () => {
      const { cp, student } = await loadFixture(withEventFixture);
      await expect(cp.connect(student).purchaseTicket(0, { value: PRICE - 1n })).to.be.revertedWithCustomError(cp, "IncorrectPayment");
      await expect(cp.connect(student).purchaseTicket(0, { value: PRICE + 1n })).to.be.revertedWithCustomError(cp, "IncorrectPayment");
    });
    it("cannot oversell", async () => {
      const { cp, student, student2, stranger } = await loadFixture(withEventFixture);
      await cp.connect(student).purchaseTicket(0, { value: PRICE });
      await cp.connect(student2).purchaseTicket(0, { value: PRICE });
      await expect(cp.connect(stranger).purchaseTicket(0, { value: PRICE })).to.be.revertedWithCustomError(cp, "SoldOut");
    });
    it("rejects cancelled and expired events", async () => {
      const { cp, student, date } = await loadFixture(withEventFixture);
      await time.increaseTo(date);
      await expect(cp.connect(student).purchaseTicket(0, { value: PRICE })).to.be.revertedWithCustomError(cp, "SalesClosed");
      const f = await deployFixture();
      await f.cp.createEvent("E", "d", f.date, "v", PRICE, 5);
      await f.cp.cancelEvent(0);
      await expect(f.cp.connect(f.student).purchaseTicket(0, { value: PRICE })).to.be.revertedWithCustomError(f.cp, "EventNotActive");
    });
    it("rejects nonexistent event", async () => {
      const { cp, student } = await loadFixture(deployFixture);
      await expect(cp.connect(student).purchaseTicket(9, { value: PRICE })).to.be.revertedWithCustomError(cp, "EventNotFound");
    });
  });

  describe("Ticket redemption", () => {
    async function boughtFixture() {
      const f = await withEventFixture();
      await f.cp.connect(f.student).purchaseTicket(0, { value: PRICE });
      return f;
    }
    it("organizer redeems; status changes; token is kept", async () => {
      const { cp, organizer, student } = await loadFixture(boughtFixture);
      await expect(cp.redeemTicket(1)).to.emit(cp, "TicketRedeemed").withArgs(0, 1, organizer.address);
      expect(await cp.isTicketRedeemed(1)).to.equal(true);
      expect(await cp.ownerOf(1)).to.equal(student.address); // not burned
    });
    it("rejects duplicate redemption", async () => {
      const { cp } = await loadFixture(boughtFixture);
      await cp.redeemTicket(1);
      await expect(cp.redeemTicket(1)).to.be.revertedWithCustomError(cp, "AlreadyRedeemed");
    });
    it("rejects unauthorized redemption, even by the ticket owner", async () => {
      const { cp, student, stranger } = await loadFixture(boughtFixture);
      await expect(cp.connect(stranger).redeemTicket(1)).to.be.revertedWithCustomError(cp, "NotEventOrganizer");
      await expect(cp.connect(student).redeemTicket(1)).to.be.revertedWithCustomError(cp, "NotEventOrganizer");
    });
    it("rejects nonexistent tickets", async () => {
      const { cp } = await loadFixture(boughtFixture);
      await expect(cp.redeemTicket(99)).to.be.revertedWithCustomError(cp, "TicketNotFound");
      await expect(cp.getTicketDetails(99)).to.be.revertedWithCustomError(cp, "TicketNotFound");
      await expect(cp.isTicketRedeemed(0)).to.be.revertedWithCustomError(cp, "TicketNotFound");
    });
  });

  describe("Revenue withdrawal", () => {
    async function soldFixture() {
      const f = await withEventFixture();
      await f.cp.connect(f.student).purchaseTicket(0, { value: PRICE });
      await f.cp.connect(f.student2).purchaseTicket(0, { value: PRICE });
      return f;
    }
    it("organizer withdraws proceeds", async () => {
      const { cp, organizer } = await loadFixture(soldFixture);
      await expect(cp.withdrawRevenue(0)).to.changeEtherBalances([cp, organizer], [-PRICE * 2n, PRICE * 2n]);
      expect(await cp.getEventRevenue(0)).to.equal(0);
    });
    it("emits RevenueWithdrawn", async () => {
      const { cp, organizer } = await loadFixture(soldFixture);
      await expect(cp.withdrawRevenue(0)).to.emit(cp, "RevenueWithdrawn").withArgs(0, organizer.address, PRICE * 2n);
    });
    it("rejects unauthorized withdrawal", async () => {
      const { cp, stranger } = await loadFixture(soldFixture);
      await expect(cp.connect(stranger).withdrawRevenue(0)).to.be.revertedWithCustomError(cp, "NotEventOrganizer");
    });
    it("cannot withdraw twice", async () => {
      const { cp } = await loadFixture(soldFixture);
      await cp.withdrawRevenue(0);
      await expect(cp.withdrawRevenue(0)).to.be.revertedWithCustomError(cp, "NothingToWithdraw");
    });
    it("failed transfer reverts and leaves accounting intact", async () => {
      const [owner, student] = await ethers.getSigners();
      const cp = await (await ethers.getContractFactory("CampusPass")).deploy();
      const mock = await (await ethers.getContractFactory("MockOrganizer")).deploy();
      await cp.transferOwnership(await mock.getAddress());
      const date = (await time.latest()) + 86400;
      await mock.create(await cp.getAddress(), date);
      await cp.connect(student).purchaseTicket(0, { value: ethers.parseEther("1") });
      await expect(mock.withdraw(await cp.getAddress(), 0)).to.be.revertedWithCustomError(cp, "TransferFailed");
      expect(await cp.getEventRevenue(0)).to.equal(ethers.parseEther("1"));
      expect(await ethers.provider.getBalance(await cp.getAddress())).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Cancellation and refunds", () => {
    it("owner claims refund once; organizer cannot withdraw cancelled funds", async () => {
      const { cp, student, stranger } = await loadFixture(withEventFixture);
      await cp.connect(student).purchaseTicket(0, { value: PRICE });
      await cp.cancelEvent(0);
      await expect(cp.withdrawRevenue(0)).to.be.revertedWithCustomError(cp, "EventIsCancelled");
      await expect(cp.connect(stranger).claimRefund(1)).to.be.revertedWithCustomError(cp, "NotTicketOwner");
      await expect(cp.connect(student).claimRefund(1)).to.changeEtherBalance(student, PRICE);
      await expect(cp.connect(student).claimRefund(1)).to.be.revertedWithCustomError(cp, "AlreadyRefunded");
      expect(await cp.getEventRevenue(0)).to.equal(0);
    });
    it("refund rejected for active event", async () => {
      const { cp, student } = await loadFixture(withEventFixture);
      await cp.connect(student).purchaseTicket(0, { value: PRICE });
      await expect(cp.connect(student).claimRefund(1)).to.be.revertedWithCustomError(cp, "EventNotCancelled");
    });
  });

  describe("Integration: full journey", () => {
    it("deploy -> create -> buy -> verify -> redeem -> duplicate -> withdraw", async () => {
      const { cp, organizer, student, date } = await loadFixture(deployFixture);
      await cp.createEvent("Symposium", "Tech talks", date, "Auditorium", PRICE, 10);
      await cp.connect(student).purchaseTicket(0, { value: PRICE });
      const [eventId, owner] = await cp.getTicketDetails(1);
      expect(eventId).to.equal(0); expect(owner).to.equal(student.address);
      await cp.redeemTicket(1);
      await expect(cp.redeemTicket(1)).to.be.revertedWithCustomError(cp, "AlreadyRedeemed");
      await expect(cp.withdrawRevenue(0)).to.changeEtherBalance(organizer, PRICE);
      expect(await ethers.provider.getBalance(await cp.getAddress())).to.equal(0);
      expect(await cp.isTicketRedeemed(1)).to.equal(true);
      expect((await cp.getEventDetails(0)).sold).to.equal(1);
    });
  });
});
