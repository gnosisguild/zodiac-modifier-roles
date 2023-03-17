import { expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import {
  DynamicTupleStruct,
  StaticTupleStruct,
} from "../typechain-types/contracts/test/TestEncoder";

import {
  Operator,
  ExecutionOptions,
  ParameterType,
  removeTrailingOffset,
} from "./utils";

describe("Operator", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      Avatar,
      avatar,
      testContract,
      testEncoder,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  it("checks an eq comparison for static", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [123]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(321)).to.be.revertedWith("ParameterNotAllowed()");
    await expect(invoke(123)).to.not.be.reverted;
  });

  it("checks a gt/lt comparison for static", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [1234]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(1233)).to.be.revertedWith("ParameterLessThanAllowed()");
    await expect(invoke(1234)).to.be.revertedWith("ParameterLessThanAllowed()");
    await expect(invoke(1235)).to.not.be.reverted;

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [2345]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(2346)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );
    await expect(invoke(2345)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );
    await expect(invoke(2344)).to.not.be.reverted;
  });

  it("checks an eq comparison for dynamic", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithTwoMixedParams")
    );

    const invoke = async (a: boolean, b: string) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithTwoMixedParams(a, b))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["Some string"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(false, "Some string")).to.not.reverted;
    await expect(invoke(false, "Some other string")).to.be.revertedWith(
      "ParameterNotAllowed()"
    );
  });

  it("checks an eq comparison for dynamic - empty buffer", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamic")
    );

    const invoke = async (a: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamic(a)).data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes"], ["0x"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke("0x")).to.not.be.reverted;
    await expect(invoke("0x12")).to.be.revertedWith("ParameterNotAllowed()");
  });

  it("checks an eq comparison for string - empty string", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamicString")
    );

    const invoke = async (a: string) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamicString(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], [""]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke("")).to.not.be.reverted;
    await expect(invoke("Hello World!")).to.be.revertedWith(
      "ParameterNotAllowed()"
    );
  });

  it("checks an eq comparison for Array", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamicDynamic32")
    );

    const invoke = async (a: string, b: any[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamicDynamic32(a, b))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Dynamic,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(
            ["bytes2[]"],
            [["0x1234", "0xabcd"]]
          ),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.Whatever,
          compValue: "0x",
        },
      ],
      ExecutionOptions.None
    );

    // longer;
    await expect(
      invoke("Doesn't matter", ["0x1234", "0xabcd", "0xabcd"])
    ).to.be.revertedWith("ParameterNotAllowed()");

    //shorter
    await expect(invoke("Doesn't matter", ["0x1234"])).to.be.revertedWith(
      "ParameterNotAllowed()"
    );

    // different
    await expect(
      invoke("Doesn't matter", ["0x0234", "0xabcd"])
    ).to.be.revertedWith("ParameterNotAllowed()");

    await expect(invoke("Doesn't matter", ["0x1234", "0xabcd"])).to.not.be
      .reverted;
  });

  it.skip("checks an eq comparison for Tuple");

  it("checks an Or comparison for static", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [11]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [22]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(11)).to.not.be.reverted;
    await expect(invoke(22)).to.not.be.reverted;
    await expect(invoke(33)).to.be.revertedWith("ParameterNotOneOfAllowed()");
  });

  it("checks an And comparison over an AbiEncoded node", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [50000]),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [40000]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(60000)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );

    await expect(invoke(30000)).to.be.revertedWith(
      "ParameterLessThanAllowed()"
    );

    await expect(invoke(45000)).to.not.be.reverted;
  });

  it("checks an And comparison over a Static node", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [50000]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [40000]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(60000)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );

    await expect(invoke(30000)).to.be.revertedWith(
      "ParameterLessThanAllowed()"
    );

    await expect(invoke(45000)).to.not.be.reverted;
  });

  it("checks an Or comparison for dynamic", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithTwoMixedParams")
    );

    const invoke = async (a: boolean, b: string) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithTwoMixedParams(a, b))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["First String"]),
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["Good Morning!"]),
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["Third String"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(true, "First String")).to.not.be.reverted;
    await expect(invoke(false, "First String")).to.not.be.reverted;
    await expect(invoke(true, "Good Morning!")).to.not.be.reverted;
    await expect(invoke(false, "Good Morning!")).to.not.be.reverted;
    await expect(invoke(true, "Third String")).to.not.be.reverted;
    await expect(invoke(false, "Third String")).to.not.be.reverted;

    await expect(invoke(false, "Something else")).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
  });

  it("checks an Or tuple comparison", async () => {
    const { modifier, testEncoder, owner, invoker } = await setup();

    const addressOne = "0x0000000000000000000000000000000000000123";
    const addressTwo = "0x0000000000000000000000000000000000000cda";

    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("staticTuple")
    );

    const invoke = async (s: StaticTupleStruct) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.staticTuple(s, 100))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first tuple variant
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [1111]),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressOne]),
        },
        // second tuple variant
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [22222]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressTwo]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke({ a: 1111, b: addressOne })).to.not.be.reverted;

    await expect(invoke({ a: 22222, b: addressTwo })).to.not.be.reverted;

    await expect(invoke({ a: 22222, b: addressOne })).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );

    await expect(
      invoke({ a: 111, b: "0x0000000000000000000000000000000000000000" })
    ).to.be.revertedWith("ParameterNotOneOfAllowed()");
  });

  it("checks an Or array comparison", async () => {
    const address1 = "0x0000000000000000000000000000000000000fff";
    const address2 = "0x0000000000000000000000000000000000000123";
    const address3 = "0x0000000000000000000000000000000000000cda";

    const { modifier, testEncoder, owner, invoker } = await setup();
    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("arrayStaticTupleItems")
    );
    const invoke = async (a: StaticTupleStruct[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.arrayStaticTupleItems(a))
            .data as string,
          0
        );
    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);
    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        // first Array 1
        {
          parent: 1,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // second Array 2
        {
          parent: 1,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first array first element 3
        {
          parent: 2,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first array second element 4
        {
          parent: 2,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // second array first element 5
        {
          parent: 3,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple first
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address1]),
        },
        // tuple second 8
        {
          parent: 5,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [334455]),
        },
        {
          parent: 5,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address2]),
        },
        // tuple third 9
        {
          parent: 6,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 6,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address3]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 334455, b: address2 },
      ])
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 123456, b: address1 },
        { a: 334455, b: address2 },
      ])
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 123456, b: address1 },
        { a: 111111, b: address2 },
      ])
    ).to.be.revertedWith("ParameterNotOneOfAllowed()");

    await expect(invoke([{ a: 123121212, b: address3 }])).to.not.be.reverted;

    await expect(invoke([])).to.be.revertedWith("ParameterNotOneOfAllowed()");
  });

  it("checks a static tuple comparison", async () => {
    const { modifier, testEncoder, owner, invoker } = await setup();

    const addressOk = "0x0000000000000000000000000000000000000123";
    const addressNok = "0x0000000000000000000000000000000000000cda";

    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("staticTuple")
    );

    const invoke = async (s: StaticTupleStruct) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.staticTuple(s, 100))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [345]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressOk]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke({ a: 345, b: addressNok })).to.be.revertedWith(
      "ParameterNotAllowed()"
    );

    await expect(invoke({ a: 345, b: addressOk })).to.not.be;
  });

  it("checks a dynamic tuple comparison", async () => {
    const { modifier, testEncoder, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("dynamicTuple")
    );

    const invoke = async (s: DynamicTupleStruct) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.dynamicTuple(s))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes"], ["0xabcdef"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [1998]),
        },
        {
          parent: 1,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [7]),
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [88]),
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [99]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke({ dynamic: "0xabcdef", _static: 1998, dynamic32: [7] })
    ).to.be.revertedWith("ParameterNotAMatch()");

    await expect(
      invoke({ dynamic: "0xabcdef", _static: 1998, dynamic32: [7, 88, 99] })
    ).to.not.be.reverted;
  });

  it.skip("checks a tuple comparison with partial scoping");

  it.skip("checks a nested tuple comparison");

  it.skip("checks a nested tuple comparison with partial scoping");

  it("checks an array EVERY comparison", async () => {
    // const address1 = "0x0000000000000000000000000000000000000fff";
    const address2 = "0x0000000000000000000000000000000000000123";
    const address3 = "0x0000000000000000000000000000000000000cda";

    const { modifier, testEncoder, owner, invoker } = await setup();
    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("arrayStaticTupleItems")
    );
    const invoke = async (a: StaticTupleStruct[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.arrayStaticTupleItems(a))
            .data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.ArrayEvery,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [10000]),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address2]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke([])).to.not.be.reverted;
    await expect(
      invoke([
        { a: 1111, b: address2 },
        { a: 2222, b: address2 },
      ])
    ).to.not.be.reverted;
    await expect(
      invoke([
        { a: 1111, b: address3 },
        { a: 2222, b: address2 },
      ])
    ).to.be.revertedWith("ArrayElementsNotAllowed()");
    await expect(
      invoke([
        { a: 300000, b: address2 },
        { a: 2222, b: address2 },
      ])
    ).to.be.revertedWith("ArrayElementsNotAllowed()");
  });

  it("checks an array SOME comparison", async () => {
    const address1 = "0x0000000000000000000000000000000000000fff";
    const address2 = "0x0000000000000000000000000000000000000123";

    const { modifier, testEncoder, owner, invoker } = await setup();
    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("arrayStaticTupleItems")
    );
    const invoke = async (a: StaticTupleStruct[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.arrayStaticTupleItems(a))
            .data as string,
          0
        );
    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.ArraySome,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address2]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke([])).to.be.reverted;
    await expect(invoke([{ a: 1111, b: address2 }])).to.not.be.reverted;
    await expect(
      invoke([
        { a: 1111, b: address2 },
        { a: 1111, b: address1 },
      ])
    ).to.not.be.reverted;
    await expect(invoke([{ a: 1111, b: address1 }])).to.be.revertedWith(
      "ArrayElementsSomeNotAllowed()"
    );
  });

  it("checks an array MATCHES comparison", async () => {
    const address1 = "0x0000000000000000000000000000000000000fff";
    const address2 = "0x0000000000000000000000000000000000000123";
    const address3 = "0x0000000000000000000000000000000000000cda";

    const { modifier, testEncoder, owner, invoker } = await setup();
    const ROLE_ID = 0;
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("arrayStaticTupleItems")
    );
    const invoke = async (a: StaticTupleStruct[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.arrayStaticTupleItems(a))
            .data as string,
          0
        );
    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);
    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple first
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple second
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple third
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address1]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address2]),
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address3]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
        { a: 233, b: address3 },
      ])
    ).to.not.be.reverted;
    await expect(invoke([])).to.be.revertedWith("ParameterNotAMatch()");
    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
      ])
    ).to.be.revertedWith("ParameterNotAMatch()");

    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
        { a: 233, b: address2 },
      ])
    ).to.be.revertedWith("ParameterNotAllowed()");
  });

  it.skip("checks an array with a static tuple inside");

  it.skip("checks an array with a nested tuple inside");

  it("checks a subsetOf comparison for dynamic32", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamic32")
    );

    const invoke = async (a: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamic32(a)).data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.SubsetOf,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0x11112233"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xaabbccdd"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xffddeecc"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(["0x11112233", "0xaabbccdd"])).to.not.be.reverted;
  });

  it("checks a subsetOf comparison  - order does not matter", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamic32")
    );

    const invoke = async (a: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamic32(a)).data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.SubsetOf,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0x11112233"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xaabbccdd"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xffddeecc"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(["0xffddeecc", "0xaabbccdd", "0x11112233"])).to.not.be
      .reverted;

    await expect(invoke(["0xffddeecc", "0x11112233", "0xaabbccdd"])).to.not.be
      .reverted;
  });

  it("fails a subsetOf comparison - empty array is not subset", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamic32")
    );

    const invoke = async (a: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamic32(a)).data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.SubsetOf,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0x11112233"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xaabbccdd"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xffddeecc"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke([])).to.be.revertedWith(
      "ParameterNotSubsetOfAllowed()"
    );
  });

  it("fails a subsetOf comparison - does not allow repetition", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamic32")
    );

    const invoke = async (a: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.dynamic32(a)).data as string,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_ID,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.SubsetOf,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0x11112233"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xaabbccdd"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes4"], ["0xffddeecc"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke(["0x11112233", "0x11112233", "0xffddeecc"])
    ).to.be.revertedWith("ParameterNotSubsetOfAllowed()");

    await expect(invoke(["0x11112233", "0xffddeecc"])).to.not.be.reverted;
    await expect(invoke(["0xffddeecc"])).to.not.be.reverted;
  });

  describe("Variants", async () => {
    it("variant 1 todo rename me", async () => {
      const { modifier, testContract, owner, invoker } = await setup();

      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithTwoMixedParams")
      );

      const invoke = async (a: boolean, b: string) =>
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.fnWithTwoMixedParams(a, b))
              .data as string,
            0
          );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          // 1
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // 2
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // 3
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // first variant
          {
            parent: 1,

            paramType: ParameterType.Static,
            operator: 0,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Dynamic,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["string"], ["First String"]),
          },
          // second variant
          {
            parent: 2,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["bool"], [true]),
          },
          {
            parent: 2,
            paramType: ParameterType.Dynamic,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["string"], ["Good Morning!"]),
          },
          // third variant
          {
            parent: 3,

            paramType: ParameterType.Static,
            operator: Operator.Whatever,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: ParameterType.Dynamic,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["string"], ["Third String"]),
          },
        ],
        ExecutionOptions.None
      );

      await expect(invoke(true, "First String")).to.not.be.reverted;
      // wrong first argument
      await expect(invoke(false, "Good Morning!")).to.be.revertedWith(
        "ParameterNotOneOfAllowed()"
      );
      // fixing the first argument
      await expect(invoke(true, "Good Morning!")).to.not.be.reverted;
      await expect(invoke(true, "Third String")).to.not.be.reverted;

      await expect(invoke(false, "Something else")).to.be.revertedWith(
        "ParameterNotOneOfAllowed()"
      );
    });

    it("variant 2 todo rename me checks a oneOf tuple comparison", async () => {
      const { modifier, testEncoder, owner, invoker } = await setup();

      const addressOne = "0x0000000000000000000000000000000000000123";
      const addressTwo = "0x0000000000000000000000000000000000000cda";

      const ROLE_ID = 0;
      const SELECTOR = testEncoder.interface.getSighash(
        testEncoder.interface.getFunction("staticTuple")
      );

      const invoke = async (s: StaticTupleStruct) =>
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testEncoder.address,
            0,
            (await testEncoder.populateTransaction.staticTuple(s, 100))
              .data as string,
            0
          );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_ID, testEncoder.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testEncoder.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Tuple,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Tuple,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // first tuple variant
          {
            parent: 2,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [1111]),
          },
          {
            parent: 2,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["address"], [addressOne]),
          },
          // second tuple variant
          {
            parent: 3,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [22222]),
          },
          {
            parent: 3,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["address"], [addressTwo]),
          },
        ],
        ExecutionOptions.None
      );

      await expect(invoke({ a: 1111, b: addressOne })).to.not.be.reverted;

      await expect(invoke({ a: 22222, b: addressTwo })).to.not.be.reverted;

      await expect(invoke({ a: 22222, b: addressOne })).to.be.revertedWith(
        "ParameterNotOneOfAllowed()"
      );

      await expect(
        invoke({ a: 111, b: "0x0000000000000000000000000000000000000000" })
      ).to.be.revertedWith("ParameterNotOneOfAllowed()");
    });
  });
});
