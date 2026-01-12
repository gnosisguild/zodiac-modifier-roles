import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, solidityPacked, ZeroHash, Interface } from "ethers";

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

describe("Operator - SignedIntGreaterThan", () => {
  it("passes when signed value > compValue", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamSigned);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.SignedIntGreaterThan,
            compValue: defaultAbiCoder.encode(["int256"], [100]),
          },
        ],
      }),
    );

    // 101 > 100 passes
    await expect(invoke(101)).to.not.be.reverted;
  });

  it("fails when signed value <= compValue", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamSigned);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.SignedIntGreaterThan,
            compValue: defaultAbiCoder.encode(["int256"], [100]),
          },
        ],
      }),
    );

    // 100 == 100 fails
    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        1,
        anyValue,
        anyValue,
      );

    // 99 < 100 fails
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        1,
        anyValue,
        anyValue,
      );
  });

  it("handles negative numbers correctly", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamSigned);

    // compValue = -50, so value must be > -50
    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.SignedIntGreaterThan,
            compValue: defaultAbiCoder.encode(["int256"], [-50]),
          },
        ],
      }),
    );

    // -49 > -50 passes
    await expect(invoke(-49)).to.not.be.reverted;

    // 0 > -50 passes
    await expect(invoke(0)).to.not.be.reverted;

    // -50 == -50 fails
    await expect(invoke(-50))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        1,
        anyValue,
        anyValue,
      );

    // -51 < -50 fails
    await expect(invoke(-51))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        1,
        anyValue,
        anyValue,
      );
  });

  it("integrates with Slice operator", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupDynamicParam);

    // 1. Slice 4 bytes at offset 0, then SignedIntGreaterThan 0
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
                operator: Operator.SignedIntGreaterThan,
                compValue: defaultAbiCoder.encode(["int256"], [0]),
              },
            ],
          },
        ],
      }),
    );

    // 0x00000001 = 1 > 0 passes
    await expect(invoke("0x00000001")).to.not.be.reverted;

    // 0x00000000 = 0 <= 0 fails
    await expect(invoke("0x00000000"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        2,
        anyValue,
        anyValue,
      );

    // 2. Slice 32 bytes (full int256) at offset 0, then SignedIntGreaterThan -100
    // We must use 32 bytes to preserve the sign bit for int256 comparison
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
                operator: Operator.SignedIntGreaterThan,
                compValue: defaultAbiCoder.encode(["int256"], [-100]),
              },
            ],
          },
        ],
      }),
    );

    // -50 (32 bytes) > -100 -> Pass
    const neg50 = solidityPacked(["int256"], [-50]);
    await expect(invoke(neg50)).to.not.be.reverted;

    // -100 (32 bytes) > -100 -> Fail (Equal)
    const neg100 = solidityPacked(["int256"], [-100]);
    await expect(invoke(neg100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        2,
        anyValue,
        anyValue,
      );

    // -101 (32 bytes) > -100 -> Fail (Less)
    const neg101 = solidityPacked(["int256"], [-101]);
    await expect(invoke(neg101))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
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

    // SignedIntGreaterThan on EtherValue: msg.value must be > 1000 wei
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.EtherValue,
        operator: Operator.SignedIntGreaterThan,
        compValue: defaultAbiCoder.encode(["int256"], [1000]),
      }),
      ExecutionOptions.Send,
    );

    // 1001 > 1000 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          1001,
          iface.encodeFunctionData(fn),
          0,
        ),
    ).to.not.be.reverted;

    // 1000 <= 1000 fails
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
        ConditionViolationStatus.ParameterLessThanAllowed,
        0,
        anyValue,
        anyValue,
      );
  });
});
