import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator, ExecutionOptions } from "./utils";
import { deployRolesMod } from "./setup";

/**
 * ConditionEvaluation tests cover infrastructure that is NOT tested by individual operators:
 * - Payload handling (__input, overflow detection)
 * - Context propagation
 *
 * NOTE: Most evaluation behavior is tested in operators/*.spec.ts:
 * - And/Or traversal, short-circuiting, variant payloads → operators/01And.spec.ts, 02Or.spec.ts
 * - Matches child iteration → operators/05Matches.spec.ts
 * - Array iteration → operators/06ArraySome.spec.ts, 07ArrayEvery.spec.ts, 08ArrayTailMatches.spec.ts
 * - Consumption tracking → operators/28WithinAllowance.spec.ts, 30CallWithinAllowance.spec.ts
 */
describe("ConditionEvaluation", () => {
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

    await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
    await roles
      .connect(owner)
      .scopeTarget(ROLE_KEY, await testContract.getAddress());

    return { roles, owner, member, testContract, ROLE_KEY };
  }

  describe("Payload overflow handling", () => {
    it.skip("returns CalldataOverflow when payload.overflow is true");

    it.skip("includes overflow location in result info");

    it.skip("checks overflow before evaluating operator");
  });

  describe("__input value extraction", () => {
    it.skip("returns context.value when payload.size == 0 (EtherValue)");

    it.skip("reads 32 bytes directly when payload.size == 32");

    it.skip("right-aligns when payload.size < 32");

    it.skip("returns keccak256 hash when payload.size > 32");
  });
});
