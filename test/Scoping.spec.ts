import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

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
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    const { data: dataFail } =
      await testContract.populateTransaction.fnWithThreeParams(1, 2, 3);

    const { data: dataOk } =
      await testContract.populateTransaction.fnWithThreeParams(1, 4, 3);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

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
        COMP_EQ,
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

    const COMP_EQ = 0;
    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQ,
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
        COMP_EQ,
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

  it("param scoping should work after allow function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQ,
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

  it("scoping one param should work after allow function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQ,
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
  it("scoping one param should work after revoke function", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    // set it to true
    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    // set it to false
    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, false);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQ,
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
  it("scoping one param should work from scoped state", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    const { data: dataFail } =
      await testContract.populateTransaction.fnWithThreeParams(1, 2, 3);
    const { data: dataOk } =
      await testContract.populateTransaction.fnWithThreeParams(1, 7, 3);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [false, true, false],
        [false, false, false],
        [COMP_EQ, COMP_EQ, COMP_EQ],
        ["0x", ethers.utils.defaultAbiCoder.encode(["uint256"], [7]), "0x"]
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
        COMP_EQ,
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

  it("function scoping all params off, should result in FunctionNotAllowed", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    await modifier
      .connect(owner)
      .scopeParameter(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        0,
        false,
        COMP_EQ,
        "0x"
      );

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [false, false, false],
        [false, false, false],
        [0, 0, 0],
        ["0x", "0x", "0x"]
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
    ).to.be.revertedWith("FunctionNotAllowed()");
  });

  it("unscoping all params one by one, should result in FunctionNotAllowed", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );
    const COMP_EQ = 0;

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    await modifier
      .connect(owner)
      .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);

    await modifier
      .connect(owner)
      .scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [true, true, false],
        [false, false, false],
        [0, 0, 0],
        ["0x", "0x", "0x"]
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
    ).to.be.revertedWith("FunctionNotAllowed()");
  });
});
