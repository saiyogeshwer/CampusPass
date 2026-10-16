// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CampusPass - decentralized campus event ticketing
/// @notice Each ticket is an ERC-721 token. The chain is the source of truth for
///         ownership and one-time redemption. Tickets are NOT burned on redemption.
/// @dev v1 rule: the deployer (owner) is the organizer and the only account that can create events.
contract CampusPass is ERC721, Ownable, ReentrancyGuard {
    struct EventInfo {
        uint256 id;
        address organizer;
        string name;
        string description;
        uint64 date;        // unix seconds; sales close when this time is reached
        string venue;
        uint256 price;      // wei, exact payment required
        uint32 maxTickets;
        uint32 sold;
        bool cancelled;
    }

    struct Ticket {
        uint256 eventId;
        bool redeemed;
        bool refunded;
    }

    EventInfo[] private _events;
    mapping(uint256 => Ticket) private _tickets;
    // Withdrawable proceeds per event (pull payment). Reduced by withdrawals and refunds.
    mapping(uint256 => uint256) private _revenue;
    uint256 private _nextTicketId = 1;

    event EventCreated(uint256 indexed eventId, address indexed organizer, string name, uint64 date, uint256 price, uint32 maxTickets);
    event TicketPurchased(uint256 indexed eventId, uint256 indexed ticketId, address indexed buyer, uint256 price);
    event TicketRedeemed(uint256 indexed eventId, uint256 indexed ticketId, address indexed redeemedBy);
    event EventCancelled(uint256 indexed eventId);
    event RevenueWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount);
    event TicketRefunded(uint256 indexed eventId, uint256 indexed ticketId, address indexed owner, uint256 amount);

    error EmptyName();
    error InvalidDate();
    error InvalidQuantity();
    error InvalidPrice();
    error EventNotFound();
    error EventNotActive();
    error SalesClosed();
    error SoldOut();
    error IncorrectPayment();
    error TicketNotFound();
    error NotEventOrganizer();
    error AlreadyRedeemed();
    error NothingToWithdraw();
    error EventIsCancelled();
    error EventNotCancelled();
    error NotTicketOwner();
    error AlreadyRefunded();
    error TransferFailed();

    constructor() ERC721("CampusPass Ticket", "CPT") Ownable(msg.sender) {}

    // ---------------------------------------------------------------- events

    /// @notice Create an event. Only the contract owner (organizer) may do this.
    function createEvent(
        string calldata name,
        string calldata description,
        uint64 date,
        string calldata venue,
        uint256 price,
        uint32 maxTickets
    ) external onlyOwner returns (uint256 eventId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (date <= block.timestamp) revert InvalidDate();
        if (maxTickets == 0) revert InvalidQuantity();
        if (price == 0) revert InvalidPrice();

        eventId = _events.length;
        _events.push(EventInfo(eventId, msg.sender, name, description, date, venue, price, maxTickets, 0, false));
        emit EventCreated(eventId, msg.sender, name, date, price, maxTickets);
    }

    function getEventDetails(uint256 eventId) external view returns (EventInfo memory) {
        if (eventId >= _events.length) revert EventNotFound();
        return _events[eventId];
    }

    function getTotalEvents() external view returns (uint256) {
        return _events.length;
    }

    /// @notice Cancel an event. Buyers then claim refunds individually (pull refunds).
    function cancelEvent(uint256 eventId) external {
        EventInfo storage e = _getEvent(eventId);
        if (msg.sender != e.organizer) revert NotEventOrganizer();
        if (e.cancelled) revert EventIsCancelled();
        e.cancelled = true;
        emit EventCancelled(eventId);
    }

    // --------------------------------------------------------------- tickets

    /// @notice Buy one ticket. Exact payment required (excess is rejected, not kept).
    function purchaseTicket(uint256 eventId) external payable nonReentrant returns (uint256 ticketId) {
        EventInfo storage e = _getEvent(eventId);
        if (e.cancelled) revert EventNotActive();
        if (block.timestamp >= e.date) revert SalesClosed();
        if (e.sold >= e.maxTickets) revert SoldOut();
        if (msg.value != e.price) revert IncorrectPayment();

        // effects
        e.sold += 1;
        _revenue[eventId] += msg.value;
        ticketId = _nextTicketId++;
        _tickets[ticketId] = Ticket(eventId, false, false);

        // interaction (safe mint may call the buyer if it is a contract)
        _safeMint(msg.sender, ticketId);
        emit TicketPurchased(eventId, ticketId, msg.sender, msg.value);
    }

    function getTicketDetails(uint256 ticketId) external view returns (uint256 eventId, address owner, bool redeemed, bool refunded) {
        if (_ownerOf(ticketId) == address(0)) revert TicketNotFound();
        Ticket storage t = _tickets[ticketId];
        return (t.eventId, ownerOf(ticketId), t.redeemed, t.refunded);
    }

    function isTicketRedeemed(uint256 ticketId) external view returns (bool) {
        if (_ownerOf(ticketId) == address(0)) revert TicketNotFound();
        return _tickets[ticketId].redeemed;
    }

    function totalTickets() external view returns (uint256) {
        return _nextTicketId - 1;
    }

    /// @notice Mark a ticket as used. Only that event's organizer. Never burns the token.
    function redeemTicket(uint256 ticketId) external {
        if (_ownerOf(ticketId) == address(0)) revert TicketNotFound();
        Ticket storage t = _tickets[ticketId];
        if (msg.sender != _events[t.eventId].organizer) revert NotEventOrganizer();
        if (t.redeemed || t.refunded) revert AlreadyRedeemed();
        t.redeemed = true;
        emit TicketRedeemed(t.eventId, ticketId, msg.sender);
    }

    // --------------------------------------------------------------- money

    function getEventRevenue(uint256 eventId) external view returns (uint256) {
        if (eventId >= _events.length) revert EventNotFound();
        return _revenue[eventId];
    }

    /// @notice Pull-based withdrawal of an active event's proceeds.
    function withdrawRevenue(uint256 eventId) external nonReentrant {
        EventInfo storage e = _getEvent(eventId);
        if (msg.sender != e.organizer) revert NotEventOrganizer();
        if (e.cancelled) revert EventIsCancelled(); // funds are reserved for refunds
        uint256 amount = _revenue[eventId];
        if (amount == 0) revert NothingToWithdraw();

        _revenue[eventId] = 0; // effects before interaction
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed(); // revert restores the balance too
        emit RevenueWithdrawn(eventId, msg.sender, amount);
    }

    /// @notice Ticket owner claims a refund for a cancelled event. Once per ticket.
    function claimRefund(uint256 ticketId) external nonReentrant {
        if (_ownerOf(ticketId) == address(0)) revert TicketNotFound();
        Ticket storage t = _tickets[ticketId];
        EventInfo storage e = _events[t.eventId];
        if (!e.cancelled) revert EventNotCancelled();
        if (ownerOf(ticketId) != msg.sender) revert NotTicketOwner();
        if (t.refunded) revert AlreadyRefunded();

        t.refunded = true;
        _revenue[t.eventId] -= e.price;
        (bool ok, ) = payable(msg.sender).call{value: e.price}("");
        if (!ok) revert TransferFailed();
        emit TicketRefunded(t.eventId, ticketId, msg.sender, e.price);
    }

    function _getEvent(uint256 eventId) private view returns (EventInfo storage) {
        if (eventId >= _events.length) revert EventNotFound();
        return _events[eventId];
    }
}
