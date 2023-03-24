import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ExecutionOptions, ParameterType } from "./utils";

const ROLE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("Operator", async () => {
  const timestampNow = () => Math.floor(new Date().getTime() / 1000);

  async function setup() {
    const timestamp = timestampNow();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    async function setAllowance(
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
      await modifier
        .connect(owner)
        .setAllowance(
          allowanceKey,
          balance,
          maxBalance || 0,
          refillAmount,
          refillInterval,
          refillTimestamp
        );
    }

    async function setRole(allowanceKey: string) {
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
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
        ],
        ExecutionOptions.None
      );

      async function invoke(a: number) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.fnWithSingleParam(a))
              .data as string,
            0
          );
      }

      return { invoke, modifier };
    }

    async function setRoleTwoParams(allowanceKey: string) {
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithTwoParams")
      );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
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
        ],
        ExecutionOptions.None
      );

      async function invoke(a: number, b: number) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.fnWithTwoParams(a, b))
              .data as string,
            0
          );
      }

      return { invoke, modifier };
    }

    return {
      modifier,
      timestamp,
      setAllowance,
      setRole,
      setRoleTwoParams,
    };
  }

  describe("WithinAllowance - Check", () => {
    it("passes a check with enough balance available and no refill (interval = 0)", async () => {
      const { modifier, setAllowance, setRole } = await loadFixture(setup);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await setAllowance(allowanceKey, {
        balance: 1000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { invoke } = await setRole(allowanceKey);

      await expect(invoke(1001))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);

      await expect(invoke(1000)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
    });

    it("passes a check with only from balance and refill available", async () => {
      const { modifier, setAllowance, setRole, timestamp } = await loadFixture(
        setup
      );
      // more than one byte per char
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 333,
        refillInterval: 1000,
        refillAmount: 100,
        refillTimestamp: timestamp - 60,
      });
      const { invoke } = await setRole(allowanceKey);

      await expect(invoke(334)).to.be.revertedWithCustomError(
        modifier,
        `AllowanceExceeded`
      );
      await expect(invoke(333)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
    });

    it("passes a check balance from available+refill", async () => {
      const { modifier, setAllowance, setRole, timestamp } = await loadFixture(
        setup
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 250,
        refillInterval: 500,
        refillAmount: 100,
        refillTimestamp: timestamp - 750,
      });

      const { invoke } = await setRole(allowanceKey);

      await expect(invoke(351))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(invoke(350)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
    });

    it("fails a check, with some balance and not enough elapsed for next refill", async () => {
      const { modifier, setAllowance, setRole, timestamp } = await loadFixture(
        setup
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 250,
        refillInterval: 1000,
        refillAmount: 100,
        refillTimestamp: timestamp - 50,
      });
      const { invoke } = await setRole(allowanceKey);

      await expect(invoke(251))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(invoke(250)).to.not.be.reverted;
      await expect(invoke(1))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
    });

    it("passes a check with balance from refill and bellow maxBalance", async () => {
      const { modifier, setAllowance, setRole, timestamp } = await loadFixture(
        setup
      );
      const interval = 10000;
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 0,
        maxBalance: 1000,
        refillInterval: interval,
        refillAmount: 9999999,
        refillTimestamp: timestamp - interval * 10,
      });
      const { invoke } = await setRole(allowanceKey);

      await expect(invoke(1001))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(invoke(1000)).to.not.be.reverted;
    });

    it("fails a check with balance from refill but capped by maxBalance", async () => {
      const { modifier, setAllowance, setRole, timestamp } = await loadFixture(
        setup
      );
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 0,
        maxBalance: 9000,
        refillInterval: 1000,
        refillAmount: 10000,
        refillTimestamp: timestamp - 5000,
      });
      const { invoke } = await setRole(allowanceKey);

      await expect(invoke(9001))
        .to.be.revertedWithCustomError(modifier, `AllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(invoke(9000)).to.not.be.reverted;
    });
  });

  describe("WithinAllowance - Track", async () => {
    it("Updates tracking, even with multiple parameters referencing the same limit", async () => {
      const { setAllowance, setRoleTwoParams } = await loadFixture(setup);
      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await setAllowance(allowanceKey, {
        balance: 3000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRoleTwoParams(allowanceKey);

      let allowance = await modifier.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3001, 3001)).to.be.revertedWithCustomError(
        modifier,
        `AllowanceExceeded`
      );
      allowance = await modifier.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(1500, 1500)).to.not.be.reverted;
      allowance = await modifier.allowances(allowanceKey);
      expect(allowance.balance).to.equal(0);
    });

    it("Fails at tracking, when multiple parameters referencing the same limit overspend", async () => {
      const { setAllowance, setRoleTwoParams } = await loadFixture(setup);
      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 3000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRoleTwoParams(allowanceKey);

      let allowance = await modifier.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3000, 1)).to.be.revertedWithCustomError(
        modifier,
        `AllowanceExceeded`
      );
      allowance = await modifier.allowances(allowanceKey);
      expect(allowance.balance).to.equal(3000);
    });

    it("Updates refillTimestamp starting from zero", async () => {
      const { setAllowance, setRole } = await loadFixture(setup);

      const interval = 600;

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRole(allowanceKey);

      let allowance = await modifier.allowances(allowanceKey);
      expect(allowance.balance).to.equal(1);
      expect(allowance.refillTimestamp).to.equal(0);

      await expect(invoke(0)).to.not.be.reverted;
      const now = timestampNow();

      allowance = await modifier.allowances(allowanceKey);
      expect(allowance.refillTimestamp.toNumber()).to.be.greaterThan(0);
      expect(now - allowance.refillTimestamp.toNumber()).to.be.lessThanOrEqual(
        interval * 2
      );
    });

    it("Does not updates refillTimestamp if interval is zero", async () => {
      const { setAllowance, setRole } = await loadFixture(setup);

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRole(allowanceKey);

      await expect(invoke(0)).to.not.be.reverted;

      const allowance = await modifier.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(0);
    });

    it("Updates refillTimestamp from past timestamp", async () => {
      const { setAllowance, setRole } = await loadFixture(setup);

      const interval = 600;
      const initialTimestamp = timestampNow() - 2400;

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: initialTimestamp,
      });
      const { invoke, modifier } = await setRole(allowanceKey);

      let allowance = await modifier.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(initialTimestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await modifier.allowances(allowanceKey);
      expect(allowance.refillTimestamp.toNumber()).to.be.greaterThan(
        initialTimestamp
      );
    });

    it("Does not update refillTimestamp from future timestamp", async () => {
      const { setAllowance, setRole } = await loadFixture(setup);

      const interval = 600;
      const initialTimestamp = timestampNow() + 1200;

      const allowanceKey =
        "0x1000000000000000000000000000000000000000000000000000000000000000";
      await setAllowance(allowanceKey, {
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: initialTimestamp,
      });
      const { invoke, modifier } = await setRole(allowanceKey);

      let allowance = await modifier.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(initialTimestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await modifier.allowances(allowanceKey);
      expect(allowance.refillTimestamp).to.equal(initialTimestamp);
    });
  });
});
