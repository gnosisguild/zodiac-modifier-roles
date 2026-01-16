import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "../utils";

describe("ConditionPacker and ConditionUnpacker", () => {
  async function setup() {
    const MockPackerUnpacker =
      await hre.ethers.getContractFactory("MockPackerUnpacker");
    const mock = await MockPackerUnpacker.deploy();
    return { mock };
  }

  describe("Condition round-trip", () => {
    it("single node", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("tree with one child", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
        ],
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("binary tree", async () => {
      const { mock } = await loadFixture(setup);

      // Use homogeneous children to satisfy type equivalence
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("wide tree - many children", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("deep nesting", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.None,
                operator: Operator.And,
                children: [
                  {
                    paramType: Encoding.None,
                    operator: Operator.Or,
                    children: [
                      { paramType: Encoding.Static, operator: Operator.Pass },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("EqualTo with compValue", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue:
          "0x000000000000000000000000000000000000000000000000000000000000007b",
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("EqualTo with compValue >32 bytes hashes to keccak256", async () => {
      const { mock } = await loadFixture(setup);

      // 40 bytes of data (>32)
      const longValue = "0x" + "ab".repeat(40);
      const input = flattenCondition({
        paramType: Encoding.Dynamic,
        operator: Operator.EqualTo,
        compValue: longValue,
      });

      const [conditions] = await mock.roundtrip(input);

      // After round-trip, compValue should be keccak256 hash (32 bytes)
      expect(conditions[0].compValue).to.equal(hre.ethers.keccak256(longValue));
    });

    it("AbiEncoded with match bytes", async () => {
      const { mock } = await loadFixture(setup);

      // compValue: 0x0004 (leadingBytes=4) + deadbeef (match data)
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0004deadbeef",
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });

      const [conditions] = await mock.roundtrip(input);

      // After unpacking, compValue should be just the match bytes (without leadingBytes prefix)
      expect(conditionFieldsOnly(conditions)).to.deep.equal([
        { parent: 0, operator: Operator.Matches, compValue: "0xdeadbeef" },
        { parent: 0, operator: Operator.Pass, compValue: "0x" },
      ]);
    });

    it("AbiEncoded without match bytes", async () => {
      const { mock } = await loadFixture(setup);

      // compValue: 0x0004 (just leadingBytes, no trailing match data)
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0004",
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });

      const [conditions] = await mock.roundtrip(input);

      // When no trailing match data, compValue should be empty
      expect(conditionFieldsOnly(conditions)).to.deep.equal([
        { parent: 0, operator: Operator.Matches, compValue: "0x" },
        { parent: 0, operator: Operator.Pass, compValue: "0x" },
      ]);
    });

    it("Slice operator with compValue", async () => {
      const { mock } = await loadFixture(setup);

      // Slice compValue format: offset (2 bytes) + size (1 byte, 1-32)
      // Slice child must resolve to Static
      const input = flattenCondition({
        paramType: Encoding.Dynamic,
        operator: Operator.Slice,
        compValue: "0x000410", // offset=4, size=16
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("Pluck operator with compValue", async () => {
      const { mock } = await loadFixture(setup);

      // Pluck is a leaf (Static encoding can't have children)
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x00", // pluck index 0
          },
          {
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
        ],
      });

      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });

    it("high compValueOffset (>255) uses both bytes", async () => {
      const { mock } = await loadFixture(setup);

      // Create many children with compValues to push tailOffset beyond 255
      // Each node: 5 bytes, each compValue: 2 + 32 = 34 bytes
      // We need enough nodes so that later compValueOffsets exceed 255
      const children = [];
      for (let i = 0; i < 10; i++) {
        children.push({
          paramType: Encoding.Static,
          operator: Operator.EqualTo,
          compValue: "0x" + i.toString(16).padStart(2, "0").padEnd(64, "0"), // 32-byte value
        });
      }

      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children,
      });

      // Verify: header(3) + condHeader(2) + 11*5(nodes) + compValues
      // tailOffset starts at 5 + 55 = 60
      // After 6 compValues: 60 + 6*(2+32) = 60 + 204 = 264 > 255
      const [conditions] = await mock.roundtrip(input);
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(input),
      );
    });
  });

  describe("Layout round-trip", () => {
    it("single node", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });

      const [, layout] = await mock.roundtrip(input);
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.Static, parent: 0, inlined: true },
      ]);
    });

    it("AbiEncoded with children", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0, inlined: false },
        { encoding: Encoding.Static, parent: 0, inlined: true },
        { encoding: Encoding.Dynamic, parent: 0, inlined: false },
      ]);
    });

    it("Tuple with children", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0, inlined: false },
        { encoding: Encoding.Tuple, parent: 0, inlined: false },
        { encoding: Encoding.Static, parent: 1, inlined: true },
        { encoding: Encoding.Dynamic, parent: 1, inlined: false },
      ]);
    });

    it("Array with children", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      // Non-variant array keeps only first child in layout
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0, inlined: false },
        { encoding: Encoding.Array, parent: 0, inlined: false },
        { encoding: Encoding.Static, parent: 1, inlined: true },
      ]);
    });

    it("deep nesting", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0, inlined: false },
        { encoding: Encoding.Tuple, parent: 0, inlined: true },
        { encoding: Encoding.Tuple, parent: 1, inlined: true },
        { encoding: Encoding.Static, parent: 2, inlined: true },
      ]);
    });

    it("logical operators are transparent", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              {
                paramType: Encoding.Static,
                operator: Operator.GreaterThan,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000001",
              },
            ],
          },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      // Logical Or with homogeneous Static children collapses to Static
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0, inlined: false },
        { encoding: Encoding.Static, parent: 0, inlined: true },
      ]);
    });

    it("preserves inlined flag", async () => {
      const { mock } = await loadFixture(setup);

      // Static types inside Tuple are inlined
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      // Static inside Tuple should have inlined=true
      expect(layout[2].inlined).to.equal(true);
    });

    it("variant Or with heterogeneous children uses Dynamic encoding", async () => {
      const { mock } = await loadFixture(setup);

      // Or with children of different type structures (Dynamic vs AbiEncoded)
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      const [, layout] = await mock.roundtrip(input);
      // Variant Or should have Dynamic encoding and include both children
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0, inlined: false },
        { encoding: Encoding.Dynamic, parent: 0, inlined: false }, // variant marker
        { encoding: Encoding.Dynamic, parent: 1, inlined: false },
        { encoding: Encoding.AbiEncoded, parent: 1, inlined: false },
        { encoding: Encoding.Static, parent: 3, inlined: true },
      ]);
    });
  });

  describe("maxPluckValueCount", () => {
    it("returns 0 when no Pluck operators", async () => {
      const { mock } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });

      const [, , maxPluckValueCount] = await mock.roundtrip(input);
      expect(maxPluckValueCount).to.equal(0);
    });

    it("returns 1 when highest Pluck index is 0", async () => {
      const { mock } = await loadFixture(setup);

      // Pluck is a leaf (Static encoding can't have children)
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x00", // pluck index 0
          },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      const [, , maxPluckValueCount] = await mock.roundtrip(input);
      // When highest pluck index is 0, we still need 1 slot
      expect(maxPluckValueCount).to.equal(1);
    });

    it("returns count for highest index with multiple Pluck operators", async () => {
      const { mock } = await loadFixture(setup);

      // Pluck is a leaf (Static encoding can't have children)
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x00", // pluck index 0
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x05", // pluck index 5
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: "0x02", // pluck index 2
          },
        ],
      });

      const [, , maxPluckValueCount] = await mock.roundtrip(input);
      // Highest index is 5, so count is 6 (indices 0-5)
      expect(maxPluckValueCount).to.equal(6);
    });
  });
});

function conditionFieldsOnly(result: any[]): {
  parent: number;
  operator: Operator;
  compValue: string;
}[] {
  return result.map((node: any) => ({
    parent: Number(node.parent),
    operator: Number(node.operator),
    compValue: node.compValue,
  }));
}

function layoutFieldsOnly(result: any[]) {
  return result.map((node: any) => ({
    encoding: Number(node.encoding),
    parent: Number(node.parent),
    inlined: node.inlined,
  }));
}
