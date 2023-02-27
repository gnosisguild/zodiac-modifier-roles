import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Comparison, ExecutionOptions, ParameterType } from "./utils";

import { defaultAbiCoder } from "ethers/lib/utils";

describe("Allowance", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const timestamp = Math.floor(new Date().getTime() / 1000);

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
      maxBalance: BigNumberish;
      refillAmount: BigNumberish;
      refillInterval: BigNumberish;
      refillTimestamp: BigNumberish;
    }) {
      const ALLOWANCE_ID = 22;
      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      await modifier
        .connect(owner)
        .setAllowance(
          ALLOWANCE_ID,
          balance,
          maxBalance,
          refillAmount,
          refillInterval,
          refillTimestamp
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
            isScoped: true,
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.WithinLimit,
            compValue: defaultAbiCoder.encode(["uint16"], [ALLOWANCE_ID]),
          },
        ],
        ExecutionOptions.None
      );
    }

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

    return {
      timestamp,
      setAllowance,
      invoke,
    };
  });

  describe("Check", () => {
    it("passes a check with enough balance available", async () => {
      const { setAllowance, invoke, timestamp } = await setup();

      await setAllowance({
        balance: 1000,
        maxBalance: 5000,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      await expect(invoke(1001)).to.be.revertedWith("AllowanceExceeded()");
      await expect(invoke(1000)).to.not.be.reverted;
      await expect(invoke(1001)).to.be.revertedWith("AllowanceExceeded()");
      // await expect(invoke(123)).to.not.be.reverted;
    });

    it.skip("passes a check with enough balance available and no refill (interval = 0)", async () => {});

    it.skip("passes a check with enough balance available and refill available", async () => {});

    it.skip("passes a check balance from available and from refill", async () => {});

    it.skip("fails a check, with some balance and not enough elapedg to next refill", async () => {});
  });

  describe("Track", async () => {
    it.skip("Updates tracking with balance and last refill", async () => {});
    it.skip("Fails at tracking level if double spend is detected", async () => {});
  });
});
