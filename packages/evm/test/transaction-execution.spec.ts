import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator, ExecutionOptions } from "./utils";
import { deployRolesMod } from "./setup";

describe("TransactionExecution", () => {
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

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");

    await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);

    return { roles, owner, member, other, testContract, avatar, ROLE_KEY };
  }

  describe("execTransactionFromModule", () => {
    it.skip("uses caller's default role");

    it.skip("calls avatar's execTransactionFromModule");

    it.skip("returns success boolean");

    it.skip("requires caller to be enabled module");
  });

  describe("execTransactionFromModuleReturnData", () => {
    it.skip("uses caller's default role");

    it.skip("returns both success and return data");

    it.skip("forwards return data from target call");
  });

  describe("execTransactionWithRole", () => {
    it.skip("uses specified roleKey instead of default");

    it.skip("succeeds when roleKey has valid membership");

    it.skip("reverts NoMembership when roleKey membership doesn't exist");

    describe("shouldRevert parameter", () => {
      it.skip("returns false on inner failure when shouldRevert = false");

      it.skip(
        "reverts ModuleTransactionFailed on inner failure when shouldRevert = true",
      );
    });

    describe("persistence on success", () => {
      it.skip("persists allowance consumption on success");

      it.skip("persists membership decrement on success");

      it.skip("does not persist on inner failure (success = false)");
    });
  });

  describe("execTransactionWithRoleReturnData", () => {
    it.skip("uses specified roleKey");

    it.skip("returns success and return data");

    it.skip("respects shouldRevert parameter");
  });

  describe("Reentrancy protection", () => {
    it.skip("reverts Reentrancy when exec is called during exec");

    it.skip("protects execTransactionWithRole");

    it.skip("protects execTransactionWithRoleReturnData");

    it.skip("allows sequential calls after completion");
  });

  describe("Permission checking (Clearance.None)", () => {
    it.skip("fails with TargetAddressNotAllowed when target has no clearance");

    it.skip("applies to all functions on target");
  });

  describe("Permission checking (Clearance.Target)", () => {
    it.skip("allows any function on target");

    it.skip("applies target-level conditions to all calls");

    it.skip("respects target-level ExecutionOptions");
  });

  describe("Permission checking (Clearance.Function)", () => {
    it.skip("allows only explicitly permitted functions");

    it.skip("fails with FunctionNotAllowed for non-permitted functions");

    it.skip("applies function-level conditions");

    it.skip("respects function-level ExecutionOptions");
  });

  describe("ExecutionOptions enforcement", () => {
    describe("value (send)", () => {
      it.skip("allows send when ExecutionOptions includes Send");

      it.skip("fails with SendNotAllowed when value > 0 and Send not allowed");

      it.skip("allows zero value regardless of ExecutionOptions");
    });

    describe("operation (delegatecall)", () => {
      it.skip(
        "allows delegatecall when ExecutionOptions includes DelegateCall",
      );

      it.skip(
        "fails with DelegateCallNotAllowed when delegatecall not allowed",
      );

      it.skip("allows Call operation regardless of ExecutionOptions");
    });

    describe("ExecutionOptions.Both", () => {
      it.skip("allows both send and delegatecall");
    });

    describe("ExecutionOptions.None", () => {
      it.skip("disallows send and delegatecall");
    });
  });

  describe("Function signature validation", () => {
    it.skip("allows empty calldata (length = 0)");

    it.skip("reverts FunctionSignatureTooShort when 0 < length < 4");

    it.skip("allows calldata with length >= 4");
  });

  describe("Transaction bundles (unwrapping)", () => {
    describe("adapter detection", () => {
      it.skip("checks unwrappers mapping for target + selector");

      it.skip("proceeds with single transaction if no adapter");

      it.skip("calls adapter.unwrap when adapter is set");
    });

    describe("bundle processing", () => {
      it.skip("authorizes each unwrapped transaction individually");

      it.skip("fails on first unauthorized transaction in bundle");

      it.skip("accumulates consumptions across all transactions");
    });

    describe("MalformedMultiEntrypoint", () => {
      it.skip("reverts when unwrap reverts");

      it.skip("catches adapter errors gracefully");
    });
  });

  describe("Condition evaluation during execution", () => {
    it.skip("evaluates condition tree from scopeConfig");

    it.skip("fails with ConditionViolation on condition failure");

    it.skip("includes status in ConditionViolation error");

    it.skip("includes info in ConditionViolation error");
  });

  describe("Return data handling", () => {
    it.skip("forwards return data from successful calls");

    it.skip("returns empty data on failure (when shouldRevert = false)");

    it.skip("does not return data on revert");
  });

  describe("Avatar interaction", () => {
    it.skip("forwards call to avatar.execTransactionFromModule");

    it.skip("forwards value parameter");

    it.skip("forwards operation parameter");

    it.skip("uses target as destination");
  });

  describe("Edge cases", () => {
    it.skip("handles empty calldata with Clearance.Target");

    it.skip("handles maximum value (max uint256)");
  });

  describe("Event emissions", () => {
    it.skip("emits UpdateRole when membership usesLeft decrements");

    it.skip("emits RevokeRole when membership usesLeft reaches 0");

    it.skip("emits ConsumeAllowance for each allowance consumed");
  });
});
