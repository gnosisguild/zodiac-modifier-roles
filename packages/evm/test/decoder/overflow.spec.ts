/**
 * AbiDecoder Security & Bounds Tests
 *
 * Tests overflow detection and bounds validation in AbiDecoder.sol.
 * Focuses on malformed/truncated calldata handling to ensure the decoder
 * correctly flags invalid input rather than reading garbage or reverting.
 *
 * Test Zones:
 *   1. Head Bounds    - Validates head region has enough bytes for static/pointer slots
 *   2. Tail Bounds    - Validates tail region has enough bytes for dynamic content
 *   3. Pointer Valid  - Detects backward/self-referential/overflow pointers
 *   4. Cascade        - Verifies overflow propagates from children to parents
 *   5. AbiEncoded     - Tests nested encoded payloads with leadingBytes
 *   6. Edge Cases     - Empty arrays/tuples, large lengths, root size correctness
 *
 * Note: Some bounds checks in _locationInBlock are defense-in-depth and overlap
 * with checks in _walk. Both layers are tested but mutations to one may survive
 * if the other catches the same issue.
 */
import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, flattenCondition, Operator } from "../utils";

describe("AbiDecoder - Security & Bounds", () => {
  async function setup() {
    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return { decoder };
  }

  // ZONE 1: The Head
  // Covers: _walk (Static) and basic data availability
  describe("Head Bounds", () => {
    it("flags overflow when calldata < 32 bytes (static type)", async () => {
      const { decoder } = await loadFixture(setup);

      // 4-byte selector + only 31 bytes (need 32)
      const data = "0xaabbccdd" + "00".repeat(31);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
      expect(result.children.length).to.equal(0);
    });

    it("flags overflow when head pointer slot is truncated", async () => {
      const { decoder } = await loadFixture(setup);

      // 4-byte selector + only 31 bytes for the pointer slot
      const data = "0xaabbccdd" + "00".repeat(31);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
      expect(result.children.length).to.equal(0);
    });

    it("accepts exactly 32 bytes for single static param", async () => {
      const { decoder } = await loadFixture(setup);

      // 4-byte selector + exactly 32 bytes
      const data = "0xaabbccdd" + "00".repeat(32);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(false);
      expect(result.children.length).to.equal(1);
    });

    it("flags overflow for inline element when head truncated", async () => {
      const { decoder } = await loadFixture(setup);

      // Two static params in tuple, but data truncated mid-second param
      // selector (4) + 32 bytes (first param) + 16 bytes (partial second)
      const data = "0xaabbccdd" + "00".repeat(48);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Tuple,
            children: [
              { paramType: Encoding.Static },
              { paramType: Encoding.Static },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("flags overflow when second dynamic pointer slot truncated", async () => {
      const { decoder } = await loadFixture(setup);

      // Two dynamic params, but only provide partial second pointer slot
      // selector (4) + first pointer (32) + partial second pointer (16) = 52 bytes
      const data = "0xaabbccdd" + "00".repeat(48);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Dynamic },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });
  });

  // ZONE 2: The Tail
  // Covers: _locationInBlock (Pointer resolution) and _walk (Dynamic)
  describe("Tail Bounds", () => {
    it("flags overflow when offset exceeds calldata length", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer claiming offset 0x40 (64), but only 32 bytes after selector
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000040";

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("flags overflow when declared length exceeds remaining bytes", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer (0x20) + length (claims 64 bytes) + only 32 bytes of data
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset = 32
        "0000000000000000000000000000000000000000000000000000000000000040" + // length = 64
        "00".repeat(32); // only 32 bytes

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("flags overflow when ceil32(length) exceeds bounds", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer (0x20) + length (33 -> ceil32 = 64) + only 32 bytes
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset = 32
        "0000000000000000000000000000000000000000000000000000000000000021" + // length = 33, ceil32 = 64
        "00".repeat(32); // only 32 bytes (need 64 for padding)

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("accepts data with exact padding alignment", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer (0x20) + length (32) + exactly 32 bytes
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset = 32
        "0000000000000000000000000000000000000000000000000000000000000020" + // length = 32
        "00".repeat(32); // exactly 32 bytes

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(false);
      expect(result.children.length).to.equal(1);
    });

    it("flags overflow when tail pointer has partial slot", async () => {
      const { decoder } = await loadFixture(setup);

      // offset=32 points to valid location, but only 16 bytes exist there (need 32)
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset = 32
        "00".repeat(16); // only 16 bytes at tail, need 32 for length word

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });
  });

  // ZONE 3: Pointer Integrity
  // Covers: _locationInBlock security checks
  describe("Pointer Validation", () => {
    it("flags overflow on backward pointer (tail < head)", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + two dynamic params, second pointer points backward
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000040" + // first ptr = 64
        "0000000000000000000000000000000000000000000000000000000000000020" + // second ptr = 32 (backward!)
        "0000000000000000000000000000000000000000000000000000000000000001" + // length = 1
        "aa00000000000000000000000000000000000000000000000000000000000000" + // data
        "0000000000000000000000000000000000000000000000000000000000000001" + // length = 1
        "bb00000000000000000000000000000000000000000000000000000000000000"; // data

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Dynamic },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("flags overflow on self-referential pointer (tail == head)", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer pointing to itself (offset = 0)
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000000" + // offset = 0 (self-ref)
        "00".repeat(64); // padding

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("reverts on arithmetic wrap (MAX_UINT offset)", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer with MAX_UINT offset
      // Note: This causes arithmetic overflow in Solidity's checked math
      // The decoder reverts rather than returning overflow=true
      const data =
        "0xaabbccdd" +
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; // offset = 2^256 - 1

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      await expect(decoder.inspectFlat(data, conditions)).to.be.reverted;
    });

    it("accepts minimal forward pointer (tail == head + 32)", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer (0x20 = 32) + length + data
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset = 32 (minimal forward)
        "0000000000000000000000000000000000000000000000000000000000000001" + // length = 1
        "aa00000000000000000000000000000000000000000000000000000000000000"; // data

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(false);
      expect(result.children.length).to.equal(1);
    });
  });

  // ZONE 4: Structural Propagation
  // Covers: __block__ (Tuples/Arrays) and _variant (Or/And)
  describe("Cascade Semantics", () => {
    it("Tuple: overflow on any child propagates to parent", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + two static params, but only provide first
      const data = "0xaabbccdd" + "00".repeat(32); // only 32 bytes, need 64

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Tuple,
            children: [
              { paramType: Encoding.Static },
              { paramType: Encoding.Static },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("Array: overflow on Nth element fails entire array", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer + length=3 + only 2 elements
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset
        "0000000000000000000000000000000000000000000000000000000000000003" + // length = 3
        "00".repeat(64); // only 2 elements worth

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Array,
            children: [{ paramType: Encoding.Static }],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("Variant (OR): succeeds if ANY branch succeeds", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer + length=32 + 32 bytes data (single uint256)
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset
        "0000000000000000000000000000000000000000000000000000000000000020" + // length = 32
        "00".repeat(32); // 32 bytes

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              // Branch 1: AbiEncoded expecting 2 params (will overflow - only 1 param)
              {
                paramType: Encoding.AbiEncoded,
                compValue: "0x0000", // no selector
                children: [
                  { paramType: Encoding.Static },
                  { paramType: Encoding.Static },
                ],
              },
              // Branch 2: AbiEncoded expecting 1 param (will succeed)
              {
                paramType: Encoding.AbiEncoded,
                compValue: "0x0000", // no selector
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(false);
      const variant = result.children[0];
      expect(variant.variant).to.equal(true);
      expect(variant.children.length).to.equal(2);
      expect(variant.children[0].overflow).to.equal(true); // 2-param branch overflows
      expect(variant.children[1].overflow).to.equal(false); // 1-param branch OK
    });

    it("Variant (OR): overflows only if ALL branches overflow", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer + length=0 + no data (empty bytes)
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset
        "0000000000000000000000000000000000000000000000000000000000000000"; // length = 0

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              // Branch 1: AbiEncoded expecting 1 param (will overflow - 0 bytes)
              {
                paramType: Encoding.AbiEncoded,
                compValue: "0x0000",
                children: [{ paramType: Encoding.Static }],
              },
              // Branch 2: AbiEncoded expecting 2 params (will overflow - 0 bytes)
              {
                paramType: Encoding.AbiEncoded,
                compValue: "0x0000",
                children: [
                  { paramType: Encoding.Static },
                  { paramType: Encoding.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("overflow sets no children on parent", async () => {
      const { decoder } = await loadFixture(setup);

      // 4-byte selector + only 31 bytes (need 32) - triggers overflow in _walk
      const data = "0xaabbccdd" + "00".repeat(31);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
      // When overflow occurs, no children should be populated
      expect(result.children.length).to.equal(0);
    });
  });

  // ZONE 5: Type-Specific
  // Covers: AbiEncoded handling with leadingBytes
  describe("AbiEncoded Handling", () => {
    it("flags overflow when leadingBytes extends past bounds", async () => {
      const { decoder } = await loadFixture(setup);

      // Only 3 bytes (selector needs 4)
      const data = "0xaabbcc";

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });

    it("flags overflow in nested structure after valid selector", async () => {
      const { decoder } = await loadFixture(setup);

      // Valid selector but nested AbiEncoded structure overflows
      // Outer: selector + pointer to inner
      // Inner: selector + needs param but truncated
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // outer offset
        "0000000000000000000000000000000000000000000000000000000000000008" + // inner length = 8
        "11223344" +
        "00".repeat(4); // inner: 4-byte selector + only 4 bytes (need 32)

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Dynamic,
            children: [
              {
                paramType: Encoding.AbiEncoded,
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(true);
    });
  });

  // ZONE 6: Boundary Conditions
  // False-positive prevention
  describe("Edge Cases", () => {
    it("empty array (length=0) does NOT overflow", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer + length=0
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset
        "0000000000000000000000000000000000000000000000000000000000000000"; // length = 0

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Array,
            children: [{ paramType: Encoding.Static }],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(false);
      expect(result.children.length).to.equal(1);
    });

    it("empty tuple does NOT overflow", async () => {
      const { decoder } = await loadFixture(setup);

      // A function with no params - just a selector, empty tuple at root
      const data = "0xaabbccdd";

      // AbiEncoded with no children = empty params
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      expect(result.overflow).to.equal(false);
    });

    it("large array length causes overflow (not OOG)", async () => {
      const { decoder } = await loadFixture(setup);

      // selector + pointer + large but not extreme length (100 elements)
      // We only provide data for 2 elements
      const data =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset
        "0000000000000000000000000000000000000000000000000000000000000064" + // length = 100
        "00".repeat(64); // only 2 elements (64 bytes)

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [
          {
            paramType: Encoding.Array,
            children: [{ paramType: Encoding.Static }],
          },
        ],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      // Should overflow because claimed elements don't exist
      expect(result.overflow).to.equal(true);
    });

    it("root payload size equals calldata length", async () => {
      const { decoder } = await loadFixture(setup);

      // selector (4 bytes) + one static param (32 bytes) = 36 bytes total
      const data = "0xaabbccdd" + "00".repeat(32);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspectFlat(data, conditions));

      // Root size should equal total calldata length (36 bytes)
      // data is hex string: "0x" + 2 chars per byte, so (data.length - 2) / 2
      expect(result.size).to.equal((data.length - 2) / 2);
    });
  });
});

type Payload = {
  location: number;
  size: number;
  children: Payload[];
  inlined: boolean;
  variant: boolean;
  overflow: boolean;
};

function toTree(
  bfsArray: {
    location: bigint;
    size: bigint;
    parent: bigint;
    inlined: boolean;
    variant: boolean;
    overflow: boolean;
  }[],
): Payload {
  const nodes = bfsArray.map((item) => ({
    location: Number(item.location),
    size: Number(item.size),
    children: [] as Payload[],
    inlined: item.inlined,
    variant: item.variant,
    overflow: item.overflow,
  }));

  bfsArray.forEach((item, i) => {
    const parentIndex = Number(item.parent);
    if (parentIndex !== i) {
      nodes[parentIndex].children.push(nodes[i]);
    }
  });

  return nodes[0];
}
