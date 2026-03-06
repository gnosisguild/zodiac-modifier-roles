import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Encoding, Operator, flattenCondition } from "../utils";

describe("PackerUnpacker", () => {
  async function setup() {
    const MockPackerUnpacker =
      await hre.ethers.getContractFactory("MockPackerUnpacker");
    const mock = await MockPackerUnpacker.deploy();

    return { mock };
  }

  describe("roundtrip", () => {
    it("preserves operator", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        }),
      );

      expect(result[0].operator).to.equal(Operator.Pass);
    });

    it("preserves encoding", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        }),
      );

      expect(result[0].encoding).to.equal(Encoding.Static);
    });

    it("preserves compValue", async () => {
      const { mock } = await loadFixture(setup);

      const compValue =
        "0x000000000000000000000000000000000000000000000000000000000000002a";
      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.EqualTo,
          compValue,
        }),
      );

      expect(result[0].compValue).to.equal(compValue);
    });

    it("preserves tree structure with children", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        }),
      );

      expect(result.length).to.equal(3);
      expect(result[0].encoding).to.equal(Encoding.Tuple);
      expect(result[1].parent).to.equal(0);
      expect(result[2].parent).to.equal(0);
    });

    it("preserves nested tree structure", async () => {
      const { mock } = await loadFixture(setup);

      // Tree structure:
      // 0: Tuple (root)
      // ├── 1: Tuple
      // │   └── 3: Static (BFS: children of level 1 come after level 1)
      // └── 2: Static
      const [result] = await mock.roundtrip(
        flattenCondition({
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
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        }),
      );

      expect(result.length).to.equal(4);
      expect(result[0].parent).to.equal(0); // root
      expect(result[1].parent).to.equal(0); // first child of root (Tuple)
      expect(result[2].parent).to.equal(0); // second child of root (Static)
      expect(result[3].parent).to.equal(1); // child of first Tuple
    });

    it("computes size correctly for Static", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Static,
          operator: Operator.Pass,
        }),
      );

      expect(result[0].size).to.equal(32);
    });

    it("computes size correctly for Dynamic", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Dynamic,
          operator: Operator.Pass,
        }),
      );

      expect(result[0].size).to.equal(0);
    });

    it("computes size correctly for Tuple with all Static children", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Static, operator: Operator.Pass },
          ],
        }),
      );

      expect(result[0].size).to.equal(64); // 2 static children * 32
      expect(result[1].size).to.equal(32);
      expect(result[2].size).to.equal(32);
    });

    it("computes size correctly for Tuple with Dynamic child", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Tuple,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Static, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        }),
      );

      expect(result[0].size).to.equal(0); // not inlined due to dynamic child
      expect(result[1].size).to.equal(32);
      expect(result[2].size).to.equal(0);
    });

    it("Array is never inlined", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Array,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        }),
      );

      expect(result[0].size).to.equal(0);
    });

    it("tracks maxPluckValue", async () => {
      const { mock } = await loadFixture(setup);

      const [, maxPluckValue] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Pluck,
              compValue: "0x00",
            },
            {
              paramType: Encoding.Static,
              operator: Operator.Pluck,
              compValue: "0x02",
            },
          ],
        }),
      );

      expect(maxPluckValue).to.equal(3); // max index is 2, so count is 3
    });

    it("handles EqualTo compValue stripping for non-inlined nodes", async () => {
      const { mock } = await loadFixture(setup);

      // Dynamic node at offset - the 32-byte head pointer should be stripped
      const compValue =
        "0x0000000000000000000000000000000000000000000000000000000000000020" + // offset (stripped)
        "0000000000000000000000000000000000000000000000000000000000000005" + // length
        "68656c6c6f000000000000000000000000000000000000000000000000000000"; // "hello"

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.Dynamic,
          operator: Operator.EqualTo,
          compValue,
        }),
      );

      // The first 32 bytes (offset) should be stripped
      expect(result[0].compValue).to.equal(
        "0x" +
          "0000000000000000000000000000000000000000000000000000000000000005" +
          "68656c6c6f000000000000000000000000000000000000000000000000000000",
      );
    });

    it("handles AbiEncoded default leadingBytes", async () => {
      const { mock } = await loadFixture(setup);

      // AbiEncoded without compValue gets default leadingBytes of 4
      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        }),
      );

      // compValue should be empty (leadingBytes is extracted separately)
      expect(result[0].compValue).to.equal("0x");
    });

    it("maps EtherValue to None encoding", async () => {
      const { mock } = await loadFixture(setup);

      const [result] = await mock.roundtrip(
        flattenCondition({
          paramType: Encoding.EtherValue,
          operator: Operator.Pass,
        }),
      );

      // EtherValue (6) maps to None (0) in unpacked condition
      expect(result[0].encoding).to.equal(Encoding.None);
    });
  });
});
