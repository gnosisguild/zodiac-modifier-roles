import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroHash, ZeroAddress } from "ethers";

import { Encoding, ExecutionOptions, Operator } from "./utils";
import { deployRolesMod } from "./setup";

const maxUint64 = 2n ** 64n - 1n;
const maxUint128 = 2n ** 128n - 1n;

/**
 * Setup tests cover the Setup.sol configuration API functions:
 * - Role membership: grantRole, revokeRole, renounceRole, assignRoles, setDefaultRole
 * - Target permissions: allowTarget, scopeTarget, revokeTarget
 * - Function permissions: allowFunction, revokeFunction
 * - Allowances: setAllowance, updateAllowance
 * - Adapters: setTransactionUnwrapper
 */

describe("Setup", () => {
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

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");

    return {
      roles: roles.connect(owner),
      owner,
      member,
      testContract,
      testContractAddress,
      ROLE_KEY,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROLE MEMBERSHIP
  // ═══════════════════════════════════════════════════════════════════════════

  describe("grantRole", () => {
    it("grants role to module", async () => {
      const { roles, member, ROLE_KEY, testContractAddress } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      // Member can now execute - proves role was granted
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;
    });

    it("automatically enables module if not already enabled", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      expect(await roles.isModuleEnabled(member.address)).to.be.false;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);

      expect(await roles.isModuleEnabled(member.address)).to.be.true;
    });

    it("emits GrantRole event", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await expect(roles.grantRole(member.address, ROLE_KEY, 100, 200, 5))
        .to.emit(roles, "GrantRole")
        .withArgs(ROLE_KEY, member.address, 100, 200, 5);
    });

    describe("validity window", () => {
      it("sets start timestamp when start > 0", async () => {
        const { roles, member, ROLE_KEY } = await loadFixture(setup);

        await expect(roles.grantRole(member.address, ROLE_KEY, 1000, 0, 0))
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 1000, maxUint64, maxUint128);
      });

      it("defaults to immediately valid when start = 0", async () => {
        const { roles, member, ROLE_KEY } = await loadFixture(setup);

        await expect(roles.grantRole(member.address, ROLE_KEY, 0, 0, 0))
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
      });

      it("sets end timestamp when end > 0", async () => {
        const { roles, member, ROLE_KEY } = await loadFixture(setup);

        await expect(roles.grantRole(member.address, ROLE_KEY, 0, 9999, 0))
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, 9999, maxUint128);
      });

      it("defaults to never expires (max uint64) when end = 0", async () => {
        const { roles, member, ROLE_KEY } = await loadFixture(setup);

        await expect(roles.grantRole(member.address, ROLE_KEY, 0, 0, 0))
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
      });
    });

    describe("usage limits", () => {
      it("sets finite usesLeft when usesLeft > 0", async () => {
        const { roles, member, ROLE_KEY } = await loadFixture(setup);

        await expect(roles.grantRole(member.address, ROLE_KEY, 0, 0, 10))
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, 10);
      });

      it("defaults to unlimited uses (max uint128) when usesLeft = 0", async () => {
        const { roles, member, ROLE_KEY } = await loadFixture(setup);

        await expect(roles.grantRole(member.address, ROLE_KEY, 0, 0, 0))
          .to.emit(roles, "GrantRole")
          .withArgs(ROLE_KEY, member.address, 0, maxUint64, maxUint128);
      });
    });

    it("overwrites existing membership with new parameters", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 100, 200, 5);

      await expect(roles.grantRole(member.address, ROLE_KEY, 300, 400, 10))
        .to.emit(roles, "GrantRole")
        .withArgs(ROLE_KEY, member.address, 300, 400, 10);
    });
  });

  describe("revokeRole", () => {
    it("removes membership from role", async () => {
      const { roles, member, ROLE_KEY, testContractAddress } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

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

    it("emits RevokeRole event", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);

      await expect(roles.revokeRole(member.address, ROLE_KEY))
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });

    it("does not disable module (may have other roles)", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.id("TEST_ROLE_2");

      expect(await roles.isModuleEnabled(member.address)).to.be.false;
      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.grantRole(member.address, ROLE_KEY_2, 0, 0, 0);
      await roles.revokeRole(member.address, ROLE_KEY);
      expect(await roles.isModuleEnabled(member.address)).to.be.true;
    });

    it("succeeds even if membership doesn't exist", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await expect(roles.revokeRole(member.address, ROLE_KEY)).to.not.be
        .reverted;
    });
  });

  describe("renounceRole", () => {
    it("allows member to revoke their own role", async () => {
      const { roles, member, ROLE_KEY, testContractAddress } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;

      await roles.connect(member).renounceRole(ROLE_KEY);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("emits RevokeRole event", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);

      await expect(roles.connect(member).renounceRole(ROLE_KEY))
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });
  });

  describe("assignRoles", () => {
    it("batch grants roles when memberOf is true", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.id("TEST_ROLE_2");

      await roles.assignRoles(
        member.address,
        [ROLE_KEY, ROLE_KEY_2],
        [true, true],
      );

      expect(await roles.isModuleEnabled(member.address)).to.be.true;
    });

    it("batch revokes roles when memberOf is false", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.id("TEST_ROLE_2");

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

      await expect(
        roles.assignRoles(
          member.address,
          [ROLE_KEY, ROLE_KEY_2],
          [false, false],
        ),
      )
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });

    it("handles mixed grant and revoke in single call", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.id("TEST_ROLE_2");

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);

      // Revoke ROLE_KEY, grant ROLE_KEY_2
      const tx = await roles.assignRoles(
        member.address,
        [ROLE_KEY, ROLE_KEY_2],
        [false, true],
      );

      await expect(tx)
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
      await expect(tx)
        .to.emit(roles, "GrantRole")
        .withArgs(ROLE_KEY_2, member.address, 0, maxUint64, maxUint128);
    });
  });

  describe("setDefaultRole", () => {
    it("sets default role for module", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await roles.setDefaultRole(member.address, ROLE_KEY);

      expect(await roles.defaultRoles(member.address)).to.equal(ROLE_KEY);
    });

    it("emits SetDefaultRole event", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await expect(roles.setDefaultRole(member.address, ROLE_KEY))
        .to.emit(roles, "SetDefaultRole")
        .withArgs(member.address, ROLE_KEY);
    });

    it("allows setting to zero role (effectively no default)", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      await roles.setDefaultRole(member.address, ROLE_KEY);

      await expect(roles.setDefaultRole(member.address, ZeroHash))
        .to.emit(roles, "SetDefaultRole")
        .withArgs(member.address, ZeroHash);

      expect(await roles.defaultRoles(member.address)).to.equal(ZeroHash);
    });

    it("overwrites existing default role", async () => {
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.id("TEST_ROLE_2");

      await roles.setDefaultRole(member.address, ROLE_KEY);
      expect(await roles.defaultRoles(member.address)).to.equal(ROLE_KEY);

      await roles.setDefaultRole(member.address, ROLE_KEY_2);
      expect(await roles.defaultRoles(member.address)).to.equal(ROLE_KEY_2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TARGET PERMISSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("allowTarget", () => {
    it("sets clearance to Target for address", async () => {
      const { roles, member, ROLE_KEY, testContractAddress } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      )
        .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
        .withArgs(testContractAddress);

      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      // Can call any function on target
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;
    });

    it("validates condition tree integrity on store", async () => {
      const { roles, ROLE_KEY, testContractAddress } = await loadFixture(setup);

      // Invalid: root node has invalid parent reference (must be 0 for root)
      await expect(
        roles.allowTarget(
          ROLE_KEY,
          testContractAddress,
          [
            {
              parent: 5, // Invalid - root node must have parent 0
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          ExecutionOptions.None,
        ),
      ).to.be.revertedWithCustomError(roles, "UnsuitableRootNode");
    });

    it("emits AllowTarget event", async () => {
      const { roles, ROLE_KEY, testContractAddress } = await loadFixture(setup);

      await expect(
        roles.allowTarget(
          ROLE_KEY,
          testContractAddress,
          [],
          ExecutionOptions.None,
        ),
      )
        .to.emit(roles, "AllowTarget")
        .withArgs(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);
    });

    it("overwrites existing target permission", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);

      // Allow target with no conditions
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      // Any param value works
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(99))
              .data as string,
            0,
          ),
      ).to.not.be.reverted;

      // Overwrite with condition: param must equal 42
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: hre.ethers.AbiCoder.defaultAbiCoder().encode(
              ["uint256"],
              [42],
            ),
          },
        ],
        ExecutionOptions.None,
      );

      // Now 99 should fail
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(99))
              .data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");

      // But 42 should pass
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(42))
              .data as string,
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  describe("scopeTarget", () => {
    it("sets clearance to Function for address", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);

      // Without allowFunction, calls should fail
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");
    });

    it("emits ScopeTarget event", async () => {
      const { roles, ROLE_KEY, testContractAddress } = await loadFixture(setup);

      await expect(roles.scopeTarget(ROLE_KEY, testContractAddress))
        .to.emit(roles, "ScopeTarget")
        .withArgs(ROLE_KEY, testContractAddress);
    });
  });

  describe("revokeTarget", () => {
    it("sets clearance to None for address", async () => {
      const { roles, member, ROLE_KEY, testContractAddress } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      // Verify target is allowed before revoking
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;

      await roles.revokeTarget(ROLE_KEY, testContractAddress);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      )
        .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
        .withArgs(testContractAddress);
    });

    it("emits RevokeTarget event", async () => {
      const { roles, ROLE_KEY, testContractAddress } = await loadFixture(setup);

      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      await expect(roles.revokeTarget(ROLE_KEY, testContractAddress))
        .to.emit(roles, "RevokeTarget")
        .withArgs(ROLE_KEY, testContractAddress);
    });

    it("does not clear function-level scopeConfig entries", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [],
        ExecutionOptions.None,
      );

      // Revoke - target no longer allowed
      await roles.revokeTarget(ROLE_KEY, testContractAddress);

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
        .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
        .withArgs(testContractAddress);

      // Re-scope - function should still be allowed (scopeConfig preserved)
      await roles.scopeTarget(ROLE_KEY, testContractAddress);

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

    it("succeeds even if target was not allowed", async () => {
      const { roles, ROLE_KEY, testContractAddress } = await loadFixture(setup);

      await expect(roles.revokeTarget(ROLE_KEY, testContractAddress)).to.not.be
        .reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTION PERMISSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("allowFunction", () => {
    it("stores empty conditions as single Pass node", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [],
        ExecutionOptions.None,
      );

      // Should be able to call the function
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

    it("stores and enforces provided conditions", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);

      // Allow with condition: param must equal 42
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: hre.ethers.AbiCoder.defaultAbiCoder().encode(
              ["uint256"],
              [42],
            ),
          },
        ],
        ExecutionOptions.None,
      );

      // Call with 42 - should succeed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(42))
              .data as string,
            0,
          ),
      ).to.not.be.reverted;

      // Call with 99 - should fail
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(99))
              .data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");
    });

    it("validates condition tree integrity on store", async () => {
      const { roles, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector = testContract.interface.getFunction("doNothing").selector;

      // Invalid: root node has invalid parent reference (must be 0 for root)
      await expect(
        roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [
            {
              parent: 5, // Invalid - root node must have parent 0
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          ExecutionOptions.None,
        ),
      ).to.be.revertedWithCustomError(roles, "UnsuitableRootNode");
    });

    it("emits AllowFunction event", async () => {
      const { roles, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector = testContract.interface.getFunction("doNothing").selector;

      await expect(
        roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [],
          ExecutionOptions.None,
        ),
      )
        .to.emit(roles, "AllowFunction")
        .withArgs(
          ROLE_KEY,
          testContractAddress,
          selector,
          [],
          ExecutionOptions.None,
        );
    });

    it("overwrites existing function permission", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);

      // Allow with condition: param must equal 1
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: hre.ethers.AbiCoder.defaultAbiCoder().encode(
              ["uint256"],
              [1],
            ),
          },
        ],
        ExecutionOptions.None,
      );

      // Call with 2 should fail
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(2))
              .data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");

      // Overwrite: param must equal 2
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: hre.ethers.AbiCoder.defaultAbiCoder().encode(
              ["uint256"],
              [2],
            ),
          },
        ],
        ExecutionOptions.None,
      );

      // Call with 2 should now pass
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(2))
              .data as string,
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  describe("revokeFunction", () => {
    it("deletes scopeConfig for target + selector", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [],
        ExecutionOptions.None,
      );

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

      await roles.revokeFunction(ROLE_KEY, testContractAddress, selector);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");
    });

    it("emits RevokeFunction event", async () => {
      const { roles, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [],
        ExecutionOptions.None,
      );

      await expect(
        roles.revokeFunction(ROLE_KEY, testContractAddress, selector),
      )
        .to.emit(roles, "RevokeFunction")
        .withArgs(ROLE_KEY, testContractAddress, selector);
    });

    it("does not affect other functions on same target", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector1 =
        testContract.interface.getFunction("doNothing").selector;
      const selector2 =
        testContract.interface.getFunction("doEvenLess").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector1,
        [],
        ExecutionOptions.None,
      );
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector2,
        [],
        ExecutionOptions.None,
      );

      // Revoke selector1
      await roles.revokeFunction(ROLE_KEY, testContractAddress, selector1);

      // selector1 should be revoked
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");

      // selector2 should still be allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doEvenLess.populateTransaction())
              .data as string,
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ALLOWANCES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("setAllowance", () => {
    it("sets balance to specified value", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.balance).to.equal(500);
    });

    it("sets refill to specified value", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.refill).to.equal(100);
    });

    it("sets period to specified value", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.period).to.equal(3600);
    });

    it("emits SetAllowance event", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await expect(
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0),
      ).to.emit(roles, "SetAllowance");
    });

    describe("default values", () => {
      it("sets maxRefill to max uint128 when passed 0", async () => {
        const { roles } = await loadFixture(setup);

        const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

        await roles.setAllowance(ALLOWANCE_KEY, 500, 0, 100, 3600, 0);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.maxRefill).to.equal(maxUint128);
      });

      it("sets timestamp to current block.timestamp when passed 0", async () => {
        const { roles } = await loadFixture(setup);

        const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

        const tx = await roles.setAllowance(
          ALLOWANCE_KEY,
          500,
          1000,
          100,
          3600,
          0,
        );

        const receipt = await tx.wait();
        const block = await hre.ethers.provider.getBlock(receipt!.blockNumber);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.timestamp).to.equal(block!.timestamp);
      });
    });

    it("overwrites all fields of existing allowance", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
      await roles.setAllowance(ALLOWANCE_KEY, 999, 2000, 200, 7200, 0);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.balance).to.equal(999);
      expect(allowance.maxRefill).to.equal(2000);
      expect(allowance.refill).to.equal(200);
      expect(allowance.period).to.equal(7200);
    });
  });

  describe("updateAllowance", () => {
    it("updates refill parameters only", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
      await roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.maxRefill).to.equal(2000);
      expect(allowance.refill).to.equal(200);
      expect(allowance.period).to.equal(7200);
    });

    it("preserves existing balance", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
      await roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.balance).to.equal(500);
    });

    it("preserves existing timestamp", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

      await time.increase(1000);

      await roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.timestamp).to.equal(initialAllowance.timestamp);
    });

    it("emits SetAllowance event", async () => {
      const { roles } = await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      await expect(
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200),
      ).to.emit(roles, "SetAllowance");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADAPTERS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("setTransactionUnwrapper", () => {
    it("registers unwrapper for target + selector", async () => {
      const { roles, testContractAddress, testContract } =
        await loadFixture(setup);

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      const selector = testContract.interface.getFunction("doNothing").selector;

      await expect(
        roles.setTransactionUnwrapper(
          testContractAddress,
          selector,
          unwrapperAddress,
        ),
      )
        .to.emit(roles, "SetUnwrapAdapter")
        .withArgs(testContractAddress, selector, unwrapperAddress);
    });

    it("emits SetUnwrapAdapter event", async () => {
      const { roles, testContractAddress, testContract } =
        await loadFixture(setup);

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      const selector = testContract.interface.getFunction("doNothing").selector;

      await expect(
        roles.setTransactionUnwrapper(
          testContractAddress,
          selector,
          unwrapperAddress,
        ),
      )
        .to.emit(roles, "SetUnwrapAdapter")
        .withArgs(testContractAddress, selector, unwrapperAddress);
    });

    it("can update existing unwrapper", async () => {
      const { roles, testContractAddress, testContract } =
        await loadFixture(setup);

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper1 = await MultiSendUnwrapper.deploy();
      const unwrapper2 = await MultiSendUnwrapper.deploy();
      const unwrapper2Address = await unwrapper2.getAddress();

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.setTransactionUnwrapper(
        testContractAddress,
        selector,
        await unwrapper1.getAddress(),
      );

      // Second call updates to unwrapper2
      await expect(
        roles.setTransactionUnwrapper(
          testContractAddress,
          selector,
          unwrapper2Address,
        ),
      )
        .to.emit(roles, "SetUnwrapAdapter")
        .withArgs(testContractAddress, selector, unwrapper2Address);
    });

    it("can remove unwrapper by setting to zero address", async () => {
      const { roles, testContractAddress, testContract } =
        await loadFixture(setup);

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.setTransactionUnwrapper(
        testContractAddress,
        selector,
        unwrapperAddress,
      );

      await expect(
        roles.setTransactionUnwrapper(
          testContractAddress,
          selector,
          ZeroAddress,
        ),
      )
        .to.emit(roles, "SetUnwrapAdapter")
        .withArgs(testContractAddress, selector, ZeroAddress);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ISOLATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Isolation", () => {
    it("allowing one target does not allow another target", async () => {
      const { roles, member, ROLE_KEY, testContractAddress } =
        await loadFixture(setup);

      const TestContract2 = await hre.ethers.getContractFactory("TestContract");
      const testContract2 = await TestContract2.deploy();
      const testContract2Address = await testContract2.getAddress();

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      // testContractAddress is allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;

      // testContract2Address is NOT allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContract2Address, 0, "0x", 0),
      )
        .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
        .withArgs(testContract2Address);
    });

    it("allowing one function does not allow other functions on same target", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const selector1 =
        testContract.interface.getFunction("doNothing").selector;
      const selector2 =
        testContract.interface.getFunction("fnThatReverts").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector1,
        [],
        ExecutionOptions.None,
      );

      // selector1 is allowed
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

      // selector2 is NOT allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.fnThatReverts.populateTransaction())
              .data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");
    });

    it("allowing a function on one target does not allow it on another target", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const TestContract2 = await hre.ethers.getContractFactory("TestContract");
      const testContract2 = await TestContract2.deploy();
      const testContract2Address = await testContract2.getAddress();

      const selector = testContract.interface.getFunction("doNothing").selector;

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.scopeTarget(ROLE_KEY, testContract2Address);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [],
        ExecutionOptions.None,
      );

      // Function on testContractAddress is allowed
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

      // Same function on testContract2Address is NOT allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContract2Address,
            0,
            (await testContract2.doNothing.populateTransaction())
              .data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");
    });

    it("multiple roles can have different permissions on same target", async () => {
      const { roles, member, ROLE_KEY, testContractAddress, testContract } =
        await loadFixture(setup);

      const ROLE_KEY_2 = hre.ethers.id("TEST_ROLE_2");

      const selector1 =
        testContract.interface.getFunction("doNothing").selector;
      const selector2 =
        testContract.interface.getFunction("doEvenLess").selector;

      // Setup: member has ROLE_KEY, grant them both roles
      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.grantRole(member.address, ROLE_KEY_2, 0, 0, 0);

      // ROLE_KEY: only selector1 allowed
      await roles.scopeTarget(ROLE_KEY, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector1,
        [],
        ExecutionOptions.None,
      );

      // ROLE_KEY_2: only selector2 allowed
      await roles.scopeTarget(ROLE_KEY_2, testContractAddress);
      await roles.allowFunction(
        ROLE_KEY_2,
        testContractAddress,
        selector2,
        [],
        ExecutionOptions.None,
      );

      // With ROLE_KEY as default, can call selector1 but not selector2
      await roles.setDefaultRole(member.address, ROLE_KEY);

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
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doEvenLess.populateTransaction())
              .data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");

      // With ROLE_KEY_2 as default, can call selector2 but not selector1
      await roles.setDefaultRole(member.address, ROLE_KEY_2);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doNothing.populateTransaction()).data as string,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");

      // selector2 is now allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.doEvenLess.populateTransaction())
              .data as string,
            0,
          ),
      ).to.not.be.reverted;
    });
  });
});
