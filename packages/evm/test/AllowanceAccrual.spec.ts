import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AllowanceAccrual", async () => {
  async function setup() {
    const MockAllowanceAccrual = await hre.ethers.getContractFactory(
      "MockAllowanceAccrual",
    );
    const mock = await MockAllowanceAccrual.deploy();

    return { mock };
  }

  describe("accrue()", () => {
    it("returns original balance and timestamp when period is zero", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 0,
          refill: 100,
          period: 0,
          timestamp: 1000,
        },
        9999,
      );

      expect(balance).to.equal(500);
      expect(timestamp).to.equal(1000);
    });

    it("returns original values when called before next interval", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 0,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        5599,
      );

      expect(balance).to.equal(500);
      expect(timestamp).to.equal(5000);
    });

    it("accrues exactly one interval at the boundary", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 10000,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        5600,
      );

      expect(balance).to.equal(600);
      expect(timestamp).to.equal(5600);
    });

    it("accrues multiple intervals while remaining below maxRefill", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 10000,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        8000, // 5 intervals
      );

      expect(balance).to.equal(1000);
      expect(timestamp).to.equal(8000);
    });

    it("caps accrued balance at maxRefill", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 1000,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        11000, // 10 intervals, would be 1500
      );

      expect(balance).to.equal(1000);
      expect(timestamp).to.equal(11000);
    });

    it("does not increase balance when already at maxRefill", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 1000,
          maxRefill: 1000,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        8000,
      );

      expect(balance).to.equal(1000);
      expect(timestamp).to.equal(8000);
    });

    it("keeps balance unchanged when initial balance exceeds maxRefill", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 1500,
          maxRefill: 1000,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        8000,
      );

      expect(balance).to.equal(1500);
      expect(timestamp).to.equal(8000);
    });

    it("advances timestamp by elapsed intervals only", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 10000,
          refill: 100,
          period: 600,
          timestamp: 5000,
        },
        6500, // 2.5 intervals
      );

      expect(balance).to.equal(700);
      expect(timestamp).to.equal(6200); // 5000 + 600 * 2, not 6500
    });

    it("handles zero refill without changing balance", async () => {
      const { mock } = await loadFixture(setup);

      const [balance, timestamp] = await mock.accrue(
        {
          balance: 500,
          maxRefill: 1000,
          refill: 0,
          period: 600,
          timestamp: 5000,
        },
        8000,
      );

      expect(balance).to.equal(500);
      expect(timestamp).to.equal(8000);
    });
  });
});
