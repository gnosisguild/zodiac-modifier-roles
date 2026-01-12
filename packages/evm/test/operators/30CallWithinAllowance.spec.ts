import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
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
import { setupTestContract, setupOneParam } from "../setup";
import { Roles } from "../../typechain-types";

describe("Operator - CallWithinAllowance", async () => {
  async function setAllowance(
    roles: Roles,
    key: string,
    balance: BigNumberish,
    maxRefill: BigNumberish = 0,
    refill: BigNumberish = 0,
    period: BigNumberish = 0,
    timestamp: BigNumberish = 0,
  ) {
    await roles.setAllowance(
      key,
      balance,
      maxRefill,
      refill,
      period,
      timestamp,
    );
  }

  describe("CallWithinAllowance - Check", () => {
    async function setup() {
      const { roles, member, testContractAddress, roleKey } =
        await setupTestContract();
      const iface = new Interface(["function doNothing()"]);
      const fn = iface.getFunction("doNothing")!;

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
        roles,
        member,
        allowanceKey,
        invoke,
      };
    }

    it("success - from existing balance", async () => {
      const { roles, allowanceKey, invoke } = await loadFixture(setup);

      await setAllowance(roles, allowanceKey, 1);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke())
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(allowanceKey, 1, 0);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          1, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
    });

    it("success - multiple checks from existing balance", async () => {
      const { roles, allowanceKey, invoke } = await loadFixture(setup);

      await setAllowance(roles, allowanceKey, 2);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(2);

      await expect(invoke()).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke()).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          1, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
    });

    it("success - from balance 0 but enough refill pending", async () => {
      const { roles, allowanceKey, invoke } = await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance(roles, allowanceKey, 0, 0, 1, 1000, timestamp - 1010);

      await expect(invoke()).to.not.be.reverted;
      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          1, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
    });

    it("fail - insufficient balance and not enough elapsed for next refill", async () => {
      const { roles, allowanceKey, invoke } = await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance(roles, allowanceKey, 0, 0, 1, 1000, timestamp);

      await expect(invoke())
        .to.be.revertedWithCustomError(roles, `ConditionViolation`)
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          1, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
    });
  });

  describe("CallWithinAllowance - Variants", () => {
    it("enforces different call allowances per variant", async () => {
      const { roles, invoke, allowFunction } = await loadFixture(setupOneParam);

      const allowanceKey1 =
        "0x1000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x2000000000000000000000000000000000000000000000000000000000000002";
      const value1 = 100;
      const value2 = 200;
      const valueOther = 9999;

      await setAllowance(roles, allowanceKey1, 0);
      await setAllowance(roles, allowanceKey2, 1);

      await allowFunction(
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
      );

      await expect(invoke(valueOther))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.OrViolation,
          0, // Or node
          anyValue,
          anyValue,
        );

      await expect(invoke(value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.OrViolation,
          0, // Or node
          anyValue,
          anyValue,
        );

      await expect(invoke(value2)).not.to.be.reverted;
      await expect(invoke(value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.OrViolation,
          0, // Or node
          anyValue,
          anyValue,
        );
    });
  });

  describe("CallWithinAllowance - Logical Combinations", () => {
    it("AND(CallWithinAllowance, SomeParamComparison)", async () => {
      const { roles, invoke, allowFunction } = await loadFixture(setupOneParam);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValue = 42;

      await setAllowance(roles, allowanceKey, 3);

      await allowFunction(
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
      );

      // Wrong param value - should fail
      await expect(invoke(999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          3, // EqualTo node
          anyValue,
          anyValue,
        );

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
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          2, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
    });

    it("AND(CallWithinAllowance, OR(ParamA, ParamB))", async () => {
      const { roles, invoke, allowFunction } = await loadFixture(setupOneParam);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValueA = 100;
      const allowedValueB = 200;

      await setAllowance(roles, allowanceKey, 4);

      await allowFunction(
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
      );

      // Wrong param value (not A or B) - should fail
      await expect(invoke(999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.OrViolation,
          3, // Or node
          anyValue,
          anyValue,
        );

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
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          2, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
      await expect(invoke(allowedValueB))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          2, // CallWithinAllowance node
          anyValue,
          anyValue,
        );
    });
  });

  describe("CallWithinAllowance - Standalone Root", () => {
    it("works as standalone root condition with allowTarget", async () => {
      const { member, roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const iface = new Interface([
        "function doNothing()",
        "function doEvenLess()",
      ]);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000002";

      // Allowance of 2 calls
      await setAllowance(roles, allowanceKey, 2);

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
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          0, // CallWithinAllowance as root node
          anyValue,
          anyValue,
        );
    });
  });
});
