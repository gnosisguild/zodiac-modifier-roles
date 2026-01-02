import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator } from "../utils";
import { deployRolesMod } from "../setup";

describe("Topology", () => {
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

  describe("childBounds", () => {
    describe("childStart", () => {
      it.skip("returns first direct child index when children exist");

      it.skip("returns 0 when node has no children");

      it.skip("correctly identifies first child among many siblings");
    });

    describe("childCount", () => {
      it.skip("returns 0 for leaf nodes");

      it.skip("returns correct count for single child");

      it.skip("returns correct count for multiple children");

      it.skip("counts both structural and non-structural children");

      it.skip("only counts direct children, not grandchildren");
    });

    describe("sChildCount (structural child count)", () => {
      it.skip("returns 0 when no structural children");

      it.skip("returns correct count for all structural children");

      it.skip("correctly excludes non-structural children from count");

      it.skip("handles mixed structural and non-structural children");
    });

    describe("BFS traversal assumptions", () => {
      it.skip("stops searching when parent index exceeds current index");

      it.skip("correctly handles deeply nested structures");

      it.skip("handles sibling groups at same level");
    });
  });

  describe("isStructural", () => {
    describe("direct structural nodes", () => {
      it.skip("returns true for Static encoding");

      it.skip("returns true for Dynamic encoding");

      it.skip("returns true for Tuple encoding");

      it.skip("returns true for Array encoding");

      it.skip("returns true for AbiEncoded encoding");
    });

    describe("non-structural nodes", () => {
      it.skip("returns false for None encoding with no structural descendants");

      it.skip("returns false for EtherValue encoding (always leaf)");
    });

    describe("structural by descent", () => {
      it.skip("returns true for None encoding if any descendant is structural");

      it.skip(
        "returns true for logical node (And/Or) with structural children",
      );

      it.skip("checks recursively through all descendants");
    });

    describe("edge cases", () => {
      it.skip("handles deeply nested structural descendants");

      it.skip("correctly stops at sibling boundaries");

      it.skip("handles empty children");
    });
  });
});
