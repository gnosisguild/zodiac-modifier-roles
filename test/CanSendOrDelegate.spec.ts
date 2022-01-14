import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const COMP_EQUAL = 0;
const COMP_GREATER = 1;
const COMP_LESS = 2;

const SOME_STATIC_COMP_VALUE = ethers.utils.defaultAbiCoder.encode(
  ["uint256"],
  [123]
);

describe("CanSendOrDelegate", async () => {
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

  describe("clearance NONE", async () => {
    it("canSend not taken into consideration");
    it("canDelegate not taken into consideration");
    it("canSendToFunction not taken into consideration");
    it("canDelegateToFunction not taken into consideration");
  });

  describe("clearance TARGET", async () => {
    it("canSend works");
    it("canDelegate works");
    it("canSendToFunction not taken into consideration");
    it("canDelegateToFunction not taken into consideration");
  });

  describe("clearance FUNCTION", async () => {
    it("canSend takes precedence and works");
    it("canDelegate takes precedence and works");
    it("canSendToFunction works");
    it("canDelegateToFunction works");
  });
});
