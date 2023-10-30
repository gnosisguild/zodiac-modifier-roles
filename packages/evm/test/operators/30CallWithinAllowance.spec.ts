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

describe("Operator - CallWithinAllowance", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();

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

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
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
          operator: Operator.CallWithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ],
      ExecutionOptions.None
    );

    async function invoke() {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.doNothing()).data as string,
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
      invoke,
    };
  }

  describe("CallWithinAllowance - Check", () => {
    it("success - from existing balance", async () => {
      const { roles, allowanceKey, setAllowance, invoke } = await loadFixture(
        setup
      );

      await setAllowance({
        key: allowanceKey,
        balance: 1,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke())
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(allowanceKey, 1, 0);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
    it("success - multiple checks from existing balance", async () => {
      const { roles, allowanceKey, setAllowance, invoke } = await loadFixture(
        setup
      );

      await setAllowance({
        key: allowanceKey,
        balance: 2,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      expect((await roles.allowances(allowanceKey)).balance).to.equal(2);

      await expect(invoke()).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke()).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
    it("success - from balance 0 but enough refill pending", async () => {
      const { roles, allowanceKey, setAllowance, invoke } = await loadFixture(
        setup
      );

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 0,
        period: 1000,
        refill: 1,
        timestamp: timestamp - 1010,
      });

      await expect(invoke()).to.not.be.reverted;
      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
    it("fail - insufficient balance and not enough elapsed for next refill", async () => {
      const { roles, allowanceKey, setAllowance, invoke } = await loadFixture(
        setup
      );

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 0,
        period: 1000,
        refill: 1,
        timestamp: timestamp,
      });

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
  });

  describe("CallWithinAllowance - Variants", () => {
    it("enforces different call allowances per variant", async () => {
      const { owner, invoker, roles, testContract, setAllowance } =
        await loadFixture(setup);

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("oneParamStatic")
      );

      const allowanceKey1 =
        "0x1000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x2000000000000000000000000000000000000000000000000000000000000002";
      const value1 = 100;
      const value2 = 200;
      const valueOther = 9999;

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await setAllowance({
        key: allowanceKey1,
        balance: 0,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await setAllowance({
        key: allowanceKey2,
        balance: 1,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      async function invoke(p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.oneParamStatic(p))
              .data as string,
            0
          );
      }

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
            operator: Operator.CallWithinAllowance,
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
            operator: Operator.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.None
      );

      await expect(invoke(valueOther))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      await expect(invoke(value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      await expect(invoke(value2)).not.to.be.reverted;
      await expect(invoke(value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
    });
  });
});
