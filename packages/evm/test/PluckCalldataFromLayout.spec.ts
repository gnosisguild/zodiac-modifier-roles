import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { deployments } from "hardhat";

enum ParameterType {
  None = 0,
  Static,
  Dynamic,
  Dynamic32,
  Tuple,
  Array,
}

describe("PluckCalldataFromLayout", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const TestDecoder = await hre.ethers.getContractFactory("TestDecoder");
    const testDecoder = await TestDecoder.deploy();

    const MockPluckCalldata = await hre.ethers.getContractFactory(
      "MockPluckCalldata2"
    );
    const pluckCalldata = await MockPluckCalldata.deploy();

    return {
      testDecoder,
      pluckCalldata,
    };
  });

  it("plucks dynamicTuple from encoded calldata", async () => {
    const { pluckCalldata, testDecoder } = await setup();

    // function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))
    const { data } = await testDecoder.populateTransaction.dynamicTuple({
      dynamic: "0xabcd",
      _static: 100,
      dynamic32: [1, 2, 3],
    });

    const result = await pluckCalldata.pluck(data as string, [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        nested: [
          { isScoped: true, _type: ParameterType.Dynamic, comp: 0, nested: [] },
          { isScoped: true, _type: ParameterType.Static, comp: 0, nested: [] },
          {
            isScoped: true,
            _type: ParameterType.Dynamic32,
            comp: 0,
            nested: [],
          },
        ],
      },
    ]);

    expect(result[0].nested[0].dynamic).to.equal("0xabcd");
    expect(result[0].nested[1]._static).to.equal(BigNumber.from(100));
    expect(result[0].nested[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000000000000000000000000000003",
    ]);
  });

  it("plucks DynamicTupleWithNestedStaticTuple from encoded calldata", async () => {
    const { pluckCalldata, testDecoder } = await setup();

    // function dynamicTupleWithNestedStaticTuple(tuple(uint256 a, bytes b, tuple(uint256 a, address b) c))
    const { data } =
      await testDecoder.populateTransaction.dynamicTupleWithNestedStaticTuple({
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
        nested: [
          { isScoped: true, _type: ParameterType.Static, comp: 0, nested: [] },
          { isScoped: true, _type: ParameterType.Dynamic, comp: 0, nested: [] },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            nested: [
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                nested: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                nested: [],
              },
            ],
          },
        ],
      },
    ];

    const result = await pluckCalldata.pluck(data as string, layout);

    expect(result[0].nested[0]._static).to.equal(BigNumber.from(2023));
    expect(result[0].nested[1].dynamic).to.equal("0xbadfed");
    expect(result[0].nested[2].nested[0]._static).to.equal(
      BigNumber.from(2020)
    );
    expect(result[0].nested[2].nested[1]._static).to.equal(
      "0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f"
    );
  });

  it("plucks dynamicTupleWithNestedDynamicTuple from encoded calldata", async () => {
    const { pluckCalldata, testDecoder } = await setup();

    // function dynamicTupleWithNestedStaticTuple(tuple(uint256 a, bytes b, tuple(uint256 a, address b) c))
    const { data } =
      await testDecoder.populateTransaction.dynamicTupleWithNestedDynamicTuple({
        a: 2023,
        b: "0xbadfed",
        c: {
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
        nested: [
          { isScoped: true, _type: ParameterType.Static, comp: 0, nested: [] },
          { isScoped: true, _type: ParameterType.Dynamic, comp: 0, nested: [] },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            nested: [
              {
                isScoped: true,
                _type: ParameterType.Dynamic,
                comp: 0,
                nested: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                nested: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Dynamic32,
                comp: 0,
                nested: [],
              },
            ],
          },
        ],
      },
    ];

    const result = await pluckCalldata.pluck(data as string, layout);

    expect(result[0].nested[0]._static).to.equal(BigNumber.from(2023));
    expect(result[0].nested[1].dynamic).to.equal("0xbadfed");
    expect(result[0].nested[2].nested[0].dynamic).to.equal("0xdeadbeef");
    expect(result[0].nested[2].nested[1]._static).to.equal(BigNumber.from(999));
    expect(result[0].nested[2].nested[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000006",
      "0x0000000000000000000000000000000000000000000000000000000000000007",
      "0x0000000000000000000000000000000000000000000000000000000000000008",
    ]);
  });

  it("plucks dynamicTupleWithNestedArray from encoded calldata", async () => {
    const { pluckCalldata, testDecoder } = await setup();

    // function dynamicTupleWithNestedArray(tuple(uint256 a, bytes b, tuple(uint256 a, address b)[] c))
    const { data } =
      await testDecoder.populateTransaction.dynamicTupleWithNestedArray({
        a: 21000,
        b: "0x0badbeef",
        c: [{ a: 10, b: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" }],
      });

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        nested: [
          { isScoped: true, _type: ParameterType.Static, comp: 0, nested: [] },
          { isScoped: true, _type: ParameterType.Dynamic, comp: 0, nested: [] },
          {
            isScoped: true,
            _type: ParameterType.Array,
            comp: 0,
            nested: [
              {
                isScoped: true,
                _type: ParameterType.Tuple,
                comp: 0,
                nested: [
                  {
                    isScoped: true,
                    _type: ParameterType.Static,
                    comp: 0,
                    nested: [],
                  },
                  {
                    isScoped: true,
                    _type: ParameterType.Static,
                    comp: 0,
                    nested: [],
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

    const result = await pluckCalldata.pluck(data as string, layout);

    expect(result[0].nested[0]._static).to.equal(BigNumber.from(21000));
    expect(result[0].nested[1].dynamic).to.equal("0x0badbeef");
    expect(result[0].nested[2].nested[0].nested[0]._static).to.equal(
      BigNumber.from(10)
    );
    expect(result[0].nested[2].nested[0].nested[1]._static).to.equal(
      "0x00000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f"
    );
  });

  it("plucks arrayStaticTupleItems from encoded calldata", async () => {
    const { pluckCalldata, testDecoder } = await setup();

    // function arrayStaticTupleItems(tuple(uint256 a, address b)[])
    const { data } =
      await testDecoder.populateTransaction.arrayStaticTupleItems([
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
        nested: [
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            nested: [
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                nested: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                nested: [],
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

    const result = await pluckCalldata.pluck(data as string, layout);
    expect(result[0].nested[0].nested[0]._static).to.equal(
      BigNumber.from(95623)
    );
    expect(result[0].nested[0].nested[1]._static).to.equal(
      "0x00000000000000000000000000000000219ab540356cbb839cbe05303d7705fa"
    );
    expect(result[0].nested[1].nested[0]._static).to.equal(
      BigNumber.from(11542)
    );
    expect(result[0].nested[1].nested[1]._static).to.equal(
      "0x0000000000000000000000000716a17fbaee714f1e6ab0f9d59edbc5f09815c0"
    );
  });

  it("plucks arrayDynamicTupleItems from encoded calldata", async () => {
    const { pluckCalldata, testDecoder } = await setup();

    // function arrayDynamicTupleItems(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32)[])
    const { data } =
      await testDecoder.populateTransaction.arrayDynamicTupleItems([
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
        nested: [
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            nested: [
              {
                isScoped: true,
                _type: ParameterType.Dynamic,
                comp: 0,
                nested: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                nested: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Dynamic32,
                comp: 0,
                nested: [],
              },
            ],
          },
        ],
      },
    ];

    const result = await pluckCalldata.pluck(data as string, layout);

    expect(result[0].nested[0].nested[0].dynamic).to.equal("0xbadfed");
    expect(result[0].nested[0].nested[1]._static).to.equal(
      BigNumber.from(9998877)
    );
    expect(result[0].nested[0].nested[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000007",
      "0x0000000000000000000000000000000000000000000000000000000000000009",
    ]);
  });
});
