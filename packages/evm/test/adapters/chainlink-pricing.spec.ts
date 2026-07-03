import { expect } from "chai";
import { AbiCoder } from "ethers";

import { network } from "hardhat";

const coder = AbiCoder.defaultAbiCoder();

const connection = await network.create();
const { ethers, networkHelpers } = connection;
const { loadFixture, time } = networkHelpers;

describe("ChainlinkPricing", () => {
  after(async () => {
    await connection.close();
  });

  async function setup() {
    const now = await time.latest();

    const ChainlinkPricing =
      await ethers.getContractFactory("ChainlinkPricing");
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await ethers.getContractFactory("MockChainlinkAggregatorV3");
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
    expect(price).to.equal(10n ** 36n / (2000n * 10n ** 18n));
  });

  it("rounds inverted quote up on truncation", async () => {
    const now = await time.latest();

    const ChainlinkPricing =
      await ethers.getContractFactory("ChainlinkPricing");
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await ethers.getContractFactory("MockChainlinkAggregatorV3");
    // 3000e8: 1e36 / 3000e18 = 333333333333333.33… → truncation
    const feed = await Feed.deploy(8, 1, 3000n * 10n ** 8n, now, 1);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), true, 3600],
    );

    const price = await pricing.getPrice(params);
    // an understated price would understate allowance consumption
    expect(price).to.equal(10n ** 36n / (3000n * 10n ** 18n) + 1n);
  });

  it("does not understate the inverted price for feeds with more than 18 decimals", async () => {
    const now = await time.latest();

    const ChainlinkPricing =
      await ethers.getContractFactory("ChainlinkPricing");
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await ethers.getContractFactory("MockChainlinkAggregatorV3");
    // 20 decimals with a small answer: pre-fix, ceiling the denominator first
    // (ceil(150 / 10^2) = 2) collapsed precision and understated the inverted
    // price by 25% (5e35 instead of ~6.67e35).
    const decimals = 20n;
    const answer = 150n;
    const feed = await Feed.deploy(20, 1, answer, now, 1);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), true, 3600],
    );

    const price = await pricing.getPrice(params);
    // exact ceil of the true inverse: ceil(1e36 * 10^(decimals-18) / answer).
    // = ~6.67e35; the pre-fix double-rounding returned 5e35 (25% low).
    const expected =
      (10n ** 36n * 10n ** (decimals - 18n) + answer - 1n) / answer;
    expect(price).to.equal(expected);
  });

  it("rounds up when scaling down feeds with more than 18 decimals", async () => {
    const now = await time.latest();

    const ChainlinkPricing =
      await ethers.getContractFactory("ChainlinkPricing");
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await ethers.getContractFactory("MockChainlinkAggregatorV3");
    // 20 decimals, answer not divisible by 100
    const feed = await Feed.deploy(20, 1, 2000n * 10n ** 20n + 1n, now, 1);

    const params = coder.encode(
      ["address", "bool", "uint256"],
      [await feed.getAddress(), false, 3600],
    );

    const price = await pricing.getPrice(params);
    expect(price).to.equal(2000n * 10n ** 18n + 1n);
  });

  it("reverts on stale prices", async () => {
    const now = await time.latest();

    const ChainlinkPricing =
      await ethers.getContractFactory("ChainlinkPricing");
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await ethers.getContractFactory("MockChainlinkAggregatorV3");
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

    const ChainlinkPricing =
      await ethers.getContractFactory("ChainlinkPricing");
    const pricing = await ChainlinkPricing.deploy();

    const Feed = await ethers.getContractFactory("MockChainlinkAggregatorV3");
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
