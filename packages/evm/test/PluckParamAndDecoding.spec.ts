import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const COMP_EQUAL = 0;
const COMP_GREATER = 1;
const COMP_LESS = 2;

const OPTIONS_NONE = 0;
const OPTIONS_SEND = 1;
const OPTIONS_DELEGATECALL = 2;
const OPTIONS_BOTH = 3;

const TYPE_NONE = 0;
const TYPE_STATIC = 1;
const TYPE_DYNAMIC = 2;
const TYPE_DYNAMIC32 = 3;

const UNSCOPED_PARAM = {
  isScoped: false,
  _type: TYPE_NONE,
  comp: COMP_EQUAL,
  compValues: [],
};

describe("PluckParam - Decoding", async () => {
  const ROLE_ID = 0;
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestPluckParam = await hre.ethers.getContractFactory(
      "TestPluckParam"
    );
    const testPluckParam = await TestPluckParam.deploy();

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

    return {
      testPluckParam,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  it("static, dynamic - (bytes4, string)", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticDynamic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes4"], ["0x12345678"])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
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

    const { data: dataBad } =
      await testPluckParam.populateTransaction.staticDynamic(
        "0x12345678",
        "Good Morning!"
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
    ).to.emit(testPluckParam, "StaticDynamic");

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

  it("static, dynamic, dynamic32 - (address,bytes,uint32[])", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticDynamicDynamic32")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["address"], [AddressOne])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["bytes"], ["0xabcd"])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic32(["uint32[]"], [[1, 2, 3]])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.staticDynamicDynamic32(
        AddressOne,
        "0xabcd",
        [1, 2, 3]
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.staticDynamicDynamic32(
        AddressOne,
        "0xabcd",
        [1, 2, 4]
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
    ).to.emit(testPluckParam, "StaticDynamicDynamic32");

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

  it("static, dynamic32, dynamic - (uint32,bytes4[],string)", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("staticDynamic32Dynamic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["uint32"], [123])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic32(["bytes4[]"], [["0xabcdef12"]])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.staticDynamic32Dynamic(
        [123],
        ["0xabcdef12"],
        "Hello World!"
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.staticDynamic32Dynamic(
        [123],
        ["0xabcdef12"],
        "Hello World?"
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
    ).to.emit(testPluckParam, "StaticDynamic32Dynamic");

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

  it("dynamic, static, dynamic32 - (bytes,bool,bytes2[])", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("dynamicStaticDynamic32")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["bytes"], ["0x12ab45"])],
        },
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bool"], [false])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic32(["bytes2[]"], [["0x1122", "0x3344"]])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.dynamicStaticDynamic32(
        "0x12ab45",
        false,
        ["0x1122", "0x3344"]
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.dynamicStaticDynamic32(
        "0x12ab45",
        false,
        ["0x1122", "0x3344", "0x5566"]
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
    ).to.emit(testPluckParam, "DynamicStaticDynamic32");

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

  it("dynamic, dynamic32, static - (string,uint32[],uint256)", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("dynamicDynamic32Static")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic32(["uint32[]"], [[1975, 2000, 2025]])],
        },
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["uint256"], [123456789])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.dynamicDynamic32Static(
        "Hello World!",
        [1975, 2000, 2025],
        123456789
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.dynamicDynamic32Static(
        "Hello World!",
        [1975, 2000],
        123456789
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
    ).to.emit(testPluckParam, "DynamicDynamic32Static");

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

  it("dynamic32, static, dynamic - (address[],bytes2,bytes)", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("dynamic32StaticDynamic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: COMP_EQUAL,
          compValues: [
            encodeDynamic32(["address[]"], [[AddressOne, AddressOne]]),
          ],
        },
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes2"], ["0xaabb"])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["bytes"], ["0x0123456789abcdef"])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.dynamic32StaticDynamic(
        [AddressOne, AddressOne],
        "0xaabb",
        "0x0123456789abcdef"
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.dynamic32StaticDynamic(
        [AddressOne, AddressOne],
        "0xaabb",
        "0x0123456789abcdef0123456789abcdef"
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
    ).to.emit(testPluckParam, "Dynamic32StaticDynamic");

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

  it("dynamic32, dynamic, static - (bytes2[],string,uint32)", async () => {
    const { modifier, testPluckParam, owner, invoker } = await setup();

    const SELECTOR = testPluckParam.interface.getSighash(
      testPluckParam.interface.getFunction("dynamic32DynamicStatic")
    );

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testPluckParam.address,
      SELECTOR,
      [
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: COMP_EQUAL,
          compValues: [
            encodeDynamic32(["bytes2[]"], [["0xaabb", "0xccdd", "0x1122"]]),
          ],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: COMP_EQUAL,
          compValues: [encodeDynamic(["string"], ["Hello World!"])],
        },
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["uint32"], [8976])],
        },
      ],
      OPTIONS_NONE
    );

    const { data: dataGood } =
      await testPluckParam.populateTransaction.dynamic32DynamicStatic(
        ["0xaabb", "0xccdd", "0x1122"],
        "Hello World!",
        8976
      );

    const { data: dataBad } =
      await testPluckParam.populateTransaction.dynamic32DynamicStatic(
        ["0xaabb", "0xccdd", "0x3344"],
        "Hello World!",
        8976
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
    ).to.emit(testPluckParam, "Dynamic32DynamicStatic");

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
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bool"], [false])],
        },
        {
          isScoped: true,
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bool"], [false])],
        },
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
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
          _type: TYPE_STATIC,
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
          _type: TYPE_STATIC,
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
          _type: TYPE_STATIC,
          comp: COMP_EQUAL,
          compValues: [encodeStatic(["bytes4"], ["0x12345678"])],
        },
        {
          isScoped: true,
          _type: TYPE_STATIC,
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
          _type: TYPE_DYNAMIC,
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
          _type: TYPE_DYNAMIC,
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
          _type: TYPE_DYNAMIC,
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
          _type: TYPE_DYNAMIC,
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
          _type: TYPE_DYNAMIC,
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

function encodeDynamic32(types: any[], values: any[]) {
  return ethers.utils.solidityPack(types, values);
}
