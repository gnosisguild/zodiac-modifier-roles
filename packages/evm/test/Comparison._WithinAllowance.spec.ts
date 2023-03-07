import { expect } from "chai";
import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Comparison, ExecutionOptions, ParameterType } from "./utils";

describe("Comparison", async () => {
  const ALLOWANCE_ID = 22;

  const timestampNow = () => Math.floor(new Date().getTime() / 1000);

  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const timestamp = timestampNow();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    async function setAllowance({
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
    }) {
      await modifier
        .connect(owner)
        .setAllowance(
          ALLOWANCE_ID,
          balance,
          maxBalance || 0,
          refillAmount,
          refillInterval,
          refillTimestamp
        );
    }

    async function setRole() {
      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.WithinAllowance,
            compValue: defaultAbiCoder.encode(["uint16"], [ALLOWANCE_ID]),
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

    async function setRoleTwoParams() {
      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithTwoParams")
      );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.WithinAllowance,
            compValue: defaultAbiCoder.encode(["uint16"], [ALLOWANCE_ID]),
          },
          {
            parent: 1,
            _type: ParameterType.Static,
            comp: Comparison.WithinAllowance,
            compValue: defaultAbiCoder.encode(["uint16"], [ALLOWANCE_ID]),
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
      timestamp,
      setAllowance,
      setRole,
      setRoleTwoParams,
    };
  });

  describe("WithinAllowance - Check", () => {
    it("passes a check with enough balance available and no refill (interval = 0)", async () => {
      const { setAllowance, setRole } = await setup();

      await setAllowance({
        balance: 1000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { invoke } = await setRole();

      await expect(invoke(1001)).to.be.revertedWith("AllowanceExceeded()");
      await expect(invoke(1000)).to.not.be.reverted;
      await expect(invoke(1)).to.be.revertedWith("AllowanceExceeded()");
    });

    it("passes a check with only from balance and refill available", async () => {
      const { setAllowance, setRole, timestamp } = await setup();
      await setAllowance({
        balance: 333,
        refillInterval: 1000,
        refillAmount: 100,
        refillTimestamp: timestamp - 60,
      });
      const { invoke } = await setRole();

      await expect(invoke(334)).to.be.revertedWith("AllowanceExceeded()");
      await expect(invoke(333)).to.not.be.reverted;
      await expect(invoke(1)).to.be.revertedWith("AllowanceExceeded()");
    });

    it("passes a check balance from available+refill", async () => {
      const { setAllowance, setRole, timestamp } = await setup();
      await setAllowance({
        balance: 250,
        refillInterval: 500,
        refillAmount: 100,
        refillTimestamp: timestamp - 750,
      });

      const { invoke } = await setRole();

      await expect(invoke(351)).to.be.revertedWith("AllowanceExceeded()");
      await expect(invoke(350)).to.not.be.reverted;
      await expect(invoke(1)).to.be.revertedWith("AllowanceExceeded()");
    });

    it("fails a check, with some balance and not enough elapsed for next refill", async () => {
      const { setAllowance, setRole, timestamp } = await setup();
      await setAllowance({
        balance: 250,
        refillInterval: 1000,
        refillAmount: 100,
        refillTimestamp: timestamp - 50,
      });
      const { invoke } = await setRole();

      await expect(invoke(251)).to.be.revertedWith("AllowanceExceeded()");
      await expect(invoke(250)).to.not.be.reverted;
      await expect(invoke(1)).to.be.revertedWith("AllowanceExceeded()");
    });

    it("passes a check with balance from refill and bellow maxBalance", async () => {
      const { setAllowance, setRole, timestamp } = await setup();
      await setAllowance({
        balance: 0,
        maxBalance: 1000,
        refillInterval: 100,
        refillAmount: 10000,
        refillTimestamp: timestamp - 5000,
      });
      const { invoke } = await setRole();

      await expect(invoke(900)).to.not.be.reverted;
      await expect(invoke(101)).to.be.revertedWith("AllowanceExceeded()");
    });

    it("fails a check with balance from refill but capped by maxBalance", async () => {
      const { setAllowance, setRole, timestamp } = await setup();
      await setAllowance({
        balance: 0,
        maxBalance: 9000,
        refillInterval: 1000,
        refillAmount: 10000,
        refillTimestamp: timestamp - 5000,
      });
      const { invoke } = await setRole();

      await expect(invoke(9001)).to.be.revertedWith("AllowanceExceeded()");
      await expect(invoke(9000)).to.not.be.reverted;
    });
  });

  describe("WithinAllowance - Track", async () => {
    it("Updates tracking, even with multiple parameters referencing the same limit", async () => {
      const { setAllowance, setRoleTwoParams } = await setup();
      await setAllowance({
        balance: 3000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRoleTwoParams();

      let allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3001, 3001)).to.be.revertedWith(
        "AllowanceExceeded()"
      );
      allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(1500, 1500)).to.not.be.reverted;
      allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.balance).to.equal(0);
    });

    it("Fails at tracking, when multiple parameters referencing the same limit overspend", async () => {
      const { setAllowance, setRoleTwoParams } = await setup();
      await setAllowance({
        balance: 3000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRoleTwoParams();

      let allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.balance).to.equal(3000);

      await expect(invoke(3000, 1)).to.be.revertedWith(
        `AllowanceDoubleSpend(${ALLOWANCE_ID})`
      );
      allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.balance).to.equal(3000);
    });

    it("Updates refillTimestamp starting from zero", async () => {
      const { setAllowance, setRole } = await setup();

      const interval = 600;

      await setAllowance({
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRole();

      let allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.balance).to.equal(1);
      expect(allowance.refillTimestamp).to.equal(0);

      await expect(invoke(0)).to.not.be.reverted;
      const now = timestampNow();

      allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.refillTimestamp.toNumber()).to.be.greaterThan(0);
      expect(now - allowance.refillTimestamp.toNumber()).to.be.lessThanOrEqual(
        interval
      );
    });

    it("Does not updates refillTimestamp if interval is zero", async () => {
      const { setAllowance, setRole } = await setup();

      await setAllowance({
        balance: 1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      const { invoke, modifier } = await setRole();

      await expect(invoke(0)).to.not.be.reverted;

      const allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.refillTimestamp).to.equal(0);
    });

    it("Updates refillTimestamp from past timestamp", async () => {
      const { setAllowance, setRole } = await setup();

      const interval = 600;
      const initialTimestamp = timestampNow() - 2400;

      await setAllowance({
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: initialTimestamp,
      });
      const { invoke, modifier } = await setRole();

      let allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.refillTimestamp).to.equal(initialTimestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.refillTimestamp.toNumber()).to.be.greaterThan(
        initialTimestamp
      );
    });

    it("Does not update refillTimestamp from future timestamp", async () => {
      const { setAllowance, setRole } = await setup();

      const interval = 600;
      const initialTimestamp = timestampNow() + 1200;

      await setAllowance({
        balance: 1,
        refillInterval: interval,
        refillAmount: 0,
        refillTimestamp: initialTimestamp,
      });
      const { invoke, modifier } = await setRole();

      let allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.refillTimestamp).to.equal(initialTimestamp);

      await expect(invoke(0)).to.not.be.reverted;

      allowance = await modifier.allowances(ALLOWANCE_ID);
      expect(allowance.refillTimestamp).to.equal(initialTimestamp);
    });
  });
});
