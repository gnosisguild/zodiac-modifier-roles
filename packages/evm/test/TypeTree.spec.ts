import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiType, flattenCondition, Operator } from "./utils";

describe("TypeTree", () => {
  async function setup() {
    const MockTypeTree = await hre.ethers.getContractFactory("MockTypeTree");
    const typeTree = await MockTypeTree.deploy();
    return { typeTree };
  }

  describe("inspect - primitives", () => {
    it("returns Static", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Static,
        operator: Operator.Pass,
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Static,
        children: [],
      });
    });

    it("returns Dynamic", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Dynamic,
        operator: Operator.Pass,
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Dynamic,
        children: [],
      });
    });

    it("returns Tuple with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Tuple,
        children: [
          { _type: AbiType.Static, children: [] },
          { _type: AbiType.Dynamic, children: [] },
        ],
      });
    });

    it("returns Array with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.Pass,
        children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Array,
        children: [{ _type: AbiType.Static, children: [] }],
      });
    });

    it("returns Calldata with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [{ _type: AbiType.Static, children: [] }],
      });
    });

    it("returns AbiEncoded with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.AbiEncoded,
        operator: Operator.Matches,
        children: [{ paramType: AbiType.Dynamic, operator: Operator.Pass }],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.AbiEncoded,
        children: [{ _type: AbiType.Dynamic, children: [] }],
      });
    });
  });

  describe("inspect - logical transparency", () => {
    it("And with homogeneous children returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Static, operator: Operator.Pass },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Static,
        children: [],
      });
    });

    it("Or with homogeneous children returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Dynamic,
        children: [],
      });
    });

    it("And with single child returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [{ paramType: AbiType.Dynamic, operator: Operator.Pass }],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Dynamic,
        children: [],
      });
    });

    it("Or with single child returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Static,
        children: [],
      });
    });
  });

  describe("inspect - logical variant", () => {
    it("And with heterogeneous children wraps in Dynamic variant", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.And,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Dynamic,
        children: [
          { _type: AbiType.Static, children: [] },
          { _type: AbiType.Dynamic, children: [] },
        ],
      });
    });

    it("Or with heterogeneous children wraps in Dynamic variant", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [{ paramType: AbiType.Static }],
          },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Dynamic,
        children: [
          { _type: AbiType.Dynamic, children: [] },
          {
            _type: AbiType.Calldata,
            children: [{ _type: AbiType.Static, children: [] }],
          },
        ],
      });
    });
  });

  describe("inspect - arrays", () => {
    it("non-variant array keeps only first child", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Static, operator: Operator.Pass },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Array,
        children: [{ _type: AbiType.Static, children: [] }],
      });
    });

    it("variant array keeps all children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Array,
        children: [
          { _type: AbiType.Static, children: [] },
          { _type: AbiType.Dynamic, children: [] },
        ],
      });
    });

    it("variant array with nested structures keeps all children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.Pass,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
          },
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [{ paramType: AbiType.Dynamic, operator: Operator.Pass }],
          },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Array,
        children: [
          {
            _type: AbiType.Tuple,
            children: [{ _type: AbiType.Static, children: [] }],
          },
          {
            _type: AbiType.Tuple,
            children: [{ _type: AbiType.Dynamic, children: [] }],
          },
        ],
      });
    });
  });

  describe("inspect - nested structures", () => {
    it("handles nested tuples", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                children: [
                  { paramType: AbiType.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = bfsToTree(out);
      expect(tree._type).to.equal(AbiType.Calldata);
      expect(tree.children[0]._type).to.equal(AbiType.Tuple);
      expect(tree.children[0].children[0]._type).to.equal(AbiType.Tuple);
      expect(tree.children[0].children[0].children[0]._type).to.equal(
        AbiType.Static,
      );
    });

    it("handles nested arrays", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  { paramType: AbiType.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = bfsToTree(out);
      expect(tree._type).to.equal(AbiType.Calldata);
      expect(tree.children[0]._type).to.equal(AbiType.Array);
      expect(tree.children[0].children[0]._type).to.equal(AbiType.Array);
      expect(tree.children[0].children[0].children[0]._type).to.equal(
        AbiType.Static,
      );
    });

    it("handles logical within array", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.ArraySome,
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
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = bfsToTree(out);
      expect(tree.children[0]._type).to.equal(AbiType.Array);
      expect(tree.children[0].children[0]._type).to.equal(AbiType.Static);
    });

    it("handles deep nesting with mixed types", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    operator: Operator.Pass,
                    children: [
                      { paramType: AbiType.Static, operator: Operator.Pass },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = bfsToTree(out);
      expect(tree._type).to.equal(AbiType.Calldata);
      expect(tree.children[0]._type).to.equal(AbiType.Tuple);
      expect(tree.children[0].children[0]._type).to.equal(AbiType.Array);
      expect(tree.children[0].children[0].children[0]._type).to.equal(
        AbiType.Tuple,
      );
    });
  });

  describe("inspect - structural filtering", () => {
    it("excludes non-structural None/WithinRatio/Ether/Call nodes", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
          { paramType: AbiType.None, operator: Operator.WithinRatio },
          { paramType: AbiType.None, operator: Operator.EtherWithinAllowance },
          { paramType: AbiType.None, operator: Operator.CallWithinAllowance },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          { _type: AbiType.Static, children: [] },
          { _type: AbiType.Dynamic, children: [] },
        ],
      });
    });

    it("returns empty children when only non-structural nodes present", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          { paramType: AbiType.None, operator: Operator.EtherWithinAllowance },
          { paramType: AbiType.None, operator: Operator.CallWithinAllowance },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [],
      });
    });
  });

  describe("inspect - edge cases", () => {
    it("unfolds top-level OR with identical entrypoint structures", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Dynamic, operator: Operator.Pass },
            ],
          },
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Dynamic, operator: Operator.Pass },
            ],
          },
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static, operator: Operator.Pass },
              { paramType: AbiType.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          { _type: AbiType.Static, children: [] },
          { _type: AbiType.Dynamic, children: [] },
        ],
      });
    });

    it("handles nested variants (variant within variant)", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Or,
                    children: [
                      { paramType: AbiType.Dynamic, operator: Operator.Pass },
                      {
                        paramType: AbiType.AbiEncoded,
                        operator: Operator.Matches,
                        children: [
                          { paramType: AbiType.Static, operator: Operator.Pass },
                        ],
                      },
                    ],
                  },
                ],
              },
              { paramType: AbiType.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      const output = bfsToTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.Calldata,
                children: [
                  {
                    _type: AbiType.Dynamic,
                    children: [
                      { _type: AbiType.Dynamic, children: [] },
                      {
                        _type: AbiType.AbiEncoded,
                        children: [{ _type: AbiType.Static, children: [] }],
                      },
                    ],
                  },
                ],
              },
              { _type: AbiType.Dynamic, children: [] },
            ],
          },
        ],
      });
    });
  });

  describe("id()", () => {
    it("produces same id for identical structures", async () => {
      const { typeTree } = await loadFixture(setup);
      const input1 = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const input2 = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(await typeTree.id(input1)).to.equal(await typeTree.id(input2));
    });

    it("produces different ids for different types, order, or child count", async () => {
      const { typeTree } = await loadFixture(setup);
      const base = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const differentType = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const differentOrder = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
          { paramType: AbiType.Static, operator: Operator.Pass },
        ],
      });
      const differentCount = flattenCondition({
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
      });
      const idBase = await typeTree.id(base);
      expect(idBase).to.not.equal(await typeTree.id(differentType));
      expect(idBase).to.not.equal(await typeTree.id(differentOrder));
      expect(idBase).to.not.equal(await typeTree.id(differentCount));
    });

    it("variant vs non-variant produce different ids", async () => {
      const { typeTree } = await loadFixture(setup);
      const nonVariantArray = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Static, operator: Operator.Pass },
        ],
      });
      const variantArray = flattenCondition({
        paramType: AbiType.Array,
        operator: Operator.Pass,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      const nonVariantOr = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Static, operator: Operator.Pass },
        ],
      });
      const variantOr = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          { paramType: AbiType.Static, operator: Operator.Pass },
          { paramType: AbiType.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(await typeTree.id(nonVariantArray)).to.not.equal(
        await typeTree.id(variantArray),
      );
      expect(await typeTree.id(nonVariantOr)).to.not.equal(
        await typeTree.id(variantOr),
      );
    });

    it("non-variant logical nodes have same id as child", async () => {
      const { typeTree } = await loadFixture(setup);
      const withAnd = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
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
      const withoutAnd = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [{ paramType: AbiType.Static, operator: Operator.Pass }],
      });
      expect(await typeTree.id(withAnd)).to.equal(
        await typeTree.id(withoutAnd),
      );
    });
  });
});

// Helper to convert BFS flat array to tree structure for complex assertions
interface TreeNode {
  _type: number;
  children: TreeNode[];
}

function bfsToTree(
  bfsArray: { _type: bigint; parent: number | bigint }[],
): TreeNode {
  const nodes = bfsArray.map((item) => ({
    _type: Number(item._type),
    children: [] as TreeNode[],
  }));

  for (let i = 1; i < bfsArray.length; i++) {
    nodes[Number(bfsArray[i].parent)].children.push(nodes[i]);
  }

  return nodes[0];
}
