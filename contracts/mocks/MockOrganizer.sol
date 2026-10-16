// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {CampusPass} from "../CampusPass.sol";

/// @dev Test helper: a contract organizer with NO receive() so ETH transfers to it fail.
contract MockOrganizer {
    function create(CampusPass cp, uint64 date) external {
        cp.createEvent("Mock", "d", date, "v", 1 ether, 5);
    }
    function withdraw(CampusPass cp, uint256 id) external {
        cp.withdrawRevenue(id);
    }
}
