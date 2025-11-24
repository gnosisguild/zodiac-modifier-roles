import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding } from "./utils";

describe("LayoutPacker and LayoutUnpacker", () => {
  async function setup() {
    const MockPacker = await hre.ethers.getContractFactory("MockLayoutPacker");
    const MockUnpacker =
      await hre.ethers.getContractFactory("MockLayoutUnpacker");

    const packer = await MockPacker.deploy();
    const unpacker = await MockUnpacker.deploy();

    return { packer, unpacker };
  }

  describe("Round-trip packing and unpacking", () => {
    it("should handle a single node (no children)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: Encoding.Static,
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle a simple tree with one child", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: Encoding.Tuple,
        children: [
          {
            _type: Encoding.Static,
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
        _type: Encoding.Tuple,
        children: [
          {
            _type: Encoding.Static,
          },
          {
            _type: Encoding.Dynamic,
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
        _type: Encoding.Tuple,
        children: [
          {
            _type: Encoding.Tuple,
            children: [
              {
                _type: Encoding.Static,
              },
              {
                _type: Encoding.Dynamic,
              },
            ],
          },
          {
            _type: Encoding.Static,
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
        _type: Encoding.Tuple,
        children: [
          { _type: Encoding.Static },
          { _type: Encoding.Dynamic },
          { _type: Encoding.Tuple },
          { _type: Encoding.Array },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle Array type with child", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: Encoding.Array,
        children: [
          {
            _type: Encoding.Static,
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
        _type: Encoding.Calldata,
        children: [
          { _type: Encoding.None },
          { _type: Encoding.Static },
          { _type: Encoding.Dynamic },
          { _type: Encoding.Tuple },
          { _type: Encoding.Array },
          { _type: Encoding.AbiEncoded },
        ],
      });

      const packed = await packer.packFlat(input);
      const unpacked = await unpacker.unpack(packed);

      expect(pruneResult(unpacked)).to.deep.equal(input);
    });

    it("should handle deep nesting (depth 5)", async () => {
      const { packer, unpacker } = await loadFixture(setup);

      const input = flattenTypeTree({
        _type: Encoding.Tuple,
        children: [
          {
            _type: Encoding.Tuple,
            children: [
              {
                _type: Encoding.Tuple,
                children: [
                  {
                    _type: Encoding.Tuple,
                    children: [
                      {
                        _type: Encoding.Static,
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
        _type: Encoding.Tuple,
        children: [
          {
            _type: Encoding.Array,
            children: [
              {
                _type: Encoding.Tuple,
                children: [
                  { _type: Encoding.Static },
                  { _type: Encoding.Dynamic },
                ],
              },
            ],
          },
          {
            _type: Encoding.Static,
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
  _type: Encoding;
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
