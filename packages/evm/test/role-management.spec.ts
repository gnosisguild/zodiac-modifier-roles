import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroHash } from "ethers";

import { ExecutionOptions, PermissionCheckerStatus } from "./utils";
import { deployRolesMod } from "./setup";

/**
 * RoleManagement tests cover the membership lifecycle and authentication layer:
 * - Role assignment: grantRole, revokeRole, renounceRole, assignRoles
 * - Default role: setDefaultRole and resolution during execution
 * - Membership validation: zero role rejection, validity windows (start/end), usage limits
 * - Membership packing: start/end timestamps and usesLeft in a single uint256
 *
 * NOTE: Target/function scoping and condition evaluation are tested separately
 * in scoping.spec.ts and operators/*.spec.ts respectively.
 */

const maxUint64 = 2n ** 64n - 1n;
const maxUint128 = 2n ** 128n - 1n;

describe("RoleManagement", () => {
  async function setup() {
    const [owner, member, other] = await hre.ethers.getSigners();

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
      roles,
      owner,
      member,
      other,
      testContract,
      testContractAddress,
      avatar,
      avatarAddress,
      ROLE_KEY,
    };
  }

  describe("grantRole", () => {
    describe("basic functionality", () => {
      it("grants role to module", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);

        // Verify by checking module is enabled (grantRole auto-enables)
        expect(await roles.isModuleEnabled(member.address)).to.be.true;
      });

      it("automatically enables module if not already enabled", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        expect(await roles.isModuleEnabled(member.address)).to.be.false;

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);

        expect(await roles.isModuleEnabled(member.address)).to.be.true;
      });

      it("does not disable module when granting different role", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

        expect(await roles.isModuleEnabled(member.address)).to.be.true;
      });

      it("emits GrantRole event with correct parameters", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const start = 100;
        const end = 200;
        const usesLeft = 5;

        await expect(
          roles
            .connect(owner)
            .grantRole(member.address, ROLE_KEY, start, end, usesLeft),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, start, end, usesLeft);
      });
    });

    describe("validity window", () => {
      it("sets start timestamp when start > 0", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const start = 1000;
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, start, 0, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, start, maxUint64, maxUint128);
      });

      it("defaults to immediately valid when start = 0", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
      });

      it("sets end timestamp when end > 0", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const end = 9999;
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, end, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, end, maxUint128);
      });

      it("defaults to never expires (max uint64) when end = 0", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
      });
    });

    describe("usage limits", () => {
      it("sets finite usesLeft when usesLeft > 0", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const usesLeft = 10;
        await expect(
          roles
            .connect(owner)
            .grantRole(member.address, ROLE_KEY, 0, 0, usesLeft),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, usesLeft);
      });

      it("defaults to unlimited uses (max uint128) when usesLeft = 0", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
      });
    });

    describe("membership packing", () => {
      it("packs startTimestamp in upper 64 bits", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const start = 12345;
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, start, 0, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, start, maxUint64, maxUint128);
      });

      it("packs endTimestamp in middle 64 bits", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const end = 67890;
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, end, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, end, maxUint128);
      });

      it("packs usesLeft in lower 128 bits", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        const usesLeft = 999;
        await expect(
          roles
            .connect(owner)
            .grantRole(member.address, ROLE_KEY, 0, 0, usesLeft),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, usesLeft);
      });
    });

    describe("overwriting membership", () => {
      it("overwrites existing membership with new parameters", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, 100, 200, 5);

        await expect(
          roles
            .connect(owner)
            .grantRole(member.address, ROLE_KEY, 300, 400, 10),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 300, 400, 10);
      });

      it("can extend membership window", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, 100, 200, 0);

        // Extend end time
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 100, 500, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 100, 500, maxUint128);
      });

      it("can restrict membership window", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, 100, 500, 0);

        // Restrict end time
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 100, 200, 0),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 100, 200, maxUint128);
      });

      it("can change usage limits", async () => {
        const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, 0, 0, 10);

        // Change uses
        await expect(
          roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 5),
        )
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, 5);
      });
    });
  });

  describe("revokeRole", () => {
    it("removes membership from role", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      // Setup: grant role and allow target
      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // Revoke
      await roles.connect(owner).revokeRole(member.address, ROLE_KEY);

      // Should fail with NoMembership
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("emits RevokeRole event", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);

      await expect(roles.connect(owner).revokeRole(member.address, ROLE_KEY))
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });

    it("does not disable module (may have other roles)", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

      await roles.connect(owner).revokeRole(member.address, ROLE_KEY);

      // Module should still be enabled
      expect(await roles.isModuleEnabled(member.address)).to.be.true;
    });

    it("succeeds even if membership doesn't exist", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      // Should not revert
      await expect(roles.connect(owner).revokeRole(member.address, ROLE_KEY)).to
        .not.be.reverted;
    });
  });

  describe("renounceRole", () => {
    it("allows member to revoke their own role", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // Verify role is active
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;

      // Renounce role
      await roles.connect(member).renounceRole(ROLE_KEY);

      // Verify role is revoked
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("emits RevokeRole event", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);

      await expect(roles.connect(member).renounceRole(ROLE_KEY))
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });

    it("does not require owner permission", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);

      // member (not owner) can renounce
      await expect(roles.connect(member).renounceRole(ROLE_KEY)).to.not.be
        .reverted;
    });

    it("succeeds even if caller is not a member", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      // Should not revert
      await expect(roles.connect(member).renounceRole(ROLE_KEY)).to.not.be
        .reverted;
    });
  });

  describe("assignRoles", () => {
    it("batch grants roles when memberOf is true", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      await roles
        .connect(owner)
        .assignRoles(member.address, [ROLE_KEY, ROLE_KEY_2], [true, true]);

      // Both roles should emit GrantRole events
      expect(await roles.isModuleEnabled(member.address)).to.be.true;
    });

    it("batch revokes roles when memberOf is false", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      // First grant
      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

      // Then batch revoke
      await expect(
        roles
          .connect(owner)
          .assignRoles(member.address, [ROLE_KEY, ROLE_KEY_2], [false, false]),
      )
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });

    it("handles mixed grant and revoke in single call", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      // First grant ROLE_KEY
      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);
      await roles
        .connect(owner)
        .allowTarget(
          ROLE_KEY_2,
          testContractAddress,
          [],
          ExecutionOptions.None,
        );

      // Mixed: revoke ROLE_KEY, grant ROLE_KEY_2
      await roles
        .connect(owner)
        .assignRoles(member.address, [ROLE_KEY, ROLE_KEY_2], [false, true]);

      // Verify ROLE_KEY is revoked
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");

      // Verify ROLE_KEY_2 is active
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY_2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("grants with default parameters (start=0, end=0, usesLeft=0)", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await expect(
        roles.connect(owner).assignRoles(member.address, [ROLE_KEY], [true]),
      )
        .to.emit(roles, "GrantRole")
        .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
    });
  });

  describe("setDefaultRole", () => {
    it("sets default role for module", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);

      expect(await roles.defaultRoles(member.address)).to.equal(ROLE_KEY);
    });

    it("emits SetDefaultRole event", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await expect(
        roles.connect(owner).setDefaultRole(member.address, ROLE_KEY),
      )
        .to.emit(roles, "SetDefaultRole")
        .withArgs(member.address, ROLE_KEY);
    });

    it("allows setting to zero role (effectively no default)", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);

      const ZERO_ROLE = hre.ethers.ZeroHash;
      await expect(
        roles.connect(owner).setDefaultRole(member.address, ZERO_ROLE),
      )
        .to.emit(roles, "SetDefaultRole")
        .withArgs(member.address, ZERO_ROLE);

      expect(await roles.defaultRoles(member.address)).to.equal(ZERO_ROLE);
    });

    it("overwrites existing default role", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY_2);

      expect(await roles.defaultRoles(member.address)).to.equal(ROLE_KEY_2);
    });
  });

  describe("Membership validation", () => {
    describe("zero role key", () => {
      it("reverts NoMembership when roleKey is 0", async () => {
        const { roles, owner, member, testContractAddress, testContract } =
          await loadFixture(setup);

        const ZERO_ROLE = hre.ethers.ZeroHash;

        // Enable module and set default to zero role
        await roles.connect(owner).enableModule(member.address);
        await roles.connect(owner).setDefaultRole(member.address, ZERO_ROLE);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });

      it("rejects zero role even if membership exists for zero key", async () => {
        // Note: grantRole with zero role key could be called but the validation
        // in _authenticate will still reject it
        const { roles, owner, member, testContractAddress, testContract } =
          await loadFixture(setup);

        const ZERO_ROLE = hre.ethers.ZeroHash;

        await roles.connect(owner).enableModule(member.address);
        await roles.connect(owner).setDefaultRole(member.address, ZERO_ROLE);

        // Even trying to grant zero role and execute will fail
        await roles
          .connect(owner)
          .grantRole(member.address, ZERO_ROLE, 0, 0, 0);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });
    });

    describe("non-member", () => {
      it("reverts NoMembership when module has no membership", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        // Enable module but don't grant role
        await roles.connect(owner).enableModule(member.address);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });

      it("reverts NoMembership after role has been revoked", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Revoke
        await roles.connect(owner).revokeRole(member.address, ROLE_KEY);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });
    });

    describe("validity window", () => {
      it("reverts MembershipNotYetValid when current time < start", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        const currentTime = await time.latest();
        const futureStart = currentTime + 3600; // 1 hour in future

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, futureStart, 0, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "MembershipNotYetValid");
      });

      it("succeeds when current time == start (boundary)", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        const currentTime = await time.latest();
        const start = currentTime + 10;

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, start, 0, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Advance to exactly start time
        await time.increaseTo(start);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.not.be.reverted;
      });

      it("succeeds when current time > start and < end", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        const currentTime = await time.latest();
        const start = currentTime - 3600; // 1 hour ago
        const end = currentTime + 3600; // 1 hour in future

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, start, end, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.not.be.reverted;
      });

      it("succeeds when current time == end (boundary)", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        const currentTime = await time.latest();
        // Set end far enough in the future to account for transaction execution time
        const end = currentTime + 100;

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, 0, end, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Advance to just before end time (time.increaseTo advances block timestamp,
        // but the actual transaction will be in the next block which might be +1)
        await time.increaseTo(end - 1);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.not.be.reverted;
      });

      it("reverts MembershipExpired when current time > end", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        const currentTime = await time.latest();
        const end = currentTime + 100;

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, 0, end, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Advance past end time
        await time.increaseTo(end + 1);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "MembershipExpired");
      });
    });

    describe("usage limits", () => {
      it("decrements usesLeft on successful transaction", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 3);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // First transaction should succeed and decrement to 2
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        )
          .to.emit(roles, "UpdateRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, 2);
      });

      it("does not decrement usesLeft on failed inner transaction", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 3);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Execute a transaction that fails (fnThatReverts)
        await roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.fnThatReverts.populateTransaction())
              .data as string,
            0,
          );

        // Uses should still be 3 - test by executing 3 successful transactions
        for (let i = 0; i < 3; i++) {
          await roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            );
        }

        // Fourth should fail (uses exhausted)
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });

      it("revokes membership (sets to 0) when usesLeft reaches 0", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 1);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Use the one use - should emit RevokeRole
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        )
          .to.emit(roles, "RevokeRole")
          .withArgs(ROLE_KEY, member.address);

        // Next should fail
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });

      it("emits UpdateRole event when usesLeft decrements", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 5);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        )
          .to.emit(roles, "UpdateRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, 4);
      });

      it("emits RevokeRole event when usesLeft reaches 0", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 1);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        )
          .to.emit(roles, "RevokeRole")
          .withArgs(ROLE_KEY, member.address);
      });

      it("never decrements unlimited uses (max uint128)", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        // usesLeft = 0 means unlimited (max uint128)
        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Execute multiple times - should never emit UpdateRole or RevokeRole
        for (let i = 0; i < 5; i++) {
          const tx = await roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            );
          const receipt = await tx.wait();
          const updateRoleEvents = receipt?.logs.filter(
            (log: any) => log.fragment?.name === "UpdateRole",
          );
          const revokeRoleEvents = receipt?.logs.filter(
            (log: any) => log.fragment?.name === "RevokeRole",
          );
          expect(updateRoleEvents?.length || 0).to.equal(0);
          expect(revokeRoleEvents?.length || 0).to.equal(0);
        }
      });

      it("does not emit UpdateRole for unlimited uses", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.not.emit(roles, "UpdateRole");
      });
    });

    describe("membership persistence", () => {
      it("preserves start/end timestamps after decrement", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        const currentTime = await time.latest();
        const start = currentTime - 100;
        const end = currentTime + 10000;

        await roles
          .connect(owner)
          .grantRole(member.address, ROLE_KEY, start, end, 5);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Execute to decrement uses
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        )
          .to.emit(roles, "UpdateRole")
          .withArgs(ROLE_KEY, member.address, start, end, 4);
      });

      it("correctly updates membership in storage", async () => {
        const {
          roles,
          owner,
          member,
          ROLE_KEY,
          testContractAddress,
          testContract,
        } = await loadFixture(setup);

        await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 3);
        await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
        await roles
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.None,
          );

        // Use all 3 uses
        for (let i = 0; i < 3; i++) {
          await roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            );
        }

        // Membership should be revoked in storage
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              (await testContract.doNothing.populateTransaction())
                .data as string,
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "NoMembership");
      });
    });
  });

  describe("Default role resolution", () => {
    it("uses default role when execTransactionFromModule is called", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // Should use default role
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("uses default role when execTransactionFromModuleReturnData is called", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // Should use default role
      await expect(
        roles
          .connect(member)
          .execTransactionFromModuleReturnData(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("switching default role changes permission outcome", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      // Grant both roles to member
      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

      // Only ROLE_KEY has permission for testContract
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // Set default to ROLE_KEY_2 (no permission) - should fail
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY_2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, ZeroHash);

      // Switch default to ROLE_KEY (has permission) - should succeed
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("reverts NoMembership when default role is 0", async () => {
      const { roles, owner, member, testContractAddress, testContract } =
        await loadFixture(setup);

      await roles.connect(owner).enableModule(member.address);
      // Default role is 0 (ZeroHash)

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("reverts NoMembership when default role membership doesn't exist", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).enableModule(member.address);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      // Don't grant the role

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });
  });

  describe("Module authentication", () => {
    it("allows enabled module to execute", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("reverts when caller is not enabled module", async () => {
      const { roles, other, testContractAddress, testContract } =
        await loadFixture(setup);

      await expect(
        roles
          .connect(other)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NotAuthorized");
    });

    it.skip(
      "supports signature-based module authentication (sentOrSignedByModule)",
    );
  });

  describe("Edge cases", () => {
    it("handles maximum values for start/end/usesLeft", async () => {
      const { roles, owner, member, ROLE_KEY } = await loadFixture(setup);

      await expect(
        roles
          .connect(owner)
          .grantRole(
            member.address,
            ROLE_KEY,
            maxUint64,
            maxUint64,
            maxUint128,
          ),
      )
        .to.emit(roles, "GrantRole")
        .withArgs(ROLE_KEY, member.address, maxUint64, maxUint64, maxUint128);
    });

    it("handles minimum values (1) for usesLeft", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 1);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // First use should work
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      )
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);

      // Second use should fail
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("handles multiple roles for same module", async () => {
      const {
        roles,
        owner,
        member,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

      // Allow target for both roles
      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);
      await roles
        .connect(owner)
        .allowTarget(
          ROLE_KEY_2,
          testContractAddress,
          [],
          ExecutionOptions.None,
        );

      // Can use both roles
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;

      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY_2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("handles same role for multiple modules", async () => {
      const {
        roles,
        owner,
        member,
        other,
        ROLE_KEY,
        testContractAddress,
        testContract,
      } = await loadFixture(setup);

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).grantRole(other.address, ROLE_KEY, 0, 0, 0);

      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles.connect(owner).setDefaultRole(other.address, ROLE_KEY);

      await roles
        .connect(owner)
        .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

      // Both modules can use the role
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;

      await expect(
        roles
          .connect(other)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.not.be.reverted;
    });
  });
});
