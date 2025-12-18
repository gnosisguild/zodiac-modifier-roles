import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { randomBytes, hexlify, ZeroHash, AbiCoder } from "ethers";
import hre from "hardhat";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import { deployRolesMod } from "../setup";

import {
  ExecutionOptions,
  Operator,
  Encoding,
  PermissionCheckerStatus,
  flattenCondition,
} from "../utils";

function randomBytes32(): string {
  return hexlify(randomBytes(32));
}

async function setup() {
  const [owner, member] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContractWithFallback = await hre.ethers.getContractFactory(
    "TestContractWithFallback",
  );
  const fallbackContract = await TestContractWithFallback.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const avatarAddress = await avatar.getAddress();
  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatarAddress,
    avatarAddress,
  );

  const roleKey = randomBytes32();

  await roles.connect(owner).enableModule(member.address);
  await roles.connect(owner).grantRole(member.address, roleKey, 0, 0, 0);
  await roles.connect(owner).setDefaultRole(member.address, roleKey);

  return {
    owner,
    member,
    roles,
    fallbackContract,
    testContract,
    avatar,
    roleKey,
  };
}

describe("AbiEncoded Match Leading Bytes", () => {
  describe("Scenario 1: Top level AbiEncoded, leadingBytes=4", () => {
    it("matches 4 bytes at position 4", async () => {
      const { owner, member, roles, fallbackContract, roleKey } =
        await loadFixture(setup);

      const targetAddress = await fallbackContract.getAddress();

      // leadingBytes=4, match 4 bytes starting at byte 4
      // compValue: 0x0004 (leadingBytes) + deadbeef (4 match bytes)
      await roles.connect(owner).allowTarget(
        roleKey,
        targetAddress,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0004" + "deadbeef",
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Calldata: deadbeef (4 leading bytes) + param (value=1)
      const goodCalldata =
        "0x" +
        "deadbeef" +
        "0000000000000000000000000000000000000000000000000000000000000001";

      // Wrong leading bytes (correct param)
      const badLeadingBytes =
        "0x" +
        "cafebabe" +
        "0000000000000000000000000000000000000000000000000000000000000001";

      // Correct leading bytes, wrong param
      const badParam =
        "0x" +
        "deadbeef" +
        "0000000000000000000000000000000000000000000000000000000000000099";

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, goodCalldata, 0),
      ).to.not.be.reverted;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, badLeadingBytes, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.LeadingBytesNotAMatch, ZeroHash);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, badParam, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    });

    it("matches with multiple children", async () => {
      const { owner, member, roles, fallbackContract, roleKey } =
        await loadFixture(setup);

      const targetAddress = await fallbackContract.getAddress();

      await roles.connect(owner).allowTarget(
        roleKey,
        targetAddress,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0004" + "deadbeef",
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [2]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Calldata: deadbeef (4 leading bytes) + two params (values 1, 2)
      const calldata =
        "0x" +
        "deadbeef" +
        "0000000000000000000000000000000000000000000000000000000000000001" +
        "0000000000000000000000000000000000000000000000000000000000000002";

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, calldata, 0),
      ).to.not.be.reverted;
    });
  });

  describe("Scenario 2: Top level AbiEncoded, leadingBytes=32", () => {
    it("matches 32 bytes at position 32", async () => {
      const { owner, member, roles, fallbackContract, roleKey } =
        await loadFixture(setup);

      const targetAddress = await fallbackContract.getAddress();

      // leadingBytes=32, match 32 bytes starting at byte 32
      const matchBytes =
        "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
      await roles.connect(owner).allowTarget(
        roleKey,
        targetAddress,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0020" + matchBytes,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Calldata: matchBytes (32 leading bytes) + param (value=1)
      const param =
        "0000000000000000000000000000000000000000000000000000000000000001";
      const goodCalldata = "0x" + matchBytes + param;

      // Wrong leading bytes (correct param)
      const wrongBytes =
        "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
      const badLeadingBytes = "0x" + wrongBytes + param;

      // Correct leading bytes, wrong param
      const badParam =
        "0x" +
        matchBytes +
        "0000000000000000000000000000000000000000000000000000000000000099";

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, goodCalldata, 0),
      ).to.not.be.reverted;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, badLeadingBytes, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.LeadingBytesNotAMatch, ZeroHash);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, badParam, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    });

    it("matches with multiple children", async () => {
      const { owner, member, roles, fallbackContract, roleKey } =
        await loadFixture(setup);

      const targetAddress = await fallbackContract.getAddress();

      const matchBytes =
        "00000000000000000000000000000000000000000000000000000000000000ff";
      await roles.connect(owner).allowTarget(
        roleKey,
        targetAddress,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0020" + matchBytes,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [1]),
            },
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [2]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Calldata: matchBytes (32 leading bytes) + two params (values 1, 2)
      const param1 =
        "0000000000000000000000000000000000000000000000000000000000000001";
      const param2 =
        "0000000000000000000000000000000000000000000000000000000000000002";
      const calldata = "0x" + matchBytes + param1 + param2;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, calldata, 0),
      ).to.not.be.reverted;
    });
  });

  describe("Scenario 3: Nested AbiEncoded in dynamic bytes param", () => {
    it("dynamic bytes interpreted as AbiEncoded, leadingBytes=4", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const targetAddress = await testContract.getAddress();

      const SELECTOR = testContract.interface.getFunction("dynamic").selector;

      await roles.connect(owner).scopeTarget(roleKey, targetAddress);
      await roles.connect(owner).scopeFunction(
        roleKey,
        targetAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0004" + "deadbeef",
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [66]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Inner data: deadbeef (4 leading bytes) + param (value=66=0x42)
      const innerData =
        "0x" +
        "deadbeef" +
        "0000000000000000000000000000000000000000000000000000000000000042";

      // Wrong leading bytes (correct param)
      const badLeadingBytesInner =
        "0x" +
        "cafebabe" +
        "0000000000000000000000000000000000000000000000000000000000000042";

      // Correct leading bytes, wrong param
      const badParamInner =
        "0x" +
        "deadbeef" +
        "0000000000000000000000000000000000000000000000000000000000000099";

      const calldata = testContract.interface.encodeFunctionData("dynamic", [
        innerData,
      ]);
      const badLeadingBytesCalldata = testContract.interface.encodeFunctionData(
        "dynamic",
        [badLeadingBytesInner],
      );
      const badParamCalldata = testContract.interface.encodeFunctionData(
        "dynamic",
        [badParamInner],
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, calldata, 0),
      ).to.not.be.reverted;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            targetAddress,
            0,
            badLeadingBytesCalldata,
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.LeadingBytesNotAMatch, ZeroHash);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, badParamCalldata, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    });

    it("dynamic bytes interpreted as AbiEncoded, leadingBytes=32", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const targetAddress = await testContract.getAddress();

      const SELECTOR = testContract.interface.getFunction("dynamic").selector;

      const matchBytes =
        "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

      await roles.connect(owner).scopeTarget(roleKey, targetAddress);
      await roles.connect(owner).scopeFunction(
        roleKey,
        targetAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0020" + matchBytes,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [66]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Inner data: matchBytes (32 leading bytes) + param (value=66=0x42)
      const param =
        "0000000000000000000000000000000000000000000000000000000000000042";
      const innerData = "0x" + matchBytes + param;

      // Wrong leading bytes (correct param)
      const wrongBytes =
        "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
      const badLeadingBytesInner = "0x" + wrongBytes + param;

      // Correct leading bytes, wrong param
      const badParamInner =
        "0x" +
        matchBytes +
        "0000000000000000000000000000000000000000000000000000000000000099";

      const calldata = testContract.interface.encodeFunctionData("dynamic", [
        innerData,
      ]);
      const badLeadingBytesCalldata = testContract.interface.encodeFunctionData(
        "dynamic",
        [badLeadingBytesInner],
      );
      const badParamCalldata = testContract.interface.encodeFunctionData(
        "dynamic",
        [badParamInner],
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, calldata, 0),
      ).to.not.be.reverted;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            targetAddress,
            0,
            badLeadingBytesCalldata,
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.LeadingBytesNotAMatch, ZeroHash);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(targetAddress, 0, badParamCalldata, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    });
  });
});
