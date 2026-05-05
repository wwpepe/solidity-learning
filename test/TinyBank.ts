import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Tiny Bank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
    // 매니저 4명인자로 넣음
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      [
        signers[1].address,
        signers[2].address,
        signers[3].address,
        signers[4].address,
      ],
    ]);

    await myTokenC.setManager(await tinyBankC.getAddress());
  });

  describe("Intialized state check", () => {
    it("should return totalStaked 0 ", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });
  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await myTokenC.balanceOf(tinyBankC.getAddress())).equal(
        await tinyBankC.totalStaked(),
      );
    });
  });

  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("reward", () => {
    it("should reward 1MT every blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);

      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }
      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString()),
      );
    });

    // it("Should revert when changing rewardPerBlock by hacker", async () => {
    //   const hacker = signers[3];
    //   const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
    //   await expect(
    //     tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
    //   ).to.be.revertedWith("You are not authorized to manage this contract");
    // });
  });

  describe("MultiManagedAccess", () => {
    //모든 매니저 통과
    it("should allow setRewardPerBlock after all managers confirm", async () => {
      const newReward = hre.ethers.parseUnits("5", DECIMALS);

      await tinyBankC.connect(signers[1]).confirm();
      await tinyBankC.connect(signers[2]).confirm();
      await tinyBankC.connect(signers[3]).confirm();
      await tinyBankC.connect(signers[4]).confirm();

      await expect(tinyBankC.setRewardPerBlock(newReward)).to.not.be.reverted;
    });
    //매니저가 아닌 사람이 시도한 경우
    it("should revert when non-manager calls confirm", async () => {
      const hacker = signers[5];
      await expect(tinyBankC.connect(hacker).confirm()).to.be.revertedWith(
        "You are not a manager",
      );
    });

    //모든 매니저가 동의하지 않은 경우
    it("should revert when not all managers have confirmed", async () => {
      const newReward = hre.ethers.parseUnits("5", DECIMALS);

      await tinyBankC.connect(signers[1]).confirm();
      await tinyBankC.connect(signers[2]).confirm();
      await tinyBankC.connect(signers[3]).confirm();

      await expect(tinyBankC.setRewardPerBlock(newReward)).to.be.revertedWith(
        "Not all confirmed yet",
      );
    });
  });
});
