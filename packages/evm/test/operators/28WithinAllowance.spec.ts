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
      maxRefill,
      refill,
      period,
      timestamp,
    }: {
      balance: BigNumberish;
      maxRefill?: BigNumberish;
      refill: BigNumberish;
      period: BigNumberish;
      timestamp: BigNumberish;
    }
  ) {
    return roles.setAllowance(
      allowanceKey,
      balance,
      maxRefill || 0,
      refill,
      period,
      timestamp
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
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

      await expect(invoke(1000)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
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
          paramType: ParameterType.Calldata,
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
        period: 1000,
        refill: 100,
        timestamp: timestamp,
      });

      await expect(invoke(334))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
      await expect(invoke(333)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
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
          paramType: ParameterType.Calldata,
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
        period: 500,
        refill: 100,
        timestamp: timestamp - 750,
      });

      await expect(invoke(351))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

      await expect(invoke(350)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
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
          paramType: ParameterType.Calldata,
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
        period: 1000,
        refill: 100,
        timestamp: timestamp - 50,
      });

      await expect(invoke(251))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

      await expect(invoke(250)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
    });
    it("passes a check with balance from refill and bellow maxRefill", async () => {
      const { owner, roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 10000;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        maxRefill: 1000,
        period: interval,
        refill: 9999999,
        timestamp: timestamp - interval * 10,
      });

      await expect(invoke(1001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

      await expect(invoke(1000)).to.not.be.reverted;
    });
    it("fails a check with balance from refill but capped by maxRefill", async () => {
      const { owner, roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamStatic
      );

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        maxRefill: 9000,
        period: 1000,
        refill: 10000,
        timestamp: timestamp - 5000,
      });

      await expect(invoke(9001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

      await expect(invoke(9000)).to.not.be.reverted;
    });
  });

  describe("WithinAllowance - Consumption", async () => {
    it("Consumes balance, even with multiple references to same allowance", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupTwoParamsStatic
      );

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3001, 3001))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(1500, 1500)).to.not.be.reverted;
      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(0);
    });
    it("Fails, when multiple parameters referencing the same limit overspend", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupTwoParamsStatic
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3000, 1))
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);
    });
    it("Updates timestamp", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 600;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        balance: 100,
        period: interval,
        refill: 0,
        timestamp: 1,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(100);
      expect(allowance.timestamp).to.equal(1);

      await expect(invoke(0)).to.not.be.reverted;
      const now = await time.latest();

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.timestamp.toNumber()).to.be.greaterThan(1);
      expect(now - allowance.timestamp.toNumber()).to.be.lessThanOrEqual(
        interval * 2
      );
    });
    it("Does not updates timestamp if interval is zero", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        period: 0,
        refill: 0,
        timestamp: 123,
      });

      await expect(invoke(0)).to.not.be.reverted;

      const allowance = await roles.allowances(allowanceKey);
      expect(allowance.timestamp).to.equal(123);
    });
    it("Updates timestamp from past timestamp", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 600;

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        period: interval,
        refill: 0,
        timestamp: timestamp,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.timestamp).to.equal(timestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.timestamp.toNumber()).to.be.greaterThan(timestamp);
    });
    it("Does not update timestamp from future timestamp", async () => {
      const { owner, roles, invoke, scopeFunction } = await loadFixture(
        setupOneParamStatic
      );

      const interval = 600;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
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
        period: interval,
        refill: 0,
        timestamp: timestamp,
      });

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.timestamp).to.equal(timestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.timestamp).to.equal(timestamp);
    });
  });
});
