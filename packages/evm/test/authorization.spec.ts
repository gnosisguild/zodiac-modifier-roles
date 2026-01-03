import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroHash } from "ethers";

import {
  encodeMultisendPayload,
  Encoding,
  ExecutionOptions,
  Operator,
  PermissionCheckerStatus,
} from "./utils";
import { deployRolesMod } from "./setup";

/**
 * Authorization tests cover the Authorization.sol contract logic:
 * - Clearance validation (None, Target, Function levels)
 * - Calldata length validation
 * - ExecutionOptions enforcement (Send, DelegateCall)
 * - Transaction unwrapping via adapters
 * - Consumption tracking
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

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");

    return {
      avatar,
      roles,
      owner,
      member,
      testContract,
      testContractAddress,
      ROLE_KEY,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEARANCE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("clearance", () => {
    describe("Clearance.None", () => {
      it("reverts with TargetAddressNotAllowed when target has no clearance", async () => {
        const { roles, member, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);

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
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.allowTarget(
          ROLE_KEY,
          testContractAddress,
          [],
          ExecutionOptions.None,
        );

        // Can call any function - doNothing
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
              0,
            ),
        ).to.not.be.reverted;

        // Can call any function - oneParamStatic
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.not.be.reverted;
      });

      it("evaluates target condition regardless of which function is called", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);

        // Allow target with condition: first param must equal 100
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
                [100],
              ),
            },
          ],
          ExecutionOptions.None,
        );

        // oneParamStatic with 100 - should pass
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData(
                "oneParamStatic",
                [100],
              ),
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
              testContract.interface.encodeFunctionData("oneParamStatic", [50]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);

        // twoParamsStatic with first param 100 - should pass
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData(
                "twoParamsStatic",
                [100, 999],
              ),
              0,
            ),
        ).to.not.be.reverted;

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData(
                "twoParamsStatic",
                [200, 999],
              ),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
      });
    });

    describe("Clearance.Function", () => {
      it("allows only specifically permitted functions", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.scopeTarget(ROLE_KEY, testContractAddress);

        const doNothingSelector =
          testContract.interface.getFunction("doNothing").selector;

        await roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          doNothingSelector,
          [],
          ExecutionOptions.None,
        );

        // doNothing is allowed
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
              0,
            ),
        ).to.not.be.reverted;
      });

      it("reverts with FunctionNotAllowed for unpermitted selector", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.scopeTarget(ROLE_KEY, testContractAddress);

        const doNothingSelector =
          testContract.interface.getFunction("doNothing").selector;

        await roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          doNothingSelector,
          [],
          ExecutionOptions.None,
        );

        // doNothing is permitted
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
              0,
            ),
        ).to.not.be.reverted;

        // oneParamStatic is NOT allowed
        const oneParamStaticSelector =
          testContract.interface.getFunction("oneParamStatic").selector;

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "FunctionNotAllowed")
          .withArgs(testContractAddress, oneParamStaticSelector);
      });

      it("applies function-specific conditions", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);
        await roles.scopeTarget(ROLE_KEY, testContractAddress);

        const selector =
          testContract.interface.getFunction("oneParamStatic").selector;

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

        // Call with 42 - should pass
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
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
              testContract.interface.encodeFunctionData("oneParamStatic", [99]),
              0,
            ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
      });
    });

    describe("clearance transitions", () => {
      it("function clearance tightens previously allowed target", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);

        // First allow entire target
        await roles.allowTarget(
          ROLE_KEY,
          testContractAddress,
          [],
          ExecutionOptions.None,
        );

        // Both functions work
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
              0,
            ),
        ).to.not.be.reverted;

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.not.be.reverted;

        // Now scope target (tightens to function-level)
        await roles.scopeTarget(ROLE_KEY, testContractAddress);

        // Only allow doNothing
        const doNothingSelector =
          testContract.interface.getFunction("doNothing").selector;
        await roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          doNothingSelector,
          [],
          ExecutionOptions.None,
        );

        // doNothing still works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
              0,
            ),
        ).to.not.be.reverted;

        // oneParamStatic no longer works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");
      });

      it("target clearance loosens previously scoped target", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);

        // First scope target and only allow doNothing
        await roles.scopeTarget(ROLE_KEY, testContractAddress);
        const doNothingSelector =
          testContract.interface.getFunction("doNothing").selector;
        await roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          doNothingSelector,
          [],
          ExecutionOptions.None,
        );

        // oneParamStatic doesn't work
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.be.revertedWithCustomError(roles, "FunctionNotAllowed");

        // Now allow entire target (loosens)
        await roles.allowTarget(
          ROLE_KEY,
          testContractAddress,
          [],
          ExecutionOptions.None,
        );

        // Now oneParamStatic works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("oneParamStatic", [42]),
              0,
            ),
        ).to.not.be.reverted;
      });

      it("revokeTarget makes allowFunction permissions ineffective", async () => {
        const { roles, member, testContract, testContractAddress, ROLE_KEY } =
          await loadFixture(setup);

        await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
        await roles.setDefaultRole(member.address, ROLE_KEY);

        // Scope target and allow doNothing
        await roles.scopeTarget(ROLE_KEY, testContractAddress);
        const doNothingSelector =
          testContract.interface.getFunction("doNothing").selector;
        await roles.allowFunction(
          ROLE_KEY,
          testContractAddress,
          doNothingSelector,
          [],
          ExecutionOptions.None,
        );

        // doNothing works
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
              0,
            ),
        ).to.not.be.reverted;

        // Revoke target
        await roles.revokeTarget(ROLE_KEY, testContractAddress);

        // doNothing no longer works - target not allowed
        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(
              testContractAddress,
              0,
              testContract.interface.encodeFunctionData("doNothing"),
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
      const { roles, member, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
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
      const { roles, member, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
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
          const { roles, avatar, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
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
          const { roles, avatar, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
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
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
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
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
            ExecutionOptions.DelegateCall,
          );

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(testContractAddress, 0, "0x", 1),
          ).to.not.be.reverted;
        });

        it("allows Call regardless of DelegateCall option", async () => {
          const { roles, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
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
          const { roles, avatar, member, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.allowTarget(
            ROLE_KEY,
            testContractAddress,
            [],
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

          // DelegateCall works
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
          const {
            roles,
            avatar,
            member,
            testContract,
            testContractAddress,
            ROLE_KEY,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.scopeTarget(ROLE_KEY, testContractAddress);

          const selector =
            testContract.interface.getFunction("doNothing").selector;
          await roles.allowFunction(
            ROLE_KEY,
            testContractAddress,
            selector,
            [],
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
                testContract.interface.encodeFunctionData("doNothing"),
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
            ROLE_KEY,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.scopeTarget(ROLE_KEY, testContractAddress);

          const selector =
            testContract.interface.getFunction("doNothing").selector;
          await roles.allowFunction(
            ROLE_KEY,
            testContractAddress,
            selector,
            [],
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
                testContract.interface.encodeFunctionData("doNothing"),
                0,
              ),
          ).to.not.be.reverted;
        });
      });

      describe("DelegateCall", () => {
        it("reverts with DelegateCallNotAllowed when operation is DelegateCall and not enabled", async () => {
          const { roles, member, testContract, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.scopeTarget(ROLE_KEY, testContractAddress);

          const selector =
            testContract.interface.getFunction("doNothing").selector;
          await roles.allowFunction(
            ROLE_KEY,
            testContractAddress,
            selector,
            [],
            ExecutionOptions.None, // DelegateCall not enabled
          );

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                testContract.interface.encodeFunctionData("doNothing"),
                1,
              ), // operation=1 is DelegateCall
          )
            .to.be.revertedWithCustomError(roles, "DelegateCallNotAllowed")
            .withArgs(testContractAddress);
        });

        it("allows DelegateCall when option is enabled", async () => {
          const { roles, member, testContract, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.scopeTarget(ROLE_KEY, testContractAddress);

          const selector =
            testContract.interface.getFunction("doNothing").selector;
          await roles.allowFunction(
            ROLE_KEY,
            testContractAddress,
            selector,
            [],
            ExecutionOptions.DelegateCall,
          );

          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                testContract.interface.encodeFunctionData("doNothing"),
                1,
              ),
          ).to.not.be.reverted;
        });

        it("allows Call regardless of DelegateCall option", async () => {
          const { roles, member, testContract, testContractAddress, ROLE_KEY } =
            await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.scopeTarget(ROLE_KEY, testContractAddress);

          const selector =
            testContract.interface.getFunction("doNothing").selector;
          await roles.allowFunction(
            ROLE_KEY,
            testContractAddress,
            selector,
            [],
            ExecutionOptions.DelegateCall, // Only DelegateCall enabled
          );

          // Regular call (operation=0) should work
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                testContract.interface.encodeFunctionData("doNothing"),
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
            ROLE_KEY,
          } = await loadFixture(setup);

          await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
          await roles.setDefaultRole(member.address, ROLE_KEY);
          await roles.scopeTarget(ROLE_KEY, testContractAddress);

          const selector =
            testContract.interface.getFunction("doNothing").selector;
          await roles.allowFunction(
            ROLE_KEY,
            testContractAddress,
            selector,
            [],
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
                testContract.interface.encodeFunctionData("doNothing"),
                0,
              ),
          ).to.not.be.reverted;

          // DelegateCall works
          await expect(
            roles
              .connect(member)
              .execTransactionFromModule(
                testContractAddress,
                0,
                testContract.interface.encodeFunctionData("doNothing"),
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
      const { roles, member, testContract, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);

      // Allow the inner target
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
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
          data: testContract.interface.encodeFunctionData("doNothing"),
        },
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: testContract.interface.encodeFunctionData(
            "oneParamStatic",
            [42],
          ),
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
      const { roles, member, ROLE_KEY } = await loadFixture(setup);

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);

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
      const { roles, member, testContract, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      // Deploy multisend and unwrapper
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const unwrapper = await MultiSendUnwrapper.deploy();
      const unwrapperAddress = await unwrapper.getAddress();

      // Deploy a second test contract that won't be allowed
      const TestContract2 = await hre.ethers.getContractFactory("TestContract");
      const testContract2 = await TestContract2.deploy();
      const testContract2Address = await testContract2.getAddress();

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);

      // Only allow the first target
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
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
          data: testContract.interface.encodeFunctionData("doNothing"),
        },
        {
          to: testContract2Address, // Not allowed!
          value: 0,
          operation: 0,
          data: testContract2.interface.encodeFunctionData("doNothing"),
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
        .withArgs(testContract2Address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSUMPTION TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("consumption tracking", () => {
    it("succeeds without allowance consumption when no WithinAllowance used", async () => {
      const { roles, member, testContract, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.allowTarget(
        ROLE_KEY,
        testContractAddress,
        [],
        ExecutionOptions.None,
      );

      // Execute without any allowance conditions - no ConsumeAllowance event
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.not.emit(roles, "ConsumeAllowance");
    });

    it("persists consumption after successful execution", async () => {
      const { roles, member, testContract, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);

      // Set allowance with balance 1000
      await roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
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
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      // Execute with param 100 - should consume 100 from allowance
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            testContract.interface.encodeFunctionData("oneParamStatic", [100]),
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
      const { roles, member, testContract, testContractAddress, ROLE_KEY } =
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

      await roles.grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.setDefaultRole(member.address, ROLE_KEY);
      await roles.scopeTarget(ROLE_KEY, testContractAddress);

      // Set allowance with balance 1000
      await roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
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
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
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
          data: testContract.interface.encodeFunctionData(
            "oneParamStatic",
            [100],
          ),
        },
        {
          to: testContractAddress,
          value: 0,
          operation: 0,
          data: testContract.interface.encodeFunctionData(
            "oneParamStatic",
            [200],
          ),
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
