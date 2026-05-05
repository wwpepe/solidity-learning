// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//abstract : 실제 배포용이 아닌 상속용
abstract contract MultiManagedAccess {
    uint constant NUM_MANAGER = 4;
    address public owner;
    address[NUM_MANAGER] public managers;
    bool[NUM_MANAGER] public confirmed;

    constructor(address _owner, address[] memory _managers) {
        owner = _owner;
        for (uint i = 0; i < NUM_MANAGER; i++) {
            managers[i] = _managers[i];
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "you are not authorized");
        _;
    }

    modifier onlyAllconfirmed() {
        require(allConfirmed(), "Not all confirmed yet");
        reset();
        _;
    }

    function allConfirmed() internal view returns (bool) {
        for (uint i = 0; i < NUM_MANAGER; i++) {
            if (!confirmed[i]) {
                return false;
            }
        }
        return true;
    }

    function reset() internal {
        for (uint i = 0; i < NUM_MANAGER; i++) {
            confirmed[i] = false;
        }
    }

    function confirm() external {
        bool found = false;
        for (uint i = 0; i < NUM_MANAGER; i++) {
            if (msg.sender == managers[i]) {
                found = true;
                confirmed[i] = true;
                break;
            }
        }
        require(found, "You are not a manager");
    }
}
