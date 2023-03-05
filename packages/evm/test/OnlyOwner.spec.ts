import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

describe("OnlyOwner", async () => {
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

    const [owner, invoker, janeDoe] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");

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
      janeDoe,
    };
  });

  const OPTIONS_NONE = 0;

  it("onlyOwner for allowTarget simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker, janeDoe } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;

    await expect(
      modifier
        .connect(invoker)
        .allowTarget(ROLE_ID, testContract.address, OPTIONS_NONE)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .allowTarget(ROLE_ID, testContract.address, OPTIONS_NONE)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, OPTIONS_NONE)
    ).to.not.be.reverted;
  });

  it("onlyOwner for scopeTarget, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker, janeDoe } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(invoker).scopeTarget(ROLE_ID, testContract.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(janeDoe).scopeTarget(ROLE_ID, testContract.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address)
    ).to.not.be.reverted;
  });
  it("onlyOwner for revokeTarget, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker, janeDoe } =
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
    const { modifier, testContract, owner, invoker, janeDoe } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .allowFunction(ROLE_ID, testContract.address, SELECTOR, OPTIONS_NONE)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .allowFunction(ROLE_ID, testContract.address, SELECTOR, OPTIONS_NONE)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .allowFunction(ROLE_ID, testContract.address, SELECTOR, OPTIONS_NONE)
    ).to.not.be.reverted;
  });
  it("onlyOwner for revokeFunction, simple invoker fails", async () => {
    const { modifier, testContract, owner, invoker, janeDoe } =
      await setupRolesWithOwnerAndInvoker();

    const ROLE_ID = 0;
    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await expect(
      modifier
        .connect(invoker)
        .revokeFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(janeDoe)
        .revokeFunction(ROLE_ID, testContract.address, SELECTOR)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .revokeFunction(ROLE_ID, testContract.address, SELECTOR)
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
        .scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [{ parent: 0, _type: 0, comp: 0, compValue: "0x" }],
          OPTIONS_NONE
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [{ parent: 0, _type: 0, comp: 0, compValue: "0x" }],
          OPTIONS_NONE
        )
    ).to.not.be.reverted;
  });
});
