import hre from "hardhat";

describe("Consumptions library", async () => {
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
    it.skip("only left hand with elements");

    it.skip("only right hand with elements");

    it.skip("both with elements no overlap");

    it.skip("all elements overlap");

    it.skip("some elements overlap");
  });
});
