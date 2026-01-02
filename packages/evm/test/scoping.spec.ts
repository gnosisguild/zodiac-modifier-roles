import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator, ExecutionOptions } from "./utils";
import { deployRolesMod } from "./setup";

describe("Scoping", () => {
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

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");
    const TARGET = await testContract.getAddress();

    return { roles, owner, member, testContract, ROLE_KEY, TARGET };
  }

  describe("allowTarget", () => {
    describe("basic functionality", () => {
      it.skip("sets clearance to Target for address");

      it.skip("stores scopeConfig with wildcard selector");

      it.skip("emits AllowTarget event with correct parameters");
    });

    describe("conditions parameter", () => {
      it.skip("stores empty conditions as single Pass node");

      it.skip("stores provided conditions after integrity check");

      it.skip("reverts with integrity error for invalid conditions");
    });

    describe("ExecutionOptions", () => {
      it.skip("stores ExecutionOptions.None (no send, no delegatecall)");

      it.skip("stores ExecutionOptions.Send (send allowed)");

      it.skip("stores ExecutionOptions.DelegateCall (delegatecall allowed)");

      it.skip("stores ExecutionOptions.Both (send and delegatecall allowed)");
    });

    describe("overwriting", () => {
      it.skip("overwrites existing target permission");

      it.skip("can change conditions for existing target");

      it.skip("can change ExecutionOptions for existing target");
    });
  });

  describe("scopeTarget", () => {
    it.skip("sets clearance to Function for address");

    it.skip("emits ScopeTarget event");

    it.skip(
      "does not store any scopeConfig (functions must be explicitly allowed)",
    );

    it.skip("can transition from Target clearance to Function clearance");
  });

  describe("revokeTarget", () => {
    it.skip("sets clearance to None for address");

    it.skip("emits RevokeTarget event");

    it.skip("succeeds even if target was not allowed");

    it.skip("does not clear function-level scopeConfig entries");
  });

  describe("allowFunction", () => {
    describe("basic functionality", () => {
      it.skip("stores scopeConfig for target + selector combination");

      it.skip("emits AllowFunction event with correct parameters");

      it.skip("computes storage key from target address and selector");
    });

    describe("conditions parameter", () => {
      it.skip("stores empty conditions as single Pass node");

      it.skip("stores provided conditions after integrity check");

      it.skip("reverts with integrity error for invalid conditions");
    });

    describe("ExecutionOptions", () => {
      it.skip("stores ExecutionOptions.None");

      it.skip("stores ExecutionOptions.Send");

      it.skip("stores ExecutionOptions.DelegateCall");

      it.skip("stores ExecutionOptions.Both");
    });

    describe("overwriting", () => {
      it.skip("overwrites existing function permission");

      it.skip("can change conditions for existing function");

      it.skip("can change ExecutionOptions for existing function");
    });

    describe("interaction with clearance levels", () => {
      it.skip(
        "requires Function clearance on target for function-level checks",
      );

      it.skip("function scopeConfig ignored when target has Target clearance");
    });
  });

  describe("revokeFunction", () => {
    it.skip("deletes scopeConfig for target + selector");

    it.skip("emits RevokeFunction event");

    it.skip("succeeds even if function was not allowed");

    it.skip("does not affect other functions on same target");
  });

  describe("Clearance levels", () => {
    describe("Clearance.None", () => {
      it.skip("blocks all transactions to target");

      it.skip("is the default for all addresses");
    });

    describe("Clearance.Target", () => {
      it.skip("allows all functions on target");

      it.skip("applies target-level scopeConfig to all calls");

      it.skip("respects target-level ExecutionOptions");
    });

    describe("Clearance.Function", () => {
      it.skip("only allows explicitly permitted functions");

      it.skip("applies function-level scopeConfig per selector");

      it.skip("respects function-level ExecutionOptions");

      it.skip("blocks functions not in scopeConfig");
    });
  });

  describe("scopeConfig packing", () => {
    it.skip("packs ExecutionOptions in upper 96 bits");

    it.skip("packs condition pointer in lower 160 bits");

    it.skip("returns 0 for non-existent scopeConfig");
  });

  describe("Key computation", () => {
    describe("target key (wildcard)", () => {
      it.skip("computes key as address | 0xFFFFFFFFFFFFFFFFFFFFFFFF");

      it.skip("wildcard key is unique per target address");
    });

    describe("function key", () => {
      it.skip("computes key as address | (selector >> 160)");

      it.skip("function key is unique per target + selector combination");
    });
  });

  describe("Edge cases", () => {
    it.skip("handles zero address as target");

    it.skip("handles zero selector");

    it.skip("handles very large condition trees");

    it.skip("handles multiple roles with different permissions on same target");
  });
});
