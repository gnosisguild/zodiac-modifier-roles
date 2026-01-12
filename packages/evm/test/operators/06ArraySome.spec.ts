import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, ZeroHash } from "ethers";

import { setupArrayParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - ArraySome", () => {
  describe("element matching", () => {
    it("passes when at least one element matches", async () => {
      const { allowFunction, invoke } = await loadFixture(setupArrayParam);

      // ArraySome: at least one element must equal 42
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
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

      // Array with matching element passes
      await expect(invoke([1, 2, 42, 4])).to.not.be.reverted;

      // Array with only matching element passes
      await expect(invoke([42])).to.not.be.reverted;
    });

    it("fails when no element matches", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      // ArraySome: at least one element must equal 42
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
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

      // Array with no matching element fails
      await expect(invoke([1, 2, 3, 4]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.NoArrayElementPasses, ZeroHash);
    });

    it("fails when array is empty", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      // ArraySome: at least one element must equal 42
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
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

      // Empty array fails - no element can match
      await expect(invoke([]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.NoArrayElementPasses, ZeroHash);
    });

    it("returns on first match (short-circuit)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // ArraySome with WithinAllowance - consumes value of matching element
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
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

      // Array [10, 20, 30] - first element (10) matches and is consumed
      // If not short-circuiting, all would be consumed (60 total)
      await expect(invoke([10, 20, 30])).to.not.be.reverted;

      // Only 10 was consumed (first match), not 60 - remaining is 90
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(90);
    });
  });

  describe("consumption handling", () => {
    it("uses consumptions from matching element only", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 50
      await roles.setAllowance(allowanceKey, 50, 0, 0, 0, 0);

      // ArraySome with And(GreaterThan(15), WithinAllowance)
      // Only elements > 15 can match, and matching consumes their value
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: abiCoder.encode(["uint256"], [15]),
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

      // Array [5, 10, 20, 30] - elements 5, 10 fail (<=15), element 20 matches
      // Only 20 is consumed (first matching element)
      await expect(invoke([5, 10, 20, 30])).to.not.be.reverted;

      // Only 20 consumed from matching element - remaining is 30
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(30);
    });
  });
});
