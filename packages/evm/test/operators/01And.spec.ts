import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";

import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import { setupAvatarAndRoles } from "./setup";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - And", async () => {
  it("evaluates operator And with a single child", async () => {
    const { roles, testContract, scopeFunction, execTransactionFromModule } =
      await await loadFixture(setupAvatarAndRoles);

    const conditions = [
      {
        parent: 0,
        paramType: ParameterType.Calldata,
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
    ];
    const { selector } = testContract.interface.getFunction("oneParamStatic");

    await scopeFunction(selector, conditions);

    const invoke = async (a: number) => {
      const { data } = await testContract.oneParamStatic.populateTransaction(2);
      return execTransactionFromModule(data);
    };

    await expect(invoke(2))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator And with multiple children", async () => {
    const { roles, testContract, scopeFunction, execTransactionFromModule } =
      await loadFixture(setupAvatarAndRoles);

    const { selector } = testContract.interface.getFunction("oneParamStatic");
    const conditions = [
      {
        parent: 0,
        paramType: ParameterType.Calldata,
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
    ];
    await scopeFunction(selector, conditions);

    const invoke = async (value: number) =>
      execTransactionFromModule(
        (await testContract.oneParamStatic.populateTransaction(value)).data
      );

    await expect(invoke(1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
    await expect(invoke(15))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(30))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(20)).to.not.be.reverted;
  });
  it.skip("Tracks the resulting consumption");
});
