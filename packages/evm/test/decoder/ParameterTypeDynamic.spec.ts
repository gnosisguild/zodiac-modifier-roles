import hre from "hardhat";
import assert from "assert";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Interface, defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ParameterType } from "../utils";

const YesRemoveOffset = true;

describe("Decoder library", async () => {
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

  it("plucks Dynamic from top level", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const { data } =
      await testEncoder.populateTransaction.dynamic32DynamicStatic(
        [],
        "Hello World!",
        123456789
      );

    assert(data);

    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Array,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
          ],
        },
        {
          paramType: ParameterType.Dynamic,
          operator: Operator.Pass,
          children: [],
        },
        {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          children: [],
        },
      ],
    };

    const result = await decoder.inspect(data, layout);

    expect(
      await decoder.pluck(
        data,
        result.children[1].location,
        result.children[1].size
      )
    ).to.equal(encode(["string"], ["Hello World!"], YesRemoveOffset));
  });
  it("plucks Dynamic from Tuple", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const { data } = await testEncoder.populateTransaction._dynamicTuple({
      dynamic: "0xabcd0011",
    });

    assert(data);
    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data, layout);

    expect(
      await decoder.pluck(
        data,
        result.children[0].location,
        result.children[0].size
      )
    ).to.equal(encode(["tuple(bytes)"], [["0xabcd0011"]], YesRemoveOffset));
  });
  it("plucks Dynamic from Array", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const { data } = await testEncoder.populateTransaction.dynamicArray([
      "0xaabbccdd",
      "0x004466ff",
    ]);

    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Array,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    const arrayElement0 = result.children[0].children[0];
    const arrayElement1 = result.children[0].children[1];
    expect(
      await decoder.pluck(
        data as string,
        arrayElement0.location,
        arrayElement0.size
      )
    ).to.equal(encode(["bytes"], ["0xaabbccdd"], YesRemoveOffset));

    expect(
      await decoder.pluck(
        data as string,
        arrayElement1.location,
        arrayElement1.size
      )
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

    const condition = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Calldata,
              operator: Operator.Matches,
              children: [
                {
                  paramType: ParameterType.Dynamic,
                  operator: Operator.Pass,
                  children: [],
                },
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                  children: [],
                },
                {
                  paramType: ParameterType.Array,
                  operator: Operator.Pass,
                  children: [
                    {
                      paramType: ParameterType.Static,
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
    };

    const result = await decoder.inspect(data as string, condition);

    const tupleField = result.children[0].children[0].children[0];
    expect(
      await decoder.pluck(data as string, tupleField.location, tupleField.size)
    ).to.equal(encode(["bytes"], ["0xbadfed"], YesRemoveOffset));
  });
  it("plucks Dynamic from embedded AbiEncoded", async () => {
    const { decoder } = await loadFixture(setup);

    const iface = new Interface(["function fn(bytes a)"]);
    const embedded = defaultAbiCoder.encode(
      ["bytes", "bool", "bytes2[]"],
      ["0xbadfed", true, ["0xccdd", "0x3333"]]
    );

    const data = iface.encodeFunctionData("fn", [embedded]);

    const condition = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Array,
              operator: Operator.Pass,
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, condition);

    const field1 = result.children[0].children[0];
    expect(
      await decoder.pluck(data as string, field1.location, field1.size)
    ).to.equal(encode(["bytes"], ["0xbadfed"]));

    const field2 = result.children[0].children[1];
    expect(
      await decoder.pluck(data as string, field2.location, field2.size)
    ).to.equal(encode(["bool"], ["false"], false));

    const field3 = result.children[0].children[2];
    expect(
      await decoder.pluck(data as string, field3.location, field3.size)
    ).to.equal(encode(["bytes2[]"], [["0xccdd", "0x3333"]]));
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

    const condition = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.And,
          children: [
            {
              paramType: ParameterType.Calldata,
              operator: Operator.Matches,
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                  children: [],
                },
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                  children: [],
                },
              ],
            },
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Bitmask,
              children: [],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, condition);

    const all = result;
    const embedded = result.children[0];
    const arg1 = result.children[0].children[0];
    const arg2 = result.children[0].children[1];

    expect(
      await decoder.pluck(data as string, all.location, all.size)
    ).to.equal(data);

    expect(
      await decoder.pluck(data as string, embedded.location, embedded.size)
    ).to.equal(
      encode(["bytes"], [iface.encodeFunctionData("fnIn", [1234, 9876])])
    );

    expect(
      await decoder.pluck(data as string, arg1.location, arg1.size)
    ).to.equal(encode(["uint256"], [1234], false));

    expect(
      await decoder.pluck(data as string, arg2.location, arg2.size)
    ).to.equal(encode(["uint256"], [9876], false));
  });
});

function encode(types: any, values: any, removeTrailingOffset = true) {
  const result = defaultAbiCoder.encode(types, values);
  // should not remove for inline types
  return removeTrailingOffset ? `0x${result.slice(66)}` : result;
}
