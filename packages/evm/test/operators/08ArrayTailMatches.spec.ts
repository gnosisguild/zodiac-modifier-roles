import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, hexlify, randomBytes, ZeroHash } from "ethers";

import { setupArrayParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - ArrayTailMatches", () => {
  describe("matching logic", () => {
    it("matches when tail elements align with conditions", async () => {
      const { allowFunction, invoke } = await loadFixture(setupArrayParam);

      // ArrayTailMatches: last 2 elements must be 100, 200
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [100]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [200]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Exact tail match passes
      await expect(invoke([100, 200])).to.not.be.reverted;

      // Longer array with matching tail passes
      await expect(invoke([1, 2, 3, 100, 200])).to.not.be.reverted;
    });

    it("fails when tail elements do not match", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      // ArrayTailMatches: last 2 elements must be 100, 200
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [100]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [200]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Last element wrong
      await expect(invoke([100, 999]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Second-to-last element wrong
      await expect(invoke([999, 200]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("fails when array length is less than number of conditions", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      // ArrayTailMatches: requires 2 tail elements
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [100]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [200]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Only 1 element - not enough for 2 conditions
      await expect(invoke([100]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAMatch, ZeroHash);

      // Empty array
      await expect(invoke([]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAMatch, ZeroHash);
    });

    it("ignores elements before the tail (prefix insensitive)", async () => {
      const { allowFunction, invoke } = await loadFixture(setupArrayParam);

      // ArrayTailMatches: only checks last element
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Any prefix values are ignored - only tail (42) matters
      await expect(invoke([999, 888, 777, 42])).to.not.be.reverted;

      // Different prefix, same tail - still passes
      await expect(invoke([1, 2, 3, 4, 5, 42])).to.not.be.reverted;
    });
  });

  describe("routing & consumption", () => {
    it("routes correct tail element to corresponding child condition", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      // ArrayTailMatches with 3 conditions: [>10, ==50, <100]
      // For array [a, b, c, d, e] with 3 conditions:
      // - condition[0] (>10) matches element[2] (c)
      // - condition[1] (==50) matches element[3] (d)
      // - condition[2] (<100) matches element[4] (e)
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [50]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.LessThan,
                  compValue: abiCoder.encode(["uint256"], [100]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Array [1, 2, 20, 50, 80] - tail is [20, 50, 80]
      // 20 > 10 ✓, 50 == 50 ✓, 80 < 100 ✓
      await expect(invoke([1, 2, 20, 50, 80])).to.not.be.reverted;

      // Array [5, 50, 80] - swapped first condition value
      // 5 > 10 ✗ - fails on first tail element
      await expect(invoke([5, 50, 80]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);

      // Array [20, 99, 80] - wrong middle element
      // 20 > 10 ✓, 99 == 50 ✗
      await expect(invoke([20, 99, 80]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Array [20, 50, 150] - last element too big
      // 20 > 10 ✓, 50 == 50 ✓, 150 < 100 ✗
      await expect(invoke([20, 50, 150]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );
    });

    it("accumulates consumptions from all tail matches", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      const allowanceKey = hexlify(randomBytes(32));

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // ArrayTailMatches with 2 WithinAllowance conditions
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Array [999, 20, 30] - prefix ignored, tail [20, 30] consumed (50 total)
      await expect(invoke([999, 20, 30])).to.not.be.reverted;

      // Both tail elements consumed - remaining is 50
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(50);
    });
  });
});
