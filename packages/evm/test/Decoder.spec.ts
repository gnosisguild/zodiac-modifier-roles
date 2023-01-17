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

enum ParameterType {
  Static = 0,
  Dynamic,
  Dynamic32,
  Tuple,
  Array,
}

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

    const layout = [
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Dynamic, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Dynamic32, comp: 0, children: [] },
    ];

    const result = await decoder.pluckParameters(data, layout);

    expect(result[0]._static).to.equal(
      defaultAbiCoder.encode(["address"], [AddressOne])
    );
    expect(result[1].dynamic).to.equal(solidityPack(["bytes"], ["0xabcd"]));
    expect(result[1].dynamic).to.equal("0xabcd");
    expect(
      result[2].dynamic32.map((s) => BigNumber.from(s).toNumber())
    ).to.deep.equal([10, 32, 55]);
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

    const layout = [
      { isScoped: true, _type: ParameterType.Dynamic, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Dynamic32, comp: 0, children: [] },
    ];

    const result = await decoder.pluckParameters(data, layout);
    expect(result[0].dynamic).to.equal(solidityPack(["bytes"], ["0x12ab45"]));
    expect(result[1]._static).to.equal(
      defaultAbiCoder.encode(["bool"], [false])
    );
    expect(result[2].dynamic32).to.deep.equal([
      defaultAbiCoder.encode(["bytes2"], ["0x1122"]),
      defaultAbiCoder.encode(["bytes2"], ["0x3344"]),
      defaultAbiCoder.encode(["bytes2"], ["0x5566"]),
    ]);
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

    const layout = [
      { isScoped: true, _type: ParameterType.Dynamic32, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Dynamic, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
    ];

    const result = await decoder.pluckParameters(data, layout);
    expect(result[0].dynamic32).to.deep.equal([
      "0xaabb000000000000000000000000000000000000000000000000000000000000",
      "0x1234000000000000000000000000000000000000000000000000000000000000",
      "0xff33000000000000000000000000000000000000000000000000000000000000",
    ]);
    expect(result[1].dynamic).to.equal(hexlify(toUtf8Bytes("Hello World!")));
    expect(result[2]._static).to.equal(BigNumber.from(123456789));
  });

  it("pluck fails if calldata is too short", async () => {
    const { testEncoder, decoder } = await setup();

    const { data } = await testEncoder.populateTransaction.staticFn(
      "0xaabbccdd"
    );

    assert(data);

    const layout = [
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
    ];

    await expect(decoder.pluckParameters(data, layout)).to.not.be.reverted;

    await expect(
      decoder.pluckParameters(data.slice(0, data.length - 2), layout)
    ).to.be.revertedWith("CalldataOutOfBounds()");
  });

  it("pluck fails with param scoped out of bounds", async () => {
    const { testEncoder, decoder } = await setup();

    const { data } = await testEncoder.populateTransaction.staticFn(
      "0xaabbccdd"
    );

    assert(data);

    const layout = [
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
    ];

    await expect(decoder.pluckParameters(data, layout)).to.be.revertedWith(
      "CalldataOutOfBounds()"
    );
  });

  it("plucks dynamicTuple from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))
    const { data } = await testEncoder.populateTransaction.dynamicTuple({
      dynamic: "0xabcd",
      _static: 100,
      dynamic32: [1, 2, 3],
    });

    const result = await decoder.pluckParameters(data as string, [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Dynamic,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Dynamic32,
            comp: 0,
            children: [],
          },
        ],
      },
    ]);

    expect(result[0].children[0].dynamic).to.equal("0xabcd");
    expect(result[0].children[1]._static).to.equal(BigNumber.from(100));
    expect(result[0].children[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000000000000000000000000000003",
    ]);
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

    const result = await decoder.pluckParameters(data as string, [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            children: [],
          },
        ],
      },
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
    ]);

    expect(result[0].children[0]._static).to.equal(BigNumber.from(1999));
    expect(result[0].children[1]._static).to.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
    expect(result[1]._static).to.deep.equal(BigNumber.from(2000));
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

    const result = await decoder.pluckParameters(data as string, [
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
      { isScoped: true, _type: ParameterType.Static, comp: 0, children: [] },
    ]);

    expect(result[0]._static).to.equal(BigNumber.from(1999));
    expect(result[1]._static).to.deep.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
    expect(result[2]._static).to.equal(BigNumber.from(2000));
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

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Dynamic,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            children: [
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const result = await decoder.pluckParameters(data as string, layout);

    expect(result[0].children[0]._static).to.equal(BigNumber.from(2023));
    expect(result[0].children[1].dynamic).to.equal("0xbadfed");
    expect(result[0].children[2].children[0]._static).to.equal(
      BigNumber.from(2020)
    );
    expect(result[0].children[2].children[1]._static).to.equal(
      "0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f"
    );
  });

  it("plucks dynamicTupleWithNestedDynamicTuple from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    const { data } =
      await testEncoder.populateTransaction.dynamicTupleWithNestedDynamicTuple({
        a: "0xbadfed",
        b: {
          a: 1234,
          b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        },
        c: 2023,
        d: {
          dynamic: "0xdeadbeef",
          _static: 999,
          dynamic32: [6, 7, 8],
        },
      });

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Dynamic,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            children: [
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
            ],
          },
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            children: [
              {
                isScoped: true,
                _type: ParameterType.Dynamic,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Dynamic32,
                comp: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const result = await decoder.pluckParameters(data as string, layout);

    expect(result[0].children[0].dynamic).to.equal("0xbadfed");

    expect(result[0].children[1].children[0]._static).to.equal(
      BigNumber.from(1234)
    );
    expect(result[0].children[1].children[1]._static).to.equal(
      "0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f"
    );

    expect(result[0].children[2]._static).to.equal(BigNumber.from(2023));

    expect(result[0].children[3].children[0].dynamic).to.equal("0xdeadbeef");
    expect(result[0].children[3].children[1]._static).to.equal(
      BigNumber.from(999)
    );
    expect(result[0].children[3].children[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000006",
      "0x0000000000000000000000000000000000000000000000000000000000000007",
      "0x0000000000000000000000000000000000000000000000000000000000000008",
    ]);
  });

  it("plucks dynamicTupleWithNestedArray from encoded calldata", async () => {
    const { decoder, testEncoder } = await setup();

    // function dynamicTupleWithNestedArray(tuple(uint256 a, bytes b, tuple(uint256 a, address b)[] c))
    const { data } =
      await testEncoder.populateTransaction.dynamicTupleWithNestedArray({
        a: 21000,
        b: "0x0badbeef",
        c: [{ a: 10, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" }],
      });

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Dynamic,
            comp: 0,
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Array,
            comp: 0,
            children: [
              {
                isScoped: true,
                _type: ParameterType.Tuple,
                comp: 0,
                children: [
                  {
                    isScoped: true,
                    _type: ParameterType.Static,
                    comp: 0,
                    children: [],
                  },
                  {
                    isScoped: true,
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
    ];

    // 0xfde07f12
    // 0000000000000000000000000000000000000000000000000000000000000020
    // 0000000000000000000000000000000000000000000000000000000000005208
    // 0000000000000000000000000000000000000000000000000000000000000060
    // 00000000000000000000000000000000000000000000000000000000000000a0
    // 0000000000000000000000000000000000000000000000000000000000000004
    // 0badbeef00000000000000000000000000000000000000000000000000000000
    // 0000000000000000000000000000000000000000000000000000000000000001
    // 000000000000000000000000000000000000000000000000000000000000000a
    // 00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f

    const result = await decoder.pluckParameters(data as string, layout);

    expect(result[0].children[0]._static).to.equal(BigNumber.from(21000));
    expect(result[0].children[1].dynamic).to.equal("0x0badbeef");
    expect(result[0].children[2].children[0].children[0]._static).to.equal(
      BigNumber.from(10)
    );
    expect(result[0].children[2].children[0].children[1]._static).to.equal(
      "0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f"
    );
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

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Array,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            children: [
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    // 0x83fb7968
    // 0000000000000000000000000000000000000000000000000000000000000020
    // 0000000000000000000000000000000000000000000000000000000000000002
    // 0000000000000000000000000000000000000000000000000000000000017587
    // 00000000000000000000000000000000219ab540356cbb839cbe05303d7705fa
    // 0000000000000000000000000000000000000000000000000000000000002d16
    // 0000000000000000000000000716a17fbaee714f1e6ab0f9d59edbc5f09815c0

    const result = await decoder.pluckParameters(data as string, layout);
    expect(result[0].children[0].children[0]._static).to.equal(
      BigNumber.from(95623)
    );
    expect(result[0].children[0].children[1]._static).to.equal(
      "0x00000000000000000000000000000000219ab540356cbb839cbe05303d7705fa"
    );
    expect(result[0].children[1].children[0]._static).to.equal(
      BigNumber.from(11542)
    );
    expect(result[0].children[1].children[1]._static).to.equal(
      "0x0000000000000000000000000716a17fbaee714f1e6ab0f9d59edbc5f09815c0"
    );
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
      ]);

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Array,
        comp: 0,
        children: [
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            children: [
              {
                isScoped: true,
                _type: ParameterType.Dynamic,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Dynamic32,
                comp: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const result = await decoder.pluckParameters(data as string, layout);

    expect(result[0].children[0].children[0].dynamic).to.equal("0xbadfed");
    expect(result[0].children[0].children[1]._static).to.equal(
      BigNumber.from(9998877)
    );
    expect(result[0].children[0].children[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000007",
      "0x0000000000000000000000000000000000000000000000000000000000000009",
    ]);
  });
});
