import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface } from "ethers";

import { Encoding, flattenCondition, Operator } from "../utils";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("AbiDecoder - Traversal", () => {
  async function setup() {
    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    const MockLocator = await hre.ethers.getContractFactory("MockLocator");
    const locator = await MockLocator.deploy();

    return { decoder, locator };
  }

  describe("Leaf Types", () => {
    it("Static", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = 123;
      const data = defaultAbiCoder.encode(["uint256"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const node = root.children[0];

      expect(node.inlined).to.equal(true);
      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        defaultAbiCoder.encode(["uint256"], [value]),
      );

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(node.location);

      const size = await locator.getSize(data, node.location, conditions, 1);
      expect(Number(size)).to.equal(node.size);
    });

    it("Dynamic (aligned length)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = new Uint8Array(32).fill(1);
      const data = defaultAbiCoder.encode(["bytes"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const node = root.children[0];

      expect(node.inlined).to.equal(false);
      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        encode(["bytes"], [value], true),
      );

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(node.location);

      const size = await locator.getSize(data, node.location, conditions, 1);
      expect(Number(size)).to.equal(node.size);
    });

    it("Dynamic (unaligned length - padding)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = new Uint8Array(33).fill(1);
      const data = defaultAbiCoder.encode(["bytes"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const node = root.children[0];

      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        encode(["bytes"], [value], true),
      );

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(node.location);

      const size = await locator.getSize(data, node.location, conditions, 1);
      expect(Number(size)).to.equal(node.size);
    });

    it("Dynamic (empty - zero length)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const data = defaultAbiCoder.encode(["bytes"], ["0x"]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const node = root.children[0];

      expect(node.size).to.equal(32);
      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        encode(["bytes"], ["0x"], true),
      );

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(node.location);

      const size = await locator.getSize(data, node.location, conditions, 1);
      expect(Number(size)).to.equal(node.size);
    });
  });

  describe("Containers (Depth 1)", () => {
    describe("Tuple", () => {
      it("static-only (inlined)", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const value = [1, 2];
        const data = defaultAbiCoder.encode(
          ["tuple(uint256, uint256)"],
          [value],
        );
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                { paramType: Encoding.Static },
                { paramType: Encoding.Static },
              ],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const tupleNode = root.children[0];

        expect(tupleNode.inlined).to.equal(true);
        expect(
          await decoder.pluck(data, tupleNode.location, tupleNode.size),
        ).to.equal(
          defaultAbiCoder.encode(["tuple(uint256, uint256)"], [value]),
        );

        // Granular: pluck individual tuple elements
        expect(
          await decoder.pluck(
            data,
            tupleNode.children[0].location,
            tupleNode.children[0].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [value[0]]));
        expect(
          await decoder.pluck(
            data,
            tupleNode.children[1].location,
            tupleNode.children[1].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [value[1]]));

        const [rootChildLocations] = await locator.getChildLocations(
          data,
          0,
          conditions,
          0,
        );
        expect(rootChildLocations.length).to.equal(root.children.length);
        expect(Number(rootChildLocations[0])).to.equal(tupleNode.location);

        const [tupleChildLocations] = await locator.getChildLocations(
          data,
          tupleNode.location,
          conditions,
          1,
        );
        expect(tupleChildLocations.length).to.equal(tupleNode.children.length);
        expect(Number(tupleChildLocations[0])).to.equal(
          tupleNode.children[0].location,
        );
        expect(Number(tupleChildLocations[1])).to.equal(
          tupleNode.children[1].location,
        );

        const size1 = await locator.getSize(
          data,
          tupleNode.children[0].location,
          conditions,
          2,
        );
        const size2 = await locator.getSize(
          data,
          tupleNode.children[1].location,
          conditions,
          3,
        );
        expect(Number(size1)).to.equal(tupleNode.children[0].size);
        expect(Number(size2)).to.equal(tupleNode.children[1].size);
      });

      it("with dynamic child (pointer-based)", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const value = ["0xaa"];
        const data = defaultAbiCoder.encode(["tuple(bytes)"], [value]);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [{ paramType: Encoding.Dynamic }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const tupleNode = root.children[0];

        expect(tupleNode.inlined).to.equal(false);
        expect(
          await decoder.pluck(data, tupleNode.location, tupleNode.size),
        ).to.equal(encode(["tuple(bytes)"], [value], true));

        // Granular: pluck the dynamic bytes element
        const bytesNode = tupleNode.children[0];
        expect(
          await decoder.pluck(data, bytesNode.location, bytesNode.size),
        ).to.equal(encode(["bytes"], [value[0]], true));

        const [rootChildLocations] = await locator.getChildLocations(
          data,
          0,
          conditions,
          0,
        );
        expect(rootChildLocations.length).to.equal(root.children.length);
        expect(Number(rootChildLocations[0])).to.equal(tupleNode.location);

        const [tupleChildLocations] = await locator.getChildLocations(
          data,
          tupleNode.location,
          conditions,
          1,
        );
        expect(tupleChildLocations.length).to.equal(tupleNode.children.length);
        expect(Number(tupleChildLocations[0])).to.equal(bytesNode.location);

        const dynamicSize = await locator.getSize(
          data,
          bytesNode.location,
          conditions,
          2,
        );
        expect(Number(dynamicSize)).to.equal(bytesNode.size);
      });
    });

    describe("Array", () => {
      it("static elements", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const value = [1, 2, 3];
        const data = defaultAbiCoder.encode(["uint256[]"], [value]);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const arrayNode = root.children[0];

        expect(arrayNode.inlined).to.equal(false);
        expect(
          await decoder.pluck(data, arrayNode.location, arrayNode.size),
        ).to.equal(encode(["uint256[]"], [value], true));

        // Granular: pluck individual array elements
        for (let i = 0; i < value.length; i++) {
          expect(
            await decoder.pluck(
              data,
              arrayNode.children[i].location,
              arrayNode.children[i].size,
            ),
          ).to.equal(defaultAbiCoder.encode(["uint256"], [value[i]]));
        }

        const [rootChildLocations] = await locator.getChildLocations(
          data,
          0,
          conditions,
          0,
        );
        expect(rootChildLocations.length).to.equal(root.children.length);
        expect(Number(rootChildLocations[0])).to.equal(arrayNode.location);

        const [elementLocations] = await locator.getChildLocations(
          data,
          arrayNode.location,
          conditions,
          1,
        );
        expect(elementLocations.length).to.equal(arrayNode.children.length);
        for (let i = 0; i < value.length; i++) {
          expect(Number(elementLocations[i])).to.equal(
            arrayNode.children[i].location,
          );
          const size = await locator.getSize(
            data,
            arrayNode.children[i].location,
            conditions,
            2,
          );
          expect(Number(size)).to.equal(arrayNode.children[i].size);
        }
      });

      it("dynamic elements", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const value = ["0xaa", "0xbb"];
        const data = defaultAbiCoder.encode(["bytes[]"], [value]);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [{ paramType: Encoding.Dynamic }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const arrayNode = root.children[0];

        expect(
          await decoder.pluck(data, arrayNode.location, arrayNode.size),
        ).to.equal(encode(["bytes[]"], [value], true));

        // Granular: pluck individual dynamic bytes elements
        for (let i = 0; i < value.length; i++) {
          expect(
            await decoder.pluck(
              data,
              arrayNode.children[i].location,
              arrayNode.children[i].size,
            ),
          ).to.equal(encode(["bytes"], [value[i]], true));
        }

        const [rootChildLocations] = await locator.getChildLocations(
          data,
          0,
          conditions,
          0,
        );
        expect(rootChildLocations.length).to.equal(root.children.length);
        expect(Number(rootChildLocations[0])).to.equal(arrayNode.location);

        const [elementLocations] = await locator.getChildLocations(
          data,
          arrayNode.location,
          conditions,
          1,
        );
        expect(elementLocations.length).to.equal(arrayNode.children.length);
        for (let i = 0; i < value.length; i++) {
          expect(Number(elementLocations[i])).to.equal(
            arrayNode.children[i].location,
          );
          const size = await locator.getSize(
            data,
            arrayNode.children[i].location,
            conditions,
            2,
          );
          expect(Number(size)).to.equal(arrayNode.children[i].size);
        }
      });

      it("empty (length = 0)", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const data = defaultAbiCoder.encode(["uint256[]"], [[]]);
        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const arrayNode = root.children[0];

        expect(arrayNode.size).to.equal(32);
        expect(arrayNode.children).to.have.length(0);

        const [rootChildLocations] = await locator.getChildLocations(
          data,
          0,
          conditions,
          0,
        );
        expect(rootChildLocations.length).to.equal(root.children.length);
        expect(Number(rootChildLocations[0])).to.equal(arrayNode.location);

        const size = await locator.getSize(
          data,
          arrayNode.location,
          conditions,
          1,
        );
        expect(Number(size)).to.equal(arrayNode.size);

        const [elementLocations] = await locator.getChildLocations(
          data,
          arrayNode.location,
          conditions,
          1,
        );
        expect(elementLocations.length).to.equal(arrayNode.children.length);
      });

      it("with embedded calldata elements (selector)", async () => {
        const { decoder, locator } = await loadFixture(setup);

        const embedded1 = Interface.from([
          "function embedded(uint256)",
        ]).encodeFunctionData("embedded", [12345]);

        const embedded2 = Interface.from([
          "function embedded(uint256)",
        ]).encodeFunctionData("embedded", [67890]);

        const data = Interface.from([
          "function test(bytes[])",
        ]).encodeFunctionData("test", [[embedded1, embedded2]]);

        // leadingBytes for root = 4 (function selector)
        // leadingBytes for embedded = 4 (function selector)
        const rootLeadingBytes = 4;
        const embeddedLeadingBytes = 4;

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  children: [{ paramType: Encoding.Static }],
                },
              ],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const arrayNode = root.children[0];

        expect(
          await decoder.pluck(data, arrayNode.location, arrayNode.size),
        ).to.equal(encode(["bytes[]"], [[embedded1, embedded2]], true));

        // Pluck first embedded calldata entry and its parameter
        const firstEntry = arrayNode.children[0];
        const firstParam = firstEntry.children[0];
        expect(
          await decoder.pluck(data, firstParam.location, firstParam.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [12345]));

        // Pluck second embedded calldata entry and its parameter
        const secondEntry = arrayNode.children[1];
        const secondParam = secondEntry.children[0];
        expect(
          await decoder.pluck(data, secondParam.location, secondParam.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [67890]));

        // AbiLocation expects location to point at the head region start,
        // which for AbiEncoded is after leadingBytes
        const [rootChildLocations] = await locator.getChildLocations(
          data,
          rootLeadingBytes,
          conditions,
          0,
        );
        expect(rootChildLocations.length).to.equal(root.children.length);
        expect(Number(rootChildLocations[0])).to.equal(arrayNode.location);

        // Array elements are AbiEncoded (bytes), so AbiLocation returns tail offset
        // (to length prefix), but AbiDecoder's location points AFTER length prefix (+32)
        const [elementLocations] = await locator.getChildLocations(
          data,
          arrayNode.location,
          conditions,
          1,
        );
        expect(elementLocations.length).to.equal(arrayNode.children.length);
        expect(Number(elementLocations[0]) + 32).to.equal(firstEntry.location);
        expect(Number(elementLocations[1]) + 32).to.equal(secondEntry.location);

        // Verify first embedded calldata's children
        // For AbiEncoded, entry.location points after the length prefix,
        // but head region starts at entry.location + leadingBytes
        const [firstEmbeddedChildLocations] = await locator.getChildLocations(
          data,
          firstEntry.location + embeddedLeadingBytes,
          conditions,
          2,
        );
        expect(firstEmbeddedChildLocations.length).to.equal(
          firstEntry.children.length,
        );
        expect(Number(firstEmbeddedChildLocations[0])).to.equal(
          firstParam.location,
        );

        const firstParamSize = await locator.getSize(
          data,
          firstParam.location,
          conditions,
          3,
        );
        expect(Number(firstParamSize)).to.equal(firstParam.size);
      });
    });

    describe("AbiEncoded", () => {
      it("leadingBytes = 0", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const innerValue = 123;
        const innerEncoded = defaultAbiCoder.encode(["uint256"], [innerValue]);
        const data = defaultAbiCoder.encode(["bytes"], [innerEncoded]);

        // Outer AbiEncoded: leadingBytes=0 (from compValue "0x0000")
        // Inner AbiEncoded: leadingBytes=0 (from compValue "0x0000")
        const outerLeadingBytes = 0;
        const innerLeadingBytes = 0;

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0000",
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const innerAbiEncoded = root.children[0];
        const innerNode = innerAbiEncoded.children[0];

        expect(
          await decoder.pluck(data, innerNode.location, innerNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [innerValue]));

        // For AbiEncoded children, AbiLocation returns location of length prefix,
        // but AbiDecoder's payload.location points AFTER length prefix (+32)
        const [outerChildLocations] = await locator.getChildLocations(
          data,
          outerLeadingBytes,
          conditions,
          0,
        );
        expect(outerChildLocations.length).to.equal(root.children.length);
        // AbiLocation returns tail offset (to length prefix), add 32 to get payload.location
        expect(Number(outerChildLocations[0]) + 32).to.equal(
          innerAbiEncoded.location,
        );

        // Pass location + leadingBytes to get to head region
        const [innerChildLocations] = await locator.getChildLocations(
          data,
          innerAbiEncoded.location + innerLeadingBytes,
          conditions,
          1,
        );
        expect(innerChildLocations.length).to.equal(
          innerAbiEncoded.children.length,
        );
        expect(Number(innerChildLocations[0])).to.equal(innerNode.location);

        const staticParamSize = await locator.getSize(
          data,
          innerNode.location,
          conditions,
          2,
        );
        expect(Number(staticParamSize)).to.equal(innerNode.size);
      });

      it("leadingBytes = 4 (default)", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const innerValue = 123;
        const selector = "0x12345678";
        const innerEncoded = defaultAbiCoder.encode(["uint256"], [innerValue]);
        const payloadWithSelector = selector + innerEncoded.slice(2);
        const data = defaultAbiCoder.encode(["bytes"], [payloadWithSelector]);

        // Outer AbiEncoded has leadingBytes=0 (from compValue "0x0000")
        // Inner AbiEncoded has default leadingBytes=4
        const outerLeadingBytes = 0;
        const innerLeadingBytes = 4;

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const innerAbiEncoded = root.children[0];
        const innerNode = innerAbiEncoded.children[0];

        expect(
          await decoder.pluck(data, innerNode.location, innerNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [innerValue]));

        // For AbiEncoded children, AbiLocation returns location of length prefix,
        // but AbiDecoder's payload.location points AFTER length prefix (+32)
        const [outerChildLocations] = await locator.getChildLocations(
          data,
          outerLeadingBytes,
          conditions,
          0,
        );
        expect(outerChildLocations.length).to.equal(root.children.length);
        // AbiLocation returns tail offset (to length prefix), add 32 to get payload.location
        expect(Number(outerChildLocations[0]) + 32).to.equal(
          innerAbiEncoded.location,
        );

        // Pass location + leadingBytes to get to head region
        const [innerChildLocations] = await locator.getChildLocations(
          data,
          innerAbiEncoded.location + innerLeadingBytes,
          conditions,
          1,
        );
        expect(innerChildLocations.length).to.equal(
          innerAbiEncoded.children.length,
        );
        expect(Number(innerChildLocations[0])).to.equal(innerNode.location);

        const staticParamSize = await locator.getSize(
          data,
          innerNode.location,
          conditions,
          2,
        );
        expect(Number(staticParamSize)).to.equal(innerNode.size);
      });

      it("leadingBytes = 32 (custom, max)", async () => {
        const { decoder, locator } = await loadFixture(setup);
        const innerValue = 456;
        // leadingBytes max is 32, compValue format: uint16(leadingBytes) + prefix bytes
        const innerLeadingBytes = 32;
        const customPrefix = "0x" + "ab".repeat(innerLeadingBytes); // 32 bytes of 0xab
        // compValue = 0x0020 (32 as uint16) + 32 bytes prefix
        const compValue = "0x0020" + "ab".repeat(innerLeadingBytes);
        const innerEncoded = defaultAbiCoder.encode(["uint256"], [innerValue]);
        const payloadWithPrefix = customPrefix + innerEncoded.slice(2);
        const data = defaultAbiCoder.encode(["bytes"], [payloadWithPrefix]);

        // Outer AbiEncoded has leadingBytes=0 (from compValue "0x0000")
        const outerLeadingBytes = 0;

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: compValue,
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const root = result;
        const innerAbiEncoded = root.children[0];
        const innerNode = innerAbiEncoded.children[0];

        expect(
          await decoder.pluck(data, innerNode.location, innerNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [innerValue]));

        // For AbiEncoded children, AbiLocation returns location of length prefix,
        // but AbiDecoder's payload.location points AFTER length prefix (+32)
        const [outerChildLocations] = await locator.getChildLocations(
          data,
          outerLeadingBytes,
          conditions,
          0,
        );
        expect(outerChildLocations.length).to.equal(root.children.length);
        // AbiLocation returns tail offset (to length prefix), add 32 to get payload.location
        expect(Number(outerChildLocations[0]) + 32).to.equal(
          innerAbiEncoded.location,
        );

        // For AbiEncoded, location points after length prefix,
        // but head region starts at location + leadingBytes
        const [innerChildLocations] = await locator.getChildLocations(
          data,
          innerAbiEncoded.location + innerLeadingBytes,
          conditions,
          1,
        );
        expect(innerChildLocations.length).to.equal(
          innerAbiEncoded.children.length,
        );
        expect(Number(innerChildLocations[0])).to.equal(innerNode.location);

        const staticParamSize = await locator.getSize(
          data,
          innerNode.location,
          conditions,
          2,
        );
        expect(Number(staticParamSize)).to.equal(innerNode.size);
      });
    });
  });

  describe("Containers (Depth 2+)", () => {
    it("Array of Tuples", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = [
        [1, 2],
        [3, 4],
      ];
      const data = defaultAbiCoder.encode(
        ["tuple(uint256, uint256)[]"],
        [value],
      );
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [
                  { paramType: Encoding.Static },
                  { paramType: Encoding.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const arrayNode = root.children[0];

      expect(
        await decoder.pluck(data, arrayNode.location, arrayNode.size),
      ).to.equal(encode(["tuple(uint256, uint256)[]"], [value], true));

      // Pluck first tuple and its elements
      const firstTuple = arrayNode.children[0];
      expect(
        await decoder.pluck(data, firstTuple.location, firstTuple.size),
      ).to.equal(
        defaultAbiCoder.encode(["tuple(uint256, uint256)"], [value[0]]),
      );

      expect(
        await decoder.pluck(
          data,
          firstTuple.children[0].location,
          firstTuple.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [value[0][0]]));

      const [rootChildLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(rootChildLocations.length).to.equal(root.children.length);
      expect(Number(rootChildLocations[0])).to.equal(arrayNode.location);

      const [tupleLocations] = await locator.getChildLocations(
        data,
        arrayNode.location,
        conditions,
        1,
      );
      expect(tupleLocations.length).to.equal(arrayNode.children.length);
      expect(Number(tupleLocations[0])).to.equal(firstTuple.location);

      const [tupleElementLocations] = await locator.getChildLocations(
        data,
        firstTuple.location,
        conditions,
        2,
      );
      expect(tupleElementLocations.length).to.equal(firstTuple.children.length);
      expect(Number(tupleElementLocations[0])).to.equal(
        firstTuple.children[0].location,
      );
      expect(Number(tupleElementLocations[1])).to.equal(
        firstTuple.children[1].location,
      );
    });

    it("Tuple containing Array", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = [[1, 2, 3]];
      const data = defaultAbiCoder.encode(["tuple(uint256[])"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Matches,
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const tupleNode = root.children[0];
      const arrayNode = tupleNode.children[0];

      expect(
        await decoder.pluck(data, arrayNode.location, arrayNode.size),
      ).to.equal(encode(["uint256[]"], [value[0]], true));

      const [rootChildLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(rootChildLocations.length).to.equal(root.children.length);
      expect(Number(rootChildLocations[0])).to.equal(tupleNode.location);

      const [tupleChildLocations] = await locator.getChildLocations(
        data,
        tupleNode.location,
        conditions,
        1,
      );
      expect(tupleChildLocations.length).to.equal(tupleNode.children.length);
      expect(Number(tupleChildLocations[0])).to.equal(arrayNode.location);

      const [arrayElementLocations] = await locator.getChildLocations(
        data,
        arrayNode.location,
        conditions,
        2,
      );
      expect(arrayElementLocations.length).to.equal(arrayNode.children.length);
      for (let i = 0; i < 3; i++) {
        expect(Number(arrayElementLocations[i])).to.equal(
          arrayNode.children[i].location,
        );
      }
    });

    it("Nested Arrays", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = [
        [1, 2],
        [3, 4, 5],
      ];
      const data = defaultAbiCoder.encode(["uint256[][]"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Matches,
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const outerArray = root.children[0];
      const innerArray1 = outerArray.children[0];
      const innerArray2 = outerArray.children[1];

      expect(
        await decoder.pluck(data, innerArray1.location, innerArray1.size),
      ).to.equal(encode(["uint256[]"], [value[0]], true));

      expect(
        await decoder.pluck(data, innerArray2.location, innerArray2.size),
      ).to.equal(encode(["uint256[]"], [value[1]], true));

      const [rootChildLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(rootChildLocations.length).to.equal(root.children.length);
      expect(Number(rootChildLocations[0])).to.equal(outerArray.location);

      const [innerArrayLocations] = await locator.getChildLocations(
        data,
        outerArray.location,
        conditions,
        1,
      );
      expect(innerArrayLocations.length).to.equal(outerArray.children.length);
      expect(Number(innerArrayLocations[0])).to.equal(innerArray1.location);
      expect(Number(innerArrayLocations[1])).to.equal(innerArray2.location);

      const [innerArray1Elements] = await locator.getChildLocations(
        data,
        innerArray1.location,
        conditions,
        2,
      );
      expect(innerArray1Elements.length).to.equal(innerArray1.children.length);
      for (let i = 0; i < 2; i++) {
        expect(Number(innerArray1Elements[i])).to.equal(
          innerArray1.children[i].location,
        );
      }
    });

    it("Deeply nested (4 levels)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const value = [[[[1, 2, 3]]]];
      const data = defaultAbiCoder.encode(["uint256[][][][]"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: Encoding.Array,
                    operator: Operator.Matches,
                    children: [
                      {
                        paramType: Encoding.Array,
                        operator: Operator.Matches,
                        children: [{ paramType: Encoding.Static }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const level1 = root.children[0];
      const level2 = level1.children[0];
      const level3 = level2.children[0];
      const level4 = level3.children[0];

      expect(await decoder.pluck(data, level4.location, level4.size)).to.equal(
        encode(["uint256[]"], [[1, 2, 3]], true),
      );

      const [l1Locations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(l1Locations.length).to.equal(root.children.length);
      expect(Number(l1Locations[0])).to.equal(level1.location);

      const [l2Locations] = await locator.getChildLocations(
        data,
        level1.location,
        conditions,
        1,
      );
      expect(l2Locations.length).to.equal(level1.children.length);
      expect(Number(l2Locations[0])).to.equal(level2.location);

      const [l3Locations] = await locator.getChildLocations(
        data,
        level2.location,
        conditions,
        2,
      );
      expect(l3Locations.length).to.equal(level2.children.length);
      expect(Number(l3Locations[0])).to.equal(level3.location);

      const [l4Locations] = await locator.getChildLocations(
        data,
        level3.location,
        conditions,
        3,
      );
      expect(l4Locations.length).to.equal(level3.children.length);
      expect(Number(l4Locations[0])).to.equal(level4.location);

      // Verify innermost array elements
      const [leafLocations] = await locator.getChildLocations(
        data,
        level4.location,
        conditions,
        4,
      );
      expect(leafLocations.length).to.equal(level4.children.length);
      for (let i = 0; i < 3; i++) {
        expect(Number(leafLocations[i])).to.equal(level4.children[i].location);
      }
    });
  });

  describe("Mixed Static and Dynamic Params", () => {
    it("(static, dynamic)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const staticValue = 999;
      const dynamicValue = "0xaabbccdd";
      const data = defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [staticValue, dynamicValue],
      );
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          { paramType: Encoding.Static },
          { paramType: Encoding.Dynamic },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      const staticNode = root.children[0];
      const dynamicNode = root.children[1];

      expect(
        await decoder.pluck(data, staticNode.location, staticNode.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [staticValue]));

      expect(
        await decoder.pluck(data, dynamicNode.location, dynamicNode.size),
      ).to.equal(encode(["bytes"], [dynamicValue], true));

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(staticNode.location);
      expect(Number(childLocations[1])).to.equal(dynamicNode.location);

      const staticSize = await locator.getSize(
        data,
        staticNode.location,
        conditions,
        1,
      );
      const dynamicSize = await locator.getSize(
        data,
        dynamicNode.location,
        conditions,
        2,
      );
      expect(Number(staticSize)).to.equal(staticNode.size);
      expect(Number(dynamicSize)).to.equal(dynamicNode.size);
    });

    it("(dynamic, static)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const dynamicValue = "0x1234";
      const staticValue = 42;
      const data = defaultAbiCoder.encode(
        ["bytes", "uint256"],
        [dynamicValue, staticValue],
      );
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Static },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      const dynamicNode = root.children[0];
      const staticNode = root.children[1];

      expect(
        await decoder.pluck(data, dynamicNode.location, dynamicNode.size),
      ).to.equal(encode(["bytes"], [dynamicValue], true));

      expect(
        await decoder.pluck(data, staticNode.location, staticNode.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [staticValue]));

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(dynamicNode.location);
      expect(Number(childLocations[1])).to.equal(staticNode.location);
    });

    it("(static, dynamic, static)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const values = [111, "0xdeadbeef", 222];
      const data = defaultAbiCoder.encode(
        ["uint256", "bytes", "uint256"],
        values,
      );
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          { paramType: Encoding.Static },
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Static },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      expect(
        await decoder.pluck(
          data,
          root.children[0].location,
          root.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [values[0]]));

      expect(
        await decoder.pluck(
          data,
          root.children[1].location,
          root.children[1].size,
        ),
      ).to.equal(encode(["bytes"], [values[1]], true));

      expect(
        await decoder.pluck(
          data,
          root.children[2].location,
          root.children[2].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [values[2]]));

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      for (let i = 0; i < 3; i++) {
        expect(Number(childLocations[i])).to.equal(root.children[i].location);
      }
    });

    it("(dynamic, dynamic, static)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const values = ["0xaa", "0xbbcc", 333];
      const data = defaultAbiCoder.encode(
        ["bytes", "bytes", "uint256"],
        values,
      );
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Static },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      expect(
        await decoder.pluck(
          data,
          root.children[0].location,
          root.children[0].size,
        ),
      ).to.equal(encode(["bytes"], [values[0]], true));

      expect(
        await decoder.pluck(
          data,
          root.children[1].location,
          root.children[1].size,
        ),
      ).to.equal(encode(["bytes"], [values[1]], true));

      const [childLocations] = await locator.getChildLocations(
        data,
        0,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      for (let i = 0; i < 3; i++) {
        expect(Number(childLocations[i])).to.equal(root.children[i].location);
      }
    });
  });

  describe("Real-World Function Signatures", () => {
    it("transfer(address,uint256)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const iface = Interface.from(["function transfer(address,uint256)"]);
      const to = "0x1234567890123456789012345678901234567890";
      const amount = 1000;
      const data = iface.encodeFunctionData("transfer", [to, amount]);

      // Default leadingBytes=4 for function selector
      const leadingBytes = 4;

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static },
          { paramType: Encoding.Static },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      expect(
        await decoder.pluck(
          data,
          root.children[0].location,
          root.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["address"], [to]));

      expect(
        await decoder.pluck(
          data,
          root.children[1].location,
          root.children[1].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [amount]));

      const [childLocations] = await locator.getChildLocations(
        data,
        leadingBytes,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(root.children[0].location);
      expect(Number(childLocations[1])).to.equal(root.children[1].location);
    });

    it("approve(address,uint256)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const iface = Interface.from(["function approve(address,uint256)"]);
      const spender = "0xabcdef0123456789abcdef0123456789abcdef01";
      const amount = 999999;
      const data = iface.encodeFunctionData("approve", [spender, amount]);

      // Default leadingBytes=4 for function selector
      const leadingBytes = 4;

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static },
          { paramType: Encoding.Static },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      expect(
        await decoder.pluck(
          data,
          root.children[0].location,
          root.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["address"], [spender]));

      const [childLocations] = await locator.getChildLocations(
        data,
        leadingBytes,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      expect(Number(childLocations[0])).to.equal(root.children[0].location);
      expect(Number(childLocations[1])).to.equal(root.children[1].location);
    });

    it("multicall(bytes[])", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const innerCalls = [
        Interface.from(["function a()"]).encodeFunctionData("a"),
        Interface.from(["function b(uint256)"]).encodeFunctionData("b", [42]),
      ];
      const iface = Interface.from(["function multicall(bytes[])"]);
      const data = iface.encodeFunctionData("multicall", [innerCalls]);

      // Default leadingBytes=4 for function selector
      const leadingBytes = 4;

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [{ paramType: Encoding.Dynamic }],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;
      const arrayNode = root.children[0];

      expect(
        await decoder.pluck(
          data,
          arrayNode.children[0].location,
          arrayNode.children[0].size,
        ),
      ).to.equal(encode(["bytes"], [innerCalls[0]], true));

      expect(
        await decoder.pluck(
          data,
          arrayNode.children[1].location,
          arrayNode.children[1].size,
        ),
      ).to.equal(encode(["bytes"], [innerCalls[1]], true));

      const [rootChildLocations] = await locator.getChildLocations(
        data,
        leadingBytes,
        conditions,
        0,
      );
      expect(rootChildLocations.length).to.equal(root.children.length);
      expect(Number(rootChildLocations[0])).to.equal(arrayNode.location);

      const [elementLocations] = await locator.getChildLocations(
        data,
        arrayNode.location,
        conditions,
        1,
      );
      expect(elementLocations.length).to.equal(arrayNode.children.length);
      expect(Number(elementLocations[0])).to.equal(
        arrayNode.children[0].location,
      );
      expect(Number(elementLocations[1])).to.equal(
        arrayNode.children[1].location,
      );
    });

    it("execTransaction(to,value,data,operation,safeTxGas,baseGas,gasPrice,gasToken,refundReceiver,signatures)", async () => {
      const { decoder, locator } = await loadFixture(setup);
      const iface = Interface.from([
        "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
      ]);

      const params = [
        "0x1111111111111111111111111111111111111111", // to
        1000, // value
        "0xabcdef", // data
        0, // operation
        100000, // safeTxGas
        50000, // baseGas
        1, // gasPrice
        "0x0000000000000000000000000000000000000000", // gasToken
        "0x2222222222222222222222222222222222222222", // refundReceiver
        "0x1234", // signatures
      ];

      const data = iface.encodeFunctionData("execTransaction", params);

      // Default leadingBytes=4 for function selector
      const leadingBytes = 4;

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          { paramType: Encoding.Static }, // to
          { paramType: Encoding.Static }, // value
          { paramType: Encoding.Dynamic }, // data
          { paramType: Encoding.Static }, // operation
          { paramType: Encoding.Static }, // safeTxGas
          { paramType: Encoding.Static }, // baseGas
          { paramType: Encoding.Static }, // gasPrice
          { paramType: Encoding.Static }, // gasToken
          { paramType: Encoding.Static }, // refundReceiver
          { paramType: Encoding.Dynamic }, // signatures
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const root = result;

      // Check 'to' address
      expect(
        await decoder.pluck(
          data,
          root.children[0].location,
          root.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["address"], [params[0]]));

      // Check 'data' bytes
      expect(
        await decoder.pluck(
          data,
          root.children[2].location,
          root.children[2].size,
        ),
      ).to.equal(encode(["bytes"], [params[2]], true));

      // Check 'signatures' bytes
      expect(
        await decoder.pluck(
          data,
          root.children[9].location,
          root.children[9].size,
        ),
      ).to.equal(encode(["bytes"], [params[9]], true));

      const [childLocations] = await locator.getChildLocations(
        data,
        leadingBytes,
        conditions,
        0,
      );
      expect(childLocations.length).to.equal(root.children.length);
      for (let i = 0; i < 10; i++) {
        expect(Number(childLocations[i])).to.equal(root.children[i].location);
      }
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

/**
 * Encodes data and optionally strips the first 32-byte offset pointer.
 */
function encode(types: string[], values: unknown[], stripOffset = false) {
  const encoded = defaultAbiCoder.encode(types, values);
  return stripOffset ? "0x" + encoded.slice(66) : encoded;
}
