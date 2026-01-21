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
    return { decoder };
  }

  describe("Leaf Types", () => {
    it("Static", async () => {
      const { decoder } = await loadFixture(setup);
      const value = 123;
      const data = defaultAbiCoder.encode(["uint256"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Static }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const node = result.children[0];

      expect(node.inlined).to.equal(true);
      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        defaultAbiCoder.encode(["uint256"], [value]),
      );
    });

    it("Dynamic (aligned length)", async () => {
      const { decoder } = await loadFixture(setup);
      const value = new Uint8Array(32).fill(1);
      const data = defaultAbiCoder.encode(["bytes"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const node = result.children[0];

      expect(node.inlined).to.equal(false);
      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        encode(["bytes"], [value], true),
      );
    });

    it("Dynamic (unaligned length - padding)", async () => {
      const { decoder } = await loadFixture(setup);
      const value = new Uint8Array(33).fill(1);
      const data = defaultAbiCoder.encode(["bytes"], [value]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const node = result.children[0];

      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        encode(["bytes"], [value], true),
      );
    });

    it("Dynamic (empty - zero length)", async () => {
      const { decoder } = await loadFixture(setup);
      const data = defaultAbiCoder.encode(["bytes"], ["0x"]);
      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [{ paramType: Encoding.Dynamic }],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const node = result.children[0];

      expect(node.size).to.equal(32);
      expect(await decoder.pluck(data, node.location, node.size)).to.equal(
        encode(["bytes"], ["0x"], true),
      );
    });
  });

  describe("Containers (Depth 1)", () => {
    describe("Tuple", () => {
      it("static-only (inlined)", async () => {
        const { decoder } = await loadFixture(setup);
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
        const tupleNode = result.children[0];

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
      });

      it("with dynamic child (pointer-based)", async () => {
        const { decoder } = await loadFixture(setup);
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
        const tupleNode = result.children[0];

        expect(tupleNode.inlined).to.equal(false);
        expect(
          await decoder.pluck(data, tupleNode.location, tupleNode.size),
        ).to.equal(encode(["tuple(bytes)"], [value], true));

        // Granular: pluck the dynamic bytes element
        const bytesNode = tupleNode.children[0];
        expect(
          await decoder.pluck(data, bytesNode.location, bytesNode.size),
        ).to.equal(encode(["bytes"], [value[0]], true));
      });
    });

    describe("Array", () => {
      it("static elements", async () => {
        const { decoder } = await loadFixture(setup);
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
        const arrayNode = result.children[0];

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
      });

      it("dynamic elements", async () => {
        const { decoder } = await loadFixture(setup);
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
        const arrayNode = result.children[0];

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
      });

      it("empty (length = 0)", async () => {
        const { decoder } = await loadFixture(setup);
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
        const arrayNode = result.children[0];

        expect(arrayNode.size).to.equal(32);
        expect(arrayNode.children).to.have.length(0);
      });

      it("with embedded calldata elements (selector)", async () => {
        const { decoder } = await loadFixture(setup);

        const embedded1 = Interface.from([
          "function embedded(uint256)",
        ]).encodeFunctionData("embedded", [12345]);

        const embedded2 = Interface.from([
          "function embedded(uint256)",
        ]).encodeFunctionData("embedded", [67890]);

        const data = Interface.from([
          "function test(bytes[])",
        ]).encodeFunctionData("test", [[embedded1, embedded2]]);

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
        const arrayNode = result.children[0];

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
      });
    });

    describe("AbiEncoded", () => {
      it("leadingBytes = 0", async () => {
        const { decoder } = await loadFixture(setup);
        const innerValue = 123;
        const innerEncoded = defaultAbiCoder.encode(["uint256"], [innerValue]);
        const data = defaultAbiCoder.encode(["bytes"], [innerEncoded]);

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
        const innerNode = result.children[0].children[0];

        expect(
          await decoder.pluck(data, innerNode.location, innerNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [innerValue]));
      });

      it("leadingBytes = 4 (default)", async () => {
        const { decoder } = await loadFixture(setup);
        const innerValue = 123;
        const selector = "0x12345678";
        const innerEncoded = defaultAbiCoder.encode(["uint256"], [innerValue]);
        const payloadWithSelector = selector + innerEncoded.slice(2);
        const data = defaultAbiCoder.encode(["bytes"], [payloadWithSelector]);

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
        const innerNode = result.children[0].children[0];

        expect(
          await decoder.pluck(data, innerNode.location, innerNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [innerValue]));
      });

      it("custom leadingBytes", async () => {
        const { decoder } = await loadFixture(setup);
        const innerValue = 999;
        const padding = "0xffff"; // 2 bytes
        const innerEncoded = defaultAbiCoder.encode(["uint256"], [innerValue]);
        const payload = padding + innerEncoded.slice(2);
        const data = defaultAbiCoder.encode(["bytes"], [payload]);

        const conditions = flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0002", // 2
              children: [{ paramType: Encoding.Static }],
            },
          ],
        });

        const result = toTree(await decoder.inspect(data, conditions));
        const staticNode = result.children[0].children[0];

        expect(
          await decoder.pluck(data, staticNode.location, staticNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [innerValue]));
      });
    });
  });

  describe("Nesting (Depth 2+)", () => {
    it("Tuple containing Array", async () => {
      const { decoder } = await loadFixture(setup);
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
      const tupleNode = result.children[0];
      const arrayNode = tupleNode.children[0];

      expect(
        await decoder.pluck(data, arrayNode.location, arrayNode.size),
      ).to.equal(encode(["uint256[]"], [value[0]], true));

      // Granular: pluck the containing tuple
      expect(
        await decoder.pluck(data, tupleNode.location, tupleNode.size),
      ).to.equal(encode(["tuple(uint256[])"], [value], true));

      // Granular: pluck individual array elements within the tuple
      for (let i = 0; i < value[0].length; i++) {
        expect(
          await decoder.pluck(
            data,
            arrayNode.children[i].location,
            arrayNode.children[i].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [value[0][i]]));
      }
    });

    it("Array containing Tuple", async () => {
      const { decoder } = await loadFixture(setup);
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
      const arrayNode = result.children[0];

      expect(
        await decoder.pluck(data, arrayNode.location, arrayNode.size),
      ).to.equal(encode(["tuple(uint256, uint256)[]"], [value], true));

      // Granular: pluck individual tuples from the array
      for (let i = 0; i < value.length; i++) {
        const tupleNode = arrayNode.children[i];
        expect(
          await decoder.pluck(data, tupleNode.location, tupleNode.size),
        ).to.equal(
          defaultAbiCoder.encode(["tuple(uint256,uint256)"], [value[i]]),
        );

        // Granular: pluck individual elements within each tuple
        expect(
          await decoder.pluck(
            data,
            tupleNode.children[0].location,
            tupleNode.children[0].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [value[i][0]]));
        expect(
          await decoder.pluck(
            data,
            tupleNode.children[1].location,
            tupleNode.children[1].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [value[i][1]]));
      }
    });

    it("Container with AbiEncoded child", async () => {
      const { decoder } = await loadFixture(setup);
      const inner1 = defaultAbiCoder.encode(["uint256"], [1]);
      const inner2 = defaultAbiCoder.encode(["uint256"], [2]);
      const value = [inner1, inner2];
      const data = defaultAbiCoder.encode(["bytes[]"], [value]);

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
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0000",
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const arrayNode = result.children[0];
      const innerNode = arrayNode.children[0].children[0];

      expect(
        await decoder.pluck(data, innerNode.location, innerNode.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [1]));

      // Granular: pluck the containing array
      expect(
        await decoder.pluck(data, arrayNode.location, arrayNode.size),
      ).to.equal(encode(["bytes[]"], [value], true));

      // Granular: pluck the static value inside each AbiEncoded element
      for (let i = 0; i < value.length; i++) {
        const abiEncodedNode = arrayNode.children[i];
        const staticNode = abiEncodedNode.children[0];
        expect(
          await decoder.pluck(data, staticNode.location, staticNode.size),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [i + 1]));
      }
    });

    it("Deep nesting (3-4 levels)", async () => {
      const { decoder } = await loadFixture(setup);
      const innerArray = defaultAbiCoder.encode(
        ["bytes[]"],
        [["0xaa", "0xbb"]],
      );
      const value = [innerArray];
      const data = defaultAbiCoder.encode(["tuple(bytes)"], [value]);

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
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const tupleNode = result.children[0];
      const abiEncodedNode = tupleNode.children[0];
      const deepArrayNode = abiEncodedNode.children[0];

      expect(
        await decoder.pluck(data, deepArrayNode.location, deepArrayNode.size),
      ).to.equal(encode(["bytes[]"], [["0xaa", "0xbb"]], true));

      // Granular: pluck the outer tuple
      expect(
        await decoder.pluck(data, tupleNode.location, tupleNode.size),
      ).to.equal(encode(["tuple(bytes)"], [value], true));

      // Granular: pluck individual bytes elements from the deep array
      const innerValues = ["0xaa", "0xbb"];
      for (let i = 0; i < innerValues.length; i++) {
        expect(
          await decoder.pluck(
            data,
            deepArrayNode.children[i].location,
            deepArrayNode.children[i].size,
          ),
        ).to.equal(encode(["bytes"], [innerValues[i]], true));
      }
    });
  });

  describe("Variants", () => {
    it("Or - one valid branch", async () => {
      const { decoder } = await loadFixture(setup);
      const validValue = 123;
      const innerData = defaultAbiCoder.encode(["uint256"], [validValue]);
      const data = defaultAbiCoder.encode(["bytes"], [innerData]);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0000",
                children: [
                  { paramType: Encoding.Static },
                  { paramType: Encoding.Static },
                ],
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0000",
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const variantNode = result.children[0];

      expect(variantNode.variant).to.equal(true);
      expect(variantNode.children[0].overflow).to.equal(true);
      expect(variantNode.children[1].overflow).to.equal(false);

      const validChild = variantNode.children[1].children[0];
      expect(
        await decoder.pluck(data, validChild.location, validChild.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [validValue]));
    });

    it("Or - all valid branches", async () => {
      const { decoder } = await loadFixture(setup);
      const val = 12345;
      const inner = defaultAbiCoder.encode(["uint256"], [val]);
      const data = defaultAbiCoder.encode(["bytes"], [inner]);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              { paramType: Encoding.Dynamic },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0000",
                children: [{ paramType: Encoding.Static }],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const variantNode = result.children[0];

      expect(variantNode.children[0].overflow).to.equal(false);
      expect(variantNode.children[1].overflow).to.equal(false);
    });

    it("And", async () => {
      const { decoder } = await loadFixture(setup);
      const val1 = 1;
      const val2 = 999;
      const innerTuple = defaultAbiCoder.encode(
        ["tuple(uint256,uint256)"],
        [[val1, val2]],
      );
      const data = defaultAbiCoder.encode(["bytes"], [innerTuple]);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              { paramType: Encoding.Dynamic },
              {
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
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const variantNode = result.children[0];

      expect(variantNode.variant).to.equal(true);
      expect(variantNode.children).to.have.length(2);

      const tupleNode = variantNode.children[1].children[0];
      expect(
        await decoder.pluck(
          data,
          tupleNode.children[0].location,
          tupleNode.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [val1]));
    });

    it("Or - branches with different tuple layouts", async () => {
      const { decoder } = await loadFixture(setup);

      const AddressOne = "0x0000000000000000000000000000000000000001";

      // Data encodes tuple(uint256, address) - matches branch 1 (static, static)
      // Branch 2 expects tuple(bytes, address) which would overflow
      const data = Interface.from(["function test(bytes)"]).encodeFunctionData(
        "test",
        [
          defaultAbiCoder.encode(
            ["tuple(uint256,address)"],
            [[123, AddressOne]],
          ),
        ],
      );

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.Or,
            children: [
              // Branch 1: tuple(uint256, address) - both static
              {
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
              },
              // Branch 2: tuple(bytes, address) - first dynamic
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0000",
                children: [
                  {
                    paramType: Encoding.Tuple,
                    operator: Operator.Matches,
                    children: [
                      { paramType: Encoding.Dynamic },
                      { paramType: Encoding.Static },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const variantNode = result.children[0];

      expect(variantNode.variant).to.equal(true);
      expect(variantNode.children).to.have.length(2);

      // Branch 1 succeeds (static tuple matches)
      expect(variantNode.children[0].overflow).to.equal(false);

      // Branch 2 fails (data doesn't match dynamic tuple layout)
      expect(variantNode.children[1].overflow).to.equal(true);

      // Verify we can pluck from the successful branch
      const successfulTuple = variantNode.children[0].children[0];
      expect(
        await decoder.pluck(
          data,
          successfulTuple.location,
          successfulTuple.size,
        ),
      ).to.equal(
        defaultAbiCoder.encode(["tuple(uint256,address)"], [[123, AddressOne]]),
      );
    });

    it("Matches (indexed pattern)", async () => {
      const { decoder } = await loadFixture(setup);
      const value = [42, 100];
      const data = defaultAbiCoder.encode(["uint256[]"], [value]);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Static },
              { paramType: Encoding.Static },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const arrayNode = result.children[0];

      expect(arrayNode.children).to.have.length(2);
      expect(
        await decoder.pluck(data, arrayNode.location, arrayNode.size),
      ).to.equal(encode(["uint256[]"], [value], true));

      // Granular: pluck individual indexed elements
      for (let i = 0; i < value.length; i++) {
        expect(
          await decoder.pluck(
            data,
            arrayNode.children[i].location,
            arrayNode.children[i].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [value[i]]));
      }
    });

    it("Matches with fallback to first layout child", async () => {
      const { decoder } = await loadFixture(setup);
      // 5 elements but only 2 layout children: indices >= 2 fallback to [0]
      const data = defaultAbiCoder.encode(
        ["uint256[]"],
        [[10, 20, 30, 40, 50]],
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
              { paramType: Encoding.Static },
              { paramType: Encoding.Static },
            ],
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const arrayNode = result.children[0];
      const values = [10, 20, 30, 40, 50];

      expect(arrayNode.children).to.have.length(5);
      expect(
        await decoder.pluck(
          data,
          arrayNode.children[4].location,
          arrayNode.children[4].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [50]));

      // Granular: pluck all elements including those that fallback to first layout
      for (let i = 0; i < values.length; i++) {
        expect(
          await decoder.pluck(
            data,
            arrayNode.children[i].location,
            arrayNode.children[i].size,
          ),
        ).to.equal(defaultAbiCoder.encode(["uint256"], [values[i]]));
      }
    });

    it("Matches with heterogeneous types (Dynamic, AbiEncoded)", async () => {
      const { decoder } = await loadFixture(setup);

      const AddressOne = "0x0000000000000000000000000000000000000001";

      // Element 0: raw bytes (Dynamic)
      // Element 1: AbiEncoded with selector (function call)
      // Element 2: AbiEncoded without selector (raw tuple)
      const rawBytes = "0xaabbccdd";
      const embedded = Interface.from([
        "function embedded(uint256)",
      ]).encodeFunctionData("embedded", [12345]);
      const tupleEncoded = defaultAbiCoder.encode(
        ["tuple(uint256,address)"],
        [[67890, AddressOne]],
      );

      const data = Interface.from([
        "function test(bytes[])",
      ]).encodeFunctionData("test", [[rawBytes, embedded, tupleEncoded]]);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Array,
            operator: Operator.Matches,
            children: [
              { paramType: Encoding.Dynamic },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                children: [{ paramType: Encoding.Static }],
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                compValue: "0x0000", // leadingBytes = 0 (no selector)
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
          },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));
      const arrayNode = result.children[0];

      expect(arrayNode.children).to.have.length(3);

      // Element 0: Dynamic (raw bytes) - no children
      const dynamicElement = arrayNode.children[0];
      expect(dynamicElement.children).to.have.length(0);

      // Element 1: AbiEncoded with selector - has static param child
      const abiEncodedWithSelector = arrayNode.children[1];
      expect(abiEncodedWithSelector.children).to.have.length(1);
      const staticParam = abiEncodedWithSelector.children[0];
      expect(
        await decoder.pluck(data, staticParam.location, staticParam.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [12345]));

      // Element 2: AbiEncoded without selector - has tuple child
      const abiEncodedNoSelector = arrayNode.children[2];
      expect(abiEncodedNoSelector.children).to.have.length(1);
      const tupleNode = abiEncodedNoSelector.children[0];
      expect(
        await decoder.pluck(data, tupleNode.location, tupleNode.size),
      ).to.equal(
        defaultAbiCoder.encode(
          ["tuple(uint256,address)"],
          [[67890, AddressOne]],
        ),
      );
    });

    it("direct location/size verification", async () => {
      const { decoder } = await loadFixture(setup);
      const data = defaultAbiCoder.encode(["uint256[]"], [[111, 222]]);

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
      const arrayNode = result.children[0];

      expect(arrayNode.location).to.equal(32);
      expect(arrayNode.size).to.equal(96);
      expect(arrayNode.children[0].location).to.equal(64);
      expect(arrayNode.children[1].location).to.equal(96);

      // Granular: pluck individual elements to verify they return correct data
      expect(
        await decoder.pluck(
          data,
          arrayNode.children[0].location,
          arrayNode.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [111]));
      expect(
        await decoder.pluck(
          data,
          arrayNode.children[1].location,
          arrayNode.children[1].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [222]));
    });
  });

  describe("Layout Consistency", () => {
    it("Multiple sequential dynamics", async () => {
      const { decoder } = await loadFixture(setup);
      const value = ["0xaa", "0xbb"];
      const data = defaultAbiCoder.encode(["bytes", "bytes"], value);

      const conditions = flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x0000",
        children: [
          { paramType: Encoding.Dynamic },
          { paramType: Encoding.Dynamic },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));

      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(encode(["bytes"], [value[0]], true));
      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(encode(["bytes"], [value[1]], true));
    });

    it("Mixed static/dynamic ordering", async () => {
      const { decoder } = await loadFixture(setup);
      const tupleValue = [1999, "0x0000000000000000000000000000000000000001"];
      const uintValue = 2000;
      const data = defaultAbiCoder.encode(
        ["tuple(uint256, address)", "uint256"],
        [tupleValue, uintValue],
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
          { paramType: Encoding.Static },
        ],
      });

      const result = toTree(await decoder.inspect(data, conditions));

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [uintValue]));

      // Granular: pluck the tuple and its individual static elements
      const tupleNode = result.children[0];
      expect(
        await decoder.pluck(data, tupleNode.location, tupleNode.size),
      ).to.equal(
        defaultAbiCoder.encode(["tuple(uint256, address)"], [tupleValue]),
      );

      expect(
        await decoder.pluck(
          data,
          tupleNode.children[0].location,
          tupleNode.children[0].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [tupleValue[0]]));
      expect(
        await decoder.pluck(
          data,
          tupleNode.children[1].location,
          tupleNode.children[1].size,
        ),
      ).to.equal(defaultAbiCoder.encode(["address"], [tupleValue[1]]));
    });
  });
});

function encode(types: string[], values: unknown[], removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}

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
