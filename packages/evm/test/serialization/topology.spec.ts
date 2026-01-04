import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator, flattenCondition } from "../utils";

describe("Topology", () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const mockTopology = await MockTopology.deploy();

    return { mockTopology };
  }

  describe("childBounds", () => {
    describe("childStart", () => {
      it("returns first direct child index when children exist", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root (0) -> Child1 (1), Child2 (2)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        const [childStart] = await mockTopology.childBounds(conditions, 0);
        expect(childStart).to.equal(1);
      });

      it("returns 0 when node has no children", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Single leaf node
        const conditions = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });

        const [childStart, childCount] = await mockTopology.childBounds(
          conditions,
          0,
        );
        expect(childStart).to.equal(0);
        expect(childCount).to.equal(0);
      });

      it("correctly identifies first child among many siblings", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root (0) -> Child1 (1) -> Grandchild (2)
        //          -> Child2 (3)
        // BFS order: Root(0), Child1(1), Child2(2), Grandchild(3)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        // Root's first child should be at index 1
        let [childStart] = await mockTopology.childBounds(conditions, 0);
        expect(childStart).to.equal(1);

        // Child1 (Tuple at index 1) first child should be at index 3
        [childStart] = await mockTopology.childBounds(conditions, 1);
        expect(childStart).to.equal(3);
      });
    });

    describe("childCount", () => {
      it("returns 0 for leaf nodes", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });

        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(0);
      });

      it("returns correct count for single child", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(1);
      });

      it("returns correct count for multiple children", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(3);
      });

      it("counts both structural and non-structural children", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root -> Structural (Static) + Non-structural (None with And)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.None, operator: Operator.And, children: [] },
          ],
        });

        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(2);
      });

      it("only counts direct children, not grandchildren", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root (0) -> Child1 (1) -> Grandchild1 (3), Grandchild2 (4)
        //          -> Child2 (2)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
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
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        // Root should have 2 direct children, not 4
        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(2);
      });
    });

    describe("sChildCount (structural child count)", () => {
      it("returns 0 when no structural children", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root -> Non-structural children (None with no structural descendants)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.None, operator: Operator.And, children: [] },
            { paramType: Encoding.None, operator: Operator.Or, children: [] },
          ],
        });

        const [, , sChildCount] = await mockTopology.childBounds(conditions, 0);
        expect(sChildCount).to.equal(0);
      });

      it("returns correct count for all structural children", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        const [, , sChildCount] = await mockTopology.childBounds(conditions, 0);
        expect(sChildCount).to.equal(3);
      });

      it("correctly excludes non-structural children from count", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root -> Static (structural) + None with no descendants (non-structural)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.None, operator: Operator.And, children: [] },
          ],
        });

        const [, childCount, sChildCount] = await mockTopology.childBounds(
          conditions,
          0,
        );
        expect(childCount).to.equal(2);
        expect(sChildCount).to.equal(1);
      });

      it("handles mixed structural and non-structural children", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root -> Static, None, Dynamic, EtherValue, Tuple
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [],
            },
            { paramType: Encoding.None, operator: Operator.And, children: [] },
            { paramType: Encoding.EtherValue, operator: Operator.Pass },
          ],
        });

        const [, childCount, sChildCount] = await mockTopology.childBounds(
          conditions,
          0,
        );
        expect(childCount).to.equal(5);
        // Static, Dynamic, Tuple are structural. None without descendants and EtherValue are not.
        expect(sChildCount).to.equal(3);
      });
    });

    describe("BFS traversal assumptions", () => {
      it("stops searching when parent index exceeds current index", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Deep structure where later nodes have higher parent indices
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
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

        // Child at index 1 (Tuple) should have 1 child
        const [, childCount] = await mockTopology.childBounds(conditions, 1);
        expect(childCount).to.equal(1);

        // Grandchild at index 2 should have 0 children
        const [, grandchildCount] = await mockTopology.childBounds(
          conditions,
          2,
        );
        expect(grandchildCount).to.equal(0);
      });

      it("correctly handles deeply nested structures", async () => {
        const { mockTopology } = await loadFixture(setup);

        // 4 levels deep
        const conditions = flattenCondition({
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

        // Root (0) -> Tuple (1) -> Tuple (2) -> Static (3)
        let [childStart, childCount] = await mockTopology.childBounds(
          conditions,
          0,
        );
        expect(childStart).to.equal(1);
        expect(childCount).to.equal(1);

        [childStart, childCount] = await mockTopology.childBounds(
          conditions,
          1,
        );
        expect(childStart).to.equal(2);
        expect(childCount).to.equal(1);

        [childStart, childCount] = await mockTopology.childBounds(
          conditions,
          2,
        );
        expect(childStart).to.equal(3);
        expect(childCount).to.equal(1);

        [childStart, childCount] = await mockTopology.childBounds(
          conditions,
          3,
        );
        expect(childStart).to.equal(0);
        expect(childCount).to.equal(0);
      });

      it("handles sibling groups at same level", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root -> 3 siblings each with their own children
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
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
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });

        // BFS: Root(0), Tuple1(1), Tuple2(2), Tuple3(3), Static1(4), Static2(5), Static3(6)
        const [rootStart, rootCount] = await mockTopology.childBounds(
          conditions,
          0,
        );
        expect(rootStart).to.equal(1);
        expect(rootCount).to.equal(3);

        // Each Tuple should have exactly 1 child
        const [t1Start, t1Count] = await mockTopology.childBounds(
          conditions,
          1,
        );
        expect(t1Start).to.equal(4);
        expect(t1Count).to.equal(1);

        const [t2Start, t2Count] = await mockTopology.childBounds(
          conditions,
          2,
        );
        expect(t2Start).to.equal(5);
        expect(t2Count).to.equal(1);

        const [t3Start, t3Count] = await mockTopology.childBounds(
          conditions,
          3,
        );
        expect(t3Start).to.equal(6);
        expect(t3Count).to.equal(1);
      });
    });
  });

  describe("isStructural", () => {
    describe("direct structural nodes", () => {
      it("returns true for Static encoding", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns true for Dynamic encoding", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns true for Tuple encoding", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [],
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns true for Array encoding", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [],
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns true for AbiEncoded encoding", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [],
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });
    });

    describe("non-structural nodes", () => {
      it("returns false for None encoding with no structural descendants", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [],
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
      });

      it("returns false for EtherValue encoding (always leaf)", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: Encoding.EtherValue,
          operator: Operator.Pass,
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
      });
    });

    describe("structural by descent", () => {
      it("returns false when node and all descendants are None", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: "0x",
          },
        ];

        expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
      });

      it("returns true when a deep descendant is structural", async () => {
        const { mockTopology } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];

        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });
    });

    describe("edge cases", () => {
      it("handles deeply nested structural descendants", async () => {
        const { mockTopology } = await loadFixture(setup);

        // 5 levels of None nodes, then a Static
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.None,
                      operator: Operator.And,
                      children: [
                        {
                          paramType: Encoding.None,
                          operator: Operator.And,
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
              ],
            },
          ],
        });

        // All nodes should be structural due to the Static descendant
        for (let i = 0; i < conditions.length; i++) {
          expect(await mockTopology.isStructural(conditions, i)).to.be.true;
        }
      });

      it("correctly stops at sibling boundaries", async () => {
        const { mockTopology } = await loadFixture(setup);

        // Root -> None (no structural), Static
        // BFS: Root(0), None(1), Static(2)
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.None, operator: Operator.And, children: [] },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        // Root is structural (AbiEncoded)
        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;

        // None node should not be structural (Static is sibling, not descendant)
        expect(await mockTopology.isStructural(conditions, 1)).to.be.false;

        // Static is structural
        expect(await mockTopology.isStructural(conditions, 2)).to.be.true;
      });

      it("handles empty children", async () => {
        const { mockTopology } = await loadFixture(setup);

        // None with explicitly empty children
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [],
        });

        expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
      });
    });
  });
});
