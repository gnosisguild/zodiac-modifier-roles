import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  AbiCoder,
  BigNumberish,
  hexlify,
  Interface,
  randomBytes,
  ZeroHash,
} from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";
import { setupTestContract } from "../setup";

describe("Operator - CallWithinAllowance", async () => {
  async function setup() {
    const iface = new Interface(["function doNothing()"]);
    const fn = iface.getFunction("doNothing")!;

    const { roles, member, testContractAddress, roleKey } =
      await setupTestContract();

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
      await roles.setAllowance(
        key,
        balance,
        maxRefill || 0,
        refill,
        period,
        timestamp,
      );
    }

    const allowanceKey = hexlify(randomBytes(32));

    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    async function invoke() {
      return roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, []),
          0,
        );
    }

    return {
      member,
      roles,
      testContractAddress,
      roleKey,
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
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
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
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
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
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
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
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
    });
  });

  describe("CallWithinAllowance - Variants", () => {
    it("enforces different call allowances per variant", async () => {
      const { member, roles, testContractAddress, roleKey, setAllowance } =
        await loadFixture(setup);

      const iface = new Interface(["function oneParamStatic(uint256)"]);
      const fn = iface.getFunction("oneParamStatic")!;

      const allowanceKey1 =
        "0x1000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x2000000000000000000000000000000000000000000000000000000000000002";
      const value1 = 100;
      const value2 = 200;
      const valueOther = 9999;

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
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [p]),
            0,
          );
      }

      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
                  compValue: defaultAbiCoder.encode(["uint256"], [value1]),
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: defaultAbiCoder.encode(
                    ["bytes32"],
                    [allowanceKey1],
                  ),
                },
              ],
            },
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [value2]),
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: defaultAbiCoder.encode(
                    ["bytes32"],
                    [allowanceKey2],
                  ),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      await expect(invoke(valueOther))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);

      await expect(invoke(value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);

      await expect(invoke(value2)).not.to.be.reverted;
      await expect(invoke(value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);
    });
  });

  describe("CallWithinAllowance - Logical Combinations", () => {
    it("AND(CallWithinAllowance, SomeParamComparison)", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await setupTestContract();

      const iface = new Interface(["function oneParamStatic(uint256)"]);
      const fn = iface.getFunction("oneParamStatic")!;

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValue = 42;

      await roles.setAllowance(allowanceKey, 3, 0, 0, 0, 0);

      // Structure: And -> [Calldata -> Static, CallWithinAllowance] (CallWithinAllowance sibling of Calldata)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [p]),
            0,
          );
      }

      // Wrong param value - should fail
      await expect(invoke(999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

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
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
    });

    it("AND(CallWithinAllowance, OR(ParamA, ParamB))", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await setupTestContract();

      const iface = new Interface(["function oneParamStatic(uint256)"]);
      const fn = iface.getFunction("oneParamStatic")!;

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValueA = 100;
      const allowedValueB = 200;

      await roles.setAllowance(allowanceKey, 4, 0, 0, 0, 0);

      // Structure: And -> [Calldata -> Or, CallWithinAllowance] (CallWithinAllowance sibling of Calldata)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
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
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [p]),
            0,
          );
      }

      // Wrong param value (not A or B) - should fail
      await expect(invoke(999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);

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
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
      await expect(invoke(allowedValueB))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
    });
  });

  describe("CallWithinAllowance - Standalone Root", () => {
    it("works as standalone root condition with allowTarget", async () => {
      const { member, roles, testContractAddress, roleKey } =
        await loadFixture(setup);

      const iface = new Interface([
        "function doNothing()",
        "function doEvenLess()",
      ]);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000002";

      // Allowance of 2 calls
      await roles.setAllowance(allowanceKey, 2, 0, 0, 0, 0);

      await roles.allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.CallWithinAllowance,
          compValue: allowanceKey,
        }),
        ExecutionOptions.Both,
      );

      const doNothingData = iface.encodeFunctionData("doNothing", []);
      const doEvenLessData = iface.encodeFunctionData("doEvenLess", []);

      // First call passes (allowance: 2 -> 1)
      await expect(
        roles
          .connect(member)
          .execTransactionWithRole(
            testContractAddress,
            0,
            doNothingData,
            0,
            roleKey,
            true,
          ),
      ).to.not.be.reverted;

      // Second call passes (allowance: 1 -> 0)
      await expect(
        roles
          .connect(member)
          .execTransactionWithRole(
            testContractAddress,
            0,
            doEvenLessData,
            0,
            roleKey,
            true,
          ),
      ).to.not.be.reverted;

      // Third call fails (allowance exhausted)
      await expect(
        roles
          .connect(member)
          .execTransactionWithRole(
            testContractAddress,
            0,
            doNothingData,
            0,
            roleKey,
            true,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
    });
  });
});
