import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamIntSmall, setupOneParamIntWord } from "./setup";

describe("Operator - SignedIntLessThan", async () => {
  it("evaluates operator SignedIntLessThan - positive full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamIntWord
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.SignedIntLessThan,
        compValue: defaultAbiCoder.encode(["int256"], [1000]),
      },
    ]);

    await expect(invoke(1001))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(1000))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(999)).to.not.be.reverted;

    await expect(invoke(0)).to.not.be.reverted;

    await expect(invoke(-1)).to.not.be.reverted;
  });

  it("evaluates operator SignedIntLessThan - negative full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamIntWord
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.SignedIntLessThan,
        compValue: defaultAbiCoder.encode(["int256"], [-1000]),
      },
    ]);

    await expect(invoke(1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(0))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(-1000))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(-1001)).to.not.be.reverted;
  });

  it("evaluates operator SignedIntLessThan - positive smaller than word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamIntSmall
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.SignedIntLessThan,
        compValue: defaultAbiCoder.encode(["int8"], [50]),
      },
    ]);

    await expect(invoke(51))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(50))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(49)).to.not.be.reverted;

    await expect(invoke(0)).to.not.be.reverted;

    await expect(invoke(-1)).to.not.be.reverted;
  });

  it("evaluates operator SignedIntLessThan - negative smaller than word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamIntSmall
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.SignedIntLessThan,
        compValue: defaultAbiCoder.encode(["int8"], [-99]),
      },
    ]);

    await expect(invoke(1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(0))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(-99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(-100)).to.not.be.reverted;

    await expect(invoke(-120)).to.not.be.reverted;
  });
});
