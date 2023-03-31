import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ConsumptionStructOutput } from "../typechain-types/contracts/Consumptions";

describe.only("Consumptions library", async () => {
  async function setup() {
    const MockConsumptions = await hre.ethers.getContractFactory(
      "MockConsumptions"
    );
    const consumptions = await MockConsumptions.deploy();

    return {
      consumptions,
    };
  }

  describe("merge()", () => {
    it("only left hand with elements", async () => {
      const { consumptions } = await loadFixture(setup);

      const c1 = [
        {
          allowanceKey: "0xff".padEnd(66, "0"),
          balance: 0,
        },
      ];

      const result = await consumptions.merge(c1, []);

      expect(filter(result)).to.deep.equal(c1);
    });

    it("only right hand with elements", async () => {
      const { consumptions } = await loadFixture(setup);

      const c2 = [
        {
          allowanceKey: "0xff".padEnd(66, "0"),
          balance: 0,
        },
      ];

      const result = await consumptions.merge([], c2);

      expect(filter(result)).to.deep.equal(c2);
    });

    it("both with elements no overlap", async () => {
      const { consumptions } = await loadFixture(setup);

      const c1 = [
        {
          allowanceKey: "0xa".padEnd(66, "0"),
          balance: 0,
        },
      ];
      const c2 = [
        {
          allowanceKey: "0xb".padEnd(66, "0"),
          balance: 0,
        },
      ];

      const result = await consumptions.merge(c1, c2);

      expect(filter(result)).to.deep.equal([
        {
          allowanceKey: "0xa".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xb".padEnd(66, "0"),
          balance: 0,
        },
      ]);
    });

    it("all elements overlap", async () => {
      const { consumptions } = await loadFixture(setup);

      const c1 = [
        {
          allowanceKey: "0xaa".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xbb".padEnd(66, "0"),
          balance: 0,
        },
      ];
      const c2 = [
        {
          allowanceKey: "0xbb".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xaa".padEnd(66, "0"),
          balance: 0,
        },
      ];

      const result = await consumptions.merge(c1, c2);

      expect(filter(result)).to.deep.equal([
        {
          allowanceKey: "0xaa".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xbb".padEnd(66, "0"),
          balance: 0,
        },
      ]);
    });

    it("some elements overlap", async () => {
      const { consumptions } = await loadFixture(setup);

      const c1 = [
        {
          allowanceKey: "0xaa".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xbb".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xdd".padEnd(66, "0"),
          balance: 0,
        },
      ];
      const c2 = [
        {
          allowanceKey: "0xcc".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xaa".padEnd(66, "0"),
          balance: 0,
        },
      ];

      const result = await consumptions.merge(c1, c2);

      expect(filter(result)).to.deep.equal([
        {
          allowanceKey: "0xaa".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xbb".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xdd".padEnd(66, "0"),
          balance: 0,
        },
        {
          allowanceKey: "0xcc".padEnd(66, "0"),
          balance: 0,
        },
      ]);
    });
  });
});

function filter(a: ConsumptionStructOutput[]) {
  return a.map(({ allowanceKey, balance }) => ({
    allowanceKey,
    balance,
  }));
}
