import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Encoding, Operator, flattenCondition } from "../utils";

interface TopologyTree {
  sChildCount: number;
  isVariant: boolean;
  isNotInline: boolean;
  isInLayout: boolean;
  children: TopologyTree[];
}

describe("Topology", () => {
  function toTree(flat: any[]): TopologyTree | null {
    if (flat.length === 0) return null;

    const nodes: TopologyTree[] = flat.map((node: any) => ({
      sChildCount: Number(node.sChildCount),
      isVariant: node.isVariant,
      isNotInline: node.isNotInline,
      isInLayout: node.isInLayout,
      children: [] as TopologyTree[],
    }));

    // Build tree using childStart and childCount
    flat.forEach((item, i) => {
      const childStart = Number(item.childStart);
      const childCount = Number(item.childCount);
      for (let j = 0; j < childCount; j++) {
        nodes[i].children.push(nodes[childStart + j]);
      }
    });

    return nodes[0];
  }

  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const mockTopology = await MockTopology.deploy();

    async function resolve(
      condition: Parameters<typeof flattenCondition>[0],
    ): Promise<TopologyTree | null> {
      const result = await mockTopology.resolve(flattenCondition(condition));
      return toTree(result);
    }

    return { mockTopology, resolve };
  }

  describe("BFS", () => {
    it("reverts if root node is missing or invalid (parent != 0 at index 0)", async () => {
      const { mockTopology } = await loadFixture(setup);

      const invalidConditions = [
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(
        mockTopology.resolve(invalidConditions),
      ).to.be.revertedWithCustomError(mockTopology, "UnsuitableRootNode");
    });

    it("reverts if multiple root nodes are detected", async () => {
      const { mockTopology } = await loadFixture(setup);

      const invalidConditions = [
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(
        mockTopology.resolve(invalidConditions),
      ).to.be.revertedWithCustomError(mockTopology, "UnsuitableRootNode");
    });

    it("reverts if BFS order is violated (parent indices must be non-decreasing)", async () => {
      const { mockTopology } = await loadFixture(setup);

      const invalidConditions = [
        {
          parent: 0,
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(
        mockTopology.resolve(invalidConditions),
      ).to.be.revertedWithCustomError(mockTopology, "NotBFS");
    });

    it("reverts if parent reference is invalid (forward reference)", async () => {
      const { mockTopology } = await loadFixture(setup);

      const invalidConditions = [
        {
          parent: 0,
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(
        mockTopology.resolve(invalidConditions),
      ).to.be.revertedWithCustomError(mockTopology, "NotBFS");
    });
  });

  describe("isNotInline", () => {
    it("is correctly computed for leaf nodes", async () => {
      const { resolve } = await loadFixture(setup);

      // Static is inline
      const staticResult = await resolve({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      expect(staticResult!.isNotInline).to.equal(false);

      // Dynamic is not inline
      const dynamicResult = await resolve({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });
      expect(dynamicResult!.isNotInline).to.equal(true);

      // None is inline
      const noneResult = await resolve({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });
      expect(noneResult!.isNotInline).to.equal(false);
    });

    it("bubbles up from child to parent", async () => {
      const { resolve } = await loadFixture(setup);

      // Tuple with Dynamic child - Tuple becomes not inline
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
      });

      expect(result!.isNotInline).to.equal(true);
      expect(result!.children[0].isNotInline).to.equal(true);
    });

    it("Tuple: all children inline makes container inline", async () => {
      const { resolve } = await loadFixture(setup);

      // Tuple with only Static children - all inline, so Tuple is inline
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isNotInline).to.equal(false);
      expect(result!.children[0].isNotInline).to.equal(false);
      expect(result!.children[1].isNotInline).to.equal(false);
    });

    it("Tuple: one not-inline child makes container not inline", async () => {
      const { resolve } = await loadFixture(setup);

      // Tuple with one Dynamic among Static children
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isNotInline).to.equal(true);
    });

    it("Tuple: not-inline child bubbles up through ancestors", async () => {
      const { resolve } = await loadFixture(setup);

      // Tuple(Static, Tuple(Static, Dynamic)) - outer and inner Tuple both not inline
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
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });

      expect(result!.isNotInline).to.equal(true);
      expect(result!.children[1].isNotInline).to.equal(true);
    });

    it("Array: is always not inline", async () => {
      const { resolve } = await loadFixture(setup);

      // Array with Static children is still not inline
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });

      expect(result!.isNotInline).to.equal(true);
    });

    it("Logical: one not-inline child makes container not inline", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with one Dynamic among Static children
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isNotInline).to.equal(true);
    });

    it("Logical: not-inline child bubbles up through ancestors", async () => {
      const { resolve } = await loadFixture(setup);

      // Or(Static, Tuple(Static, Dynamic)) - Or and Tuple both not inline
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
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });

      expect(result!.isNotInline).to.equal(true);
      expect(result!.children[0].isNotInline).to.equal(false);
      expect(result!.children[1].isNotInline).to.equal(true);
    });

    it("Logical: bubbles up not-inline to Tuple", async () => {
      const { resolve } = await loadFixture(setup);

      // Tuple(Static, Or(Dynamic)) - Or becomes not inline, bubbles to Tuple
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
        ],
      });

      expect(result!.isNotInline).to.equal(true);
      expect(result!.children[0].isNotInline).to.equal(false);
      expect(result!.children[1].isNotInline).to.equal(true);
    });
  });

  describe("isVariant", () => {
    it("Array: is variant when children have different types", async () => {
      const { resolve } = await loadFixture(setup);

      // Array(Static, Dynamic) - different element types
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });

      expect(result!.isVariant).to.equal(true);
    });

    it("Array: is non-variant when all children have matching types", async () => {
      const { resolve } = await loadFixture(setup);

      // Array(Static, Static, Static) - matching element types
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isVariant).to.equal(false);
    });

    it("Logical: is non-variant when children have simple matching type trees", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with matching Static children
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isVariant).to.equal(false);
    });

    it("Logical: is variant when children have simple non-matching type trees", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with mismatched Static and Dynamic children
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });

      expect(result!.isVariant).to.equal(true);
    });

    it("Logical: is non-variant when children have nested matching type trees", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with matching Tuple(Static) children
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });

      expect(result!.isVariant).to.equal(false);
    });

    it("Logical: non-structural nodes do not affect nested matching type trees", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with Tuple(Static, None) vs Tuple(Static) - None is ignored
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.None, operator: Operator.Pass },
            ],
          },
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });

      expect(result!.isVariant).to.equal(false);
    });

    it("Logical: is variant when nested type trees differ several levels deep", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with Tuple(Tuple(Static)) vs Tuple(Tuple(Dynamic))
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
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

      expect(result!.isVariant).to.equal(true);
      expect(result!.children[0].isVariant).to.equal(false);
      expect(result!.children[1].isVariant).to.equal(false);
    });

    it("Logical: And and Or with matching variant structure are compatible", async () => {
      const { resolve } = await loadFixture(setup);

      // And(And(Dynamic, AbiEncoded(Static, Dynamic), EtherValue), Or(Dynamic, AbiEncoded(Static, Dynamic), EtherValue))
      // Both inner logicals are variant (Dynamic != AbiEncoded)
      // But they have matching structure, so outer And is non-variant
      // EtherValue is non-structural and doesn't affect variant detection
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                  { paramType: Encoding.Dynamic, operator: Operator.Pass },
                ],
              },
              { paramType: Encoding.EtherValue, operator: Operator.Pass },
            ],
          },
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
                  { paramType: Encoding.Dynamic, operator: Operator.Pass },
                ],
              },
              { paramType: Encoding.EtherValue, operator: Operator.Pass },
            ],
          },
        ],
      });

      expect(result!.isVariant).to.equal(false);
      expect(result!.children[0].isVariant).to.equal(true);
      expect(result!.children[1].isVariant).to.equal(true);
      // EtherValue is non-structural, so isInLayout = false
      expect(result!.children[0].children[2].isInLayout).to.equal(false);
      expect(result!.children[1].children[2].isInLayout).to.equal(false);
    });

    it("Logical: Tuple containing non-variant Logical resolves to matching type", async () => {
      const { resolve } = await loadFixture(setup);

      // Or over Tuple(Or(Static, Static)) vs Tuple(And(Static))
      // Both inner logicals resolve to Static, so outer Or is non-variant
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
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
          {
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
            ],
          },
        ],
      });

      expect(result!.isVariant).to.equal(false);
    });

    it("Logical: is non-variant when variant children have matching structure", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with two variant children that have matching structure
      // Both are Or(Static, Dynamic), so they're variant but match each other
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
            ],
          },
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

      expect(result!.isVariant).to.equal(false);
      // But the inner children are still variant
      expect(result!.children[0].isVariant).to.equal(true);
      expect(result!.children[1].isVariant).to.equal(true);
    });

    it("Logical: non-variant Arrays with different entry counts have matching types", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with Array(Static, Static, Static) vs Array(Static)
      // Both are non-variant arrays with same element type
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });

      expect(result!.isVariant).to.equal(false);
      expect(result!.children[0].isVariant).to.equal(false);
      expect(result!.children[1].isVariant).to.equal(false);
    });

    it("Logical: AbiEncoded with different leading bytes is variant", async () => {
      const { resolve } = await loadFixture(setup);

      // Or with AbiEncoded(leadingBytes=4) vs AbiEncoded(leadingBytes=0)
      // Different leading bytes means different type hashes
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x0004", // leadingBytes = 4
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x0000", // leadingBytes = 0
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });

      expect(result!.isVariant).to.equal(true);
    });
  });

  describe("isInLayout", () => {
    it("non-structural node has isInLayout false", async () => {
      const { resolve } = await loadFixture(setup);

      const noneResult = await resolve({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });
      expect(noneResult!.isInLayout).to.equal(false);
    });

    it("structural leaf has isInLayout true", async () => {
      const { resolve } = await loadFixture(setup);

      const staticResult = await resolve({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      expect(staticResult!.isInLayout).to.equal(true);

      const dynamicResult = await resolve({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });
      expect(dynamicResult!.isInLayout).to.equal(true);
    });

    it("Tuple: has isInLayout true", async () => {
      const { resolve } = await loadFixture(setup);

      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isInLayout).to.equal(true);
    });

    it("Array: has isInLayout true", async () => {
      const { resolve } = await loadFixture(setup);

      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isInLayout).to.equal(true);
    });

    it("Logical: non-variant has isInLayout false", async () => {
      const { resolve } = await loadFixture(setup);

      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });

      expect(result!.isInLayout).to.equal(false);
      expect(result!.isVariant).to.equal(false);
      // First structural child IS in layout
      expect(result!.children[0].isInLayout).to.equal(true);
      expect(result!.children[0].isVariant).to.equal(false);
      // Second structural child is NOT in layout (same type as first)
      expect(result!.children[1].isInLayout).to.equal(false);
      expect(result!.children[1].isVariant).to.equal(false);
    });

    it("Logical: non-variant excludes descendants of non-first children", async () => {
      const { resolve } = await loadFixture(setup);

      // And (non-variant)
      // ├── Tuple (first structural child - IN layout)
      // │   ├── Static (IN layout)
      // │   └── Static (IN layout)
      // └── Tuple (second structural child - NOT in layout)
      //     ├── Static (NOT in layout - ancestor excluded)
      //     └── Static (NOT in layout - ancestor excluded)
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
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
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
        ],
      });

      expect(result!.isInLayout).to.equal(false);
      expect(result!.isVariant).to.equal(false);

      // First Tuple and its children ARE in layout
      expect(result!.children[0].isInLayout).to.equal(true);
      expect(result!.children[0].children[0].isInLayout).to.equal(true);
      expect(result!.children[0].children[1].isInLayout).to.equal(true);

      // Second Tuple and its children are NOT in layout
      expect(result!.children[1].isInLayout).to.equal(false);
      expect(result!.children[1].children[0].isInLayout).to.equal(false);
      expect(result!.children[1].children[1].isInLayout).to.equal(false);
    });

    it("Logical: non-variant with nested logical excludes deeply", async () => {
      const { resolve } = await loadFixture(setup);

      // Or (non-variant)
      // ├── And (first - IN layout, also non-variant so transparent)
      // │   ├── Static (IN layout - first structural of And)
      // │   └── Static (NOT in layout - second structural of And)
      // └── And (second - NOT in layout)
      //     ├── Static (NOT in layout - ancestor excluded)
      //     └── Static (NOT in layout - ancestor excluded)
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
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

      expect(result!.isInLayout).to.equal(false);
      expect(result!.isVariant).to.equal(false);

      // First And is transparent (non-variant logical)
      expect(result!.children[0].isInLayout).to.equal(false);
      // First And's first child IS in layout
      expect(result!.children[0].children[0].isInLayout).to.equal(true);
      // First And's second child is NOT in layout
      expect(result!.children[0].children[1].isInLayout).to.equal(false);

      // Second And is NOT in layout (excluded by parent Or)
      expect(result!.children[1].isInLayout).to.equal(false);
      // Second And's children are also NOT in layout (ancestor excluded)
      expect(result!.children[1].children[0].isInLayout).to.equal(false);
      expect(result!.children[1].children[1].isInLayout).to.equal(false);
    });

    it("Logical: variant has isInLayout true", async () => {
      const { resolve } = await loadFixture(setup);

      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });

      expect(result!.isInLayout).to.equal(true);
      expect(result!.isVariant).to.equal(true);
    });

    it("ZipSome: has isInLayout false", async () => {
      const { resolve } = await loadFixture(setup);

      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.ZipSome,
        compValue: "0x0001",
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
        ],
      });

      expect(result!.isInLayout).to.equal(false);
    });

    it("ZipSome: children are excluded from layout", async () => {
      const { resolve } = await loadFixture(setup);

      // ZipSome with structural children - they should all be excluded
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.ZipSome,
        compValue: "0x0001",
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Pass,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
        ],
      });

      // ZipSome itself is not in layout
      expect(result!.isInLayout).to.equal(false);
      // ZipSome's structural child (Tuple) is excluded from layout
      expect(result!.children[0].isInLayout).to.equal(false);
      // Tuple's children are also excluded (descendants of excluded node)
      expect(result!.children[0].children[0].isInLayout).to.equal(false);
      expect(result!.children[0].children[1].isInLayout).to.equal(false);
    });

    it("ZipSome: does not contribute sChildCount to parent", async () => {
      const { resolve } = await loadFixture(setup);

      // Tuple containing Static and ZipSome
      // ZipSome should not count as structural child
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          {
            paramType: Encoding.None,
            operator: Operator.ZipSome,
            compValue: "0x0001",
            children: [
              {
                paramType: Encoding.Tuple,
                operator: Operator.Pass,
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      // Tuple has sChildCount = 1 (only Static, not ZipSome)
      expect(result!.sChildCount).to.equal(1);
      // ZipSome has sChildCount = 0 (children excluded)
      expect(result!.children[1].sChildCount).to.equal(0);
    });
  });
});
