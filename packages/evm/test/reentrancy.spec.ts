import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ExecutionOptions } from "./utils";
import { deployRolesMod } from "./setup";

describe("Reentrancy", () => {
  async function setup() {
    const [owner, invoker] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    // Enable invoker as module so it can call execTransactionWithRole
    await roles.connect(owner).enableModule(invoker.address);

    return {
      roles,
      owner,
      invoker,
    };
  }

  it("blocks reentrant call - doNothing is never executed", async () => {
    const { roles, invoker } = await loadFixture(setup);

    const roleKey = hre.ethers.hexlify(hre.ethers.randomBytes(32));

    const ReentrancyChecker =
      await hre.ethers.getContractFactory("ReentrancyChecker");
    const checker = await ReentrancyChecker.deploy(
      await roles.getAddress(),
      roleKey,
    );
    const checkerAddress = await checker.getAddress();

    // Setup: grant role to invoker
    await roles.grantRole(invoker.address, roleKey, 0, 0, 0);

    // Setup: enable checker as module and grant same role so it can callback
    await roles.enableModule(checkerAddress);
    await roles.grantRole(checkerAddress, roleKey, 0, 0, 0);

    await roles.allowTarget(roleKey, checkerAddress, [], ExecutionOptions.None);

    await roles
      .connect(invoker)
      .execTransactionWithRole(
        checkerAddress,
        0,
        checker.interface.encodeFunctionData("attack"),
        0,
        roleKey,
        true,
      );

    // Verify attack() was executed
    expect(await checker.attackCalled()).to.equal(true);

    // Verify the reentrant call was caught with Reentrancy error
    expect(await checker.caughtReentrancy()).to.equal(true);

    // Verify that doNothing was NOT called (reentrancy was blocked)
    expect(await checker.doNothingCalled()).to.equal(false);
  });
});
