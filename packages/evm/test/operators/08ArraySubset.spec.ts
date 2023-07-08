import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import { setupOneParamArrayOfStatic } from "./setup";
import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";

describe("Operator - ArraySubset", async () => {
  it("can't set up an ArraySubset with inconsistent typeTree across children", async () => {
    const { scopeFunction } = await loadFixture(setupOneParamArrayOfStatic);

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.ArraySubset,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bool"], [true]),
        },
      ])
    ).to.be.reverted;
  });

  it("evaluates operator ArraySubset", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamArrayOfStatic
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
        paramType: ParameterType.Array,
        operator: Operator.ArraySubset,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [123]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [4567]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [999999]),
      },
    ]);

    await expect(invoke([123, 1, 4567]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterNotSubsetOfAllowed,
        BYTES32_ZERO
      );

    await expect(invoke([123, 4567])).to.not.be.reverted;
  });

  it("evaluates operator ArraySubset - order does not matter", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamArrayOfStatic
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
        paramType: ParameterType.Array,
        operator: Operator.ArraySubset,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [2]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [3]),
      },
    ]);

    await expect(invoke([1, 2, 3])).to.not.be.reverted;

    await expect(invoke([3, 2, 1])).to.not.be.reverted;

    await expect(invoke([2, 1])).to.not.be.reverted;

    await expect(invoke([3, 2, 1, 4]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterNotSubsetOfAllowed,
        BYTES32_ZERO
      );
  });

  it("evaluates operator ArraySubset - empty array is not subset", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStatic
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
        paramType: ParameterType.Array,
        operator: Operator.ArraySubset,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [2]),
      },
    ]);

    await expect(invoke([]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterNotSubsetOfAllowed,
        BYTES32_ZERO
      );
  });

  it("evaluates operator ArraySubset - does not allow repetition", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamArrayOfStatic
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
        paramType: ParameterType.Array,
        operator: Operator.ArraySubset,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [2]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [3]),
      },
    ]);

    await expect(invoke([1, 2, 3])).to.not.be.reverted;

    await expect(invoke([3, 2, 1])).to.not.be.reverted;

    await expect(invoke([2, 1])).to.not.be.reverted;

    await expect(invoke([3, 3]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterNotSubsetOfAllowed,
        BYTES32_ZERO
      );

    await expect(invoke([3, 2, 1, 3]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterNotSubsetOfAllowed,
        BYTES32_ZERO
      );
  });
});
