import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType, flattenCondition, Operator } from "../utils";
import { Interface } from "ethers";

describe.only("AbiDecoder - Overflow", () => {
  async function setup() {
    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return { decoder };
  }

  describe("Basic Cases", () => {
    it("overflows on empty calldata", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static }, // expecting uint256
        ],
      });

      // Correct: function f(uint256) with proper calldata
      const correct = [
        "0xd45754f8",
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
      ].join("");

      // Incorrect: completely empty calldata
      const incorrect = "0x";

      const resultCorrect = await decoder.inspect(correct, conditions);
      const resultIncorrect = await decoder.inspect(incorrect, conditions);

      expect(resultCorrect.overflown).to.equal(false);
      expect(resultCorrect.variant).to.equal(false);
      expect(resultCorrect.children.length).to.equal(1);

      expect(resultIncorrect.overflown).to.equal(true);
      expect(resultIncorrect.variant).to.equal(false);
      expect(resultIncorrect.children.length).to.equal(0);
    });
    it("overflows on calldata with only selector", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static }, // expecting a uint256
          { paramType: AbiType.Dynamic }, // expecting bytes
        ],
      });

      // Correct: function f(uint256, bytes) with proper parameters
      const correct = [
        "0x13d1aa2e", // selector
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000040", // offset for bytes
        "0000000000000000000000000000000000000000000000000000000000000004", // length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      const incorrect = "0x13d1aa2e";

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(2);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on static type missing", async () => {
      const { decoder } = await loadFixture(setup);

      const dataOk = Interface.from([
        "function f(uint256 a)",
      ]).encodeFunctionData("f", [123]);

      // Missing the last parameter (bool)
      const dataOverflow = Interface.from(["function t()"]).encodeFunctionData(
        "t",
        [],
      );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static }, // uint256
        ],
      });

      {
        // OKAY
        const result = await decoder.inspect(dataOk, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        // OVERFLOW
        const result = await decoder.inspect(dataOverflow, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on static type too short", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Static }],
      });

      // const data = Interface.from(["function f(uint256)"]).encodeFunctionData(
      //   "f",
      //   [123456],
      // );
      const dataOk = [
        "0xb3de648b",
        "000000000000000000000000000000000000000000000000000000000001e240",
      ].join("");

      const dataOverflow1 = [
        "0xb3de648b",
        "000000000000000000000000000000000000000000000000000000000001e2",
      ].join("");

      const dataOverflow2 = ["0xb3de648b", "00"].join("");

      {
        const result = await decoder.inspect(dataOk, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.children.length).to.be.greaterThan(0);
      }

      {
        const result = await decoder.inspect(dataOverflow1, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.children.length).to.equal(0);
      }

      {
        const result = await decoder.inspect(dataOverflow2, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic type, missing head", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      // Correct: function f(bytes) with complete data
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000004", // length = 4 bytes
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // 4 bytes padded to 32
      ].join("");

      const incorrect1 = "0xd45754f8";

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect1, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic type, head too short", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static }, // uint256
          { paramType: AbiType.Dynamic }, // bytes
        ],
      });

      // Correct: function f(uint256, bytes) with complete data
      const correct = [
        "0xd45754f8",
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000040", // offset for bytes
        "0000000000000000000000000000000000000000000000000000000000000004", // length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      // Incorrect: partial offset pointer for dynamic type
      const incorrect = [
        "0xd45754f8",
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "00000000000000000000000000000040", // only 16 bytes of offset pointer
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(2);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic type, missing tail", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      // Correct: function f(bytes) with complete data
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000010", // length = 16 bytes
        "aabbccddeeff1122334455667788990000000000000000000000000000000000", // 16 bytes padded to 32
      ].join("");

      // Incorrect: no calldata at all
      const incorrect = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000010", // length = 32 bytes
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic type, tail too short", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      // Correct: function f(bytes) with complete data
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000010", // length = 16 bytes
        "aabbccddeeff1122334455667788990000000000000000000000000000000000", // 16 bytes padded to 32
      ].join("");

      const incorrect = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000010", // length = 16 bytes
        "aabbcc", // 3 bytes only
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic type, tail non-padded", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      // Correct: properly padded dynamic data
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000003", // length = 3 bytes
        "aabbcc0000000000000000000000000000000000000000000000000000000000", // 3 bytes padded to 32
      ].join("");

      // Incorrect: 3 bytes of data but not padded to 32
      const incorrect1 = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000003", // length = 3 bytes
        "aabbcc", // only 3 bytes, not padded - calldata ends abruptly
      ].join("");

      // Incorrect: 17 bytes of data, should be padded to 32
      const incorrect2 = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000011", // length = 17 bytes
        "aabbccddeeff11223344556677889900ff000000000000", // 17 bytes padded to 24
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect1, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }

      {
        const result = await decoder.inspect(incorrect2, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
  });

  describe("Tuple AKA __block__", () => {
    it("overflows on static field missing", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static }, // uint256
              { paramType: AbiType.Static }, // address
              { paramType: AbiType.Static }, // bool
            ],
          },
        ],
      });

      // Correct: function f((uint256, address, bool)) with all fields
      const correct = [
        "0xd45754f8",
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000001", // address(1)
        "0000000000000000000000000000000000000000000000000000000000000001", // bool(true)
      ].join("");

      // Incorrect: missing last static field (bool)
      const incorrect1 = [
        "0xd45754f8",
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000001", // address(1)
        // missing bool field
      ].join("");

      // Incorrect: missing last two static fields
      const incorrect2 = [
        "0xd45754f8",
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        // missing address and bool fields
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
        expect(result.children[0].children.length).to.equal(3);
      }

      {
        const result = await decoder.inspect(incorrect1, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }

      {
        const result = await decoder.inspect(incorrect2, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on static field missing, after multi chunk static block", async () => {
      const { decoder } = await loadFixture(setup);
      const dataOk = Interface.from([
        "function staticTuple(tuple(uint256 a, bool b), uint256)",
      ]).encodeFunctionData("staticTuple", [{ a: 1999, b: true }, 2000]);

      const dataOverflow = Interface.from([
        "function staticTuple(tuple(uint256 a, bool b))",
      ]).encodeFunctionData("staticTuple", [{ a: 1999, b: true }]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static },
              { paramType: AbiType.Static },
            ],
          },
          { paramType: AbiType.Static },
        ],
      });

      {
        // OKAY
        const result = await decoder.inspect(dataOk, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.children.length).to.be.greaterThan(0);
      }

      {
        // OVERFLOW
        const result = await decoder.inspect(dataOverflow, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic field missing", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static }, // uint256
              { paramType: AbiType.Dynamic }, // bytes
              { paramType: AbiType.Static }, // address
            ],
          },
        ],
      });

      // Correct: function f((uint256, bytes, address)) with all fields
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000060", // bytes offset (relative to tuple)
        "0000000000000000000000000000000000000000000000000000000000000001", // address(1)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      // Incorrect: missing dynamic field offset pointer in head
      const incorrect = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
        expect(result.children[0].children.length).to.equal(3);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic field missing, after multi chunk static block", async () => {
      const { decoder } = await loadFixture(setup);
      const dataOk = Interface.from([
        "function staticTuple(tuple(uint256 a, bool b), bytes)",
      ]).encodeFunctionData("staticTuple", [
        { a: 1999, b: true },
        "0xaabbccdd",
      ]);

      const dataOverflow = Interface.from([
        "function staticTuple(tuple(uint256 a, bool b))",
      ]).encodeFunctionData("staticTuple", [{ a: 1999, b: true }]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static },
              { paramType: AbiType.Static },
            ],
          },
          { paramType: AbiType.Dynamic },
        ],
      });

      {
        // OKAY
        const result = await decoder.inspect(dataOk, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.children.length).to.be.greaterThan(0);
      }

      {
        // OVERFLOW
        const result = await decoder.inspect(dataOverflow, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic field, offset points within the head bounds", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static }, // uint256
              { paramType: AbiType.Dynamic }, // bytes
            ],
          },
        ],
      });

      // Correct: function f((uint256, bytes)) with proper offset
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000040", // bytes offset (relative to tuple)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      // Incorrect: offset pointing to beginning of tuple (circular reference)
      const incorrect = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000000", // offset = 0 (points to start of tuple)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic field, offset is self referential", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static }, // uint256
              { paramType: AbiType.Dynamic }, // bytes
            ],
          },
        ],
      });

      // Correct: function f((uint256, bytes)) with proper offset
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000040", // bytes offset (relative to tuple)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      // Incorrect: offset pointing to beginning of tuple (circular reference)
      const incorrect = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000020", // offset = 0 (points to start of tuple)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
    it("overflows on dynamic field, offsets points outside calldata bounds", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static }, // uint256
              { paramType: AbiType.Dynamic }, // bytes
            ],
          },
        ],
      });

      // Correct: function f((uint256, bytes)) with proper offset
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000040", // bytes offset (relative to tuple)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      // Incorrect: offset pointing way beyond calldata bounds
      const incorrect1 = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000000041", // offset, one byte too long
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      // Incorrect: offset pointing way beyond calldata bounds
      const incorrect2 = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // tuple offset
        "000000000000000000000000000000000000000000000000000000000000007b", // uint256(123)
        "0000000000000000000000000000000000000000000000000000000000001000", // offset = 4096 (way beyond calldata)
        "0000000000000000000000000000000000000000000000000000000000000004", // bytes length = 4
        "aabbccdd00000000000000000000000000000000000000000000000000000000", // bytes data
      ].join("");

      {
        const result = await decoder.inspect(correct, conditions);
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);
      }

      {
        const result = await decoder.inspect(incorrect1, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }

      {
        const result = await decoder.inspect(incorrect2, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
  });

  describe("Array", () => {
    it("overflows on array with incorrect element count", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Static }],
          },
        ],
      });

      // Correct: function f(uint256[]) with 3 elements
      const correct = [
        "0x11223344",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000003", // length = 3
        "000000000000000000000000000000000000000000000000000000000000000a", // 10
        "000000000000000000000000000000000000000000000000000000000000001f", // 31
        "0000000000000000000000000000000000000000000000000000000000000064", // 100
      ].join("");

      // Incorrect: array length says 3 but only 2 elements provided
      const incorrect = [
        "0x11223344",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000003", // length = 3
        "000000000000000000000000000000000000000000000000000000000000000a", // 10
        "000000000000000000000000000000000000000000000000000000000000001f", // 31
        // missing third element
      ].join("");

      const resultCorrect = await decoder.inspect(correct, conditions);
      const resultIncorrect = await decoder.inspect(incorrect, conditions);

      expect(resultCorrect.overflown).to.equal(false);
      expect(resultCorrect.variant).to.equal(false);
      expect(resultCorrect.children.length).to.equal(1);
      expect(resultCorrect.children[0].children.length).to.equal(3);

      expect(resultIncorrect.overflown).to.equal(true);
      expect(resultIncorrect.variant).to.equal(false);
      expect(resultIncorrect.children.length).to.equal(0);
    });
    it("overflows on array with length but no body", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Static }], // uint256[]
          },
        ],
      });

      // Correct: function f(uint256[]) with 3 elements
      const correct = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000003", // length = 3
        "00000000000000000000000000000000000000000000000000000000000000aa",
        "00000000000000000000000000000000000000000000000000000000000000bb",
        "00000000000000000000000000000000000000000000000000000000000000cc",
      ].join("");

      // Incorrect: array length says 3 but no elements follow
      const incorrect1 = [
        "0xd45754f8",
        "0000000000000000000000000000000000000000000000000000000000000020", // offset
        "0000000000000000000000000000000000000000000000000000000000000003", // length = 3
        // no array elements at all
      ].join("");

      const resultCorrect = await decoder.inspect(correct, conditions);
      const resultIncorrect = await decoder.inspect(incorrect1, conditions);

      expect(resultCorrect.overflown).to.equal(false);
      expect(resultCorrect.variant).to.equal(false);
      expect(resultCorrect.children.length).to.equal(1);
      expect(resultCorrect.children[0].children.length).to.equal(3);

      expect(resultIncorrect.overflown).to.equal(true);
      expect(resultIncorrect.variant).to.equal(false);
      expect(resultIncorrect.children.length).to.equal(0);
    });
  });

  describe("Variant", () => {
    it("does not overflow on variant when at least one variant branch does not overflow", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.AbiEncoded,
                children: [
                  { paramType: AbiType.Static }, // uint256
                  { paramType: AbiType.Static }, // address
                ],
              },
              {
                paramType: AbiType.AbiEncoded,
                children: [
                  { paramType: AbiType.Static }, // uint256
                ],
              },
            ],
          },
        ],
      });

      // const embedded = defaultAbiCoder.encode(["uint256", "uint256"], [1, 2]);
      // const DATA_OK = Interface.from([
      //   "function dynamic(bytes)",
      // ]).encodeFunctionData("dynamic", [embedded]);
      const DATA_OK = [
        "0xd543852a",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000040",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "0000000000000000000000000000000000000000000000000000000000000002",
      ].join("");

      // const embedded = defaultAbiCoder.encode(["uint256"], [1]);
      // const DATA_OVERFLOW = Interface.from([
      //   "function dynamic(bytes)",
      // ]).encodeFunctionData("dynamic", [embedded]);
      const DATA_OVERFLOW = [
        "0xd543852a",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000001",
      ].join("");

      // no branch overflows, variant does not overflow
      {
        const result = await decoder.inspect(DATA_OK, conditions);

        // All branches should overflow, so the OR variant should also overflow
        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);

        const [variant] = result.children;
        expect(variant.overflown).to.equal(false);
        expect(variant.variant).to.equal(true);
        expect(variant.children.length).to.equal(2);

        const [first, second] = variant.children;
        expect(first.overflown).to.equal(false);
        expect(first.variant).to.equal(false);
        expect(second.overflown).to.equal(false);
        expect(second.variant).to.equal(false);
      }

      // only one of the branches overflows
      {
        const result = await decoder.inspect(DATA_OVERFLOW, conditions);

        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);

        const [variant] = result.children;
        expect(variant.overflown).to.equal(false);
        expect(variant.variant).to.equal(true);
        expect(variant.children.length).to.equal(2);

        const [first, second] = variant.children;
        expect(first.overflown).to.equal(true);
        expect(first.variant).to.equal(false);
        expect(second.overflown).to.equal(false);
        expect(second.variant).to.equal(false);
      }
    });

    it("overflows on variant when all branches overflow", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.AbiEncoded,
                children: [
                  { paramType: AbiType.Static }, // uint256
                  { paramType: AbiType.Static }, // address
                  { paramType: AbiType.Static }, // address
                ],
              },
              {
                paramType: AbiType.AbiEncoded,
                children: [
                  { paramType: AbiType.Static }, // uint256
                  { paramType: AbiType.Static }, // uint256
                ],
              },
            ],
          },
        ],
      });

      // const embedded = defaultAbiCoder.encode(["uint256", "uint256"], [1, 2]);
      // const DATA_OK = Interface.from([
      //   "function dynamic(bytes)",
      // ]).encodeFunctionData("dynamic", [embedded]);
      const DATA_OK = [
        "0xd543852a",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000040",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "0000000000000000000000000000000000000000000000000000000000000002",
      ].join("");

      // const embedded = defaultAbiCoder.encode(["uint256"], [1]);
      // const DATA_OVERFLOW = Interface.from([
      //   "function dynamic(bytes)",
      // ]).encodeFunctionData("dynamic", [embedded]);
      const DATA_OVERFLOW = [
        "0xd543852a",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000001",
      ].join("");

      // no branch overflows, variant does not overflow
      {
        const result = await decoder.inspect(DATA_OK, conditions);

        expect(result.overflown).to.equal(false);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(1);

        const [variant] = result.children;
        expect(variant.overflown).to.equal(false);
        expect(variant.variant).to.equal(true);
        expect(variant.children.length).to.equal(2);

        const [first, second] = variant.children;
        expect(first.overflown).to.equal(true);
        expect(first.variant).to.equal(false);
        expect(second.overflown).to.equal(false);
        expect(second.variant).to.equal(false);
      }

      {
        // All branches should overflow, so the OR variant should also overflow
        const result = await decoder.inspect(DATA_OVERFLOW, conditions);
        expect(result.overflown).to.equal(true);
        expect(result.variant).to.equal(false);
        expect(result.children.length).to.equal(0);
      }
    });
  });
});
