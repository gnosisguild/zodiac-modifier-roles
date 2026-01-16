import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { keccak256, solidityPacked } from "ethers";
import { Encoding, Operator, flattenCondition } from "../utils";

describe("Topology", () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const mockTopology = await MockTopology.deploy();

    async function resolve(condition: Parameters<typeof flattenCondition>[0]) {
      const result = await mockTopology.resolve(flattenCondition(condition));
      return result.map((r) => ({
        childStart: Number(r.childStart),
        childCount: Number(r.childCount),
        sChildCount: Number(r.sChildCount),
        typeHash: r.typeHash,
        isStructural: r.isStructural,
        isVariant: r.isVariant,
      }));
    }

    return { mockTopology, resolve };
  }

  describe("Basic Computation", () => {
    it("computes topology for a single Static leaf", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.include({
        childStart: 0,
        childCount: 0,
        sChildCount: 0,
        isStructural: true,
        isVariant: false,
      });
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      );
    });

    it("computes topology for a single Dynamic leaf", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.include({
        childStart: 0,
        childCount: 0,
        sChildCount: 0,
        isStructural: true,
        isVariant: false,
      });
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      );
    });

    it("computes topology for a None node (non-structural)", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.include({
        childStart: 0,
        childCount: 0,
        sChildCount: 0,
        isStructural: false,
        isVariant: false,
      });
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    });

    it("computes topology for EtherValue (non-structural alias)", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.EtherValue,
        operator: Operator.Pass,
      });
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.include({
        childStart: 0,
        childCount: 0,
        sChildCount: 0,
        isStructural: false,
        isVariant: false,
      });
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    });
  });

  describe("Child Bounds", () => {
    it("correctly identifies childStart and childCount for parent with children", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.include({
        childStart: 1,
        childCount: 2,
        sChildCount: 2,
      });
    });

    it("correctly identifies childStart for single child", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.ArrayEvery,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.deep.include({
        childStart: 1,
        childCount: 1,
        sChildCount: 1,
      });
    });

    it("distinguishes between structural and non-structural children", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.None, operator: Operator.Pass },
        ],
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.include({
        childStart: 1,
        childCount: 2,
        sChildCount: 1,
      });
    });

    it("handles deep nesting with correct child bounds at each level", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      // BFS order: [0: Root, 1: Tuple, 2: Dynamic, 3: Static]
      expect(result).to.have.lengthOf(4);
      expect(result[0]).to.deep.include({
        childStart: 1,
        childCount: 2,
        sChildCount: 2,
      });
      expect(result[1]).to.deep.include({
        childStart: 3,
        childCount: 1,
        sChildCount: 1,
      });
    });
  });

  describe("Structural Detection", () => {
    it("marks Static as structural", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      expect(result[0].isStructural).to.be.true;
    });

    it("marks Dynamic as structural", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Dynamic,
        operator: Operator.Pass,
      });
      expect(result[0].isStructural).to.be.true;
    });

    it("marks Tuple as structural", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(result[0].isStructural).to.be.true;
    });

    it("marks Array as structural", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.ArrayEvery,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(result[0].isStructural).to.be.true;
    });

    it("marks None as non-structural when it has no structural children", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });
      expect(result[0].isStructural).to.be.false;
    });

    it("propagates structural flag upward from children", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(result[0].isStructural).to.be.true;
      expect(result[1].isStructural).to.be.true;
    });

    it("propagates structural flag through multiple levels", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
          },
        ],
      });
      // All three nodes should be structural due to propagation
      expect(result[0].isStructural).to.be.true;
      expect(result[1].isStructural).to.be.true;
      expect(result[2].isStructural).to.be.true;
    });
  });

  describe("Variance Detection", () => {
    it("marks non-variant when all structural children have same typeHash", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      expect(result[0].isVariant).to.be.false;
    });

    it("marks variant when structural children have different typeHashes", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(result[0].isVariant).to.be.true;
    });

    it("marks variant for Array with heterogeneous children", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      expect(result[0].isVariant).to.be.true;
    });

    it("marks non-variant for Array with homogeneous children", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Array,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      expect(result[0].isVariant).to.be.false;
    });

    it("ignores non-structural children when detecting variance", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.None, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      // None child is non-structural, so only Static children are compared
      expect(result[0].isVariant).to.be.false;
    });
  });

  describe("Type Hash Computation", () => {
    it("computes typeHash = bytes32(encoding) for leaf nodes", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Static,
        operator: Operator.Pass,
      });
      // Static = 1
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      );
    });

    it("computes typeHash = 0 for None/EtherValue nodes", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.Pass,
      });
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    });

    it("transparent nodes inherit first structural child typeHash", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      // And node (None encoding) inherits typeHash from Static child
      expect(result[0].typeHash).to.equal(result[1].typeHash);
    });

    it("variant nodes get typeHash = bytes32(Encoding.Dynamic)", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      });
      // Variant node should have Dynamic typeHash
      expect(result[0].typeHash).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      );
    });

    it("compose nodes hash encoding + children typeHashes", async () => {
      const { resolve } = await loadFixture(setup);
      // Test with homogeneous children to avoid variant behavior
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      // Tuple(Static, Static) should compose hash
      const staticHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const tupleBase =
        "0x0000000000000000000000000000000000000000000000000000000000000003";
      const firstCompose = keccak256(
        solidityPacked(["bytes32", "bytes32"], [tupleBase, staticHash]),
      );
      const expectedHash = keccak256(
        solidityPacked(["bytes32", "bytes32"], [firstCompose, staticHash]),
      );
      expect(result[0].typeHash).to.equal(expectedHash);
    });

    it("computes typeHash with leadingBytes for AbiEncoded", async () => {
      const { resolve } = await loadFixture(setup);
      // AbiEncoded with default 4 bytes leading
      const result = await resolve({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      // Base hash includes leadingBytes: (4 << 8) | 5 (AbiEncoded encoding)
      const leadingBytes = 4;
      const abiEncodedBase =
        (BigInt(leadingBytes) << 8n) | BigInt(Encoding.AbiEncoded);
      const baseHash = "0x" + abiEncodedBase.toString(16).padStart(64, "0");
      const staticHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const expectedHash = keccak256(
        solidityPacked(["bytes32", "bytes32"], [baseHash, staticHash]),
      );
      expect(result[0].typeHash).to.equal(expectedHash);
    });
  });

  describe("Deep Nesting", () => {
    it("handles 3-level nesting correctly", async () => {
      const { resolve } = await loadFixture(setup);
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
      // All should be structural
      expect(result.every((r) => r.isStructural)).to.be.true;
      // None should be variant
      expect(result.every((r) => !r.isVariant)).to.be.true;
    });

    it("handles mixed types in deep nesting", async () => {
      const { resolve } = await loadFixture(setup);
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
                  { paramType: Encoding.Static, operator: Operator.Pass },
                  { paramType: Encoding.Dynamic, operator: Operator.Pass },
                ],
              },
            ],
          },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      // BFS: [Tuple, Array, Static, Tuple, Static, Dynamic]
      expect(result).to.have.lengthOf(6);
      expect(result.every((r) => r.isStructural)).to.be.true;
    });

    it("propagates variance through logical nodes in deep nesting", async () => {
      const { resolve } = await loadFixture(setup);
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
      // The Or node should be variant
      expect(result[1].isVariant).to.be.true;
    });
  });

  describe("Edge Cases", () => {
    it("handles single child correctly", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      });
      expect(result[0]).to.deep.include({
        childCount: 1,
        sChildCount: 1,
        isVariant: false,
      });
    });

    it("handles many children correctly", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Static, operator: Operator.Pass },
        ],
      });
      expect(result[0]).to.deep.include({
        childCount: 5,
        sChildCount: 5,
        isVariant: false,
      });
    });

    it("maintains BFS ordering in parent indices", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
      // BFS: [0: Root, 1: Tuple1, 2: Tuple2, 3: Static, 4: Dynamic]
      expect(result).to.have.lengthOf(5);
      // Root's children start at 1
      expect(result[0].childStart).to.equal(1);
      // Tuple1's child starts at 3
      expect(result[1].childStart).to.equal(3);
      // Tuple2's child starts at 4
      expect(result[2].childStart).to.equal(4);
    });

    it("correctly handles variant detection at second level", async () => {
      const { resolve } = await loadFixture(setup);
      const result = await resolve({
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
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
      // Root should be variant because children have different type trees
      expect(result[0].isVariant).to.be.true;
    });
  });
});
