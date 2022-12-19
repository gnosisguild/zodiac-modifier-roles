import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const OPTIONS_NONE = 0;

describe("Revoking", async () => {
  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    return { Avatar, avatar, testContract };
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

  it("revoking a target and then scoping again, should not have dangling permissions", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithThreeParams")
    );

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    const { data } = await testContract.populateTransaction.fnWithThreeParams(
      1,
      2,
      3
    );

    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await modifier
      .connect(owner)
      .scopeAllowFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        OPTIONS_NONE
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data, 0)
    ).to.not.be.reverted;

    await modifier.connect(owner).revokeTarget(ROLE_ID, testContract.address);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data, 0)
    ).to.be.revertedWith("TargetAddressNotAllowed");

    await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data, 0)
    ).to.be.revertedWith("FunctionNotAllowed");
  });
});
