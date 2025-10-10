import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface } from "ethers";

import { AbiType, flattenCondition, Operator } from "../utils";

const AddressOne = "0x0000000000000000000000000000000000000001";
const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("AbiDecoder - Plucking", () => {
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

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Static }],
      });

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      const result = await decoder.inspect(data, conditions);
      const param = result.children[0];
      expect(await decoder.pluck(data, param.location, param.size)).to.equal(
        encode(["bytes"], ["0xaabbccdd"], true),
      );
    });

    it("decodes mixed static and dynamic parameters", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function staticDynamic(uint256, bytes)",
      ]).encodeFunctionData("staticDynamic", [956, "0xaabbccddeeff"]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          { paramType: AbiType.Static },
          { paramType: AbiType.Dynamic },
        ],
      });

      const result = await decoder.inspect(data, conditions);

      const firstParam = result.children[0];
      expect(
        await decoder.pluck(data, firstParam.location, firstParam.size),
      ).to.equal(encode(["uint256"], [956]));

      const secondParam = result.children[1];
      expect(
        await decoder.pluck(data, secondParam.location, secondParam.size),
      ).to.equal(encode(["bytes"], ["0xaabbccddeeff"], true));
    });
  });

  describe("Container Types - Tuples", () => {
    // este aqui
    it("decodes static tuples", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function staticTuple(tuple(uint256 a, address b), uint256)",
      ]).encodeFunctionData("staticTuple", [{ a: 1999, b: AddressOne }, 2000]);

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

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Tuple,
            children: [{ paramType: AbiType.Dynamic }],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);

      // First field: a (uint256) = 2023
      const field_a = result.children[0].children[0];
      expect(
        await decoder.pluck(data, field_a.location, field_a.size),
      ).to.equal(encode(["uint256"], [2023]));

      // Second field: b (bytes) = "0xbadfed"
      const field_b = result.children[0].children[1];
      expect(
        await decoder.pluck(data, field_b.location, field_b.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], true));

      // Third field: c.a (uint256) = 2020
      // Fourth field: c.b (address) = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
      const [field_c_a, field_c_b] = result.children[0].children[2].children;
      expect(
        await decoder.pluck(data, field_c_a.location, field_c_a.size),
      ).to.equal(encode(["uint256"], [2020]));

      //  const field_c_b = result.children[0].children[2].children[1];
      expect(
        await decoder.pluck(data, field_c_b.location, field_c_b.size),
      ).to.equal(
        encode(["address"], ["0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]),
      );
    });

    it("decodes complex nested dynamic tuples", async () => {
      // dynamicTupleWithNestedDynamicTuple
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function f(tuple(bytes a, tuple(uint256 a, address b) b, uint256 c, tuple(bytes dynamic, uint256 _static, uint256[] dynamic32) d))",
      ]).encodeFunctionData("f", [
        {
          a: "0xbadfed",
          b: { a: 1234, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
          c: 2023,
          d: { dynamic: "0xdeadbeef", _static: 999, dynamic32: [6, 7, 8] },
        },
      ]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);

      // First field: a (bytes) = "0xbadfed"
      const field_a = result.children[0].children[0];
      expect(
        await decoder.pluck(data, field_a.location, field_a.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], true));

      // Second field: b.a (uint256) = 1234
      const field_b_a = result.children[0].children[1].children[0];
      expect(
        await decoder.pluck(data, field_b_a.location, field_b_a.size),
      ).to.equal(encode(["uint256"], [1234]));

      // Third field: b.b (address) = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
      const field_b_b = result.children[0].children[1].children[1];
      expect(
        await decoder.pluck(data, field_b_b.location, field_b_b.size),
      ).to.equal(
        encode(["address"], ["0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]),
      );

      // Fourth field: c (uint256) = 2023
      const field_c = result.children[0].children[2];
      expect(
        await decoder.pluck(data, field_c.location, field_c.size),
      ).to.equal(encode(["uint256"], [2023]));

      // Fifth field: d.dynamic (bytes) = "0xdeadbeef"
      const field_d_dynamic = result.children[0].children[3].children[0];
      expect(
        await decoder.pluck(
          data,
          field_d_dynamic.location,
          field_d_dynamic.size,
        ),
      ).to.equal(encode(["bytes"], ["0xdeadbeef"], true));

      // Sixth field: d._static (uint256) = 999
      const field_d_static = result.children[0].children[3].children[1];
      expect(
        await decoder.pluck(data, field_d_static.location, field_d_static.size),
      ).to.equal(encode(["uint256"], [999]));

      // Seventh field: d.dynamic32 (uint256[]) = [6, 7, 8]
      const field_d_array = result.children[0].children[3].children[2];
      expect(
        await decoder.pluck(data, field_d_array.location, field_d_array.size),
      ).to.equal(encode(["uint256[]"], [[6, 7, 8]], true));
    });
  });

  describe("Container Types - Arrays", () => {
    it("decodes static arrays", async () => {
      const { decoder } = await loadFixture(setup);
      // staticDynamicDynamic32
      const data = Interface.from([
        "function entrypoint(address, bytes, uint256[])",
      ]).encodeFunctionData("entrypoint", [AddressOne, "0xabcd", [10, 32, 55]]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            children: [{ paramType: AbiType.Dynamic }],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);

      // First array item - tuple[0].dynamic (bytes) = "0xbadfed"
      const item0_dynamic = result.children[0].children[0].children[0];
      expect(
        await decoder.pluck(data, item0_dynamic.location, item0_dynamic.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], true));

      // First array item - tuple[0]._static (uint256) = 9998877
      const item0_static = result.children[0].children[0].children[1];
      expect(
        await decoder.pluck(data, item0_static.location, item0_static.size),
      ).to.equal(encode(["uint256"], [9998877]));

      // First array item - tuple[0].dynamic32 (uint256[]) = [7, 9]
      const item0_array = result.children[0].children[0].children[2];
      expect(
        await decoder.pluck(data, item0_array.location, item0_array.size),
      ).to.equal(encode(["uint256[]"], [[7, 9]], true));

      // Second array item - tuple[1].dynamic (bytes) = "0x0badbeef"
      const item1_dynamic = result.children[0].children[1].children[0];
      expect(
        await decoder.pluck(data, item1_dynamic.location, item1_dynamic.size),
      ).to.equal(encode(["bytes"], ["0x0badbeef"], true));

      // Second array item - tuple[1]._static (uint256) = 444555
      const item1_static = result.children[0].children[1].children[1];
      expect(
        await decoder.pluck(data, item1_static.location, item1_static.size),
      ).to.equal(encode(["uint256"], [444555]));

      // Second array item - tuple[1].dynamic32 (uint256[]) = [4, 5, 6]
      const item1_array = result.children[0].children[1].children[2];
      expect(
        await decoder.pluck(data, item1_array.location, item1_array.size),
      ).to.equal(encode(["uint256[]"], [[4, 5, 6]], true));
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

    it("decodes arrays with embedded calldata items", async () => {
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

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        }, // 0 (root, self-parent)
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.Pass,
          compValue: "0x",
        }, // 1
        {
          parent: 1,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        }, // 2
        {
          parent: 2,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        }, // 3
      ];

      const result = await decoder.inspect(data, conditions);
      const arrayField = result.children[0];
      const [entry1, entry2] = arrayField.children;

      // Pluck the entire array
      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["bytes[]"], [[embedded1, embedded2]], true));

      // Pluck first embedded calldata entry and its parameter
      const firstEntry = arrayField.children[0];
      const firstParam = firstEntry.children[0];
      expect(
        await decoder.pluck(data, firstParam.location, firstParam.size),
      ).to.equal(encode(["uint256"], [12345]));

      // Pluck second embedded calldata entry and its parameter
      const secondEntry = arrayField.children[1];
      const secondParam = secondEntry.children[0];
      expect(
        await decoder.pluck(data, secondParam.location, secondParam.size),
      ).to.equal(encode(["uint256"], [67890]));
    });
  });

  describe("Array.Matches", () => {
    it("plucks Array.Matches with single non type variant entry", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function test(uint256[])",
      ]).encodeFunctionData("test", [[10, 20, 30]]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Matches,
            children: [{ paramType: AbiType.Static }],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
      const arrayField = result.children[0];

      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["uint256[]"], [[10, 20, 30]], true));
    });

    it("plucks Array.Matches with multiple non type variant entries", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function test(uint256[])",
      ]).encodeFunctionData("test", [[42, 100, 256]]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Static },
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                compValue: defaultAbiCoder.encode(["uint256"], [42]),
              },
              {
                paramType: AbiType.Static,
                operator: Operator.GreaterThan,
                compValue: defaultAbiCoder.encode(["uint256"], [50]),
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
      const arrayField = result.children[0];

      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["uint256[]"], [[42, 100, 256]], true));
    });

    it("plucks Array.Matches with type equivalent variants (Dynamic/Calldata/AbiEncoded)", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded1 = Interface.from([
        "function embedded(uint256)",
      ]).encodeFunctionData("embedded", [12345]);

      const embedded2 = defaultAbiCoder.encode(
        ["tuple(uint256,address)"],
        [[67890, AddressOne]],
      );

      const data = Interface.from([
        "function test(bytes[])",
      ]).encodeFunctionData("test", [["0xaabbccdd", embedded1, embedded2]]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Matches,
            children: [
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.Calldata,
                children: [{ paramType: AbiType.Static }],
              },
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
          },
        ],
      });

      const root = toTree(await decoder.inspectFlat(data, conditions));
      expect(root.children.length).to.equal(1);

      const [array] = root.children;
      expect(array.children.length).to.equal(3);

      const [_dynamic, calldata, abiEncoded] = array.children;
      expect(_dynamic.children.length).to.equal(0);
      expect(calldata.children.length).to.equal(1);
      expect(abiEncoded.children.length).to.equal(1);

      const [_static] = calldata.children;
      const [tuple] = abiEncoded.children;

      // // Pluck the entire array
      expect(await decoder.pluck(data, array.location, array.size)).to.equal(
        encode(["bytes[]"], [["0xaabbccdd", embedded1, embedded2]], true),
      );

      expect(
        await decoder.pluck(data, _static.location, _static.size),
      ).to.equal(encode(["uint256"], [12345], false));

      expect(await decoder.pluck(data, tuple.location, tuple.size)).to.equal(
        encode(["tuple(uint256,address)"], [[67890, AddressOne]]),
      );
    });

    it("plucks Array.Matches with complex non type variant types", async () => {
      const { decoder } = await loadFixture(setup);

      const data = Interface.from([
        "function test(tuple(uint256,address)[] input)",
      ]).encodeFunctionData("test", [
        [
          [100, AddressOne],
          [200, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"],
        ],
      ]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Tuple,
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
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

      const root = toTree(await decoder.inspectFlat(data, conditions));
      const [array] = root.children;
      const [tuple1, tuple2] = array.children;

      expect(array.children.length).to.equal(2);

      expect(await decoder.pluck(data, array.location, array.size)).to.equal(
        encode(
          ["tuple(uint256,address)[]"],
          [
            [
              [100, AddressOne],
              [200, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"],
            ],
          ],
          true,
        ),
      );

      expect(await decoder.pluck(data, tuple1.location, tuple1.size)).to.equal(
        encode(["tuple(uint256,address)"], [[100, AddressOne]], false),
      );

      expect(await decoder.pluck(data, tuple2.location, tuple2.size)).to.equal(
        encode(
          ["tuple(uint256,address)"],
          [[200, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]],
          false,
        ),
      );
    });
  });

  describe("Embedded Encoded Data", () => {
    it("decodes embedded Calldata", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = Interface.from([
        "function embedded((uint256, address))",
      ]).encodeFunctionData("embedded", [[12345, AddressOne]]);

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
      const embeddedTuple = result.children[0].children[0];
      const staticField = embeddedTuple.children[0];

      expect(
        await decoder.pluck(data, staticField.location, staticField.size),
      ).to.equal(encode(["uint256"], [12345]));
    });

    it("decodes embedded AbiEncoded data", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["tuple(uint256, string)"],
        [[12345, "Johnny Doe"]],
      );

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
      const embeddedTuple = result.children[0].children[0];
      const dynamicField = embeddedTuple.children[1];

      expect(
        await decoder.pluck(data, dynamicField.location, dynamicField.size),
      ).to.equal(encode(["string"], ["Johnny Doe"], true));
    });

    it("decodes dynamic tuple from embedded calldata", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = hre.ethers.Interface.from([
        "function embedded((uint256, string))",
      ]).encodeFunctionData("embedded", [[12345, "Johnny Doe"]]);

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

    it("decodes static tuple from embedded AbiEncoded", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["tuple(uint256, address)"],
        [[12345, AddressOne]],
      );

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

    it("decodes nested Calldata within tuples", async () => {
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

    it("decodes nested Calldata within arrays", async () => {
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
      const arrayField1 = result.children[0].children[0].children[2];
      const staticField2 = result.children[0].children[1].children[1];

      expect(
        await decoder.pluck(data, arrayField1.location, arrayField1.size),
      ).to.equal(encode(["bytes2[]"], [["0xaabb", "0xf26b"]], true));

      expect(
        await decoder.pluck(data, staticField2.location, staticField2.size),
      ).to.equal(encode(["bool"], [false]));
    });

    it("decodes complex embedded AbiEncoded data", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["bytes", "bool", "bytes2[]"],
        ["0xbadfed", true, ["0xccdd", "0x3333"]],
      );

      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", [embedded]);

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

  describe("Variant", () => {
    it("variants work under AND", async () => {
      const { decoder } = await loadFixture(setup);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.And,
            children: [
              { paramType: AbiType.Dynamic },
              {
                paramType: AbiType.AbiEncoded,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    children: [
                      { paramType: AbiType.Static }, // uint256
                      { paramType: AbiType.Static }, // address
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      // Create data that can be interpreted as both raw bytes AND as abi-encoded static tuple
      const tupleData = encode(["tuple(uint256,uint256)"], [[1, 999]]);
      const data = Interface.from(["function test(bytes)"]).encodeFunctionData(
        "test",
        [tupleData],
      );

      const result = await decoder.inspect(data, conditions);

      expect(result.variant).to.equal(false);
      expect(result.overflown).to.equal(false);

      // AND variant should succeed when both children are valid
      expect(result.children[0].variant).to.equal(true);
      expect(result.children[0].children).to.have.length(2);

      const [dynamic, abiEncoded] = result.children[0].children;
      expect(dynamic.children.length).to.equal(0);
      expect(abiEncoded.children.length).to.equal(1);

      const [tuple] = abiEncoded.children;
      expect(tuple.children.length).to.equal(2);

      const [static1, static2] = tuple.children;
      expect(static1.children.length).to.equal(0);
      expect(static2.children.length).to.equal(0);

      expect(tuple.variant).to.equal(false);
      expect(tuple.overflown).to.equal(false);

      expect(dynamic.variant).to.equal(false);
      expect(dynamic.overflown).to.equal(false);

      expect(await decoder.pluck(data, tuple.location, tuple.size)).to.equal(
        encode(["tuple(uint256,uint256)"], [[1, 999]], false),
      );
      expect(
        await decoder.pluck(data, static1.location, static1.size),
      ).to.equal(encode(["uint256"], [1], false));
      expect(
        await decoder.pluck(data, static2.location, static2.size),
      ).to.equal(encode(["uint256"], [999], false));
    });

    it("variants work under OR", async () => {
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
                  {
                    paramType: AbiType.Tuple,
                    children: [{ paramType: AbiType.Static }],
                  },
                ],
              },
              {
                paramType: AbiType.AbiEncoded,
                children: [{ paramType: AbiType.Static }],
              },
            ],
          },
        ],
      });

      // Create data that can be interpreted as both raw bytes AND as abi-encoded static tuple
      const innerData = encode(["tuple(uint256)"], [[123467]]);
      const data = Interface.from(["function f(bytes)"]).encodeFunctionData(
        "f",
        [innerData],
      );

      const root = await decoder.inspect(data, conditions);

      expect(root.variant).to.equal(false);
      expect(root.overflown).to.equal(false);

      // AND variant should succeed when both children are valid
      expect(root.children[0].variant).to.equal(true);
      expect(root.children[0].children).to.have.length(2);

      const [abiEncoded1, abiEncoded2] = root.children[0].children;
      expect(abiEncoded1.variant).to.equal(false);
      expect(abiEncoded1.overflown).to.equal(false);

      expect(abiEncoded2.variant).to.equal(false);
      expect(abiEncoded2.overflown).to.equal(false);

      expect(abiEncoded1.children.length).to.equal(1);
      const [tuple] = abiEncoded1.children;

      expect(tuple.children.length).to.equal(1);
      const [static1] = tuple.children;
      expect(static1.children.length).to.equal(0);

      expect(abiEncoded2.children.length).to.equal(1);
      const [static2] = abiEncoded2.children;
      expect(static2.children.length).to.equal(0);

      expect(await decoder.pluck(data, tuple.location, tuple.size)).to.equal(
        encode(["uint256"], [123467]),
      );

      expect(
        await decoder.pluck(data, static1.location, static1.size),
      ).to.equal(encode(["uint256"], [123467]));

      expect(
        await decoder.pluck(data, static2.location, static2.size),
      ).to.equal(encode(["uint256"], [123467]));
    });

    it("decodes from one valid variant, overflow from another", async () => {
      const { decoder } = await loadFixture(setup);

      const embedded = defaultAbiCoder.encode(
        ["tuple(uint256,uint256,uint256)"],
        [[99999999, 99999999, 99999999]],
      );

      const data = Interface.from(["function test(bytes)"]).encodeFunctionData(
        "test",
        [embedded],
      );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.AbiEncoded, // This should work
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
              {
                paramType: AbiType.AbiEncoded, // This should overflow
                children: [
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                  { paramType: AbiType.Static },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);

      const variant = result.children[0];
      const [first, second] = variant.children;

      // 0x
      // 2f570a23
      // 0000000000000000000000000000000000000000000000000000000000000020
      // 0000000000000000000000000000000000000000000000000000000000000060
      // 00000000000000000000000000000000000000000000000000000000000f423f
      // 00000000000000000000000000000000000000000000000000000000054c5638
      // 00000000000000000000000000000000000000000000000000000000000bde31

      // 0x
      // 2f570a23
      // 0000000000000000000000000000000000000000000000000000000000000020
      // 0000000000000000000000000000000000000000000000000000000000000060
      // 0000000000000000000000000000000000000000000000000000000000000020
      // 0000000000000000000000000000000000000000000000000000000000000004
      // aabbccdd00000000000000000000000000000000000000000000000000000000

      // Should succeed because one variant is valid
      expect(result.variant).to.equal(false);
      expect(result.overflown).to.equal(false);

      expect(variant.variant).to.equal(true);
      expect(variant.overflown).to.equal(false);

      expect(first.variant).to.equal(false);
      expect(first.overflown).to.equal(false);

      expect(second.variant).to.equal(false);
      expect(second.overflown).to.equal(true);
    });

    it("decodes from one overflow one valid (valid second)", async () => {});

    it("decodes from several valid variants", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from(["function test(bytes)"]).encodeFunctionData(
        "test",
        [encode(["uint256"], [12345])],
      );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              { paramType: AbiType.Dynamic }, // Valid: raw bytes
              {
                paramType: AbiType.AbiEncoded, // Valid: abi-encoded uint256
                children: [{ paramType: AbiType.Static }],
              },
              {
                paramType: AbiType.Calldata, // Valid: calldata with selector
                children: [{ paramType: AbiType.Static }],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);

      // Should succeed with multiple valid variants
      expect(result.children[0].variant).to.equal(true);
      expect(result.children[0].children).to.have.length(3);

      const [, abiEncoded] = result.children[0].children;
      const [_static] = abiEncoded.children;

      // Check we can decode from the abi-encoded variant
      expect(
        await decoder.pluck(data, _static.location, _static.size),
      ).to.equal(encode(["uint256"], [12345]));
    });
  });

  describe("Complex Scenarios & Edge Cases", () => {
    it("handles empty dynamic buffer", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from([
        "function dynamic(bytes)",
      ]).encodeFunctionData("dynamic", ["0x"]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [{ paramType: AbiType.Dynamic }],
      });

      const result = await decoder.inspect(data, conditions);
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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);

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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);

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

      const conditions = flattenCondition({
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

      const result = await decoder.inspect(data, conditions);
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

  describe("Condition-based Decoding", () => {
    it("decodes complex OR variant with different tuple structures", async () => {
      const { decoder } = await loadFixture(setup);
      const data = Interface.from(["function test(bytes)"]).encodeFunctionData(
        "test",
        [encode(["tuple(uint256,address)"], [[123, AddressOne]])],
      );

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
                  {
                    paramType: AbiType.Tuple,
                    children: [
                      { paramType: AbiType.Static },
                      { paramType: AbiType.Static },
                    ],
                  },
                ],
              },
              {
                paramType: AbiType.AbiEncoded,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    children: [
                      { paramType: AbiType.Dynamic },
                      { paramType: AbiType.Static },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
      const variantParam = result.children[0];

      expect(variantParam.variant).to.equal(true);
      expect(variantParam.children).to.have.length(2);
    });
  });
});

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}

type Payload = {
  location: number;
  size: number;
  children: Payload[];
  variant: boolean;
  overflown: boolean;
};
function toTree(
  bfsArray: {
    location: bigint;
    size: bigint;
    parent: bigint;
    variant: boolean;
    overflown: boolean;
  }[],
): Payload {
  const nodes = bfsArray.map((item) => ({
    location: Number(item.location),
    size: Number(item.size),
    children: [] as Payload[],
    variant: item.variant,
    overflown: item.overflown,
  }));

  // Link children to parents
  bfsArray.forEach((item, i) => {
    const parentIndex = Number(item.parent);
    // Skip self-parented (root node)
    if (parentIndex !== i) {
      nodes[parentIndex].children.push(nodes[i]);
    }
  });

  // Root node should be the one whose parent == its own index
  return nodes[0];
}

// function showCalldat(str: string) {
//   if (str.length <= 10) return str;

//   const head = str.slice(0, 10);
//   const tail = str.slice(10).replace(/(.{64})/g, "$1\n");

//   return head + "\n" + tail;
// }
