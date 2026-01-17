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

  const staticLeaf = (): LayoutNode => ({
    encoding: Encoding.Static,
    inlined: true,
    leadingBytes: 0,
    children: [],
  });

  const dynamicLeaf = (): LayoutNode => ({
    encoding: Encoding.Dynamic,
    inlined: false,
    leadingBytes: 0,
    children: [],
  });

  const noneLeaf = (): LayoutNode => ({
    encoding: Encoding.None,
    inlined: true,
    leadingBytes: 0,
    children: [],
  });

  const etherValueLeaf = (): LayoutNode => ({
    encoding: Encoding.EtherValue,
    inlined: true,
    leadingBytes: 0,
    children: [],
  });

  describe("Structural Shapes", () => {
    it("Static leaf", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("Dynamic leaf", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });
      expect(layout).to.deep.equal(dynamicLeaf());
    });

    it("EtherValue leaf is non-structural", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.EtherValue,
        operator: Operator.Pass,
      });
      expect(layout).to.equal(null);
    });

    it("AbiEncoded(Static, Static)", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [staticLeaf(), staticLeaf()],
      });
    });

    it("AbiEncoded(Static, Dynamic)", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [staticLeaf(), dynamicLeaf()],
      });
    });

    it("Tuple(Static)", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: true,
        leadingBytes: 0,
        children: [staticLeaf()],
      });
    });

    it("Tuple(Static, Dynamic)", async () => {
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
        children: [staticLeaf(), dynamicLeaf()],
      });
    });

    it("Tuple(Tuple(Static))", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
            children: [staticLeaf()],
          },
        ],
      });
    });

    it("Tuple(Static, Tuple(Dynamic))", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
          },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: false,
        leadingBytes: 0,
        children: [
          staticLeaf(),
          {
            encoding: Encoding.Tuple,
            inlined: false,
            leadingBytes: 0,
            children: [dynamicLeaf()],
          },
        ],
      });
    });

    it("Array(Static)", async () => {
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
        children: [staticLeaf()],
      });
    });

    it("Array(Tuple(Static, Dynamic))", async () => {
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
              { paramType: Encoding.Dynamic, operator: Operator.Pass },
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
            children: [staticLeaf(), dynamicLeaf()],
          },
        ],
      });
    });

    it("Array(Array(Static))", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.Array,
            inlined: false,
            leadingBytes: 0,
            children: [staticLeaf()],
          },
        ],
      });
    });

    it("Tuple(Array(Static))", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.Array,
            inlined: false,
            leadingBytes: 0,
            children: [staticLeaf()],
          },
        ],
      });
    });

    it("Array(Dynamic, AbiEncoded) is variant", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [
          dynamicLeaf(),
          {
            encoding: Encoding.AbiEncoded,
            inlined: false,
            leadingBytes: 4,
            children: [staticLeaf()],
          },
        ],
      });
    });

    it("AbiEncoded leadingBytes default (4)", async () => {
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
        children: [staticLeaf()],
      });
    });

    it("AbiEncoded leadingBytes=0", async () => {
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
        children: [staticLeaf()],
      });
    });

    it("Nested AbiEncoded", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x0000",
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.AbiEncoded,
        inlined: false,
        leadingBytes: 4,
        children: [
          {
            encoding: Encoding.AbiEncoded,
            inlined: false,
            leadingBytes: 0,
            children: [staticLeaf()],
          },
        ],
      });
    });
  });

  describe("Atomic Operators", () => {
    it("Pass on None", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });
      expect(layout).to.equal(null);
    });

    it("EqualTo on Static", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("EqualTo on EtherValue is non-structural", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.EtherValue,
        operator: Operator.EqualTo,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.equal(null);
    });

    it("GreaterThan on Static", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.GreaterThan,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("GreaterThan on EtherValue is non-structural", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.EtherValue,
        operator: Operator.GreaterThan,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.equal(null);
    });

    it("Bitmask on Dynamic", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue: "0x" + "ff".repeat(32) + "00".repeat(32),
      });
      expect(layout).to.deep.equal(dynamicLeaf());
    });

    it("WithinAllowance on Static", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.WithinAllowance,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("WithinAllowance on EtherValue is non-structural", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.EtherValue,
        operator: Operator.WithinAllowance,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.equal(null);
    });

    it("Custom on Static", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.Custom,
        compValue: "0x" + "00".repeat(20),
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("Custom on Tuple", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Tuple,
        operator: Operator.Custom,
        compValue: "0x" + "00".repeat(20),
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: true,
        leadingBytes: 0,
        children: [staticLeaf()],
      });
    });

    it("EqualToAvatar on Static", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Static,
        operator: Operator.EqualToAvatar,
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("Empty is non-structural", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.None,
        operator: Operator.Empty,
      });
      expect(layout).to.equal(null);
    });
  });

  describe("Logical Transparency & Variants", () => {
    it("And(Static, Static) -> transparent", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("And(Static, Dynamic) fails type equivalence", async () => {
      const { mock } = await loadFixture(setup);
      const input = flattenCondition({
        paramType: Encoding.None,
        operator: Operator.And,
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

    it("Or(Dynamic, Dynamic) -> transparent", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.None,
        operator: Operator.Or,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(layout).to.deep.equal(dynamicLeaf());
    });

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

    it("Or(AbiEncoded, AbiEncoded) same structure -> transparent", async () => {
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
                children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
              },
              {
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
            inlined: true,
            leadingBytes: 0,
            children: [staticLeaf()],
          },
        ],
      });
    });

    it("Or(AbiEncoded, AbiEncoded) different structure -> variant", async () => {
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
                  {
                    paramType: Encoding.Tuple,
                    operator: Operator.Matches,
                    children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
                    children: [staticLeaf()],
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
                    children: [staticLeaf(), staticLeaf()],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("And -> Or -> And -> Static deep chain collapses", async () => {
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
                children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
              },
              { paramType: Encoding.Static, operator: Operator.Pass },
            ],
          },
        ],
      });
      expect(layout).to.deep.equal(staticLeaf());
    });

    it("Or(AbiEncoded[4], AbiEncoded[8]) -> variant", async () => {
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
                children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0008",
                children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
                children: [staticLeaf()],
              },
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 8,
                children: [staticLeaf()],
              },
            ],
          },
        ],
      });
    });

    it("Or(Dynamic, AbiEncoded) -> variant", async () => {
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
                children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
              dynamicLeaf(),
              {
                encoding: Encoding.AbiEncoded,
                inlined: false,
                leadingBytes: 4,
                children: [staticLeaf()],
              },
            ],
          },
        ],
      });
    });
  });

  describe("Array Operators", () => {
    it("ArraySome(Static)", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Array,
        operator: Operator.ArraySome,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [staticLeaf()],
      });
    });

    it("ArraySome(Tuple(Static, Dynamic))", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Array,
        operator: Operator.ArraySome,
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
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.Tuple,
            inlined: false,
            leadingBytes: 0,
            children: [staticLeaf(), dynamicLeaf()],
          },
        ],
      });
    });

    it("Matches on Array with many identical elements -> single template", async () => {
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
      expect(layout).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [staticLeaf()],
      });
    });

    it("Matches: Array(AbiEncoded[4], AbiEncoded[8]) -> variant", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x0004",
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
          {
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x0008",
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      expect(layout).to.deep.equal({
        encoding: Encoding.Array,
        inlined: false,
        leadingBytes: 0,
        children: [
          {
            encoding: Encoding.AbiEncoded,
            inlined: false,
            leadingBytes: 4,
            children: [staticLeaf()],
          },
          {
            encoding: Encoding.AbiEncoded,
            inlined: false,
            leadingBytes: 8,
            children: [staticLeaf()],
          },
        ],
      });
    });
  });

  describe("Edge Cases & Integrations", () => {
    it("Tuple(Static, And(None/Pass)) -> non-structural And filtered", async () => {
      const { getLayout } = await loadFixture(setup);
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
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: true,
        leadingBytes: 0,
        children: [staticLeaf()],
      });
    });

    it("CallWithinAllowance at leaf filtered out", async () => {
      const { getLayout } = await loadFixture(setup);
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
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: true,
        leadingBytes: 0,
        children: [staticLeaf()],
      });
    });

    it("WithinAllowance in tuple is structural", async () => {
      const { getLayout } = await loadFixture(setup);
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
      expect(layout).to.deep.equal({
        encoding: Encoding.Tuple,
        inlined: true,
        leadingBytes: 0,
        children: [staticLeaf(), staticLeaf()],
      });
    });

    it("EtherValue with EqualTo is non-structural", async () => {
      const { getLayout } = await loadFixture(setup);
      const layout = await getLayout({
        paramType: Encoding.EtherValue,
        operator: Operator.EqualTo,
        compValue: "0x" + "00".repeat(32),
      });
      expect(layout).to.equal(null);
    });

    it("Tuple with no structural children fails", async () => {
      const { mock } = await loadFixture(setup);
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

    it("Golden fixture: AbiEncoded[4](Tuple(Static, Array(Dynamic), Tuple(Static, Static)))", async () => {
      const { getLayout } = await loadFixture(setup);
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
                children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
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
              staticLeaf(),
              {
                encoding: Encoding.Array,
                inlined: false,
                leadingBytes: 0,
                children: [dynamicLeaf()],
              },
              {
                encoding: Encoding.Tuple,
                inlined: true,
                leadingBytes: 0,
                children: [staticLeaf(), staticLeaf()],
              },
            ],
          },
        ],
      });
    });
  });
});
