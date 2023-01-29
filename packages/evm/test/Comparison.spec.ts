import { expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import {
  DynamicTupleStruct,
  StaticTupleStruct,
} from "../typechain-types/contracts/test/TestEncoder";

import { Comparison, ExecutionOptions, ParameterType } from "./utils";

describe("Comparison", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 0,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [ethers.utils.solidityPack(["uint256"], [123])],
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 0,
          _type: ParameterType.Static,
          comp: Comparison.GreaterThan,
          compValues: [ethers.utils.solidityPack(["uint256"], [1234])],
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 0,
          _type: ParameterType.Static,
          comp: Comparison.LessThan,
          compValues: [ethers.utils.solidityPack(["uint256"], [2345])],
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: false,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: Comparison.EqualTo,
          compValues: [ethers.utils.solidityPack(["string"], ["Some string"])],
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: Comparison.EqualTo,
          compValues: ["0x"],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke("0x")).to.not.be.reverted;
    await expect(invoke("0x12")).to.be.revertedWith("ParameterNotAllowed()");
  });

  it("checks an eq comparison for dynamic32", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: false,
          _type: ParameterType.Dynamic,
          comp: 0,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.EqualTo,
          compValues: [
            ethers.utils.solidityPack(["bytes2[]"], [["0x1234", "0xabcd"]]),
          ],
        },
      ],
      ExecutionOptions.None
    );

    //longer
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

  it("checks an eq comparison for dynamic32 - empty array", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.EqualTo,
          compValues: [[]],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke([])).to.not.be.reverted;
    await expect(invoke(["0xaabbccdd"])).to.be.revertedWith(
      "ParameterNotAllowed()"
    );
  });

  it("checks a oneOf comparison for static", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Static,
          comp: Comparison.OneOf,
          compValues: [
            defaultAbiCoder.encode(["uint256"], [11]),
            defaultAbiCoder.encode(["uint256"], [22]),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(11)).to.not.be.reverted;
    await expect(invoke(22)).to.not.be.reverted;
    await expect(invoke(33)).to.be.revertedWith("ParameterNotOneOfAllowed()");
  });

  it("checks a oneOf comparison for dynamic", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: false,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: Comparison.OneOf,
          compValues: [
            ethers.utils.solidityPack(["string"], ["Hello World!"]),
            ethers.utils.solidityPack(["string"], ["Good Morning!"]),
            ethers.utils.solidityPack(["string"], ["gm!!!!!!!!!!!"]),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(true, "Hello World!")).to.not.be.reverted;
    await expect(invoke(false, "Good Morning!")).to.not.be.reverted;
    await expect(invoke(true, "gm!!!!!!!!!!!")).to.not.be.reverted;

    await expect(invoke(false, "Something else")).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
  });

  it("checks a oneOf comparison for dynamic32", async () => {
    const { modifier, testContract, owner, invoker } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("dynamicDynamic32")
    );

    const invoke = async (a: string, b: any) =>
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: false,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.OneOf,
          compValues: [
            ethers.utils.solidityPack(["bytes2[]"], [["0x1111", "0x1111"]]),
            ethers.utils.solidityPack(["bytes2[]"], [["0xffff", "0xffff"]]),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke("A", ["0x1111", "0x1111"])).to.not.be.reverted;
    await expect(invoke("B", ["0xffff", "0xffff"])).to.not.be.reverted;

    await expect(
      invoke("C", ["0x1111", "0x1111", "0x1234"])
    ).to.be.revertedWith("ParameterNotOneOfAllowed()");
    await expect(
      invoke("D", ["0xffff", "0x1111", "0x1111"])
    ).to.be.revertedWith("ParameterNotOneOfAllowed()");
    await expect(invoke("E", ["0x1111"])).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
    await expect(invoke("F", ["0xf111", "0x1111"])).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
    await expect(invoke("G", ["0x1111", "0x111f"])).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
    await expect(invoke("H", [])).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
  });

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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.SubsetOf,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(["0x11112233", "0xaabbccdd"])).to.not.be.reverted;
  });

  it("checks a subsetOf comparison for dynamic32 - order does not matter", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.SubsetOf,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(["0xffddeecc", "0xaabbccdd", "0x11112233"])).to.not.be
      .reverted;
  });

  it("fails a subsetOf comparison for dynamic32 - empty array is not subset", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.SubsetOf,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke([])).to.be.revertedWith(
      "ParameterNotSubsetOfAllowed()"
    );
  });

  it("fails a subsetOf comparison for dynamic32 - does not allow repetition", async () => {
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
          isScoped: true,
          parent: 0,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Dynamic32,
          comp: Comparison.SubsetOf,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke(["0x11112233", "0x11112233", "0xffddeecc"])
    ).to.be.revertedWith("ParameterNotSubsetOfAllowed()");
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
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["uint256"], [345])],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["address"], [addressOk])],
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
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 0,
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          parent: 1,
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        {
          parent: 1,
          isScoped: true,
          _type: ParameterType.Dynamic,
          comp: Comparison.EqualTo,
          compValues: [ethers.utils.solidityPack(["bytes"], ["0xabcdef"])],
        },
        {
          parent: 1,
          isScoped: true,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [ethers.utils.solidityPack(["uint256"], [1998])],
        },
        {
          isScoped: true,
          parent: 1,
          _type: ParameterType.Dynamic32,
          comp: Comparison.EqualTo,
          compValues: [ethers.utils.solidityPack(["uint256[]"], [[7, 88, 99]])],
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke({ dynamic: "0xabcdef", _static: 1998, dynamic32: [7] })
    ).to.be.revertedWith("ParameterNotAllowed()");

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
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 0,
          _type: ParameterType.Array,
          comp: Comparison.Every,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 1,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 2,
          _type: ParameterType.Static,
          comp: Comparison.LessThan,
          compValues: [defaultAbiCoder.encode(["uint256"], [10000])],
        },
        {
          isScoped: true,
          parent: 2,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["address"], [address2])],
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
    ).to.be.revertedWith("ParameterNotAllowed()");
    await expect(
      invoke([
        { a: 300000, b: address2 },
        { a: 2222, b: address2 },
      ])
    ).to.be.revertedWith("ParameterGreaterThanAllowed()");
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
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 0,
          _type: ParameterType.Array,
          comp: Comparison.Some,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 1,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        {
          isScoped: false,
          parent: 2,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 2,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["address"], [address2])],
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
      "ParameterNotAllowed()"
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
          isScoped: true,
          _type: ParameterType.Tuple,
          comp: Comparison.EqualTo,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 0,
          _type: ParameterType.Array,
          comp: Comparison.Matches,
          compValues: [],
        },
        // tuple first
        {
          isScoped: true,
          parent: 1,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        // tuple second
        {
          isScoped: true,
          parent: 1,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        // tuple third
        {
          isScoped: true,
          parent: 1,
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          compValues: [],
        },
        {
          isScoped: false,
          parent: 2,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          parent: 2,
          isScoped: true,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["address"], [address1])],
        },
        {
          isScoped: false,
          parent: 3,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          isScoped: true,
          parent: 3,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["address"], [address2])],
        },
        {
          isScoped: false,
          parent: 4,
          _type: ParameterType.Static,
          comp: 0,
          compValues: [],
        },
        {
          parent: 4,
          isScoped: true,
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          compValues: [defaultAbiCoder.encode(["address"], [address3])],
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
    await expect(invoke([])).to.be.revertedWith("ArrayMatchesNotSameLength()");
    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
      ])
    ).to.be.revertedWith("ArrayMatchesNotSameLength()");

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
});
