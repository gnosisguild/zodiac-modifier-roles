import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

import {
  Operator,
  ExecutionOptions,
  ParameterType,
  deployRolesMod,
  PermissionCheckerStatus,
  BYTES32_ZERO,
} from "../utils";

const ROLE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("Operator - EtherWithinAllowance", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();
    // fund avatar
    await invoker.sendTransaction({
      to: avatar.address,
      value: hre.ethers.utils.parseEther("1"),
    });
    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );
    await roles.enableModule(invoker.address);

    async function setAllowance({
      key,
      balance,
      maxRefill,
      refill,
      period,
      timestamp,
    }: {
      key: string;
      balance: BigNumberish;
      maxRefill?: BigNumberish;
      refill: BigNumberish;
      period: BigNumberish;
      timestamp: BigNumberish;
    }) {
      await roles
        .connect(owner)
        .setAllowance(key, balance, maxRefill || 0, refill, period, timestamp);
    }

    await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
    await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("receiveEthAndDoNothing")
    );

    await roles.connect(owner).scopeFunction(
      ROLE_KEY,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.EtherWithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ],
      ExecutionOptions.Send
    );

    async function sendEthAndDoNothing(value: BigNumberish) {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          value,
          (await testContract.populateTransaction.receiveEthAndDoNothing())
            .data as string,
          0
        );
    }

    return {
      owner,
      invoker,
      roles,
      testContract,
      allowanceKey,
      setAllowance,
      sendEthAndDoNothing,
    };
  }

  describe("EtherWithinAllowance - Check", () => {
    it("success - from existing balance", async () => {
      const { roles, allowanceKey, setAllowance, sendEthAndDoNothing } =
        await loadFixture(setup);

      const initialBalance = 10000;

      await setAllowance({
        key: allowanceKey,
        balance: initialBalance,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      expect((await roles.allowances(allowanceKey)).balance).to.equal(
        initialBalance
      );

      await expect(sendEthAndDoNothing(initialBalance + 1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      await expect(sendEthAndDoNothing(initialBalance)).to.not.be.reverted;
      await expect(sendEthAndDoNothing(1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);
    });
    it("success - from balance 0 but enough refill pending", async () => {
      const { roles, allowanceKey, setAllowance, sendEthAndDoNothing } =
        await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 250,
        period: 500,
        refill: 100,
        timestamp: timestamp - 750,
      });

      await expect(sendEthAndDoNothing(351))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      await expect(sendEthAndDoNothing(350)).to.not.be.reverted;
      await expect(sendEthAndDoNothing(1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });
    it("fail - insufficient balance and not enough elapsed for next refill", async () => {
      const { roles, allowanceKey, setAllowance, sendEthAndDoNothing } =
        await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 9,
        period: 1000,
        refill: 1,
        timestamp: timestamp - 50,
      });

      await expect(sendEthAndDoNothing(10))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      await expect(sendEthAndDoNothing(9)).to.not.be.reverted;
      await expect(sendEthAndDoNothing(1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });
  });

  describe("EtherWithinAllowance - Variants", () => {
    it("enforces different eth allowances per variant", async () => {
      const { owner, invoker, roles, testContract, setAllowance } =
        await loadFixture(setup);

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("oneParamStatic")
      );

      const allowanceKey1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      const allowanceAmount1 = 200;
      const allowanceAmount2 = 100;
      const value1 = 777;
      const value2 = 888;
      const valueOther = 9999;

      await setAllowance({
        key: allowanceKey1,
        balance: allowanceAmount1,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await setAllowance({
        key: allowanceKey2,
        balance: allowanceAmount2,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value1]),
          },
          {
            parent: 1,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 2,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value2]),
          },
          {
            parent: 2,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.Send
      );

      async function invoke(value: BigNumberish, p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            value,
            (await testContract.populateTransaction.oneParamStatic(p))
              .data as string,
            0
          );
      }

      /*
       * First check valueOther which, hits no variant
       */
      await expect(invoke(1000, valueOther))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      // Exceed value for Variant1
      await expect(invoke(allowanceAmount1 + 1, value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      // Exceed value for Variant2
      await expect(invoke(allowanceAmount2 + 1, value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      // Checks that both allowance balances still remain unchanged
      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        allowanceAmount1
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        allowanceAmount2
      );

      /*
       * Exhaust Allowance from Variant 1
       */
      await expect(invoke(allowanceAmount1, value1)).to.not.be.reverted;
      // check that allowance 1 is updated to zero
      expect((await roles.allowances(allowanceKey1)).balance).to.equal(0);
      // check that allowance 2 remains unchanged
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        allowanceAmount2
      );

      /*
       * Exhaust Allowance from Variant 2
       */
      await expect(invoke(allowanceAmount2, value2)).to.not.be.reverted;
      // check that both balances are now zero
      expect((await roles.allowances(allowanceKey1)).balance).to.equal(0);
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(0);

      // check that neither variant can now be invoked
      await expect(invoke(1, value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      await expect(invoke(1, value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
    });
  });
});
