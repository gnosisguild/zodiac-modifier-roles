import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroHash } from "ethers";
import hre from "hardhat";
import { deployFactories, deployMastercopy } from "@gnosis-guild/zodiac-core";
import { createEip1193 } from "./setup";

describe("AllowanceLoader", async () => {
  async function setup() {
    const [owner] = await hre.ethers.getSigners();
    const provider = createEip1193(hre.network.provider, owner);

    await deployFactories({ provider });
    const conditionsTransform = await hre.artifacts.readArtifact("ConditionsTransform");
    const { address: conditionsTransformAddress } = await deployMastercopy({
      bytecode: conditionsTransform.bytecode,
      constructorArgs: { types: [], values: [] },
      salt: ZeroHash,
      provider,
    });

    const MockAllowanceLoader = await hre.ethers.getContractFactory(
      "MockAllowanceLoader",
      { libraries: { ConditionsTransform: conditionsTransformAddress } },
    );
    const mock = await MockAllowanceLoader.deploy(
      owner.address,
      owner.address,
      owner.address,
    );

    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    async function setUpAllowance({
      balance,
      maxRefill = 0,
      refill = 0,
      period = 0,
      timestamp = 0,
    }: {
      balance: number;
      maxRefill?: number;
      refill?: number;
      period?: number;
      timestamp?: number;
    }) {
      await mock
        .connect(owner)
        .setAllowance(
          allowanceKey,
          balance,
          maxRefill,
          refill,
          period,
          timestamp,
        );
      return mock;
    }

    return { mock, owner, allowanceKey, setUpAllowance };
  }

  describe("load()", () => {
    it("correctly loads all Allowance fields from storage", async () => {
      const { mock, allowanceKey, setUpAllowance } = await loadFixture(setup);

      await setUpAllowance({
        balance: 1000,
        maxRefill: 5000,
        refill: 100,
        period: 600,
        timestamp: 123456,
      });

      const allowance = await mock.load(allowanceKey);

      expect(allowance.balance).to.equal(1000);
      expect(allowance.maxRefill).to.equal(5000);
      expect(allowance.refill).to.equal(100);
      expect(allowance.period).to.equal(600);
      expect(allowance.timestamp).to.equal(123456);
    });
  });

  describe("accrue()", () => {
    it("returns original balance and timestamp when period is zero", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        refill: 100,
        period: 0,
        timestamp: 1000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 9999);

      expect(balance).to.equal(500);
      expect(timestamp).to.equal(1000);
    });

    it("returns original values when called before next interval", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 5599);

      expect(balance).to.equal(500);
      expect(timestamp).to.equal(5000);
    });

    it("accrues exactly one interval at the boundary", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        maxRefill: 10000,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 5600);

      expect(balance).to.equal(600);
      expect(timestamp).to.equal(5600);
    });

    it("accrues multiple intervals while remaining below maxRefill", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        maxRefill: 10000,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 8000); // 5 intervals

      expect(balance).to.equal(1000);
      expect(timestamp).to.equal(8000);
    });

    it("caps accrued balance at maxRefill", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        maxRefill: 1000,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 11000); // 10 intervals, would be 1500

      expect(balance).to.equal(1000);
      expect(timestamp).to.equal(11000);
    });

    it("does not increase balance when already at maxRefill", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 1000,
        maxRefill: 1000,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 8000);

      expect(balance).to.equal(1000);
      expect(timestamp).to.equal(8000);
    });

    it("keeps balance unchanged when initial balance exceeds maxRefill", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 1500,
        maxRefill: 1000,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 8000);

      expect(balance).to.equal(1500);
      expect(timestamp).to.equal(8000);
    });

    it("advances timestamp by elapsed intervals only", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        maxRefill: 10000,
        refill: 100,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 6500); // 2.5 intervals

      expect(balance).to.equal(700);
      expect(timestamp).to.equal(6200); // 5000 + 600 * 2, not 6500
    });

    it("handles zero refill without changing balance", async () => {
      const { allowanceKey, setUpAllowance } = await loadFixture(setup);
      const mock = await setUpAllowance({
        balance: 500,
        maxRefill: 1000,
        refill: 0,
        period: 600,
        timestamp: 5000,
      });

      const [balance, timestamp] = await mock.accrue(allowanceKey, 8000);

      expect(balance).to.equal(500);
      expect(timestamp).to.equal(8000);
    });
  });
});
