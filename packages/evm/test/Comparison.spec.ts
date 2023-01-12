import { expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

describe("Comparison", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

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
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  enum Comparison {
    EQUAL = 0,
    GREATER,
    LESS,
    ONE_OF,
    SUBSET_OF,
  }

  enum Options {
    NONE = 0,
    SEND,
    DELEGATE_CALL,
    BOTH,
  }

  const TYPE_NONE = 0;
  const TYPE_STATIC = 1;
  const TYPE_DYNAMIC = 2;
  const TYPE_DYNAMIC32 = 3;

  const UNSCOPED_PARAM = {
    isScoped: false,
    _type: TYPE_NONE,
    comp: Comparison.EQUAL,
    compValues: [],
  };

  it.skip("TODO move to PermissionBuilder tests -> enforces paramCompValues for scopeFunction", async () => {
    const { modifier, testContract, owner } = await setup();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          UNSCOPED_PARAM,
          {
            isScoped: true,
            _type: TYPE_STATIC,
            comp: Comparison.ONE_OF,
            compValues: [],
          },
          UNSCOPED_PARAM,
        ],
        Options.NONE
      )
    ).to.be.revertedWith("NoCompValuesProvidedForScope");

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          UNSCOPED_PARAM,
          {
            isScoped: true,
            _type: TYPE_STATIC,
            comp: Comparison.ONE_OF,
            compValues: [defaultAbiCoder.encode(["bool"], [false])],
          },
          UNSCOPED_PARAM,
        ],
        Options.NONE
      )
    ).to.be.revertedWith("NotEnoughCompValuesForScope");

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          UNSCOPED_PARAM,
          {
            isScoped: true,
            _type: TYPE_STATIC,
            comp: Comparison.ONE_OF,
            compValues: [
              defaultAbiCoder.encode(["bool"], [false]),
              defaultAbiCoder.encode(["bool"], [true]),
            ],
          },
          UNSCOPED_PARAM,
        ],
        Options.NONE
      )
    ).to.not.be.reverted;

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          UNSCOPED_PARAM,
          {
            isScoped: true,
            _type: TYPE_STATIC,
            comp: Comparison.EQUAL,
            compValues: [
              defaultAbiCoder.encode(["bool"], [true]),
              defaultAbiCoder.encode(["bool"], [false]),
            ],
          },
          UNSCOPED_PARAM,
        ],
        Options.NONE
      )
    ).to.be.revertedWith("TooManyCompValuesForScope");
  });

  it("passes an eq comparison", async () => {
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
          _type: TYPE_STATIC,
          comp: Comparison.EQUAL,
          compValues: [ethers.utils.solidityPack(["uint256"], [123])],
        },
      ],
      Options.NONE
    );

    await expect(invoke(321)).to.be.revertedWith("ParameterNotAllowed()");
    await expect(invoke(123)).to.not.be.reverted;
  });

  it("passes an eq comparison for dynamic", async () => {
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
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: Comparison.EQUAL,
          compValues: [ethers.utils.solidityPack(["string"], ["Some string"])],
        },
      ],
      Options.NONE
    );

    await expect(invoke(false, "Some string")).to.not.reverted;
    await expect(invoke(false, "Some other string")).to.be.revertedWith(
      "ParameterNotAllowed()"
    );
  });

  it("passes an eq comparison for dynamic - empty buffer", async () => {
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
          _type: TYPE_DYNAMIC,
          comp: Comparison.EQUAL,
          compValues: ["0x"],
        },
      ],
      Options.NONE
    );

    await expect(invoke("0x")).to.not.be.reverted;
    await expect(invoke("0x12")).to.be.revertedWith("ParameterNotAllowed()");
  });

  it("passes an eq comparison for dynamic32", async () => {
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
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: Comparison.EQUAL,
          compValues: [
            ethers.utils.solidityPack(["bytes2[]"], [["0x1234", "0xabcd"]]),
          ],
        },
      ],
      Options.NONE
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

  it("passes an eq comparison for dynamic32 - empty array", async () => {
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
          _type: TYPE_DYNAMIC32,
          comp: Comparison.EQUAL,
          compValues: [[]],
        },
      ],
      Options.NONE
    );

    await expect(invoke([])).to.not.be.reverted;
    await expect(invoke(["0xaabbccdd"])).to.be.revertedWith(
      "ParameterNotAllowed()"
    );
  });

  it("passes a oneOf comparison for static", async () => {
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
          _type: TYPE_STATIC,
          comp: Comparison.ONE_OF,
          compValues: [
            defaultAbiCoder.encode(["uint256"], [11]),
            defaultAbiCoder.encode(["uint256"], [22]),
          ],
        },
      ],
      Options.NONE
    );

    await expect(invoke(11)).to.not.be.reverted;
    await expect(invoke(22)).to.not.be.reverted;
    await expect(invoke(33)).to.be.revertedWith("ParameterNotOneOfAllowed()");
  });

  it("passes a oneOf comparison for dynamic", async () => {
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
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: TYPE_DYNAMIC,
          comp: Comparison.ONE_OF,
          compValues: [
            ethers.utils.solidityPack(["string"], ["Hello World!"]),
            ethers.utils.solidityPack(["string"], ["Good Morning!"]),
            ethers.utils.solidityPack(["string"], ["gm!!!!!!!!!!!"]),
          ],
        },
      ],
      Options.NONE
    );

    await expect(invoke(true, "Hello World!")).to.not.be.reverted;
    await expect(invoke(false, "Good Morning!")).to.not.be.reverted;
    await expect(invoke(true, "gm!!!!!!!!!!!")).to.not.be.reverted;

    await expect(invoke(false, "Something else")).to.be.revertedWith(
      "ParameterNotOneOfAllowed()"
    );
  });

  it("passes a oneOf comparison for dynamic32", async () => {
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
        UNSCOPED_PARAM,
        {
          isScoped: true,
          _type: TYPE_DYNAMIC32,
          comp: Comparison.ONE_OF,
          compValues: [
            ethers.utils.solidityPack(["bytes2[]"], [["0x1111", "0x1111"]]),
            ethers.utils.solidityPack(["bytes2[]"], [["0xffff", "0xffff"]]),
          ],
        },
      ],
      Options.NONE
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

  it("passes a subsetOf comparison for dynamic32", async () => {
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
          _type: TYPE_DYNAMIC32,
          comp: Comparison.SUBSET_OF,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      Options.NONE
    );

    await expect(invoke(["0x11112233", "0xaabbccdd"])).to.not.be.reverted;
  });

  it("passes a subsetOf comparison for dynamic32 - order does not matter", async () => {
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
          _type: TYPE_DYNAMIC32,
          comp: Comparison.SUBSET_OF,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      Options.NONE
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
          _type: TYPE_DYNAMIC32,
          comp: Comparison.SUBSET_OF,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      Options.NONE
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
          _type: TYPE_DYNAMIC32,
          comp: Comparison.SUBSET_OF,
          compValues: [
            ethers.utils.solidityPack(
              ["bytes4[]"],
              [["0x11112233", "0xaabbccdd", "0xffddeecc"]]
            ),
          ],
        },
      ],
      Options.NONE
    );

    await expect(
      invoke(["0x11112233", "0x11112233", "0xffddeecc"])
    ).to.be.revertedWith("ParameterNotSubsetOfAllowed()");
  });

  it("passes a gt/lt comparison", async () => {
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
          _type: TYPE_STATIC,
          comp: Comparison.GREATER,
          compValues: [ethers.utils.solidityPack(["uint256"], [1234])],
        },
      ],
      Options.NONE
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
          _type: TYPE_STATIC,
          comp: Comparison.LESS,
          compValues: [ethers.utils.solidityPack(["uint256"], [2345])],
        },
      ],
      Options.NONE
    );

    await expect(invoke(2346)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );
    await expect(invoke(2345)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );
    await expect(invoke(2344)).to.not.be.reverted;
  });

  it("mixed of different comparisons and types");
});
