import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, ZeroHash } from "ethers";

import { setupTestContract } from "../setup";
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
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // ArrayTailMatches: last 2 elements must be 100, 200
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[100, 200]]),
            0,
          ),
      ).to.not.be.reverted;

      // Longer array with matching tail passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[1, 2, 3, 100, 200]]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when tail elements do not match", async () => {
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // ArrayTailMatches: last 2 elements must be 100, 200
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[100, 999]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Second-to-last element wrong
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[999, 200]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("fails when array length is less than number of conditions", async () => {
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // ArrayTailMatches: requires 2 tail elements
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[100]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAMatch, ZeroHash);

      // Empty array
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAMatch, ZeroHash);
    });

    it("ignores elements before the tail (prefix insensitive)", async () => {
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // ArrayTailMatches: only checks last element
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[999, 888, 777, 42]]),
            0,
          ),
      ).to.not.be.reverted;

      // Different prefix, same tail - still passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[1, 2, 3, 4, 5, 42]]),
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  describe("routing & consumption", () => {
    it("routes correct tail element to corresponding child condition", async () => {
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // ArrayTailMatches with 3 conditions: [>10, ==50, <100]
      // For array [a, b, c, d, e] with 3 conditions:
      // - condition[0] (>10) matches element[2] (c)
      // - condition[1] (==50) matches element[3] (d)
      // - condition[2] (<100) matches element[4] (e)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[1, 2, 20, 50, 80]]),
            0,
          ),
      ).to.not.be.reverted;

      // Array [5, 50, 80] - swapped first condition value
      // 5 > 10 ✗ - fails on first tail element
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[5, 50, 80]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);

      // Array [20, 99, 80] - wrong middle element
      // 20 > 10 ✓, 99 == 50 ✗
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[20, 99, 80]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Array [20, 50, 150] - last element too big
      // 20 > 10 ✓, 50 == 50 ✓, 150 < 100 ✗
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[20, 50, 150]]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );
    });

    it("accumulates consumptions from all tail matches", async () => {
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // ArrayTailMatches with 2 WithinAllowance conditions
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [[999, 20, 30]]),
            0,
          ),
      ).to.not.be.reverted;

      // Both tail elements consumed - remaining is 50
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(50);
    });
  });
});
