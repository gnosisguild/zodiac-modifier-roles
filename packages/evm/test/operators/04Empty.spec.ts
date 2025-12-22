import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, randomBytes, hexlify, parseEther, ZeroHash } from "ethers";
import hre from "hardhat";

import { deployRolesMod } from "../setup";

import {
  ExecutionOptions,
  Operator,
  Encoding,
  PermissionCheckerStatus,
  flattenCondition,
} from "../utils";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

function randomBytes32(): string {
  return hexlify(randomBytes(32));
}

async function setup() {
  const [owner, member] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

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

  // Fund the avatar for value transfer tests
  await owner.sendTransaction({
    to: avatarAddress,
    value: parseEther("10"),
  });

  return { owner, member, roles, testContract, avatar, roleKey };
}

describe("Operator - Empty", async () => {
  describe("Empty as standalone root condition", () => {
    it("passes when calldata is empty", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: "0x",
          },
        ],
        ExecutionOptions.Both,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;
    });

    it("fails when calldata contains a function selector", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: "0x",
          },
        ],
        ExecutionOptions.Both,
      );

      const doNothingData =
        testContract.interface.encodeFunctionData("doNothing");

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, doNothingData, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CalldataNotEmpty, ZeroHash);
    });

    it("fails when calldata contains arbitrary bytes", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: "0x",
          },
        ],
        ExecutionOptions.Both,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0xdeadbeef", 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CalldataNotEmpty, ZeroHash);
    });

    it("passes with empty calldata and value transfer", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: "0x",
          },
        ],
        ExecutionOptions.Send,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            "0x",
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  describe("Empty combined with CallWithinAllowance", () => {
    it("passes when calldata is empty and allowance available", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(allowanceKey, 2, 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // First two calls pass
      await roles
        .connect(member)
        .execTransactionFromModule(testContractAddress, 0, "0x", 0);
      await roles
        .connect(member)
        .execTransactionFromModule(testContractAddress, 0, "0x", 0);

      // Third call fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });

    it("fails when calldata is not empty even with allowance available", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0xdeadbeef", 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CalldataNotEmpty, ZeroHash);

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;
    });
  });

  describe("Empty combined with Ether WithinAllowance", () => {
    it("passes when calldata is empty and ether allowance available", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey = randomBytes32();

      await roles
        .connect(owner)
        .setAllowance(allowanceKey, parseEther("5"), 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            "0x",
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when ether value exceeds allowance", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey = randomBytes32();

      await roles
        .connect(owner)
        .setAllowance(allowanceKey, parseEther("1"), 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("2"),
            "0x",
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
    });

    it("fails when calldata is not empty even with ether allowance", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey = randomBytes32();

      await roles
        .connect(owner)
        .setAllowance(allowanceKey, parseEther("10"), 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            "0xdeadbeef",
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CalldataNotEmpty, ZeroHash);
    });
  });

  describe("Empty with both CallWithinAllowance and Ether WithinAllowance", () => {
    it("passes when all conditions are satisfied", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const callAllowanceKey = randomBytes32();
      const etherAllowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(callAllowanceKey, 5, 0, 0, 0, 0);
      await roles
        .connect(owner)
        .setAllowance(etherAllowanceKey, parseEther("5"), 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: callAllowanceKey,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.WithinAllowance,
              compValue: etherAllowanceKey,
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            "0x",
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when call allowance is exhausted", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const callAllowanceKey = randomBytes32();
      const etherAllowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(callAllowanceKey, 1, 0, 0, 0, 0);
      await roles
        .connect(owner)
        .setAllowance(etherAllowanceKey, parseEther("10"), 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: callAllowanceKey,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.WithinAllowance,
              compValue: etherAllowanceKey,
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      // First call passes
      await roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          parseEther("1"),
          "0x",
          0,
        );

      // Second call fails due to call allowance
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            "0x",
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.CallAllowanceExceeded,
          callAllowanceKey,
        );
    });

    it("fails when ether allowance is exhausted", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const callAllowanceKey = randomBytes32();
      const etherAllowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(callAllowanceKey, 10, 0, 0, 0, 0);
      await roles
        .connect(owner)
        .setAllowance(etherAllowanceKey, parseEther("1"), 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: callAllowanceKey,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.WithinAllowance,
              compValue: etherAllowanceKey,
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("2"),
            "0x",
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, etherAllowanceKey);
    });
  });

  describe("Empty inside Or (alternative branches)", () => {
    it("passes when Empty branch matches (empty calldata)", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const SELECTOR =
        testContract.interface.getFunction("oneParamStatic").selector;

      // Scope function with Or: either param == 42 OR Empty calldata
      // (structural children must come before non-structural)
      await roles.connect(owner).scopeTarget(roleKey, testContractAddress);
      await roles.connect(owner).allowFunction(
        roleKey,
        testContractAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [42]),
                },
              ],
            },
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Calling with param == 42 passes via Matches branch
      const calldata = testContract.interface.encodeFunctionData(
        "oneParamStatic",
        [42],
      );
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0),
      ).to.not.be.reverted;

      // Calling with param != 42 fails (Matches fails, Empty fails because calldata not empty)
      const badCalldata = testContract.interface.encodeFunctionData(
        "oneParamStatic",
        [100],
      );
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, badCalldata, 0),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");
    });

    it("passes when non-Empty branch matches (non-empty calldata)", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(allowanceKey, 10, 0, 0, 0, 0);

      // Either empty calldata OR calldata with call allowance
      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Non-empty calldata passes via CallWithinAllowance branch
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0xdeadbeef", 0),
      ).to.not.be.reverted;
    });
  });

  describe("Non-structural condition trees (no type tree)", () => {
    it("deeply nested non-structural tree (Or containing And)", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const callAllowanceKey = randomBytes32();
      const etherAllowanceKey = randomBytes32();

      await roles.connect(owner).setAllowance(callAllowanceKey, 10, 0, 0, 0, 0);
      await roles
        .connect(owner)
        .setAllowance(etherAllowanceKey, parseEther("5"), 0, 0, 0, 0);

      // Or(Empty, And(CallWithinAllowance, EtherValue.WithinAllowance))
      await roles.connect(owner).allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Or,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Empty,
            },
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: callAllowanceKey,
                },
                {
                  paramType: Encoding.EtherValue,
                  operator: Operator.WithinAllowance,
                  compValue: etherAllowanceKey,
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      // Empty calldata passes via Empty branch
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;

      // Non-empty calldata with value passes via And branch
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            "0xdeadbeef",
            0,
          ),
      ).to.not.be.reverted;
    });
  });
});
