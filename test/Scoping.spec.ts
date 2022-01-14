import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const COMP_EQUAL = 0;
const COMP_GREATER = 1;
const COMP_LESS = 2;

const MODE_BARE = 0;
const MODE_SEND = 1;
const MODE_DELEGATE = 2;
const MODE_BOTH = 3;

const SOME_STATIC_COMP_VALUE = ethers.utils.defaultAbiCoder.encode(
  ["uint256"],
  [123]
);

describe("Scoping", async () => {
  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const testContractClone = await TestContract.deploy();
    return { Avatar, avatar, testContract, testContractClone };
  });

  const setupRolesWithOwnerAndInvoker = deployments.createFixture(async () => {
    const base = await baseSetup();

    const [owner, invoker] = waffle.provider.getWallets();

    const Permissions = await hre.ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Permissions: permissions.address,
      },
    });

    const modifier = await Modifier.deploy(
      owner.address,
      base.avatar.address,
      base.avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      ...base,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  it("scoping one param should work", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    const { data: dataFail } =
      await testContract.populateTransaction.fnWithThreeParams(1, 2, 3);

    const { data: dataOk } =
      await testContract.populateTransaction.fnWithThreeParams(1, 4, 3);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR, MODE_BARE);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataFail, 0)
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        1,
        false,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [4])
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataFail, 0)
    ).to.be.revertedWith("ParameterNotAllowed()");

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataOk, 0)
    ).to.not.be.reverted;
  });

  it("unscoping one param should work", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [4])
      );

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        1,
        false,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [5])
      );

    const { data: dataFail } =
      await testContract.populateTransaction.fnWithThreeParams(4, 2, 3);
    const { data: dataOk } =
      await testContract.populateTransaction.fnWithThreeParams(4, 5, 3);

    // fails first
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataFail, 0)
    ).to.be.revertedWith("ParameterNotAllowed()");

    // sanity check
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataOk, 0)
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 1);

    // works after unscoping
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataFail, 0)
    ).to.not.be.reverted;
  });

  it("scoping one param should work after allow function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    // this call is supposed to be redudant. This test is checking that scoping one para after scoping all works
    await modifier
      .connect(owner)
      .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [7])
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 2, 3)
          ).data,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(7, 2, 3)
          ).data,
          0
        )
    ).to.not.be.reverted;
  });

  it("scoping one param should work after scope function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    const { data: dataFail } =
      await testContract.populateTransaction.fnWithThreeParams(1, 2, 3);
    const { data: dataOk } =
      await testContract.populateTransaction.fnWithThreeParams(1, 7, 3);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [false, true, false],
        [false, false, false],
        [COMP_EQUAL, COMP_EQUAL, COMP_EQUAL],
        ["0x", ethers.utils.defaultAbiCoder.encode(["uint256"], [7]), "0x"],
        MODE_BARE
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataFail, 0)
    ).to.be.revertedWith("ParameterNotAllowed()");

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, dataOk, 0)
    ).to.not.be.reverted;

    // set last param also as scoped
    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        2,
        false,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [8])
      );

    // should account for last param
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 7, 3)
          ).data,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 2, 8)
          ).data,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 7, 8)
          ).data,
          0
        )
    ).to.not.be.reverted;
  });

  it("function scoping all params off is equivalent to allowing function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQUAL,
        SOME_STATIC_COMP_VALUE
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 2, 3)
          ).data,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [false, false, false],
        [false, false, false],
        [0, 0, 0],
        ["0x", "0x", "0x"],
        MODE_BARE
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 2, 3)
          ).data,
          0
        )
    ).to.emit(testContract, "FnWithThreeParams");
  });

  it("function scoping all params off, including dynamic types, is equivalent to allow function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const IS_DYNAMIC = true;
    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithTwoMixedParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR, MODE_BARE);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithTwoMixedParams(
              false,
              "Hello World!"
            )
          ).data,
          0
        )
    ).to.emit(testContract, "FnWithTwoMixedParams");

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [false, false],
        [!IS_DYNAMIC, IS_DYNAMIC],
        [0, 0],
        ["0x", "0x"],
        MODE_BARE
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithTwoMixedParams(
              false,
              "Hello World!"
            )
          ).data,
          0
        )
    ).to.emit(testContract, "FnWithTwoMixedParams");
  });

  it("unscoping all params one by one is equivalent to allowFunction", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [true, true, false],
        [false, false, false],
        [0, 0, 0],
        [
          SOME_STATIC_COMP_VALUE,
          SOME_STATIC_COMP_VALUE,
          SOME_STATIC_COMP_VALUE,
        ],
        MODE_BARE
      );

    await modifier
      .connect(owner)
      .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 0);

    //if some params still scoped returned ParamNotAllowed
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 2, 3)
          ).data,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");

    await modifier
      .connect(owner)
      .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 1);

    //all params off -> FunctionNotAllowed
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithThreeParams(1, 2, 3)
          ).data,
          0
        )
    ).to.be.emit(testContract, "FnWithThreeParams");
  });
  it("unscoping all params one by one, including dynamic types, is equivalent to allowFunction", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const IS_DYNAMIC = true;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithTwoMixedParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        !IS_DYNAMIC,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["bool"], [false])
      );

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        1,
        IS_DYNAMIC,
        COMP_EQUAL,
        ethers.utils.solidityPack(["string"], ["Hello World!"])
      );

    // should fail because first parameter doesn't comply
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithTwoMixedParams(
              true,
              "Hello World!"
            )
          ).data,
          0
        )
    ).to.be.revertedWith("ParameterNotAllowed()");

    // should work after we unscope first parameter
    await modifier
      .connect(owner)
      .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 0);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithTwoMixedParams(
              true,
              "Hello World!"
            )
          ).data,
          0
        )
    ).to.emit(testContract, "FnWithTwoMixedParams");

    // unscope second parameter, leaves no parameter scoped
    await modifier
      .connect(owner)
      .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 1);

    // whole function should be not allowed
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (
            await testContract.populateTransaction.fnWithTwoMixedParams(
              false,
              "Something not previously allowed"
            )
          ).data,
          0
        )
    ).to.emit(testContract, "FnWithTwoMixedParams");
  });

  it("update compType should work on already scoped parameter", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();
    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );
    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR, MODE_BARE);

    const invoke = async (param: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(param))
            .data,
          0
        );

    // sanity
    await expect(invoke(2021)).to.not.be.reverted;

    modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_LESS,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [420])
      );

    await expect(invoke(421)).to.be.revertedWith(
      "ParameterGreaterThanAllowed()"
    );
    await expect(invoke(419)).to.not.be.reverted;

    // FLIP THE SAME PARAM to greater
    modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_GREATER,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [420])
      );

    await expect(invoke(421)).to.not.be.reverted;
    await expect(invoke(419)).to.be.revertedWith("ParameterLessThanAllowed()");
  });

  it("scoping a high parameter index, after a lower one should work", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const IS_DYNAMIC = true;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    const invoke = async (a: number, b: number, c: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithThreeParams(a, b, c))
            .data,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        !IS_DYNAMIC,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [1])
      );

    await expect(invoke(1, 3, 2021)).to.not.be.reverted;

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        1,
        !IS_DYNAMIC,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [2])
      );
    await expect(invoke(1, 3, 2021)).to.be.revertedWith(
      "ParameterNotAllowed()"
    );

    await expect(invoke(1, 2, 3000)).to.not.be.reverted;
  });

  it("scoping a low parameter index, after a higher one should work", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const IS_DYNAMIC = true;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    const invoke = async (a: number, b: number, c: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithThreeParams(a, b, c))
            .data,
          0
        );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowTargetPartially(ROLE_ID, testContract.address, MODE_BARE);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        2,
        !IS_DYNAMIC,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [3])
      );

    await expect(invoke(2000, 3000, 3)).to.not.be.reverted;

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        !IS_DYNAMIC,
        COMP_EQUAL,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [1])
      );
    await expect(invoke(2000, 3000, 3)).to.be.revertedWith(
      "ParameterNotAllowed()"
    );

    await expect(invoke(1, 3000, 3)).to.not.be.reverted;
  });

  describe("Enforces Scope Max Param limit", () => {
    it("checks limit on scopeFunction", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const COMP_EQUAL = 0;
      const ROLE_ID = 0;
      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            new Array(62).fill(false),
            new Array(62).fill(false),
            new Array(62).fill(COMP_EQUAL),
            new Array(62).fill("0x"),
            MODE_BARE
          )
      ).to.be.revertedWith("ScopeMaxParametersExceeded()");

      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            new Array(61).fill(false),
            new Array(61).fill(false),
            new Array(61).fill(0),
            new Array(61).fill("0x"),
            MODE_BARE
          )
      ).to.not.be.reverted;
    });

    it("checks limit on scopeParameter", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const COMP_EQUAL = 0;
      const ROLE_ID = 0;
      const IS_DYNAMIC = true;
      await expect(
        modifier
          .connect(owner)
          .scopeParameter(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            61,
            IS_DYNAMIC,
            COMP_EQUAL,
            "0x"
          )
      ).to.be.revertedWith("ScopeMaxParametersExceeded()");

      await expect(
        modifier
          .connect(owner)
          .scopeParameter(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            60,
            IS_DYNAMIC,
            COMP_EQUAL,
            "0x"
          )
      ).to.not.be.reverted;
    });

    it("checks limit on scopeParameterAsOneOf", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const IS_DYNAMIC = true;
      const ROLE_ID = 0;
      await expect(
        modifier
          .connect(owner)
          .scopeParameterAsOneOf(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            61,
            IS_DYNAMIC,
            ["0x"]
          )
      ).to.be.revertedWith("ScopeMaxParametersExceeded()");

      await expect(
        modifier
          .connect(owner)
          .scopeParameterAsOneOf(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            60,
            IS_DYNAMIC,
            ["0x"]
          )
      ).to.not.be.reverted;
    });

    it("checks limit on unscopeParameter", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const ROLE_ID = 0;
      await expect(
        modifier
          .connect(owner)
          .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 61)
      ).to.be.revertedWith("ScopeMaxParametersExceeded()");

      await expect(
        modifier
          .connect(owner)
          .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 60)
      ).to.not.be.reverted;
    });
  });

  describe("Enforces Static Parameter Size limit", () => {
    const MORE_THAN_32_BYTES_TEXT =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";
    const A_32_BYTES_VALUE = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [123]
    );

    it("checks limit on scopeFunction", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const COMP_EQUAL = 0;
      const ROLE_ID = 0;
      const IS_SCOPED = true;
      const IS_DYNAMIC = true;
      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            [IS_SCOPED],
            [!IS_DYNAMIC],
            [COMP_EQUAL],
            [ethers.utils.solidityPack(["string"], [MORE_THAN_32_BYTES_TEXT])],
            MODE_BARE
          )
      ).to.be.revertedWith("UnsuitableStaticCompValueSize()");

      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            [IS_SCOPED],
            [!IS_DYNAMIC],
            [COMP_EQUAL],
            [A_32_BYTES_VALUE],
            MODE_BARE
          )
      ).to.be.not.reverted;

      // it doesn't check for unscoped parameter
      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            [IS_SCOPED, !IS_SCOPED],
            [!IS_DYNAMIC, !IS_DYNAMIC],
            [COMP_EQUAL, COMP_EQUAL],
            [
              A_32_BYTES_VALUE,
              ethers.utils.solidityPack(["string"], [MORE_THAN_32_BYTES_TEXT]),
            ],
            MODE_BARE
          )
      ).to.not.be.reverted;
    });

    it("checks limit on scopeParameter", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const COMP_EQUAL = 0;
      const ROLE_ID = 0;
      await expect(
        modifier
          .connect(owner)
          .scopeParameter(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            0,
            false,
            COMP_EQUAL,
            ethers.utils.solidityPack(["string"], [MORE_THAN_32_BYTES_TEXT])
          )
      ).to.be.revertedWith("UnsuitableStaticCompValueSize()");

      await expect(
        modifier
          .connect(owner)
          .scopeParameter(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            0,
            false,
            COMP_EQUAL,
            A_32_BYTES_VALUE
          )
      ).to.not.be.reverted;
    });

    it("checks limit on scopeParameterAsOneOf", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const ROLE_ID = 0;
      await expect(
        modifier
          .connect(owner)
          .scopeParameterAsOneOf(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            0,
            false,
            [ethers.utils.solidityPack(["string"], [MORE_THAN_32_BYTES_TEXT])]
          )
      ).to.be.revertedWith("UnsuitableStaticCompValueSize()");

      await expect(
        modifier
          .connect(owner)
          .scopeParameterAsOneOf(
            ROLE_ID,
            testContract.address,
            SELECTOR,
            0,
            false,
            [A_32_BYTES_VALUE]
          )
      ).to.not.be.reverted;
    });
  });
});
