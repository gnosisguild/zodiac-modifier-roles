import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface } from "ethers";

import { AbiType, flattenCondition, Operator } from "../utils";

const AddressOne = "0x0000000000000000000000000000000000000001";
const YesRemoveOffset = true;
const DontRemoveOffset = false;
const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("AbiDecoder library", async () => {
  async function setup() {
    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return {
      testEncoder,
      decoder,
    };
  }

  describe("TypeTree", async () => {
    it("top level variants get unfolded to its entrypoint form", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.staticDynamic.populateTransaction(
        123,
        "0xaabbccddeeff",
      );

      const conditions = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
      expect(await decoder.pluck(data, result.location, result.size)).to.equal(
        data,
      );

      const firstParam = result.children[0];
      expect(
        await decoder.pluck(data, firstParam.location, firstParam.size),
      ).to.equal(encode(["uint256"], [123]));

      const secondParam = result.children[1];
      expect(
        await decoder.pluck(data, secondParam.location, secondParam.size),
      ).to.equal(encode(["bytes"], ["0xaabbccddeeff"], YesRemoveOffset));
    });
    it("And gets unfolded to Static", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } =
        await testEncoder.staticFn.populateTransaction("0xeeff3344");

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.And,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
      const staticField = result.children[0];
      expect(
        await decoder.pluck(data, staticField.location, staticField.size),
      ).to.equal(encode(["bytes4"], ["0xeeff3344"], DontRemoveOffset));
    });
    it("Or gets unfolded to Array - From Tuple", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.dynamicTuple.populateTransaction({
        dynamic: "0xaabb",
        _static: 88221,
        dynamic32: [1, 2, 3, 4, 5],
      });

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.None,
                operator: Operator.Or,
                children: [
                  {
                    paramType: AbiType.Array,
                    operator: Operator.EqualTo,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        children: [],
                      },
                    ],
                  },
                  {
                    paramType: AbiType.Array,
                    operator: Operator.EqualTo,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
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

      const result = await decoder.inspect(data, conditions);

      const tupleField = result.children[0];
      expect(
        await decoder.pluck(data, tupleField.location, tupleField.size),
      ).to.equal(
        encode(
          ["tuple(bytes,uint256,uint256[])"],
          [["0xaabb", 88221, [1, 2, 3, 4, 5]]],
          YesRemoveOffset,
        ),
      );

      const arrayField = result.children[0].children[2];
      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["uint256[]"], [[1, 2, 3, 4, 5]], YesRemoveOffset));
    });
    it("Or gets unfolded to Static - From Array", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.dynamicTuple.populateTransaction({
        dynamic: "0xaabb",
        _static: 88221,
        dynamic32: [7, 8, 9],
      });

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Array,
                operator: Operator.EqualTo,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Or,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        children: [],
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
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

      const result = await decoder.inspect(data, conditions);

      const tupleField = result.children[0];
      expect(
        await decoder.pluck(data, tupleField.location, tupleField.size),
      ).to.equal(
        encode(
          ["tuple(bytes,uint256,uint256[])"],
          [["0xaabb", 88221, [7, 8, 9]]],
          YesRemoveOffset,
        ),
      );

      const arrayField = result.children[0].children[2];
      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["uint256[]"], [[7, 8, 9]], YesRemoveOffset));
    });
    it("EtherWithinAllowance gets inspected as None", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);
      const { data } =
        await testEncoder.staticFn.populateTransaction("0xeeff3344");

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.EtherWithinAllowance,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            children: [],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);

      const [extraneousField, staticField] = result.children;
      expect(extraneousField.location).to.equal(4);
      expect(extraneousField.size).to.equal(0);
      expect(staticField.location).to.equal(4);
      expect(staticField.size).to.equal(32);
    });
    it("CallWithinAllowance gets inspected as None", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);
      const { data } =
        await testEncoder.staticFn.populateTransaction("0xeeff3344");

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.CallWithinAllowance,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            children: [],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);

      const [extraneousField, staticField] = result.children;

      expect(extraneousField.location).to.equal(4);
      expect(extraneousField.size).to.equal(0);
      expect(staticField.location).to.equal(4);
      expect(staticField.size).to.equal(32);
    });
  });

  describe("Misc - old tests", async () => {
    it("plucks Dynamic from top level", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } =
        await testEncoder.dynamic32DynamicStatic.populateTransaction(
          [],
          "Hello World!",
          123456789,
        );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(encode(["string"], ["Hello World!"], YesRemoveOffset));
    });
    it("plucks Dynamic from Tuple", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder._dynamicTuple.populateTransaction({
        dynamic: "0xabcd0011",
      });

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
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
      ).to.equal(encode(["tuple(bytes)"], [["0xabcd0011"]], YesRemoveOffset));
    });
    it("plucks Dynamic from Array", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.dynamicArray.populateTransaction([
        "0xaabbccdd",
        "0x004466ff",
      ]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      const arrayElement0 = result.children[0].children[0];
      const arrayElement1 = result.children[0].children[1];
      expect(
        await decoder.pluck(
          data as string,
          arrayElement0.location,
          arrayElement0.size,
        ),
      ).to.equal(encode(["bytes"], ["0xaabbccdd"], YesRemoveOffset));

      expect(
        await decoder.pluck(
          data as string,
          arrayElement1.location,
          arrayElement1.size,
        ),
      ).to.equal(encode(["bytes"], ["0x004466ff"], YesRemoveOffset));
    });
    it("plucks Dynamic from embedded Calldata", async () => {
      const { decoder } = await loadFixture(setup);

      const iface = new Interface([
        "function fnOut(tuple(bytes) a)",
        "function fnIn(bytes a, bool b, bytes2[] c)",
      ]);
      const embedded = iface.encodeFunctionData("fnIn", [
        "0xbadfed",
        true,
        ["0xccdd"],
      ]);

      const dynamicTupleValue = [embedded];
      const data = iface.encodeFunctionData("fnOut", [dynamicTupleValue]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Array,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
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

      const result = await decoder.inspect(data as string, conditions);

      const tupleField = result.children[0].children[0].children[0];
      expect(
        await decoder.pluck(
          data as string,
          tupleField.location,
          tupleField.size,
        ),
      ).to.equal(encode(["bytes"], ["0xbadfed"], YesRemoveOffset));
    });
    it("plucks Dynamic from embedded AbiEncoded", async () => {
      const { decoder } = await loadFixture(setup);

      const iface = new Interface(["function fn(bytes a)"]);
      const embedded = defaultAbiCoder.encode(
        ["bytes", "bool", "bytes2[]"],
        ["0xbadfed", true, ["0xccdd", "0x3333"]],
      );

      const data = iface.encodeFunctionData("fn", [embedded]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      const field1 = result.children[0].children[0];
      expect(
        await decoder.pluck(data as string, field1.location, field1.size),
      ).to.equal(encode(["bytes"], ["0xbadfed"], YesRemoveOffset));

      const field2 = result.children[0].children[1];
      expect(
        await decoder.pluck(data as string, field2.location, field2.size),
      ).to.equal(encode(["bool"], ["false"]));

      const field3 = result.children[0].children[2];
      expect(
        await decoder.pluck(data as string, field3.location, field3.size),
      ).to.equal(encode(["bytes2[]"], [["0xccdd", "0x3333"]], YesRemoveOffset));
    });
    it("plucks Dynamic from type equivalent branch", async () => {
      const { decoder } = await loadFixture(setup);

      const iface = new Interface([
        "function fnOut(bytes a)",
        "function fnIn(uint256 a, uint256 b)",
      ]);

      const data = iface.encodeFunctionData("fnOut", [
        iface.encodeFunctionData("fnIn", [1234, 9876]),
      ]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.And,
            children: [
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Bitmask,
                children: [],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      const all = result;
      const embedded = result.children[0];
      const arg1 = result.children[0].children[0];
      const arg2 = result.children[0].children[1];

      expect(
        await decoder.pluck(data as string, all.location, all.size),
      ).to.equal(data);

      expect(
        await decoder.pluck(data as string, embedded.location, embedded.size),
      ).to.equal(
        encode(
          ["bytes"],
          [iface.encodeFunctionData("fnIn", [1234, 9876])],
          YesRemoveOffset,
        ),
      );

      expect(
        await decoder.pluck(data as string, arg1.location, arg1.size),
      ).to.equal(encode(["uint256"], [1234]));

      expect(
        await decoder.pluck(data as string, arg2.location, arg2.size),
      ).to.equal(encode(["uint256"], [9876]));
    });
    it("plucks (dynamic) empty buffer from encoded caldata", async () => {
      const { testEncoder, decoder } = await loadFixture(setup);

      const { data } = await testEncoder.dynamic.populateTransaction("0x");

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Dynamic,
            operator: Operator.EqualTo,
            children: [],
          },
        ],
      });

      const result = await decoder.inspect(data, conditions);
      expect(result.location).to.equal(BigInt(0));
      expect(result.size).to.equal(BigInt((data.length - 2) / 2));

      const parameter = result.children[0];
      expect(parameter.location).to.equal(36);

      expect(
        await decoder.pluck(data, parameter.location, parameter.size),
      ).to.equal(encode(["bytes"], ["0x"], YesRemoveOffset));
    });
    it("plucks (static, dynamic, dynamic32) non nested parameters from encoded calldata", async () => {
      const { testEncoder, decoder } = await loadFixture(setup);

      // (address,bytes,uint32[])

      const { data } =
        await testEncoder.staticDynamicDynamic32.populateTransaction(
          AddressOne,
          "0xabcd",
          [10, 32, 55],
        );

      const condition = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });
      const result = await decoder.inspect(data, condition);

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
      ).to.equal(encode(["bytes"], ["0xabcd"], YesRemoveOffset));

      expect(
        await decoder.pluck(
          data,
          result.children[2].location,
          result.children[2].size,
        ),
      ).to.deep.equal(encode(["uint256[]"], [[10, 32, 55]], YesRemoveOffset));
    });
    it("plucks (dynamic, static, dynamic32) non nested parameters from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // (bytes,bool,bytes2[])

      const { data } =
        await testEncoder.dynamicStaticDynamic32.populateTransaction(
          "0x12ab45",
          false,
          ["0x1122", "0x3344", "0x5566"],
        );

      const condition = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data, condition);
      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(encode(["bytes"], ["0x12ab45"], YesRemoveOffset));

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
      ).to.equal(
        encode(["bytes2[]"], [["0x1122", "0x3344", "0x5566"]], YesRemoveOffset),
      );
    });
    it("plucks (dynamic32, dynamic, static) non nested parameters from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // (bytes2[],string,uint32)

      const { data } =
        await testEncoder.dynamic32DynamicStatic.populateTransaction(
          ["0xaabb", "0x1234", "0xff33"],
          "Hello World!",
          123456789,
        );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
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
      ).to.deep.equal(
        encode(["bytes2[]"], [["0xaabb", "0x1234", "0xff33"]], YesRemoveOffset),
      );

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(encode(["string"], ["Hello World!"], YesRemoveOffset));
      expect(
        await decoder.pluck(
          data,
          result.children[2].location,
          result.children[2].size,
        ),
      ).to.equal(BigInt(123456789));
    });
    it("plucks dynamicTuple from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))
      const { data } = await testEncoder._dynamicTuple.populateTransaction({
        dynamic: "0xabcd",
      });

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
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
      ).to.equal(encode(["tuple(bytes)"], [["0xabcd"]], YesRemoveOffset));

      expect(
        await decoder.pluck(
          data,
          result.children[0].children[0].location,
          result.children[0].children[0].size,
        ),
      ).to.equal(encode(["bytes"], ["0xabcd"], YesRemoveOffset));
    });
    it("plucks staticTuple (explicitly) from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.staticTuple.populateTransaction(
        {
          a: 1999,
          b: AddressOne,
        },
        2000,
      );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(
        encode(
          ["tuple(uint256, address)"],
          [[1999, "0x0000000000000000000000000000000000000001"]],
          false,
        ),
      );

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.deep.equal(encode(["uint256"], [2000]));
    });
    it("plucks staticTuple (implicitly) from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.staticTuple.populateTransaction(
        {
          a: 1999,
          b: AddressOne,
        },
        2000,
      );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(encode(["uint256"], [1999]));

      expect(
        await decoder.pluck(
          data,
          result.children[1].location,
          result.children[1].size,
        ),
      ).to.equal(
        encode(["address"], ["0x0000000000000000000000000000000000000001"]),
      );
    });
    it("plucks dynamicTupleWithNestedStaticTuple from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // function dynamicTupleWithNestedStaticTuple(tuple(uint256 a, bytes b, tuple(uint256 a, address b) c))
      const { data } =
        await testEncoder.dynamicTupleWithNestedStaticTuple.populateTransaction(
          {
            a: 2023,
            b: "0xbadfed",
            c: {
              a: 2020,
              b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            },
          },
        );

      const expected = encode(
        ["uint256", "bytes", "tuple(uint256, address)"],
        [
          2023,
          "0xbadfed",
          [2020, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"],
        ],
        false,
      );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
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
      ).to.equal(expected);

      const field = result.children[0].children[2].children[0];
      expect(await decoder.pluck(data, field.location, field.size)).to.equal(
        encode(["uint256"], [2020]),
      );
    });
    it("plucks dynamicTupleWithNestedDynamicTuple from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const value1 = "0xbadfed";
      const value2 = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      const value3 = "0xdeadbeef";

      const { data } =
        await testEncoder.dynamicTupleWithNestedDynamicTuple.populateTransaction(
          {
            a: value1,
            b: {
              a: 1234,
              b: value2,
            },
            c: 2023,
            d: {
              dynamic: value3,
              _static: 999,
              dynamic32: [6, 7, 8],
            },
          },
        );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Array,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
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

      const result = await decoder.inspect(data as string, conditions);

      const expected = encode(
        [
          "bytes",
          "tuple(uint256, address)",
          "uint256",
          "tuple(bytes,uint256, uint256[])",
        ],
        [value1, [1234, value2], 2023, [value3, 999, [6, 7, 8]]],
      );
      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(expected);

      const field_0 = result.children[0].children[0];
      const field_1_static_tuple = result.children[0].children[1];
      const field_1_1 = result.children[0].children[1].children[1];
      const field_3_dynamic_tuple = result.children[0].children[3];
      const field_3_0 = result.children[0].children[3].children[0];

      expect(
        await decoder.pluck(data, field_0.location, field_0.size),
      ).to.equal(encode(["bytes"], [value1], YesRemoveOffset));

      expect(
        await decoder.pluck(
          data,
          field_1_static_tuple.location,
          field_1_static_tuple.size,
        ),
      ).to.equal(encode(["tuple(uint256, address)"], [[1234, value2]]));

      expect(
        await decoder.pluck(data, field_1_1.location, field_1_1.size),
      ).to.equal(encode(["address"], [value2]));

      expect(
        await decoder.pluck(
          data,
          field_3_dynamic_tuple.location,
          field_3_dynamic_tuple.size,
        ),
      ).to.equal(
        encode(
          ["tuple(bytes,uint256, uint256[])"],
          [[value3, 999, [6, 7, 8]]],
          YesRemoveOffset,
        ),
      );

      expect(
        await decoder.pluck(data, field_3_0.location, field_3_0.size),
      ).to.equal(encode(["bytes"], [value3], YesRemoveOffset));
    });
    it("plucks dynamicTupleWithNestedArray from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const dynamicValue = "0x0badbeef";

      // function dynamicTupleWithNestedArray(tuple(uint256 a, bytes b, tuple(uint256 a, address b)[] c))
      const { data } =
        await testEncoder.dynamicTupleWithNestedArray.populateTransaction({
          a: 21000,
          b: dynamicValue,
          c: [{ a: 10, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" }],
        });

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
                        children: [],
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
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
      const result = await decoder.inspect(data, conditions);

      // check root
      expect(await decoder.pluck(data, result.location, result.size)).to.equal(
        data,
      );

      // check nested tuple
      const fieldTuple = result.children[0].children[2];
      expect(
        await decoder.pluck(data, fieldTuple.location, fieldTuple.size),
      ).to.equal(
        encode(
          ["tuple(uint256,address)[]"],
          [[[10, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]]],
          YesRemoveOffset,
        ),
      );

      // check a leaf
      const fieldDynamic = result.children[0].children[1];
      expect(
        await decoder.pluck(data, fieldDynamic.location, fieldDynamic.size),
      ).to.equal(encode(["bytes"], [dynamicValue], YesRemoveOffset));
    });
    it("plucks arrayStaticTupleItems from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // function arrayStaticTupleItems(tuple(uint256 a, address b)[])
      const { data } =
        await testEncoder.arrayStaticTupleItems.populateTransaction([
          {
            a: 95623,
            b: "0x00000000219ab540356cbb839cbe05303d7705fa",
          },
          {
            a: 11542,
            b: "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0",
          },
        ]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = await decoder.inspect(data as string, conditions);

      // check root
      expect(
        await decoder.pluck(data as string, result.location, result.size),
      ).to.equal(data);

      // check array
      const arrayField = result.children[0];
      expect(
        await decoder.pluck(
          data as string,
          arrayField.location,
          arrayField.size,
        ),
      ).to.equal(
        encode(
          ["tuple(uint256,address)[]"],
          [
            [
              [95623, "0x00000000219ab540356cbb839cbe05303d7705fa"],
              [11542, "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0"],
            ],
          ],
          YesRemoveOffset,
        ),
      );

      const arrayEntry1 = result.children[0].children[0];
      expect(
        await decoder.pluck(
          data as string,
          arrayEntry1.location,
          arrayEntry1.size,
        ),
      ).to.equal(
        encode(
          ["tuple(uint256,address)"],
          [[95623, "0x00000000219ab540356cbb839cbe05303d7705fa"]],
          DontRemoveOffset,
        ),
      );
      const arrayEntry2 = result.children[0].children[1];
      expect(
        await decoder.pluck(
          data as string,
          arrayEntry2.location,
          arrayEntry2.size,
        ),
      ).to.equal(
        encode(
          ["tuple(uint256,address)"],
          [[11542, "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0"]],
          DontRemoveOffset,
        ),
      );
    });
    it("plucks arrayDynamicTupleItems from encoded calldata", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // function arrayDynamicTupleItems(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32)[])
      const { data } =
        await testEncoder.arrayDynamicTupleItems.populateTransaction([
          {
            dynamic: "0xbadfed",
            _static: 9998877,
            dynamic32: [7, 9],
          },
          {
            dynamic: "0x0badbeef",
            _static: 444555,
            dynamic32: [4, 5, 6],
          },
        ]);

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Tuple,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Array,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
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
      const result = await decoder.inspect(data, conditions);

      // check root
      expect(await decoder.pluck(data, result.location, result.size)).to.equal(
        data,
      );

      // check array
      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].size,
        ),
      ).to.equal(
        encode(
          ["tuple(bytes,uint256, uint256[])[]"],
          [
            [
              ["0xbadfed", 9998877, [7, 9]],
              ["0x0badbeef", 444555, [4, 5, 6]],
            ],
          ],
          YesRemoveOffset,
        ),
      );

      const arrayEntry1 = result.children[0].children[0];
      expect(
        await decoder.pluck(
          data as string,
          arrayEntry1.location,
          arrayEntry1.size,
        ),
      ).to.equal(
        encode(
          ["tuple(bytes,uint256, uint256[])"],
          [["0xbadfed", 9998877, [7, 9]]],
          YesRemoveOffset,
        ),
      );
      const arrayEntry2 = result.children[0].children[1];
      expect(
        await decoder.pluck(
          data as string,
          arrayEntry2.location,
          arrayEntry2.size,
        ),
      ).to.equal(
        encode(
          ["tuple(bytes,uint256, uint256[])"],
          [["0x0badbeef", 444555, [4, 5, 6]]],
          YesRemoveOffset,
        ),
      );

      // check array field
      const arrayField = result.children[0].children[1].children[2];
      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size),
      ).to.equal(encode(["uint256[]"], [[4, 5, 6]], YesRemoveOffset));
    });
    it("plucks Calldata from top level param", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const number = 123456789;
      const address = "0x0000000000000000000000000000000000000001";

      const { data: embedded } =
        await testEncoder.simple.populateTransaction(number);

      const { data } =
        await testEncoder.staticDynamicDynamic32.populateTransaction(
          address,
          embedded as string,
          [],
        );

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      // check the nested uint
      const nestedUintField = result.children[1].children[0];
      expect(
        await decoder.pluck(
          data as string,
          nestedUintField.location,
          nestedUintField.size,
        ),
      ).to.equal(encode(["uint256"], [number]));
    });
    it("plucks nested Calldata from within a tuple", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data: nestedData } =
        await testEncoder.dynamicTuple.populateTransaction({
          dynamic: "0x00",
          _static: 9922,
          dynamic32: [55, 66, 88],
        });

      const { data } = await testEncoder.dynamicTuple.populateTransaction({
        dynamic: nestedData as string,
        _static: 0,
        dynamic32: [],
      });

      const nestedLayout = {
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              nestedLayout,
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      const nestedDynamicField =
        result.children[0].children[0].children[0].children[0];
      expect(
        await decoder.pluck(
          data as string,
          nestedDynamicField.location,
          nestedDynamicField.size,
        ),
      ).to.equal(encode(["bytes"], ["0x00"], YesRemoveOffset));

      const nestedStaticField =
        result.children[0].children[0].children[0].children[1];
      expect(
        await decoder.pluck(
          data as string,
          nestedStaticField.location,
          nestedStaticField.size,
        ),
      ).to.equal(encode(["uint256"], ["9922"]));

      // check the nested uint
      const nestedArrayField =
        result.children[0].children[0].children[0].children[2];
      expect(
        await decoder.pluck(
          data as string,
          nestedArrayField.location,
          nestedArrayField.size,
        ),
      ).to.equal(encode(["uint256[]"], [[55, 66, 88]], YesRemoveOffset));
    });
    it("plucks nested Calldata from within an array", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data: nestedData1 } =
        await testEncoder.dynamicStaticDynamic32.populateTransaction(
          "0xaabbccdd",
          true,
          ["0xaabb", "0xf26b"],
        );
      const { data: nestedData2 } =
        await testEncoder.dynamicStaticDynamic32.populateTransaction(
          "0x22334455",
          false,
          [],
        );

      const { data } = await testEncoder.dynamicArray.populateTransaction([
        nestedData1,
        nestedData2,
      ]);

      const nestedLayout = {
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      };

      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [nestedLayout],
          },
        ],
      });

      const result = await decoder.inspect(data as string, conditions);

      const arrayField1 = result.children[0].children[0].children[2];
      expect(
        await decoder.pluck(
          data as string,
          arrayField1.location,
          arrayField1.size,
        ),
      ).to.equal(encode(["bytes2[]"], [["0xaabb", "0xf26b"]], YesRemoveOffset));
      const staticField1 = result.children[0].children[0].children[1];
      expect(
        await decoder.pluck(
          data as string,
          staticField1.location,
          staticField1.size,
        ),
      ).to.equal(encode(["bool"], [true]));

      const arrayField2 = result.children[0].children[1].children[2];
      expect(
        await decoder.pluck(
          data as string,
          arrayField2.location,
          arrayField2.size,
        ),
      ).to.equal(encode(["bytes2[]"], [[]], YesRemoveOffset));
      const staticField2 = result.children[0].children[1].children[1];
      expect(
        await decoder.pluck(
          data as string,
          staticField2.location,
          staticField2.size,
        ),
      ).to.equal(encode(["bool"], [false]));
    });
  });
});

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}
