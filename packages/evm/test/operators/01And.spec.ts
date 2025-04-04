import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";

import {
  AbiType,
  BYTES32_ZERO,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
<<<<<<< HEAD
import { setupOneParamStatic } from "../setup";
=======
import { setupAvatarAndRoles } from "./setup";
>>>>>>> 6bfb5d0c (Initial port of the new AbiDecoder with flat TypeTree)

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - And", async () => {
  it("evaluates operator And with a single child", async () => {
<<<<<<< HEAD
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamStatic
    );
=======
    const { roles, testContract, scopeFunction, execTransactionFromModule } =
      await await loadFixture(setupAvatarAndRoles);
>>>>>>> 6bfb5d0c (Initial port of the new AbiDecoder with flat TypeTree)

    const conditions = [
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
    ];
<<<<<<< HEAD

    await scopeFunction(conditions);
=======
    const { selector } = testContract.interface.getFunction("oneParamStatic");

    await scopeFunction(selector, conditions);

    const invoke = async (a: number) => {
      const { data } = await testContract.oneParamStatic.populateTransaction(2);
      return execTransactionFromModule(data);
    };
>>>>>>> 6bfb5d0c (Initial port of the new AbiDecoder with flat TypeTree)

    await expect(invoke(2))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator And with multiple children", async () => {
    const { roles, testContract, scopeFunction, execTransactionFromModule } =
      await loadFixture(setupAvatarAndRoles);

<<<<<<< HEAD
=======
    const { selector } = testContract.interface.getFunction("oneParamStatic");
>>>>>>> 6bfb5d0c (Initial port of the new AbiDecoder with flat TypeTree)
    const conditions = [
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [15]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [30]),
      },
    ];
<<<<<<< HEAD
    await scopeFunction(conditions);
=======
    await scopeFunction(selector, conditions);

    const invoke = async (value: number) =>
      execTransactionFromModule(
        (await testContract.oneParamStatic.populateTransaction(value)).data
      );
>>>>>>> 6bfb5d0c (Initial port of the new AbiDecoder with flat TypeTree)

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
