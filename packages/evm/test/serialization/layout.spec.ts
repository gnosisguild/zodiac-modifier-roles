import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "../utils";

interface LayoutNode {
  encoding: number;
  inlined: boolean;
  leadingBytes: number;
  children: LayoutNode[];
}

describe("Layout (Full Pipeline)", () => {
  function toTree(flat: any[]): LayoutNode | null {
    if (flat.length === 0) return null;

    const nodes: LayoutNode[] = flat.map((node: any) => ({
      encoding: Number(node.encoding),
      inlined: node.inlined,
      leadingBytes: Number(node.leadingBytes),
      children: [] as LayoutNode[],
    }));

    flat.forEach((item, i) => {
      const parentIndex = Number(item.parent);
      if (parentIndex !== i) {
        nodes[parentIndex].children!.push(nodes[i]);
      }
    });

    return nodes[0];
  }

  async function setup() {
    const MockPackerUnpacker =
      await hre.ethers.getContractFactory("MockPackerUnpacker");
    const mock = await MockPackerUnpacker.deploy();

    async function getLayout(
      condition: Parameters<typeof flattenCondition>[0],
    ): Promise<LayoutNode | null> {
      const input = flattenCondition(condition);
      const [, result] = await mock.roundtrip(input);
      return toTree(result);
    }

    return { mock, getLayout };
  }

  describe("Atomic Resolution", () => {
    it("Static leaf", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.Static,
        inlined: true,
        leadingBytes: 0,
        children: [],
      });
    });

    it("Dynamic leaf", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.Dynamic,
        inlined: false,
        leadingBytes: 0,
        children: [],
      });
    });

    it("None leaf (non-structural encoding)", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.None,
        inlined: true,
        leadingBytes: 0,
        children: [],
      });
    });
  });

  describe("Normalization & Filtering", () => {
    describe("Single-path reduction", () => {
      it("And(Static) collapses to Static", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Static,
          inlined: true,
          leadingBytes: 0,
          children: [],
        });
      });

      it("Or(Dynamic) collapses to Dynamic", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Dynamic,
          inlined: false,
          leadingBytes: 0,
          children: [],
        });
      });

      it("And -> Or -> And -> Static deep chain collapses to Static", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
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
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Static,
          inlined: true,
          leadingBytes: 0,
          children: [],
        });
      });
    });

    describe("Homogeneous reduction", () => {
      it("And(Static, Static) collapses to single Static", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Static,
          inlined: true,
          leadingBytes: 0,
          children: [],
        });
      });

      it("Or(Dynamic, Dynamic) collapses to single Dynamic", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Dynamic,
          inlined: false,
          leadingBytes: 0,
          children: [],
        });
      });

      it("Or(Tuple(Static), Tuple(Static)) collapses due to deep equivalence", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
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
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        });

        // Or is transparent (non-variant), collapses to Tuple structure
        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Tuple,
              inlined: true,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
          ],
        });
      });

      it("Or(AbiEncoded(Tuple(Static)), AbiEncoded(Tuple(Static, Static))) does not collapse", async () => {
        const { getLayout } = await loadFixture(setup);

        // Both children are AbiEncoded (type equivalence satisfied), but have different internal structure
        const layout = await getLayout({
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
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
                {
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
                  ],
                },
              ],
            },
          ],
        });

        // Or is variant (different nested structures) -> Dynamic wrapper with both children
        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.AbiEncoded,
                  inlined: false,
                  leadingBytes: 4,
                  children: [
                    {
                      encoding: Encoding.Tuple,
                      inlined: true,
                      leadingBytes: 0,
                      children: [
                        {
                          encoding: Encoding.Static,
                          inlined: true,
                          leadingBytes: 0,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  encoding: Encoding.AbiEncoded,
                  inlined: false,
                  leadingBytes: 4,
                  children: [
                    {
                      encoding: Encoding.Tuple,
                      inlined: true,
                      leadingBytes: 0,
                      children: [
                        {
                          encoding: Encoding.Static,
                          inlined: true,
                          leadingBytes: 0,
                          children: [],
                        },
                        {
                          encoding: Encoding.Static,
                          inlined: true,
                          leadingBytes: 0,
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
      });
    });

    describe("Non-structural filtering", () => {
      it("Tuple(Static, And(None/Pass)) -> Tuple + Static only", async () => {
        const { getLayout } = await loadFixture(setup);

        // And with None/Pass child is non-structural (sChildCount=0)
        // Structural children must come first
        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [{ paramType: Encoding.None, operator: Operator.Pass }],
            },
          ],
        });

        // And(None/Pass) is non-structural, filtered from layout
        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: true,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("CallWithinAllowance at leaf filtered out", async () => {
        const { getLayout } = await loadFixture(setup);

        // CallWithinAllowance is non-structural (paramType: None)
        // 32 bytes for allowance key
        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: "0x" + "00".repeat(32),
            },
          ],
        });

        // CallWithinAllowance filtered from layout
        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: true,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("WithinAllowance at leaf is structural (has Static paramType)", async () => {
        const { getLayout } = await loadFixture(setup);

        // WithinAllowance requires Static/EtherValue paramType
        // 32 bytes allowance key
        // Since it has Static paramType, it IS structural and appears in layout
        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(32),
            },
          ],
        });

        // WithinAllowance appears in layout (paramType: Static is structural)
        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: true,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("CallWithinAllowance in middle of tree filtered out", async () => {
        const { getLayout } = await loadFixture(setup);

        // CallWithinAllowance between structural nodes
        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: "0x" + "00".repeat(32),
            },
          ],
        });

        // Only structural children appear in layout
        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("WithinAllowance in middle of tree is structural (has Static paramType)", async () => {
        const { getLayout } = await loadFixture(setup);

        // WithinAllowance between other structural nodes
        // Since it has Static paramType, it IS structural and appears in layout
        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: "0x" + "00".repeat(32),
            },
          ],
        });

        // WithinAllowance appears in layout (paramType: Static is structural)
        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });
    });

    describe("Transparent inside structural", () => {
      it("Tuple(And(Static)) -> Tuple + Static", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
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
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: true,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("AbiEncoded(Or(Dynamic, AbiEncoded(Static))) -> variant Or becomes Dynamic wrapper", async () => {
        const { getLayout } = await loadFixture(setup);

        // Both children resolve to Dynamic/AbiEncoded (type equivalence satisfied)
        const layout = await getLayout({
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

        // variant wrapper
        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Dynamic,
                  inlined: false,
                  leadingBytes: 0,
                  children: [],
                },
                {
                  encoding: Encoding.AbiEncoded,
                  inlined: false,
                  leadingBytes: 4,
                  children: [
                    {
                      encoding: Encoding.Static,
                      inlined: true,
                      leadingBytes: 0,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("Container Semantics", () => {
    describe("Tuples", () => {
      it("Tuple with 3 structural children -> 3 children in order", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("Nested tuples", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
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

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Tuple,
              inlined: true,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
            {
              encoding: Encoding.Tuple,
              inlined: false,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Dynamic,
                  inlined: false,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
          ],
        });
      });
    });

    describe("Arrays", () => {
      it("Template: Array(Static x 5) -> Array + 1 Static template", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        // Non-variant array uses first child as template
        expect(layout).to.deep.equal({
          encoding: Encoding.Array,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("Variant: Array(Dynamic, AbiEncoded(Static)) -> Array + both children", async () => {
        const { getLayout } = await loadFixture(setup);

        // Type equivalence: both resolve to Dynamic/AbiEncoded
        const layout = await getLayout({
          paramType: Encoding.Array,
          operator: Operator.Matches,
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
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Array,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.AbiEncoded,
              inlined: false,
              leadingBytes: 4,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
          ],
        });
      });

      it("Variant via header: Array(AbiEncoded[4], AbiEncoded[8]) -> explicit children", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0004",
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0008",
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        });

        // Different leadingBytes -> variant -> both children in layout
        expect(layout).to.deep.equal({
          encoding: Encoding.Array,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.AbiEncoded,
              inlined: false,
              leadingBytes: 4,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
            {
              encoding: Encoding.AbiEncoded,
              inlined: false,
              leadingBytes: 8,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
          ],
        });
      });
    });

    describe("AbiEncoded", () => {
      it("default leadingBytes (empty compValue) -> 4", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("leadingBytes 0x0000 -> 0", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("leadingBytes 0x0020 -> 32", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0020",
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 32,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("AbiEncoded with child resolution through transparent And", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });
    });
  });

  describe("Variance Detection", () => {
    it("Encoding variance: Or(Dynamic, AbiEncoded) -> Dynamic wrapper", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
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

      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [
          {
            encoding: Encoding.Dynamic,
            inlined: false,
            leadingBytes: 0,
            children: [
              {
                encoding: Encoding.Dynamic,
                inlined: false,
                leadingBytes: 0,
                children: [],
              },
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 4,
                children: [
                  {
                    encoding: Encoding.Static,
                    inlined: true,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("Header variance: Or(AbiEncoded[4], AbiEncoded[8]) -> Dynamic wrapper", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
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
                compValue: "0x0004",
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0008",
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [
          {
            encoding: Encoding.Dynamic,
            inlined: false,
            leadingBytes: 0,
            children: [
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 4,
                children: [
                  {
                    encoding: Encoding.Static,
                    inlined: true,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 8,
                children: [
                  {
                    encoding: Encoding.Static,
                    inlined: true,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("Deep structural variance: Or(AbiEncoded(Static), AbiEncoded(Dynamic))", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
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
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Dynamic, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      // Different child structure -> variant
      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [
          {
            encoding: Encoding.Dynamic,
            inlined: false,
            leadingBytes: 0,
            children: [
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 4,
                children: [
                  {
                    encoding: Encoding.Static,
                    inlined: true,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 4,
                children: [
                  {
                    encoding: Encoding.Dynamic,
                    inlined: false,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("Variant inside container: Tuple(Or(AbiEncoded[4], AbiEncoded[8]))", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0004",
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0008",
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.Dynamic,
            inlined: false,
            leadingBytes: 0,
            children: [
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 4,
                children: [
                  {
                    encoding: Encoding.Static,
                    inlined: true,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 8,
                children: [
                  {
                    encoding: Encoding.Static,
                    inlined: true,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe("Attribute Propagation", () => {
    describe("Inlined rules", () => {
      it("Array never inlined", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Array,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("Tuple inlined iff all children inlined (all Static)", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: true,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("Tuple not inlined if any child not inlined (has Dynamic)", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Dynamic,
              inlined: false,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });
    });

    describe("Deep propagation", () => {
      it("Tuple(Tuple(Static, Dynamic)) -> all ancestors not inlined", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Tuple,
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

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Tuple,
              inlined: false,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
                {
                  encoding: Encoding.Dynamic,
                  inlined: false,
                  leadingBytes: 0,
                  children: [],
                },
              ],
            },
          ],
        });
      });

      it("Tuple(Tuple(Tuple(Static))) -> all inlined", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
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

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: true,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Tuple,
              inlined: true,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Tuple,
                  inlined: true,
                  leadingBytes: 0,
                  children: [
                    {
                      encoding: Encoding.Static,
                      inlined: true,
                      leadingBytes: 0,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it("Tuple(Static, Tuple(Array(Static))) -> root not inlined due to deep Array", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            {
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
            },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.Tuple,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
            {
              encoding: Encoding.Tuple,
              inlined: false,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Array,
                  inlined: false,
                  leadingBytes: 0,
                  children: [
                    {
                      encoding: Encoding.Static,
                      inlined: true,
                      leadingBytes: 0,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe("Golden fixture", () => {
      it("Full-tree assertion with all fields", async () => {
        const { getLayout } = await loadFixture(setup);

        // Complex tree: AbiEncoded[4] -> Tuple(Static, Array(Dynamic), Tuple(Static, Static))
        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0004",
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Matches,
                  children: [
                    { paramType: Encoding.Dynamic, operator: Operator.Pass },
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
            },
          ],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Tuple,
              inlined: false,
              leadingBytes: 0,
              children: [
                {
                  encoding: Encoding.Static,
                  inlined: true,
                  leadingBytes: 0,
                  children: [],
                },
                {
                  encoding: Encoding.Array,
                  inlined: false,
                  leadingBytes: 0,
                  children: [
                    {
                      encoding: Encoding.Dynamic,
                      inlined: false,
                      leadingBytes: 0,
                      children: [],
                    },
                  ],
                },
                {
                  encoding: Encoding.Tuple,
                  inlined: true,
                  leadingBytes: 0,
                  children: [
                    {
                      encoding: Encoding.Static,
                      inlined: true,
                      leadingBytes: 0,
                      children: [],
                    },
                    {
                      encoding: Encoding.Static,
                      inlined: true,
                      leadingBytes: 0,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("Complex Integration", () => {
    it("ABI function call: AbiEncoded[4](Static, Static, Dynamic)", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0004",
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [
          {
            encoding: Encoding.Static,
            inlined: true,
            leadingBytes: 0,
            children: [],
          },
          {
            encoding: Encoding.Static,
            inlined: true,
            leadingBytes: 0,
            children: [],
          },
          {
            encoding: Encoding.Dynamic,
            inlined: false,
            leadingBytes: 0,
            children: [],
          },
        ],
      });
    });

    it("Struct array: Array(Tuple(Static, Array(Dynamic)))", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static, operator: Operator.Pass },
              {
                paramType: Encoding.Array,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Dynamic, operator: Operator.Pass },
                ],
              },
            ],
          },
        ],
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.Tuple,
            inlined: false,
            leadingBytes: 0,
            children: [
              {
                encoding: Encoding.Static,
                inlined: true,
                leadingBytes: 0,
                children: [],
              },
              {
                encoding: Encoding.Array,
                inlined: false,
                leadingBytes: 0,
                children: [
                  {
                    encoding: Encoding.Dynamic,
                    inlined: false,
                    leadingBytes: 0,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("Nested struct: Tuple(Static, Tuple(Static, Dynamic))", async () => {
      const { getLayout } = await loadFixture(setup);

      const layout = await getLayout({
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

      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.Static,
            inlined: true,
            leadingBytes: 0,
            children: [],
          },
          {
            encoding: Encoding.Tuple,
            inlined: false,
            leadingBytes: 0,
            children: [
              {
                encoding: Encoding.Static,
                inlined: true,
                leadingBytes: 0,
                children: [],
              },
              {
                encoding: Encoding.Dynamic,
                inlined: false,
                leadingBytes: 0,
                children: [],
              },
            ],
          },
        ],
      });
    });

    it("Real-world: ERC20 transfer (function + address + uint256)", async () => {
      const { getLayout } = await loadFixture(setup);

      // transfer(address,uint256) -> AbiEncoded[4](Static, Static)
      const layout = await getLayout({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0004",
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass }, // address (as Static)
          { paramType: Encoding.Static, operator: Operator.Pass }, // uint256
        ],
      });

      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [
          {
            encoding: Encoding.Static,
            inlined: true,
            leadingBytes: 0,
            children: [],
          },
          {
            encoding: Encoding.Static,
            inlined: true,
            leadingBytes: 0,
            children: [],
          },
        ],
      });
    });
  });

  describe("Edge Cases", () => {
    describe("Boundary leadingBytes values", () => {
      it("leadingBytes: 0", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 0,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("leadingBytes: 4 (default/function selector)", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0004",
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 4,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });

      it("leadingBytes: 32 (max with match bytes)", async () => {
        const { getLayout } = await loadFixture(setup);

        const layout = await getLayout({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0020",
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        });

        expect(layout).to.deep.equal({
          encoding: Encoding.AbiEncoded,
          inlined: false,
          leadingBytes: 32,
          children: [
            {
              encoding: Encoding.Static,
              inlined: true,
              leadingBytes: 0,
              children: [],
            },
          ],
        });
      });
    });

    describe("Invalid shapes throw", () => {
      it("Or(Static, Dynamic) fails type equivalence", async () => {
        const { mock } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });

        await expect(mock.roundtrip(input)).to.be.revertedWithCustomError(
          mock,
          "UnsuitableChildTypeTree",
        );
      });

      it("Tuple with no structural children fails", async () => {
        const { mock } = await loadFixture(setup);

        // Tuple with only non-structural child (And with None/Pass)
        const input = flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [{ paramType: Encoding.None, operator: Operator.Pass }],
            },
          ],
        });

        await expect(mock.roundtrip(input)).to.be.revertedWithCustomError(
          mock,
          "UnsuitableChildCount",
        );
      });

      it("Array(Static, Dynamic) fails type equivalence", async () => {
        const { mock } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        });

        await expect(mock.roundtrip(input)).to.be.revertedWithCustomError(
          mock,
          "UnsuitableChildTypeTree",
        );
      });
    });
  });
});
