import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator, ExecutionOptions } from "./utils";
import { deployRolesMod } from "./setup";

describe("OnlyOwner", () => {
  async function setup() {
    const [owner, nonOwner] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");
    const TARGET = "0x000000000000000000000000000000000000000f";

    return { roles, owner, nonOwner, ROLE_KEY, TARGET };
  }

  describe("Role membership functions", () => {
    describe("grantRole", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("revokeRole", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("assignRoles", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("setDefaultRole", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });
  });

  describe("Target permission functions", () => {
    describe("allowTarget", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("scopeTarget", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("revokeTarget", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });
  });

  describe("Function permission functions", () => {
    describe("allowFunction", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("revokeFunction", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });
  });

  describe("Allowance functions", () => {
    describe("setAllowance", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });

    describe("updateAllowance", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });
  });

  describe("Adapter functions", () => {
    describe("setTransactionUnwrapper", () => {
      it.skip("succeeds when called by owner");

      it.skip(
        "reverts 'Ownable: caller is not the owner' when called by non-owner",
      );
    });
  });

  describe("Module functions (inherited from Modifier)", () => {
    describe("enableModule", () => {
      it.skip("succeeds when called by owner");

      it.skip("reverts when called by non-owner");
    });

    describe("disableModule", () => {
      it.skip("succeeds when called by owner");

      it.skip("reverts when called by non-owner");
    });
  });

  describe("Ownership functions (inherited from Ownable)", () => {
    describe("transferOwnership", () => {
      it.skip("succeeds when called by owner");

      it.skip("reverts when called by non-owner");

      it.skip("updates owner after transfer");
    });

    describe("renounceOwnership", () => {
      it.skip("succeeds when called by owner");

      it.skip("reverts when called by non-owner");

      it.skip("sets owner to zero address");
    });
  });

  describe("Non-restricted functions", () => {
    describe("renounceRole", () => {
      it.skip("can be called by anyone (self-revoke)");

      it.skip("does not require owner permission");
    });
  });
});
