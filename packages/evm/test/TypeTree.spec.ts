import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Encoding, flattenCondition, Operator } from "./utils";

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
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Static,
        inlined: true,
        children: [],
      });
    });

    it("returns Dynamic", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        children: [],
      });
    });

    it("returns Tuple with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: false,
        children: [
          { encoding: Encoding.Static, inlined: true, children: [] },
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
        ],
      });
    });

    it("returns Array with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.Pass,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        children: [{ encoding: Encoding.Static, inlined: true, children: [] }],
      });
    });

    it("returns AbiEncoded with children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        children: [
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
        ],
      });
    });
  });

  describe("inspect - Slice", () => {
    it("Slice wraps Static", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Static,
        operator: Operator.Slice,
        compValue: "0x000020", // shift=0, size=32
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Static,
        inlined: true,
        children: [{ encoding: Encoding.Static, inlined: true, children: [] }],
      });
    });

    it("Slice wraps Dynamic", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Dynamic,
        operator: Operator.Slice,
        compValue: "0x000020", // shift=0, size=32
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        children: [{ encoding: Encoding.Static, inlined: true, children: [] }],
      });
    });
  });

  describe("inspect - logical transparency", () => {
    it("And with homogeneous children returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Static,
        inlined: true,
        children: [],
      });
    });

    it("Or with homogeneous children returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        children: [],
      });
    });

    it("And with single child returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        children: [],
      });
    });

    it("Or with single child returns child layout", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Static,
        inlined: true,
        children: [],
      });
    });
  });

  describe("inspect - logical variant", () => {
    it("And with heterogeneous children wraps in Dynamic variant", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        children: [
          { encoding: Encoding.Static, inlined: true, children: [] },
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
        ],
      });
    });

    it("Or with heterogeneous children wraps in Dynamic variant", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static }],
          },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        children: [
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
          {
            encoding: Encoding.AbiEncoded,
            inlined: false,
            children: [
              { encoding: Encoding.Static, inlined: true, children: [] },
            ],
          },
        ],
      });
    });
  });

  describe("inspect - arrays", () => {
    it("non-variant array keeps only first child", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        children: [{ encoding: Encoding.Static, inlined: true, children: [] }],
      });
    });

    it("variant array keeps all children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        children: [
          { encoding: Encoding.Static, inlined: true, children: [] },
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
        ],
      });
    });

    it("variant array with nested structures keeps all children", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.Pass,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        children: [
          {
            encoding: Encoding.Tuple,
            inlined: true,
            children: [
              { encoding: Encoding.Static, inlined: true, children: [] },
            ],
          },
          {
            encoding: Encoding.Tuple,
            inlined: false,
            children: [
              { encoding: Encoding.Dynamic, inlined: false, children: [] },
            ],
          },
        ],
      });
    });
  });

  describe("inspect - nested structures", () => {
    it("handles nested tuples", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
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
      });
      const out = await typeTree.inspect(input);
      const tree = toTree(out);
      expect(tree.encoding).to.equal(Encoding.AbiEncoded);
      expect(tree.children[0].encoding).to.equal(Encoding.Tuple);
      expect(tree.children[0].children[0].encoding).to.equal(Encoding.Tuple);
      expect(tree.children[0].children[0].children[0].encoding).to.equal(
        Encoding.Static,
      );
    });

    it("handles nested arrays", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Pass,
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = toTree(out);
      expect(tree.encoding).to.equal(Encoding.AbiEncoded);
      expect(tree.children[0].encoding).to.equal(Encoding.Array);
      expect(tree.children[0].children[0].encoding).to.equal(Encoding.Array);
      expect(tree.children[0].children[0].children[0].encoding).to.equal(
        Encoding.Static,
      );
    });

    it("handles logical within array", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
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
                  { paramType: Encoding.Static, operator: Operator.Pass },
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = toTree(out);
      expect(tree.children[0].encoding).to.equal(Encoding.Array);
      expect(tree.children[0].children[0].encoding).to.equal(Encoding.Static);
    });

    it("handles deep nesting with mixed types", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Pass,
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
          },
        ],
      });
      const out = await typeTree.inspect(input);
      const tree = toTree(out);
      expect(tree.encoding).to.equal(Encoding.AbiEncoded);
      expect(tree.children[0].encoding).to.equal(Encoding.Tuple);
      expect(tree.children[0].children[0].encoding).to.equal(Encoding.Array);
      expect(tree.children[0].children[0].children[0].encoding).to.equal(
        Encoding.Tuple,
      );
    });
  });

  describe("inspect - structural filtering", () => {
    it("excludes non-structural None/WithinRatio/Ether/Call nodes", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.None, operator: Operator.WithinRatio },
          {
            paramType: Encoding.EtherValue,
            operator: Operator.GreaterThan,
          },
          { paramType: Encoding.None, operator: Operator.CallWithinAllowance },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        children: [
          { encoding: Encoding.Static, inlined: true, children: [] },
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
        ],
      });
    });

    it("returns empty children when only non-structural nodes present", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.None, operator: Operator.CallWithinAllowance },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        children: [],
      });
    });
  });

  describe("inspect - edge cases", () => {
    it("unfolds top-level OR with identical entrypoint structures", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        children: [
          { encoding: Encoding.Static, inlined: true, children: [] },
          { encoding: Encoding.Dynamic, inlined: false, children: [] },
        ],
      });
    });

    it("handles nested variants (variant within variant)", async () => {
      const { typeTree } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
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
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });
      const output = toTree(await typeTree.inspect(input));
      expect(output).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        children: [
          {
            encoding: Encoding.Dynamic,
            inlined: false,
            children: [
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                children: [
                  {
                    encoding: Encoding.Dynamic,
                    inlined: false,
                    children: [
                      {
                        encoding: Encoding.Dynamic,
                        inlined: false,
                        children: [],
                      },
                      {
                        encoding: Encoding.AbiEncoded,
                        inlined: false,
                        children: [
                          {
                            encoding: Encoding.Static,
                            inlined: true,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              { encoding: Encoding.Dynamic, inlined: false, children: [] },
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
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const input2 = flattenCondition({
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(await typeTree.id(input1)).to.equal(await typeTree.id(input2));
    });

    it("produces different ids for different types, order, or child count", async () => {
      const { typeTree } = await loadFixture(setup);
      const base = flattenCondition({
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const differentType = flattenCondition({
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const differentOrder = flattenCondition({
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      const differentCount = flattenCondition({
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      const idBase = await typeTree.id(base);
      expect(idBase).to.not.equal(await typeTree.id(differentType));
      expect(idBase).to.not.equal(await typeTree.id(differentOrder));
      expect(idBase).to.not.equal(await typeTree.id(differentCount));
    });

    it("variant vs non-variant produce different ids", async () => {
      const { typeTree } = await loadFixture(setup);
      const nonVariantArray = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      const variantArray = flattenCondition({
        paramType: Encoding.Array,
        operator: Operator.Pass,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      const nonVariantOr = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      const variantOr = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
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
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
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
      const withoutAnd = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(await typeTree.id(withAnd)).to.equal(
        await typeTree.id(withoutAnd),
      );
    });
  });

  describe("inlined flag", () => {
    describe("primitives", () => {
      it("Static is inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Static,
          leadingBytes: 0n,
          inlined: true,
        });
      });

      it("Dynamic is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Dynamic,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("Array is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Array,
          operator: Operator.Pass,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Array,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("AbiEncoded is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.AbiEncoded,
          leadingBytes: 4n,
          inlined: false,
        });
      });
    });

    describe("Tuple with direct children", () => {
      it("Tuple(Static, Static) is inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: true,
        });
      });

      it("Tuple(Static, Dynamic) is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("Tuple(Static, Array) is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Array,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });
    });

    describe("nested Tuples", () => {
      it("Tuple(Tuple(Static)) is inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
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
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: true,
        });
      });

      it("Tuple(Tuple(Dynamic)) is not inlined - THE BUG CASE", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("Tuple(Tuple(Tuple(Dynamic))) is not inlined - deep nesting", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
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
                    { paramType: Encoding.Dynamic, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("Tuple(Tuple(Tuple(Static))) is inlined - deep nesting all static", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
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
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: true,
        });
      });
    });

    describe("mixed structures", () => {
      it("Tuple(Static, Tuple(Static)) is inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: true,
        });
      });

      it("Tuple(Static, Tuple(Dynamic)) is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("Tuple(Tuple(Static), Tuple(Dynamic)) is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
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
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });

      it("Tuple(Tuple(Array)) is not inlined", async () => {
        const { typeTree } = await loadFixture(setup);
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pass,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        });
        const [root] = await typeTree.inspect(input);
        expect({
          parent: root.parent,
          encoding: root.encoding,
          leadingBytes: root.leadingBytes,
          inlined: root.inlined,
        }).to.deep.equal({
          parent: 0,
          encoding: Encoding.Tuple,
          leadingBytes: 0n,
          inlined: false,
        });
      });
    });
  });
});

// Helper to convert BFS flat array to tree structure for complex assertions
interface TreeNode {
  encoding: number;
  inlined: boolean;
  children: TreeNode[];
}

function toTree(
  bfsArray: { encoding: bigint; parent: number | bigint; inlined: boolean }[],
): TreeNode {
  const nodes = bfsArray.map((item) => ({
    encoding: Number(item.encoding),
    inlined: item.inlined,
    children: [] as TreeNode[],
  }));

  for (let i = 1; i < bfsArray.length; i++) {
    nodes[Number(bfsArray[i].parent)].children.push(nodes[i]);
  }

  return nodes[0];
}
