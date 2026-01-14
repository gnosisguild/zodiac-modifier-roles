import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { setupTestContract, setupDynamicParam } from "../setup";
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
      const { allowFunction, invoke } = await loadFixture(setupDynamicParam);

      // shift=3, mask=2 bytes -> reads bytes[3:5]
      await allowFunction(
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
      await expect(invoke("0x000000aabb")).to.not.be.reverted;

      // bytes[3:5] = 0xccdd -> fails
      await expect(invoke("0x000000ccdd")).to.be.reverted;
    });

    it("fails with BitmaskOverflow when shift + length exceeds data size", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // 33-byte mask requires 33 bytes (crosses word boundary)
      await allowFunction(
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
      await expect(invoke("0x" + "ab".repeat(33))).to.not.be.reverted;

      // 32 bytes -> fails (crosses into second word but data only has one word)
      await expect(invoke("0x" + "ab".repeat(32)))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskOverflow,
          1,
          anyValue,
          anyValue,
        );
    });
  });

  describe("logic (single word)", () => {
    it("passes when (data & mask) == expected", async () => {
      const { allowFunction, invoke } = await loadFixture(setupDynamicParam);

      await allowFunction(
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

      await expect(invoke("0xaabb")).to.not.be.reverted;
    });

    it("fails when (data & mask) != expected", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      await allowFunction(
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

      await expect(invoke("0xaacc"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          1,
          anyValue,
          anyValue,
        );
    });

    it("ignores bits outside the mask and rinses trailing garbage", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // mask 0xf0 checks only high nibble, expected 0xa0
      await allowFunction(
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
      await expect(invoke("0xab7777")).to.not.be.reverted;

      // 0xaf & 0xf0 = 0xa0 -> passes (low nibble 0xf ignored)
      await expect(invoke("0xaf8888888888")).to.not.be.reverted;

      // 0xbb & 0xf0 = 0xb0 != 0xa0 -> fails
      await expect(invoke("0xbb"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          1,
          anyValue,
          anyValue,
        );
    });
  });

  describe("logic (multi-word)", () => {
    it("iterates chunks and passes when all match", async () => {
      const { allowFunction, invoke } = await loadFixture(setupDynamicParam);

      // 64-byte mask spanning 2 words
      await allowFunction(
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

      await expect(invoke("0x" + "ab".repeat(64))).to.not.be.reverted;
    });

    it("fails on mismatch in any chunk (first or subsequent)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // 64-byte mask spanning 2 words
      await allowFunction(
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
      await expect(invoke("0xcd" + "ab".repeat(63)))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          1,
          anyValue,
          anyValue,
        );

      // Last byte wrong (second chunk mismatch)
      await expect(invoke("0x" + "ab".repeat(63) + "cd"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          1,
          anyValue,
          anyValue,
        );
    });
  });

  describe("shift offset", () => {
    it("applies shift correctly before reading data", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // shift 5 bytes, then check 1 byte
      await allowFunction(
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
      await expect(invoke("0x0000000000cd4444444444")).to.not.be.reverted;

      // byte[5] = 0xab -> fails
      await expect(invoke("0x0000000000ab"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          1,
          anyValue,
          anyValue,
        );
    });
  });

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      await allowFunction(
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
      );

      await expect(invoke("0xccdd"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          1, // Bitmask node at BFS index 1
          anyValue,
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      await allowFunction(
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
      );

      // 50 bytes of data, padded to 64 bytes
      const fiftyBytes =
        "0xccdd000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      await expect(invoke(fiftyBytes))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.BitmaskNotAllowed,
          anyValue,
          36, // payloadLocation: dynamic param at byte 36 (4 + 32)
          96, // payloadSize: 32 (length) + 64 (50 bytes padded to 64) = 96
        );
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.None,
        Encoding.Tuple,
        Encoding.Array,
        Encoding.AbiEncoded,
        Encoding.EtherValue,
      ]) {
        await expect(
          roles.allowTarget(
            roleKey,
            testContractAddress,
            [
              {
                parent: 0,
                paramType: encoding,
                operator: Operator.Bitmask,
                compValue: encodeCompValue(0, "ff", "ab"),
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    describe("compValue", () => {
      it("reverts UnsuitableCompValue when compValue is less than 4 bytes", async () => {
        const { roles, testContractAddress, roleKey } =
          await loadFixture(setupTestContract);

        await expect(
          roles.allowTarget(
            roleKey,
            testContractAddress,
            [
              {
                parent: 0,
                paramType: Encoding.Static,
                operator: Operator.Bitmask,
                compValue: "0x0000", // 2 bytes (only shift, no mask/expected)
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });

      it("reverts UnsuitableCompValue when (length - 2) is odd", async () => {
        const { roles, testContractAddress, roleKey } =
          await loadFixture(setupTestContract);

        await expect(
          roles.allowTarget(
            roleKey,
            testContractAddress,
            [
              {
                parent: 0,
                paramType: Encoding.Static,
                operator: Operator.Bitmask,
                compValue: "0x0000aabbcc", // 5 bytes: 2 shift + 3 (odd, can't split evenly)
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });
    });

    it("reverts LeafNodeCannotHaveChildren when Bitmask has children", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      await expect(
        roles.allowTarget(
          roleKey,
          testContractAddress,
          [
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Bitmask,
              compValue: encodeCompValue(0, "ff", "ab"),
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          0,
        ),
      ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
    });
  });
});
