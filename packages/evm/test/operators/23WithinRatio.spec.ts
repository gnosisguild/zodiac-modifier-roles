import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

import {
  AbiCoder,
  Interface,
  solidityPacked,
  ZeroAddress,
  ZeroHash,
} from "ethers";

import { setupFallbacker, deployRolesMod } from "../setup";
import {
  Encoding,
  flattenCondition,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
} from "../utils";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Roles";

function pluck(index: number) {
  return {
    paramType: Encoding.Static,
    operator: Operator.Pluck,
    compValue: "0x" + index.toString(16).padStart(2, "0"),
  };
}

async function setupTwoParams() {
  const iface = new Interface(["function fn(uint256, uint256)"]);
  const fn = iface.getFunction("fn")!;
  const { roles, member, fallbackerAddress, roleKey } = await setupFallbacker();

  const allowFunction = (
    conditions: ConditionFlatStruct[],
    options = ExecutionOptions.None,
  ) =>
    roles.allowFunction(
      roleKey,
      fallbackerAddress,
      fn.selector,
      conditions,
      options,
    );

  const invoke = (a: bigint | number, b: bigint | number) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        fallbackerAddress,
        0,
        iface.encodeFunctionData(fn, [a, b]),
        0,
      );

  return {
    roles,
    member,
    fallbackerAddress,
    roleKey,
    allowFunction,
    invoke,
  };
}

describe("Operator - WithinRatio", () => {
  describe("Core Functionality", () => {
    describe("ratio bounds", () => {
      describe("maxRatio", () => {
        it("passes when ratio equals maxRatio (boundary)", async () => {
          const { allowFunction, invoke } = await loadFixture(setupTwoParams);

          // Swapped: param0→relative, param1→reference
          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 7,
            referenceDecimals: 0,
            relativeIndex: 3,
            relativeDecimals: 0,
            minRatio: 0,
            maxRatio: 9500, // 95%
          });

          await allowFunction(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                pluck(3), // param0 → pluckedValues[3] = relative
                pluck(7), // param1 → pluckedValues[7] = reference
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            }),
          );

          // invoke(relative, reference): Ratio = 950/1000 = 95% == maxRatio → pass
          await expect(invoke(950, 1000)).to.not.be.reverted;
        });

        it("passes when ratio is below maxRatio", async () => {
          const { allowFunction, invoke } = await loadFixture(setupTwoParams);

          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 5,
            referenceDecimals: 0,
            relativeIndex: 2,
            relativeDecimals: 0,
            minRatio: 0,
            maxRatio: 9500,
          });

          await allowFunction(
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

          // Ratio = 800/1000 = 80% < 95% → pass
          await expect(invoke(1000, 800)).to.not.be.reverted;
        });

        it("reverts with RatioAboveMax when ratio exceeds maxRatio", async () => {
          const { roles, allowFunction, invoke } =
            await loadFixture(setupTwoParams);

          // Swapped order: relative plucked before reference
          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 4,
            referenceDecimals: 0,
            relativeIndex: 12,
            relativeDecimals: 0,
            minRatio: 0,
            maxRatio: 9500,
          });

          await allowFunction(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                pluck(12), // relative first
                pluck(4), // reference second
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            }),
          );

          // invoke(relative, reference) since param0→relative, param1→reference
          // Ratio = 951/1000 = 95.1% > 95% → fail
          await expect(invoke(951, 1000))
            .to.be.revertedWithCustomError(roles, "ConditionViolation")
            .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
        });

        it("skips check when maxRatio is 0 (no upper bound)", async () => {
          const { allowFunction, invoke } = await loadFixture(setupTwoParams);

          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 8,
            referenceDecimals: 0,
            relativeIndex: 15,
            relativeDecimals: 0,
            minRatio: 1000, // 10% lower bound (at least one bound required)
            maxRatio: 0, // no upper bound
          });

          await allowFunction(
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

          // Ratio = 5000/1000 = 500% → pass (no upper bound, above 10% min)
          await expect(invoke(1000, 5000)).to.not.be.reverted;
        });
      });

      describe("minRatio", () => {
        it("passes when ratio equals minRatio (boundary)", async () => {
          const { allowFunction, invoke } = await loadFixture(setupTwoParams);

          // Swapped: param0→relative, param1→reference
          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 20,
            referenceDecimals: 0,
            relativeIndex: 10,
            relativeDecimals: 0,
            minRatio: 9000, // 90%
            maxRatio: 0,
          });

          await allowFunction(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                pluck(10), // param0 → pluckedValues[10] = relative
                pluck(20), // param1 → pluckedValues[20] = reference
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            }),
          );

          // invoke(relative, reference): Ratio = 900/1000 = 90% == minRatio → pass
          await expect(invoke(900, 1000)).to.not.be.reverted;
        });

        it("passes when ratio is above minRatio", async () => {
          const { allowFunction, invoke } = await loadFixture(setupTwoParams);

          // Swapped order: relative plucked before reference
          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 6,
            referenceDecimals: 0,
            relativeIndex: 1,
            relativeDecimals: 0,
            minRatio: 9000,
            maxRatio: 0,
          });

          await allowFunction(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                pluck(1), // relative first
                pluck(6), // reference second
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            }),
          );

          // Ratio = 950/1000 = 95% > 90% → pass
          await expect(invoke(950, 1000)).to.not.be.reverted;
        });

        it("reverts with RatioBelowMin when ratio is below minRatio", async () => {
          const { roles, allowFunction, invoke } =
            await loadFixture(setupTwoParams);

          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 25,
            referenceDecimals: 0,
            relativeIndex: 30,
            relativeDecimals: 0,
            minRatio: 9000,
            maxRatio: 0,
          });

          await allowFunction(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                pluck(25),
                pluck(30),
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            }),
          );

          // Ratio = 850/1000 = 85% < 90% → fail
          await expect(invoke(1000, 850))
            .to.be.revertedWithCustomError(roles, "ConditionViolation")
            .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);
        });

        it("skips check when minRatio is 0 (no lower bound)", async () => {
          const { allowFunction, invoke } = await loadFixture(setupTwoParams);

          // Swapped: param0→pluckedValues[50]=relative, param1→pluckedValues[100]=reference
          const compValue = encodeWithinRatioCompValue({
            referenceIndex: 100,
            referenceDecimals: 0,
            relativeIndex: 50,
            relativeDecimals: 0,
            minRatio: 0, // no lower bound
            maxRatio: 10000,
          });

          await allowFunction(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                pluck(50), // param0 → pluckedValues[50] = relative
                pluck(100), // param1 → pluckedValues[100] = reference
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            }),
          );

          // invoke(relative, reference) → ratio = 10/1000 = 1% → pass (no lower bound)
          await expect(invoke(10, 1000)).to.not.be.reverted;
        });
      });
    });

    describe("decimal normalization", () => {
      it("normalizes when reference has more decimals (with relative adapter)", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        // param0→relative (USDC), param1→reference (ETH)
        // Reference: 18 decimals (ETH), Relative: 6 decimals (USDC)
        // Relative adapter: 1 USDC = 0.0005 ETH (price in 18 decimals)
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const usdcEthAdapter = await MockPricing.deploy(5n * 10n ** 14n); // 0.0005 ETH

        const compValue = encodeWithinRatioCompValue({
          relativeAdapter: await usdcEthAdapter.getAddress(),
          referenceIndex: 9,
          referenceDecimals: 18,
          relativeIndex: 14,
          relativeDecimals: 6,
          minRatio: 9900,
          maxRatio: 10100,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(14), // param0 → pluckedValues[14] = relative (USDC)
              pluck(9), // param1 → pluckedValues[9] = reference (ETH)
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // invoke(relative, reference)
        // Reference: 1 ETH (18 decimals)
        // Relative: 2000 USDC (6 decimals) × 0.0005 = 1 ETH equivalent
        // Ratio = 100%
        await expect(invoke(2000n * 10n ** 6n, 1n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 1980 USDC × 0.0005 = 0.99 ETH → 99% (boundary)
        await expect(invoke(1980n * 10n ** 6n, 1n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 1970 USDC × 0.0005 = 0.985 ETH → 98.5% < 99%
        await expect(invoke(1970n * 10n ** 6n, 1n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);
      });

      it("normalizes when relative has more decimals (with reference adapter)", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        // Swapped: param0→pluckedValues[11]=relative, param1→pluckedValues[22]=reference
        // Reference: 8 decimals (WBTC), Relative: 18 decimals (ETH)
        // Reference adapter: 1 WBTC = 75 ETH (price in 18 decimals)
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const wbtcEthAdapter = await MockPricing.deploy(75n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await wbtcEthAdapter.getAddress(),
          referenceIndex: 22,
          referenceDecimals: 8,
          relativeIndex: 11,
          relativeDecimals: 18,
          minRatio: 9900,
          maxRatio: 10100,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(11), // param0 → pluckedValues[11] = relative
              pluck(22), // param1 → pluckedValues[22] = reference
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // invoke(relative, reference)
        // Reference: 1 WBTC (8 decimals) × 75 = 75 ETH equivalent
        // Relative: 75 ETH (18 decimals)
        // Ratio = 100%
        await expect(invoke(75n * 10n ** 18n, 1n * 10n ** 8n)).to.not.be
          .reverted;

        // Relative: 74.25 ETH → 99%
        await expect(invoke(7425n * 10n ** 16n, 1n * 10n ** 8n)).to.not.be
          .reverted;

        // Relative: 76.01 ETH → 101.3% > 101%
        await expect(invoke(7601n * 10n ** 16n, 1n * 10n ** 8n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
      });

      it("handles extreme decimal difference with adapters (6 vs 37 decimals)", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        // Reference: USDC (6 decimals), Relative: ExoticToken (37 decimals)
        // Reference adapter: 1 USDC = 1 USD (stable)
        // Relative adapter: 1 ExoticToken = 0.5 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const usdcUsdAdapter = await MockPricing.deploy(1n * 10n ** 18n);
        const exoticUsdAdapter = await MockPricing.deploy(5n * 10n ** 17n); // 0.5 USD

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await usdcUsdAdapter.getAddress(),
          relativeAdapter: await exoticUsdAdapter.getAddress(),
          referenceIndex: 77,
          referenceDecimals: 6,
          relativeIndex: 88,
          relativeDecimals: 37,
          minRatio: 9900,
          maxRatio: 10100,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(77),
              pluck(88),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 1000 USDC × 1 = 1000 USD
        // Relative: 2000 ExoticToken × 0.5 = 1000 USD
        // Ratio = 100%
        await expect(invoke(1000n * 10n ** 6n, 2000n * 10n ** 37n)).to.not.be
          .reverted;

        // Relative: 2020 ExoticToken × 0.5 = 1010 USD → 101%
        await expect(invoke(1000n * 10n ** 6n, 2020n * 10n ** 37n)).to.not.be
          .reverted;

        // Relative: 2030 ExoticToken × 0.5 = 1015 USD → 101.5% > 101%
        await expect(invoke(1000n * 10n ** 6n, 2030n * 10n ** 37n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
      });
    });

    describe("price adapters", () => {
      it("applies single adapter to reference amount", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        // Swapped: param0→relative (USD), param1→reference (token)
        // Reference adapter: 1 token = 2000 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const refAdapter = await MockPricing.deploy(2000n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await refAdapter.getAddress(),
          referenceIndex: 44,
          referenceDecimals: 18,
          relativeIndex: 33,
          relativeDecimals: 18,
          minRatio: 9900, // 99%
          maxRatio: 10100, // 101%
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(33), // param0 → pluckedValues[33] = relative (USD)
              pluck(44), // param1 → pluckedValues[44] = reference (token)
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // invoke(relative, reference)
        // Reference: 10 tokens × 2000 = 20,000 USD
        // Relative: 20,000 USD × 1 = 20,000 USD
        // Ratio = 100%
        await expect(invoke(20000n * 10n ** 18n, 10n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 19,700 USD → Ratio = 98.5% < 99%
        await expect(invoke(19700n * 10n ** 18n, 10n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);
      });

      it("applies single adapter to relative amount", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        // Relative adapter: 1 token = 150,000 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const relAdapter = await MockPricing.deploy(150000n * 10n ** 18n);

        // Swapped order: relative plucked before reference
        const compValue = encodeWithinRatioCompValue({
          relativeAdapter: await relAdapter.getAddress(),
          referenceIndex: 55,
          referenceDecimals: 18,
          relativeIndex: 17,
          relativeDecimals: 8, // WBTC uses 8 decimals
          minRatio: 9900,
          maxRatio: 10100,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(17), // relative first
              pluck(55), // reference second
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // invoke(relative, reference) since param0→relative, param1→reference
        // Relative: 0.3 WBTC × 150,000 = 45,000 USD
        // Reference: 45,000 USD × 1 = 45,000 USD
        // Ratio = 100%
        await expect(invoke(3n * 10n ** 7n, 45000n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 0.297 WBTC × 150,000 = 44,550 USD → Ratio = 99%
        await expect(invoke(297n * 10n ** 5n, 45000n * 10n ** 18n)).to.not.be
          .reverted;

        // Relative: 0.2967 WBTC → Ratio ≈ 98.9% < 99%
        await expect(invoke(2967n * 10n ** 4n, 45000n * 10n ** 18n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);
      });

      it("applies adapters to both amounts (cross-asset)", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        // ETH/USD: 1 ETH = 2000 USD
        // BTC/USD: 1 BTC = 150,000 USD
        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const ethUsdAdapter = await MockPricing.deploy(2000n * 10n ** 18n);
        const btcUsdAdapter = await MockPricing.deploy(150000n * 10n ** 18n);

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await ethUsdAdapter.getAddress(),
          relativeAdapter: await btcUsdAdapter.getAddress(),
          referenceIndex: 200,
          referenceDecimals: 18, // ETH
          relativeIndex: 150,
          relativeDecimals: 8, // BTC
          minRatio: 9950,
          maxRatio: 10050,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(200),
              pluck(150),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Reference: 22.5 ETH × 2000 = 45,000 USD
        // Relative: 0.3 BTC × 150,000 = 45,000 USD
        // Ratio = 100%
        await expect(invoke(225n * 10n ** 17n, 3n * 10n ** 7n)).to.not.be
          .reverted;

        // Relative: 0.2985 BTC → Ratio = 99.5%
        await expect(invoke(225n * 10n ** 17n, 2985n * 10n ** 4n)).to.not.be
          .reverted;

        // Relative: 0.30225 BTC → Ratio = 100.75% > 100.5%
        await expect(invoke(225n * 10n ** 17n, 30225n * 10n ** 4n))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
      });
    });

    describe("adapter call safety", () => {
      it("reverts with PricingAdapterNotAContract when reference adapter not deployed", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        const [, , randomEOA] = await hre.ethers.getSigners();

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: randomEOA.address,
          referenceIndex: 41,
          referenceDecimals: 18,
          relativeIndex: 82,
          relativeDecimals: 18,
          minRatio: 9000,
          maxRatio: 11000,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(41),
              pluck(82),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(
            ConditionViolationStatus.PricingAdapterNotAContract,
            ZeroHash,
          );
      });

      it("reverts with PricingAdapterNotAContract when relative adapter not deployed", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        const [, , randomEOA] = await hre.ethers.getSigners();

        // Swapped order: relative plucked before reference
        const compValue = encodeWithinRatioCompValue({
          relativeAdapter: randomEOA.address,
          referenceIndex: 99,
          referenceDecimals: 18,
          relativeIndex: 13,
          relativeDecimals: 18,
          minRatio: 9000,
          maxRatio: 11000,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(13), // relative first
              pluck(99), // reference second
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(
            ConditionViolationStatus.PricingAdapterNotAContract,
            ZeroHash,
          );
      });

      it("reverts with PricingAdapterReverted when adapter has no getPrice function", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        const MockPricingNoInterface = await hre.ethers.getContractFactory(
          "MockPricingNoInterface",
        );
        const noInterfaceAdapter = await MockPricingNoInterface.deploy();

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await noInterfaceAdapter.getAddress(),
          referenceIndex: 63,
          referenceDecimals: 18,
          relativeIndex: 27,
          relativeDecimals: 18,
          minRatio: 9000,
          maxRatio: 11000,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(63),
              pluck(27),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.PricingAdapterReverted, ZeroHash);
      });

      it("reverts with PricingAdapterReverted when adapter reverts", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        const MockPricingReverting = await hre.ethers.getContractFactory(
          "MockPricingReverting",
        );
        const revertingAdapter = await MockPricingReverting.deploy();

        // Swapped order: relative plucked before reference
        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await revertingAdapter.getAddress(),
          referenceIndex: 180,
          referenceDecimals: 18,
          relativeIndex: 45,
          relativeDecimals: 18,
          minRatio: 9000,
          maxRatio: 11000,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(45), // relative first
              pluck(180), // reference second
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.PricingAdapterReverted, ZeroHash);
      });

      it("reverts with PricingAdapterInvalidResult when adapter returns wrong type", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        const MockPricingWrongReturn = await hre.ethers.getContractFactory(
          "MockPricingWrongReturn",
        );
        const wrongReturnAdapter = await MockPricingWrongReturn.deploy();

        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await wrongReturnAdapter.getAddress(),
          referenceIndex: 72,
          referenceDecimals: 18,
          relativeIndex: 108,
          relativeDecimals: 18,
          minRatio: 9000,
          maxRatio: 11000,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(72),
              pluck(108),
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(
            ConditionViolationStatus.PricingAdapterInvalidResult,
            ZeroHash,
          );
      });

      it("reverts with PricingAdapterZeroPrice when adapter returns zero", async () => {
        const { roles, allowFunction, invoke } =
          await loadFixture(setupTwoParams);

        const MockPricing = await hre.ethers.getContractFactory("MockPricing");
        const zeroAdapter = await MockPricing.deploy(0);

        // Swapped order: relative plucked before reference
        const compValue = encodeWithinRatioCompValue({
          referenceAdapter: await zeroAdapter.getAddress(),
          referenceIndex: 56,
          referenceDecimals: 18,
          relativeIndex: 23,
          relativeDecimals: 18,
          minRatio: 9000,
          maxRatio: 11000,
        });

        await allowFunction(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              pluck(23), // relative first
              pluck(56), // reference second
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(ConditionViolationStatus.PricingAdapterZeroPrice, ZeroHash);
      });
    });
  });

  describe("Real-World Scenarios", () => {
    it("ETH/USD swap - validates output within slippage tolerance", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // ETH/USD: 1 ETH = 2000 USD
      const MockPricing = await hre.ethers.getContractFactory("MockPricing");
      const ethUsdAdapter = await MockPricing.deploy(2000n * 10n ** 18n);

      // Swapped order: relative (USD output) plucked before reference (ETH input)
      const compValue = encodeWithinRatioCompValue({
        referenceAdapter: await ethUsdAdapter.getAddress(),
        relativeAdapter: ZeroAddress,
        referenceIndex: 19,
        referenceDecimals: 18, // ETH
        relativeIndex: 7,
        relativeDecimals: 18, // USD stablecoin
        minRatio: 9950, // 99.5% (0.5% tolerance)
        maxRatio: 10050, // 100.5%
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(7), // relative (USD) first
            pluck(19), // reference (ETH) second
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // invoke(relative, reference) since param0→relative (USD), param1→reference (ETH)
      // Selling 10 ETH for 20,000 USD → exactly 100%
      await expect(invoke(20000n * 10n ** 18n, 10n * 10n ** 18n)).to.not.be
        .reverted;

      // Selling 10 ETH for 19,880 USD → 99.4% < 99.5%
      await expect(invoke(19880n * 10n ** 18n, 10n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);

      // Selling 10 ETH for 20,120 USD → 100.6% > 100.5%
      await expect(invoke(20120n * 10n ** 18n, 10n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("WBTC/ETH swap - cross-asset with different decimals", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // Swapped: param0→relative (WBTC), param1→reference (ETH)
      // ETH/USD: 1 ETH = 2000 USD
      // BTC/USD: 1 BTC = 150,000 USD
      const MockPricing = await hre.ethers.getContractFactory("MockPricing");
      const ethUsdAdapter = await MockPricing.deploy(2000n * 10n ** 18n);
      const btcUsdAdapter = await MockPricing.deploy(150000n * 10n ** 18n);

      const compValue = encodeWithinRatioCompValue({
        referenceAdapter: await ethUsdAdapter.getAddress(),
        relativeAdapter: await btcUsdAdapter.getAddress(),
        referenceIndex: 91,
        referenceDecimals: 18, // ETH
        relativeIndex: 42,
        relativeDecimals: 8, // WBTC
        minRatio: 9500, // 95%
        maxRatio: 10500, // 105% (5% slippage)
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(42), // param0 → pluckedValues[42] = relative (WBTC)
            pluck(91), // param1 → pluckedValues[91] = reference (ETH)
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // invoke(relative, reference)
      // Selling 75 ETH ($150,000) for 1 BTC ($150,000) → 100%
      await expect(invoke(1n * 10n ** 8n, 75n * 10n ** 18n)).to.not.be.reverted;

      // Selling 75 ETH for 0.94 BTC → 94% < 95%
      await expect(invoke(94n * 10n ** 6n, 75n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);

      // Selling 75 ETH for 1.06 BTC → 106% > 105%
      await expect(invoke(106n * 10n ** 6n, 75n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("USDC/exotic token swap - extreme decimal difference", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // ExoticToken/USDC: 1 ExoticToken = 2 USDC
      const MockPricing = await hre.ethers.getContractFactory("MockPricing");
      const exoticUsdcAdapter = await MockPricing.deploy(2n * 10n ** 18n);

      // Swapped: param0→pluckedValues[61]=relative (ExoticToken), param1→pluckedValues[83]=reference (USDC)
      const compValue = encodeWithinRatioCompValue({
        referenceAdapter: ZeroAddress,
        relativeAdapter: await exoticUsdcAdapter.getAddress(),
        referenceIndex: 83,
        referenceDecimals: 6, // USDC
        relativeIndex: 61,
        relativeDecimals: 37, // ExoticToken
        minRatio: 9975, // 99.75%
        maxRatio: 10025, // 100.25%
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(61), // param0 → pluckedValues[61] = relative (ExoticToken)
            pluck(83), // param1 → pluckedValues[83] = reference (USDC)
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // invoke(relative, reference) since param0→relative (ExoticToken), param1→reference (USDC)
      // Selling 1000 USDC for 500 ExoticToken → (500 × 2) / 1000 = 100%
      await expect(invoke(500n * 10n ** 37n, 1000n * 10n ** 6n)).to.not.be
        .reverted;

      // Selling 1000 USDC for 498.7 ExoticToken → 99.74% < 99.75%
      await expect(invoke(4987n * 10n ** 34n, 1000n * 10n ** 6n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);
    });

    it("no adapters - enforces min 25% ratio", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // No price adapters - direct token ratio comparison
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 37,
        referenceDecimals: 18,
        relativeIndex: 53,
        relativeDecimals: 18,
        minRatio: 2500, // 25%
        maxRatio: 0, // no upper bound
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(37),
            pluck(53),
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // 249 / 1000 = 24.9% < 25% → fail
      await expect(invoke(1000n * 10n ** 18n, 249n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);

      // 250 / 1000 = 25% → pass
      await expect(invoke(1000n * 10n ** 18n, 250n * 10n ** 18n)).to.not.be
        .reverted;

      // 300 / 1000 = 30% → pass
      await expect(invoke(1000n * 10n ** 18n, 300n * 10n ** 18n)).to.not.be
        .reverted;
    });

    it("no adapters - enforces max 500% ratio", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // Swapped: param0→relative, param1→reference
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 64,
        referenceDecimals: 18,
        relativeIndex: 28,
        relativeDecimals: 18,
        minRatio: 0, // no lower bound
        maxRatio: 50000, // 500%
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(28), // param0 → pluckedValues[28] = relative
            pluck(64), // param1 → pluckedValues[64] = reference
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // invoke(relative, reference)
      // 4900 / 1000 = 490% → pass
      await expect(invoke(4900n * 10n ** 18n, 1000n * 10n ** 18n)).to.not.be
        .reverted;

      // 5000 / 1000 = 500% → pass (boundary)
      await expect(invoke(5000n * 10n ** 18n, 1000n * 10n ** 18n)).to.not.be
        .reverted;

      // 5001 / 1000 = 500.1% → fail
      await expect(invoke(5001n * 10n ** 18n, 1000n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("USD/WBTC swap - WBTC converts to USD base via relative adapter", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // WBTC/USD adapter: 1 WBTC = 150,000 USD
      const MockPricing = await hre.ethers.getContractFactory("MockPricing");
      const wbtcUsdAdapter = await MockPricing.deploy(150000n * 10n ** 18n);

      const compValue = encodeWithinRatioCompValue({
        referenceAdapter: ZeroAddress, // USD stablecoin is the base (no conversion)
        relativeAdapter: await wbtcUsdAdapter.getAddress(),
        referenceIndex: 71,
        referenceDecimals: 18, // USD stablecoin
        relativeIndex: 18,
        relativeDecimals: 8, // WBTC uses 8 decimals
        minRatio: 9900, // 99%
        maxRatio: 10100, // 101% (1% slippage)
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(71),
            pluck(18),
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // Reference: 45,000 USD, Relative: 0.3 WBTC × 150,000 = 45,000 USD → 100%
      await expect(invoke(45000n * 10n ** 18n, 3n * 10n ** 7n)).to.not.be
        .reverted;

      // Relative: 0.297 WBTC → 44,550 / 45,000 = 99% → pass
      await expect(invoke(45000n * 10n ** 18n, 297n * 10n ** 5n)).to.not.be
        .reverted;

      // Relative: 0.2967 WBTC → 44,505 / 45,000 = 98.9% → fail
      await expect(invoke(45000n * 10n ** 18n, 2967n * 10n ** 4n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);
    });

    it("ETH/WBTC swap - converts to ETH base via relative adapter", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      // Swapped: param0→relative (WBTC), param1→reference (ETH)
      // WBTC/ETH adapter: 1 WBTC = 75 ETH
      const MockPricing = await hre.ethers.getContractFactory("MockPricing");
      const wbtcEthAdapter = await MockPricing.deploy(75n * 10n ** 18n);

      const compValue = encodeWithinRatioCompValue({
        referenceAdapter: ZeroAddress, // ETH is the base
        relativeAdapter: await wbtcEthAdapter.getAddress(),
        referenceIndex: 95,
        referenceDecimals: 18, // ETH
        relativeIndex: 33,
        relativeDecimals: 8, // WBTC
        minRatio: 9500, // 95%
        maxRatio: 10500, // 105% (5% slippage)
      });

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(33), // param0 → pluckedValues[33] = relative (WBTC)
            pluck(95), // param1 → pluckedValues[95] = reference (ETH)
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
      );

      // invoke(relative, reference)
      // Reference: 75 ETH, Relative: 1 WBTC × 75 = 75 ETH → 100%
      await expect(invoke(1n * 10n ** 8n, 75n * 10n ** 18n)).to.not.be.reverted;

      // Relative: 0.95 WBTC → 71.25 / 75 = 95% → pass
      await expect(invoke(95n * 10n ** 6n, 75n * 10n ** 18n)).to.not.be
        .reverted;

      // Relative: 0.949 WBTC → 71.175 / 75 = 94.9% → fail
      await expect(invoke(949n * 10n ** 5n, 75n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioBelowMin, ZeroHash);

      // Relative: 1.051 WBTC → 78.825 / 75 = 105.1% → fail
      await expect(invoke(1051n * 10n ** 5n, 75n * 10n ** 18n))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
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

      const allowFunction = (
        selector: string,
        conditions: ConditionFlatStruct[],
        options?: number,
      ) =>
        roles
          .connect(owner)
          .allowFunction(
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

      return { roles, testContract, allowFunction, execTransactionFromModule };
    }

    it("extracts values from AbiEncoded params", async () => {
      const { roles, testContract, allowFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 12000, // 120%
      });

      await allowFunction(
        testContract.interface.getFunction("mixedParams").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluck(0), // param 0 → pluckedValues[0]
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            pluck(1), // param 2 → pluckedValues[1]
            {
              paramType: Encoding.None,
              operator: Operator.WithinRatio,
              compValue,
            },
          ],
        }),
        0,
      );

      // 1200 / 1000 = 120% → pass
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

      // 1201 / 1000 = 120.1% > 120% → fail
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
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("extracts values from nested AbiEncoded", async () => {
      const { roles, testContract, allowFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 8000, // 80%
      });

      await allowFunction(
        testContract.interface.getFunction("dynamicStatic").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0000", // leadingBytes = 0
              children: [
                pluck(0), // encoded[0] → pluckedValues[0]
                { paramType: Encoding.Static, operator: Operator.Pass },
                pluck(1), // encoded[2] → pluckedValues[1]
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

      // 800 / 1000 = 80% → pass
      const encoded = abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [1000, 500, 800],
      );
      await expect(
        execTransactionFromModule(
          (await testContract.dynamicStatic.populateTransaction(encoded)).data!,
        ),
      ).to.not.be.reverted;

      // 801 / 1000 = 80.1% > 80% → fail
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
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("extracts values from Tuple", async () => {
      const { roles, testContract, allowFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000, // 150%
      });

      await allowFunction(
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
                pluck(0), // second → pluckedValues[0] (reference)
                { paramType: Encoding.Static, operator: Operator.Pass }, // limit
                pluck(1), // fourth → pluckedValues[1] (relative)
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

      // 1500 / 1000 = 150% → pass
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

      // 1501 / 1000 = 150.1% > 150% → fail
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
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("extracts values from Array", async () => {
      const { roles, testContract, allowFunction, execTransactionFromModule } =
        await loadFixture(setupWithEncoder);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 12000, // 120%
      });

      await allowFunction(
        testContract.interface.getFunction("uint256ArrayStatic").selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                pluck(0), // array[0] → pluckedValues[0] (reference)
                { paramType: Encoding.Static, operator: Operator.Pass },
                pluck(1), // array[2] → pluckedValues[1] (relative)
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

      // 1200 / 1000 = 120% → pass
      await expect(
        execTransactionFromModule(
          (
            await testContract.uint256ArrayStatic.populateTransaction([
              1000, 500, 1200,
            ])
          ).data!,
        ),
      ).to.not.be.reverted;

      // 1201 / 1000 = 120.1% > 120% → fail
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
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
    });

    it("extracts EtherValue", async () => {
      // Different pattern - uses single param + ether value, keep inline
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Pluck ether value → pluckedValues[0]
      // Pluck param → pluckedValues[1]
      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 18,
        relativeIndex: 1,
        relativeDecimals: 18,
        minRatio: 0,
        maxRatio: 20000, // 200%
      });

      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
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
        ExecutionOptions.Send,
      );

      // 2 ETH / 1 ETH = 200% → pass
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            10n ** 18n,
            iface.encodeFunctionData(fn, [2n * 10n ** 18n]),
            0,
          ),
      ).to.not.be.reverted;

      // 1 ETH / 1 ETH = 100% → pass
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            10n ** 18n,
            iface.encodeFunctionData(fn, [1n * 10n ** 18n]),
            0,
          ),
      ).to.not.be.reverted;

      // 2.1 ETH / 1 ETH = 210% > 200% → fail
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            10n ** 18n,
            iface.encodeFunctionData(fn, [21n * 10n ** 17n]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.RatioAboveMax, ZeroHash);
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
