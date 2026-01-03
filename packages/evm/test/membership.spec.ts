import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { deployRolesMod } from "./setup";

/**
 * Membership.sol tests - the authentication layer that validates module
 * membership before authorizing transactions.
 *
 * This file tests the _authenticate() internal function behavior, which:
 * - Validates the role key isn't zero
 * - Checks membership exists
 * - Validates validity window (start/end timestamps)
 * - Handles usage accounting (unlimited vs finite, decrement logic)
 */

const maxUint64 = 2n ** 64n - 1n;
const maxUint128 = 2n ** 128n - 1n;

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
    const testContractAddress = await testContract.getAddress();

    const ROLE_KEY = hre.ethers.hexlify(hre.ethers.randomBytes(32));

    return {
      roles: roles.connect(owner),
      owner,
      member,
      testContract,
      testContractAddress,
      ROLE_KEY,
    };
  }

  describe("_authenticate", () => {
    it("reverts NoMembership when module has no membership for role", async () => {
      const { roles, member, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      await roles.enableModule(member.address);
      await roles.setDefaultRole(member.address, ROLE_KEY);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("reverts NoMembership after membership has been revoked", async () => {
      const { roles, member, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;

      await roles.revokeRole(member.address, ROLE_KEY);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("rejects zero role even if membership storage is non-zero", async () => {
      const { roles, member, testContractAddress } = await loadFixture(setup);

      const ZERO_ROLE = hre.ethers.ZeroHash;

      await roles.grantRole(member.address, ZERO_ROLE, 0, 0, 0);
      await roles.setDefaultRole(member.address, ZERO_ROLE);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    describe("validity window", () => {
      it("reverts MembershipNotYetValid before start timestamp", async () => {
        const { roles, member, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        const futureStart = (await time.latest()) + 3600;

        await roles.grantRole(member.address, ROLE_KEY, futureStart, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, "0x", 0),
        ).to.be.revertedWithCustomError(roles, "MembershipNotYetValid");
      });

      it("succeeds at exactly start timestamp (boundary)", async () => {
        const { roles, member, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        const start = (await time.latest()) + 100;

        await roles.grantRole(member.address, ROLE_KEY, start, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

        await time.increaseTo(start);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, "0x", 0),
        ).to.not.be.reverted;
      });

      it("succeeds when within valid window", async () => {
        const { roles, member, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        const now = await time.latest();
        const start = now - 100;
        const end = now + 3600;

        await roles.grantRole(member.address, ROLE_KEY, start, end, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, "0x", 0),
        ).to.not.be.reverted;
      });

      it("succeeds at exactly end timestamp (boundary)", async () => {
        const { roles, member, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        const end = (await time.latest()) + 100;

        await roles.grantRole(member.address, ROLE_KEY, 0, end, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

        await time.setNextBlockTimestamp(end);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, "0x", 0),
        ).to.not.be.reverted;
      });

      it("reverts MembershipExpired after end timestamp", async () => {
        const { roles, member, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        const end = (await time.latest()) + 100;

        await roles.grantRole(member.address, ROLE_KEY, 0, end, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

        await time.increaseTo(end + 1);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, "0x", 0),
        ).to.be.revertedWithCustomError(roles, "MembershipExpired");
      });
    });

    describe("usage accounting", () => {
      describe("unlimited uses", () => {
        it("does not decrement for unlimited uses", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          // Execute multiple times - all should succeed
          for (let i = 0; i < 5; i++) {
            await expect(
              roles
                .connect(member)
                .execTransactionFromModule(testContractAddress, 0, "0x", 0),
            ).to.not.be.reverted;
          }
        });

        it("does not emit UpdateRole for unlimited uses", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.not.emit(roles, "UpdateRole");
        });

        it("does not emit RevokeRole for unlimited uses", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.not.emit(roles, "RevokeRole");
        });
      });

      describe("finite uses", () => {
        it("decrements usesLeft on successful execution", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 3);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          )
            .to.emit(roles, "UpdateRole")
            .withArgs(ROLE_KEY, member.address, 0, maxUint64, 2);
        });

        it("preserves start/end timestamps after decrement", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          const now = await time.latest();
          const start = now - 100;
          const end = now + 10000;

          await roles.grantRole(member.address, ROLE_KEY, start, end, 5);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          )
            .to.emit(roles, "UpdateRole")
            .withArgs(ROLE_KEY, member.address, start, end, 4);
        });

        it("does not decrement on failed inner execution", async () => {
          const { roles, member, testContract, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 2);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          const revertingData =
            testContract.interface.encodeFunctionData("fnThatReverts");

          // Execute failing call - should not emit UpdateRole (no decrement)
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                revertingData,
                0,
              ),
          ).to.not.emit(roles, "UpdateRole");

          // First successful call should show 2 -> 1 (proving failed call didn't decrement)
          const doNothingData =
            testContract.interface.encodeFunctionData("doNothing");
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                doNothingData,
                0,
              ),
          )
            .to.emit(roles, "UpdateRole")
            .withArgs(ROLE_KEY, member.address, 0, maxUint64, 1);
        });

        it("emits UpdateRole with decremented usesLeft", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 5);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          // First decrement: 5 -> 4
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          )
            .to.emit(roles, "UpdateRole")
            .withArgs(ROLE_KEY, member.address, 0, maxUint64, 4);

          // Second decrement: 4 -> 3
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          )
            .to.emit(roles, "UpdateRole")
            .withArgs(ROLE_KEY, member.address, 0, maxUint64, 3);
        });
      });

      describe("exhaustion", () => {
        it("revokes membership when usesLeft reaches 0", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 1);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          // Use the one use
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.not.be.reverted;

          // Next should fail - membership revoked
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.be.revertedWithCustomError(roles, "NoMembership");
        });

        it("emits RevokeRole when usesLeft reaches 0", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 1);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          )
            .to.emit(roles, "RevokeRole")
            .withArgs(ROLE_KEY, member.address);
        });

        it("reverts NoMembership on subsequent call after exhaustion", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 2);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(ROLE_KEY, testContractAddress, [], 0);

          // Use both uses
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.not.be.reverted;
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.not.be.reverted;

          // Subsequent call should fail
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.be.revertedWithCustomError(roles, "NoMembership");
        });
      });
    });
  });
});
