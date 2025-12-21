import { expect } from "chai";
import hre from "hardhat";
import { AbiCoder, ZeroHash, solidityPacked } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "./utils";
import { ConditionFlatStruct } from "../typechain-types/contracts/Roles";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

async function setup() {
  const Mock = await hre.ethers.getContractFactory("MockIntegrity");
  const mock = await Mock.deploy();

  async function enforce(conditionsFlat: ConditionFlatStruct[]) {
    await mock.enforce(conditionsFlat);
  }

  return {
    enforce,
    mock,
  };
}

describe("Integrity", () => {
  describe("Global Structure Validation", () => {
    it("should revert if the conditions array is empty", async () => {
      const { mock, enforce } = await loadFixture(setup);
      await expect(enforce([])).to.be.revertedWithCustomError(
        mock,
        "UnsuitableRootNode",
      );
    });

    it("should revert if there is no root node (parent === index)", async () => {
      const { mock, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          { parent: 1, paramType: 0, operator: 0, compValue: "0x" },
          { parent: 0, paramType: 0, operator: 0, compValue: "0x" },
        ]),
      ).to.be.revertedWithCustomError(mock, "UnsuitableRootNode");
    });

    it("should revert if there is more than one root node", async () => {
      const { mock, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          { parent: 0, paramType: 0, operator: 0, compValue: "0x" },
          { parent: 1, paramType: 0, operator: 0, compValue: "0x" },
        ]),
      ).to.be.revertedWithCustomError(mock, "UnsuitableRootNode");
    });

    it("should revert if the root node is not at index 0", async () => {
      const { mock, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          { parent: 1, paramType: 0, operator: 0, compValue: "0x" },
          { parent: 0, paramType: 0, operator: 0, compValue: "0x" },
        ]),
      ).to.be.revertedWithCustomError(mock, "UnsuitableRootNode");
    });

    it("should revert if the nodes are not in BFS (Breadth-First Search) order", async () => {
      const { mock, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(mock, "NotBFS");
    });
  });

  describe("Root Node Validation", () => {
    it("should pass for a simple, valid AbiEncoded root", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });
  });

  describe("Parent-Child Relationship Rules", () => {
    it("should revert if a node's parent comes after the node itself", async () => {
      const { mock, enforce } = await loadFixture(setup);
      // This is covered by the root node check (must be at index 0)
      // and the BFS check.
      await expect(
        enforce([
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 2,
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
      ).to.be.revertedWithCustomError(mock, "NotBFS");
    });
  });

  describe("Node-Specific Validation", () => {
    describe("Container Nodes (Tuple, Array, AbiEncoded, AbiEncoded)", () => {
      it("should revert if a Tuple node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if a Tuple node has no structural children even with non-structural ones", async () => {
        const { mock, enforce } = await loadFixture(setup);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 15000,
        });

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if a AbiEncoded node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(0);
      });

      it("should revert if an Array node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [{ paramType: Encoding.Array, operator: Operator.Matches }],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if an Array node has no structural children even with non-structural ones", async () => {
        const { mock, enforce } = await loadFixture(setup);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 15000,
        });

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should pass with valid children", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });
    });

    describe("Leaf Nodes (Static, Dynamic)", () => {
      it("should revert if a Static node has children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if a Dynamic node has children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Dynamic,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });
    });

    describe("Logical Nodes (AND, OR, NOR)", () => {
      it("should revert if a logical node's paramType is not None", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static, // Should be None
              operator: Operator.And,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if a logical node has a non-empty compValue", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              compValue: "0x01", // Should be empty
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if a logical node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [{ paramType: Encoding.None, operator: Operator.And }],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });
    });
  });

  describe("Operator-Specific Validation", () => {
    describe("Comparison Operators (EqualTo, GreaterThan, LessThan, etc.)", () => {
      it("should revert if GreaterThan is used with a non-Static type", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Dynamic, // Invalid
              operator: Operator.GreaterThan,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if EqualTo is used with an invalid type like None", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None, // Invalid
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if GreaterThan has a compValue that is not 32 bytes", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.GreaterThan,
              compValue: "0x1234", // Invalid length
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if EqualTo has an empty compValue", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: "0x", // Empty
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if Static EqualTo has non-32-byte compValue", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // 31 bytes - invalid for Static
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: "0x" + "00".repeat(31),
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should accept Dynamic EqualTo with any length compValue", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // 31 bytes - valid for Dynamic
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: "0x" + "00".repeat(31),
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });
    });

    describe("Bitmask Operator", () => {
      it("should revert if compValue is too short (less than 4 bytes)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // Only 2 bytes (just shift, no mask/expected)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Bitmask,
                  compValue: "0x0000", // Only shift, no mask/expected
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if compValue has odd length after shift (mask != expected length)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // 5 bytes: 2 shift + 3 remaining (odd, can't split evenly)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Bitmask,
                  compValue: "0x0000112233", // 2 + 3 bytes (invalid)
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should pass with valid compValue (4 bytes: shift + 1 mask + 1 expected)", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Bitmask,
                  compValue: "0x0000ff00", // 2 shift + 1 mask + 1 expected
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("should pass with valid compValue (larger mask/expected)", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Bitmask,
                  // 2 shift + 4 mask + 4 expected = 10 bytes
                  compValue: "0x0000ffffffff00000000",
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });
    });

    describe("Array Operators (ArraySome, ArrayEvery)", () => {
      it("should revert if ArraySome is not used on an Array type", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple, // Invalid
              operator: Operator.ArraySome,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if ArraySome does not have exactly one child", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // No children
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                { paramType: Encoding.Array, operator: Operator.ArraySome },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);

        // More than one child
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.ArraySome,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if ArrayTailMatches is not used on an Array type", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.ArrayTailMatches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if ArrayTailMatches has non-structural children", async () => {
        const { mock, enforce } = await loadFixture(setup);

        const compValue = encodeWithinRatioCompValue({
          referenceIndex: 0,
          referenceDecimals: 0,
          relativeIndex: 1,
          relativeDecimals: 0,
          minRatio: 0,
          maxRatio: 15000,
        });

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArrayTailMatches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Static, operator: Operator.Pass },
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });
    });

    describe("Allowance Operators (CallWithinAllowance)", () => {
      it("should revert if they have children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: ZeroHash,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if their paramType is not None", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static, // Invalid
              operator: Operator.CallWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if nested inside a structural node (e.g., Tuple)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParent")
          .withArgs(2);
      });

      it("should revert if nested inside an Array", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                {
                  paramType: Encoding.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParent")
          .withArgs(3);
      });

      it("should pass when correctly nested under a AbiEncoded node", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            // Structural child required
            { paramType: Encoding.Static, operator: Operator.Pass },
            // CallWithinAllowance is non-structural
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass when nested inside a logical operator (And/Or)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                {
                  paramType: Encoding.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass when nested inside a deeply nested logical structure", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    {
                      paramType: Encoding.None,
                      operator: Operator.CallWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    {
                      paramType: Encoding.None,
                      operator: Operator.CallWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass when nested inside a AbiEncoded variant (Or with AbiEncoded branches)", async () => {
        const { enforce } = await loadFixture(setup);
        // This tests the scenario: AbiEncoded -> Or -> AbiEncoded -> CallWithinAllowance
        // where we have calldata variants and allowance inside one variant
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.AbiEncoded,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    {
                      paramType: Encoding.None,
                      operator: Operator.CallWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
                {
                  paramType: Encoding.AbiEncoded,
                  children: [
                    { paramType: Encoding.Dynamic, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass with a central allowance at AbiEncoded level alongside Or variants", async () => {
        const { enforce } = await loadFixture(setup);
        // This tests the scenario where we define a single allowance condition
        // at the AbiEncoded level that applies to all Or branches
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
                {
                  paramType: Encoding.AbiEncoded,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
            // Central allowance that applies to all branches
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass with allowance as the only condition (no calldata restrictions)", async () => {
        const { enforce } = await loadFixture(setup);
        // Scoping a function without any calldata arguments, only restricting call rate
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should revert if WithinAllowance compValue has invalid length (not 32 or 54)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // 33 bytes - invalid (between 32 and 54)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(33),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should pass with valid 54-byte compValue (allowanceKey + adapter + decimals)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(54),
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should revert if compValue is too long (55 bytes)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(55),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if WithinAllowance accrueDecimals exceeds 18", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // 54 bytes: 32 (key) + 20 (adapter) + 1 (accrueDecimals=19) + 1 (paramDecimals=0)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(52) + "13" + "00", // 0x13 = 19
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "AllowanceDecimalsExceedMax")
          .withArgs(1);
      });

      it("should revert if WithinAllowance paramDecimals exceeds 18", async () => {
        const { mock, enforce } = await loadFixture(setup);
        // 54 bytes: 32 (key) + 20 (adapter) + 1 (accrueDecimals=0) + 1 (paramDecimals=19)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(52) + "00" + "13", // 0x13 = 19
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "AllowanceDecimalsExceedMax")
          .withArgs(1);
      });

      it("should pass with valid decimals (both = 18)", async () => {
        const { enforce } = await loadFixture(setup);
        // 54 bytes: 32 (key) + 20 (adapter) + 1 (accrueDecimals=18) + 1 (paramDecimals=18)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(52) + "12" + "12", // 0x12 = 18
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });
    });

    describe("Empty Operator", () => {
      it("should revert if Empty has non-None paramType", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Static, // Invalid - should be None
              operator: Operator.Empty,
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if Empty has non-empty compValue", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
              compValue: "0x01", // Invalid - should be empty
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if Empty has children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(0);
      });

      it("should pass with valid Empty configuration (standalone)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass if Empty is nested inside Or", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue:
                "0x0000000000000000000000000000000000000000000000000000000000000001",
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass if Empty is nested inside And", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue:
                "0x0000000000000000000000000000000000000000000000000000000000000001",
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should revert if Empty is nested inside a structural node (Tuple)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Empty,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParent")
          .withArgs(2); // Index of Empty node
      });
    });

    it("should revert for any unsupported or placeholder operator", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator._Placeholder10, // Unsupported
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsupportedOperator")
        .withArgs(1);
    });

    describe("Slice Operator", () => {
      // Helper to encode Slice compValue: 2 bytes start + 1 byte size
      const encodeSliceCompValue = (start: number, size: number) =>
        solidityPacked(["uint16", "uint8"], [start, size]);

      it("should revert if Slice paramType is not Static or Dynamic", async () => {
        const { mock, enforce } = await loadFixture(setup);

        // Tuple paramType
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Tuple, // Invalid - should be Static or Dynamic
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);

        // Array paramType
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Array, // Invalid - should be Static or Dynamic
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);

        // None paramType
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None, // Invalid - should be Static or Dynamic
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should pass with Static paramType", async () => {
        const { enforce } = await loadFixture(setup);

        // 8 bytes from the beginning
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 8),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // 13 bytes from the middle (offset 10)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(10, 13),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // 9 bytes from the end (offset 23, size 9 = bytes 23-31)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(23, 9),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("should revert if Slice compValue is not 3 bytes", async () => {
        const { mock, enforce } = await loadFixture(setup);

        // Empty compValue
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: "0x", // Invalid - should be 3 bytes
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);

        // 2 bytes (missing size)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: "0x0000", // Invalid - only 2 bytes
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);

        // 4 bytes (too many)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: "0x00000004", // Invalid - 4 bytes
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if Slice size is 0", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 0), // Invalid - size 0
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if Slice size exceeds 32", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 33), // Invalid - size > 32
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if Slice has more than one child", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [100]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.LessThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [200]),
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if Slice child does not resolve to Static", async () => {
        const { mock, enforce } = await loadFixture(setup);

        // Child is Dynamic
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "SliceChildNotStatic")
          .withArgs(1);

        // Child is Tuple
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 32),
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "SliceChildNotStatic")
          .withArgs(1);
      });

      it("should revert if Slice has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 20),
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "SliceChildNotStatic")
          .withArgs(1);
      });

      it("should pass with valid Slice configuration (child resolves to Static)", async () => {
        const { enforce } = await loadFixture(setup);

        // Direct comparison operator with Static paramType
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [100]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // And with multiple Static children (resolves to Static)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    {
                      paramType: Encoding.None,
                      operator: Operator.And,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.GreaterThan,
                          compValue: defaultAbiCoder.encode(["uint256"], [10]),
                        },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.LessThan,
                          compValue: defaultAbiCoder.encode(["uint256"], [100]),
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("should pass with Slice size at boundaries (1 and 32)", async () => {
        const { enforce } = await loadFixture(setup);

        // Size 1
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 1),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // Size 32
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 32),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("should pass with all comparison operators under Slice", async () => {
        const { enforce } = await loadFixture(setup);

        // GreaterThan
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 8),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // LessThan
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(4, 4),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.LessThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [1000]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // SignedIntGreaterThan
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 32),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.SignedIntGreaterThan,
                      compValue: defaultAbiCoder.encode(["int256"], [-100]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // SignedIntLessThan
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 16),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.SignedIntLessThan,
                      compValue: defaultAbiCoder.encode(["int256"], [100]),
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("should pass with Slice child being And/Or with Static comparison operators", async () => {
        const { enforce } = await loadFixture(setup);

        // And with Static children
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    {
                      paramType: Encoding.None,
                      operator: Operator.And,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.GreaterThan,
                          compValue: defaultAbiCoder.encode(["uint256"], [10]),
                        },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.LessThan,
                          compValue: defaultAbiCoder.encode(["uint256"], [100]),
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;

        // Or with Static children
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.Slice,
                  compValue: encodeSliceCompValue(0, 4),
                  children: [
                    {
                      paramType: Encoding.None,
                      operator: Operator.Or,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.GreaterThan,
                          compValue: defaultAbiCoder.encode(["uint256"], [100]),
                        },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.LessThan,
                          compValue: defaultAbiCoder.encode(["uint256"], [10]),
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("should revert if comparison operator has None paramType", async () => {
        const { mock, enforce } = await loadFixture(setup);

        // GreaterThan with None - not allowed (must use Static)
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.GreaterThan,
                  compValue: defaultAbiCoder.encode(["uint256"], [100]),
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);

        // LessThan with None - not allowed
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    {
                      paramType: Encoding.None,
                      operator: Operator.LessThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [100]),
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(3);
      });
    });
  });

  describe("Type Tree Equivalence", () => {
    it("should revert if children of a logical operator have different, non-variant type trees", async () => {
      const { mock, enforce } = await loadFixture(setup);
      {
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                { paramType: Encoding.Static }, // Static
                {
                  paramType: Encoding.Tuple,
                  children: [{ paramType: Encoding.Static }],
                }, // Tuple
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          mock,
          "UnsuitableChildTypeTree",
        );
      }

      {
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                { paramType: Encoding.Static }, // Static
                { paramType: Encoding.Dynamic },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          mock,
          "UnsuitableChildTypeTree",
        );
      }

      {
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                { paramType: Encoding.Dynamic },
                {
                  paramType: Encoding.AbiEncoded,
                  children: [{ paramType: Encoding.Static }],
                },
                {
                  paramType: Encoding.AbiEncoded,
                  children: [{ paramType: Encoding.Static }],
                },
                { paramType: Encoding.Static },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          mock,
          "UnsuitableChildTypeTree",
        );
      }
    });

    it("should revert if nested children of a logical operator have different, non-variant type trees  (e.g., Or(Or(T1, T2)))", async () => {
      const { mock, enforce } = await loadFixture(setup);
      // Or with a single child that is itself an Or containing variants
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.None,
                operator: Operator.Or,
                children: [
                  { paramType: Encoding.Dynamic },
                  { paramType: Encoding.Static },
                ],
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );
    });

    it("should pass if children of a logical operator have identical type trees", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass if children of a logical operator have compatible variant types (Dynamic, AbiEncoded, AbiEncoded)", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic },
              {
                paramType: Encoding.AbiEncoded,
                children: [{ paramType: Encoding.Static }],
              },
              {
                paramType: Encoding.AbiEncoded,
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should revert if children of an Array have different type trees", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Pass,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );
    });

    it("should pass if children of an Array have compatible type trees", async () => {
      const { enforce } = await loadFixture(setup);
      {
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Static },
                { paramType: Encoding.Static },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      }
      {
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Dynamic },
                {
                  paramType: Encoding.AbiEncoded,
                  children: [{ paramType: Encoding.Static }],
                },
                {
                  paramType: Encoding.AbiEncoded,
                  children: [{ paramType: Encoding.Static }],
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      }
    });

    describe("Array.Matches with Multiple Entries", () => {
      it("should pass when Array.Matches children are simple homogeneous types (e.g., all Static)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [42]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: defaultAbiCoder.encode(["uint256"], [10]),
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass when Array.Matches children are complex homogeneous types (e.g., all Tuple with same structure)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Pass,
                  children: [
                    { paramType: Encoding.Static },
                    { paramType: Encoding.Dynamic },
                  ],
                },
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(
                    ["tuple(uint256,string)"],
                    [[42, "test"]],
                  ),
                  children: [
                    { paramType: Encoding.Static },
                    { paramType: Encoding.Dynamic },
                  ],
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should pass when Array.Matches children are type equivalent variants (Dynamic/AbiEncoded/AbiEncoded)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Dynamic },
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  children: [{ paramType: Encoding.Static }],
                },
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static },
                        { paramType: Encoding.Dynamic },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("should revert when Array.Matches children have incompatible type trees", async () => {
        const { mock, enforce } = await loadFixture(setup);
        {
          const conditions = flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Static },
                  { paramType: Encoding.Dynamic },
                ],
              },
            ],
          });
          await expect(enforce(conditions))
            .to.be.revertedWithCustomError(mock, "UnsuitableChildTypeTree")
            .withArgs(1);
        }
      });
    });
  });

  describe("Non-Structural Children Ordering", () => {
    it("should pass when non-structural children come last", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          // Structural child first
          { paramType: Encoding.Static, operator: Operator.Pass },
          // Non-structural children last
          {
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: ZeroHash,
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass when all children are structural", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass when all children are non-structural", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: ZeroHash,
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should revert when a structural child comes after a non-structural child", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          // Non-structural child first (incorrect)
          {
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: ZeroHash,
          },
          // Structural child after non-structural (incorrect)
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(
          mock,
          "NonStructuralChildrenMustComeLast",
        )
        .withArgs(0);
    });

    it("should revert when structural children are interleaved with non-structural", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.None,
                operator: Operator.CallWithinAllowance,
                compValue: ZeroHash,
              },
            ],
          },
          // This structural child after non-structural is invalid
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(
          mock,
          "NonStructuralChildrenMustComeLast",
        )
        .withArgs(0);
    });
  });

  describe("Valid Complex Structures (Happy Paths)", () => {
    it("should pass for a complex, deeply nested valid structure", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Tuple,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
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
                        operator: Operator.GreaterThan,
                        compValue: defaultAbiCoder.encode(["uint256"], [10]),
                      },
                      {
                        paramType: Encoding.Static,
                        operator: Operator.LessThan,
                        compValue: defaultAbiCoder.encode(["uint256"], [100]),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass for a valid structure using variants and logical operators", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              {
                paramType: Encoding.AbiEncoded,
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });
  });

  describe("compatible childTypeTree - OLD TESTS", () => {
    it("and/or/nor mismatch", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.None,
          operator: Operator.And,
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
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );

      await expect(
        enforce([
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
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
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("and/or/nor mismatch - order counts", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );

      await expect(
        enforce([
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("and/or mismatch - recursive", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.None,
          operator: Operator.Or,
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
          paramType: Encoding.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );

      conditions[conditions.length - 1].paramType = Encoding.Static;

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("array mismatch", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Pass,
        compValue: "0x",
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Pass,
            compValue: "0x",
            children: [
              {
                paramType: Encoding.Tuple,
                operator: Operator.Pass,
                compValue: "0x",
                children: [
                  {
                    paramType: Encoding.Dynamic,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                ],
              },
              {
                paramType: Encoding.Tuple,
                operator: Operator.Pass,
                compValue: "0x",
                children: [
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                ],
              },
            ],
          },
        ],
      });

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );

      conditions[4].paramType = Encoding.Static;

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("array mismatch - order counts", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Array,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // first element 2
        {
          parent: 1,
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // second element 3
        {
          parent: 1,
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );

      // swap
      conditions[6].paramType = Encoding.Dynamic;
      conditions[7].paramType = Encoding.Static;

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("array mismatch - different length", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Array,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // first element 2
        {
          parent: 1,
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // second element 3
        {
          parent: 1,
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.not.reverted;

      await expect(
        enforce(conditions.slice(0, -1)),
      ).to.be.revertedWithCustomError(mock, "UnsuitableChildTypeTree");
    });
    it("array mismatch - recursive", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Array,
          operator: Operator.Pass,
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
          paramType: Encoding.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableChildTypeTree",
      );

      conditions[conditions.length - 1].paramType = Encoding.Static;
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("type variants:", async () => {
      it("allows Dynamic and AbiEncoded siblings", async () => {
        const { enforce } = await loadFixture(setup);

        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.AbiEncoded,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      // Test 2: Dynamic + AbiEncoded are equivalent (under Or)
      it("allows Dynamic and AbiEncoded siblings under Or", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.AbiEncoded,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      // Test 3: Dynamic + multiple AbiEncoded siblings
      it("allows Dynamic and multiple AbiEncoded siblings", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.AbiEncoded,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                    {
                      paramType: Encoding.AbiEncoded,
                      children: [
                        {
                          paramType: Encoding.Tuple,
                          children: [
                            {
                              paramType: Encoding.Static,
                              operator: Operator.Pass,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      // Test 4: Type equivalence in nested arrays
      it("allows type equivalence within array contexts", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.ArraySome,
                  children: [
                    {
                      paramType: Encoding.None,
                      operator: Operator.Or,
                      children: [
                        {
                          paramType: Encoding.Dynamic,
                          operator: Operator.Pass,
                        },
                        {
                          paramType: Encoding.AbiEncoded,
                          children: [
                            {
                              paramType: Encoding.Static,
                              operator: Operator.EqualTo,
                              compValue: defaultAbiCoder.encode(
                                ["uint256"],
                                [42],
                              ),
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      });

      it("rejects Static as sibling in type variant point", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.AbiEncoded,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableChildTypeTree")
          .withArgs(1);
      });

      it("rejects Tuple as sibling in type variant point", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.Tuple,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableChildTypeTree")
          .withArgs(1);
      });
    });
  });

  describe("AbiEncoded compValue validation", () => {
    it("allows empty compValue (default leadingBytes=4)", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x", // empty
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows 2-byte compValue (custom leadingBytes)", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0014", // leadingBytes = 20
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows 2+N byte compValue (leadingBytes + match data)", async () => {
      const { enforce } = await loadFixture(setup);
      // compValue: 0x0004 (N=4) + deadbeef (4 bytes of match data)
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0004deadbeef",
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows 2+N byte compValue with larger N", async () => {
      const { enforce } = await loadFixture(setup);
      // compValue: 0x0010 (N=16) + 16 bytes of match data
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0010" + "aa".repeat(16),
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("reverts when match bytes exceed 32", async () => {
      const { mock, enforce } = await loadFixture(setup);
      // compValue: 0x0021 (N=33) + 33 bytes of match data - exceeds limit
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0021" + "aa".repeat(33),
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
        .withArgs(0);
    });

    it("allows greater than 32 when no match bytes provided", async () => {
      const { enforce } = await loadFixture(setup);
      // compValue: 0x0100 (N=256) - any offset allowed without match bytes
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0100",
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows match bytes of exactly 32", async () => {
      const { enforce } = await loadFixture(setup);
      // compValue: 0x0020 (N=32) + 32 bytes of match data - at the limit
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0020" + "aa".repeat(32),
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("reverts on 1-byte compValue", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x00", // only 1 byte - invalid
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
        .withArgs(0);
    });

    it("reverts when length doesn't match N (too few bytes)", async () => {
      const { mock, enforce } = await loadFixture(setup);
      // compValue: 0x0004 (N=4) + only 2 bytes of data (should be 4)
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0004dead", // says N=4 but only 2 bytes follow
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
        .withArgs(0);
    });

    it("reverts when length doesn't match N (too many bytes)", async () => {
      const { mock, enforce } = await loadFixture(setup);
      // compValue: 0x0002 (N=2) + 4 bytes of data (should be 2)
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0002deadbeef", // says N=2 but 4 bytes follow
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
        .withArgs(0);
    });

    it("still rejects compValue on Tuple + Matches", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: "0x0004deadbeef", // Tuple doesn't support compValue
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
        .withArgs(1);
    });

    it("still rejects compValue on Array + Matches", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            compValue: "0x0004deadbeef", // Array doesn't support compValue
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
        .withArgs(1);
    });
  });

  describe("Type matching with non-structural children", () => {
    it("allows Tuple with matching Static children and non-structural WithinRatio", async () => {
      const { enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000,
      });

      // First two Static children are Pluck to populate indices for WithinRatio
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x01",
              },
              { paramType: Encoding.Static, operator: Operator.Pass },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows And operator with matching structural children and non-structural WithinRatio", async () => {
      const { enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000,
      });

      // First two children of And are Pluck to populate indices for WithinRatio
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x01",
              },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows Or operator with matching structural children and non-structural WithinRatio", async () => {
      const { enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000,
      });

      // First two children of Or are Pluck to populate indices for WithinRatio
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x01",
              },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows And with type-equivalent Dynamic children and non-structural CallWithinAllowance", async () => {
      const { enforce } = await loadFixture(setup);

      // Type-equivalent structural children, non-structural should be ignored
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              {
                paramType: Encoding.None,
                operator: Operator.CallWithinAllowance,
                compValue: ZeroHash,
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("rejects Array with non-matching structural children", async () => {
      const { mock, enforce } = await loadFixture(setup);

      // Mixing Static and Dynamic structural children should fail
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass }, // Doesn't match previous
            ],
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableChildTypeTree")
        .withArgs(1);
    });

    it("rejects And operator with non-matching structural children despite non-structural child", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000,
      });

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass }, // Doesn't match previous
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableChildTypeTree")
        .withArgs(1);
    });
  });

  describe("Pluck Order Validation", () => {
    it("allows WithinRatio when Pluck indices are visited before in DFS order", async () => {
      const { enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 9000,
        maxRatio: 11000,
      });

      // Structure: Matches with two Plucks followed by WithinRatio
      // DFS order: Matches -> Pluck(0) -> Pluck(1) -> WithinRatio
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x00", // index 0
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x01", // index 1
          },
          {
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue,
          },
        ],
      });

      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("reverts when WithinRatio references a Pluck index not yet visited in DFS order", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 5, // index 5 is never plucked
        relativeDecimals: 0,
        minRatio: 9000,
        maxRatio: 11000,
      });

      // Structure: Matches with one Pluck and WithinRatio referencing non-existent index
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x00", // index 0
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue,
          },
        ],
      });

      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "PluckNotVisitedBeforeRef")
        .withArgs(3, 5); // WithinRatio is at BFS index 3, missing pluck index 5
    });

    it("reverts when WithinRatio comes before Pluck in DFS order (nested structure)", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 9000,
        maxRatio: 11000,
      });

      // Structure: And with WithinRatio in first branch, Plucks in second branch
      // BFS: And -> Matches1 -> Matches2 -> WithinRatio -> Pluck(0) -> Pluck(1)
      // DFS: And -> Matches1 -> WithinRatio -> Matches2 -> Pluck(0) -> Pluck(1)
      // WithinRatio is visited before Plucks in DFS
      const conditions = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
              },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue,
              },
            ],
          },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00", // index 0
              },
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x01", // index 1
              },
            ],
          },
        ],
      });

      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "PluckNotVisitedBeforeRef")
        .withArgs(4, 0); // WithinRatio at index 4, referenceIndex 0 not yet visited
    });
  });

  describe("EtherValue Encoding", () => {
    it("should revert if EtherValue has children", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.EtherValue,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
        .withArgs(1);
    });

    it("should revert if ArrayPrimitive has non-structural children (EtherValue)", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.ArrayEvery,
            children: [
              {
                paramType: Encoding.EtherValue,
                operator: Operator.Pass,
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
        .withArgs(1);
    });

    it("should revert if EtherValue is used with unsupported operator (Matches)", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.EtherValue,
            operator: Operator.Matches,
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
        .withArgs(1);
    });

    it("should revert if EtherValue is used with Bitmask operator", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.EtherValue,
            operator: Operator.Bitmask,
            compValue: "0x00000102", // shift + mask + expected
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
        .withArgs(1);
    });

    it("should pass for EtherValue with WithinAllowance operator", async () => {
      const { enforce } = await loadFixture(setup);
      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.EtherValue,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass for EtherValue with Pluck operator", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.EtherValue,
            operator: Operator.Pluck,
            compValue: "0x00",
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass for EtherValue with comparison operators", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.EtherValue,
            operator: Operator.GreaterThan,
            compValue: defaultAbiCoder.encode(["uint256"], [1000]),
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should revert if EtherValue comes before structural children", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.EtherValue,
            operator: Operator.Pass,
          },
          // Structural child after non-structural EtherValue (invalid)
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(
          mock,
          "NonStructuralChildrenMustComeLast",
        )
        .withArgs(0);
    });
  });
});

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
