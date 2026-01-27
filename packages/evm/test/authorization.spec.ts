import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { hexlify, Interface, randomBytes, ZeroHash } from "ethers";

import {
  encodeMultisendPayload,
  Encoding,
  ExecutionOptions,
  Operator,
  ConditionViolationStatus,
  packConditions,
} from "./utils";
import { deployRolesMod } from "./setup";

const iface = new Interface([
  "function doNothing()",
  "function oneParamStatic(uint256)",
  "function twoParamsStatic(uint256, uint256)",
]);

/**
 * Authorization tests
 *
 * Scope: Transaction Permission Validation.
 *
 * This file tests the logic that determines if a transaction is permissible:
 * - Clearance Levels: Verifying access at Target and Function levels.
 * - Condition Enforcement: Validating transaction parameters against defined constraints.
 * - Execution Options: Enforcing restrictions on Call, DelegateCall, and Send operations.
 * - Transaction Unwrapping: Validating nested transactions via adapters (e.g., MultiSend).
 */

describe("Authorization", () => {
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

    const roleKey = hexlify(randomBytes(32));

    return {
      avatar,
      roles,
      owner,
      member,
      testContract,
      testContractAddress,
      roleKey,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEARANCE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("clearance", () => {
    describe("Clearance.None", () => {
      it("reverts with TargetAddressNotAllowed when target has no clearance", async () => {
        const { roles, member, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);

        // No allowTarget/scopeTarget called - target has no clearance

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, "0x", 0),
        )
          .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
          .withArgs(testContractAddress);
      });
    });

    describe("Clearance.Target", () => {
      it("allows any function on target with target-level clearance", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);
        await roles.allowTarget(
          roleKey,
          testContractAddress,
          "0x",
          ExecutionOptions.None,
        );

        // Can call any function - doNothing
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.emit(testContract, "Invoked")
          .withArgs(iface.getFunction("doNothing")!.selector);

        // Can call any function - oneParamStatic
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.not.be.reverted;
      });

      it("evaluates target condition regardless of which function is called", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);

        // Allow target with condition: first param must equal 100
        const conditionsEq100 = await packConditions(roles, [
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
              [100],
            ),
          },
        ]);
        await roles.allowTarget(
          roleKey,
          testContractAddress,
          conditionsEq100,
          ExecutionOptions.None,
        );

        // oneParamStatic with 100 - should pass
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [100]),
              0,
            ),
        ).to.not.be.reverted;

        // oneParamStatic with 50 - should fail
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [50]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(
            ConditionViolationStatus.ParameterNotAllowed,
            1, // EqualTo node
            anyValue,
          );

        // twoParamsStatic with first param 100 - should pass
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("twoParamsStatic", [100, 999]),
              0,
            ),
        ).to.not.be.reverted;

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("twoParamsStatic", [200, 999]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(
            ConditionViolationStatus.ParameterNotAllowed,
            1, // EqualTo node
            anyValue,
          );
      });
    });

    describe("Clearance.Function", () => {
      it("allows only specifically permitted functions", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);
        await roles.scopeTarget(roleKey, testContractAddress);

        const doNothingSelector = iface.getFunction("doNothing")!.selector;

        await roles.allowFunction(
          roleKey,
          testContractAddress,
          doNothingSelector,
          "0x",
          ExecutionOptions.None,
        );

        // doNothing is allowed
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.emit(testContract, "Invoked")
          .withArgs(iface.getFunction("doNothing")!.selector);
      });

      it("reverts with FunctionNotAllowed for unpermitted selector", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);
        await roles.scopeTarget(roleKey, testContractAddress);

        const doNothingSelector = iface.getFunction("doNothing")!.selector;

        await roles.allowFunction(
          roleKey,
          testContractAddress,
          doNothingSelector,
          "0x",
          ExecutionOptions.None,
        );

        // doNothing is permitted
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.emit(testContract, "Invoked")
          .withArgs(iface.getFunction("doNothing")!.selector);

        // oneParamStatic is NOT allowed
        const oneParamStaticSelector =
          iface.getFunction("oneParamStatic")!.selector;

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "FunctionNotAllowed")
          .withArgs(testContractAddress, oneParamStaticSelector);
      });

      it("applies function-specific conditions", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);
        await roles.scopeTarget(roleKey, testContractAddress);

        const selector = iface.getFunction("oneParamStatic")!.selector;

        // Allow with condition: param must equal 42
        const conditionsEq42 = await packConditions(roles, [
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
        ]);
        await roles.allowFunction(
          roleKey,
          testContractAddress,
          selector,
          conditionsEq42,
          ExecutionOptions.None,
        );

        // Call with 42 - should pass
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
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
              iface.encodeFunctionData("oneParamStatic", [99]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(
            ConditionViolationStatus.ParameterNotAllowed,
            1, // EqualTo node
            anyValue,
          );
      });
    });

    describe("clearance transitions", () => {
      it("function clearance tightens previously allowed target", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);

        // First allow entire target
        await roles.allowTarget(
          roleKey,
          testContractAddress,
          "0x",
          ExecutionOptions.None,
        );

        // Both functions work
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.emit(testContract, "Invoked")
          .withArgs(iface.getFunction("doNothing")!.selector);

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.not.be.reverted;

        // Now scope target (tightens to function-level)
        await roles.scopeTarget(roleKey, testContractAddress);

        // Only allow doNothing
        const doNothingSelector = iface.getFunction("doNothing")!.selector;
        await roles.allowFunction(
          roleKey,
          testContractAddress,
          doNothingSelector,
          "0x",
          ExecutionOptions.None,
        );

        // doNothing still works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.emit(testContract, "Invoked")
          .withArgs(doNothingSelector);

        // oneParamStatic no longer works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");
      });

      it("target clearance loosens previously scoped target", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);

        // First scope target and only allow doNothing
        await roles.scopeTarget(roleKey, testContractAddress);
        const doNothingSelector = iface.getFunction("doNothing")!.selector;
        await roles.allowFunction(
          roleKey,
          testContractAddress,
          doNothingSelector,
          "0x",
          ExecutionOptions.None,
        );

        // oneParamStatic doesn't work
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");

        // Now allow entire target (loosens)
        await roles.allowTarget(
          roleKey,
          testContractAddress,
          "0x",
          ExecutionOptions.None,
        );

        // Now oneParamStatic works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.not.be.reverted;
      });

      it("revokeTarget makes allowFunction permissions ineffective", async () => {
        const { roles, member, testContract, testContractAddress, roleKey } =
          await loadFixture(setup);

        await roles.grantRole(member.address, roleKey, 0, 0, 0);
        await roles.setDefaultRole(member.address, roleKey);

        // Scope target and allow doNothing
        await roles.scopeTarget(roleKey, testContractAddress);
        const doNothingSelector = iface.getFunction("doNothing")!.selector;
        await roles.allowFunction(
          roleKey,
          testContractAddress,
          doNothingSelector,
          "0x",
          ExecutionOptions.None,
        );

        // doNothing works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.emit(testContract, "Invoked")
          .withArgs(iface.getFunction("doNothing")!.selector);

        // Revoke target
        await roles.revokeTarget(roleKey, testContractAddress);

        // doNothing no longer works - target not allowed
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              iface.encodeFunctionData("doNothing"),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
          .withArgs(testContractAddress);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLDATA VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("calldata validation", () => {
    it("allows empty calldata (0 bytes)", async () => {
      const { roles, member, testContract, testContractAddress, roleKey } =
        await loadFixture(setup);

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);
      await roles.allowTarget(
        roleKey,
        testContractAddress,
        "0x",
        ExecutionOptions.None,
      );

      // Empty calldata (0 bytes) is allowed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;
    });

    it("reverts with FunctionSignatureTooShort for 1-3 bytes", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setup);

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);
      await roles.allowTarget(
        roleKey,
        testContractAddress,
        "0x",
        ExecutionOptions.None,
      );

      // 1 byte - too short
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x12", 0),
      ).to.be.revertedWithCustomError(roles, "FunctionSignatureTooShort");

      // 2 bytes - too short
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x1234", 0),
      ).to.be.revertedWithCustomError(roles, "FunctionSignatureTooShort");

      // 3 bytes - too short
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x123456", 0),
      ).to.be.revertedWithCustomError(roles, "FunctionSignatureTooShort");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTION OPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("ExecutionOptions", () => {
    describe("Clearance.Target", () => {
      describe("Send", () => {
        it("reverts with SendNotAllowed when value > 0 and Send not enabled", async () => {
          const { roles, avatar, member, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.allowTarget(
            roleKey,
            testContractAddress,
            "0x",
            ExecutionOptions.None, // Send not enabled
          );

          // Fund the avatar
          const [owner] = await hre.ethers.getSigners();
          await owner.sendTransaction({
            to: await avatar.getAddress(),
            value: hre.ethers.parseEther("1"),
          });

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                hre.ethers.parseEther("0.1"),
                "0x",
                0,
              ),
          )
            .to.be.revertedWithCustomError(roles, "SendNotAllowed")
            .withArgs(testContractAddress);
        });

        it("allows value transfer when Send is enabled", async () => {
          const {
            roles,
            avatar,
            member,
            testContract,
            testContractAddress,
            roleKey,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.allowTarget(
            roleKey,
            testContractAddress,
            "0x",
            ExecutionOptions.Send,
          );

          // Fund the avatar
          const [owner] = await hre.ethers.getSigners();
          await owner.sendTransaction({
            to: await avatar.getAddress(),
            value: hre.ethers.parseEther("1"),
          });

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                hre.ethers.parseEther("0.1"),
                "0x",
                0,
              ),
          ).to.not.be.reverted;
        });
      });

      describe("DelegateCall", () => {
        it("reverts with DelegateCallNotAllowed when operation is DelegateCall and not enabled", async () => {
          const { roles, member, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.allowTarget(
            roleKey,
            testContractAddress,
            "0x",
            ExecutionOptions.None, // DelegateCall not enabled
          );

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 1), // operation=1 is DelegateCall
          )
            .to.be.revertedWithCustomError(roles, "DelegateCallNotAllowed")
            .withArgs(testContractAddress);
        });

        it("allows DelegateCall when option is enabled", async () => {
          const { roles, member, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.allowTarget(
            roleKey,
            testContractAddress,
            "0x",
            ExecutionOptions.DelegateCall,
          );

          // DelegateCall executes in avatar's context, so we can't verify testContract events
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 1),
          ).to.not.be.reverted;
        });

        it("allows Call regardless of DelegateCall option", async () => {
          const { roles, member, testContract, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.allowTarget(
            roleKey,
            testContractAddress,
            "0x",
            ExecutionOptions.DelegateCall, // Only DelegateCall enabled, not Send
          );

          // Regular call (operation=0) should work
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 0),
          ).to.not.be.reverted;
        });
      });

      describe("Both", () => {
        it("allows Send and DelegateCall when Both is enabled", async () => {
          const {
            roles,
            avatar,
            member,
            testContract,
            testContractAddress,
            roleKey,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.allowTarget(
            roleKey,
            testContractAddress,
            "0x",
            ExecutionOptions.Both,
          );

          // Fund the avatar
          const [owner] = await hre.ethers.getSigners();
          await owner.sendTransaction({
            to: await avatar.getAddress(),
            value: hre.ethers.parseEther("1"),
          });

          // Send with value works
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                hre.ethers.parseEther("0.1"),
                "0x",
                0,
              ),
          ).to.not.be.reverted;

          // DelegateCall works (executes in avatar's context, so we can't verify testContract events)
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 1),
          ).to.not.be.reverted;
        });
      });
    });

    describe("Clearance.Function", () => {
      describe("Send", () => {
        it("reverts with SendNotAllowed when value > 0 and Send not enabled", async () => {
          const { roles, avatar, member, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.scopeTarget(roleKey, testContractAddress);

          const selector = iface.getFunction("doNothing")!.selector;
          await roles.allowFunction(
            roleKey,
            testContractAddress,
            selector,
            "0x",
            ExecutionOptions.None, // Send not enabled
          );

          // Fund the avatar
          const [owner] = await hre.ethers.getSigners();
          await owner.sendTransaction({
            to: await avatar.getAddress(),
            value: hre.ethers.parseEther("1"),
          });

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                hre.ethers.parseEther("0.1"),
                iface.encodeFunctionData("doNothing"),
                0,
              ),
          )
            .to.be.revertedWithCustomError(roles, "SendNotAllowed")
            .withArgs(testContractAddress);
        });

        it("allows value transfer when Send is enabled", async () => {
          const {
            roles,
            avatar,
            member,
            testContract,
            testContractAddress,
            roleKey,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.scopeTarget(roleKey, testContractAddress);

          const selector = iface.getFunction("doNothing")!.selector;
          await roles.allowFunction(
            roleKey,
            testContractAddress,
            selector,
            "0x",
            ExecutionOptions.Send,
          );

          // Fund the avatar
          const [owner] = await hre.ethers.getSigners();
          await owner.sendTransaction({
            to: await avatar.getAddress(),
            value: hre.ethers.parseEther("1"),
          });

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                hre.ethers.parseEther("0.1"),
                iface.encodeFunctionData("doNothing"),
                0,
              ),
          ).to.not.be.reverted;
        });
      });

      describe("DelegateCall", () => {
        it("reverts with DelegateCallNotAllowed when operation is DelegateCall and not enabled", async () => {
          const { roles, member, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.scopeTarget(roleKey, testContractAddress);

          const selector = iface.getFunction("doNothing")!.selector;
          await roles.allowFunction(
            roleKey,
            testContractAddress,
            selector,
            "0x",
            ExecutionOptions.None, // DelegateCall not enabled
          );

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                iface.encodeFunctionData("doNothing"),
                1,
              ), // operation=1 is DelegateCall
          )
            .to.be.revertedWithCustomError(roles, "DelegateCallNotAllowed")
            .withArgs(testContractAddress);
        });

        it("allows DelegateCall when option is enabled", async () => {
          const { roles, member, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.scopeTarget(roleKey, testContractAddress);

          const selector = iface.getFunction("doNothing")!.selector;
          await roles.allowFunction(
            roleKey,
            testContractAddress,
            selector,
            "0x",
            ExecutionOptions.DelegateCall,
          );

          // DelegateCall executes in avatar's context, so we can't verify testContract events
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                iface.encodeFunctionData("doNothing"),
                1,
              ),
          ).to.not.be.reverted;
        });

        it("allows Call regardless of DelegateCall option", async () => {
          const { roles, member, testContract, testContractAddress, roleKey } =
            await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.scopeTarget(roleKey, testContractAddress);

          const selector = iface.getFunction("doNothing")!.selector;
          await roles.allowFunction(
            roleKey,
            testContractAddress,
            selector,
            "0x",
            ExecutionOptions.DelegateCall, // Only DelegateCall enabled
          );

          // Regular call (operation=0) should work
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                iface.encodeFunctionData("doNothing"),
                0,
              ),
          ).to.not.be.reverted;
        });
      });

      describe("Both", () => {
        it("allows Send and DelegateCall when Both is enabled", async () => {
          const {
            roles,
            avatar,
            member,
            testContract,
            testContractAddress,
            roleKey,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, roleKey, 0, 0, 0);
          await roles.setDefaultRole(member.address, roleKey);
          await roles.scopeTarget(roleKey, testContractAddress);

          const selector = iface.getFunction("doNothing")!.selector;
          await roles.allowFunction(
            roleKey,
            testContractAddress,
            selector,
            "0x",
            ExecutionOptions.Both,
          );

          // Fund the avatar
          const [owner] = await hre.ethers.getSigners();
          await owner.sendTransaction({
            to: await avatar.getAddress(),
            value: hre.ethers.parseEther("1"),
          });

          // Send with value works
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                hre.ethers.parseEther("0.1"),
                iface.encodeFunctionData("doNothing"),
                0,
              ),
          )
            .to.emit(testContract, "Invoked")
            .withArgs(selector);

          // DelegateCall works (executes in avatar's context, so we can't verify testContract events)
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                iface.encodeFunctionData("doNothing"),
                1,
              ),
          ).to.not.be.reverted;
        });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTION UNWRAPPING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("transaction unwrapping", () => {
    it("unwraps and authorizes batch transactions via adapter", async () => {
      const { roles, member, testContract, testContractAddress, roleKey } =
        await loadFixture(setup);

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);

      // Allow the inner target
      await roles.allowTarget(
        roleKey,
        testContractAddress,
        "0x",
        ExecutionOptions.None,
      );

      // Register the unwrapper for multiSend selector
      const multiSendSelector =
        multisend.interface.getFunction("multiSend").selector;
      await roles.setTransactionUnwrapper(
        multisendAddress,
        multiSendSelector,
        unwrapperAddress,
      );

      // Encode batch of two transactions
      const payload = encodeMultisendPayload([
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: iface.encodeFunctionData("doNothing"),
        },
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: iface.encodeFunctionData("oneParamStatic", [42]),
        },
      ]);

      const multisendData = multisend.interface.encodeFunctionData(
        "multiSend",
        [payload],
      );

      // Execute via multisend - should unwrap and authorize each inner tx
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(multisendAddress, 0, multisendData, 1), // DelegateCall
      ).to.not.be.reverted;
    });

    it("reverts with MalformedMultiEntrypoint when unwrapper fails", async () => {
      const { roles, member, roleKey } = await loadFixture(setup);

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);

      // Register the unwrapper
      const multiSendSelector =
        multisend.interface.getFunction("multiSend").selector;
      await roles.setTransactionUnwrapper(
        multisendAddress,
        multiSendSelector,
        unwrapperAddress,
      );

      // Malformed payload - empty multisend
      const malformedData = multisend.interface.encodeFunctionData(
        "multiSend",
        ["0x"],
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(multisendAddress, 0, malformedData, 1),
      ).to.be.revertedWithCustomError(roles, "MalformedMultiEntrypoint");
    });

    it("reverts if any unwrapped transaction is unauthorized", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setup);

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      // Deploy a second target that won't be allowed
      const TestContract2 = await hre.ethers.getContractFactory("TestContract");
      const testContract2 = await TestContract2.deploy();
      const target2Address = await testContract2.getAddress();

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);

      // Only allow the first target
      await roles.allowTarget(
        roleKey,
        testContractAddress,
        "0x",
        ExecutionOptions.None,
      );

      // Register the unwrapper
      const multiSendSelector =
        multisend.interface.getFunction("multiSend").selector;
      await roles.setTransactionUnwrapper(
        multisendAddress,
        multiSendSelector,
        unwrapperAddress,
      );

      // Batch with first tx allowed, second tx NOT allowed
      const payload = encodeMultisendPayload([
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: iface.encodeFunctionData("doNothing"),
        },
        {
          to: target2Address, // Not allowed!
          value: 0,
          operation: 0,
          data: iface.encodeFunctionData("doNothing"),
        },
      ]);

      const multisendData = multisend.interface.encodeFunctionData(
        "multiSend",
        [payload],
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(multisendAddress, 0, multisendData, 1),
      )
        .to.be.revertedWithCustomError(roles, "TargetAddressNotAllowed")
        .withArgs(target2Address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSUMPTION TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("consumption tracking", () => {
    it("succeeds without allowance consumption when no WithinAllowance used", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setup);

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);
      await roles.allowTarget(
        roleKey,
        testContractAddress,
        "0x",
        ExecutionOptions.None,
      );

      // Execute without any allowance conditions - no ConsumeAllowance event
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.not.emit(roles, "ConsumeAllowance");
    });

    it("persists consumption after successful execution", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);
      await roles.scopeTarget(roleKey, testContractAddress);

      // Set allowance with balance 1000
      await roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

      const selector = iface.getFunction("oneParamStatic")!.selector;
      const conditionsWithAllowance = await packConditions(roles, [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.WithinAllowance,
          compValue: ALLOWANCE_KEY,
        },
      ]);
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        selector,
        conditionsWithAllowance,
        ExecutionOptions.None,
      );

      // Execute with param 100 - should consume 100 from allowance
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData("oneParamStatic", [100]),
            0,
          ),
      )
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(ALLOWANCE_KEY, 100, 900);

      // Verify balance was persisted
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(900);
    });

    it("aggregates consumptions across multiple calls in batch", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      await roles.grantRole(member.address, roleKey, 0, 0, 0);
      await roles.setDefaultRole(member.address, roleKey);
      await roles.scopeTarget(roleKey, testContractAddress);

      // Set allowance with balance 1000
      await roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

      const selector = iface.getFunction("oneParamStatic")!.selector;
      const conditionsWithAllowance = await packConditions(roles, [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.WithinAllowance,
          compValue: ALLOWANCE_KEY,
        },
      ]);
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        selector,
        conditionsWithAllowance,
        ExecutionOptions.None,
      );

      // Register the unwrapper
      const multiSendSelector =
        multisend.interface.getFunction("multiSend").selector;
      await roles.setTransactionUnwrapper(
        multisendAddress,
        multiSendSelector,
        unwrapperAddress,
      );

      // Batch of two transactions, each consuming from same allowance
      const payload = encodeMultisendPayload([
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: iface.encodeFunctionData("oneParamStatic", [100]),
        },
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: iface.encodeFunctionData("oneParamStatic", [200]),
        },
      ]);

      const multisendData = multisend.interface.encodeFunctionData(
        "multiSend",
        [payload],
      );

      // Consumptions are aggregated: 100 + 200 = 300
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(multisendAddress, 0, multisendData, 1),
      )
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(ALLOWANCE_KEY, 300, 700);

      // Verify final balance
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(700);
    });
  });
});
