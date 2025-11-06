import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType, flattenCondition, Operator, BYTES32_ZERO } from "./utils";

describe("ConditionPacker and ConditionUnpacker", () => {
  async function setup() {
    const MockPacker = await hre.ethers.getContractFactory(
      "MockConditionPacker",
    );
    const MockUnpacker = await hre.ethers.getContractFactory(
      "MockConditionUnpacker",
    );

    const packer = await MockPacker.deploy();
    const unpacker = await MockUnpacker.deploy();

    return { packer, unpacker };
  }

  describe("Round-trip packing and unpacking", () => {
    it("should handle a single node (no children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Static,
        operator: Operator.Pass,
        children: [],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a simple tree with one child", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a binary tree (two children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a deeper tree (depth 3)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a wide tree (many children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle operators with compValues (EqualTo)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue:
          "0x000000000000000000000000000000000000000000000000000000000000007b",
        children: [],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(hashEqualToCompValues(input));
    });

    it("should handle multiple nodes with compValues", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000000000000000000000000000000000000000007b",
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.GreaterThan,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000064",
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(hashEqualToCompValues(input));
    });

    it("should handle mixed operators (with and without compValues)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000000000000000000000000000000000000000007b",
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(hashEqualToCompValues(input));
    });

    it("should handle a complex nested tree with compValues", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000001",
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000002",
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.GreaterThan,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000064",
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(hashEqualToCompValues(input));
    });

    it("should handle different AbiTypes", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.AbiEncoded,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle deep nesting (depth 5)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.None,
                operator: Operator.And,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Or,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle ArraySome operator with nested structure", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.ArraySome,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000000000000000000000000000000000000000007b",
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(hashEqualToCompValues(input));
    });

    it("should handle Nor operator", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Nor,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000002",
            children: [],
          },
        ],
      });

      const packed = await packer.pack(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(hashEqualToCompValues(input));
    });
  });
});

/**
 * Converts Result objects from contract calls to plain objects with parent
 */
function pruneResult(result: any): {
  parent: number;
  paramType: AbiType;
  operator: Operator;
  compValue: string;
}[] {
  return result.map((node: any) => ({
    parent: Number(node.parent),
    paramType: Number(node.paramType),
    operator: Number(node.operator),
    compValue: node.compValue,
  }));
}

/**
 * Hashes compValues for EqualTo operators to match ConditionPacker behavior
 */
function hashEqualToCompValues(
  input: {
    parent: number;
    paramType: AbiType;
    operator: Operator;
    compValue: string;
  }[],
): {
  parent: number;
  paramType: AbiType;
  operator: Operator;
  compValue: string;
}[] {
  return input.map((node) => ({
    ...node,
    compValue:
      node.operator === Operator.EqualTo && node.compValue !== "0x"
        ? hre.ethers.keccak256(node.compValue)
        : node.compValue,
  }));
}
