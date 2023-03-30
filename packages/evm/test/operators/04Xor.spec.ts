import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ParameterType, PermissionCheckerStatus } from "../utils";
import { setupOneParamStatic } from "./setup";

describe("Operator - Xor", async () => {
  it("cannot set up an empty Xor", async () => {
    const { scopeFunction } = await loadFixture(setupOneParamStatic);

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Xor,
          compValue: "0x",
        },
      ])
    ).to.be.reverted;
  });

  it("evaluates a Xor with a single child", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.None,
        operator: Operator.Xor,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.XorViolation);

    await expect(invoke(100)).to.not.be.reverted;
  });

  it("evaluates a Xor with multiple children", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.None,
        operator: Operator.Xor,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [6]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [77]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [888]),
      },
    ]);

    await expect(invoke(6))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.XorViolation);

    await expect(invoke(7)).to.not.be.reverted;

    await expect(invoke(88))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.XorViolation);

    await expect(invoke(999))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.XorViolation);
  });

  it.skip("Tracks the resulting trace");
});
