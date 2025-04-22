import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  AbiType,
  BYTES32_ZERO,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamStatic } from "../setup";

describe("Operator - Nor", async () => {
  it("evaluates operator Nor with single child", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.Nor,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NorViolation, BYTES32_ZERO);

    await expect(invoke(1000)).to.not.be.reverted;
  });

  it("evaluates operator Nor with multiple children", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.Nor,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [6]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [77]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [888]),
      },
    ]);

    await expect(invoke(6))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NorViolation, BYTES32_ZERO);

    await expect(invoke(77))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NorViolation, BYTES32_ZERO);

    await expect(invoke(888))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NorViolation, BYTES32_ZERO);

    await expect(invoke(1000)).to.not.be.reverted;
  });
});
