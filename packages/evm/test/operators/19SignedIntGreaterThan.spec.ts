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

describe("Operator - SignedIntGreaterThan", async () => {
  it("evaluates operator SignedIntGreaterThan - positive full word", async () => {
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
        operator: Operator.SignedIntGreaterThan,
        compValue: defaultAbiCoder.encode(["int256"], [1000]),
      },
    ]);

    await expect(invoke(1000))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
    await expect(invoke(999))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
    await expect(invoke(1001)).to.not.be.reverted;
  });

  it("evaluates operator SignedIntGreaterThan - negative full word", async () => {
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
        operator: Operator.SignedIntGreaterThan,
        compValue: defaultAbiCoder.encode(["int256"], [-1000]),
      },
    ]);

    await expect(invoke(-1000))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
    await expect(invoke(-1001))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
    await expect(invoke(-999)).to.not.be.reverted;
    await expect(invoke(0)).to.not.be.reverted;
    await expect(invoke(1)).to.not.be.reverted;
  });

  it("evaluates operator SignedIntGreaterThan - positive smaller than word", async () => {
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
        operator: Operator.SignedIntGreaterThan,
        compValue: defaultAbiCoder.encode(["int8"], [50]),
      },
    ]);

    await expect(invoke(50))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
    await expect(invoke(49))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(51)).to.not.be.reverted;
  });

  it("evaluates operator SignedIntGreaterThan - negative smaller than word", async () => {
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
        operator: Operator.SignedIntGreaterThan,
        compValue: defaultAbiCoder.encode(["int8"], [-99]),
      },
    ]);

    await expect(invoke(-127))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(-100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(-99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(-98)).to.not.be.reverted;
    await expect(invoke(0)).to.not.be.reverted;
    await expect(invoke(1)).to.not.be.reverted;
  });
});
