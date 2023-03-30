import { expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Operator, ParameterType, PermissionCheckerStatus } from "../utils";
import { setupOneParamStatic } from "./setup";

describe("Operator - And", async () => {
  it("cannot set up an empty And", async () => {
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
          operator: Operator.And,
          compValue: "0x",
        },
      ])
    ).to.be.reverted;
  });

  it("evaluates an And with a single child", async () => {
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
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
    ]);

    await expect(invoke(1)).to.not.be.reverted;

    await expect(invoke(2))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed);
  });

  it("evaluates an And with multiple children", async () => {
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
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [15]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [30]),
      },
    ]);

    await expect(invoke(1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed);
    await expect(invoke(15))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed);

    await expect(invoke(30))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterGreaterThanAllowed);

    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterGreaterThanAllowed);

    await expect(invoke(20)).to.not.be.reverted;
  });

  it.skip("Tracks the resulting trace");
});
