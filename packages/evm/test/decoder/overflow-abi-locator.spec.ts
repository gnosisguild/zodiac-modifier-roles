/**
 * AbiLocator - Bounds & Overflow Tests
 */
import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, hexlify, randomBytes } from "ethers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import { deployRolesMod } from "../setup";
import {
  Encoding,
  flattenCondition,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  packConditions,
} from "../utils";

// ============================================================================
// Setup
// ============================================================================

async function setupRoles() {
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

  await roles.enableModule(invoker.address);

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();
  const testContractAddress = await testContract.getAddress();

  const ROLE_KEY = hexlify(randomBytes(32));

  await roles.grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
  await roles.setDefaultRole(invoker.address, ROLE_KEY);

  return { roles, owner, invoker, testContractAddress, ROLE_KEY };
}

async function allowTarget(
  fixture: Awaited<ReturnType<typeof setupRoles>>,
  conditions: ReturnType<typeof flattenCondition>,
) {
  const { roles, testContractAddress, ROLE_KEY } = fixture;
  const packed = await packConditions(roles, conditions);
  return roles.allowTarget(
    ROLE_KEY,
    testContractAddress,
    packed,
    ExecutionOptions.None,
  );
}

async function invoke(
  fixture: Awaited<ReturnType<typeof setupRoles>>,
  calldata: string,
) {
  const { roles, invoker, testContractAddress } = fixture;
  return roles
    .connect(invoker)
    .execTransactionFromModule(testContractAddress, 0, calldata, 0);
}

// ============================================================================
// Tests
// ============================================================================

describe("AbiLocator - Bounds & Overflow", () => {
  describe("Head Bounds", () => {
    it("should detect calldata shorter than 32 bytes", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: encode(["uint256"], [0]),
            },
          ],
        }),
      );

      // 4-byte selector + 31 zero bytes — one byte short of a full 32-byte slot
      const calldata =
        "0xaabbccdd" +
        "00000000000000000000000000000000000000000000000000000000000000"; // 31 bytes

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });

    it("should detect truncated head pointer slot", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
        }),
      );

      // 4-byte selector + 31 zero bytes — dynamic param needs a 32-byte head
      // pointer slot, but only 31 bytes available
      const calldata =
        "0xaabbccdd" +
        "00000000000000000000000000000000000000000000000000000000000000"; // 31 bytes

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });

    it("should accept exactly 32 bytes for static param", async () => {
      const fixture = await loadFixture(setupRoles);

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
        }),
      );

      // 4-byte selector + exactly one 32-byte slot — just enough for one static param
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000000"; // slot 0: value = 0

      await expect(invoke(fixture, calldata)).to.not.be.reverted;
    });

    it("should detect truncated second dynamic pointer", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
            { paramType: Encoding.Dynamic, operator: Operator.Pass },
          ],
        }),
      );

      // 4-byte selector + 48 bytes (1.5 slots)
      // Two dynamic params need two 32-byte head pointer slots, second is truncated
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000000" + // slot 0: ptr0
        "00000000000000000000000000000000"; //          ptr1 truncated (16 bytes)

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });
  });

  describe("Tail Bounds", () => {
    it("should detect offset beyond calldata length", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.EqualTo,
              compValue: encode(["bytes"], ["0x00"]),
            },
          ],
        }),
      );

      // Head pointer says tail is at offset 64, but calldata only has 32 bytes
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000040"; // slot 0: offset = 64 (out of bounds)

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });

    it("should detect declared length exceeding available bytes", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.EqualTo,
              compValue: encode(["bytes"], ["0xaabb"]),
            },
          ],
        }),
      );

      // Offset points to slot 1, which declares length = 64 bytes,
      // but only one 32-byte slot of data follows
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // slot 0: offset = 32
        "0000000000000000000000000000000000000000000000000000000000000040" + // slot 1: length = 64
        "0000000000000000000000000000000000000000000000000000000000000000"; // slot 2: 32 bytes of data (need 64)

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });

    it("should detect ceil32(length) exceeding bounds", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.EqualTo,
              compValue: encode(["bytes"], ["0x00"]),
            },
          ],
        }),
      );

      // Length = 33 bytes, ceil32(33) = 64, but only 32 bytes of payload follow
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // slot 0: offset = 32
        "0000000000000000000000000000000000000000000000000000000000000021" + // slot 1: length = 33
        "0000000000000000000000000000000000000000000000000000000000000000"; // slot 2: 32 bytes (ceil32(33) = 64 needed)

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });

    it("should accept exact padding alignment", async () => {
      const fixture = await loadFixture(setupRoles);

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [{ paramType: Encoding.Dynamic, operator: Operator.Pass }],
        }),
      );

      // Length = 5, ceil32(5) = 32, and exactly 32 bytes of payload follow
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // slot 0: offset = 32
        "0000000000000000000000000000000000000000000000000000000000000005" + // slot 1: length = 5
        "aabbccddee000000000000000000000000000000000000000000000000000000"; // slot 2: 5 bytes data + 27 bytes padding (exact fit)

      await expect(invoke(fixture, calldata)).to.not.be.reverted;
    });

    it("should detect partial tail slot", async () => {
      const fixture = await loadFixture(setupRoles);
      const { roles } = fixture;

      await allowTarget(
        fixture,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.EqualTo,
              compValue: encode(["bytes"], ["0x00"]),
            },
          ],
        }),
      );

      // Offset points to slot 1, but only 16 bytes follow —
      // can't even read the 32-byte length slot at the tail
      const calldata =
        "0xaabbccdd" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // slot 0: offset = 32
        "00000000000000000000000000000000"; //          16 bytes — length slot truncated

      await expect(invoke(fixture, calldata))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataOverflow,
          anyValue,
          anyValue,
        );
    });
  });
});

function encode(types: string[], values: unknown[]) {
  return AbiCoder.defaultAbiCoder().encode(types, values);
}
