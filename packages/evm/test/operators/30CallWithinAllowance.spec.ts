import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder, BigNumberish, ZeroHash } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  Encoding,
  Operator,
  ExecutionOptions,
  PermissionCheckerStatus,
  flattenCondition,
} from "../utils";
import { deployRolesMod } from "../setup";

const ROLE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("Operator - CallWithinAllowance", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();
    const avatarAddress = await avatar.getAddress();
    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );
    await roles.enableModule(invoker.address);

    async function setAllowance({
      key,
      balance,
      maxRefill,
      refill,
      period,
      timestamp,
    }: {
      key: string;
      balance: BigNumberish;
      maxRefill?: BigNumberish;
      refill: BigNumberish;
      period: BigNumberish;
      timestamp: BigNumberish;
    }) {
      await roles
        .connect(owner)
        .setAllowance(key, balance, maxRefill || 0, refill, period, timestamp);
    }
    const testContractAddress = await testContract.getAddress();
    await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
    await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    const SELECTOR = testContract.interface.getFunction("doNothing").selector;
    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    await roles.connect(owner).allowFunction(
      ROLE_KEY,
      testContractAddress,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.None,
          operator: Operator.CallWithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ],
      ExecutionOptions.None,
    );

    async function invoke() {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          (await testContract.doNothing.populateTransaction()).data as string,
          0,
        );
    }

    return {
      owner,
      invoker,
      roles,
      testContract,
      allowanceKey,
      setAllowance,
      invoke,
    };
  }

  describe("CallWithinAllowance - Check", () => {
    it("success - from existing balance", async () => {
      const { roles, allowanceKey, setAllowance, invoke } =
        await loadFixture(setup);

      await setAllowance({
        key: allowanceKey,
        balance: 1,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke())
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(allowanceKey, 1, 0);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
    it("success - multiple checks from existing balance", async () => {
      const { roles, allowanceKey, setAllowance, invoke } =
        await loadFixture(setup);

      await setAllowance({
        key: allowanceKey,
        balance: 2,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      expect((await roles.allowances(allowanceKey)).balance).to.equal(2);

      await expect(invoke()).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke()).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
    it("success - from balance 0 but enough refill pending", async () => {
      const { roles, allowanceKey, setAllowance, invoke } =
        await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 0,
        period: 1000,
        refill: 1,
        timestamp: timestamp - 1010,
      });

      await expect(invoke()).to.not.be.reverted;
      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
    it("fail - insufficient balance and not enough elapsed for next refill", async () => {
      const { roles, allowanceKey, setAllowance, invoke } =
        await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 0,
        period: 1000,
        refill: 1,
        timestamp: timestamp,
      });

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
  });

  describe("CallWithinAllowance - Variants", () => {
    it("enforces different call allowances per variant", async () => {
      const { owner, invoker, roles, testContract, setAllowance } =
        await loadFixture(setup);
      const testContractAddress = await testContract.getAddress();
      const SELECTOR =
        testContract.interface.getFunction("oneParamStatic").selector;
      const allowanceKey1 =
        "0x1000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x2000000000000000000000000000000000000000000000000000000000000002";
      const value1 = 100;
      const value2 = 200;
      const valueOther = 9999;

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);
      await setAllowance({
        key: allowanceKey1,
        balance: 0,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await setAllowance({
        key: allowanceKey2,
        balance: 1,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      async function invoke(p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testContractAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(p))
              .data as string,
            0,
          );
      }

      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value1]),
          },
          {
            parent: 1,
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value2]),
          },
          {
            parent: 2,
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.None,
      );

      await expect(invoke(valueOther))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      await expect(invoke(value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      await expect(invoke(value2)).not.to.be.reverted;
      await expect(invoke(value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);
    });
  });

  describe("CallWithinAllowance - Logical Combinations", () => {
    it("AND(CallWithinAllowance, SomeParamComparison)", async () => {
      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const [owner, invoker] = await hre.ethers.getSigners();
      const testAddress = await testContract.getAddress();
      const avatarAddress = await avatar.getAddress();

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );
      await roles.enableModule(invoker.address);
      await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testAddress);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValue = 42;

      await roles.connect(owner).setAllowance(allowanceKey, 3, 0, 0, 0, 0);

      const SELECTOR =
        testContract.interface.getFunction("oneParamStatic").selector;

      // Structure: And -> [Calldata -> Static, CallWithinAllowance] (CallWithinAllowance sibling of Calldata)
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(
                    ["uint256"],
                    [allowedValue],
                  ),
                },
              ],
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      async function invoke(p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(p))
              .data as string,
            0,
          );
      }

      // Wrong param value - should fail
      await expect(invoke(999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);

      // Correct param - should succeed (3 times)
      await expect(invoke(allowedValue)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(2);

      await expect(invoke(allowedValue)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke(allowedValue)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      // Now should fail due to exhausted allowance
      await expect(invoke(allowedValue))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });

    it("AND(CallWithinAllowance, OR(ParamA, ParamB))", async () => {
      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const [owner, invoker] = await hre.ethers.getSigners();
      const testAddress = await testContract.getAddress();
      const avatarAddress = await avatar.getAddress();

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );
      await roles.enableModule(invoker.address);
      await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testAddress);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValueA = 100;
      const allowedValueB = 200;

      await roles.connect(owner).setAllowance(allowanceKey, 4, 0, 0, 0, 0);

      const SELECTOR =
        testContract.interface.getFunction("oneParamStatic").selector;

      // Structure: And -> [Calldata -> Or, CallWithinAllowance] (CallWithinAllowance sibling of Calldata)
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(
                        ["uint256"],
                        [allowedValueA],
                      ),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(
                        ["uint256"],
                        [allowedValueB],
                      ),
                    },
                  ],
                },
              ],
            },
            {
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      async function invoke(p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testAddress,
            0,
            (await testContract.oneParamStatic.populateTransaction(p))
              .data as string,
            0,
          );
      }

      // Wrong param value (not A or B) - should fail
      await expect(invoke(999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      // Allowed value A - should succeed
      await expect(invoke(allowedValueA)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(3);

      // Allowed value B - should succeed
      await expect(invoke(allowedValueB)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(2);

      // Allowed value A again - should succeed
      await expect(invoke(allowedValueA)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      // Allowed value B again - should succeed
      await expect(invoke(allowedValueB)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      // Both values should now fail due to exhausted allowance
      await expect(invoke(allowedValueA))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
      await expect(invoke(allowedValueB))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
  });

  describe("CallWithinAllowance - Standalone Root", () => {
    it("works as standalone root condition with allowTarget", async () => {
      const { owner, invoker, roles, testContract } = await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000002";

      // Allowance of 2 calls
      await roles.connect(owner).setAllowance(allowanceKey, 2, 0, 0, 0, 0);

      await roles.connect(owner).allowTarget(
        ROLE_KEY,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.CallWithinAllowance,
          compValue: allowanceKey,
        }),
        ExecutionOptions.Both,
      );

      const doNothingData =
        testContract.interface.encodeFunctionData("doNothing");
      const doEvenLessData =
        testContract.interface.encodeFunctionData("doEvenLess");

      // First call passes (allowance: 2 -> 1)
      await expect(
        roles
          .connect(invoker)
          .execTransactionWithRole(
            testContractAddress,
            0,
            doNothingData,
            0,
            ROLE_KEY,
            true,
          ),
      ).to.not.be.reverted;

      // Second call passes (allowance: 1 -> 0)
      await expect(
        roles
          .connect(invoker)
          .execTransactionWithRole(
            testContractAddress,
            0,
            doEvenLessData,
            0,
            ROLE_KEY,
            true,
          ),
      ).to.not.be.reverted;

      // Third call fails (allowance exhausted)
      await expect(
        roles
          .connect(invoker)
          .execTransactionWithRole(
            testContractAddress,
            0,
            doNothingData,
            0,
            ROLE_KEY,
            true,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.CallAllowanceExceeded, allowanceKey);
    });
  });
});
