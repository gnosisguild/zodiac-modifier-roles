import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType } from "./utils";

describe("TypeTreePacker and TypeTreeUnpacker", () => {
  async function setup() {
    const MockPacker =
      await hre.ethers.getContractFactory("MockTypeTreePacker");
    const MockUnpacker = await hre.ethers.getContractFactory(
      "MockTypeTreeUnpacker",
    );

    const packer = await MockPacker.deploy();
    const unpacker = await MockUnpacker.deploy();

    return { packer, unpacker };
  }

  describe("Round-trip packing and unpacking", () => {
    it("should handle a single node (no children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Static,
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a simple tree with one child", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Tuple,
        children: [
          {
            _type: AbiType.Static,
          },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a binary tree (two children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Tuple,
        children: [
          {
            _type: AbiType.Static,
          },
          {
            _type: AbiType.Dynamic,
          },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a deeper tree (depth 3)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Tuple,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Static,
              },
              {
                _type: AbiType.Dynamic,
              },
            ],
          },
          {
            _type: AbiType.Static,
          },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a wide tree (many children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Tuple,
        children: [
          { _type: AbiType.Static },
          { _type: AbiType.Dynamic },
          { _type: AbiType.Tuple },
          { _type: AbiType.Array },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle Array type with child", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Array,
        children: [
          {
            _type: AbiType.Static,
          },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle different AbiTypes", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Calldata,
        children: [
          { _type: AbiType.None },
          { _type: AbiType.Static },
          { _type: AbiType.Dynamic },
          { _type: AbiType.Tuple },
          { _type: AbiType.Array },
          { _type: AbiType.AbiEncoded },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle deep nesting (depth 5)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Tuple,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Tuple,
                children: [
                  {
                    _type: AbiType.Tuple,
                    children: [
                      {
                        _type: AbiType.Static,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle complex nested structure", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: AbiType.Tuple,
        children: [
          {
            _type: AbiType.Array,
            children: [
              {
                _type: AbiType.Tuple,
                children: [
                  { _type: AbiType.Static },
                  { _type: AbiType.Dynamic },
                ],
              },
            ],
          },
          {
            _type: AbiType.Static,
          },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });
  });
});

function pruneResult(result: any) {
  return result.map((node: any) => ({
    _type: Number(node._type),
    parent: Number(node.parent),
  }));
}

interface TypeTreeInput {
  _type: AbiType;
  children?: TypeTreeInput[];
}
function flattenTypeTree(root: TypeTreeInput) {
  const result = [];
  const queue: { node: TypeTreeInput; parent: number }[] = [
    { node: root, parent: 0 },
  ];
  let queueHead = 0;

  while (queueHead < queue.length) {
    const { node, parent } = queue[queueHead];
    const currentIndex = queueHead;
    queueHead++;

    result.push({
      _type: node._type,
      parent: parent,
    });

    // Add children to queue with current index as their parent
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        queue.push({ node: node.children[i], parent: currentIndex });
      }
    }
  }

  return result;
}
