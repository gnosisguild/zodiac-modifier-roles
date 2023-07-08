import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import {
  setupOneParamAddress,
  setupOneParamUintSmall,
  setupOneParamUintWord,
} from "./setup";

describe("Operator - LessThan", async () => {
  it("evaluates operator LessThan - uint full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamUintWord
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
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [1000]),
      },
    ]);

    await expect(invoke(1000))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );
    await expect(invoke(1001))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );
    await expect(invoke(999)).to.not.be.reverted;
  });
  it("evaluates operator LessThan - uint smaller than word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamUintSmall
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
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint8"], [50]),
      },
    ]);

    await expect(invoke(255))
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
    await expect(invoke(51))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );
    await expect(invoke(49)).to.not.be.reverted;
    await expect(invoke(0)).to.not.be.reverted;
  });
  it("evaluates operator LessThan - address", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamAddress
    );

    const address = "0x000000000000000000000000000000000000000f";

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
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["address"], [address]),
      },
    ]);

    await expect(invoke(address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );
    await expect(invoke("0x000000000000000000000000000000000000001f"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );
    await expect(invoke("0x800000000000000000000000000000000000000e"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke("0x000000000000000000000000000000000000000e")).to.not.be
      .reverted;
    await expect(invoke("0x0000000000000000000000000000000000000000")).to.not.be
      .reverted;
  });
});
