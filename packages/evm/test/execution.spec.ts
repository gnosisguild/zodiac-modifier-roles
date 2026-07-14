import { expect } from "chai";
import { Interface, TypedDataEncoder } from "ethers";
import { network } from "hardhat";

import {
  Encoding,
  ExecutionOptions,
  Operator,
  packConditions,
} from "./utils.js";
import { createSetup } from "./setup.js";

const connection = await network.create();
const { ethers, networkHelpers } = connection;
const { loadFixture } = networkHelpers;
const { deployRolesMod } = createSetup(connection);

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
  after(async () => {
    await connection.close();
  });

  async function setup() {
    const [owner, invoker] = await ethers.getSigners();

    const Avatar = await ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    // Invoker must be a module to call execTransactionFromModule*
    await roles.enableModule(invoker.address);

    const TestContract = await ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const testContractAddress = await testContract.getAddress();

    const ROLE_KEY = ethers.id("TEST_ROLE");
    const ALLOWANCE_KEY = ethers.id("TEST_ALLOWANCE");

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
    const packed = await packConditions(roles, [
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
    ]);
    await roles.allowFunction(
      ROLE_KEY,
      testContractAddress,
      iface.getFunction("fnThatMaybeReverts")!.selector,
      packed,
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
      const BAD_ROLE = ethers.id("BAD_ROLE");

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
      ).to.be.revert(ethers);

      // Reverts bubble up, so state should be rolled back naturally (implicit in EVM, but good to check if we catch it)
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(1000);
    });
  });

  describe("execTransactionWithSignature", () => {
    async function signedSetup() {
      const fixture = await setup();
      const [, , relayer] = await ethers.getSigners();
      return { ...fixture, relayer };
    }

    const buildDomain = async (roles: any) => ({
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await roles.getAddress(),
    });

    const roleTxTypes = {
      RoleTx: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "roleKey", type: "bytes32" },
        { name: "shouldRevert", type: "bool" },
        { name: "salt", type: "bytes32" },
      ],
    };

    it("executes when the call is signed by an enabled module", async () => {
      const {
        roles,
        invoker,
        relayer,
        testContractAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(signedSetup);

      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);
      const salt = ethers.id("salt-1");

      const signature = await invoker.signTypedData(
        await buildDomain(roles),
        roleTxTypes,
        {
          to: testContractAddress,
          value: 0,
          data: calldata,
          operation: 0,
          roleKey: ROLE_KEY,
          shouldRevert: false,
          salt,
        },
      );

      const expectedHash = TypedDataEncoder.hash(
        await buildDomain(roles),
        roleTxTypes,
        {
          to: testContractAddress,
          value: 0,
          data: calldata,
          operation: 0,
          roleKey: ROLE_KEY,
          shouldRevert: false,
          salt,
        },
      );
      await expect(
        roles
          .connect(relayer)
          .execTransactionWithSignature(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            false,
            salt,
            signature,
          ),
      )
        .to.emit(roles, "HashExecuted")
        .withArgs(expectedHash);

      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(900);
    });

    it("reverts NotAuthorized when signer is not an enabled module", async () => {
      const { roles, relayer, testContractAddress, ROLE_KEY } =
        await loadFixture(signedSetup);

      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);
      const salt = ethers.id("salt-stranger");

      // relayer is not enabled as a module — sign with relayer ⇒ signer is not a module
      const signature = await relayer.signTypedData(
        await buildDomain(roles),
        roleTxTypes,
        {
          to: testContractAddress,
          value: 0,
          data: calldata,
          operation: 0,
          roleKey: ROLE_KEY,
          shouldRevert: false,
          salt,
        },
      );

      await expect(
        roles
          .connect(relayer)
          .execTransactionWithSignature(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            false,
            salt,
            signature,
          ),
      ).to.be.revertedWithCustomError(roles, "NotAuthorized");
    });

    it("reverts HashAlreadyConsumed when the same signature is replayed", async () => {
      const { roles, invoker, relayer, testContractAddress, ROLE_KEY } =
        await loadFixture(signedSetup);

      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);
      const salt = ethers.id("salt-replay");

      const signature = await invoker.signTypedData(
        await buildDomain(roles),
        roleTxTypes,
        {
          to: testContractAddress,
          value: 0,
          data: calldata,
          operation: 0,
          roleKey: ROLE_KEY,
          shouldRevert: false,
          salt,
        },
      );

      await roles
        .connect(relayer)
        .execTransactionWithSignature(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
          salt,
          signature,
        );

      await expect(
        roles
          .connect(relayer)
          .execTransactionWithSignature(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            false,
            salt,
            signature,
          ),
      ).to.be.revertedWithCustomError(roles, "HashAlreadyConsumed");
    });

    it("rejects routing a signature through another authorized role", async () => {
      const { roles, invoker, relayer, testContractAddress, ROLE_KEY } =
        await loadFixture(signedSetup);
      const otherRoleKey = ethers.id("OTHER_ROLE");
      await roles.grantRole(invoker.address, otherRoleKey, 0, 0, 0);
      await roles.allowTarget(
        otherRoleKey,
        testContractAddress,
        "0x",
        ExecutionOptions.None,
      );

      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);
      const salt = ethers.id("salt-role-substitution");
      const signature = await invoker.signTypedData(
        await buildDomain(roles),
        roleTxTypes,
        {
          to: testContractAddress,
          value: 0,
          data: calldata,
          operation: 0,
          roleKey: ROLE_KEY,
          shouldRevert: false,
          salt,
        },
      );

      await expect(
        roles
          .connect(relayer)
          .execTransactionWithSignature(
            testContractAddress,
            0,
            calldata,
            0,
            otherRoleKey,
            false,
            salt,
            signature,
          ),
      ).to.be.revertedWithCustomError(roles, "NotAuthorized");

      await roles
        .connect(relayer)
        .execTransactionWithSignature(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
          salt,
          signature,
        );
    });

    it("rejects changing shouldRevert after signing", async () => {
      const { roles, invoker, relayer, testContractAddress, ROLE_KEY } =
        await loadFixture(signedSetup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        false,
      ]);
      const salt = ethers.id("salt-should-revert-substitution");
      const signature = await invoker.signTypedData(
        await buildDomain(roles),
        roleTxTypes,
        {
          to: testContractAddress,
          value: 0,
          data: calldata,
          operation: 0,
          roleKey: ROLE_KEY,
          shouldRevert: false,
          salt,
        },
      );

      await expect(
        roles
          .connect(relayer)
          .execTransactionWithSignature(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            true,
            salt,
            signature,
          ),
      ).to.be.revertedWithCustomError(roles, "NotAuthorized");

      await roles
        .connect(relayer)
        .execTransactionWithSignature(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
          salt,
          signature,
        );
    });

    it("applies the signed failure and consumption policy", async () => {
      const { roles, invoker, relayer, testContractAddress, ROLE_KEY } =
        await loadFixture(signedSetup);
      const calldata = iface.encodeFunctionData("fnThatMaybeReverts", [
        100,
        true,
      ]);
      const domain = await buildDomain(roles);

      const nonRevertingSalt = ethers.id("salt-failure-non-reverting");
      const nonRevertingMessage = {
        to: testContractAddress,
        value: 0,
        data: calldata,
        operation: 0,
        roleKey: ROLE_KEY,
        shouldRevert: false,
        salt: nonRevertingSalt,
      };
      const nonRevertingHash = TypedDataEncoder.hash(
        domain,
        roleTxTypes,
        nonRevertingMessage,
      );
      const nonRevertingSignature = await invoker.signTypedData(
        domain,
        roleTxTypes,
        nonRevertingMessage,
      );

      await roles
        .connect(relayer)
        .execTransactionWithSignature(
          testContractAddress,
          0,
          calldata,
          0,
          ROLE_KEY,
          false,
          nonRevertingSalt,
          nonRevertingSignature,
        );
      expect(await roles.consumed(invoker.address, nonRevertingHash)).to.equal(
        true,
      );

      const revertingSalt = ethers.id("salt-failure-reverting");
      const revertingMessage = {
        ...nonRevertingMessage,
        shouldRevert: true,
        salt: revertingSalt,
      };
      const revertingHash = TypedDataEncoder.hash(
        domain,
        roleTxTypes,
        revertingMessage,
      );
      const revertingSignature = await invoker.signTypedData(
        domain,
        roleTxTypes,
        revertingMessage,
      );

      await expect(
        roles
          .connect(relayer)
          .execTransactionWithSignature(
            testContractAddress,
            0,
            calldata,
            0,
            ROLE_KEY,
            true,
            revertingSalt,
            revertingSignature,
          ),
      ).to.be.revertedWithCustomError(roles, "ModuleTransactionFailed");
      expect(await roles.consumed(invoker.address, revertingHash)).to.equal(
        false,
      );
    });
  });
});
