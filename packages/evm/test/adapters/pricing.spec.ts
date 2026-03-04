import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";

const coder = AbiCoder.defaultAbiCoder();

describe("Pricing adapters", () => {
  async function setupChainlink() {
    const now = await time.latest();

    const ChainlinkPricing = await hre.ethers.getContractFactory(
      "ChainlinkPricing",
    );
    const pricing = await ChainlinkPricing.deploy(3600, true);

    const Feed = await hre.ethers.getContractFactory("MockChainlinkAggregatorV3");
    const feed = await Feed.deploy(8, 1, 2000n * 10n ** 8n, now, 1);

    return { pricing, feed };
  }

  describe("ChainlinkPricing", () => {
    it("returns 18-decimal normalized price", async () => {
      const { pricing, feed } = await loadFixture(setupChainlink);

      const params = coder.encode(
        ["address", "bool"],
        [await feed.getAddress(), false],
      );

      const price = await pricing.getPrice(params);
      expect(price).to.equal(2000n * 10n ** 18n);
    });

    it("supports inverted quote", async () => {
      const { pricing, feed } = await loadFixture(setupChainlink);

      const params = coder.encode(
        ["address", "bool"],
        [await feed.getAddress(), true],
      );

      const price = await pricing.getPrice(params);
      expect(price).to.equal((10n ** 36n) / (2000n * 10n ** 18n));
    });

    it("reverts on stale prices", async () => {
      const now = await time.latest();

      const ChainlinkPricing = await hre.ethers.getContractFactory(
        "ChainlinkPricing",
      );
      const pricing = await ChainlinkPricing.deploy(300, true);

      const Feed = await hre.ethers.getContractFactory("MockChainlinkAggregatorV3");
      const staleAt = now - 1000;
      const feed = await Feed.deploy(8, 1, 1000n * 10n ** 8n, staleAt, 1);

      const params = coder.encode(
        ["address", "bool"],
        [await feed.getAddress(), false],
      );

      await expect(pricing.getPrice(params))
        .to.be.revertedWithCustomError(pricing, "StalePrice")
        .withArgs(staleAt, 300);
    });
  });

  describe("UniswapPricing", () => {
    async function setupUniswap() {
      const [token0, token1] = await hre.ethers.getSigners();

      const UniswapPricing = await hre.ethers.getContractFactory("UniswapPricing");
      const pricing = await UniswapPricing.deploy(3600);

      const Pool = await hre.ethers.getContractFactory("MockUniswapV3PoolOracle");
      const pool = await Pool.deploy(token0.address, token1.address);

      return { pricing, pool };
    }

    it("reads TWAP price from pool source params", async () => {
      const { pricing, pool } = await loadFixture(setupUniswap);

      // Mean tick = 0 => token1/token0 price = 1
      await pool.setTickCumulativeDelta(0);

      const params = coder.encode(
        ["address", "bool"],
        [await pool.getAddress(), false],
      );

      const price = await pricing.getPrice(params);
      expect(price).to.equal(10n ** 18n);
    });

    it("supports invert from params", async () => {
      const { pricing, pool } = await loadFixture(setupUniswap);

      await pool.setTickCumulativeDelta(3600n * 100n);

      const forwardParams = coder.encode(
        ["address", "bool"],
        [await pool.getAddress(), false],
      );
      const inverseParams = coder.encode(
        ["address", "bool"],
        [await pool.getAddress(), true],
      );

      const forward = await pricing.getPrice(forwardParams);
      const inverse = await pricing.getPrice(inverseParams);

      expect(forward).to.be.gt(10n ** 18n);
      expect(inverse).to.be.lt(10n ** 18n);
    });
  });

  describe("ConsensusPricing", () => {
    async function setupCombined() {
      const ConsensusPricing = await hre.ethers.getContractFactory("ConsensusPricing");
      const combined = await ConsensusPricing.deploy();

      const MockPricing = await hre.ethers.getContractFactory("MockPricing");
      const p1 = await MockPricing.deploy(1_000_000_000_000_000_000n);
      const p2 = await MockPricing.deploy(1_100_000_000_000_000_000n);

      return { combined, p1, p2 };
    }

    it("averages prices from multiple adapters with per-adapter params", async () => {
      const { combined, p1, p2 } = await loadFixture(setupCombined);

      const params = coder.encode(
        ["tuple(address adapter, bytes params)[]", "uint256"],
        [
          [
            [await p1.getAddress(), "0x"],
            [await p2.getAddress(), "0x"],
          ],
          1000, // 10%
        ],
      );

      const mean = await combined.getPrice(params);
      expect(mean).to.equal(1_050_000_000_000_000_000n);
    });

    it("reverts when any source deviates above maxDeviationBps", async () => {
      const { combined, p1, p2 } = await loadFixture(setupCombined);

      const params = coder.encode(
        ["tuple(address adapter, bytes params)[]", "uint256"],
        [
          [
            [await p1.getAddress(), "0x"],
            [await p2.getAddress(), "0x"],
          ],
          400, // 4% < ~4.76% deviation from mean
        ],
      );

      await expect(combined.getPrice(params)).to.be.revertedWithCustomError(
        combined,
        "DeviationExceeded",
      );
    });

    it("works with different params for each source adapter", async () => {
      const now = await time.latest();

      const ConsensusPricing = await hre.ethers.getContractFactory("ConsensusPricing");
      const combined = await ConsensusPricing.deploy();

      const ChainlinkPricing = await hre.ethers.getContractFactory(
        "ChainlinkPricing",
      );
      const chainlink = await ChainlinkPricing.deploy(3600, true);

      const Feed = await hre.ethers.getContractFactory("MockChainlinkAggregatorV3");
      const feedA = await Feed.deploy(8, 1, 1500n * 10n ** 8n, now, 1);
      const feedB = await Feed.deploy(8, 1, 2500n * 10n ** 8n, now, 1);

      const sourceAParams = coder.encode(
        ["address", "bool"],
        [await feedA.getAddress(), false],
      );
      const sourceBParams = coder.encode(
        ["address", "bool"],
        [await feedB.getAddress(), false],
      );

      const params = coder.encode(
        ["tuple(address adapter, bytes params)[]", "uint256"],
        [
          [
            [await chainlink.getAddress(), sourceAParams],
            [await chainlink.getAddress(), sourceBParams],
          ],
          10_000,
        ],
      );

      const mean = await combined.getPrice(params);
      expect(mean).to.equal(2000n * 10n ** 18n);
    });
  });
});
