import "@nomiclabs/hardhat-ethers";
import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import { BigNumber, constants } from "ethers";
import {
  defaultAbiCoder,
  hexlify,
  solidityPack,
  toUtf8Bytes,
} from "ethers/lib/utils";
import hre, { deployments, waffle, ethers } from "hardhat";

const COMP_EQUAL = 0;
// const COMP_GREATER = 1;
// const COMP_LESS = 2;

const OPTIONS_NONE = 0;
// const OPTIONS_SEND = 1;
// const OPTIONS_DELEGATECALL = 2;
// const OPTIONS_BOTH = 3;

enum ParameterType {
  None = 0,
  Static,
  Dynamic,
  Dynamic32,
}

const UNSCOPED_PARAM = {
  isScoped: false,
  _type: ParameterType.None,
  comp: COMP_EQUAL,
  compValues: [],
};

describe("PluckCalldata library", async () => {
  const ROLE_ID = 0;
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestPluckParam = await hre.ethers.getContractFactory(
      "TestPluckParam"
    );
    const testPluckParam = await TestPluckParam.deploy();

    const TestPluckTupleParam = await hre.ethers.getContractFactory(
      "TestPluckTupleParam"
    );
    const testPluckTupleParam = await TestPluckTupleParam.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier.connect(owner).scopeTarget(ROLE_ID, testPluckParam.address);

    const MockPluckCalldata = await hre.ethers.getContractFactory(
      "MockPluckCalldata"
    );
    const pluckCalldata = await MockPluckCalldata.deploy();

    return {
      testPluckParam,
      testPluckTupleParam,
      pluckCalldata,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  it("static, dynamic - (bytes4, string)", async () => {
    const { testPluckParam, pluckCalldata } = await setup();

    const { data } = await testPluckParam.populateTransaction.staticDynamic(
      "0x12345678",
      "Hello World!"
    );

    const arg1 = await pluckCalldata.pluckStaticParam(data as string, 0);
    const arg2 = await pluckCalldata.pluckDynamicParam(data as string, 1);

    expect(defaultAbiCoder.encode(["bytes4"], ["0x12345678"])).to.equal(arg1);
    expect(hexlify(toUtf8Bytes("Hello World!"))).to.equal(arg2);
  });

  it("static, dynamic, dynamic32 - (address,bytes,uint32[])", async () => {
    const { testPluckParam, pluckCalldata } = await setup();

    const { data } =
      await testPluckParam.populateTransaction.staticDynamicDynamic32(
        AddressOne,
        "0xabcd",
        [10, 32, 55]
      );

    const arg1 = await pluckCalldata.pluckStaticParam(data as string, 0);
    const arg2 = await pluckCalldata.pluckDynamicParam(data as string, 1);
    const arg3 = await pluckCalldata.pluckDynamic32Param(data as string, 2);

    expect(arg1).to.equal(defaultAbiCoder.encode(["address"], [AddressOne]));
    expect(arg2).to.equal(solidityPack(["bytes"], ["0xabcd"]));
    expect(arg2).to.equal("0xabcd");
    expect(arg3.map((s) => BigNumber.from(s).toNumber())).to.deep.equal([
      10, 32, 55,
    ]);
  });

  it("static, dynamic32, dynamic - (uint32,bytes4[],string)", async () => {
    const { pluckCalldata, testPluckParam } = await setup();

    const { data } =
      await testPluckParam.populateTransaction.staticDynamic32Dynamic(
        123,
        ["0xabcdef12"],
        "Hello World!"
      );

    const arg1 = await pluckCalldata.pluckStaticParam(data as string, 0);
    const arg2 = await pluckCalldata.pluckDynamic32Param(data as string, 1);
    const arg3 = await pluckCalldata.pluckDynamicParam(data as string, 2);

    expect(arg1).to.equal(defaultAbiCoder.encode(["uint32"], [123]));
    expect(arg2).to.deep.equal([
      defaultAbiCoder.encode(["bytes4"], ["0xabcdef12"]),
    ]);
    expect(arg3).to.equal(hexlify(toUtf8Bytes("Hello World!")));
  });

  it("dynamic, static, dynamic32 - (bytes,bool,bytes2[])", async () => {
    const { pluckCalldata, testPluckParam } = await setup();

    const { data } =
      await testPluckParam.populateTransaction.dynamicStaticDynamic32(
        "0x12ab45",
        false,
        ["0x1122", "0x3344", "0x5566"]
      );

    const arg1 = await pluckCalldata.pluckDynamicParam(data as string, 0);
    const arg2 = await pluckCalldata.pluckStaticParam(data as string, 1);
    const arg3 = await pluckCalldata.pluckDynamic32Param(data as string, 2);

    expect(arg1).to.equal(solidityPack(["bytes"], ["0x12ab45"]));
    expect(arg2).to.equal(defaultAbiCoder.encode(["bool"], [false]));
    expect(arg3).to.deep.equal([
      defaultAbiCoder.encode(["bytes2"], ["0x1122"]),
      defaultAbiCoder.encode(["bytes2"], ["0x3344"]),
      defaultAbiCoder.encode(["bytes2"], ["0x5566"]),
    ]);
  });

  it("dynamic, dynamic32, static - (string,uint32[],uint256)", async () => {
    const { pluckCalldata, testPluckParam } = await setup();

    const { data } =
      await testPluckParam.populateTransaction.dynamicDynamic32Static(
        "Hello World!",
        [1975, 2000, 2025],
        123456789
      );

    const arg1 = await pluckCalldata.pluckDynamicParam(data as string, 0);
    const arg2 = await pluckCalldata.pluckDynamic32Param(data as string, 1);
    const arg3 = await pluckCalldata.pluckStaticParam(data as string, 2);

    expect(arg1).to.equal(hexlify(toUtf8Bytes("Hello World!")));
    expect(arg2.map((s) => BigNumber.from(s).toNumber())).to.deep.equal([
      1975, 2000, 2025,
    ]);
    expect(BigNumber.from(arg3).toNumber()).to.equal(123456789);
  });

  it("dynamic32, static, dynamic - (address[],bytes2,bytes)", async () => {
    const { pluckCalldata, testPluckParam } = await setup();

    const { data } =
      await testPluckParam.populateTransaction.dynamic32StaticDynamic(
        [AddressOne, AddressOne],
        "0xaabb",
        "0x0123456789abcdef0123456789abcdef"
      );

    const arg1 = await pluckCalldata.pluckDynamic32Param(data as string, 0);
    const arg2 = await pluckCalldata.pluckStaticParam(data as string, 1);
    const arg3 = await pluckCalldata.pluckDynamicParam(data as string, 2);

    expect(arg1).to.deep.equal([
      defaultAbiCoder.encode(["address"], [AddressOne]),
      defaultAbiCoder.encode(["address"], [AddressOne]),
    ]);

    expect(arg2).to.equal(defaultAbiCoder.encode(["bytes2"], ["0xaabb"]));
    expect(arg3).to.equal("0x0123456789abcdef0123456789abcdef");
  });

  it("dynamic32, dynamic, static - (bytes2[],string,uint32)", async () => {
    const { pluckCalldata, testPluckParam } = await setup();

    const { data } =
      await testPluckParam.populateTransaction.dynamic32DynamicStatic(
        ["0xaabb", "0xccdd", "0x1122"],
        "Hello World!",
        8976
      );

    const arg1 = await pluckCalldata.pluckDynamic32Param(data as string, 0);
    const arg2 = await pluckCalldata.pluckDynamicParam(data as string, 1);
    const arg3 = await pluckCalldata.pluckStaticParam(data as string, 2);

    expect(arg1).to.deep.equal([
      defaultAbiCoder.encode(["bytes2"], ["0xaabb"]),
      defaultAbiCoder.encode(["bytes2"], ["0xccdd"]),
      defaultAbiCoder.encode(["bytes2"], ["0x1122"]),
    ]);
    expect(arg2).to.equal(hexlify(toUtf8Bytes("Hello World!")));
    expect(arg3).to.equal(defaultAbiCoder.encode(["uint32"], [8976]));
  });

  it("tuple(static, dynamic, dynamic32) - (tuple(uint256, bytes, uint256[]))", async () => {
    const { pluckCalldata, testPluckTupleParam } = await setup();

    const { data } = await testPluckTupleParam.populateTransaction.dynamicTuple(
      { _static: 100, dynamic: "0xabcd", dynamic32: [1, 2, 3] }
    );

    const result = await pluckCalldata.pluckTupleParam(data as string, 0, [
      ParameterType.Static,
      ParameterType.Dynamic,
      ParameterType.Dynamic32,
    ]);

    expect(result[0]._type).to.equal(ParameterType.Static);
    expect(result[0]._static).to.equal(BigNumber.from(100));
    expect(result[0].dynamic).to.equal("0x");
    expect(result[0].dynamic32).to.deep.equal([]);

    expect(result[1]._type).to.equal(ParameterType.Dynamic);
    expect(result[1]._static).to.equal(constants.HashZero);
    expect(result[1].dynamic).to.equal("0xabcd");
    expect(result[1].dynamic32).to.deep.equal([]);

    expect(result[2]._type).to.equal(ParameterType.Dynamic32);
    expect(result[2]._static).to.equal(constants.HashZero);
    expect(result[2].dynamic).to.equal("0x");
    expect(result[2].dynamic32).to.deep.equal([
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000000000000000000000000000003",
    ]);

    // normal
    // 0x9707b548
    // 0000000000000000000000000000000000000000000000000000000000000020
    // 0000000000000000000000000000000000000000000000000000000000000064
    // 0000000000000000000000000000000000000000000000000000000000000060
    // 00000000000000000000000000000000000000000000000000000000000000a0
    // 0000000000000000000000000000000000000000000000000000000000000002
    // abcd000000000000000000000000000000000000000000000000000000000000
    // 0000000000000000000000000000000000000000000000000000000000000003
    // 0000000000000000000000000000000000000000000000000000000000000001
    // 0000000000000000000000000000000000000000000000000000000000000002
    // 0000000000000000000000000000000000000000000000000000000000000003

    // post
    // 0xc8b9a899
    // 0000000000000000000000000000000000000000000000000000000000000009
    // 0000000000000000000000000000000000000000000000000000000000000040
    // 0000000000000000000000000000000000000000000000000000000000000064
    // 0000000000000000000000000000000000000000000000000000000000000060
    // 00000000000000000000000000000000000000000000000000000000000000a0
    // 0000000000000000000000000000000000000000000000000000000000000002
    // abcd000000000000000000000000000000000000000000000000000000000000
    // 0000000000000000000000000000000000000000000000000000000000000003
    // 0000000000000000000000000000000000000000000000000000000000000001
    // 0000000000000000000000000000000000000000000000000000000000000002
    // 0000000000000000000000000000000000000000000000000000000000000003

    // console.log(data2);
  });

  it("don't try this at home", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("unsupportedFixedSizeAndDynamic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: ParameterType.Static,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bool"], [false])],
        },
        {
          isScoped: true,
          _type: ParameterType.Static,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bool"], [false])],
        },
        {
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.unsupportedFixedSizeAndDynamic(
        [false, false],
        "Hello World!"
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.unsupportedFixedSizeAndDynamic(
        [true, false],
        "Hello World!"
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataGood as string,
          0
        )
    ).to.emit(testPluckParam, "UnsupportedFixedSizeAndDynamic");

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataBad as string,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");
  });

  it("static - fails if calldata is too short", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticFn")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: ParameterType.Static,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes4"], ["0x12345678"])],
        },
      ],
      OPTIONS_NONE
    );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testPluckParam.address, 0, SELECTOR, 0)
    ).to.be.revertedWith("CalldataOutOfBounds()");

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          `${SELECTOR}aabbccdd`,
          0
        )
    ).to.be.revertedWith("CalldataOutOfBounds()");
  });

  it("static - fails with param scoped out of bounds", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticFn")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: ParameterType.Static,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes4"], ["0x12345678"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data } = await testPluckParam.populateTransaction.staticFn(
      "0x12345678"
    );

    // ok
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testPluckParam.address, 0, data as string, 0)
    ).to.emit(testPluckParam, "Static");

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: ParameterType.Static,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes4"], ["0x12345678"])],
        },
        {
          isScoped: true,
          _type: ParameterType.Static,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes4"], ["0x12345678"])],
        },
      ],
      OPTIONS_NONE
    );

    // ngmi
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testPluckParam.address, 0, data as string, 0)
    ).to.be.revertedWith("CalldataOutOfBounds()");
  });

  it("dynamic - fails if calldata too short", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticDynamic")
    );

    const SELECTOR_OTHER = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticFn")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.staticDynamic(
        "0x12345678",
        "Hello World!"
      );

    const dataShort = (
      (await testPluckParam.populateTransaction.staticFn("0x12345678"))
        .data as string
    ).replace(SELECTOR_OTHER.slice(2), SELECTOR.slice(2));

    // shortned call
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testPluckParam.address, 0, dataShort, 0)
    ).to.be.revertedWith("CalldataOutOfBounds()");

    // just the selector
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testPluckParam.address, 0, SELECTOR, 0)
    ).to.be.revertedWith("CalldataOutOfBounds()");

    // ok
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataGood as string,
          0
        )
    ).to.not.be.reverted;
  });

  it("dynamic - fails if payload is missing", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticDynamic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.staticDynamic(
        "0x12345678",
        "Hello World!"
      );

    // 0x737c0619 -> staticDynamic selector
    const dataBad = `0x737c061900000000000000000000000000000000000000000000000000000000123456780000000000000000000000000000000000000000000000000000000000300001`;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataBad as string,
          0
        )
    ).to.be.revertedWith("CalldataOutOfBounds()");

    // ok
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataGood as string,
          0
        )
    ).to.not.be.reverted;
  });

  it("dynamic - fails with parameter scoped out of bounds", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();
    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticDynamic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.staticDynamic(
        "0x12345678",
        "Hello World!"
      );
    // ok
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataGood as string,
          0
        )
    ).to.not.be.reverted;

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
      ],
      OPTIONS_NONE
    );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testPluckParam.address,
          0,
          dataGood as string,
          0
        )
    ).to.be.revertedWith("CalldataOutOfBounds()");
  });
});

function encodeStatic(types: any[], values: any[]) {
  return ethers.utils.defaultAbiCoder.encode(types, values);
}

function encodeDynamic(types: any[], values: any[]) {
  return ethers.utils.solidityPack(types, values);
}
