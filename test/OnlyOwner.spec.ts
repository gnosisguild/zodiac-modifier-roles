import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const [, janeDoe] = waffle.provider.getWallets();

describe("EnsureOnlyOwner", async () => {
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

  it("onlyOwner for allowTarget simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;

    await expect(
      modifier
        .connect(invoker)
        .allowTarget(ROLE_ID, testContract.address, false, false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .allowTarget(ROLE_ID, testContract.address, false, false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, false)
    ).to.not.be.reverted;
  });

  it("onlyOwner for allowTargetPartially, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;

    await expect(
      modifier
        .connect(invoker)
        .allowTargetPartially(ROLE_ID, testContract.address, false, false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .allowTargetPartially(ROLE_ID, testContract.address, false, false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .allowTargetPartially(ROLE_ID, testContract.address, false, false)
    ).to.not.be.reverted;
  });
  it("onlyOwner for revokeTarget, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(invoker).revokeTarget(ROLE_ID, testContract.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(janeDoe).revokeTarget(ROLE_ID, testContract.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(owner).revokeTarget(ROLE_ID, testContract.address)
    ).to.not.be.reverted;
  });

  it("onlyOwner for scopeAllowFunction, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.not.be.reverted;
  });
  it("onlyOwner for scopeRevokeFunction, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .scopeRevokeFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .scopeRevokeFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .scopeRevokeFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.not.be.reverted;
  });
  it("onlyOwner for scopeFunction, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .scopeFunction(ROLE_ID, testContract.address, SELECTOR, [], [], [], [])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .scopeFunction(ROLE_ID, testContract.address, SELECTOR, [], [], [], [])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .scopeFunction(ROLE_ID, testContract.address, SELECTOR, [], [], [], [])
    ).to.not.be.reverted;
  });
  it("onlyOwner for scopeParameter, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .scopeParameter(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          false,
          0,
          "0x"
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .scopeParameter(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          false,
          0,
          "0x"
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .scopeParameter(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          false,
          0,
          "0x"
        )
    ).to.not.be.reverted;
  });
  it("onlyOwner for scopeParameterAsOneOf, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .scopeParameterAsOneOf(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          false,
          ["0x12", "0x23"]
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .scopeParameterAsOneOf(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          false,
          ["0x12", "0x23"]
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .scopeParameterAsOneOf(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          false,
          ["0x12", "0x23"]
        )
    ).to.not.be.reverted;
  });
  it("onlyOwner for unscopeParameter, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .unscopeParameter(ROLE_ID, testContract.address, SELECTOR, 0)
    ).to.not.be.reverted;
  });
});
