import { expect } from "chai";
import hre from "hardhat";
import { AbiCoder, ZeroHash, solidityPacked } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "./utils";
import { ConditionFlatStruct } from "../typechain-types/contracts/PermissionBuilder";

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
            paramType: Encoding.Calldata,
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
    it("should revert if the final resolved root type is not Calldata", async () => {
      const { mock, enforce } = await loadFixture(setup);
      // This tree resolves to Static, not Calldata
      const conditions = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        mock,
        "UnsuitableRootNode",
      );
    });

    it("should pass for a simple, valid Calldata root", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
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
            paramType: Encoding.Calldata,
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
    describe("Container Nodes (Tuple, Array, Calldata, AbiEncoded)", () => {
      it("should revert if a Tuple node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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

      it("should revert if a Calldata node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
          operator: Operator.Matches,
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableChildCount")
          .withArgs(0);
      });

      it("should revert if an Array node has no children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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

      it("should revert if EqualTo has an empty or non-32-byte-multiple compValue", async () => {
        const { mock, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
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

        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: "0x" + "00".repeat(31), // Not multiple of 32
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(mock, "UnsuitableCompValue")
          .withArgs(1);
      });
    });

    describe("Array Operators (ArraySome, ArrayEvery)", () => {
      it("should revert if ArraySome is not used on an Array type", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
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
              paramType: Encoding.Calldata,
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
              paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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

    describe("Allowance Operators (EtherWithinAllowance, CallWithinAllowance)", () => {
      it("should revert if they have children", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.EtherWithinAllowance,
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
          paramType: Encoding.Calldata,
          children: [
            {
              paramType: Encoding.Static, // Invalid
              operator: Operator.EtherWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(mock, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if not nested under a top-level Calldata node (e.g., inside a Tuple)", async () => {
        const { mock, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.EtherWithinAllowance,
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

      it("should pass when correctly nested under a Calldata node", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.EtherWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });
    });

    it("should revert for any unsupported or placeholder operator", async () => {
      const { mock, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator._Placeholder09, // Unsupported
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(mock, "UnsupportedOperator")
        .withArgs(1);
    });
  });

  describe("Type Tree Equivalence", () => {
    it("should revert if children of a logical operator have different, non-variant type trees", async () => {
      const { mock, enforce } = await loadFixture(setup);
      {
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                { paramType: Encoding.Dynamic },
                {
                  paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
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

    it("should pass if children of a logical operator have compatible variant types (Dynamic, Calldata, AbiEncoded)", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic },
              {
                paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Dynamic },
                {
                  paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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

      it("should pass when Array.Matches children are type equivalent variants (Dynamic/Calldata/AbiEncoded)", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Dynamic },
                {
                  paramType: Encoding.Calldata,
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
            paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
        children: [
          // Structural child first
          { paramType: Encoding.Static, operator: Operator.Pass },
          // Non-structural children last
          {
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
            compValue: ZeroHash,
          },
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
        paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
            compValue: ZeroHash,
          },
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
        paramType: Encoding.Calldata,
        children: [
          // Non-structural child first (incorrect)
          {
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
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
        paramType: Encoding.Calldata,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.None,
                operator: Operator.EtherWithinAllowance,
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
        paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              {
                paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
            paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
            paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
        paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
          paramType: Encoding.Calldata,
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
      it("allows Dynamic and Calldata siblings", async () => {
        const { enforce } = await loadFixture(setup);

        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
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
                      paramType: Encoding.Calldata,
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

      // Test 2: Dynamic + AbiEncoded are equivalent
      it("allows Dynamic and AbiEncoded siblings", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
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

      // Test 3: Calldata + AbiEncoded are equivalent
      it("allows Calldata and AbiEncoded siblings", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: Encoding.Calldata,
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
                          paramType: Encoding.Dynamic,
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

      // Test 4: All three types together (Dynamic + Calldata + AbiEncoded)
      it("allows all three equivalent types as siblings", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
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
                      paramType: Encoding.Calldata,
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

      // Test 5: Type equivalence in nested arrays
      it("allows type equivalence within array contexts", async () => {
        const { enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: Encoding.Calldata,
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
                          paramType: Encoding.Calldata,
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
              paramType: Encoding.Calldata,
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
                      paramType: Encoding.Calldata,
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
              paramType: Encoding.Calldata,
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

  describe("Type matching with non-structural children", () => {
    it("allows Array with matching Static children and non-structural WithinRatio", async () => {
      const { enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000,
      });

      // All structural children (Static) match, non-structural WithinRatio should be ignored
      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
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
      await expect(enforce(conditions)).to.not.be.reverted;
    });

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

      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
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

      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
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

      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
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
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("allows And with type-equivalent Dynamic children and non-structural EtherWithinAllowance", async () => {
      const { enforce } = await loadFixture(setup);

      // Type-equivalent structural children, non-structural should be ignored
      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
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
                operator: Operator.EtherWithinAllowance,
                compValue: ZeroHash,
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("rejects Array with non-matching structural children despite non-structural child", async () => {
      const { mock, enforce } = await loadFixture(setup);

      const compValue = encodeWithinRatioCompValue({
        referenceIndex: 0,
        referenceDecimals: 0,
        relativeIndex: 1,
        relativeDecimals: 0,
        minRatio: 0,
        maxRatio: 15000,
      });

      // Mixing Static and Dynamic structural children should still fail
      const conditions = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
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
        paramType: Encoding.Calldata,
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
