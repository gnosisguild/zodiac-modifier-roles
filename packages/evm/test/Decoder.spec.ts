import "@nomiclabs/hardhat-ethers";
import assert from "assert";

import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import { BigNumber } from "ethers";
import {
  defaultAbiCoder,
  hexlify,
  solidityPack,
  toUtf8Bytes,
} from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

import { Comparison, ParameterType, removeTrailingOffset } from "./utils";

describe("Decoder library", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return {
      testEncoder,
      decoder,
    };
  });

  it("plucks (dynamic) empty buffer from encoded caldata", async () => {
    const { testEncoder, decoder } = await setup();

    const { data } = await testEncoder.populateTransaction.dynamic("0x");
    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Dynamic,
          comp: Comparison.EqualTo,
          children: [],
        },
      ],
    };

    const result = await decoder.inspect(data, layout);
    expect(result.offset).to.equal(BigNumber.from(0));
    expect(result.size).to.equal(BigNumber.from((data.length - 2) / 2));

    expect(result.children[0].offset).to.equal(BigNumber.from(68));
    expect(result.children[0].size).to.equal(BigNumber.from(0));
  });

  it("plucks (static, dynamic, dynamic32) non nested parameters from encoded calldata", async () => {
    const { testEncoder, decoder } = await setup();

    // (address,bytes,uint32[])

    const { data } =
      await testEncoder.populateTransaction.staticDynamicDynamic32(
        AddressOne,
        "0xabcd",
        [10, 32, 55]
      );
    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Static,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.Dynamic,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
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
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(defaultAbiCoder.encode(["address"], [AddressOne]));

    expect(
      await decoder.pluck(
        data,
        result.children[1].offset,
        result.children[1].size
      )
    ).to.equal(solidityPack(["bytes"], ["0xabcd"]));

    expect(
      await decoder.pluck(
        data,
        result.children[2].offset,
        result.children[2].size
      )
    ).to.deep.equal(
      removeTrailingOffset(
        defaultAbiCoder.encode(["uint256[]"], [[10, 32, 55]])
      )
    );
  });

  it("plucks (dynamic, static, dynamic32) non nested parameters from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // (bytes,bool,bytes2[])

    const { data } =
      await testEncoder.populateTransaction.dynamicStaticDynamic32(
        "0x12ab45",
        false,
        ["0x1122", "0x3344", "0x5566"]
      );

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Dynamic,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.Static,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
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
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(solidityPack(["bytes"], ["0x12ab45"]));

    expect(
      await decoder.pluck(
        data,
        result.children[1].offset,
        result.children[1].size
      )
    ).to.equal(defaultAbiCoder.encode(["bool"], [false]));

    expect(
      await decoder.pluck(
        data,
        result.children[2].offset,
        result.children[2].size
      )
    ).to.equal(
      removeTrailingOffset(
        defaultAbiCoder.encode(["bytes2[]"], [["0x1122", "0x3344", "0x5566"]])
      )
    );
  });

  it("plucks (dynamic32, dynamic, static) non nested parameters from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // (bytes2[],string,uint32)

    const { data } =
      await testEncoder.populateTransaction.dynamic32DynamicStatic(
        ["0xaabb", "0x1234", "0xff33"],
        "Hello World!",
        123456789
      );

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
          ],
        },
        { _type: ParameterType.Dynamic, comp: 0, children: [] },
        { _type: ParameterType.Static, comp: 0, children: [] },
      ],
    };

    const result = await decoder.inspect(data, layout);
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.deep.equal(
      removeTrailingOffset(
        defaultAbiCoder.encode(["bytes2[]"], [["0xaabb", "0x1234", "0xff33"]])
      )
    );

    expect(
      await decoder.pluck(
        data,
        result.children[1].offset,
        result.children[1].size
      )
    ).to.equal(hexlify(toUtf8Bytes("Hello World!")));
    expect(
      await decoder.pluck(
        data,
        result.children[2].offset,
        result.children[2].size
      )
    ).to.equal(BigNumber.from(123456789));
  });

  it("pluck fails if calldata is too short", async () => {
    const { testEncoder, decoder } = await setup();

    const { data } = await testEncoder.populateTransaction.staticFn(
      "0xaabbccdd"
    );

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [{ _type: ParameterType.Static, comp: 0, children: [] }],
    };

    const result = await decoder.inspect(data, layout);

    await expect(
      decoder.pluck(
        data.slice(0, data.length - 2),
        result.children[0].offset,
        result.children[0].size
      )
    ).to.be.revertedWith("CalldataOutOfBounds()");
  });

  it("pluck fails with param scoped out of bounds", async () => {
    const { testEncoder, decoder } = await setup();

    const { data } = await testEncoder.populateTransaction.staticFn(
      "0xaabbccdd"
    );

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        { _type: ParameterType.Static, comp: 0, children: [] },
        { _type: ParameterType.Static, comp: 0, children: [] },
      ],
    };

    const result = await decoder.inspect(data, layout);

    await expect(
      decoder.pluck(data, result.children[1].offset, result.children[1].size)
    ).to.be.revertedWith("CalldataOutOfBounds()");
  });

  it("plucks dynamicTuple from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))
    const { data } = await testEncoder.populateTransaction.dynamicTuple({
      dynamic: "0xabcd",
      _static: 100,
      dynamic32: [1, 2, 3],
    });

    assert(data);
    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Dynamic,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Array,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data, layout);

    // removing the tuple and letting the abi encoder ommit the offset
    const implicit = defaultAbiCoder.encode(
      ["bytes", "uint256", "uint256[]"],
      ["0xabcd", 100, [1, 2, 3]]
    );
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(implicit);

    // removing the offset
    const explicit = removeTrailingOffset(
      defaultAbiCoder.encode(
        ["tuple(bytes,uint256,uint256[])"],
        [["0xabcd", 100, [1, 2, 3]]]
      )
    );
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(explicit);
  });

  it("plucks staticTuple (explicitly) from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    const { data } = await testEncoder.populateTransaction.staticTuple(
      {
        a: 1999,
        b: AddressOne,
      },
      2000
    );

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
          ],
        },
        { _type: ParameterType.Static, comp: 0, children: [] },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(
      defaultAbiCoder.encode(
        ["tuple(uint256, address)"],
        [[1999, "0x0000000000000000000000000000000000000001"]]
      )
    );

    // alternative way
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(
      defaultAbiCoder.encode(
        ["uint256", "address"],
        [1999, "0x0000000000000000000000000000000000000001"]
      )
    );

    expect(
      await decoder.pluck(
        data,
        result.children[1].offset,
        result.children[1].size
      )
    ).to.deep.equal(defaultAbiCoder.encode(["uint256"], [2000]));
  });

  it("plucks staticTuple (implicitly) from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    const { data } = await testEncoder.populateTransaction.staticTuple(
      {
        a: 1999,
        b: AddressOne,
      },
      2000
    );

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        { _type: ParameterType.Static, comp: 0, children: [] },
        { _type: ParameterType.Static, comp: 0, children: [] },
        { _type: ParameterType.Static, comp: 0, children: [] },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(defaultAbiCoder.encode(["uint256"], [1999]));

    expect(
      await decoder.pluck(
        data,
        result.children[1].offset,
        result.children[1].size
      )
    ).to.equal(
      defaultAbiCoder.encode(
        ["address"],
        ["0x0000000000000000000000000000000000000001"]
      )
    );
  });

  it("plucks DynamicTupleWithNestedStaticTuple from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // function dynamicTupleWithNestedStaticTuple(tuple(uint256 a, bytes b, tuple(uint256 a, address b) c))
    const { data } =
      await testEncoder.populateTransaction.dynamicTupleWithNestedStaticTuple({
        a: 2023,
        b: "0xbadfed",
        c: {
          a: 2020,
          b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        },
      });

    const expected = defaultAbiCoder.encode(
      ["uint256", "bytes", "tuple(uint256, address)"],
      [2023, "0xbadfed", [2020, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]]
    );

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Dynamic,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Tuple,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    assert(data);

    const result = await decoder.inspect(data, layout);
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(expected);

    const field = result.children[0].children[2].children[0];
    expect(await decoder.pluck(data, field.offset, field.size)).to.equal(
      defaultAbiCoder.encode(["uint256"], [2020])
    );
  });

  it("plucks dynamicTupleWithNestedDynamicTuple from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    const dynamicValue = "0xdeadbeef";
    const addressValue = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

    const { data } =
      await testEncoder.populateTransaction.dynamicTupleWithNestedDynamicTuple({
        a: "0xbadfed",
        b: {
          a: 1234,
          b: addressValue,
        },
        c: 2023,
        d: {
          dynamic: dynamicValue,
          _static: 999,
          dynamic32: [6, 7, 8],
        },
      });

    assert(data);

    const expected = defaultAbiCoder.encode(
      [
        "bytes",
        "tuple(uint256, address)",
        "uint256",
        "tuple(bytes,uint256, uint256[])",
      ],
      ["0xbadfed", [1234, addressValue], 2023, [dynamicValue, 999, [6, 7, 8]]]
    );

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Dynamic,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Tuple,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
              ],
            },
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Tuple,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Dynamic,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Array,
                  comp: 0,
                  children: [
                    {
                      _type: ParameterType.Static,
                      comp: 0,
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

    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(expected);

    const fieldWithAddress = result.children[0].children[1].children[1];
    const fieldWithAddressExpected = defaultAbiCoder.encode(
      ["address"],
      [addressValue]
    );
    expect(
      await decoder.pluck(data, fieldWithAddress.offset, fieldWithAddress.size)
    ).to.equal(fieldWithAddressExpected);

    const fieldWithDynamic = result.children[0].children[3].children[0];
    expect(
      await decoder.pluck(data, fieldWithDynamic.offset, fieldWithDynamic.size)
    ).to.equal(dynamicValue);
  });

  it("plucks dynamicTupleWithNestedArray from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    const dynamicValue = "0x0badbeef";

    // function dynamicTupleWithNestedArray(tuple(uint256 a, bytes b, tuple(uint256 a, address b)[] c))
    const { data } =
      await testEncoder.populateTransaction.dynamicTupleWithNestedArray({
        a: 21000,
        b: dynamicValue,
        c: [{ a: 10, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" }],
      });

    assert(data);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Dynamic,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Array,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Tuple,
                  comp: 0,
                  children: [
                    {
                      _type: ParameterType.Static,
                      comp: 0,
                      children: [],
                    },
                    {
                      _type: ParameterType.Static,
                      comp: 0,
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

    // check root
    expect(await decoder.pluck(data, result.offset, result.size)).to.equal(
      data
    );

    // check top tuple
    const expected = removeTrailingOffset(
      defaultAbiCoder.encode(
        ["tuple(uint256,bytes,tuple(uint256,address)[])"],
        [
          [
            21000,
            dynamicValue,
            [[10, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]],
          ],
        ]
      )
    );
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(expected);

    // check nested tuple
    const fieldTuple = result.children[0].children[2];
    const fieldTupleExpected = removeTrailingOffset(
      defaultAbiCoder.encode(
        ["tuple(uint256,address)[]"],
        [[[10, "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]]]
      )
    );
    expect(
      await decoder.pluck(data, fieldTuple.offset, fieldTuple.size)
    ).to.equal(fieldTupleExpected);

    // check a leaf
    const fieldDynamic = result.children[0].children[1];
    expect(
      await decoder.pluck(data, fieldDynamic.offset, fieldDynamic.size)
    ).to.equal(dynamicValue);
  });

  it("plucks arrayStaticTupleItems from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // function arrayStaticTupleItems(tuple(uint256 a, address b)[])
    const { data } =
      await testEncoder.populateTransaction.arrayStaticTupleItems([
        {
          a: 95623,
          b: "0x00000000219ab540356cbb839cbe05303d7705fa",
        },
        {
          a: 11542,
          b: "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0",
        },
      ]);

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Tuple,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = await decoder.inspect(data as string, layout);

    // check root
    expect(
      await decoder.pluck(data as string, result.offset, result.size)
    ).to.equal(data);

    // check array
    const arrayField = result.children[0];
    const expected = removeTrailingOffset(
      defaultAbiCoder.encode(
        ["tuple(uint256,address)[]"],
        [
          [
            [95623, "0x00000000219ab540356cbb839cbe05303d7705fa"],
            [11542, "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0"],
          ],
        ]
      )
    );
    expect(
      await decoder.pluck(data as string, arrayField.offset, arrayField.size)
    ).to.equal(expected);
  });

  it("plucks arrayDynamicTupleItems from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // function arrayDynamicTupleItems(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32)[])
    const { data } =
      await testEncoder.populateTransaction.arrayDynamicTupleItems([
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

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Tuple,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Dynamic,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
                {
                  _type: ParameterType.Array,
                  comp: 0,
                  children: [
                    {
                      _type: ParameterType.Static,
                      comp: 0,
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
    assert(data);
    const result = await decoder.inspect(data, layout);

    // check root
    expect(await decoder.pluck(data, result.offset, result.size)).to.equal(
      data
    );

    // check array
    const expected = removeTrailingOffset(
      defaultAbiCoder.encode(
        ["tuple(bytes,uint256, uint256[])[]"],
        [
          [
            ["0xbadfed", 9998877, [7, 9]],
            ["0x0badbeef", 444555, [4, 5, 6]],
          ],
        ]
      )
    );
    expect(
      await decoder.pluck(
        data,
        result.children[0].offset,
        result.children[0].size
      )
    ).to.equal(expected);

    // check array field
    const arrayField = result.children[0].children[1].children[2];
    const arrayFieldExpected = removeTrailingOffset(
      defaultAbiCoder.encode(["uint256[]"], [[4, 5, 6]])
    );
    expect(
      await decoder.pluck(data, arrayField.offset, arrayField.size)
    ).to.equal(arrayFieldExpected);
  });

  it("plucks nested AbiEncoded from top level", async () => {
    const { decoder, testEncoder } = await setup();

    const number = 123456789;
    const address = "0x0000000000000000000000000000000000000001";

    const { data: nestedData } = await testEncoder.populateTransaction.simple(
      number
    );

    const { data } =
      await testEncoder.populateTransaction.staticDynamicDynamic32(
        address,
        nestedData as string,
        []
      );

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Static,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.AbiEncoded,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
          ],
        },
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    // check the nested field as whole
    const nestedDataField = result.children[1];
    expect(
      await decoder.pluck(
        data as string,
        nestedDataField.offset,
        nestedDataField.size
      )
    ).to.equal(nestedData as string);

    // check the nested uint
    const nestedUintField = result.children[1].children[0];
    const nestedUintFieldExpected = defaultAbiCoder.encode(
      ["uint256"],
      [number]
    );
    expect(
      await decoder.pluck(
        data as string,
        nestedUintField.offset,
        nestedUintField.size
      )
    ).to.equal(nestedUintFieldExpected);
  });

  it("plucks nested AbiEncoded from within a tuple", async () => {
    const { decoder, testEncoder } = await setup();

    const { data: nestedData } =
      await testEncoder.populateTransaction.dynamicTuple({
        dynamic: "0x00",
        _static: 0,
        dynamic32: [55, 66, 88],
      });

    const { data } = await testEncoder.populateTransaction.dynamicTuple({
      dynamic: nestedData as string,
      _static: 0,
      dynamic32: [],
    });

    const nestedLayout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Dynamic,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Array,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            nestedLayout,
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Array,
              comp: 0,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    // check the nested field as whole
    const nestedDataField = result.children[0].children[0];
    expect(
      await decoder.pluck(
        data as string,
        nestedDataField.offset,
        nestedDataField.size
      )
    ).to.equal(nestedData as string);

    // check the nested uint
    const nestedArrayField =
      result.children[0].children[0].children[0].children[2];
    const expected = removeTrailingOffset(
      defaultAbiCoder.encode(["uint256[]"], [[55, 66, 88]])
    );
    expect(
      await decoder.pluck(
        data as string,
        nestedArrayField.offset,
        nestedArrayField.size
      )
    ).to.equal(expected);
  });

  it("plucks nested AbiEncoded from within an array", async () => {
    const { decoder, testEncoder } = await setup();

    const { data: nestedData } =
      await testEncoder.populateTransaction.dynamicStaticDynamic32(
        "0xaabbccdd",
        false,
        ["0xaabb", "0xf26b"]
      );

    assert(nestedData);

    const { data } = await testEncoder.populateTransaction.dynamicArray([
      nestedData,
      nestedData,
    ]);

    const nestedLayout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Dynamic,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.Static,
          comp: 0,
          children: [],
        },
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
          ],
        },
      ],
    };

    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: Comparison.Matches,
      children: [
        {
          _type: ParameterType.Array,
          comp: 0,
          children: [nestedLayout],
        },
      ],
    };

    const result = await decoder.inspect(data as string, layout);

    // check the nested field as whole
    const nestedDataField = result.children[0].children[0];
    expect(
      await decoder.pluck(
        data as string,
        nestedDataField.offset,
        nestedDataField.size
      )
    ).to.equal(nestedData as string);

    const nesteArrayWithinDataField =
      result.children[0].children[0].children[2];

    let expected = removeTrailingOffset(
      defaultAbiCoder.encode(["bytes2[]"], [["0xaabb", "0xf26b"]])
    );

    expect(
      await decoder.pluck(
        data as string,
        nesteArrayWithinDataField.offset,
        nesteArrayWithinDataField.size
      )
    ).to.equal(expected);

    const bytes2NestedField =
      result.children[0].children[0].children[2].children[1];
    expected = defaultAbiCoder.encode(["bytes2"], ["0xf26b"]);
    expect(
      await decoder.pluck(
        data as string,
        bytes2NestedField.offset,
        bytes2NestedField.size
      )
    ).to.equal(expected);
  });
});
