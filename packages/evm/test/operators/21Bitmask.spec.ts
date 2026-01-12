import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Interface, ZeroHash } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

// Helper: compValue = [shift (2 bytes)][mask (N bytes)][expected (N bytes)]
function encodeCompValue(
  shift: number,
  mask: string,
  expected: string,
): string {
  if (mask.length !== expected.length) {
    throw new Error("mask and expected must have same length");
  }
  const shiftHex = shift.toString(16).padStart(4, "0");
  return `0x${shiftHex}${mask}${expected}`;
}

describe("Operator - Bitmask", () => {
  describe("parsing and bounds", () => {
    it("extracts shift and derives mask length correctly", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // shift=3, mask=2 bytes -> reads bytes[3:5]
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(3, "ffff", "aabb"),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // bytes[3:5] = 0xaabb -> passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x000000aabb"]),
            0,
          ),
      ).to.not.be.reverted;

      // bytes[3:5] = 0xccdd -> fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x000000ccdd"]),
            0,
          ),
      ).to.be.reverted;
    });

    it("fails with BitmaskOverflow when shift + length exceeds data size", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // 33-byte mask requires 33 bytes (crosses word boundary)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "ff".repeat(33), "ab".repeat(33)),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // 33 bytes -> passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x" + "ab".repeat(33)]),
            0,
          ),
      ).to.not.be.reverted;

      // 32 bytes -> fails (crosses into second word but data only has one word)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x" + "ab".repeat(32)]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.BitmaskOverflow, ZeroHash);
    });
  });

  describe("logic (single word)", () => {
    it("passes when (data & mask) == expected", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "ffff", "aabb"),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0xaabb"]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when (data & mask) != expected", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "ffff", "aabb"),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0xaacc"]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.BitmaskNotAllowed, ZeroHash);
    });

    it("ignores bits outside the mask and rinses trailing garbage", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // mask 0xf0 checks only high nibble, expected 0xa0
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "f0", "a0"),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // 0xab & 0xf0 = 0xa0 -> passes (low nibble 0xb ignored)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0xab7777"]),
            0,
          ),
      ).to.not.be.reverted;

      // 0xaf & 0xf0 = 0xa0 -> passes (low nibble 0xf ignored)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0xaf8888888888"]),
            0,
          ),
      ).to.not.be.reverted;

      // 0xbb & 0xf0 = 0xb0 != 0xa0 -> fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0xbb"]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.BitmaskNotAllowed, ZeroHash);
    });
  });

  describe("logic (multi-word)", () => {
    it("iterates chunks and passes when all match", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // 64-byte mask spanning 2 words
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "ff".repeat(64), "ab".repeat(64)),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x" + "ab".repeat(64)]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails on mismatch in any chunk (first or subsequent)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // 64-byte mask spanning 2 words
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "ff".repeat(64), "ab".repeat(64)),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // First byte wrong (first chunk mismatch)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0xcd" + "ab".repeat(63)]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.BitmaskNotAllowed, ZeroHash);

      // Last byte wrong (second chunk mismatch)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x" + "ab".repeat(63) + "cd"]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.BitmaskNotAllowed, ZeroHash);
    });
  });

  describe("shift offset", () => {
    it("applies shift correctly before reading data", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // shift 5 bytes, then check 1 byte
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(5, "ff", "cd"),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // byte[5] = 0xcd -> passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x0000000000cd4444444444"]),
            0,
          ),
      ).to.not.be.reverted;

      // byte[5] = 0xab -> fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x0000000000ab"]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.BitmaskNotAllowed, ZeroHash);
    });
  });
});
