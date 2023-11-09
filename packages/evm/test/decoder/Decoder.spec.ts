import hre from "hardhat";
import assert from "assert";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ParameterType } from "../utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";

const YesRemoveOffset = true;
const DontRemoveOffset = false;

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

  it("pluck fails if calldata is too short", async () => {
    const { testEncoder, decoder } = await loadFixture(setup);

    const { data } = await testEncoder.populateTransaction.dynamicTuple({
      dynamic: "0xaabbccdd",
      _static: 234,
      dynamic32: [],
    });

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

    await expect(decoder.inspect((data as string).slice(0, -64), layout)).to.be
      .reverted;
  });
  it("pluck fails with param scoped out of bounds", async () => {
    const { testEncoder, decoder } = await loadFixture(setup);

    const { data } = await testEncoder.populateTransaction.staticFn(
      "0xaabbccdd"
    );

    assert(data);

    const layout = {
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
    };

    const result = await decoder.inspect(data, layout);

    await expect(
      decoder.pluck(data, result.children[1].location, result.children[1].size)
    ).to.be.reverted;
  });

  it.skip("plucks Tuple from top level");
  it.skip("plucks Tuple from Tuple");
  it.skip("plucks Tuple from Array");

  it("plucks StaticTuple from nested Calldata", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const { data: inner } = await testEncoder.populateTransaction.staticTuple(
      {
        a: 999,
        b: AddressOne,
      },
      123
    );
    assert(inner);

    const { data } = await testEncoder.populateTransaction.dynamic(inner);
    assert(data);

    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Calldata,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Pass,
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
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    const calldata = result.children[0];
    const tuple = calldata.children[0];
    const tupleField1 = tuple.children[0];
    const tupleField2 = tuple.children[1];
    const arg = calldata.children[1];

    expect(
      await decoder.pluck(data as string, tuple.location, tuple.size)
    ).to.equal(
      defaultAbiCoder.encode(["tuple(uint256,address)"], [[999, AddressOne]])
    );

    expect(
      await decoder.pluck(
        data as string,
        tupleField1.location,
        tupleField1.size
      )
    ).to.equal(defaultAbiCoder.encode(["uint256"], [999]));

    expect(
      await decoder.pluck(
        data as string,
        tupleField2.location,
        tupleField2.size
      )
    ).to.equal(defaultAbiCoder.encode(["address"], [AddressOne]));
  });
  it("plucks DynamicTuple from nested Calldata", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const { data: inner } = await testEncoder.populateTransaction.dynamicTuple({
      dynamic: "0xbadfed",
      _static: 123,
      dynamic32: [456, 789],
    });
    assert(inner);

    const { data } = await testEncoder.populateTransaction.dynamic(inner);
    assert(data);

    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Calldata,
          operator: Operator.Pass,
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

    const result = await decoder.inspect(data as string, layout);

    const calldata = result.children[0];
    const tuple = calldata.children[0];
    const tupleField1 = tuple.children[0];
    const tupleField2 = tuple.children[1];
    const tupleField3 = tuple.children[2];

    expect(
      await decoder.pluck(data as string, tuple.location, tuple.size)
    ).to.equal(
      encode(
        ["tuple(bytes,uint256,uint256[])"],
        [["0xbadfed", 123, [456, 789]]],
        YesRemoveOffset
      )
    );

    expect(
      await decoder.pluck(
        data as string,
        tupleField1.location,
        tupleField1.size
      )
    ).to.equal(encode(["bytes"], ["0xbadfed"], YesRemoveOffset));

    expect(
      await decoder.pluck(
        data as string,
        tupleField2.location,
        tupleField2.size
      )
    ).to.equal(encode(["uint256"], [123]));

    expect(
      await decoder.pluck(
        data as string,
        tupleField3.location,
        tupleField3.size
      )
    ).to.equal(encode(["uint256[]"], [[456, 789]], YesRemoveOffset));
  });
  it("plucks StaticTuple from nested AbiEncoded", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const inner = encode(
      ["tuple(uint256,address)", "uint256"],
      [[999, AddressOne], 123]
    );

    const { data } = await testEncoder.populateTransaction.dynamic(inner);
    assert(data);

    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Pass,
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
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    const calldata = result.children[0];
    const tuple = calldata.children[0];
    const tupleField1 = tuple.children[0];
    const tupleField2 = tuple.children[1];
    const arg = calldata.children[1];

    expect(
      await decoder.pluck(data as string, tuple.location, tuple.size)
    ).to.equal(
      defaultAbiCoder.encode(["tuple(uint256,address)"], [[999, AddressOne]])
    );

    expect(
      await decoder.pluck(
        data as string,
        tupleField1.location,
        tupleField1.size
      )
    ).to.equal(defaultAbiCoder.encode(["uint256"], [999]));

    expect(
      await decoder.pluck(
        data as string,
        tupleField2.location,
        tupleField2.size
      )
    ).to.equal(defaultAbiCoder.encode(["address"], [AddressOne]));
  });
  it("plucks DynamicTuple from nested AbiEncoded", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const inner = encode(
      ["tuple(bytes,uint256,uint256[])"],
      [["0xbadfed", 123, [456, 789]]]
    );

    const { data } = await testEncoder.populateTransaction.dynamic(inner);
    assert(data);

    const layout = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Pass,
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

    const result = await decoder.inspect(data as string, layout);

    const calldata = result.children[0];
    const tuple = calldata.children[0];
    const tupleField1 = tuple.children[0];
    const tupleField2 = tuple.children[1];
    const tupleField3 = tuple.children[2];

    expect(
      await decoder.pluck(data as string, tuple.location, tuple.size)
    ).to.equal(
      encode(
        ["tuple(bytes,uint256,uint256[])"],
        [["0xbadfed", 123, [456, 789]]],
        YesRemoveOffset
      )
    );

    expect(
      await decoder.pluck(
        data as string,
        tupleField1.location,
        tupleField1.size
      )
    ).to.equal(encode(["bytes"], ["0xbadfed"], YesRemoveOffset));

    expect(
      await decoder.pluck(
        data as string,
        tupleField2.location,
        tupleField2.size
      )
    ).to.equal(encode(["uint256"], [123]));

    expect(
      await decoder.pluck(
        data as string,
        tupleField3.location,
        tupleField3.size
      )
    ).to.equal(encode(["uint256[]"], [[456, 789]], YesRemoveOffset));
  });
  it("plucks Tuple with multiple dynamic fields", async () => {
    const { decoder, testEncoder } = await loadFixture(setup);

    const { data } = await testEncoder.populateTransaction.multiDynamicTuple({
      a: "0xaa",
      b: 123,
      c: "0xbadfed",
      d: [2, 3, 4],
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
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Dynamic,
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

    const result = await decoder.inspect(data as string, layout);

    const field1 = result.children[0].children[0];
    const field2 = result.children[0].children[1];
    const field3 = result.children[0].children[2];
    const field4 = result.children[0].children[3];

    expect(
      await decoder.pluck(data as string, field1.location, field1.size)
    ).to.equal(encode(["bytes"], ["0xaa"], YesRemoveOffset));

    expect(
      await decoder.pluck(data as string, field2.location, field2.size)
    ).to.equal(encode(["uint256"], [123], DontRemoveOffset));

    expect(
      await decoder.pluck(data as string, field3.location, field3.size)
    ).to.equal(encode(["bytes"], ["0xbadfed"], YesRemoveOffset));

    expect(
      await decoder.pluck(data as string, field4.location, field4.size)
    ).to.equal(encode(["uint256[]"], [[2, 3, 4]], YesRemoveOffset));
  });

  it.skip("plucks Array from top level");
  it.skip("plucks Array from Tuple");
  it.skip("plucks Array from Array");
  it.skip("plucks Array from nested Calldata");
  it.skip("plucks Array from nested AbiEncoded");

  describe("TypeTree", async () => {
    it("top level variants get unfolded to its entrypoint form", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.populateTransaction.staticDynamic(
        123,
        "0xaabbccddeeff"
      );
      assert(data);

      const layout = {
        paramType: ParameterType.None,
        operator: Operator.Or,
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
                paramType: ParameterType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
          {
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: ParameterType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: ParameterType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
          {
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            children: [
              {
                paramType: ParameterType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: ParameterType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await decoder.inspect(data, layout);
      expect(await decoder.pluck(data, result.location, result.size)).to.equal(
        data
      );

      const firstParam = result.children[0];
      expect(
        await decoder.pluck(data, firstParam.location, firstParam.size)
      ).to.equal(encode(["uint256"], [123]));

      const secondParam = result.children[1];
      expect(
        await decoder.pluck(data, secondParam.location, secondParam.size)
      ).to.equal(encode(["bytes"], ["0xaabbccddeeff"], YesRemoveOffset));
    });
    it("And gets unfolded to Static", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.populateTransaction.staticFn(
        "0xeeff3344"
      );

      assert(data);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.And,
            children: [
              {
                paramType: ParameterType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: ParameterType.Static,
                operator: Operator.EqualTo,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await decoder.inspect(data, layout);
      const staticField = result.children[0];
      expect(
        await decoder.pluck(data, staticField.location, staticField.size)
      ).to.equal(encode(["bytes4"], ["0xeeff3344"], DontRemoveOffset));
    });
    it("Or gets unfolded to Array - From Tuple", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.populateTransaction.dynamicTuple({
        dynamic: "0xaabb",
        _static: 88221,
        dynamic32: [1, 2, 3, 4, 5],
      });

      assert(data);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.Tuple,
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
                paramType: ParameterType.None,
                operator: Operator.Or,
                children: [
                  {
                    paramType: ParameterType.Array,
                    operator: Operator.EqualTo,
                    children: [
                      {
                        paramType: ParameterType.Static,
                        operator: Operator.EqualTo,
                        children: [],
                      },
                    ],
                  },
                  {
                    paramType: ParameterType.Array,
                    operator: Operator.EqualTo,
                    children: [
                      {
                        paramType: ParameterType.Static,
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
      };

      const result = await decoder.inspect(data, layout);

      const tupleField = result.children[0];
      expect(
        await decoder.pluck(data, tupleField.location, tupleField.size)
      ).to.equal(
        encode(
          ["tuple(bytes,uint256,uint256[])"],
          [["0xaabb", 88221, [1, 2, 3, 4, 5]]],
          YesRemoveOffset
        )
      );

      const arrayField = result.children[0].children[2];
      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size)
      ).to.equal(encode(["uint256[]"], [[1, 2, 3, 4, 5]], YesRemoveOffset));
    });
    it("Or gets unfolded to Static - From Array", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      const { data } = await testEncoder.populateTransaction.dynamicTuple({
        dynamic: "0xaabb",
        _static: 88221,
        dynamic32: [7, 8, 9],
      });

      assert(data);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.Tuple,
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
                operator: Operator.EqualTo,
                children: [
                  {
                    paramType: ParameterType.None,
                    operator: Operator.Or,
                    children: [
                      {
                        paramType: ParameterType.Static,
                        operator: Operator.EqualTo,
                        children: [],
                      },
                      {
                        paramType: ParameterType.Static,
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
      };

      const result = await decoder.inspect(data, layout);

      const tupleField = result.children[0];
      expect(
        await decoder.pluck(data, tupleField.location, tupleField.size)
      ).to.equal(
        encode(
          ["tuple(bytes,uint256,uint256[])"],
          [["0xaabb", 88221, [7, 8, 9]]],
          YesRemoveOffset
        )
      );

      const arrayField = result.children[0].children[2];
      expect(
        await decoder.pluck(data, arrayField.location, arrayField.size)
      ).to.equal(encode(["uint256[]"], [[7, 8, 9]], YesRemoveOffset));
    });
    it("extraneous Value in Calldata gets inspected as None", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);
      const { data } = await testEncoder.populateTransaction.staticFn(
        "0xeeff3344"
      );
      assert(data);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            children: [],
          },
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            children: [],
          },
        ],
      };

      const result = await decoder.inspect(data, layout);

      const extraneousField = result.children[0];
      expect(extraneousField.location).to.equal(4);
      expect(extraneousField.size).to.equal(0);

      const staticField = result.children[1];
      expect(staticField.location).to.equal(4);
      expect(staticField.size).to.equal(32);
    });
  });
});

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}
