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
      it("returns 0 when the node has no children", async () => {
        const { mockTopology } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
          children: [],
        });
        const [childStart] = await mockTopology.childBounds(conditions, 0);
        expect(childStart).to.equal(0);
      });

      it("returns the index of the first direct child", async () => {
        const { mockTopology } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        const [childStart] = await mockTopology.childBounds(conditions, 0);
        expect(childStart).to.equal(1);
      });

      it("correctly identifies the first child even when the parent is not the root (skips siblings)", async () => {
        const { mockTopology } = await loadFixture(setup);
        // Root -> Child1 (Static), Child2 (Tuple -> GrandChild)
        // Flat: Root(0), Child1(1), Child2(2), GrandChild(3)
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Tuple,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        // Check Child2 at index 2. Its child should be at index 3.
        const [childStart] = await mockTopology.childBounds(conditions, 2);
        expect(childStart).to.equal(3);
      });
    });

    describe("childCount", () => {
      it("returns 0 when the node has no children", async () => {
        const { mockTopology } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });
        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(0);
      });

      it("counts the correct number of direct children", async () => {
        const { mockTopology } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        {
          const [, childCount] = await mockTopology.childBounds(conditions, 0);
          expect(childCount).to.equal(3);
        }

        {
          const [, childCount] = await mockTopology.childBounds(conditions, 1);
          expect(childCount).to.equal(0);
        }
      });

      it("does not count grandchildren (only direct children)", async () => {
        const { mockTopology } = await loadFixture(setup);
        // Root -> Child1 -> GrandChild
        const conditions = flattenCondition({
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
        });
        const [, childCount] = await mockTopology.childBounds(conditions, 0);
        expect(childCount).to.equal(1);
      });
    });

    describe("sChildCount (structural child count)", () => {
      it("returns 0 if no children are structural", async () => {
        const { mockTopology } = await loadFixture(setup);
        // Root -> None, None (both leaf)
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [
            { paramType: Encoding.None, operator: Operator.Pass },
            { paramType: Encoding.None, operator: Operator.Pass },
          ],
        });
        const [, , sChildCount] = await mockTopology.childBounds(conditions, 0);
        expect(sChildCount).to.equal(0);
      });

      it("counts a child as structural if the child itself has a structural paramType", async () => {
        const { mockTopology } = await loadFixture(setup);
        // Root -> Static, Dynamic
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });
        const [, , sChildCount] = await mockTopology.childBounds(conditions, 0);
        expect(sChildCount).to.equal(2);
      });

      it("counts a child as structural if it is non-structural but has structural descendants", async () => {
        const { mockTopology } = await loadFixture(setup);
        // Root -> None -> Static
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        const [, , sChildCount] = await mockTopology.childBounds(conditions, 0);
        expect(sChildCount).to.equal(1);
      });

      it("does not count a child if neither it nor its descendants are structural", async () => {
        const { mockTopology } = await loadFixture(setup);
        // Root -> None -> None
        const conditions = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Pass,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Pass,
              children: [{ paramType: Encoding.None, operator: Operator.Pass }],
            },
          ],
        });
        const [, , sChildCount] = await mockTopology.childBounds(conditions, 0);
        expect(sChildCount).to.equal(0);
      });
    });
  });

  describe("isStructural", () => {
    describe("Direct structural checks", () => {
      it("returns true if the node has a structural paramType (e.g., Static, Dynamic, Tuple)", async () => {
        const { mockTopology } = await loadFixture(setup);
        const conditions = flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        });
        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns false if the node has a non-structural paramType (None, EtherValue)", async () => {
        const { mockTopology } = await loadFixture(setup);
        {
          const conditions = flattenCondition({
            paramType: Encoding.None,
            operator: Operator.Pass,
          });
          expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
        }

        {
          const conditions = flattenCondition({
            paramType: Encoding.EtherValue,
            operator: Operator.Pass,
          });
          expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
        }
      });
    });

    describe("Recursive structural checks", () => {
      it("returns true if a non-structural node has a direct structural child", async () => {
        const { mockTopology } = await loadFixture(setup);
        // None -> Static
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Pass,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });
        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns true if a non-structural node has a deep structural descendant", async () => {
        const { mockTopology } = await loadFixture(setup);
        // None -> None -> Static
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Pass,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });
        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });

      it("returns false if a non-structural node has children but none are structural", async () => {
        const { mockTopology } = await loadFixture(setup);
        // None -> None
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Pass,
          children: [{ paramType: Encoding.None, operator: Operator.Pass }],
        });
        expect(await mockTopology.isStructural(conditions, 0)).to.be.false;
      });

      it("handles branching: checks all children, not just the first one", async () => {
        const { mockTopology } = await loadFixture(setup);
        // None -> (None, Static)
        const conditions = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Pass,
          children: [
            { paramType: Encoding.None, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });
        expect(await mockTopology.isStructural(conditions, 0)).to.be.true;
      });
    });
  });
});
