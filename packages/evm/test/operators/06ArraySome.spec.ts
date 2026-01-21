import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, hexlify, randomBytes } from "ethers";

import { setupTestContract, setupArrayParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
  packConditions,
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
        .withArgs(
          ConditionViolationStatus.NoArrayElementPasses,
          1, // ArraySome node
          anyValue,
          anyValue,
        );
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
        .withArgs(
          ConditionViolationStatus.NoArrayElementPasses,
          1, // ArraySome node
          anyValue,
          anyValue,
        );
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

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

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
      );

      await expect(invoke([1, 2, 3]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NoArrayElementPasses,
          1, // ArraySome node at BFS index 1
          anyValue,
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupArrayParam);

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
      );

      await expect(invoke([1, 2, 3]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NoArrayElementPasses,
          anyValue,
          36, // payloadLocation: array data starts at byte 36
          128, // payloadSize: 32 (length) + 3*32 (elements) = 128
        );
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles } = await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.AbiEncoded,
        Encoding.Dynamic,
        Encoding.EtherValue,
        Encoding.None,
        Encoding.Static,
        Encoding.Tuple,
      ]) {
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: encoding,
              operator: Operator.ArraySome,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    it("reverts UnsuitableCompValue when compValue is not empty", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArraySome,
            compValue: "0x01",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
    });

    describe("children", () => {
      it("reverts UnsuitableChildCount when ArraySome has zero children", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("reverts UnsuitableChildCount when ArraySome has more than one child", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // ArraySome requires exactly 1 structural child
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");

        // ArraySome requires exactly 1 structural child
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("reverts UnsuitableChildCount when ArraySome has non-structural child", async () => {
        const { roles } = await loadFixture(setupTestContract);

        const allowanceKey = hexlify(randomBytes(32));

        // Valid: ArraySome with one structural child - should succeed
        await roles.packConditions([
          {
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArraySome,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]);

        // Invalid: Adding a non-structural child should fail
        await expect(
          roles.packConditions([
            {
              parent: 0,
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });
    });
  });
});
