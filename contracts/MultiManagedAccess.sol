// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//abstract : 실제 배포용이 아닌 상속용
abstract contract MultiManagedAccess {
    uint constant MANAGER_NUMBERS = 5;
    address public owner;
    address[5] public managers;

    bool[MANAGER_NUMBERS] public confirmed;

    constructor(address _owner, address[5] memory _managers) {
        owner = _owner;
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            managers[i] = _managers[i];
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "you are not authorized");
        _;
    }

    function reset() internal {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            confirmed[i] = false;
        }
    }

    function allConfirmed() internal view returns (bool) {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (!confirmed[i]) {
                return false;
            }
        }
        return true;
    }

    modifier onlyAllconfirmed() {
        require(allConfirmed(), "Not all confirmed yet");
        reset();
        _;
    }

    function confirm() external {
        bool found = false;
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (msg.sender == managers[i]) {
                found = true;
                confirmed[i] = true;
                break;
            }
        }
        require(found, "You are not a manager");
    }
}
