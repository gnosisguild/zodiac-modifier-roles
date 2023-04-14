import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ExecutionOptions, deployRolesMod } from "./utils";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";
const ROLE_KEY1 =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const ROLE_KEY2 =
  "0x0000000000000000000000000000000000000000000000000000000000000002";

describe("Roles", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker, alice, bob] = await hre.ethers.getSigners();
    const modifier = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      avatar,
      owner,
      invoker,
      alice,
      bob,
      modifier,
      testContract,
    };
  }

  describe("setUp()", async () => {
    it("should emit event because of successful set up", async () => {
      const [user1] = await hre.ethers.getSigners();
      const modifier = await deployRolesMod(
        hre,
        user1.address,
        user1.address,
        user1.address
      );
      await modifier.deployed();
      await expect(modifier.deployTransaction)
        .to.emit(modifier, "RolesModSetup")
        .withArgs(user1.address, user1.address, user1.address, user1.address);
    });
  });

  describe("assignRoles()", async () => {
    it("should throw on length mismatch", async () => {
      const { modifier, owner, alice } = await loadFixture(setup);
      await expect(
        modifier
          .connect(owner)
          .assignRoles(alice.address, [ROLE_KEY1, ROLE_KEY2], [true])
      ).to.be.revertedWithCustomError(modifier, "ArraysDifferentLength");
    });
    it("reverts if not authorized", async () => {
      const { modifier, alice, bob } = await loadFixture(setup);
      await expect(
        modifier.connect(alice).assignRoles(bob.address, [ROLE_KEY1], [true])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("assigns roles to a module", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0
          )
      ).to.be.revertedWithCustomError(modifier, "NoMembership");

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0
          )
      ).to.emit(testContract, "DoNothing");
    });
    it("revokes roles to a module", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      //authorize
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);
      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      // expect it to succeed, after assigning role
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0
          )
      ).to.emit(testContract, "DoNothing");

      //revoke
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [false]);

      // expect it to fail, after revoking
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0
          )
      ).to.be.revertedWithCustomError(modifier, "NoMembership");
    });
    it("it enables the module if necessary", async () => {
      const { modifier, owner, alice } = await loadFixture(setup);

      await modifier
        .connect(owner)
        .assignRoles(alice.address, [ROLE_KEY1], [true]);

      await expect(await modifier.isModuleEnabled(alice.address)).to.equal(
        true
      );

      await expect(
        modifier
          .connect(owner)
          .assignRoles(alice.address, [ROLE_KEY1, ROLE_KEY2], [true, true])
      ).to.not.be.reverted;
    });
    it("emits the AssignRoles event", async () => {
      const { owner, alice, modifier } = await loadFixture(setup);

      await expect(
        modifier.connect(owner).assignRoles(alice.address, [ROLE_KEY1], [true])
      )
        .to.emit(modifier, "AssignRoles")
        .withArgs(alice.address, [ROLE_KEY1], [true]);
    });
  });

  describe("setDefaultRole()", () => {
    it("reverts if not authorized", async () => {
      const { modifier, alice, bob } = await loadFixture(setup);
      await expect(
        modifier.connect(alice).setDefaultRole(bob.address, ROLE_KEY1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("sets default role", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      // grant roles 1 and 2 to invoker
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY1, ROLE_KEY2], [true, true]);

      // make ROLE2 the default for invoker
      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY2);

      // allow all calls to testContract from ROLE1
      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY1, testContract.address, ExecutionOptions.None);

      // expect it to fail
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0
          )
      ).to.be.reverted;

      // make ROLE1 the default to invoker
      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY1);
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0
          )
      ).to.emit(testContract, "DoNothing");
    });
    it("emits event with correct params", async () => {
      const { modifier, owner, invoker } = await loadFixture(setup);

      await expect(
        modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY2)
      )
        .to.emit(modifier, "SetDefaultRole")
        .withArgs(invoker.address, ROLE_KEY2);
    });
  });

  describe("execTransactionFromModule()", () => {
    it.skip("success=true, flushes consumptions to storage");
    it.skip("success=false, does not flush consumptions to storage");
  });

  describe("execTransactionFromModuleReturnData()", () => {
    it.skip("success=true, flushes consumptions to storage");
    it.skip("success=false, does not flush consumptions to storage");
  });

  describe("execTransactionWithRole()", () => {
    it.skip("success=true shouldRevert=true, flush YES revert NO");
    it.skip("success=true shouldRevert=false, flush YES revert NO");
    it.skip("success=false shouldRevert=true, flush NO revert YES");
    it.skip("success=false shouldRevert=false, flush NO revert NO");
  });

  describe("execTransactionWithRoleReturnData()", () => {
    it.skip("success=true shouldRevert=true, flush YES revert NO");
    it.skip("success=true shouldRevert=false, flush YES revert NO");
    it.skip("success=false shouldRevert=true, flush NO revert YES");
    it.skip("success=false shouldRevert=false, flush NO revert NO");
  });
});
