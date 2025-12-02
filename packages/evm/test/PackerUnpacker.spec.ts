import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "./utils";
import { ConditionFlatStruct } from "../typechain-types/contracts/Roles";

describe("Packer and Unpacker", () => {
  async function setup() {
    const MockPackerUnpacker =
      await hre.ethers.getContractFactory("MockPackerUnpacker");
    const mock = await MockPackerUnpacker.deploy();
    return { mock };
  }

  describe("Condition round-trip", () => {
    it("should handle a single node (no children)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Pass,
        children: [],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle a simple tree with one child", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle a binary tree (two children)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle a deeper tree (depth 3)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: Encoding.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle a wide tree (many children)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle operators with compValues (EqualTo)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue:
          "0x000000000000000000000000000000000000000000000000000000000000007b",
        children: [],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        hashEqualToCompValues(flatInput),
      );
    });

    it("should handle multiple nodes with compValues", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000000000000000000000000000000000000000007b",
            children: [],
          },
          {
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000064",
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        hashEqualToCompValues(flatInput),
      );
    });

    it("should handle mixed operators (with and without compValues)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000000000000000000000000000000000000000007b",
            children: [],
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        hashEqualToCompValues(flatInput),
      );
    });

    it("should handle a complex nested tree with compValues", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.EqualTo,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000001",
                children: [],
              },
              {
                paramType: Encoding.Static,
                operator: Operator.EqualTo,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000002",
                children: [],
              },
            ],
          },
          {
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000064",
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        hashEqualToCompValues(flatInput),
      );
    });

    it("should handle different AbiTypes", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle deep nesting (depth 5)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
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
                      {
                        paramType: Encoding.Static,
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

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        conditionFieldsOnly(flatInput),
      );
    });

    it("should handle ArraySome operator with nested structure", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.ArraySome,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000000000000000000000000000000000000000007b",
            children: [],
          },
        ],
      });

      const [conditions] = await mock.unpack(await mock.pack(flatInput));
      expect(conditionFieldsOnly(conditions)).to.deep.equal(
        hashEqualToCompValues(flatInput),
      );
    });
  });

  describe("Layout round-trip", () => {
    it("should handle a single node (no children)", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });

      const [, layout] = await mock.unpack(await mock.pack(flatInput));
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.Static, parent: 0 },
      ]);
    });

    it("should handle Calldata normalized to AbiEncoded", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });

      const [, layout] = await mock.unpack(await mock.pack(flatInput));
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0 },
        { encoding: Encoding.Static, parent: 0 },
        { encoding: Encoding.Dynamic, parent: 0 },
      ]);
    });

    it("should handle Tuple with children", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
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

      const [, layout] = await mock.unpack(await mock.pack(flatInput));
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0 },
        { encoding: Encoding.Tuple, parent: 0 },
        { encoding: Encoding.Static, parent: 1 },
        { encoding: Encoding.Dynamic, parent: 1 },
      ]);
    });

    it("should handle Array with children", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
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

      const [, layout] = await mock.unpack(await mock.pack(flatInput));
      // Non-variant array keeps only first child in layout
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0 },
        { encoding: Encoding.Array, parent: 0 },
        { encoding: Encoding.Static, parent: 1 },
      ]);
    });

    it("should handle deep nesting", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
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

      const [, layout] = await mock.unpack(await mock.pack(flatInput));
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0 },
        { encoding: Encoding.Tuple, parent: 0 },
        { encoding: Encoding.Tuple, parent: 1 },
        { encoding: Encoding.Static, parent: 2 },
      ]);
    });

    it("should handle logical operator transparency", async () => {
      const { mock } = await loadFixture(setup);

      const flatInput = flattenCondition({
        paramType: Encoding.Calldata,
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

      const [, layout] = await mock.unpack(await mock.pack(flatInput));
      // Logical Or with homogeneous Static children becomes Static
      expect(layoutFieldsOnly(layout)).to.deep.equal([
        { encoding: Encoding.AbiEncoded, parent: 0 },
        { encoding: Encoding.Static, parent: 0 },
      ]);
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

function layoutFieldsOnly(result: any) {
  return result.map((node: any) => ({
    encoding: Number(node.encoding),
    parent: Number(node.parent),
  }));
}

function hashEqualToCompValues(
  input: {
    parent: number;
    paramType: Encoding;
    operator: Operator;
    compValue: string;
  }[],
): {
  parent: number;
  operator: Operator;
  compValue: string;
}[] {
  return input.map((node) => ({
    parent: node.parent,
    operator: node.operator,
    compValue:
      node.operator === Operator.EqualTo && node.compValue !== "0x"
        ? hre.ethers.keccak256(node.compValue)
        : node.compValue,
  }));
}
