import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

import { AbiCoder, solidityPacked, ZeroHash } from "ethers";

import {
  AbiType,
  flattenCondition,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import { setupTwoParamsStatic } from "../setup";

describe("WithinRatio Operator", () => {
  describe("Core Functionality", () => {
    describe("maxRatio enforcement", () => {
      it("enforces maxRatio bound with proper boundary behavior", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0, // no lower bound
          maxRatio: 9500, // 95% upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

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
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 9000, // 90% lower bound
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0, // no lower bound
          maxRatio: 0,
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
          referenceIndex: 0,
          referenceDecimals: 18,
          relativeIndex: 1,
          relativeDecimals: 18,
          minRatio: 2500, // 25%
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
          referenceIndex: 0,
          referenceDecimals: 18,
          relativeIndex: 1,
          relativeDecimals: 18,
          minRatio: 0, // no lower bound
          maxRatio: 50000, // 500%
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const ethUsdAdapter = await MockPriceAdapter.deploy(2000n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await ethUsdAdapter.getAddress(),
          relativeAdapter: "0x0000000000000000000000000000000000000000",
          referenceIndex: 0,
          referenceDecimals: 18, // ETH
          relativeIndex: 1,
          relativeDecimals: 18, // USD stablecoin
          minRatio: 9950, // 99.5% (0.5% tolerance)
          maxRatio: 10050, // 100.5%
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const wbtcUsdAdapter = await MockPriceAdapter.deploy(
          150000n * 10n ** 18n,
        );

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await wbtcUsdAdapter.getAddress(),
          referenceIndex: 0,
          referenceDecimals: 18, // USD stablecoin
          relativeIndex: 1,
          relativeDecimals: 8, // WBTC uses 8 decimals
          minRatio: 9900, // 99%
          maxRatio: 10100, // 101% (1% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const ethUsdAdapter = await MockPriceAdapter.deploy(2000n * 10n ** 18n);

        // Deploy BTC/USD adapter: 1 BTC = 150,000 USD
        const btcUsdAdapter = await MockPriceAdapter.deploy(
          150000n * 10n ** 18n,
        );

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await ethUsdAdapter.getAddress(),
          relativeAdapter: await btcUsdAdapter.getAddress(),
          referenceIndex: 0,
          referenceDecimals: 18, // ETH
          relativeIndex: 1,
          relativeDecimals: 8, // BTC uses 8 decimals
          minRatio: 9950, // 99.5%
          maxRatio: 10050, // 100.5% (0.5% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const ethWbtcAdapter = await MockPriceAdapter.deploy(45n * 10n ** 15n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await ethWbtcAdapter.getAddress(),
          referenceIndex: 0,
          referenceDecimals: 8, // WBTC uses 8 decimals
          relativeIndex: 1,
          relativeDecimals: 18, // ETH
          minRatio: 9800, // 98%
          maxRatio: 10200, // 102% (2% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const wbtcEthAdapter = await MockPriceAdapter.deploy(10n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await wbtcEthAdapter.getAddress(),
          referenceIndex: 0,
          referenceDecimals: 18, // ETH
          relativeIndex: 1,
          relativeDecimals: 8, // WBTC uses 8 decimals
          minRatio: 9500, // 95%
          maxRatio: 10500, // 105% (5% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const funkyUsdcAdapter = await MockPriceAdapter.deploy(2n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: "0x0000000000000000000000000000000000000000",
          relativeAdapter: await funkyUsdcAdapter.getAddress(),
          referenceIndex: 0,
          referenceDecimals: 6, // USDC uses 6 decimals
          relativeIndex: 1,
          relativeDecimals: 37, // FunkyToken uses 37 decimals (max safe precision)
          minRatio: 9975, // 99.75%
          maxRatio: 10025, // 100.25% (0.25% slippage tolerance)
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.None,
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
    describe("as child of Calldata", () => {
      it("extracts reference and relative amounts correctly", async () => {
        // TODO: Implement - simple passing case to verify extraction
      });
    });

    describe("as child of Tuple", () => {
      it("extracts reference and relative amounts correctly", async () => {
        // TODO: Implement - simple passing case to verify extraction
      });
    });

    describe("as child of Array", () => {
      it("extracts reference and relative amounts correctly", async () => {
        // TODO: Implement - simple passing case to verify extraction
      });
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
