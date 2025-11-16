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

describe("Operator - WithinRatio", async () => {
  describe("Calldata", () => {
    describe("maxRatio", () => {
      it("passes below maxRatio without price", async () => {
        const { scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 9500, // 95% in basis points
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 900
        // ratio = 900/1000 = 90% = 9000 bps
        // maxRatio = 9500 bps, so 9000 < 9500 → should pass
        await expect(invoke(1000, 900)).to.not.be.reverted;

        // Boundary test: ratio exactly at maxRatio
        // fixed = 1000, variable = 950
        // ratio = 950/1000 = 95% = 9500 bps
        // maxRatio = 9500 bps, so 9500 = 9500 → should pass
        await expect(invoke(1000, 950)).to.not.be.reverted;

        // Test: well below maxRatio
        // fixed = 1000, variable = 500
        // ratio = 500/1000 = 50% = 5000 bps
        // maxRatio = 9500 bps, so 5000 < 9500 → should pass
        await expect(invoke(1000, 500)).to.not.be.reverted;
      });

      it("passes below maxRatio with price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy mock price adapter that returns 2:1 price ratio
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const adapter = await MockPriceAdapter.deploy(2n * 10n ** 18n); // 2e18
        const adapterAddress = await adapter.getAddress();

        const compValue = encodeWithinRatioCompValue({
          adapter: adapterAddress,
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 9500, // 95% in basis points
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 1900, price = 2e18
        // expectedVariable = (1000 * 2e18) / 1e18 = 2000
        // ratio = (1900 * 10000) / 2000 = 9500 bps (95%)
        // maxRatio = 9500 bps, so 9500 = 9500 → should pass
        await expect(invoke(1000, 1900)).to.not.be.reverted;

        // Test: well below maxRatio
        // fixed = 1000, variable = 1800
        // expectedVariable = 2000
        // ratio = (1800 * 10000) / 2000 = 9000 bps (90%)
        // maxRatio = 9500 bps, so 9000 < 9500 → should pass
        await expect(invoke(1000, 1800)).to.not.be.reverted;
      });

      it("fails above maxRatio without price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 9500, // 95% in basis points
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 951
        // ratio = 951/1000 = 95.1% = 9510 bps
        // maxRatio = 9500 bps, so 9510 > 9500 → should fail
        await expect(invoke(1000, 951))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);

        // Test: well above maxRatio
        // fixed = 1000, variable = 1100
        // ratio = 1100/1000 = 110% = 11000 bps
        // maxRatio = 9500 bps, so 11000 > 9500 → should fail
        await expect(invoke(1000, 1100))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });

      it("fails above maxRatio with price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy mock price adapter that returns 2:1 price ratio
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const adapter = await MockPriceAdapter.deploy(2n * 10n ** 18n); // 2e18
        const adapterAddress = await adapter.getAddress();

        const compValue = encodeWithinRatioCompValue({
          adapter: adapterAddress,
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 9500, // 95% in basis points
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 1901, price = 2e18
        // expectedVariable = (1000 * 2e18) / 1e18 = 2000
        // ratio = (1901 * 10000) / 2000 = 9505 bps (95.05%)
        // maxRatio = 9500 bps, so 9505 > 9500 → should fail
        await expect(invoke(1000, 1901))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);

        // Test: well above maxRatio
        // fixed = 1000, variable = 2200
        // expectedVariable = 2000
        // ratio = (2200 * 10000) / 2000 = 11000 bps (110%)
        // maxRatio = 9500 bps, so 11000 > 9500 → should fail
        await expect(invoke(1000, 2200))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioAboveMax, ZeroHash);
      });
    });

    describe("minRatio", () => {
      it("passes above minRatio without price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 9000, // 90% in basis points
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 901
        // ratio = 901/1000 = 90.1% = 9010 bps
        // minRatio = 9000 bps, so 9010 > 9000 → should pass
        await expect(invoke(1000, 901)).to.not.be.reverted;

        // Boundary test: ratio exactly at minRatio
        // fixed = 1000, variable = 900
        // ratio = 900/1000 = 90% = 9000 bps
        // minRatio = 9000 bps, so 9000 = 9000 → should pass
        await expect(invoke(1000, 900)).to.not.be.reverted;

        // Test: well above minRatio
        // fixed = 1000, variable = 1000
        // ratio = 1000/1000 = 100% = 10000 bps
        // minRatio = 9000 bps, so 10000 > 9000 → should pass
        await expect(invoke(1000, 1000)).to.not.be.reverted;
      });

      it("passes above minRatio with price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy mock price adapter that returns 2:1 price ratio
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const adapter = await MockPriceAdapter.deploy(2n * 10n ** 18n); // 2e18
        const adapterAddress = await adapter.getAddress();

        const compValue = encodeWithinRatioCompValue({
          adapter: adapterAddress,
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 9000, // 90% in basis points
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 1800, price = 2e18
        // expectedVariable = (1000 * 2e18) / 1e18 = 2000
        // ratio = (1800 * 10000) / 2000 = 9000 bps (90%)
        // minRatio = 9000 bps, so 9000 = 9000 → should pass
        await expect(invoke(1000, 1800)).to.not.be.reverted;

        // Test: well above minRatio
        // fixed = 1000, variable = 2000
        // expectedVariable = 2000
        // ratio = (2000 * 10000) / 2000 = 10000 bps (100%)
        // minRatio = 9000 bps, so 10000 > 9000 → should pass
        await expect(invoke(1000, 2000)).to.not.be.reverted;
      });

      it("fails below minRatio without price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 9000, // 90% in basis points
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 899
        // ratio = 899/1000 = 89.9% = 8990 bps
        // minRatio = 9000 bps, so 8990 < 9000 → should fail
        await expect(invoke(1000, 899))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Test: well below minRatio
        // fixed = 1000, variable = 500
        // ratio = 500/1000 = 50% = 5000 bps
        // minRatio = 9000 bps, so 5000 < 9000 → should fail
        await expect(invoke(1000, 500))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);
      });

      it("fails below minRatio with price", async () => {
        const { roles, scopeFunction, invoke } =
          await loadFixture(setupTwoParamsStatic);

        // Deploy mock price adapter that returns 2:1 price ratio
        const MockPriceAdapter =
          await hre.ethers.getContractFactory("MockPriceAdapter");
        const adapter = await MockPriceAdapter.deploy(2n * 10n ** 18n); // 2e18
        const adapterAddress = await adapter.getAddress();

        const compValue = encodeWithinRatioCompValue({
          adapter: adapterAddress,
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 9000, // 90% in basis points
          maxRatio: 0, // no upper bound
        });

        await scopeFunction(
          flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
              {
                paramType: AbiType.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          }),
        );

        // Test: fixed = 1000, variable = 1799, price = 2e18
        // expectedVariable = (1000 * 2e18) / 1e18 = 2000
        // ratio = (1799 * 10000) / 2000 = 8995 bps (89.95%)
        // minRatio = 9000 bps, so 8995 < 9000 → should fail
        await expect(invoke(1000, 1799))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);

        // Test: well below minRatio
        // fixed = 1000, variable = 1000
        // expectedVariable = 2000
        // ratio = (1000 * 10000) / 2000 = 5000 bps (50%)
        // minRatio = 9000 bps, so 5000 < 9000 → should fail
        await expect(invoke(1000, 1000))
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.RatioBelowMin, ZeroHash);
      });
    });
  });

  describe("Tuple", () => {
    describe("maxRatio", () => {
      it("passes below maxRatio without price", async () => {
        // TODO: implement later
      });

      it("passes below maxRatio with price", async () => {
        // TODO: implement later
      });

      it("fails above maxRatio without price", async () => {
        // TODO: implement later
      });

      it("fails above maxRatio with price", async () => {
        // TODO: implement later
      });
    });

    describe("minRatio", () => {
      it("passes above minRatio without price", async () => {
        // TODO: implement later
      });

      it("passes above minRatio with price", async () => {
        // TODO: implement later
      });

      it("fails below minRatio without price", async () => {
        // TODO: implement later
      });

      it("fails below minRatio with price", async () => {
        // TODO: implement later
      });
    });
  });

  describe("Array", () => {
    describe("maxRatio", () => {
      it("passes below maxRatio without price", async () => {
        // TODO: implement later
      });

      it("passes below maxRatio with price", async () => {
        // TODO: implement later
      });

      it("fails above maxRatio without price", async () => {
        // TODO: implement later
      });

      it("fails above maxRatio with price", async () => {
        // TODO: implement later
      });
    });

    describe("minRatio", () => {
      it("passes above minRatio without price", async () => {
        // TODO: implement later
      });

      it("passes above minRatio with price", async () => {
        // TODO: implement later
      });

      it("fails below minRatio without price", async () => {
        // TODO: implement later
      });

      it("fails below minRatio with price", async () => {
        // TODO: implement later
      });
    });
  });
});

function encodeWithinRatioCompValue({
  adapter = "0x0000000000000000000000000000000000000000",
  referenceIndex,
  referenceDecimals,
  relativeIndex,
  relativeDecimals,
  minRatio,
  maxRatio,
}: {
  adapter?: string;
  referenceIndex: number;
  referenceDecimals: number;
  relativeIndex: number;
  relativeDecimals: number;
  minRatio: number;
  maxRatio: number;
}): string {
  return solidityPacked(
    ["uint8", "uint8", "uint8", "uint8", "uint32", "uint32", "address"],
    [
      referenceIndex,
      referenceDecimals,
      relativeIndex,
      relativeDecimals,
      minRatio,
      maxRatio,
      adapter,
    ],
  );
}
