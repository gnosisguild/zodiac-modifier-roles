import { expect } from "chai";
import hre from "hardhat";
import { AbiCoder, ZeroHash } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType, flattenCondition, Operator } from "./utils";
import { ConditionFlatStruct } from "../typechain-types/contracts/PermissionBuilder";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

async function setup() {
  const Integrity = await hre.ethers.getContractFactory("Integrity");
  const integrity = await Integrity.deploy();
  const Mock = await hre.ethers.getContractFactory("MockIntegrity");
  const mock = await Mock.deploy();

  async function enforce(conditionsFlat: ConditionFlatStruct[]) {
    await mock.enforce(conditionsFlat);
  }

  return {
    enforce,
    integrity,
  };
}

describe("Integrity", () => {
  describe("Global Structure Validation", () => {
    it("should revert if the conditions array is empty", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(enforce([])).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableRootNode",
      );
    });

    it("should revert if there is no root node (parent === index)", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          { parent: 1, paramType: 0, operator: 0, compValue: "0x" },
          { parent: 0, paramType: 0, operator: 0, compValue: "0x" },
        ]),
      ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");
    });

    it("should revert if there is more than one root node", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          { parent: 0, paramType: 0, operator: 0, compValue: "0x" },
          { parent: 1, paramType: 0, operator: 0, compValue: "0x" },
        ]),
      ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");
    });

    it("should revert if the root node is not at index 0", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          { parent: 1, paramType: 0, operator: 0, compValue: "0x" },
          { parent: 0, paramType: 0, operator: 0, compValue: "0x" },
        ]),
      ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");
    });

    it("should revert if the nodes are not in BFS (Breadth-First Search) order", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(integrity, "NotBFS");
    });
  });

  describe("Root Node Validation", () => {
    it("should revert if the final resolved root type is not Calldata", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      // This tree resolves to Static, not Calldata
      const conditions = flattenCondition({
        paramType: AbiType.Static,
        operator: Operator.Pass,
      });
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableRootNode",
      );
    });

    it("should pass for a simple, valid Calldata root", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });
  });

  describe("Parent-Child Relationship Rules", () => {
    it("should revert if a node's parent comes after the node itself", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      // This is covered by the root node check (must be at index 0)
      // and the BFS check.
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(integrity, "NotBFS");
    });
  });

  describe("Node-Specific Validation", () => {
    describe("Container Nodes (Tuple, Array, Calldata, AbiEncoded)", () => {
      it("should revert if a Tuple node has no children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Tuple,
              operator: Operator.Matches,
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if a Calldata node has no children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(0);
      });

      it("should revert if an Array node has no children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [{ paramType: AbiType.Array, operator: Operator.Matches }],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should pass with valid children", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: AbiType.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });
    });

    describe("Leaf Nodes (Static, Dynamic)", () => {
      it("should revert if a Static node has children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Static,
              children: [{ paramType: AbiType.Static }],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if a Dynamic node has children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Dynamic,
              children: [{ paramType: AbiType.Static }],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });
    });

    describe("Logical Nodes (AND, OR, NOR)", () => {
      it("should revert if a logical node's paramType is not None", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Static, // Should be None
              operator: Operator.And,
              children: [{ paramType: AbiType.Static }],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if a logical node has a non-empty compValue", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.And,
              compValue: "0x01", // Should be empty
              children: [
                { paramType: AbiType.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if a logical node has no children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [{ paramType: AbiType.None, operator: Operator.And }],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });
    });
  });

  describe("Operator-Specific Validation", () => {
    describe("Comparison Operators (EqualTo, GreaterThan, LessThan, etc.)", () => {
      it("should revert if GreaterThan is used with a non-Static type", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Dynamic, // Invalid
              operator: Operator.GreaterThan,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if EqualTo is used with an invalid type like None", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None, // Invalid
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if GreaterThan has a compValue that is not 32 bytes", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.GreaterThan,
              compValue: "0x1234", // Invalid length
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
          .withArgs(1);
      });

      it("should revert if EqualTo has an empty or non-32-byte-multiple compValue", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: "0x", // Empty
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
          .withArgs(1);

        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: "0x" + "00".repeat(31), // Not multiple of 32
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
          .withArgs(1);
      });
    });

    describe("Array Operators (ArraySome, ArrayEvery, ArraySubset)", () => {
      it("should revert if ArraySome is not used on an Array type", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Tuple, // Invalid
              operator: Operator.ArraySome,
              children: [
                { paramType: AbiType.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if ArraySome does not have exactly one child", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        // No children
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                { paramType: AbiType.Array, operator: Operator.ArraySome },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);

        // More than one child
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.Array,
                  operator: Operator.ArraySome,
                  children: [
                    { paramType: AbiType.Static, operator: Operator.Pass },
                    { paramType: AbiType.Static, operator: Operator.Pass },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if ArraySubset has more than 256 children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.ArraySubset,
              children: Array(257).fill({
                paramType: AbiType.Static,
                operator: Operator.Pass,
              }),
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });
    });

    describe("Allowance Operators (EtherWithinAllowance, CallWithinAllowance)", () => {
      it("should revert if they have children", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.EtherWithinAllowance,
              compValue: ZeroHash,
              children: [
                { paramType: AbiType.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
          .withArgs(1);
      });

      it("should revert if their paramType is not None", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Static, // Invalid
              operator: Operator.EtherWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
          .withArgs(1);
      });

      it("should revert if not nested under a top-level Calldata node (e.g., inside a Tuple)", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(2);
      });

      it("should pass when correctly nested under a Calldata node", async () => {
        const { enforce } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.EtherWithinAllowance,
              compValue: ZeroHash,
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      });
    });

    it("should revert for any unsupported or placeholder operator", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator._Placeholder09, // Unsupported
          },
        ],
      });
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsupportedOperator")
        .withArgs(1);
    });
  });

  describe("Type Tree Equivalence", () => {
    it("should revert if children of a logical operator have different, non-variant type trees", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      {
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.And,
              children: [
                { paramType: AbiType.Static }, // Static
                {
                  paramType: AbiType.Tuple,
                  children: [{ paramType: AbiType.Static }],
                }, // Tuple
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );
      }

      {
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.Or,
              children: [
                { paramType: AbiType.Static }, // Static
                { paramType: AbiType.Dynamic },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );
      }

      {
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.Or,
              children: [
                { paramType: AbiType.Dynamic },
                {
                  paramType: AbiType.Calldata,
                  children: [{ paramType: AbiType.Static }],
                },
                {
                  paramType: AbiType.AbiEncoded,
                  children: [{ paramType: AbiType.Static }],
                },
                { paramType: AbiType.Static },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );
      }
    });

    it("should revert if nested children of a logical operator have different, non-variant type trees  (e.g., Or(Or(T1, T2)))", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      // Or with a single child that is itself an Or containing variants
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.None,
                operator: Operator.Or,
                children: [
                  { paramType: AbiType.Dynamic },
                  { paramType: AbiType.Static },
                ],
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );
    });

    it("should pass if children of a logical operator have identical type trees", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.And,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Static, operator: Operator.Pass },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should pass if children of a logical operator have compatible variant types (Dynamic, Calldata, AbiEncoded)", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.Calldata,
                children: [{ paramType: AbiType.Static }],
              },
              {
                paramType: AbiType.AbiEncoded,
                children: [{ paramType: AbiType.Static }],
              },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("should revert if children of an Array have different type trees", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );
    });

    it("should pass if children of an Array have compatible type trees", async () => {
      const { enforce } = await loadFixture(setup);
      {
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Pass,
              children: [
                { paramType: AbiType.Static },
                { paramType: AbiType.Static },
              ],
            },
          ],
        });
        await expect(enforce(conditions)).to.not.be.reverted;
      }
      {
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Pass,
              children: [
                { paramType: AbiType.Dynamic },
                {
                  paramType: AbiType.Calldata,
                  children: [{ paramType: AbiType.Static }],
                },
                {
                  paramType: AbiType.AbiEncoded,
                  children: [{ paramType: AbiType.Static }],
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
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Matches,
              children: [
                { paramType: AbiType.Static },
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [42]),
                },
                {
                  paramType: AbiType.Static,
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
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Tuple,
                  operator: Operator.Pass,
                  children: [
                    { paramType: AbiType.Static },
                    { paramType: AbiType.Dynamic },
                  ],
                },
                {
                  paramType: AbiType.Tuple,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(
                    ["tuple(uint256,string)"],
                    [[42, "test"]],
                  ),
                  children: [
                    { paramType: AbiType.Static },
                    { paramType: AbiType.Dynamic },
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
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Matches,
              children: [
                { paramType: AbiType.Dynamic },
                {
                  paramType: AbiType.Calldata,
                  operator: Operator.Matches,
                  children: [{ paramType: AbiType.Static }],
                },
                {
                  paramType: AbiType.AbiEncoded,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: AbiType.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: AbiType.Static },
                        { paramType: AbiType.Dynamic },
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
        const { integrity, enforce } = await loadFixture(setup);
        {
          const conditions = flattenCondition({
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.Matches,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Dynamic },
                ],
              },
            ],
          });
          await expect(enforce(conditions))
            .to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree")
            .withArgs(1);
        }
      });
    });
  });

  describe("Valid Complex Structures (Happy Paths)", () => {
    it("should pass for a complex, deeply nested valid structure", async () => {
      const { enforce } = await loadFixture(setup);
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              {
                paramType: AbiType.Array,
                operator: Operator.ArrayEvery,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.GreaterThan,
                        compValue: defaultAbiCoder.encode(["uint256"], [10]),
                      },
                      {
                        paramType: AbiType.Static,
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
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              { paramType: AbiType.Dynamic, operator: Operator.Pass },
              {
                paramType: AbiType.Calldata,
                children: [
                  { paramType: AbiType.Static, operator: Operator.Pass },
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
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("and/or/nor mismatch - order counts", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("and/or/nor mismatch - recursive", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.None,
          operator: Operator.Nor,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );

      conditions[conditions.length - 1].paramType = AbiType.Static;

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("array mismatch", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Pass,
        compValue: "0x",
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            compValue: "0x",
            children: [
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                compValue: "0x",
                children: [
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                ],
              },
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                compValue: "0x",
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    compValue: "0x",
                  },
                  {
                    paramType: AbiType.Static,
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
        integrity,
        "UnsuitableChildTypeTree",
      );

      conditions[4].paramType = AbiType.Static;

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("array mismatch - order counts", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // first element 2
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // second element 3
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );

      // swap
      conditions[6].paramType = AbiType.Dynamic;
      conditions[7].paramType = AbiType.Static;

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("array mismatch - different length", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // first element 2
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        // second element 3
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.not.reverted;

      await expect(
        enforce(conditions.slice(0, -1)),
      ).to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree");
    });
    it("array mismatch - recursive", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.be.revertedWithCustomError(
        integrity,
        "UnsuitableChildTypeTree",
      );

      conditions[conditions.length - 1].paramType = AbiType.Static;
      await expect(enforce(conditions)).to.not.be.reverted;
    });

    it("type variants:", async () => {
      it("allows Dynamic and Calldata siblings", async () => {
        const { enforce } = await loadFixture(setup);

        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: AbiType.Calldata,
                      children: [
                        {
                          paramType: AbiType.Static,
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
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: AbiType.AbiEncoded,
                      children: [
                        {
                          paramType: AbiType.Static,
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
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.Nor,
                  children: [
                    {
                      paramType: AbiType.Calldata,
                      children: [
                        {
                          paramType: AbiType.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                    {
                      paramType: AbiType.AbiEncoded,
                      children: [
                        {
                          paramType: AbiType.Dynamic,
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
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: AbiType.Calldata,
                      children: [
                        {
                          paramType: AbiType.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                    {
                      paramType: AbiType.AbiEncoded,
                      children: [
                        {
                          paramType: AbiType.Tuple,
                          children: [
                            {
                              paramType: AbiType.Static,
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
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.Array,
                  operator: Operator.ArraySome,
                  children: [
                    {
                      paramType: AbiType.None,
                      operator: Operator.Or,
                      children: [
                        {
                          paramType: AbiType.Dynamic,
                          operator: Operator.Pass,
                        },
                        {
                          paramType: AbiType.Calldata,
                          children: [
                            {
                              paramType: AbiType.Static,
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
        const { integrity, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: AbiType.Calldata,
                      children: [
                        {
                          paramType: AbiType.Static,
                          operator: Operator.Pass,
                        },
                      ],
                    },
                    {
                      paramType: AbiType.Static,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree")
          .withArgs(1);
      });

      it("rejects Tuple as sibling in type variant point", async () => {
        const { integrity, enforce } = await loadFixture(setup);
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: AbiType.Tuple,
                      children: [
                        {
                          paramType: AbiType.Static,
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
          .to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree")
          .withArgs(1);
      });
    });
  });
});
