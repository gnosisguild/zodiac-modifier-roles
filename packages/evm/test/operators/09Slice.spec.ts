import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder, BigNumberish, solidityPacked, ZeroHash } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import { Encoding, Operator, PermissionCheckerStatus } from "../utils";
import { setupOneParamBytes, setupOneParamDynamicTuple } from "../setup";
import { Roles } from "../../typechain-types";

// Helper to encode Slice compValue: 2 bytes start + 1 byte size
const encodeSliceCompValue = (start: number, size: number) =>
  solidityPacked(["uint16", "uint8"], [start, size]);

describe("Operator - Slice", async () => {
  describe("GreaterThan", () => {
    it("32 bytes slice - passes when value is greater", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      // Slice the first 32 bytes and compare as uint256
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 32),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [1000]),
        },
      ]);

      // Value 1000 - should fail (not greater)
      const bytes1000 = defaultAbiCoder.encode(["uint256"], [1000]);
      await expect(invoke(bytes1000))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // Value 999 - should fail
      const bytes999 = defaultAbiCoder.encode(["uint256"], [999]);
      await expect(invoke(bytes999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // Value 1001 - should pass
      const bytes1001 = defaultAbiCoder.encode(["uint256"], [1001]);
      await expect(invoke(bytes1001)).to.not.be.reverted;
    });

    it("10 bytes slice - passes when value is greater", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      // Slice 10 bytes starting at offset 0 and compare
      // When right-aligned, 10 bytes becomes a uint80
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 10),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.GreaterThan,
          // Compare value: 0x00000000000000000064 (100 in 10 bytes, right-aligned to 32)
          compValue: defaultAbiCoder.encode(["uint256"], [100]),
        },
      ]);

      // 10 bytes with value 100 (0x00000000000000000064) - should fail
      const bytes100 = "0x00000000000000000064";
      await expect(invoke(bytes100))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // 10 bytes with value 99 - should fail
      const bytes99 = "0x00000000000000000063";
      await expect(invoke(bytes99))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // 10 bytes with value 101 - should pass
      const bytes101 = "0x00000000000000000065";
      await expect(invoke(bytes101)).to.not.be.reverted;
    });
  });

  describe("LessThan", () => {
    it("32 bytes slice - passes when value is less", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 32),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [1000]),
        },
      ]);

      // Value 1000 - should fail (not less)
      const bytes1000 = defaultAbiCoder.encode(["uint256"], [1000]);
      await expect(invoke(bytes1000))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // Value 1001 - should fail
      const bytes1001 = defaultAbiCoder.encode(["uint256"], [1001]);
      await expect(invoke(bytes1001))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // Value 999 - should pass
      const bytes999 = defaultAbiCoder.encode(["uint256"], [999]);
      await expect(invoke(bytes999)).to.not.be.reverted;
    });

    it("10 bytes slice - passes when value is less", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 10),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [100]),
        },
      ]);

      // 10 bytes with value 100 - should fail
      const bytes100 = "0x00000000000000000064";
      await expect(invoke(bytes100))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // 10 bytes with value 101 - should fail
      const bytes101 = "0x00000000000000000065";
      await expect(invoke(bytes101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // 10 bytes with value 99 - should pass
      const bytes99 = "0x00000000000000000063";
      await expect(invoke(bytes99)).to.not.be.reverted;
    });
  });

  describe("SignedIntGreaterThan", () => {
    it("32 bytes slice - passes when signed value is greater", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 32),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.SignedIntGreaterThan,
          compValue: defaultAbiCoder.encode(["int256"], [-100]),
        },
      ]);

      // Value -100 - should fail (not greater)
      const bytesMinus100 = defaultAbiCoder.encode(["int256"], [-100]);
      await expect(invoke(bytesMinus100))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // Value -101 - should fail
      const bytesMinus101 = defaultAbiCoder.encode(["int256"], [-101]);
      await expect(invoke(bytesMinus101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // Value -99 - should pass
      const bytesMinus99 = defaultAbiCoder.encode(["int256"], [-99]);
      await expect(invoke(bytesMinus99)).to.not.be.reverted;

      // Value 0 - should pass
      const bytes0 = defaultAbiCoder.encode(["int256"], [0]);
      await expect(invoke(bytes0)).to.not.be.reverted;
    });

    it("10 bytes slice - passes when signed value is greater", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 10),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.SignedIntGreaterThan,
          // For 10 bytes, compare against a small positive value
          compValue: defaultAbiCoder.encode(["int256"], [50]),
        },
      ]);

      // 10 bytes with value 50 - should fail
      const bytes50 = "0x00000000000000000032";
      await expect(invoke(bytes50))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // 10 bytes with value 49 - should fail
      const bytes49 = "0x00000000000000000031";
      await expect(invoke(bytes49))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // 10 bytes with value 51 - should pass
      const bytes51 = "0x00000000000000000033";
      await expect(invoke(bytes51)).to.not.be.reverted;
    });
  });

  describe("SignedIntLessThan", () => {
    it("32 bytes slice - passes when signed value is less", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 32),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.SignedIntLessThan,
          compValue: defaultAbiCoder.encode(["int256"], [100]),
        },
      ]);

      // Value 100 - should fail (not less)
      const bytes100 = defaultAbiCoder.encode(["int256"], [100]);
      await expect(invoke(bytes100))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // Value 101 - should fail
      const bytes101 = defaultAbiCoder.encode(["int256"], [101]);
      await expect(invoke(bytes101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // Value 99 - should pass
      const bytes99 = defaultAbiCoder.encode(["int256"], [99]);
      await expect(invoke(bytes99)).to.not.be.reverted;

      // Value -50 - should pass
      const bytesMinus50 = defaultAbiCoder.encode(["int256"], [-50]);
      await expect(invoke(bytesMinus50)).to.not.be.reverted;
    });

    it("10 bytes slice - passes when signed value is less", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 10),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.SignedIntLessThan,
          compValue: defaultAbiCoder.encode(["int256"], [100]),
        },
      ]);

      // 10 bytes with value 100 - should fail
      const bytes100 = "0x00000000000000000064";
      await expect(invoke(bytes100))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // 10 bytes with value 101 - should fail
      const bytes101 = "0x00000000000000000065";
      await expect(invoke(bytes101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );

      // 10 bytes with value 99 - should pass
      const bytes99 = "0x00000000000000000063";
      await expect(invoke(bytes99)).to.not.be.reverted;
    });
  });

  describe("Slice with offset", () => {
    it("extracts slice from middle of bytes", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      // Slice 4 bytes starting at offset 4 (skip first 4 bytes)
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(4, 4),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [0xff]),
        },
      ]);

      // 12 bytes: first 4 zeros, then 4 bytes = 0x00000100 (256), then 4 zeros
      // Slice at offset 4, size 4 = 0x00000100 = 256, greater than 255
      const bytesPass = "0x0000000000000100" + "00000000";
      await expect(invoke(bytesPass)).to.not.be.reverted;

      // 12 bytes: first 4 zeros, then 4 bytes = 0x000000ff (255), then 4 zeros
      // Slice at offset 4, size 4 = 0x000000ff = 255, not greater than 255
      const bytesFail = "0x00000000000000ff" + "00000000";
      await expect(invoke(bytesFail))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    });
  });

  describe("Slice with And operator", () => {
    it("combines multiple conditions on same slice", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      // Slice 12 bytes at offset 6 with And: value > 100 AND value < 200
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(6, 12),
        },
        {
          parent: 1,
          paramType: Encoding.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [100]),
        },
        {
          parent: 2,
          paramType: Encoding.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [200]),
        },
      ]);

      // Helper to build raw bytes: 6 byte prefix + 12 byte value + 4 byte suffix
      const buildBytes = (value: number) => {
        const hex = value.toString(16).padStart(24, "0"); // 12 bytes = 24 hex chars
        return "0x" + "aabbccddeeff" + hex + "11223344"; // 6 + 12 + 4 = 22 bytes
      };

      // Value 100 - should fail (not greater than 100)
      await expect(invoke(buildBytes(100)))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

      // Value 101 - should pass (101 > 100 AND 101 < 200)
      await expect(invoke(buildBytes(101))).to.not.be.reverted;

      // Value 199 - should pass (199 > 100 AND 199 < 200)
      await expect(invoke(buildBytes(199))).to.not.be.reverted;

      // Value 200 - should fail (not less than 200)
      await expect(invoke(buildBytes(200)))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );
    });
  });

  describe("WithinAllowance", () => {
    it("15 bytes slice at offset 200 - tracks spending against allowance", async () => {
      const { owner, roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

      // Slice 15 bytes at offset 200
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(200, 15),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.WithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ]);

      // Helper: 200 byte prefix + 15 byte value + 10 byte suffix = 225 bytes
      const buildBytes = (value: number) => {
        const prefix = "00".repeat(200);
        const hex = value.toString(16).padStart(30, "0"); // 15 bytes = 30 hex chars
        const suffix = "ff".repeat(10);
        return "0x" + prefix + hex + suffix;
      };

      // Spend 400 - should pass
      await expect(invoke(buildBytes(400))).to.not.be.reverted;

      // Check allowance updated
      const allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(600);

      // Spend 601 - should fail (exceeds remaining allowance)
      await expect(invoke(buildBytes(601)))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
    });
  });

  describe("EqualTo", () => {
    it("32 bytes slice at offset 50 - checks exact equality", async () => {
      const { roles, scopeFunction, invoke } =
        await loadFixture(setupOneParamBytes);

      const targetValue = defaultAbiCoder.encode(["uint256"], [123456789]);

      // Slice 32 bytes at offset 50
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(50, 32),
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.EqualTo,
          compValue: targetValue,
        },
      ]);

      // Helper: 50 byte prefix + 32 byte value + 18 byte suffix = 100 bytes
      const buildBytes = (value: bigint | number) => {
        const prefix = "aa".repeat(50);
        const hex = defaultAbiCoder.encode(["uint256"], [value]).slice(2);
        const suffix = "bb".repeat(18);
        return "0x" + prefix + hex + suffix;
      };

      // Different value - should fail
      await expect(invoke(buildBytes(123456790)))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);

      // Same value - should pass
      await expect(invoke(buildBytes(123456789))).to.not.be.reverted;
    });
  });

  describe("Nested dynamic in tuple", () => {
    it("slices bytes from inside a dynamic tuple with EqualTo", async () => {
      const { roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamDynamicTuple,
      );

      // DynamicTuple is { a: uint256, b: bytes }
      // Slice 32 bytes from the bytes field for EqualTo comparison
      const targetValue = defaultAbiCoder.encode(["uint256"], [12345]);

      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // First tuple element - uint256, just pass
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // Second tuple element - bytes, apply Slice (32 bytes for EqualTo)
        {
          parent: 1,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 32),
        },
        // Child of Slice - compare the 32-byte slice with EqualTo
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.EqualTo,
          compValue: targetValue,
        },
      ]);

      // Tuple with bytes starting with target value - should pass
      await expect(invoke({ a: 100, b: targetValue + "deadbeef" })).to.not.be
        .reverted;

      // Tuple with different first 32 bytes - should fail
      const wrongValue = defaultAbiCoder.encode(["uint256"], [12346]);
      await expect(invoke({ a: 100, b: wrongValue + "deadbeef" }))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    });

    it("slices bytes from inside tuple with GreaterThan comparison", async () => {
      const { roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamDynamicTuple,
      );

      // Slice first 4 bytes from the bytes field
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(0, 4),
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.GreaterThan,
          // Compare against value 0xFF (255)
          compValue: defaultAbiCoder.encode(["uint256"], [0xff]),
        },
      ]);

      // bytes starting with 0x00000100 (256) - should pass (256 > 255)
      await expect(invoke({ a: 42, b: "0x00000100deadbeef" })).to.not.be
        .reverted;

      // bytes starting with 0x000000ff (255) - should fail (255 not > 255)
      await expect(invoke({ a: 42, b: "0x000000ffdeadbeef" }))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    });

    it("slices bytes from inside tuple with offset and comparison", async () => {
      const { roles, scopeFunction, invoke } = await loadFixture(
        setupOneParamDynamicTuple,
      );

      // Slice 8 bytes at offset 4 from the bytes field
      await scopeFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Dynamic,
          operator: Operator.Slice,
          compValue: encodeSliceCompValue(4, 8),
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.GreaterThan,
          // Compare against value 1000 (right-aligned 8 bytes)
          compValue: defaultAbiCoder.encode(["uint256"], [1000]),
        },
      ]);

      // bytes: 4 byte prefix + 8 bytes value (1001) + suffix
      // 0x00000000 + 00000000000003e9 + 00000000
      // 1001 = 0x3e9, in 8 bytes right-aligned: 0x00000000000003e9
      const bytesPass = "0x00000000" + "00000000000003e9" + "00000000";
      await expect(invoke({ a: 42, b: bytesPass })).to.not.be.reverted;

      // bytes: 4 byte prefix + 8 bytes value (1000) + suffix
      // Should fail (not greater than 1000)
      const bytesFail = "0x00000000" + "00000000000003e8" + "00000000";
      await expect(invoke({ a: 42, b: bytesFail }))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    });
  });
});
