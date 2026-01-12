import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, solidityPacked, ZeroHash } from "ethers";

import {
  setupTestContract,
  setupDynamicParam,
  setupOneParamSigned,
} from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - SignedIntLessThan", () => {
  it("passes when signed value < compValue", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamSigned);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.SignedIntLessThan,
            compValue: defaultAbiCoder.encode(["int256"], [100]),
          },
        ],
      }),
    );

    // 99 < 100 passes
    await expect(invoke(99)).to.not.be.reverted;
  });

  it("fails when signed value >= compValue", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamSigned);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.SignedIntLessThan,
            compValue: defaultAbiCoder.encode(["int256"], [100]),
          },
        ],
      }),
    );

    // 100 == 100 fails
    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        1,
        anyValue,
        anyValue,
      );

    // 101 > 100 fails
    await expect(invoke(101))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        1,
        anyValue,
        anyValue,
      );
  });

  it("handles negative numbers correctly", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamSigned);

    // compValue = -50, so value must be < -50
    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.SignedIntLessThan,
            compValue: defaultAbiCoder.encode(["int256"], [-50]),
          },
        ],
      }),
    );

    // -51 < -50 passes
    await expect(invoke(-51)).to.not.be.reverted;

    // -100 < -50 passes
    await expect(invoke(-100)).to.not.be.reverted;

    // -50 == -50 fails
    await expect(invoke(-50))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        1,
        anyValue,
        anyValue,
      );

    // -49 > -50 fails
    await expect(invoke(-49))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        1,
        anyValue,
        anyValue,
      );

    // 0 > -50 fails
    await expect(invoke(0))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        1,
        anyValue,
        anyValue,
      );
  });

  it("integrates with Slice operator", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupDynamicParam);

    // 1. Slice 4 bytes at offset 0, then SignedIntLessThan 100
    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Slice,
            compValue: solidityPacked(["uint16", "uint8"], [0, 4]), // shift=0, size=4
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.SignedIntLessThan,
                compValue: defaultAbiCoder.encode(["int256"], [100]),
              },
            ],
          },
        ],
      }),
    );

    // 0x00000063 = 99 < 100 passes
    await expect(invoke("0x00000063")).to.not.be.reverted;

    // 0x00000064 = 100 >= 100 fails
    await expect(invoke("0x00000064"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        2,
        anyValue,
        anyValue,
      );

    // 2. Slice 32 bytes (full int256) at offset 0, then SignedIntLessThan -100
    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Slice,
            compValue: solidityPacked(["uint16", "uint8"], [0, 32]), // shift=0, size=32
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.SignedIntLessThan,
                compValue: defaultAbiCoder.encode(["int256"], [-100]),
              },
            ],
          },
        ],
      }),
    );

    // -150 (32 bytes) < -100 -> Pass
    const neg150 = solidityPacked(["int256"], [-150]);
    await expect(invoke(neg150)).to.not.be.reverted;

    // -100 (32 bytes) < -100 -> Fail (Equal)
    const neg100 = solidityPacked(["int256"], [-100]);
    await expect(invoke(neg100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        2,
        anyValue,
        anyValue,
      );

    // -99 (32 bytes) < -100 -> Fail (Greater)
    const neg99 = solidityPacked(["int256"], [-99]);
    await expect(invoke(neg99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        2,
        anyValue,
        anyValue,
      );
  });

  it("compares ether value (msg.value)", async () => {
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);
    const iface = new Interface(["function fn()"]);
    const fn = iface.getFunction("fn")!;

    // SignedIntLessThan on EtherValue: msg.value must be < 1000 wei
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.EtherValue,
        operator: Operator.SignedIntLessThan,
        compValue: defaultAbiCoder.encode(["int256"], [1000]),
      }),
      ExecutionOptions.Send,
    );

    // 999 < 1000 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          999,
          iface.encodeFunctionData(fn),
          0,
        ),
    ).to.not.be.reverted;

    // 1000 >= 1000 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          1000,
          iface.encodeFunctionData(fn),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterGreaterThanAllowed,
        0n,
        anyValue,
        anyValue,
      );
  });
});
