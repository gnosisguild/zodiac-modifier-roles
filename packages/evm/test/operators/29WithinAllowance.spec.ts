import { expect } from "chai";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ParameterType, PermissionCheckerStatus } from "../utils";
import { setupOneParamStatic, setupTwoParamsStatic } from "./setup";
import { Roles } from "../../typechain-types";

describe("Operator - WithinAllowance", async () => {
  function setAllowance(
    roles: Roles,
    allowanceKey: string,
    {
      balance,
      maxBalance,
      refillAmount,
      refillInterval,
      refillTimestamp,
    }: {
      balance: BigNumberish;
      maxBalance?: BigNumberish;
      refillAmount: BigNumberish;
      refillInterval: BigNumberish;
      refillTimestamp: BigNumberish;
    }
  ) {
    return roles.setAllowance(
      allowanceKey,
      balance,
      maxBalance || 0,
      refillAmount,
      refillInterval,
      refillTimestamp
    );
  }

  describe("WithinAllowance - Check", () => {
    it("passes a check with enough balance available and no refill (interval = 0)", async () => {
      const { owner, roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 1000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      await expect(invoke(1001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);

      await expect(invoke(1000)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
    });

    it("passes a check with only from balance and refill configured", async () => {
      const { roles, owner, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      const timestamp = await time.latest();
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 333,
        refillInterval: 1000,
        refillAmount: 100,
        refillTimestamp: timestamp,
      });

      await expect(invoke(334))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
      await expect(invoke(333)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
    });

    it("passes a check balance from available+refill", async () => {
      const { roles, owner, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      const timestamp = await time.latest();
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 250,
        refillInterval: 500,
        refillAmount: 100,
        refillTimestamp: timestamp - 750,
      });

      await expect(invoke(351))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);

      await expect(invoke(350)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
    });

    it("fails a check, with some balance and not enough elapsed for next refill", async () => {
      const { owner, roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      const timestamp = await time.latest();
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 250,
        refillInterval: 1000,
        refillAmount: 100,
        refillTimestamp: timestamp - 50,
      });

      await expect(invoke(251))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);

      await expect(invoke(250)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
    });

    it("passes a check with balance from refill and bellow maxBalance", async () => {
      const { owner, roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 10000;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      const timestamp = await time.latest();
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 0,
        maxBalance: 1000,
        refillInterval: interval,
        refillAmount: 9999999,
        refillTimestamp: timestamp - interval * 10,
      });

      await expect(invoke(1001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);

      await expect(invoke(1000)).to.not.be.reverted;
    });

    it("fails a check with balance from refill but capped by maxBalance", async () => {
      const { owner, roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      const timestamp = await time.latest();
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 0,
        maxBalance: 9000,
        refillInterval: 1000,
        refillAmount: 10000,
        refillTimestamp: timestamp - 5000,
      });

      await expect(invoke(9001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);

      await expect(invoke(9000)).to.not.be.reverted;
    });
  });

  describe("WithinAllowance - Track", async () => {
    it("Updates tracking, even with multiple parameters referencing the same limit", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupTwoParamsStatic
      );

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 3000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3001, 3001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(1500, 1500)).to.not.be.reverted;
      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(0);
    });

    it("Fails at tracking, when multiple parameters referencing the same limit overspend", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupTwoParamsStatic
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 3000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3000, 1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded);
      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);
    });

    it("Updates refillTimestamp starting from zero", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 600;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(1);
      expect(allowance.refillTimestamp).to.equal(0);

      await expect(invoke(0)).to.not.be.reverted;
      const now = await time.latest();

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.refillTimestamp.toNumber()).to.be.greaterThan(0);
      expect(now - allowance.refillTimestamp.toNumber()).to.be.lessThanOrEqual(
        interval * 2
      );
    });

    it("Does not updates refillTimestamp if interval is zero", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      await expect(invoke(0)).to.not.be.reverted;

      const allowance = await roles.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(0);
    });

    it("Updates refillTimestamp from past timestamp", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 600;

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      const timestamp = (await time.latest()) - 2400;
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: timestamp,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(timestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.refillTimestamp.toNumber()).to.be.greaterThan(timestamp);
    });

    it("Does not update refillTimestamp from future timestamp", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 600;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);
      const timestamp = (await time.latest()) + 1200;
      await setAllowance(await roles.connect(owner), allowanceKey, {
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: timestamp,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(timestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(timestamp);
    });
  });
});
