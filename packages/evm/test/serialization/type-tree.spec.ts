import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator } from "../utils";
import { deployRolesMod } from "../setup";

describe("TypeTree", () => {
  async function setup() {
    const [owner] = await hre.ethers.getSigners();

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
    const SELECTOR = "0x12345678";

    const allowFunction = (conditions: any[]) =>
      roles
        .connect(owner)
        .allowFunction(ROLE_KEY, TARGET, SELECTOR, conditions, 0);

    return { roles, owner, allowFunction };
  }

  describe("inspect", () => {
    describe("basic encoding types", () => {
      it.skip("returns Static encoding for Static parameter node");

      it.skip("returns Dynamic encoding for Dynamic parameter node");

      it.skip("returns Tuple encoding for Tuple parameter node");

      it.skip("returns Array encoding for Array parameter node");

      it.skip("returns AbiEncoded encoding for AbiEncoded parameter node");

      it.skip("returns EtherValue encoding for EtherValue parameter node");
    });

    describe("logical nodes (And/Or)", () => {
      it.skip("returns first child's type tree for non-variant And");

      it.skip("returns first child's type tree for non-variant Or");

      it.skip(
        "returns Dynamic encoding for variant And (children have different type trees)",
      );

      it.skip(
        "returns Dynamic encoding for variant Or (children have different type trees)",
      );
    });

    describe("array type handling", () => {
      it.skip("returns single child layout for non-variant Array");

      it.skip("returns all children layouts for variant Array");

      it.skip(
        "uses first child as template when all Array children have same type tree",
      );
    });

    describe("AbiEncoded leadingBytes", () => {
      it.skip("defaults leadingBytes to 4 when compValue is empty");

      it.skip("extracts leadingBytes from first 2 bytes of compValue");

      it.skip("handles leadingBytes = 0 correctly");

      it.skip("handles large leadingBytes values (2-byte range)");
    });

    describe("inlined detection", () => {
      it.skip("marks Static nodes as inlined");

      it.skip("marks Tuple with all inlined children as inlined");

      it.skip("marks Dynamic nodes as not inlined");

      it.skip("marks Array nodes as not inlined");

      it.skip("marks AbiEncoded nodes as not inlined");

      it.skip("marks parent as not inlined if any child is not inlined");
    });

    describe("structural children only", () => {
      it.skip("ignores non-structural children in type tree");

      it.skip("counts only structural children for layout");

      it.skip("handles mixed structural and non-structural children");
    });
  });

  describe("id", () => {
    describe("hash uniqueness", () => {
      it.skip("returns same hash for identical type trees");

      it.skip("returns different hash for different encodings");

      it.skip("returns different hash for different child structures");

      it.skip("returns different hash for different nesting depth");
    });
  });

  describe("variant detection", () => {
    describe("logical nodes", () => {
      it.skip(
        "detects And as variant when children have different type tree ids",
      );

      it.skip(
        "detects Or as variant when children have different type tree ids",
      );

      it.skip(
        "detects And as non-variant when all children have same type tree id",
      );

      it.skip(
        "detects Or as non-variant when all children have same type tree id",
      );

      it.skip("treats single-child logical nodes as non-variant");
    });

    describe("array nodes", () => {
      it.skip(
        "detects Array as variant when structural children have different type tree ids",
      );

      it.skip(
        "detects Array as non-variant when structural children have same type tree id",
      );

      it.skip("treats single-child Array as non-variant");
    });

    describe("non-variant containers", () => {
      it.skip("Tuple is never treated as variant");

      it.skip("AbiEncoded is never treated as variant");

      it.skip("Static/Dynamic leaf nodes are never variant");
    });
  });

  describe("edge cases", () => {
    it.skip("handles empty children array");

    it.skip("handles deeply nested type trees (10+ levels)");

    it.skip("handles complex mixed structures");
  });
});
