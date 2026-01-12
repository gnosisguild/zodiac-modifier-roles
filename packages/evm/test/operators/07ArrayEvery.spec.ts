import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
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

describe("Operator - ArrayEvery", () => {
  describe("element matching", () => {
    it("passes when all elements match", async () => {
      const { allowFunction, invoke } = await loadFixture(setupArrayParam);

      // ArrayEvery: all elements must be less than 100
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayEvery,
              children: [
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

      // All elements < 100 passes
      await expect(invoke([10, 20, 30, 40])).to.not.be.reverted;
    });

    it("fails when at least one element does not match", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      // ArrayEvery: all elements must be less than 100
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayEvery,
              children: [
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

      // One element >= 100 fails
      await expect(invoke([10, 20, 150, 40]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NotEveryArrayElementPasses,
          2, // LessThan node (failing element's child)
          anyValue,
          anyValue,
        );
    });

    it("fails immediately on first mismatch (short-circuit)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      const allowanceKey = hexlify(randomBytes(32));

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // ArrayEvery with And(LessThan(50), WithinAllowance)
      // Elements >= 50 fail before consuming allowance
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayEvery,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.LessThan,
                      compValue: abiCoder.encode(["uint256"], [50]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.WithinAllowance,
                      compValue: allowanceKey,
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Array [10, 60, 20] - first element (10) passes and consumes
      // Second element (60) fails LessThan check before WithinAllowance
      // Transaction reverts, but consumptions from element 0 are NOT persisted
      await expect(invoke([10, 60, 20]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NotEveryArrayElementPasses,
          3, // LessThan node (failing element's child)
          anyValue,
          anyValue,
        );

      // Allowance unchanged - transaction reverted so no consumption persisted
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(100);
    });

    it("passes when array is empty (vacuous truth)", async () => {
      const { allowFunction, invoke } = await loadFixture(setupArrayParam);

      // ArrayEvery: all elements must equal 42
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayEvery,
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

      // Empty array passes - no element violates the condition (vacuous truth)
      await expect(invoke([])).to.not.be.reverted;
    });
  });

  describe("consumption handling", () => {
    it("accumulates consumptions from all elements", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // ArrayEvery with WithinAllowance - each element consumes its value
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayEvery,
              children: [
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

      // Array [10, 20, 30] - all elements pass, all consumed (60 total)
      await expect(invoke([10, 20, 30])).to.not.be.reverted;

      // All elements consumed - remaining is 40
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(40);
    });
  });
});
