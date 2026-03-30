import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";

const coder = AbiCoder.defaultAbiCoder();

describe("ChainlinkPricing", () => {
  async function setup() {
    const now = await time.latest();

    const ChainlinkPricing = await hre.ethers.getContractFactory(
      "ChainlinkPricing",
    );
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await hre.ethers.getContractFactory("MockChainlinkAggregatorV3");
    const feed = await Feed.deploy(8, 1, 2000n * 10n ** 8n, now, 1);

    return { pricing, feed };
  }

  it("returns 18-decimal normalized price", async () => {
    const { pricing, feed } = await loadFixture(setup);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), false, 3600],
    );

    const price = await pricing.getPrice(params);
    expect(price).to.equal(2000n * 10n ** 18n);
  });

  it("supports inverted quote", async () => {
    const { pricing, feed } = await loadFixture(setup);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), true, 3600],
    );

    const price = await pricing.getPrice(params);
    expect(price).to.equal((10n ** 36n) / (2000n * 10n ** 18n));
  });

  it("reverts on stale prices", async () => {
    const now = await time.latest();

    const ChainlinkPricing = await hre.ethers.getContractFactory(
      "ChainlinkPricing",
    );
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await hre.ethers.getContractFactory("MockChainlinkAggregatorV3");
    const staleAt = now - 1000;
    const feed = await Feed.deploy(8, 1, 1000n * 10n ** 8n, staleAt, 1);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), false, 300],
    );

    await expect(pricing.getPrice(params))
      .to.be.revertedWithCustomError(pricing, "StalePrice")
      .withArgs(staleAt, 300);
  });

  it("reverts for non-positive answers", async () => {
    const now = await time.latest();

    const ChainlinkPricing = await hre.ethers.getContractFactory(
      "ChainlinkPricing",
    );
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await hre.ethers.getContractFactory("MockChainlinkAggregatorV3");
    const feed = await Feed.deploy(8, 1, 0, now, 1);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), false, 3600],
    );

    await expect(pricing.getPrice(params)).to.be.revertedWithCustomError(
      pricing,
      "InvalidAnswer",
    );
  });
});
