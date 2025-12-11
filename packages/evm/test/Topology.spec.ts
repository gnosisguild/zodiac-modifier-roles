import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "./utils";

describe("Topology Library", () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const topology = await MockTopology.deploy();
    return { topology };
  }

  describe("childBounds()", () => {
    it("returns zeroes when node has no children", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      // Check the Static node at index 1, which has no children
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        1,
      );

      expect(childStart).to.equal(0);
      expect(childCount).to.equal(0);
      expect(sChildCount).to.equal(0);
    });

    it("returns correct first child index", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
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
        ],
      });

      // Check the Tuple node at index 1
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        1,
      );

      expect(childStart).to.equal(2); // First child is at index 2
      expect(childCount).to.equal(2);
      expect(sChildCount).to.equal(2);
    });

    it("counts all children including non-structural", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                children: [],
              },
            ],
          },
        ],
      });

      // Check the Tuple node at index 1
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        1,
      );

      expect(childStart).to.equal(2);
      expect(childCount).to.equal(2); // Both structural and non-structural
      expect(sChildCount).to.equal(1); // Only the Static child
    });

    it("counts only structural children correctly", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
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
              {
                paramType: Encoding.None,
                operator: Operator.EtherWithinAllowance,
                children: [],
              },
              {
                paramType: Encoding.None,
                operator: Operator.CallWithinAllowance,
                children: [],
              },
            ],
          },
        ],
      });

      // Check the Tuple node at index 1
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        1,
      );

      expect(childStart).to.equal(2);
      expect(childCount).to.equal(4);
      expect(sChildCount).to.equal(2); // Only Static and Dynamic are structural
    });

    it("stops scanning when parent index increases", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      // Check the first Tuple at index 1
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        1,
      );

      expect(childStart).to.equal(3); // Child is at index 3 (siblings come first in BFS)
      expect(childCount).to.equal(1); // Should not count the Dynamic sibling at index 2
      expect(sChildCount).to.equal(1);
    });

    it("handles consecutive siblings correctly", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
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
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      // Check the root AbiEncoded node at index 0
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        0,
      );

      expect(childStart).to.equal(1);
      expect(childCount).to.equal(3); // Three direct children
      expect(sChildCount).to.equal(3);
    });

    it("handles deep trees with mixed structural/non-structural nodes", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: Encoding.None,
                operator: Operator.And,
                children: [
                  {
                    paramType: Encoding.None,
                    operator: Operator.WithinRatio,
                    children: [],
                  },
                  {
                    paramType: Encoding.None,
                    operator: Operator.EtherWithinAllowance,
                    children: [],
                  },
                ],
              },
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
          {
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            children: [],
          },
        ],
      });

      // Check the Tuple at index 1
      const [childStart, childCount, sChildCount] = await topology.childBounds(
        conditions,
        1,
      );

      expect(childStart).to.equal(3); // First child after CallWithinAllowance sibling
      expect(childCount).to.equal(3); // Static and And node
      expect(sChildCount).to.equal(2); // Only Static is structural (And subtree is all None)
    });
  });

  describe("isStructural()", () => {
    it("returns true when node has non-None paramType", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      expect(await topology.isStructural(conditions, 0)).to.be.true; // AbiEncoded
      expect(await topology.isStructural(conditions, 1)).to.be.true; // Static
    });

    it("returns false when node and all descendants are non-structural", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                children: [],
              },
              {
                paramType: Encoding.None,
                operator: Operator.EtherWithinAllowance,
                children: [],
              },
              {
                paramType: Encoding.None,
                operator: Operator.CallWithinAllowance,
                children: [],
              },
            ],
          },
        ],
      });

      expect(await topology.isStructural(conditions, 2)).to.be.false; // And node with all None descendants
    });

    it("returns true when any child is structural", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                children: [],
              },
            ],
          },
        ],
      });

      expect(await topology.isStructural(conditions, 1)).to.be.true; // And node with Static child
    });

    it("returns true when any descendant is structural (multi-level)", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
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
      });

      expect(await topology.isStructural(conditions, 1)).to.be.true; // And node
      expect(await topology.isStructural(conditions, 2)).to.be.true; // Or node
    });

    it("stops recursion when parent index increases", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            children: [],
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      // WithinRatio node at index 1 should not check the Static sibling at index 2
      expect(await topology.isStructural(conditions, 1)).to.be.false;
    });

    it("handles leaf nodes correctly", async () => {
      const { topology } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
            children: [],
          },
        ],
      });

      expect(await topology.isStructural(conditions, 1)).to.be.true; // Static leaf
      expect(await topology.isStructural(conditions, 2)).to.be.false; // None leaf
    });
  });
});
