import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Encoding, Operator, flattenCondition } from "../utils";

describe("TypeTree", () => {
  async function setup() {
    const MockTypeTree = await hre.ethers.getContractFactory("MockTypeTree");
    const mockTypeTree = await MockTypeTree.deploy();

    // Helper to inspect and format result for easier assertions
    async function inspect(condition: Parameters<typeof flattenCondition>[0]) {
      const result = await mockTypeTree.inspect(flattenCondition(condition));
      return result.map((r) => ({
        parent: Number(r.parent),
        encoding: Number(r.encoding),
        leadingBytes: Number(r.leadingBytes),
        inlined: r.inlined,
      }));
    }

    // Helper to get ID
    async function getId(condition: Parameters<typeof flattenCondition>[0]) {
      return mockTypeTree["id((uint8,uint8,uint8,bytes)[],uint256)"](
        flattenCondition(condition),
        0,
      );
    }

    return { mockTypeTree, inspect, getId };
  }

  describe("inspect", () => {
    describe("Primitives", () => {
      it("returns the correct layout for leaf nodes (Static)", async () => {
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
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
          const { inspect } = await loadFixture(setup);
          // And -> (Static, Static) => Static
          const result = await inspect({
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
          const { inspect } = await loadFixture(setup);
          // Or -> (Dynamic, Dynamic) => Dynamic
          const result = await inspect({
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
          const { inspect } = await loadFixture(setup);
          const result = await inspect({
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
          const { inspect } = await loadFixture(setup);
          // And -> (Static, Dynamic) => Dynamic(Static, Dynamic)
          const result = await inspect({
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
          const { inspect } = await loadFixture(setup);
          // Or -> (Static, Tuple) => Dynamic(Static, Tuple)
          const result = await inspect({
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
          const { inspect } = await loadFixture(setup);
          // Or -> (Tuple(Static), Tuple(Dynamic)) => Dynamic(...)
          const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        // Array -> (Static, Static) => Array(Static) (length 2 children in result: Array + 1 child)
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        // Array -> (Static, Dynamic) => Array(Static, Dynamic)
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        expect(result[0].inlined).to.be.true;
        expect(result[1].inlined).to.be.true;
      });

      it("marks trees containing Dynamic as not inlined", async () => {
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
        });
        expect(result[0].inlined).to.be.false;
      });

      it("marks trees containing Array as not inlined", async () => {
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        // Tuple -> Tuple -> Dynamic
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        // Tuple -> (Static, None, EtherValue) => Tuple(Static)
        const result = await inspect({
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
        const { inspect } = await loadFixture(setup);
        // Tuple -> (None -> Static, Static) => Tuple(Static, Static)
        // Note: The None wrapper disappears, but its structural child remains
        const result = await inspect({
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
    });
  });

  describe("id", () => {
    it("returns the same hash for structurally identical trees", async () => {
      const { getId } = await loadFixture(setup);
      const tree1 = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      };
      const tree2 = { ...tree1 };
      expect(await getId(tree1)).to.equal(await getId(tree2));
    });

    it("returns different hashes for different encodings", async () => {
      const { getId } = await loadFixture(setup);
      const staticTree = {
        paramType: Encoding.Static,
        operator: Operator.Pass,
      };
      const dynamicTree = {
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      };
      expect(await getId(staticTree)).to.not.equal(await getId(dynamicTree));
    });

    it("returns different hashes for variant vs non-variant structures", async () => {
      const { getId } = await loadFixture(setup);
      // Non-variant And (transparent) -> Static
      const nonVariant = {
        paramType: Encoding.None,
        operator: Operator.And,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      };
      // Variant And -> Dynamic(Static, Dynamic)
      const variant = {
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      };
      expect(await getId(nonVariant)).to.not.equal(await getId(variant));
    });

    it("is sensitive to child order and count", async () => {
      const { getId } = await loadFixture(setup);
      const order1 = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      };
      const order2 = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      };
      expect(await getId(order1)).to.not.equal(await getId(order2));
    });

    it("hashes all children correctly, not just the first or last", async () => {
      const { getId } = await loadFixture(setup);
      // These differ only in the first child (same last child)
      const tree1 = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      };
      const tree2 = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      };
      expect(await getId(tree1)).to.not.equal(await getId(tree2));

      // These differ only in the second child (same first child)
      const tree3 = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      };
      expect(await getId(tree2)).to.not.equal(await getId(tree3));
    });

    it("returns different hashes for different parent encodings with same children", async () => {
      const { getId } = await loadFixture(setup);
      const arrayTree = {
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      };
      const tupleTree = {
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      };
      expect(await getId(arrayTree)).to.not.equal(await getId(tupleTree));
    });
  });
});
