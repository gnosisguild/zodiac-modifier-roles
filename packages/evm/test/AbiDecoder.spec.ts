import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface } from "ethers";

import { AbiType } from "./utils";
import { TypeTreeFlatStruct } from "../typechain-types/contracts/test/MockDecoder";

const AddressOne = "0x0000000000000000000000000000000000000001";
const defaultAbiCoder = AbiCoder.defaultAbiCoder();

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}

describe("AbiDecoder", () => {
  async function setup() {
    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return { decoder };
  }

  describe("Basic Types", () => {
    it("decodes static parameters", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function entrypoint(bytes4)",
      ]).encodeFunctionData("entrypoint", ["0xeeff3344"]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Static }],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const param = result.children[0];
      expect(await decoder.pluck(data, param.location, param.size)).to.equal(
        encode(["bytes4"], ["0xeeff3344"]),
      );
    });

    it("decodes dynamic parameters", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", ["0xaabbccdd"]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const param = result.children[0];
      expect(await decoder.pluck(data, param.location, param.size)).to.equal(
        encode(["bytes"], ["0xaabbccdd"], true),
      );
    });

    it("decodes mixed static and dynamic parameters", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function staticDynamic(uint256, bytes)",
      ]).encodeFunctionData("staticDynamic", [123, "0xaabbccddeeff"]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static },
          { paramType: AbiType.Dynamic },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);

      const firstParam = result.children[0];
      expect(
        await decoder.pluck(data, firstParam.location, firstParam.size),
      ).to.equal(encode(["uint256"], [123]));

      const secondParam = result.children[1];
      expect(
        await decoder.pluck(data, secondParam.location, secondParam.size),
      ).to.equal(encode(["bytes"], ["0xaabbccddeeff"], true));
    });
  });

  describe("Container Types - Tuples", () => {
    it("decodes static tuples", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function staticTuple(tuple(uint256 a, address b), uint256)",
      ]).encodeFunctionData("staticTuple", [{ a: 1999, b: AddressOne }, 2000]);

      const typeTree = treeToFlat({
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

      const result = await decoder.inspectRaw(data, typeTree);
      const tupleField = result.children[0];

      expect(
        await decoder.pluck(data, tupleField.location, tupleField.size),
      ).to.equal(encode(["tuple(uint256, address)"], [[1999, AddressOne]]));
    });

    it("decodes dynamic tuples", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function entrypoint(tuple(bytes dynamic))",
      ]).encodeFunctionData("entrypoint", [
        {
          dynamic: "0xabcd0011",
        },
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [{ paramType: AbiType.Dynamic }],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const tupleField = result.children[0];

      expect(
        await decoder.pluck(data, tupleField.location, tupleField.size),
      ).to.equal(encode(["tuple(bytes)"], [["0xabcd0011"]], true));
    });

    it("decodes nested tuples", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function entrypoint(tuple(uint256 a, bytes b, tuple(uint256 a, address b) c))",
      ]).encodeFunctionData("entrypoint", [
        {
          a: 2023,
          b: "0xbadfed",
          c: { a: 2020, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
        },
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static },
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const nestedField = result.children[0].children[2].children[0];

      expect(
        await decoder.pluck(data, nestedField.location, nestedField.size),
      ).to.equal(encode(["uint256"], [2020]));
    });

    it("decodes complex nested dynamic tuples", async () => {
      // dynamicTupleWithNestedDynamicTuple
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function entrypoint(tuple(bytes a, tuple(uint256 a, address b) b, uint256 c, tuple(bytes dynamic, uint256 _static, uint256[] dynamic32) d))",
      ]).encodeFunctionData("entrypoint", [
        {
          a: "0xbadfed",
          b: { a: 1234, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
          c: 2023,
          d: { dynamic: "0xdeadbeef", _static: 999, dynamic32: [6, 7, 8] },
        },
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
              { paramType: AbiType.Static },
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Dynamic },
                  { paramType: AbiType.Static },
                  {
                    paramType: AbiType.Array,
                    children: [{ paramType: AbiType.Static }],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const dynamicField = result.children[0].children[3].children[0];

      expect(
        await decoder.pluck(data, dynamicField.location, dynamicField.size),
      ).to.equal(encode(["bytes"], ["0xdeadbeef"], true));
    });
  });

  describe("Container Types - Arrays", () => {
    it("decodes static arrays", async () => {
      const { decoder } = await loadFixture(setup);
      // staticDynamicDynamic32
      const data = Interface.from([
        "function entrypoint(address, bytes, uint256[])",
      ]).encodeFunctionData("entrypoint", [AddressOne, "0xabcd", [10, 32, 55]]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static },
          { paramType: AbiType.Dynamic },
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Static }],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const arrayField = result.children[2];

      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["uint256[]"], [[10, 32, 55]], true));
    });

    it("decodes dynamic arrays", async () => {
      const { decoder } = await loadFixture(setup);
      // dynamicArray
      const data = Interface.from([
        "function entrypoint(bytes[])",
      ]).encodeFunctionData("entrypoint", [["0xaabbcc", "0x004466ff00"]]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Dynamic }],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const arrayField = result.children[0];

      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["bytes[]"], [["0xaabbcc", "0x004466ff00"]], true));
    });

    it("decodes arrays with static tuple items", async () => {
      const { decoder } = await loadFixture(setup);

      // arrayStaticTupleItems
      const data = Interface.from([
        "function f(tuple(uint256 a, address b)[])",
      ]).encodeFunctionData("f", [
        [
          { a: 95623, b: "0x00000000219ab540356cbb839cbe05303d7705fa" },
          { a: 11542, b: "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0" },
        ],
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const [, arrayEntry2] = result.children[0].children;

      expect(result.children[0].children).lengthOf(2);
      expect(
        await decoder.pluck(data, arrayEntry2.location, arrayEntry2.size),
      ).to.equal(
        encode(
          ["tuple(uint256,address)"],
          [[11542, "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0"]],
        ),
      );
    });

    it("decodes arrays with dynamic tuple items", async () => {
      const { decoder } = await loadFixture(setup);
      // arrayDynamicTupleItems
      const data = Interface.from([
        "function f(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32)[])",
      ]).encodeFunctionData("f", [
        [
          { dynamic: "0xbadfed", _static: 9998877, dynamic32: [7, 9] },
          { dynamic: "0x0badbeef", _static: 444555, dynamic32: [4, 5, 6] },
        ],
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Dynamic },
                  { paramType: AbiType.Static },
                  {
                    paramType: AbiType.Array,
                    children: [{ paramType: AbiType.Static }],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const arrayEntry = result.children[0].children[0];
      const dynamicField = arrayEntry.children[0];

      expect(
        await decoder.pluck(data, dynamicField.location, dynamicField.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], true));
    });

    it("decodes tuples with nested arrays", async () => {
      const { decoder } = await loadFixture(setup);
      // dynamicTupleWithNestedArray
      const data = Interface.from([
        "function f(tuple(uint256 a, bytes b, tuple(uint256 a, address b)[] c))",
      ]).encodeFunctionData("f", [
        {
          a: 21000,
          b: "0x0badbeef",
          c: [{ a: 10, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" }],
        },
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Static },
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.Array,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    children: [
                      { paramType: AbiType.Static },
                      { paramType: AbiType.Static },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const arrayField = result.children[0].children[2];

      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(
        encode(
          ["tuple(uint256,address)[]"],
          [[[10, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]]],
          true,
        ),
      );
    });
  });

  describe("Embedded Encoded Data", () => {
    it("decodes embedded calldata", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = Interface.from([
        "function embedded((uint256, address))",
      ]).encodeFunctionData("embedded", [[12345, AddressOne]]);

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Calldata,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const embeddedTuple = result.children[0].children[0];
      const staticField = embeddedTuple.children[0];

      expect(
        await decoder.pluck(data, staticField.location, staticField.size),
      ).to.equal(encode(["uint256"], [12345]));
    });

    it("decodes embedded abi-encoded data", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["tuple(uint256, string)"],
        [[12345, "Johnny Doe"]],
      );

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.AbiEncoded,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Dynamic },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const embeddedTuple = result.children[0].children[0];
      const dynamicField = embeddedTuple.children[1];

      expect(
        await decoder.pluck(data, dynamicField.location, dynamicField.size),
      ).to.equal(encode(["string"], ["Johnny Doe"], true));
    });

    it("decodes dynamic tuple from embedded calldata with selector", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = hre.ethers.Interface.from([
        "function embedded((uint256, string))",
      ]).encodeFunctionData("embedded", [[12345, "Johnny Doe"]]);

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Calldata,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Dynamic },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const embeddedTuple = result.children[0].children[0];
      const staticField = embeddedTuple.children[0];
      const dynamicField = embeddedTuple.children[1];

      expect(
        await decoder.pluck(data, staticField.location, staticField.size),
      ).to.equal(encode(["uint256"], [12345]));

      expect(
        await decoder.pluck(data, dynamicField.location, dynamicField.size),
      ).to.equal(encode(["string"], ["Johnny Doe"], true));
    });

    it("decodes static tuple from embedded abi-encoded data", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["tuple(uint256, address)"],
        [[12345, AddressOne]],
      );

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.AbiEncoded,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const embeddedTuple = result.children[0].children[0];
      const staticField1 = embeddedTuple.children[0];
      const staticField2 = embeddedTuple.children[1];

      expect(
        await decoder.pluck(data, staticField1.location, staticField1.size),
      ).to.equal(encode(["uint256"], [12345]));

      expect(
        await decoder.pluck(data, staticField2.location, staticField2.size),
      ).to.equal(encode(["address"], [AddressOne]));
    });

    it("decodes nested calldata within tuples", async () => {
      const { decoder } = await loadFixture(setup);

      const nestedData = Interface.from([
        "function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))",
      ]).encodeFunctionData("dynamicTuple", [
        {
          dynamic: "0x00",
          _static: 9922,
          dynamic32: [55, 66, 88],
        },
      ]);

      const data = Interface.from([
        "function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))",
      ]).encodeFunctionData("dynamicTuple", [
        {
          dynamic: nestedData,
          _static: 0,
          dynamic32: [],
        },
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              {
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    children: [
                      { paramType: AbiType.Dynamic },
                      { paramType: AbiType.Static },
                      {
                        paramType: AbiType.Array,
                        children: [{ paramType: AbiType.Static }],
                      },
                    ],
                  },
                ],
              },
              { paramType: AbiType.Static },
              {
                paramType: AbiType.Array,
                children: [{ paramType: AbiType.Static }],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const nestedDynamicField =
        result.children[0].children[0].children[0].children[0];

      expect(
        await decoder.pluck(
          data,
          nestedDynamicField.location,
          nestedDynamicField.size,
        ),
      ).to.equal(encode(["bytes"], ["0x00"], true));
    });

    it("decodes nested calldata within arrays", async () => {
      const { decoder } = await loadFixture(setup);

      const nestedData1 = Interface.from([
        "function dynamicStaticDynamic32(bytes, bool, bytes2[])",
      ]).encodeFunctionData("dynamicStaticDynamic32", [
        "0xaabbccdd",
        true,
        ["0xaabb", "0xf26b"],
      ]);
      const nestedData2 = Interface.from([
        "function dynamicStaticDynamic32(bytes, bool, bytes2[])",
      ]).encodeFunctionData("dynamicStaticDynamic32", [
        "0x22334455",
        false,
        [],
      ]);

      const data = Interface.from([
        "function dynamicArray(bytes[])",
      ]).encodeFunctionData("dynamicArray", [[nestedData1, nestedData2]]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [
              {
                paramType: AbiType.Calldata,
                children: [
                  { paramType: AbiType.Dynamic },
                  { paramType: AbiType.Static },
                  {
                    paramType: AbiType.Array,
                    children: [{ paramType: AbiType.Static }],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const arrayField1 = result.children[0].children[0].children[2];
      const staticField2 = result.children[0].children[1].children[1];

      expect(
        await decoder.pluck(data, arrayField1.location, arrayField1.size),
      ).to.equal(encode(["bytes2[]"], [["0xaabb", "0xf26b"]], true));

      expect(
        await decoder.pluck(data, staticField2.location, staticField2.size),
      ).to.equal(encode(["bool"], [false]));
    });

    it("decodes complex embedded abi-encoded data", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["bytes", "bool", "bytes2[]"],
        ["0xbadfed", true, ["0xccdd", "0x3333"]],
      );

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.AbiEncoded,
            children: [
              { paramType: AbiType.Dynamic },
              { paramType: AbiType.Static },
              {
                paramType: AbiType.Array,
                children: [{ paramType: AbiType.Static }],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const dynamicField = result.children[0].children[0];
      const arrayField = result.children[0].children[2];

      expect(
        await decoder.pluck(data, dynamicField.location, dynamicField.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], true));

      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["bytes2[]"], [["0xccdd", "0x3333"]], true));
    });
  });

  describe("Complex Scenarios & Edge Cases", () => {
    it("handles empty dynamic buffer", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", ["0x"]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const parameter = result.children[0];

      expect(parameter.location).to.equal(36);
      expect(
        await decoder.pluck(data, parameter.location, parameter.size),
      ).to.equal(encode(["bytes"], ["0x"], true));
    });

    it("handles mixed parameter ordering (static, dynamic, array)", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function staticDynamicDynamic32(address, bytes, uint256[])",
      ]).encodeFunctionData("staticDynamicDynamic32", [
        AddressOne,
        "0xabcd",
        [10, 32, 55],
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static },
          { paramType: AbiType.Dynamic },
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Static }],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);

      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(encode(["address"], [AddressOne]));

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(encode(["bytes"], ["0xabcd"], true));

      expect(
        await decoder.pluck(
          data,
          result.children[2].location,
          result.children[2].size,
        ),
      ).to.equal(encode(["uint256[]"], [[10, 32, 55]], true));
    });

    it("handles mixed parameter ordering (dynamic, static, array)", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function dynamicStaticDynamic32(bytes, bool, bytes2[])",
      ]).encodeFunctionData("dynamicStaticDynamic32", [
        "0x12ab45",
        false,
        ["0x1122", "0x3344", "0x5566"],
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Dynamic },
          { paramType: AbiType.Static },
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Static }],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);

      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(encode(["bytes"], ["0x12ab45"], true));

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(encode(["bool"], [false]));

      expect(
        await decoder.pluck(
          data,
          result.children[2].location,
          result.children[2].size,
        ),
      ).to.equal(encode(["bytes2[]"], [["0x1122", "0x3344", "0x5566"]], true));
    });

    it("handles deeply nested structures with multiple levels", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function dynamicTupleWithNestedDynamicTuple(tuple(bytes a, tuple(uint256 a, address b) b, uint256 c, tuple(bytes dynamic, uint256 _static, uint256[] dynamic32) d))",
      ]).encodeFunctionData("dynamicTupleWithNestedDynamicTuple", [
        {
          a: "0xbadfed",
          b: { a: 1234, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
          c: 2023,
          d: { dynamic: "0xdeadbeef", _static: 999, dynamic32: [6, 7, 8] },
        },
      ]);

      const typeTree = treeToFlat({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
              { paramType: AbiType.Static },
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Dynamic },
                  { paramType: AbiType.Static },
                  {
                    paramType: AbiType.Array,
                    children: [{ paramType: AbiType.Static }],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspectRaw(data, typeTree);
      const field_0 = result.children[0].children[0];
      const field_3_0 = result.children[0].children[3].children[0];

      expect(
        await decoder.pluck(data, field_0.location, field_0.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], true));

      expect(
        await decoder.pluck(data, field_3_0.location, field_3_0.size),
      ).to.equal(encode(["bytes"], ["0xdeadbeef"], true));
    });
  });
});

// Simple tree node interface
interface TreeNode {
  paramType: AbiType;
  children?: TreeNode[];
}

function treeToFlat(root: TreeNode): TypeTreeFlatStruct[] {
  const result: TypeTreeFlatStruct[] = [];
  const queue: { node: TreeNode; parentIndex: number }[] = [
    { node: root, parentIndex: -1 },
  ];

  while (queue.length > 0) {
    const { node, parentIndex } = queue.shift()!;
    const bfsOrder = result.length;

    // Add current node to result
    result.push({
      _type: node.paramType,
      fields: [],
    });

    // If this node has a parent, add current index to parent's fields
    if (parentIndex >= 0) {
      result[parentIndex].fields.push(bfsOrder);
    }

    // Queue all children with current node as parent
    for (const child of node.children || []) {
      queue.push({ node: child, parentIndex: bfsOrder });
    }
  }

  return result;
}
