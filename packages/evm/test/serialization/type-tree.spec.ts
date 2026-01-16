import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Encoding, Operator, flattenCondition } from "../utils";

describe("TypeTree", () => {
  async function setup() {
    const MockTypeTree = await hre.ethers.getContractFactory("MockTypeTree");
    const mockTypeTree = await MockTypeTree.deploy();

    // Helper to resolve and format result for easier assertions
    async function resolve(condition: Parameters<typeof flattenCondition>[0]) {
      const result = await mockTypeTree.resolve(flattenCondition(condition));
      return result.map((r) => ({
        parent: Number(r.parent),
        encoding: Number(r.encoding),
        leadingBytes: Number(r.leadingBytes),
        inlined: r.inlined,
      }));
    }

    return { mockTypeTree, resolve };
  }

  describe("resolve", () => {
    describe("Primitives", () => {
      it("returns the correct layout for leaf nodes (Static)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Static,
            leadingBytes: 0,
            inlined: true,
          },
        ]);
      });

      it("returns the correct layout for leaf nodes (Dynamic)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Dynamic,
            leadingBytes: 0,
            inlined: false,
          },
        ]);
      });
    });

    describe("Logical Nodes (And / Or)", () => {
      describe("Non-variant (Transparent)", () => {
        it("collapses an And node to its child's type if children are identical", async () => {
          const { resolve } = await loadFixture(setup);
          // And -> (Static, Static) => Static
          const result = await resolve({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          });
          expect(result).to.deep.equal([
            {
              parent: 0,
              encoding: Encoding.Static,
              leadingBytes: 0,
              inlined: true,
            },
          ]);
        });

        it("collapses an Or node to its child's type if children are identical", async () => {
          const { resolve } = await loadFixture(setup);
          // Or -> (Dynamic, Dynamic) => Dynamic
          const result = await resolve({
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          });
          expect(result).to.deep.equal([
            {
              parent: 0,
              encoding: Encoding.Dynamic,
              leadingBytes: 0,
              inlined: false,
            },
          ]);
        });

        it("handles single-child logical nodes correctly", async () => {
          const { resolve } = await loadFixture(setup);
          const result = await resolve({
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          });
          expect(result).to.deep.equal([
            {
              parent: 0,
              encoding: Encoding.Static,
              leadingBytes: 0,
              inlined: true,
            },
          ]);
        });
      });

      describe("Variant", () => {
        it("wraps heterogeneous children in a Dynamic variant (And)", async () => {
          const { resolve } = await loadFixture(setup);
          // And -> (Static, Dynamic) => Dynamic(Static, Dynamic)
          const result = await resolve({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          });
          expect(result).to.deep.equal([
            {
              parent: 0,
              encoding: Encoding.Dynamic,
              leadingBytes: 0,
              inlined: false,
            },
            {
              parent: 0,
              encoding: Encoding.Static,
              leadingBytes: 0,
              inlined: true,
            },
            {
              parent: 0,
              encoding: Encoding.Dynamic,
              leadingBytes: 0,
              inlined: false,
            },
          ]);
        });

        it("wraps heterogeneous children in a Dynamic variant (Or)", async () => {
          const { resolve } = await loadFixture(setup);
          // Or -> (Static, Tuple) => Dynamic(Static, Tuple)
          const result = await resolve({
            paramType: Encoding.None,
            operator: Operator.Or,
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
          expect(result[0]).to.deep.include({
            encoding: Encoding.Dynamic,
            inlined: true,
          });
          expect(result).to.have.lengthOf(4); // Root + Static + Tuple + Tuple's child
        });

        it("wraps children that are structurally different even if encodings match (deep diff)", async () => {
          const { resolve } = await loadFixture(setup);
          // Or -> (Tuple(Static), Tuple(Dynamic)) => Dynamic(...)
          const result = await resolve({
            paramType: Encoding.None,
            operator: Operator.Or,
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
          expect(result[0].encoding).to.equal(Encoding.Dynamic);
          expect(result).to.have.lengthOf(5);
        });
      });
    });

    describe("Arrays", () => {
      it("uses the first child as a template for non-variant arrays", async () => {
        const { resolve } = await loadFixture(setup);
        // Array -> (Static, Static) => Array(Static) (length 2 children in result: Array + 1 child)
        const result = await resolve({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Array,
            leadingBytes: 0,
            inlined: false,
          },
          {
            parent: 0,
            encoding: Encoding.Static,
            leadingBytes: 0,
            inlined: true,
          },
        ]);
      });

      it("includes all children for variant arrays (heterogeneous elements)", async () => {
        const { resolve } = await loadFixture(setup);
        // Array -> (Static, Dynamic) => Array(Static, Dynamic)
        const result = await resolve({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Array,
            leadingBytes: 0,
            inlined: false,
          },
          {
            parent: 0,
            encoding: Encoding.Static,
            leadingBytes: 0,
            inlined: true,
          },
          {
            parent: 0,
            encoding: Encoding.Dynamic,
            leadingBytes: 0,
            inlined: false,
          },
        ]);
      });
    });

    describe("AbiEncoded", () => {
      it("extracts leadingBytes from compValue correctly", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x1234ff",
          children: [],
        });
        expect(result[0]).to.deep.include({
          encoding: Encoding.AbiEncoded,
          leadingBytes: 0x1234,
        });
      });

      it("defaults leadingBytes to 4 if compValue is empty", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
          children: [],
        });
        expect(result[0]).to.deep.include({
          encoding: Encoding.AbiEncoded,
          leadingBytes: 4,
        });
      });
    });

    describe("Inlined Flag", () => {
      it("marks purely static trees as inlined", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        expect(result[0].inlined).to.be.true;
        expect(result[1].inlined).to.be.true;
      });

      it("marks trees containing Dynamic as not inlined", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
        });
        expect(result[0].inlined).to.be.false;
      });

      it("marks trees containing Array as not inlined", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        expect(result[0].inlined).to.be.false;
      });

      it("marks trees containing AbiEncoded as not inlined", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [],
            },
          ],
        });
        expect(result[0].inlined).to.be.false;
      });

      it("propagates non-inlined status from deep descendants", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Tuple -> Dynamic
        const result = await resolve({
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
        expect(result[0].inlined).to.be.false; // Root
        expect(result[1].inlined).to.be.false; // Middle tuple
      });
    });

    describe("Structural Filtering", () => {
      it("excludes non-structural nodes (None, EtherValue) from the type tree", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> (Static, None, EtherValue) => Tuple(Static)
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.None, operator: Operator.And, children: [] },
            { paramType: Encoding.EtherValue, operator: Operator.Pass },
          ],
        });
        expect(result).to.have.lengthOf(2); // Tuple + Static
        expect(result[1].encoding).to.equal(Encoding.Static);
      });

      it("correctly handles mixed structural and non-structural siblings", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> (None -> Static, Static) => Tuple(Static, Static)
        // Note: The None wrapper disappears, but its structural child remains
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        expect(result).to.have.lengthOf(3); // Tuple + Static + Static
      });

      it("promotes structural descendants through multiple non-structural layers", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> None -> None -> Static => Tuple(Static)
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
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
        });
        expect(result).to.have.lengthOf(2); // Tuple + Static
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[1].encoding).to.equal(Encoding.Static);
      });

      it("handles purely non-structural children (empty type tree)", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> (None, EtherValue) => Tuple()
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.None, operator: Operator.And, children: [] },
            { paramType: Encoding.EtherValue, operator: Operator.Pass },
          ],
        });
        expect(result).to.have.lengthOf(1); // Just Tuple, no children
        expect(result[0].encoding).to.equal(Encoding.Tuple);
      });
    });

    describe("Tuples", () => {
      it("handles tuple with single child", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Tuple,
            leadingBytes: 0,
            inlined: true,
          },
          {
            parent: 0,
            encoding: Encoding.Static,
            leadingBytes: 0,
            inlined: true,
          },
        ]);
      });

      it("handles tuple with multiple children of same type", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        expect(result).to.have.lengthOf(4); // Tuple + 3 Static
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[1].encoding).to.equal(Encoding.Static);
        expect(result[2].encoding).to.equal(Encoding.Static);
        expect(result[3].encoding).to.equal(Encoding.Static);
      });

      it("handles tuple with mixed child types", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        expect(result).to.have.lengthOf(4);
        expect(result[0].inlined).to.be.false; // Tuple not inlined due to Dynamic
        expect(result[1].encoding).to.equal(Encoding.Static);
        expect(result[2].encoding).to.equal(Encoding.Dynamic);
        expect(result[3].encoding).to.equal(Encoding.Static);
      });

      it("handles nested tuples (2 levels)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
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
        expect(result).to.have.lengthOf(3);
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[1].encoding).to.equal(Encoding.Tuple);
        expect(result[1].parent).to.equal(0);
        expect(result[2].encoding).to.equal(Encoding.Static);
        expect(result[2].parent).to.equal(1);
      });

      it("handles deeply nested tuples (3+ levels)", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Tuple -> Tuple -> Static
        const result = await resolve({
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
        expect(result).to.have.lengthOf(4);
        // All should be inlined since only Static at leaf
        expect(result.every((r) => r.inlined)).to.be.true;
      });

      it("handles tuple with no structural children", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [],
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Tuple,
            leadingBytes: 0,
            inlined: true,
          },
        ]);
      });

      it("handles tuple containing array", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        expect(result).to.have.lengthOf(4); // Tuple + Static + Array + Static
        expect(result[0].inlined).to.be.false; // Not inlined due to Array
        expect(result[2].encoding).to.equal(Encoding.Array);
      });
    });

    describe("Arrays (extended)", () => {
      it("handles array with single element", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        expect(result).to.have.lengthOf(2);
        expect(result[0].encoding).to.equal(Encoding.Array);
        expect(result[1].encoding).to.equal(Encoding.Static);
      });

      it("handles array of tuples (homogeneous)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Array,
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
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Non-variant: only first element used as template
        expect(result).to.have.lengthOf(3); // Array + Tuple + Static
        expect(result[0].encoding).to.equal(Encoding.Array);
        expect(result[1].encoding).to.equal(Encoding.Tuple);
        expect(result[2].encoding).to.equal(Encoding.Static);
      });

      it("handles array of tuples (heterogeneous - variant)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Array,
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
        // Variant: all elements included
        expect(result).to.have.lengthOf(5); // Array + Tuple + Static + Tuple + Dynamic
        expect(result[0].encoding).to.equal(Encoding.Array);
      });

      it("handles nested arrays (2D array)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        expect(result).to.have.lengthOf(3); // Array + Array + Static
        expect(result[0].encoding).to.equal(Encoding.Array);
        expect(result[1].encoding).to.equal(Encoding.Array);
        expect(result[2].encoding).to.equal(Encoding.Static);
      });

      it("detects variant when tuple child counts differ", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Array,
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
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Different child counts = variant
        expect(result.length).to.be.greaterThan(3);
      });

      it("handles many identical elements (collapses to template)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        // All identical -> only template
        expect(result).to.have.lengthOf(2); // Array + Dynamic
      });
    });

    describe("AbiEncoded (extended)", () => {
      it("handles AbiEncoded with children", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0004", // 4 leading bytes
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        expect(result).to.have.lengthOf(3);
        expect(result[0].encoding).to.equal(Encoding.AbiEncoded);
        expect(result[0].leadingBytes).to.equal(4);
        expect(result[1].encoding).to.equal(Encoding.Static);
        expect(result[2].encoding).to.equal(Encoding.Dynamic);
      });

      it("handles AbiEncoded with nested tuple", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000", // 0 leading bytes
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
        expect(result).to.have.lengthOf(3);
        expect(result[0].leadingBytes).to.equal(0);
        expect(result[0].inlined).to.be.false;
      });

      it("handles large leadingBytes value", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0xFFFF", // max uint16
          children: [],
        });
        expect(result[0].leadingBytes).to.equal(0xffff);
      });

      it("detects variance when leadingBytes differ", async () => {
        const { resolve } = await loadFixture(setup);
        // Or -> (AbiEncoded with 4 bytes, AbiEncoded with 8 bytes)
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0004", // 4 leading bytes
              children: [],
            },
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0008", // 8 leading bytes
              children: [],
            },
          ],
        });
        // Should be variant because different leadingBytes means different types
        expect(result[0].encoding).to.equal(Encoding.Dynamic); // Variant wrapper
        expect(result).to.have.lengthOf(3); // Dynamic + AbiEncoded + AbiEncoded
        expect(result[1].encoding).to.equal(Encoding.AbiEncoded);
        expect(result[1].leadingBytes).to.equal(4);
        expect(result[2].encoding).to.equal(Encoding.AbiEncoded);
        expect(result[2].leadingBytes).to.equal(8);
      });

      it("collapses when leadingBytes match", async () => {
        const { resolve } = await loadFixture(setup);
        // Or -> (AbiEncoded with 4 bytes, AbiEncoded with 4 bytes)
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0004",
              children: [],
            },
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0004",
              children: [],
            },
          ],
        });
        // Should collapse since same type (same leadingBytes)
        expect(result).to.have.lengthOf(1);
        expect(result[0].encoding).to.equal(Encoding.AbiEncoded);
        expect(result[0].leadingBytes).to.equal(4);
      });
    });

    describe("Logical Nodes (extended)", () => {
      it("handles logical node inside tuple", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> (And -> Static, Static)
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        // And collapses, so we get Tuple(Static, Static)
        expect(result).to.have.lengthOf(3);
        expect(result[0].encoding).to.equal(Encoding.Tuple);
      });

      it("handles nested logical nodes (And inside Or)", async () => {
        const { resolve } = await loadFixture(setup);
        // Or -> And -> Static
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Both collapse to Static
        expect(result).to.have.lengthOf(1);
        expect(result[0].encoding).to.equal(Encoding.Static);
      });

      it("handles logical node with variant at depth", async () => {
        const { resolve } = await loadFixture(setup);
        // And -> (Tuple(Static), Tuple(Dynamic)) - variant due to deep diff
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.And,
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
        expect(result[0].encoding).to.equal(Encoding.Dynamic); // Variant wrapper
      });

      it("handles Or with three identical branches (non-variant)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        // All same -> collapses to Dynamic
        expect(result).to.have.lengthOf(1);
        expect(result[0].encoding).to.equal(Encoding.Dynamic);
      });

      it("handles Or with three branches where one differs (variant)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        // One differs -> variant
        expect(result[0].encoding).to.equal(Encoding.Dynamic);
        expect(result).to.have.lengthOf(4); // Dynamic wrapper + 3 children
      });
    });

    describe("Deep Nesting", () => {
      it("handles 4-level nesting with mixed types", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Array -> Tuple -> Dynamic
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
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
        expect(result).to.have.lengthOf(4);
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[0].inlined).to.be.false;
        expect(result[1].encoding).to.equal(Encoding.Array);
        expect(result[2].encoding).to.equal(Encoding.Tuple);
        expect(result[3].encoding).to.equal(Encoding.Dynamic);
      });

      it("handles complex tree with multiple branches at each level", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> (Tuple(Static, Static), Tuple(Static, Dynamic))
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
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
        expect(result).to.have.lengthOf(7); // Root + 2 tuples + 4 leaves
        expect(result[0].inlined).to.be.false; // Due to Dynamic in second branch
      });

      it("propagates inlined correctly through deep static-only tree", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Tuple -> Tuple -> Tuple -> Static
        const result = await resolve({
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
            },
          ],
        });
        expect(result).to.have.lengthOf(5);
        // All nodes should be inlined
        expect(result.every((r) => r.inlined)).to.be.true;
      });

      it("handles variant Or inside Array inside Tuple", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Array -> Or(Static, Dynamic)
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Dynamic, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        });
        // Tuple + Array + Dynamic(variant wrapper) + Static + Dynamic
        expect(result).to.have.lengthOf(5);
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[1].encoding).to.equal(Encoding.Array);
        expect(result[2].encoding).to.equal(Encoding.Dynamic); // Variant wrapper
        expect(result[3].encoding).to.equal(Encoding.Static);
        expect(result[4].encoding).to.equal(Encoding.Dynamic);
      });

      it("handles variant at 2D array leaf level", async () => {
        const { resolve } = await loadFixture(setup);
        // Array -> Array -> (Static, Dynamic) - variant inner array
        const result = await resolve({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Array + Array + Static + Dynamic (inner array is variant)
        expect(result).to.have.lengthOf(4);
        expect(result[0].encoding).to.equal(Encoding.Array);
        expect(result[1].encoding).to.equal(Encoding.Array);
        expect(result[2].encoding).to.equal(Encoding.Static);
        expect(result[3].encoding).to.equal(Encoding.Dynamic);
      });

      it("handles variant array inside logical inside tuple", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Or -> Array(Static, Dynamic)
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Matches,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Dynamic, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        });
        // Or collapses (single child), so: Tuple + Array + Static + Dynamic
        expect(result).to.have.lengthOf(4);
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[1].encoding).to.equal(Encoding.Array);
        expect(result[2].encoding).to.equal(Encoding.Static);
        expect(result[3].encoding).to.equal(Encoding.Dynamic);
      });

      it("handles multiple variant nodes at different depths", async () => {
        const { resolve } = await loadFixture(setup);
        // Or(variant) -> (Tuple -> Or(variant), Tuple -> Static)
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Dynamic, operator: Operator.Pass },
                  ],
                },
              ],
            },
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Root Or is variant (children differ: Tuple(Dynamic variant) vs Tuple(Static))
        // Result: Dynamic(wrapper) + Tuple + Dynamic(inner variant) + Static + Dynamic + Tuple + Static
        expect(result[0].encoding).to.equal(Encoding.Dynamic); // Root variant wrapper
        expect(result.length).to.be.greaterThanOrEqual(7);
      });

      it("handles variant Array inside variant Or", async () => {
        const { resolve } = await loadFixture(setup);
        // Or -> (Array(Static, Dynamic), Static)
        const result = await resolve({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
              ],
            },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        // Or is variant (Array vs Static), inner Array is also variant
        // BFS order: Dynamic(wrapper) + Array + Static + Static + Dynamic
        // [0] Dynamic (Or wrapper)
        // [1] Array (Or's first child)
        // [2] Static (Or's second child)
        // [3] Static (Array's first child)
        // [4] Dynamic (Array's second child)
        expect(result).to.have.lengthOf(5);
        expect(result[0].encoding).to.equal(Encoding.Dynamic);
        expect(result[1].encoding).to.equal(Encoding.Array);
        expect(result[2].encoding).to.equal(Encoding.Static);
        expect(result[3].encoding).to.equal(Encoding.Static);
        expect(result[4].encoding).to.equal(Encoding.Dynamic);
      });
    });

    describe("Edge Cases", () => {
      it("handles Tuple encoding on leaf (no children)", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
        });
        expect(result).to.deep.equal([
          {
            parent: 0,
            encoding: Encoding.Tuple,
            leadingBytes: 0,
            inlined: true,
          },
        ]);
      });

      it("correctly assigns parent indices in BFS order", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> (Static, Tuple -> (Static, Static))
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        expect(result).to.have.lengthOf(5);
        expect(result[0].parent).to.equal(0); // Root
        expect(result[1].parent).to.equal(0); // First Static
        expect(result[2].parent).to.equal(0); // Inner Tuple
        expect(result[3].parent).to.equal(2); // Static under inner Tuple
        expect(result[4].parent).to.equal(2); // Static under inner Tuple
      });

      it("handles variant detection at second level", async () => {
        const { resolve } = await loadFixture(setup);
        // Tuple -> Or(Static, Dynamic)
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                { paramType: Encoding.Dynamic, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Or becomes variant Dynamic wrapper
        expect(result).to.have.lengthOf(4); // Tuple + Dynamic + Static + Dynamic
        expect(result[0].encoding).to.equal(Encoding.Tuple);
        expect(result[1].encoding).to.equal(Encoding.Dynamic); // Variant wrapper
      });

      it("handles EtherValue as non-structural sibling", async () => {
        const { resolve } = await loadFixture(setup);
        const result = await resolve({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.EtherValue, operator: Operator.EqualTo },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.EtherValue, operator: Operator.LessThan },
          ],
        });
        // EtherValue nodes filtered out
        expect(result).to.have.lengthOf(2); // Tuple + Static
      });
    });
  });
});
