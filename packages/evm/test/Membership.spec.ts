import hre from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { deployRolesMod } from "./setup";

const ROLE_KEY = hre.ethers.id("TEST_ROLE");

describe("Membership", () => {
  async function setup() {
    const [owner, member] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
    await roles
      .connect(owner)
      .allowTarget(ROLE_KEY, await testContract.getAddress(), [], 0);

    return { roles, owner, member, testContract };
  }

  describe("Validity window", () => {
    it("reverts before start", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const futureRole = hre.ethers.id("FUTURE_ROLE");
      const futureStart = (await time.latest()) + 1000;

      await roles
        .connect(owner)
        .grantRole(member.address, futureRole, futureStart, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, futureRole);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            "0x",
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "MembershipNotYetValid");
    });

    it("reverts after end", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const shortRole = hre.ethers.id("SHORT_ROLE");
      const end = (await time.latest()) + 100;

      await roles
        .connect(owner)
        .grantRole(member.address, shortRole, 0, end, 0);
      await roles.connect(owner).setDefaultRole(member.address, shortRole);
      await time.increaseTo(end + 1);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            "0x",
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "MembershipExpired");
    });
  });

  describe("Usage limits accounting", () => {
    it("decrements finite uses", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const limitedRole = hre.ethers.id("LIMITED_ROLE");
      const target = await testContract.getAddress();

      await roles
        .connect(owner)
        .grantRole(member.address, limitedRole, 0, 0, 2);
      await roles.connect(owner).setDefaultRole(member.address, limitedRole);
      await roles.connect(owner).allowTarget(limitedRole, target, [], 0);

      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);

      // Second call succeeds (1 use left)
      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      ).to.not.be.reverted;
    });

    it("deletes membership at zero uses", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const limitedRole = hre.ethers.id("LIMITED_ROLE");
      const target = await testContract.getAddress();

      await roles
        .connect(owner)
        .grantRole(member.address, limitedRole, 0, 0, 2);
      await roles.connect(owner).setDefaultRole(member.address, limitedRole);
      await roles.connect(owner).allowTarget(limitedRole, target, [], 0);

      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);
      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);

      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("emits the UpdateRole event", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const limitedRole = hre.ethers.id("LIMITED_ROLE");
      const target = await testContract.getAddress();
      const MAX_UINT64 = BigInt("0xFFFFFFFFFFFFFFFF");

      await roles
        .connect(owner)
        .grantRole(member.address, limitedRole, 0, 0, 3);
      await roles.connect(owner).setDefaultRole(member.address, limitedRole);
      await roles.connect(owner).allowTarget(limitedRole, target, [], 0);

      // First call: 3 -> 2 uses
      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      )
        .to.emit(roles, "UpdateRole")
        .withArgs(limitedRole, member.address, 0, MAX_UINT64, 2);
    });

    it("emits the RevokeRole event", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const limitedRole = hre.ethers.id("LIMITED_ROLE");
      const target = await testContract.getAddress();

      await roles
        .connect(owner)
        .grantRole(member.address, limitedRole, 0, 0, 1);
      await roles.connect(owner).setDefaultRole(member.address, limitedRole);
      await roles.connect(owner).allowTarget(limitedRole, target, [], 0);

      // Last use: 1 -> 0 (revoked)
      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      )
        .to.emit(roles, "RevokeRole")
        .withArgs(limitedRole, member.address);
    });

    it("does not emit UpdateRole or RevokeRole for unlimited uses", async () => {
      const { roles, member, testContract } = await loadFixture(setup);
      const target = await testContract.getAddress();

      // Fixture already grants with usesLeft=0 → unlimited
      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      )
        .to.not.emit(roles, "UpdateRole")
        .and.to.not.emit(roles, "RevokeRole");
    });

    it("preserves end timestamp after decrement", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const limitedRole = hre.ethers.id("LIMITED_ROLE");
      const target = await testContract.getAddress();
      const end = (await time.latest()) + 1000;

      await roles
        .connect(owner)
        .grantRole(member.address, limitedRole, 0, end, 3);
      await roles.connect(owner).setDefaultRole(member.address, limitedRole);
      await roles.connect(owner).allowTarget(limitedRole, target, [], 0);

      // First call (usesLeft: 3 -> 2)
      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);

      // Second call exactly at end (usesLeft: 2 -> 1)
      await time.setNextBlockTimestamp(end);
      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);

      // Third call past end - should fail
      await time.setNextBlockTimestamp(end + 1);
      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "MembershipExpired");
    });

    it("does not decrement on failed inner exec", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const limitedRole = hre.ethers.id("LIMITED_ROLE");
      const target = await testContract.getAddress();

      await roles
        .connect(owner)
        .grantRole(member.address, limitedRole, 0, 0, 2);
      await roles.connect(owner).setDefaultRole(member.address, limitedRole);
      await roles.connect(owner).allowTarget(limitedRole, target, [], 0);

      const failingData =
        testContract.interface.encodeFunctionData("fnThatReverts");
      await roles
        .connect(member)
        .execTransactionFromModule(target, 0, failingData, 0);

      // Still have 2 uses
      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);
      await roles.connect(member).execTransactionFromModule(target, 0, "0x", 0);

      await expect(
        roles.connect(member).execTransactionFromModule(target, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("unlimited uses never decrements", async () => {
      const { roles, member, testContract } = await loadFixture(setup);

      // Fixture already grants with usesLeft=0 → max
      await roles
        .connect(member)
        .execTransactionFromModule(await testContract.getAddress(), 0, "0x", 0);
      await roles
        .connect(member)
        .execTransactionFromModule(await testContract.getAddress(), 0, "0x", 0);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            "0x",
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  describe("Default role resolution", () => {
    it("roleKey=0 uses default role", async () => {
      const { roles, member, testContract } = await loadFixture(setup);

      // Fixture sets default role, so roleKey=0 should work
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            "0x",
            0,
          ),
      ).to.not.be.reverted;
    });

    it("missing default role reverts NoMembership", async () => {
      const { roles, owner, testContract } = await loadFixture(setup);
      const [, , stranger] = await hre.ethers.getSigners();

      await roles.connect(owner).enableModule(stranger.address);

      await expect(
        roles
          .connect(stranger)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            "0x",
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });
  });
});
