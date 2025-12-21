import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

import { AbiCoder, solidityPacked, ZeroHash } from "ethers";

import {
  Encoding,
  flattenCondition,
  Operator,
  PermissionCheckerStatus,
} from "../utils";

function pluck(index: number) {
  return {
    paramType: Encoding.Static,
    operator: Operator.Pluck,
    compValue: "0x" + index.toString(16).padStart(2, "0"),
  };
}
import { setupTwoParamsStatic, deployRolesMod } from "../setup";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Roles";

describe("WithinRatio Operator", () => {
  describe("Core Functionality", () => {
    describe("maxRatio enforcement", () => {
      it("enforces maxRatio bound with proper boundary behavior", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 3,
          referenceDecimals: 0,
          relativeIndex: 7,
          relativeDecimals: 0,
          minRatio: 0, // no lower bound
          maxRatio: 9500, // 95% upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(3),
              pluck(7),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: param 0 = 1000, Relative: param 1 = 800
        // Ratio = 800/1000 = 80% = 8000 bps < 9500 → pass
        await expect(invoke(1000, 800)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 900
        // Ratio = 900/1000 = 90% = 9000 bps < 9500 → pass
        await expect(invoke(1000, 900)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 950
        // Ratio = 950/1000 = 95% = 9500 bps == 9500 → pass (boundary)
        await expect(invoke(1000, 950)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 951
        // Ratio = 951/1000 = 95.1% = 9510 bps > 9500 → fail
        await expect(invoke(1000, 951))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);

        // Reference: param 0 = 1000, Relative: param 1 = 1100
        // Ratio = 1100/1000 = 110% = 11000 bps > 9500 → fail
        await expect(invoke(1000, 1100))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("skips check when maxRatio is 0 (no upper bound)", async () => {
        const { scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Inverted: pluck second param first, reference uses index 1
        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 1,
          referenceDecimals: 0,
          relativeIndex: 0,
          relativeDecimals: 0,
          minRatio: 12000,
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(1), // param 0 -> pluckedValues[1]
              pluck(0), // param 1 -> pluckedValues[0]
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1199)).to.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 1200
        // Ratio = 1200/1000 = 120% → pass (maxRatio=0 means no upper bound)
        await expect(invoke(1000, 1200)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 5000
        // Ratio = 5000/1000 = 500% → pass
        await expect(invoke(1000, 5000)).to.not.be.reverted;
      });
    });

    describe("minRatio enforcement", () => {
      it("enforces minRatio bound with proper boundary behavior", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 5,
          referenceDecimals: 0,
          relativeIndex: 2,
          relativeDecimals: 0,
          minRatio: 9000, // 90% lower bound
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(5),
              pluck(2),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: param 0 = 1000, Relative: param 1 = 500
        // Ratio = 500/1000 = 50% = 5000 bps < 9000 → fail
        await expect(invoke(1000, 500))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Reference: param 0 = 1000, Relative: param 1 = 850
        // Ratio = 850/1000 = 85% = 8500 bps < 9000 → fail
        await expect(invoke(1000, 850))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Reference: param 0 = 1000, Relative: param 1 = 900
        // Ratio = 900/1000 = 90% = 9000 bps == 9000 → pass (boundary)
        await expect(invoke(1000, 900)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 950
        // Ratio = 950/1000 = 95% = 9500 bps > 9000 → pass
        await expect(invoke(1000, 950)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 1000
        // Ratio = 1000/1000 = 100% = 10000 bps > 9000 → pass
        await expect(invoke(1000, 1000)).to.not.be.reverted;
      });

      it("skips check when minRatio is 0 (no lower bound)", async () => {
        const { scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 4,
          relativeDecimals: 0,
          minRatio: 0, // no lower bound
          maxRatio: 10000,
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(0),
              pluck(4),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: param 0 = 1000, Relative: param 1 = 100
        // Ratio = 100/1000 = 10% → pass (minRatio=0 means no lower bound)
        await expect(invoke(1000, 100)).to.not.be.reverted;

        // Reference: param 0 = 1000, Relative: param 1 = 10
        // Ratio = 10/1000 = 1% → pass
        await expect(invoke(1000, 10)).to.not.be.reverted;
      });
    });

    describe("price adapter scenarios", () => {
      it("no adapters - min 1/4 ratio (≥25%)", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 10,
          referenceDecimals: 18,
          relativeIndex: 20,
          relativeDecimals: 18,
          minRatio: 2500, // 25%
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(10),
              pluck(20),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 1000 tokens (18 decimals)
        // Relative: 249 tokens (18 decimals)
        // Ratio = 249 / 1000 = 24.9% → fail
        await expect(invoke(1000n * 10n ** 18n, 249n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Relative: 250 tokens
        // Ratio = 250 / 1000 = 25% → pass
        await expect(invoke(1000n * 10n ** 18n, 250n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 300 tokens
        // Ratio = 300 / 1000 = 30% → pass
        await expect(invoke(1000n * 10n ** 18n, 300n * 10n ** 18n)).to.not.be
          .reverted;
      });

      it("no adapters - max 5x ratio (≤500%)", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 8,
          referenceDecimals: 18,
          relativeIndex: 15,
          relativeDecimals: 18,
          minRatio: 0, // no lower bound
          maxRatio: 50000, // 500%
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(8),
              pluck(15),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 1000 tokens (18 decimals)
        // Relative: 4900 tokens (18 decimals)
        // Ratio = 4900 / 1000 = 490% → pass
        await expect(invoke(1000n * 10n ** 18n, 4900n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 5000 tokens
        // Ratio = 5000 / 1000 = 500% → pass
        await expect(invoke(1000n * 10n ** 18n, 5000n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 5001 tokens
        // Ratio = 5001 / 1000 = 500.1% → fail
        await expect(invoke(1000n * 10n ** 18n, 5001n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("ETH/USD - ETH converts to USD base", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy ETH/USD adapter: 1 ETH = 2000 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const ethUsdAdapter = await MockPricing.deploy(2000n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await ethUsdAdapter.getAddress(),
          relativeAdapter: "0x0000000000000000000000000000000000000000",
          referenceIndex: 2,
          referenceDecimals: 18, // ETH
          relativeIndex: 3,
          relativeDecimals: 18, // USD stablecoin
          minRatio: 9950, // 99.5% (0.5% tolerance)
          maxRatio: 10050, // 100.5%
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(2),
              pluck(3),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 10 ETH (18 decimals)
        // Relative: 20,000 USD (18 decimals)
        // Ratio = (20,000 × 1) / (10 × 2000) = 100% → pass
        await expect(invoke(10n * 10n ** 18n, 20000n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 19,880 USD
        // Ratio = (19,880 × 1) / (10 × 2000) = 99.4% → fail
        await expect(invoke(10n * 10n ** 18n, 19880n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Relative: 20,120 USD
        // Ratio = (20,120 × 1) / (10 × 2000) = 100.6% → fail
        await expect(invoke(10n * 10n ** 18n, 20120n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("USD/WBTC - WBTC converts to USD base", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy WBTC/USD adapter: 1 WBTC = 150,000 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const wbtcUsdAdapter = await MockPricing.deploy(150000n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await wbtcUsdAdapter.getAddress(),
          referenceIndex: 0,
          referenceDecimals: 18, // USD stablecoin
          relativeIndex: 5,
          relativeDecimals: 8, // WBTC uses 8 decimals
          minRatio: 9900, // 99%
          maxRatio: 10100, // 101% (1% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(0),
              pluck(5),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 45,000 USD (18 decimals)
        // Relative: 0.3 WBTC (8 decimals)
        // Ratio = (0.3 × 150,000) / (45,000 × 1) = 100% → pass
        await expect(invoke(45000n * 10n ** 18n, 3n * 10n ** 7n)).to.not.be
          .reverted;

        // Relative: 0.297 WBTC
        // Ratio = (0.297 × 150,000) / (45,000 × 1) = 99% → pass
        await expect(invoke(45000n * 10n ** 18n, 297n * 10n ** 5n)).to.not.be
          .reverted;

        // Relative: 0.2967 WBTC
        // Ratio = (0.2967 × 150,000) / (45,000 × 1) = 98.9% → fail
        await expect(invoke(45000n * 10n ** 18n, 2967n * 10n ** 4n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Relative: 0.30303 WBTC
        // Ratio = (0.30303 × 150,000) / (45,000 × 1) = 101.01% → fail
        await expect(invoke(45000n * 10n ** 18n, 30303000n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("ETH/BTC - both convert to USD base", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy ETH/USD adapter: 1 ETH = 2000 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const ethUsdAdapter = await MockPricing.deploy(2000n * 10n ** 18n);

        // Deploy BTC/USD adapter: 1 BTC = 150,000 USD
        const btcUsdAdapter = await MockPricing.deploy(150000n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await ethUsdAdapter.getAddress(),
          relativeAdapter: await btcUsdAdapter.getAddress(),
          referenceIndex: 4,
          referenceDecimals: 18, // ETH
          relativeIndex: 1,
          relativeDecimals: 8, // BTC uses 8 decimals
          minRatio: 9950, // 99.5%
          maxRatio: 10050, // 100.5% (0.5% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(4), // param 0 -> pluckedValues[4] (reference)
              pluck(1), // param 1 -> pluckedValues[1] (relative)
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 22.5 ETH (18 decimals)
        // Relative: 0.3 BTC (8 decimals)
        // Ratio = (0.3 × 150,000) / (22.5 × 2000) = 100% → pass
        await expect(invoke(225n * 10n ** 17n, 3n * 10n ** 7n)).to.not.be
          .reverted;

        // Relative: 0.2985 BTC
        // Ratio = (0.2985 × 150,000) / (22.5 × 2000) = 99.5% → pass
        await expect(invoke(225n * 10n ** 17n, 2985n * 10n ** 4n)).to.not.be
          .reverted;

        // Relative: 0.29848 BTC
        // Ratio = (0.29848 × 150,000) / (22.5 × 2000) = 99.49% → fail
        await expect(invoke(225n * 10n ** 17n, 29848n * 10n ** 4n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);

        // Relative: 0.30225 BTC
        // Ratio = (0.30225 × 150,000) / (22.5 × 2000) = 100.75% → fail
        await expect(invoke(225n * 10n ** 17n, 30225n * 10n ** 4n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("ETH/WBTC - both convert to WBTC base", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy ETH/WBTC adapter: 1 ETH = 0.045 WBTC
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const ethWbtcAdapter = await MockPricing.deploy(45n * 10n ** 15n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await ethWbtcAdapter.getAddress(),
          referenceIndex: 6,
          referenceDecimals: 8, // WBTC uses 8 decimals
          relativeIndex: 9,
          relativeDecimals: 18, // ETH
          minRatio: 9800, // 98%
          maxRatio: 10200, // 102% (2% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(6),
              pluck(9),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 1 WBTC (8 decimals)
        // Relative: 22.222222... ETH (18 decimals)
        // Ratio = (22.222222... × 0.045) / (1 × 1) = 100% → pass
        await expect(invoke(1n * 10n ** 8n, 22222222222222222222n)).to.not.be
          .reverted;

        // Relative: 21.777777... ETH
        // Ratio = (21.777777... × 0.045) / (1 × 1) = 98% → pass
        await expect(invoke(1n * 10n ** 8n, 21777777777777777778n)).to.not.be
          .reverted;

        // Relative: 21.755555... ETH
        // Ratio = (21.755555... × 0.045) / (1 × 1) = 97.9% → fail
        await expect(invoke(1n * 10n ** 8n, 21755555555555555556n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Relative: 22.688888... ETH
        // Ratio = (22.688888... × 0.045) / (1 × 1) = 102.1% → fail
        await expect(invoke(1n * 10n ** 8n, 22688888888888888889n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("ETH/WBTC - both convert to ETH base", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy WBTC/ETH adapter: 1 WBTC = 10 ETH
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const wbtcEthAdapter = await MockPricing.deploy(10n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await wbtcEthAdapter.getAddress(),
          referenceIndex: 11,
          referenceDecimals: 18, // ETH
          relativeIndex: 7,
          relativeDecimals: 8, // WBTC uses 8 decimals
          minRatio: 9500, // 95%
          maxRatio: 10500, // 105% (5% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(11), // param 0 -> pluckedValues[11] (reference)
              pluck(7), // param 1 -> pluckedValues[7] (relative)
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 10 ETH (18 decimals)
        // Relative: 1 WBTC (8 decimals)
        // Ratio = (1 × 10) / (10 × 1) = 100% → pass
        await expect(invoke(10n * 10n ** 18n, 1n * 10n ** 8n)).to.not.be
          .reverted;

        // Relative: 0.95 WBTC
        // Ratio = (0.95 × 10) / (10 × 1) = 95% → pass
        await expect(invoke(10n * 10n ** 18n, 95n * 10n ** 6n)).to.not.be
          .reverted;

        // Relative: 0.949 WBTC
        // Ratio = (0.949 × 10) / (10 × 1) = 94.9% → fail
        await expect(invoke(10n * 10n ** 18n, 949n * 10n ** 5n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Relative: 1.051 WBTC
        // Ratio = (1.051 × 10) / (10 × 1) = 105.1% → fail
        await expect(invoke(10n * 10n ** 18n, 1051n * 10n ** 5n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("USDC/FunkyToken - large decimal normalization (6 vs 37 decimals)", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy FunkyToken/USDC adapter: 1 FunkyToken = 2 USDC (price adapters always return 18 decimals)
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const funkyUsdcAdapter = await MockPricing.deploy(2n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await funkyUsdcAdapter.getAddress(),
          referenceIndex: 100,
          referenceDecimals: 6, // USDC uses 6 decimals
          relativeIndex: 200,
          relativeDecimals: 37, // FunkyToken uses 37 decimals (max safe precision)
          minRatio: 9975, // 99.75%
          maxRatio: 10025, // 100.25% (0.25% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(100),
              pluck(200),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 1000 USDC (6 decimals)
        // Relative: 500 FunkyToken (37 decimals)
        // Ratio = (500 × 2) / (1000 × 1) = 100% → pass
        await expect(invoke(1000n * 10n ** 6n, 500n * 10n ** 37n)).to.not.be
          .reverted;

        // Relative: 498.75 FunkyToken
        // Ratio = (498.75 × 2) / (1000 × 1) = 99.75% → pass
        await expect(invoke(1000n * 10n ** 6n, 49875n * 10n ** 35n)).to.not.be
          .reverted;

        // Relative: 498.7 FunkyToken
        // Ratio = (498.7 × 2) / (1000 × 1) = 99.74% → fail
        await expect(invoke(1000n * 10n ** 6n, 4987n * 10n ** 34n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Relative: 501.3 FunkyToken
        // Ratio = (501.3 × 2) / (1000 × 1) = 100.26% → fail
        await expect(invoke(1000n * 10n ** 6n, 5013n * 10n ** 34n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);
      });
    });
  });

  describe("Parameter Extraction", () => {
    async function setupWithEncoder() {
      const [owner, member] = await hre.ethers.getSigners();

      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();
      const avatarAddress = await avatar.getAddress();

      const TestContract = await hre.ethers.getContractFactory("TestEncoder");
      const testContract = await TestContract.deploy();
      const testContractAddress = await testContract.getAddress();

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );

      await roles.connect(owner).enableModule(member.address);

      const roleKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await roles.connect(owner).grantRole(member.address, roleKey, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, roleKey);
      await roles.connect(owner).scopeTarget(roleKey, testContractAddress);

      const scopeFunction = (
        selector: string,
        conditions: ConditionFlatStruct[],

        options?: number,
      ) =>
        roles
          .connect(owner)
          .scopeFunction(
            roleKey,
            testContractAddress,
            selector,
            conditions,
            options || 0,
          );

      const execTransactionFromModule = async (data: string) =>
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, data, 0);

      return { roles, testContract, scopeFunction, execTransactionFromModule };
    }

    it("from AbiEncoded", async () => {
      const { roles, testContract, scopeFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      // Check ratio between first and third params, skipping dynamic middle param
      // Pluck param 0 -> pluckedValues[2], Pluck param 2 -> pluckedValues[4]
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 2,
        referenceDecimals: 0,
        relativeIndex: 4,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 12000, // 120%
      });

      await scopeFunction(
        testContract.interface.getFunction("mixedParams").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(2), // param 0 -> pluckedValues[2]
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            pluck(4), // param 2 -> pluckedValues[4]
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
        0,
      );

      // params[2] / params[0] <= 120%
      // 1200 / 1000 = 120% - pass
      await expect(
        execTransactionFromModule(
          (
            await testContract.mixedParams.populateTransaction(
              1000,
              "0xaabbcc",
              1200,
            )
          ).data!,
        ),
      ).to.not.be.reverted;

      // 1210 / 1000 = 120.1% > 120% - fail
      await expect(
        execTransactionFromModule(
          (
            await testContract.mixedParams.populateTransaction(
              1000,
              "0xaabbcc",
              1201,
            )
          ).data!,
        ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);

      // 1210 / 1000 = 120% <= 120% - ok
      await expect(
        execTransactionFromModule(
          (
            await testContract.mixedParams.populateTransaction(
              1000,
              "0xaabbcc",
              1200,
            )
          ).data!,
        ),
      ).to.not.be.reverted;
    });

    it("from nested AbiEncoded", async () => {
      const { roles, testContract, scopeFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      // Check ratio between first and third encoded values
      // Pluck encoded[0] -> pluckedValues[1], Pluck encoded[2] -> pluckedValues[3]
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 1,
        referenceDecimals: 0,
        relativeIndex: 3,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 8000, // 80%
      });

      await scopeFunction(
        testContract.interface.getFunction("dynamicStatic").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0000", // leadingBytes = 0 (no selector)
              children: [
                pluck(1), // encoded[0] -> pluckedValues[1]
                { paramType: Encoding.Static, operator: Operator.Pass },
                pluck(3), // encoded[2] -> pluckedValues[3]
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            },
          ],
        }),
        0,
      );

      const abiCoder = AbiCoder.defaultAbiCoder();

      // encoded[2] / encoded[0] <= 80%
      // 800 / 1000 = 80% - pass
      const encoded = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [1000, 500, 800],
      );
      await expect(
        execTransactionFromModule(
          (await testContract.dynamicStatic.populateTransaction(encoded)).data!,
        ),
      ).to.not.be.reverted;

      // 801 / 1000 = 80.1% > 80% - fail
      const encodedFail = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [1000, 500, 801],
      );
      await expect(
        execTransactionFromModule(
          (await testContract.dynamicStatic.populateTransaction(encodedFail))
            .data!,
        ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
    });

    it("from Tuple", async () => {
      const { roles, testContract, scopeFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      // MixedTuple has: amount(0), second(1), limit(2), fourth(3)
      // Pluck second(1) -> pluckedValues[5], Pluck fourth(3) -> pluckedValues[0]
      // Note: inverted indices - relative (5) comes before reference (0) in array
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 5,
        referenceDecimals: 0,
        relativeIndex: 0,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000, // 150%
      });

      await scopeFunction(
        testContract.interface.getFunction("mixedTuple").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass }, // amount
                pluck(5), // second -> pluckedValues[5] (reference)
                { paramType: Encoding.Static, operator: Operator.Pass }, // limit
                pluck(0), // fourth -> pluckedValues[0] (relative)
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            },
          ],
        }),
        0,
      );

      // fourth / second <= 150%
      // 1500 / 1000 = 150% - pass
      await expect(
        execTransactionFromModule(
          (
            await testContract.mixedTuple.populateTransaction({
              amount: 500,
              second: 1000,
              limit: 800,
              fourth: 1500,
            })
          ).data!,
        ),
      ).to.not.be.reverted;

      // 1501 / 1000 = 150.1% > 150% - fail
      await expect(
        execTransactionFromModule(
          (
            await testContract.mixedTuple.populateTransaction({
              amount: 500,
              second: 1000,
              limit: 800,
              fourth: 1501,
            })
          ).data!,
        ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
    });

    it("from Array", async () => {
      const { roles, testContract, scopeFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      // Pluck array[0] -> pluckedValues[3], Pluck array[2] -> pluckedValues[1]
      // Note: relative index (1) is smaller than reference index (3)
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 3,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 12000, // 120%
      });

      await scopeFunction(
        testContract.interface.getFunction("uint256ArrayStatic").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                pluck(3), // array[0] -> pluckedValues[3] (reference)
                { paramType: Encoding.Static, operator: Operator.Pass },
                pluck(1), // array[2] -> pluckedValues[1] (relative)
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            },
          ],
        }),
        0,
      );

      // array[2] / array[0] <= 120%
      // 1200 / 1000 = 120% - pass
      await expect(
        execTransactionFromModule(
          (
            await testContract.uint256ArrayStatic.populateTransaction([
              1000, 500, 1200,
            ])
          ).data!,
        ),
      ).to.not.be.reverted;

      // 1201 / 1000 = 120.1% > 120% - fail
      await expect(
        execTransactionFromModule(
          (
            await testContract.uint256ArrayStatic.populateTransaction([
              1000, 500, 1201,
            ])
          ).data!,
        ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
    });

    it("from EtherValue", async () => {
      const [owner, member] = await hre.ethers.getSigners();

      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();
      const avatarAddress = await avatar.getAddress();

      // Fund avatar
      await owner.sendTransaction({
        to: avatarAddress,
        value: 10n ** 18n,
      });

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();
      const testContractAddress = await testContract.getAddress();

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );

      await roles.connect(owner).enableModule(member.address);

      const roleKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await roles.connect(owner).grantRole(member.address, roleKey, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, roleKey);
      await roles.connect(owner).scopeTarget(roleKey, testContractAddress);

      const SELECTOR =
        testContract.interface.getFunction("fnWithSingleParam").selector;

      // Pluck ether value -> pluckedValues[0]
      // Pluck param -> pluckedValues[1]
      // Check ratio: param / ether <= 200%
      // Both values use 18 decimals for normalization
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 18,
        relativeIndex: 1,
        relativeDecimals: 18,
        minRatio: 0,
        maxRatio: 20000, // 200%
      });

      // Non-structural children (EtherValue, None) must come after structural (AbiEncoded)
      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [pluck(1)],
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.Pluck,
              compValue: "0x00",
            },
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
        1, // ExecutionOptions.Send
      );

      async function invoke(etherValue: bigint, param: bigint) {
        return roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            etherValue,
            (await testContract.fnWithSingleParam.populateTransaction(param))
              .data as string,
            0,
          );
      }

      // ether = 1 ETH, param = 2 * 10^18 → ratio = 200% → pass
      await expect(invoke(10n ** 18n, 2n * 10n ** 18n)).to.not.be.reverted;

      // ether = 1 ETH, param = 1 * 10^18 → ratio = 100% → pass
      await expect(invoke(10n ** 18n, 1n * 10n ** 18n)).to.not.be.reverted;

      // ether = 1 ETH, param = 2.1 * 10^18 → ratio = 210% > 200% → fail
      await expect(invoke(10n ** 18n, 21n * 10n ** 17n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
    });
  });
});

// Helper function to encode compValue for WithinRatio operator
function encodeWithinRatioCompValue({
  referenceAdapter = "0x0000000000000000000000000000000000000000",
  relativeAdapter = "0x0000000000000000000000000000000000000000",
  referenceIndex,
  referenceDecimals,
  relativeIndex,
  relativeDecimals,
  minRatio,
  maxRatio,
}: {
  referenceAdapter?: string;
  relativeAdapter?: string;
  referenceIndex: number;
  referenceDecimals: number;
  relativeIndex: number;
  relativeDecimals: number;
  minRatio: number;
  maxRatio: number;
}): string {
  return solidityPacked(
    [
      "uint8",
      "uint8",
      "uint8",
      "uint8",
      "uint32",
      "uint32",
      "address",
      "address",
    ],
    [
      referenceIndex,
      referenceDecimals,
      relativeIndex,
      relativeDecimals,
      minRatio,
      maxRatio,
      referenceAdapter,
      relativeAdapter,
    ],
  );
}
