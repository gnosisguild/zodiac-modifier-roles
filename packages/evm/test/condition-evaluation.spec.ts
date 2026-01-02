import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, ZeroHash } from "ethers";

import {
  Encoding,
  Operator,
  ExecutionOptions,
  PermissionCheckerStatus,
} from "./utils";
import { deployRolesMod } from "./setup";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

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
    await roles.enableModule(member.address);

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const testContractAddress = await testContract.getAddress();

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");

    await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
    await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    return {
      roles,
      owner,
      member,
      testContract,
      testContractAddress,
      ROLE_KEY,
    };
  }

  describe("Payload overflow handling", () => {
    it("returns CalldataOverflow when calldata is too short for condition", async () => {
      const { roles, owner, member, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      // Expect two static params, but send calldata for only one
      const selector = "0x12345678";
      await roles.connect(owner).allowFunction(
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
            operator: Operator.Pass,
            compValue: "0x",
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

      // Send calldata with only one static param (32 bytes) instead of two
      const calldataShort =
        selector +
        "0000000000000000000000000000000000000000000000000000000000000001";

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldataShort, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CalldataOverflow, ZeroHash);
    });

    it("checks overflow before evaluating operator", async () => {
      const { roles, owner, member, testContractAddress, ROLE_KEY } =
        await loadFixture(setup);

      const selector = "0x12345678";
      await roles.connect(owner).allowFunction(
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
            compValue: defaultAbiCoder.encode(["uint256"], [123]),
          },
        ],
        ExecutionOptions.None,
      );

      // Send empty calldata (just selector) - would match the value if not for overflow
      const calldataEmpty = selector;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldataEmpty, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CalldataOverflow, ZeroHash);
    });
  });
});
