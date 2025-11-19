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

/**
 * # WithinRatio Operator Test Suite
 *
 * ## What's tested
 *
 * ### 1. Core Ratio Validation
 * - **Ratio Calculation**: Validates that ratio = (relativeAmount × relativePrice) / (referenceAmount × referencePrice)
 * - **Min/Max Bounds**: Tests enforcement of minRatio and maxRatio thresholds (in basis points)
 * - **Boundary Conditions**: Verifies exact boundary values (ratio == minRatio, ratio == maxRatio)
 *
 * ### 2. Price Adapter Scenarios
 * - **No Adapters (0x0, 0x0)**: Direct 1:1 comparison of amounts
 * - **Reference Only (adapter, 0x0)**: Converts reference to base, relative stays 1:1
 * - **Relative Only (0x0, adapter)**: Converts relative to base, reference stays 1:1
 * - **Both Adapters (adapter1, adapter2)**: Converts both to common base (e.g., ETH/USD + BTC/USD)
 *
 * ### 3. Decimal Normalization
 * - Tests tokens with different decimal places (6, 18, 36, etc.)
 * - Validates upscaling to common precision before comparison
 *
 * ### 4. Parameter Extraction
 * - **Calldata**: Operator as child of Calldata (Matches)
 * - **Tuple**: Operator as child of Tuple
 * - **Array**: Operator as child of Array
 * - Ensures correct extraction of amounts from different payload structures
 *
 */

describe.only("WithinRatio Operator", () => {
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
      it("no adapters - direct 1:1 comparison", async () => {
        const { scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 18,
          relativeIndex: 1,
          relativeDecimals: 18,
          minRatio: 9500, // 95%
          maxRatio: 10500, // 105%
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

        // Reference: param 0 (1000 tokens, 18 decimals, no adapter → price = 1)
        // Relative: param 1 (1000 tokens, 18 decimals, no adapter → price = 1)
        // Ratio = (1000 × 1) / (1000 × 1) = 100% → pass (within 95%-105%)
        await expect(invoke(1000n * 10n ** 18n, 1000n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 949.9 tokens → ratio = 94.99% < 95% → fail
        await expect(invoke(1000n * 10n ** 18n, 9499n * 10n ** 18n)).to.be
          .reverted;

        // Relative: 1051 tokens → ratio = 105.1% > 105% → fail
        await expect(invoke(1000n * 10n ** 18n, 1051n * 10n ** 18n)).to.be
          .reverted;
      });

      it("ETH/USD - ETH converts to USD base", async () => {
        const { scopeFunction, invoke } =
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

        // Reference: param 0 = 10 ETH (18 decimals, adapter → price = 2000 USD/ETH)
        // Relative: param 1 = 20,000 USD (18 decimals, no adapter → price = 1)
        // Ratio = (20,000 × 1) / (10 × 2000) = 20,000 / 20,000 = 100% → pass (within 99.5%-100.5%)
        await expect(invoke(10n * 10n ** 18n, 20000n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 19,880 USD → ratio = 19,880 / 20,000 = 99.4% < 99.5% → fail
        await expect(invoke(10n * 10n ** 18n, 19880n * 10n ** 18n)).to.be
          .reverted;

        // Relative: 20,120 USD → ratio = 20,120 / 20,000 = 100.6% > 100.5% → fail
        await expect(invoke(10n * 10n ** 18n, 20120n * 10n ** 18n)).to.be
          .reverted;
      });

      it("USD/WBTC - WBTC converts to USD base", async () => {
        const { scopeFunction, invoke } =
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

        // Reference: param 0 = 45,000 USD (18 decimals, no adapter → price = 1)
        // Relative: param 1 = 0.3 WBTC (8 decimals, adapter → price = 150,000 USD/WBTC)
        // Ratio = (0.3 × 150,000) / (45,000 × 1) = 45,000 / 45,000 = 100% → pass (within 99%-101%)
        await expect(invoke(45000n * 10n ** 18n, 3n * 10n ** 7n)).to.not.be
          .reverted;

        // Reference: param 0 = 45,000 USD, Relative: param 1 = 0.297 WBTC
        // Ratio = (0.297 × 150,000) / (45,000 × 1) = 44,550 / 45,000 = 99% → pass (boundary)
        await expect(invoke(45000n * 10n ** 18n, 297n * 10n ** 5n)).to.not.be
          .reverted;

        // Reference: param 0 = 45,000 USD, Relative: param 1 = 0.2967 WBTC
        // Ratio = (0.2967 × 150,000) / (45,000 × 1) = 44,505 / 45,000 = 98.9% < 99% → fail
        await expect(invoke(45000n * 10n ** 18n, 2967n * 10n ** 4n)).to.be
          .reverted;

        // Reference: param 0 = 45,000 USD, Relative: param 1 = 0.30303 WBTC
        // Ratio = (0.30303 × 150,000) / (45,000 × 1) = 45,454.5 / 45,000 = 101.01% > 101% → fail
        await expect(invoke(45000n * 10n ** 18n, 30303000n)).to.be.reverted;
      });

      it("ETH/BTC - both convert to USD base", async () => {
        const { scopeFunction, invoke } =
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

        // Reference: param 0 = 22.5 ETH (18 decimals, adapter → price = 2000 USD/ETH)
        // Relative: param 1 = 0.3 BTC (8 decimals, adapter → price = 150,000 USD/BTC)
        // Ratio = (0.3 × 150,000) / (22.5 × 2000) = 45,000 / 45,000 = 100% → pass (within 99.5%-100.5%)
        await expect(invoke(225n * 10n ** 17n, 3n * 10n ** 7n)).to.not.be
          .reverted;

        // Reference: param 0 = 22.5 ETH, Relative: param 1 = 0.2985 BTC
        // Ratio = (0.2985 × 150,000) / (22.5 × 2000) = 44,775 / 45,000 = 99.5% → pass (boundary)
        await expect(invoke(225n * 10n ** 17n, 2985n * 10n ** 4n)).to.not.be
          .reverted;

        // Reference: param 0 = 22.5 ETH, Relative: param 1 = 0.29848 BTC
        // Ratio = (0.29848 × 150,000) / (22.5 × 2000) = 44,772 / 45,000 = 99.49% < 99.5% → fail
        await expect(invoke(225n * 10n ** 17n, 29848n * 10n ** 4n)).to.be
          .reverted;

        // Reference: param 0 = 22.5 ETH, Relative: param 1 = 0.30225 BTC
        // Ratio = (0.30225 × 150,000) / (22.5 × 2000) = 45,337.5 / 45,000 = 100.75% > 100.5% → fail
        await expect(invoke(225n * 10n ** 17n, 30225n * 10n ** 4n)).to.be
          .reverted;
      });

      it("ETH/WBTC - both convert to WBTC base", async () => {
        const { scopeFunction, invoke } =
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

        // Reference: param 0 = 1 WBTC (8 decimals, no adapter → price = 1)
        // Relative: param 1 = 22.222222... ETH (18 decimals, adapter → price = 0.045 WBTC/ETH)
        // Ratio = (22.222222... × 0.045) / (1 × 1) = 1 / 1 = 100% → pass (within 98%-102%)
        await expect(invoke(1n * 10n ** 8n, 22222222222222222222n)).to.not.be
          .reverted;

        // Reference: param 0 = 1 WBTC, Relative: param 1 = 21.777777... ETH
        // Ratio = (21.777777... × 0.045) / (1 × 1) = 0.98 / 1 = 98% → pass (boundary)
        await expect(invoke(1n * 10n ** 8n, 21777777777777777778n)).to.not.be
          .reverted;

        // Reference: param 0 = 1 WBTC, Relative: param 1 = 21.755555... ETH
        // Ratio = (21.755555... × 0.045) / (1 × 1) = 0.979 / 1 = 97.9% < 98% → fail
        await expect(invoke(1n * 10n ** 8n, 21755555555555555556n)).to.be
          .reverted;

        // Reference: param 0 = 1 WBTC, Relative: param 1 = 22.688888... ETH
        // Ratio = (22.688888... × 0.045) / (1 × 1) = 1.021 / 1 = 102.1% > 102% → fail
        await expect(invoke(1n * 10n ** 8n, 22688888888888888889n)).to.be
          .reverted;
      });

      it("ETH/WBTC - both convert to ETH base", async () => {
        const { scopeFunction, invoke } =
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

        // Reference: param 0 = 10 ETH (18 decimals, no adapter → price = 1)
        // Relative: param 1 = 1 WBTC (8 decimals, adapter → price = 10 ETH/WBTC)
        // Ratio = (1 × 10) / (10 × 1) = 10 / 10 = 100% → pass (within 95%-105%)
        await expect(invoke(10n * 10n ** 18n, 1n * 10n ** 8n)).to.not.be
          .reverted;

        // Reference: param 0 = 10 ETH, Relative: param 1 = 0.95 WBTC
        // Ratio = (0.95 × 10) / (10 × 1) = 9.5 / 10 = 95% → pass (boundary)
        await expect(invoke(10n * 10n ** 18n, 95n * 10n ** 6n)).to.not.be
          .reverted;

        // Reference: param 0 = 10 ETH, Relative: param 1 = 0.949 WBTC
        // Ratio = (0.949 × 10) / (10 × 1) = 9.49 / 10 = 94.9% < 95% → fail
        await expect(invoke(10n * 10n ** 18n, 949n * 10n ** 5n)).to.be.reverted;

        // Reference: param 0 = 10 ETH, Relative: param 1 = 1.051 WBTC
        // Ratio = (1.051 × 10) / (10 × 1) = 10.51 / 10 = 105.1% > 105% → fail
        await expect(invoke(10n * 10n ** 18n, 1051n * 10n ** 5n)).to.be
          .reverted;
      });

      it("USDC/FunkyToken - large decimal normalization (6 vs 37 decimals)", async () => {
        const { scopeFunction, invoke } =
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

        // Reference: param 0 = 1000 USDC (6 decimals, no adapter → price = 1)
        // Relative: param 1 = 500 FunkyToken (37 decimals, adapter → price = 2 USDC/FunkyToken)
        // Ratio = (500 × 2) / (1000 × 1) = 1000 / 1000 = 100% → pass (within 99.75%-100.25%)
        await expect(invoke(1000n * 10n ** 6n, 500n * 10n ** 37n)).to.not.be
          .reverted;

        // Reference: param 0 = 1000 USDC, Relative: param 1 = 498.75 FunkyToken
        // Ratio = (498.75 × 2) / (1000 × 1) = 997.5 / 1000 = 99.75% → pass (boundary)
        await expect(invoke(1000n * 10n ** 6n, 49875n * 10n ** 35n)).to.not.be
          .reverted;

        // Reference: param 0 = 1000 USDC, Relative: param 1 = 498.7 FunkyToken
        // Ratio = (498.7 × 2) / (1000 × 1) = 997.4 / 1000 = 99.74% < 99.75% → fail
        await expect(invoke(1000n * 10n ** 6n, 4987n * 10n ** 34n)).to.be
          .reverted;

        // Reference: param 0 = 1000 USDC, Relative: param 1 = 501.3 FunkyToken
        // Ratio = (501.3 × 2) / (1000 × 1) = 1002.6 / 1000 = 100.26% > 100.25% → fail
        await expect(invoke(1000n * 10n ** 6n, 5013n * 10n ** 34n)).to.be
          .reverted;
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
