import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Interface } from "ethers";

import { Encoding, ExecutionOptions, Operator } from "./utils";
import { deployRolesMod } from "./setup";

const iface = new Interface([
  "function fnThatMaybeReverts(uint256, bool) returns (uint256)",
]);

/**
 * Execution Mechanics tests
 *
 * Scope: Transaction Execution Lifecycle.
 *
 * This file verifies the behavior of the module's execution entry points:
 * - Return Values: Ensuring success/failure flags and return data are propagated correctly.
 * - Error Handling: Verifying that failed inner transactions result in the expected outcome (revert vs. success=false).
 * - State Persistence: Confirming that side-effects (e.g., allowance consumption) are committed on success and discarded on failure.
 *
 * Covers `execTransactionFromModule`, `execTransactionWithRole`, and their `ReturnData` variants.
 */

describe("Execution Mechanics", () => {
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

    // Invoker must be a module to call execTransactionFromModule*
    await roles.enableModule(invoker.address);

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const testContractAddress = await testContract.getAddress();

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");
    const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

    // Grant role
    await roles.grantRole(invoker.address, ROLE_KEY, 0, 0, 0);

    // Set as default role (for FromModule calls)
    await roles.setDefaultRole(invoker.address, ROLE_KEY);

    // Set initial allowance: 1000
    await roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

    // Scope target
    await roles.scopeTarget(ROLE_KEY, testContractAddress);

    // Allow the test function: fnThatMaybeReverts(uint256, bool)
    // We attach a WithinAllowance condition to track consumption.
    await roles.allowFunction(
      ROLE_KEY,
      testContractAddress,
      iface.getFunction("fnThatMaybeReverts")!.selector,
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
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ],
      ExecutionOptions.None,
    );

    return {
      roles,
      owner,
      invoker,
      testContractAddress,
      ROLE_KEY,
      ALLOWANCE_KEY,
    };
  }

  describe("execTransactionFromModule", () => {
    it("returns success=true and persists consumption on successful execution", async () => {
      const { roles, invoker, testContractAddress, ALLOWANCE_KEY } =
        await loadFixture(setup);

      // Consumes 100
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);

      const success = await roles
        .connect(invoker)
        .execTransactionFromModule.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
        );

      expect(success).to.be.true;

      await roles
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, calldata, 0);

      // Verify persistence: 1000 - 100 = 900
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(900);
    });

    it("returns success=false and does not persist consumption on failed inner execution", async () => {
      const { roles, invoker, testContractAddress, ALLOWANCE_KEY } =
        await loadFixture(setup);

      // Consumes 100 but reverts
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);

      const success = await roles
        .connect(invoker)
        .execTransactionFromModule.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
        );

      expect(success).to.be.false;

      await roles
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, calldata, 0);

      // Verify rollback: 1000 (unchanged)
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });
  });

  describe("execTransactionFromModuleReturnData", () => {
    it("returns success=true and persists consumption on successful execution", async () => {
      const { roles, invoker, testContractAddress, ALLOWANCE_KEY } =
        await loadFixture(setup);

      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);

      const [success] = await roles
        .connect(invoker)
        .execTransactionFromModuleReturnData.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
        );

      expect(success).to.be.true;

      await roles
        .connect(invoker)
        .execTransactionFromModuleReturnData(
          testContractAddress,
          0,
          calldata,
          0,
        );

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(900);
    });

    it("returns success=false and does not persist consumption on failed inner execution", async () => {
      const { roles, invoker, testContractAddress, ALLOWANCE_KEY } =
        await loadFixture(setup);

      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);

      const [success] = await roles
        .connect(invoker)
        .execTransactionFromModuleReturnData.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
        );

      expect(success).to.be.false;

      await roles
        .connect(invoker)
        .execTransactionFromModuleReturnData(
          testContractAddress,
          0,
          calldata,
          0,
        );

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });
  });

  describe("execTransactionWithRole", () => {
    it("succeeds and persists consumption when using correct role", async () => {
      const { roles, invoker, testContractAddress, ROLE_KEY, ALLOWANCE_KEY } =
        await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);

      const success = await roles
        .connect(invoker)
        .execTransactionWithRole.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      expect(success).to.be.true;

      await roles
        .connect(invoker)
        .execTransactionWithRole(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(900);
    });

    it("reverts when using unassigned role", async () => {
      const { roles, invoker, testContractAddress } = await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);
      const BAD_ROLE = hre.ethers.id("BAD_ROLE");

      await expect(
        roles
          .connect(invoker)
          .execTransactionWithRole(
            testContractAddress,
            0,
            calldata,
            0,
            BAD_ROLE,
            false,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });

    it("returns success=false and does not persist consumption when inner fail and shouldRevert=false", async () => {
      const { roles, invoker, testContractAddress, ROLE_KEY, ALLOWANCE_KEY } =
        await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);

      const success = await roles
        .connect(invoker)
        .execTransactionWithRole.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      expect(success).to.be.false;

      await roles
        .connect(invoker)
        .execTransactionWithRole(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });

    it("reverts and does not persist consumption when inner fail and shouldRevert=true", async () => {
      const { roles, invoker, testContractAddress, ROLE_KEY, ALLOWANCE_KEY } =
        await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);

      await expect(
        roles
          .connect(invoker)
          .execTransactionWithRole(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            true,
          ),
      ).to.be.reverted;

      // Reverts bubble up, so state should be rolled back naturally (implicit in EVM, but good to check if we catch it)
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });
  });

  describe("execTransactionWithRoleReturnData", () => {
    it("returns data and persists consumption on success", async () => {
      const { roles, invoker, testContractAddress, ROLE_KEY, ALLOWANCE_KEY } =
        await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);

      const [success] = await roles
        .connect(invoker)
        .execTransactionWithRoleReturnData.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      expect(success).to.be.true;

      await roles
        .connect(invoker)
        .execTransactionWithRoleReturnData(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(900);
    });

    it("returns success=false and does not persist consumption when inner fail and shouldRevert=false", async () => {
      const { roles, invoker, testContractAddress, ROLE_KEY, ALLOWANCE_KEY } =
        await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);

      const [success] = await roles
        .connect(invoker)
        .execTransactionWithRoleReturnData.staticCall(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      expect(success).to.be.false;

      await roles
        .connect(invoker)
        .execTransactionWithRoleReturnData(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
        );

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });

    it("reverts and does not persist consumption when inner fail and shouldRevert=true", async () => {
      const { roles, invoker, testContractAddress, ROLE_KEY, ALLOWANCE_KEY } =
        await loadFixture(setup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);

      await expect(
        roles
          .connect(invoker)
          .execTransactionWithRoleReturnData(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            true,
          ),
      ).to.be.reverted;

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });
  });
});
